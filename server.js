const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {};

const gameQuestions = [
  {
    question: "Ποιος αριθμός κρύβεται στο ερωτηματικό;",
    imageUrl: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=600",
    options: { A: "5", B: "7", C: "9", D: "12" },
    correct: "B"
  },
  {
    question: "Πόσα τετράγωνα βλέπεις συνολικά;",
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600",
    options: { A: "10", B: "14", C: "16", D: "20" },
    correct: "C"
  }
];

io.on('connection', (socket) => {
  socket.on('create-room', () => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[roomId] = { 
      hostSocket: socket.id, 
      players: {}, 
      currentQuestionIndex: -1,
      timer: null,
      answersState: {} 
    };
    socket.join(roomId);
    socket.emit('room-created', roomId);
  });

  socket.on('join-room', ({ roomId, playerName }) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      const playerIds = Object.keys(rooms[roomId].players);
      const isHost = playerIds.length === 0; // Ο πρώτος παίκτης γίνεται host/διαχειριστής

      rooms[roomId].players[socket.id] = { 
        name: playerName, 
        score: 0, 
        isHost: isHost 
      };
      
      io.to(roomId).emit('update-players', {
        playersList: Object.values(rooms[roomId].players)
      });

      socket.emit('joined-successfully', { roomId, playerName, isHost });
    } else {
      socket.emit('error-message', 'Το δωμάτιο δεν βρέθηκε!');
    }
  });

  socket.on('next-question', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.currentQuestionIndex++;
    if (room.currentQuestionIndex < gameQuestions.length) {
      const q = gameQuestions[room.currentQuestionIndex];
      room.answersState = {}; // Reset απαντήσεων γύρου

      // Ενημέρωση TV και κινητών για νέα ερώτηση
      io.to(roomId).emit('show-question', {
        questionNum: room.currentQuestionIndex + 1,
        total: gameQuestions.length,
        question: q.question,
        imageUrl: q.imageUrl,
        options: q.options
      });

      // Χρονόμετρο 30 δευτερολέπτων
      let timeLeft = 30;
      clearInterval(room.timer);
      room.timer = setInterval(() => {
        timeLeft--;
        io.to(roomId).emit('timer-update', timeLeft);

        if (timeLeft <= 0) {
          clearInterval(room.timer);
          // Λήξη χρόνου: Αποκάλυψη σωστής απάντησης
          io.to(roomId).emit('reveal-answer', {
            correct: q.correct,
            playersList: Object.values(room.players),
            answersState: room.answersState
          });
        }
      }, 1000);

    } else {
      io.to(roomId).emit('game-over', {
        playersList: Object.values(room.players)
      });
    }
  });

  socket.on('submit-answer', ({ roomId, answer }) => {
    const room = rooms[roomId];
    if (!room) return;

    const qIndex = room.currentQuestionIndex;
    const currentQ = gameQuestions[qIndex];
    const player = room.players[socket.id];

    if (player && !room.answersState[socket.id]) {
      const isCorrect = (answer === currentQ.correct);
      if (isCorrect) player.score += 100;

      room.answersState[socket.id] = {
        name: player.name,
        initial: player.name.charAt(0).toUpperCase(),
        answer: answer,
        isCorrect: isCorrect
      };

      // Ενημέρωση TV για το ποιος απάντησε (χωρίς να αποκαλύψουμε αν είναι σωστός ακόμα)
      io.to(room.hostSocket || roomId).emit('live-answers-update', {
        answersState: room.answersState
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});