const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));
const rooms = {};

// Ερωτήσεις τύπου 1% Club με εικόνες!
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
    rooms[roomId] = { hostSocket: socket.id, players: {}, currentQuestionIndex: -1 };
    socket.join(roomId);
    socket.emit('room-created', roomId);
  });

  socket.on('join-room', ({ roomId, playerName }) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].players[socket.id] = { name: playerName, score: 0 };
      
      io.to(rooms[roomId].hostSocket).emit('player-joined', {
        playersList: Object.values(rooms[roomId].players)
      });

      socket.emit('joined-successfully', { roomId, playerName });
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
      
      // Στέλνουμε την ερώτηση και την εικόνα στην TV
      io.to(room.hostSocket).emit('show-question', {
        questionNum: room.currentQuestionIndex + 1,
        total: gameQuestions.length,
        question: q.question,
        imageUrl: q.imageUrl,
        options: q.options,
        correct: q.correct
      });

      // Στέλνουμε μόνο την ερώτηση στα κινητά (χωρίς απαντήσεις/εικόνες)
      io.to(roomId).emit('player-question', {
        question: q.question
      });
    } else {
      io.to(roomId).emit('game-over');
    }
  });

  socket.on('submit-answer', ({ roomId, answer }) => {
    const room = rooms[roomId];
    if (!room) return;

    const qIndex = room.currentQuestionIndex;
    const currentQ = gameQuestions[qIndex];
    const player = room.players[socket.id];

    if (player) {
      const isCorrect = (answer === currentQ.correct);
      if (isCorrect) player.score += 100;

      io.to(room.hostSocket).emit('player-answered', {
        playerName: player.name,
        answer: answer,
        isCorrect: isCorrect,
        playersList: Object.values(room.players)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});