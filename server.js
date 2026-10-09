const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {};

// Εδώ μπορείς να προσθέσεις όσες ερωτήσεις θες!
const allGameQuestions = [
  {
    question: "Ερώτηση 1: Ποιος αριθμός κρύβεται στο ερωτηματικό;",
    imageUrl: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=600",
    options: { A: "5", B: "7", C: "9", D: "12" },
    correct: "B"
  },
  {
    question: "Ερώτηση 2: Πόσα τετράγωνα βλέπεις συνολικά;",
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600",
    options: { A: "10", B: "14", C: "16", D: "20" },
    correct: "C"
  },
  {
    question: "Ερώτηση 3: Ποιο σχήμα έχει τα περισσότερα πλευρά;",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
    options: { A: "Τετράγωνο", B: "Πεντάγωνο", C: "Εξάγωνο", D: "Οκτάγωνο" },
    correct: "D"
  },
  {
    question: "Ερώτηση 4: Αν το χθες ήταν δύο μέρες μετά τη Δευτέρα, τι μέρα είναι σήμερα;",
    imageUrl: "",
    options: { A: "Τετάρτη", B: "Πέμπτη", C: "Παρασκευή", D: "Σάββατο" },
    correct: "D"
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
      autoAdvanceTimer: null,
      answersState: {},
      selectedQuestions: [],
      usedQuestionIndices: []
    };
    socket.join(roomId);
    socket.emit('room-created', roomId);
  });

  socket.on('join-room', ({ roomId, playerName }) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      const playerIds = Object.keys(rooms[roomId].players);
      const isHost = playerIds.length === 0;

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

  socket.on('start-game', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    for (let id in room.players) {
      room.players[id].score = 0;
    }

    const availableIndices = [];
    for (let i = 0; i < allGameQuestions.length; i++) {
      if (!room.usedQuestionIndices.includes(i)) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length < 5) {
      room.usedQuestionIndices = [];
      for (let i = 0; i < allGameQuestions.length; i++) {
        availableIndices.push(i);
      }
    }

    availableIndices.sort(() => 0.5 - Math.random());
    const countToPick = Math.min(15, availableIndices.length);
    const chosenIndices = availableIndices.slice(0, countToPick);
    room.usedQuestionIndices.push(...chosenIndices);

    room.selectedQuestions = chosenIndices.map(index => allGameQuestions[index]);
    room.currentQuestionIndex = -1;

    loadNextQuestion(roomId);
  });

  socket.on('next-question', (roomId) => {
    loadNextQuestion(roomId);
  });

  function loadNextQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    // Καθαρίζουμε τυχόν ενεργά χρονόμετρα προηγούμενου γύρου
    clearInterval(room.timer);
    clearTimeout(room.autoAdvanceTimer);

    room.currentQuestionIndex++;
    if (room.currentQuestionIndex < room.selectedQuestions.length) {
      const q = room.selectedQuestions[room.currentQuestionIndex];
      room.answersState = {};

      io.to(roomId).emit('show-question', {
        questionNum: room.currentQuestionIndex + 1,
        total: room.selectedQuestions.length,
        question: q.question,
        imageUrl: q.imageUrl,
        options: q.options
      });

      let timeLeft = 30;
      room.timer = setInterval(() => {
        timeLeft--;
        io.to(roomId).emit('timer-update', timeLeft);

        const totalPlayers = Object.keys(room.players).length;
        const answeredCount = Object.keys(room.answersState).length;

        if (timeLeft <= 0 || (totalPlayers > 0 && answeredCount >= totalPlayers)) {
          clearInterval(room.timer);
          
          // Αποκαλύπτουμε απάντηση
          io.to(roomId).emit('reveal-answer', {
            correct: q.correct,
            playersList: Object.values(room.players),
            answersState: room.answersState
          });

          // Αυτόματη μετάβαση στην επόμενη ερώτηση μετά από 5 δευτερόλεπτα
          room.autoAdvanceTimer = setTimeout(() => {
            loadNextQuestion(roomId);
          }, 5000);
        }
      }, 1000);

    } else {
      io.to(roomId).emit('game-over', {
        playersList: Object.values(room.players)
      });
    }
  }

  socket.on('submit-answer', ({ roomId, answer }) => {
    const room = rooms[roomId];
    if (!room) return;

    const qIndex = room.currentQuestionIndex;
    const currentQ = room.selectedQuestions[qIndex];
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

      socket.emit('answer-locked');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});