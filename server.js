const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {};

const levelsOrder = ["90%", "80%", "70%", "60%", "50%", "40%", "30%", "20%", "10%", "5%", "1%"];

// Πόντοι ανάλογα με τη δυσκολία (όσο πιο δύσκολη η ερώτηση, τόσους περισσότερους πόντους δίνει!)
const pointsPerLevel = {
  "90%": 50,
  "80%": 70,
  "70%": 100,
  "60%": 150,
  "50%": 200,
  "40%": 300,
  "30%": 400,
  "20%": 500,
  "10%": 700,
  "5%": 1000,
  "1%": 2000 // Τεράστιο μπόνους για την τελική ανατροπή!
};

const questionsByLevel = {
  "90%": [
    {
      question: "[90%] Αν το χθες ήταν Τρίτη, τι μέρα είναι αύριο;",
      imageUrl: "",
      options: { A: "Τετάρτη", B: "Πέμπτη", C: "Παρασκευή", D: "Σάββατο" },
      correct: "B"
    }
  ],
  "80%": [
    {
      question: "[80%] Ποιο σχήμα έχει τις περισσότερες πλευρές;",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
      options: { A: "Τετράγωνο", B: "Πεντάγωνο", C: "Εξάγωνο", D: "Οκτάγωνο" },
      correct: "D"
    }
  ],
  "70%": [
    {
      question: "[70%] Ποιος αριθμός συμπληρώνει τη σειρά: 3, 6, 12, 24, ?;",
      imageUrl: "",
      options: { A: "30", B: "36", C: "48", D: "60" },
      correct: "C"
    }
  ],
  "60%": [
    {
      question: "[60%] Πόσα τετράγωνα βλέπεις συνολικά;",
      imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600",
      options: { A: "10", B: "14", C: "16", D: "20" },
      correct: "C"
    }
  ],
  "50%": [
    {
      question: "[50%] Ποιος αριθμός κρύβεται στο ερωτηματικό;",
      imageUrl: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=600",
      options: { A: "5", B: "7", C: "9", D: "12" },
      correct: "B"
    }
  ],
  "40%": [
    {
      question: "[40%] Ποια λέξη ΔΕΝ ταιριάζει με τις υπόλοιπες;",
      imageUrl: "",
      options: { A: "Μήλο", B: "Μπανάνa", C: "Καρότο", D: "Πορτοκάλι" },
      correct: "C"
    }
  ],
  "30%": [
    {
      question: "[30%] Πόσο κάνει 3 + 3 x 3 - 3;",
      imageUrl: "",
      options: { A: "15", B: "9", C: "6", D: "12" },
      correct: "C"
    }
  ],
  "20%": [
    {
      question: "[20%] Ποιο κουτί ζυγίζει περισσότερο;",
      imageUrl: "",
      options: { A: "Κουτί Α", B: "Κουτί Β", C: "Κουτί Γ", D: "Έχουν ίδιο βάρος" },
      correct: "D"
    }
  ],
  "10%": [
    {
      question: "[10%] Πόσα τρίγωνα υπάρχουν στη γωνία;",
      imageUrl: "",
      options: { A: "5", B: "7", C: "9", D: "11" },
      correct: "C"
    }
  ],
  "5%": [
    {
      question: "[5%] Ποιο είναι το επόμενο γράμμα στη σειρά: Δ, Τ, Τ, Τ, Π, Ε, ...;",
      imageUrl: "",
      options: { A: "Σ", B: "Κ", C: "Ο", D: "Μ" },
      correct: "A"
    }
  ],
  "1%": [
    {
      question: "[1% - Η ΤΕΛΙΚΗ ΕΡΩΤΗΣΗ] Ποιος είναι ο μοναδικός αριθμός που γράφεται με τόσα γράμματα όσα και η αξία του;",
      imageUrl: "",
      options: { A: "Ένα (3)", B: "Δύο (3)", C: "Τρία (4)", D: "Τέσσερα (7)" },
      correct: "D"
    }
  ]
};

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
      usedQuestionsMap: {}
    };
    
    levelsOrder.forEach(lvl => {
      rooms[roomId].usedQuestionsMap[lvl] = [];
    });

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

    room.selectedQuestions = [];

    levelsOrder.forEach(lvl => {
      const qList = questionsByLevel[lvl] || [];
      if (qList.length === 0) return;

      let usedIndices = room.usedQuestionsMap[lvl] || [];
      let availableIndices = qList.map((_, idx) => idx).filter(idx => !usedIndices.includes(idx));

      if (availableIndices.length === 0) {
        room.usedQuestionsMap[lvl] = [];
        availableIndices = qList.map((_, idx) => idx);
      }

      const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      room.usedQuestionsMap[lvl].push(randomIdx);

      const qObj = qList[randomIdx];
      qObj.levelName = lvl;
      qObj.points = pointsPerLevel[lvl] || 100; // Προσάψαμε τους πόντους στην ερώτηση
      room.selectedQuestions.push(qObj);
    });

    room.currentQuestionIndex = -1;
    loadNextQuestion(roomId);
  });

  function loadNextQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    clearInterval(room.timer);
    clearTimeout(room.autoAdvanceTimer);

    room.currentQuestionIndex++;
    if (room.currentQuestionIndex < room.selectedQuestions.length) {
      const q = room.selectedQuestions[room.currentQuestionIndex];
      room.answersState = {};

      io.to(roomId).emit('show-question', {
        questionNum: room.currentQuestionIndex + 1,
        total: room.selectedQuestions.length,
        levelName: q.levelName,
        points: q.points,
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
          
          io.to(roomId).emit('reveal-answer', {
            correct: q.correct,
            playersList: Object.values(room.players),
            answersState: room.answersState
          });

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
      // Προσθέτουμε τους πόντους ανάλογα με τη δυσκολία της ερώτησης
      if (isCorrect) player.score += currentQ.points;

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