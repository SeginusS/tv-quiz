const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {};

const levelsOrder = ["90%", "80%", "70%", "60%", "50%", "40%", "30%", "20%", "10%", "5%", "1%"];

const pointsPerLevel = {
  "90%": 50, "80%": 70, "70%": 100, "60%": 150, "50%": 200,
  "40%": 300, "30%": 400, "20%": 500, "10%": 700, "5%": 1000, "1%": 2000
};

const questionsByLevel = {
  "90%": [
{
    question: "[90%] Ποια από τις τέσσετις μύτες δεν αναπνέει;" ,
    imageUrl: "",
    options: { 
      A: { type: "image", value: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQgAuWFqOfIiLx5jJARCyH_Nv4xFK7FksIdK5xa3QdeUHF_Os9GBAiVR8&s=10"},
      B: { type: "image", value: "https://thumbs.dreamstime.com/b/none-188018600.jpg"}, 
      C: { type: "image", value: "https://www.tanea.gr/wp-content/uploads/2011/04/pig.jpg"},
      D: { type: "image", value: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjYSCLoB9nwvgcQOXr6YjHQXCpatHlm5PdV-MZceek6DnpU1XOGMqMomAg&s=10"} 
          },
          correct: "D"
  }

  ],

  "80%": [
      {
          question: "[80%] Ποιος θα ήταν αδύνατο να παραμείνει στην θέση που φωτογραφήθηκε για παραπάνω από 1 δευτερόλεπτο;", imageUrl: "", options: {
              A: { type: "image", value: "https://lh3.googleusercontent.com/d/1aerxga6oUgIm8gEizsH1RzZlcGQsawGq" },
              B: { type: "image", value: "https://lh3.googleusercontent.com/d/1GRqDLrV6oH4iMiDsD0OJ-JvQN0gvCrM5" },
              C: { type: "image", value: "https://lh3.googleusercontent.com/d/1pWlajznw-vwhVJCNLIEnGEYTA80X6rvZ" },
              D: { type: "image", value: "https://lh3.googleusercontent.com/d/1Qn2Ed6_5f75u4G90FPBwWt0LZYCrXrJK" }
          },
          correct: "D"
      }
  ],

  "70%": [
      {
          question: "[70%] Ποιο από τα παρακάτω ζώα δεν υπάρχει στον πίνακα;", imageUrl: "https://lh3.googleusercontent.com/d/1Qki65WHQPQyC7hXbxVEJCLuPIdfU9v7u",
          options: { A: "Σκύλος", B: "Γάτα", C: "Λιοντάρι", D: "Ασβός" },
          correct: "C",
          explanation: "Στον πίνακα δεν υπάρχει το Λιοντάρι",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/1yp6Q7N20NVZiXZkrxvrOgKwvpFy-dfWp" // Προαιρετικό
      }
  ],
  "60%": [
      {
          question: "[60%] Ποιο γλειφιτζούρι συμπληρώνει την εικόνα;", imageUrl: "https://lh3.googleusercontent.com/d/1z_D3iIgVbo8_7o3FV-vBDanV5mzQXRZl",
          options: {
              A: { type: "image", value: "https://lh3.googleusercontent.com/d/11OZJrYq7LIH_oBY6DSM21kNt43B-04cL" },
              B: { type: "image", value: "https://lh3.googleusercontent.com/d/1GUI5wQdLCdiYZU-53nGzJBPD72j5HWOa" },
              C: { type: "image", value: "https://lh3.googleusercontent.com/d/1Ya-OvBd0ZFdboqZXs60baLfn7NxGCASF" },
              D: { type: "image", value: "https://lh3.googleusercontent.com/d/1ixDy8xLir9lup9SrdhMC7VB-FqCcm5k3" }
          },
          correct: "A",
          explanation: "Κάθε γλειφιτζούρι στην επάνω σειρά έχει από κάτω το καθρέπτισμα του",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/1sDvbmPeC1C57F52FOHdqbggdHeEI5vV8" // Προαιρετικό
      }
  ],
  "50%": [
      {
          question: "[50%] Ποιος χρωματικός κύκλος απεικονίζει τα χρώματα στη φουσκωτή πυραμίδα;", imageUrl: "https://lh3.googleusercontent.com/d/14D_ZSKJVEgYztZE4yI1ZZCYHJSy6qMIH",
          options: {
              A: { type: "image", value: "https://lh3.googleusercontent.com/d/1d9QMT8IBaLWLZYWGgUX8oS1M1urkqV29" },
              B: { type: "image", value: "https://lh3.googleusercontent.com/d/1AHrBZsIVdeKQAfNQkWITPGTZz7YGuo_O" },
              C: { type: "image", value: "https://lh3.googleusercontent.com/d/1J3CPQwzI-Fe7dz_CJVfVRgdAbLrzbneY" },
              D: { type: "image", value: "https://lh3.googleusercontent.com/d/1tXm8YWoQVdnwWMGCaTJsFLq4mO1YvKfd" }
          },
          correct: "C",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/1q0wYIkWknt56MxARzMePpWaOtDJ9EF8O" // Προαιρετικό
      }
  ],
  "40%": [
    { question: "[40%] Ποια λέξη ΔΕΝ ταιριάζει με τις υπόλοιπες;", imageUrl: "", options: { A: "Μήλο", B: "Μπανάνα", C: "Καρότο", D: "Πορτοκάλι" }, correct: "C" }
  ],
  "30%": [
      {
          question: "[30%] Ποια από τις εικόνες ταιριάζει να συνεχίσει την παραπάνω ακολουθία; ", imageUrl: "https://lh3.googleusercontent.com/d/181H0HPnOHwX-MpWhZCPBaQaocXN7ItG-",
          options: {
              A: { type: "image", value: "https://lh3.googleusercontent.com/d/1l6HBwJ5XdrsdP3HWPxQcovXGN5H1r42S" },
              B: { type: "image", value: "https://lh3.googleusercontent.com/d/1zlpTCHF49dcF3jCt7-JOfUfAoSG3mFBA" },
              C: { type: "image", value: "https://lh3.googleusercontent.com/d/1sw7uFR3DtpMnNJ8UE_JTVYTLNebZm7_o" },
              D: { type: "image", value: "https://lh3.googleusercontent.com/d/1sDzJCshMGvdFoAt2Z64YozqkhddSERJ8" }
          },
          correct: "A",
          explanation: "Η λέξη που αναγράφεται σε κάθε κουτί καθορίζει το χρώμα που είναι βαμμένο το επόμενο κουτί. Το χρώμα με το οποίο είναι γραμμένη η λέξη σε κάθε κουτί καθορίζει τη λέξη που αναγράφεται σε κάθε επόμενο κουτί."
      }
  ],
  "20%": [
      {
          question: "[20%] Ο Μάριος είναι ναυτικός και γύρισε με καράβι από τον Καναδά. Ταξίδεψε έπειτα με λεωφορείο στη Λεπτοκαρυά και μετά με τρένο μέχρι τα Τρίκαλα. Όταν φτάσει στην Αθήνα, σύμφωνα με την λογική των διαδρομών που έκανε, σε ποια περιοχή θα πάει με το ταξί;", imageUrl: "",
          options: { A: "Ταύρο", B: "Γαλάτσι", C: "Φάληρο", D: "Κουκάκι" },
          correct: "A",
          explanation: "Σε κάθε ζεύγος μέσο μεταφοράς-περιοχή, τα δύο πρώτα γράμματα του μέσου μεταφοράς είναι ίδια με τα δύο πρώτα γράμματα της περιοχής.",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/15YdexKnc0R6X_PE3EQCQTwVbROa8Zt_z" // Προαιρετικό
      }
  ],
  "10%": [
      { question: "[10%] Αν ακολουθήσεις με την σειρά τα γράμματα της λέξης ΜΠΑΜΠΟΥΙΝΟΣ ποιος αριθμός σχηματίζεται;", imageUrl: "https://lh3.googleusercontent.com/d/1htpDl83icPpqgjpc3U849PkkG3NbQn86", 
          options: { A: "6", B: "3", C: "9", D: "5" },
          correct: "D",
          explanationImageUrl: "https://lh3.googleusercontent.com/d1iTpVog097Mwvfheer_pVcOPYd30xLdZ5"
      }
  ],
  "5%": [
    { question: "[5%] Ποιο είναι το επόμενο γράμμα στη σειρά: Δ, Τ, Τ, Π, Ε, Ε, ...;", imageUrl: "", options: { A: "Σ", B: "Κ", C: "Ο", D: "Ε" }, correct: "C" }
  ],
  "1%": [
      {
          question: "[1%] Ποια ημερομηνία του αιώνα που διανύουμε κρύβεται στους παρακάτω αριθμούς;", imageUrl: "https://lh3.googleusercontent.com/d/1Jb1NENnidiNVZ2viY3vcY2TTMq12oM2D",
          options: { A: "2-2-22", B: "2-5-22", C: "2-2-25", D: "5-2-22" },
          correct: "D",
          explanation: "5-2-22. Μόνο με αυτή την λογική προκύπτει ημερομηνία του αιώνα που διανύουμε, δηλαδή 5 δυάρια και 20 εικοσιδυάρια, δηλαδή 5 2 και 20 22 άρα 5-2-22",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/14NVCq_dzFj5WPGeJL6lL-0ao727DaJ20" // Προαιρετικό
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
      timeLeft: 30,
      isPaused: false,
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
      const room = rooms[roomId];

      let existingSocketId = null;
      for (let sId in room.players) {
        if (room.players[sId].name === playerName) {
          existingSocketId = sId;
          break;
        }
      }

      if (existingSocketId) {
        room.players[socket.id] = room.players[existingSocketId];
        if (existingSocketId !== socket.id) delete room.players[existingSocketId];
        if (room.hostSocket === existingSocketId) {
          room.hostSocket = socket.id;
          room.players[socket.id].isHost = true;
        }
      } else {
        const isHost = Object.keys(room.players).length === 0;
        room.players[socket.id] = { name: playerName, score: 0, isHost: isHost };
        if (isHost) room.hostSocket = socket.id;
      }

      io.to(roomId).emit('update-players', { playersList: Object.values(room.players) });
      socket.emit('joined-successfully', { roomId, playerName, isHost: room.players[socket.id].isHost });
    } else {
      socket.emit('error-message', 'Το δωμάτιο δεν βρέθηκε!');
    }
  });

  socket.on('start-game', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    for (let id in room.players) room.players[id].score = 0;
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
      qObj.points = pointsPerLevel[lvl] || 100;
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
    room.isPaused = false;

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

      room.timeLeft = 30;
      room.timer = setInterval(() => {
        if (room.isPaused) return; // Αν είναι σε παύση, ο χρόνος δεν μετράει

        room.timeLeft--;
        io.to(roomId).emit('timer-update', room.timeLeft);

        const totalPlayers = Object.keys(room.players).length;
        const answeredCount = Object.keys(room.answersState).length;

        if (room.timeLeft <= 0 || (totalPlayers > 0 && answeredCount >= totalPlayers)) {
          clearInterval(room.timer);
          
          io.to(roomId).emit('reveal-answer', {
              correct: q.correct,
              playersList: Object.values(room.players),
              answersState: room.answersState
          });

          room.autoAdvanceTimer = setTimeout(() => {
              if (q.explanation || q.explanationImageUrl) {
                  io.to(roomId).emit('show-explanation', {
                      explanation: q.explanation || "Η σωστή απάντηση αποκαλύφθηκε!",
                      explanationImageUrl: q.explanationImageUrl || ""
                  });
                  room.autoAdvanceTimer = setTimeout(() => {
                      loadNextQuestion(roomId);
                  }, 10000);
              } else {
                  // Αν δεν υπάρχει εξήγηση, πάμε κατευθείαν στην επόμενη ερώτηση
                  loadNextQuestion(roomId);
              }
          }, 5000); // 5 δευτερόλεπτα για τα avatars/αποκάλυψη
          }
      }, 1000);

      } else {
          io.to(roomId).emit('game-over', { playersList: Object.values(room.players) });
      }
  }
    

  socket.on('pause-game', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    room.isPaused = true;
    io.to(roomId).emit('game-paused');
  });

  socket.on('resume-game', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    room.isPaused = false;
    io.to(roomId).emit('game-resumed');
  });

  socket.on('terminate-game', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    clearInterval(room.timer);
    clearTimeout(room.autoAdvanceTimer);
    room.currentQuestionIndex = -1;
    for (let id in room.players) room.players[id].score = 0;
    io.to(roomId).emit('game-terminated', { playersList: Object.values(room.players) });
  });

  socket.on('submit-answer', ({ roomId, answer }) => {
    const room = rooms[roomId];
    if (!room || room.isPaused) return; // Αν είναι σε παύση, απορρίπτεται η απάντηση

    const qIndex = room.currentQuestionIndex;
    const currentQ = room.selectedQuestions[qIndex];
    const player = room.players[socket.id];

    if (player && !room.answersState[socket.id]) {
      const isCorrect = (answer === currentQ.correct);
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