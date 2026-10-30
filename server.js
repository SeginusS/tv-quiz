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
    question: "[90%] Ποια από τις τέσσερις μύτες δεν αναπνέει;" ,
    imageUrl: "",
    options: { 
      A: { type: "image", value: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQgAuWFqOfIiLx5jJARCyH_Nv4xFK7FksIdK5xa3QdeUHF_Os9GBAiVR8&s=10"},
      B: { type: "image", value: "https://thumbs.dreamstime.com/b/none-188018600.jpg"}, 
      C: { type: "image", value: "https://www.tanea.gr/wp-content/uploads/2011/04/pig.jpg"},
      D: { type: "image", value: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjYSCLoB9nwvgcQOXr6YjHQXCpatHlm5PdV-MZceek6DnpU1XOGMqMomAg&s=10"} 
          },
          correct: "D"
  },

  {
    question: "[90%] Τέσσερις άνθρωποι βρίσκονται μέσα στον λαβύρυνθο και προσπαθούν να φτάσουν στο κέντρο. Ποιος πηγαίνει λάθος;",
    imageUrl: "eikones/maze.jpg",
    options: {
        A: "A",
        B: "B",
        C: "C",
        D: "D", },
    correct: "B"
   }
    
  ],

  "80%": [
      {
          question: "[80%] Ποιος θα ήταν αδύνατο να παραμείνει στην θέση που φωτογραφήθηκε για παραπάνω από 1 δευτερόλεπτο;", imageUrl: "", options: {
              A: { type: "image", value: "eikones/screenshot-2026-10-10-000859.jpg" },
              B: { type: "image", value: "eikones/screenshot-2026-10-10-000927.jpg" },
              C: { type: "image", value: "eikones/screenshot-2026-10-10-000959.jpg" },
              D: { type: "image", value: "/eikones/screenshot-2026-10-10-001018.jpg"},
          },
          correct: "D"
      },

    {
    question: "[80%] Ο Γιώργος πάντα ζωγραφίζει έναν κύκλο. Ο Γιώργος ποτε δεν ζωγραφίζει τετράγωνα. Ο Γιώργος πάντα ζωγραφίζει τέσσερα τρίγωνα. Ποια από τις παρακάτω εικόνες είναι πίνακας του Γιώργου;",
    options: {
      A: {type: "image", value: "eikones/giorgos.jpg"},
      B: {type: "image", value: "eikones/giorgos1" },
      C: { type: "image", value: "eikones/giorgos2" },
      D: { type: "image", value: "/eikones/giorgos0"},
             },
          correct: "D"
  },
    
  ],

  "70%": [
      {
          question: "[70%] Ποιο από τα παρακάτω ζώα δεν υπάρχει στον πίνακα;", imageUrl: "eikones/screenshot-2026-10-10-111113.jpg",
          options: { A: "Σκύλος", B: "Γάτα", C: "Λιοντάρι", D: "Ασβός" },
          correct: "C",
          explanation: "Στον πίνακα δεν υπάρχει το Λιοντάρι",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/1yp6Q7N20NVZiXZkrxvrOgKwvpFy-dfWp" // Προαιρετικό
      },

      {
        question: "[70%] Πόσα τετράγωνα υπάρχουν σε αυτό το μοτίβο",
        imageUrl: "eikones/tetragona.jpg",
        options: { A: "0", B: "2", C: "4", D: "6" },
        correct: "C"
      }
        
  
  ],
  "60%": [
      {
          question: "[60%] Ποιο γλειφιτζούρι συμπληρώνει την εικόνα;", imageUrl: "eikones/screenshot-2026-10-10-111624.jpg",
          options: {
              A: { type: "image", value: "eikones/screenshot-2026-10-10-111740.jpg" },
              B: { type: "image", value: "eikones/screenshot-2026-10-10-111702.jpg" },
              C: { type: "image", value: "eikones/screenshot-2026-10-10-111800.jpg" },
              D: { type: "image", value: "eikones/screenshot-2026-10-10-111819.jpg" }
          },
          correct: "A",
          explanation: "Κάθε γλειφιτζούρι στην επάνω σειρά έχει από κάτω το καθρέπτισμα του",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/1sDvbmPeC1C57F52FOHdqbggdHeEI5vV8" // Προαιρετικό
      },

    {
      question: "[60%] Αν οι τρύπες στα γράμματα ήταν γκολ που έβαλε η κάθε ομάδα, ποια θα κέρδιζε;", imageUrl: "eikones/panath.jpg",
      options: { A: "Παναθηναϊκός", B: "Ολυμπιακός" },
      correct: "A",
      explanationImageUrl: "eikones/panathaeks.jpg"
    }


    
  ],
  "50%": [
      {
          question: "[50%] Ποιος χρωματικός κύκλος απεικονίζει τα χρώματα στη φουσκωτή πυραμίδα;", imageUrl: "https://lh3.googleusercontent.com/d/14D_ZSKJVEgYztZE4yI1ZZCYHJSy6qMIH",
          options: {
              A: { type: "image", value: "eikones/screenshot-2026-10-10-112539.jpg" },
              B: { type: "image", value: "eikones/screenshot-2026-10-10-112600.jpg" },
              C: { type: "image", value: "eikones/screenshot-2026-10-10-112619.jpg" },
              D: { type: "image", value: "eikones/screenshot-2026-10-10-112635.jpg" }
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
              A: { type: "image", value: "eikones/screenshot-2026-10-10-114441.jpg" },
              B: { type: "image", value: "eikones/screenshot-2026-10-10-114458.jpg" },
              C: { type: "image", value: "eikones/screenshot-2026-10-10-114512.jpg" },
              D: { type: "image", value: "eikones/screenshot-2026-10-10-114531.jpg" }
          },
          correct: "A",
          explanation: "Η λέξη που αναγράφεται σε κάθε κουτί καθορίζει το χρώμα που είναι βαμμένο το επόμενο κουτί. Το χρώμα με το οποίο είναι γραμμένη η λέξη σε κάθε κουτί καθορίζει τη λέξη που αναγράφεται σε κάθε επόμενο κουτί."
      },

    {
      question: "[30%] Ποια λέξη αντικαθιστά το ερωτηματικό;",
      imageUrl:"eikones/leksik.jpg",
      options: { A: "ΚΟΚΚΙΝΟ", B: "ΜΠΛΕ", C: "ΜΑΥΡΟ", D: "ΠΡΑΣΙΝΟ"},
      correct: "D",
      explanation: "Η λέξη που αναγράφεται σε κάθε κουτί καθορίζει το χρώμα που είναι βαμμένο το επόμενο κουτί."
    }
    
  ],
  "20%": [
      {
          question: "[20%] Ο Μάριος είναι ναυτικός και γύρισε με καράβι από τον Καναδά. Ταξίδεψε έπειτα με λεωφορείο στη Λεπτοκαρυά και μετά με τρένο μέχρι τα Τρίκαλα. Όταν φτάσει στην Αθήνα, σύμφωνα με την λογική των διαδρομών που έκανε, σε ποια περιοχή θα πάει με το ταξί;", imageUrl: "",
          options: { A: "Ταύρο", B: "Γαλάτσι", C: "Φάληρο", D: "Κουκάκι" },
          correct: "A",
          explanation: "Σε κάθε ζεύγος μέσο μεταφοράς-περιοχή, τα δύο πρώτα γράμματα του μέσου μεταφοράς είναι ίδια με τα δύο πρώτα γράμματα της περιοχής.",
          explanationImageUrl: "https://lh3.googleusercontent.com/d/15YdexKnc0R6X_PE3EQCQTwVbROa8Zt_z" // Προαιρετικό
      },

    {
      question: "[20%] Ποιος αριθμός αντικαθιστά το ερωτηματικό στην παρακάτω εικόνα;",
      imageUrl:"eikones/erotimatiko.jpg",
      options: { A: "9", B: "11", C: "12", D: "13"},
      correct: "C",
      explanation: "Ο αριθμός στα αριστερά αντιπροσωπεύει το συνολικό πλήθος των γραμμών που περιέχονται στον αριθμό στα αριστερά. Καθώς προχωράμε προς τα κάτω στη λίστα, έχουν προστεθεί περισσότερες γραμμές στα ψηφία «1» και «7»."
    },

    {
      question: "[20] Η φιγούρα ξεκινάει από το τετράγωνο με τον αριθμό 1, κινέιται κάθε φορά προς την κατεύθυνση που δείχνει, σε ποιον αριθμό τετραγώνου καταλήγει;",
      imageUrl: "eikones/figoura.jpg",
      options: { A: "19", B: "20", C: "18", D: "22"},
      correct: "A",
    },
    
  ],
  "10%": [
      { question: "[10%] Αν ακολουθήσεις με την σειρά τα γράμματα της λέξης ΜΠΑΜΠΟΥΙΝΟΣ ποιος αριθμός σχηματίζεται;", imageUrl: "https://lh3.googleusercontent.com/d/1htpDl83icPpqgjpc3U849PkkG3NbQn86", 
          options: { A: "6", B: "3", C: "9", D: "5" },
          correct: "D",
          explanationImageUrl: "eikones/screenshot-2026-10-10-132953.jpg"
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

// Ο παίκτης που στέλνει την εντολή είναι ο διαχειριστής (host) του δωματίου;
function isHost(room, socket) {
  return !!(room && room.players[socket.id] && room.players[socket.id].isHost);
}

// Κλείνει ένα δωμάτιο: ειδοποιεί όλους (τα κινητά πετάγονται στη φόρμα εισόδου)
// και το σβήνει από τη μνήμη.
function closeRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearInterval(room.timer);
  clearTimeout(room.autoAdvanceTimer);
  clearTimeout(room.tvGraceTimer);
  io.to(roomId).emit('room-closed');
  io.in(roomId).socketsLeave(roomId);
  delete rooms[roomId];
}

// Στέλνει στην τηλεόραση την τρέχουσα κατάσταση του δωματίου
function sendTvState(socket, roomId) {
  const room = rooms[roomId];
  socket.emit('room-created', roomId);
  socket.emit('update-players', { playersList: Object.values(room.players) });

  // Αν τρέχει ερώτηση, η τηλεόραση την ξαναδείχνει
  if (room.acceptingAnswers && room.lastQuestion) {
    socket.emit('show-question', room.lastQuestion);
    socket.emit('timer-update', room.timeLeft);
    if (room.isPaused) socket.emit('game-paused');
  }
}

// Πόσο περιμένουμε μια τηλεόραση που αποσυνδέθηκε πριν κλείσουμε το δωμάτιο (ms)
const TV_GRACE_MS = 60000;

io.on('connection', (socket) => {
  // Η τηλεόραση στέλνει ένα μόνιμο αναγνωριστικό (tvToken). Αν η ίδια τηλεόραση
  // είχε ήδη δωμάτιο (π.χ. έκανε refresh), το παλιό κλείνει και τα κινητά του
  // πετάγονται στη φόρμα εισόδου. Η τηλεόραση παίρνει ΝΕΟ κωδικό.
  socket.on('create-room', (tvToken) => {
    if (tvToken) {
      for (const id of Object.keys(rooms)) {
        if (rooms[id].tvToken === tvToken) closeRoom(id);
      }
    }

    let roomId;
    do {
      roomId = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms[roomId]);

    rooms[roomId] = {
      tvToken: tvToken || null,
      tvSocket: socket.id,
      tvGraceTimer: null,
      hostSocket: socket.id,
      players: {}, 
      currentQuestionIndex: -1,
      timer: null,
      autoAdvanceTimer: null,
      timeLeft: 30,
      isPaused: false,
      acceptingAnswers: false,
      lastQuestion: null,
      answersState: {},
      selectedQuestions: [],
      usedQuestionsMap: {}
    };
    
    levelsOrder.forEach(lvl => {
      rooms[roomId].usedQuestionsMap[lvl] = [];
    });

    socket.data.tvRoom = roomId;
    socket.join(roomId);
    socket.emit('room-created', roomId);
  });

  // Η τηλεόραση έχασε στιγμιαία τη σύνδεση (ΟΧΙ refresh) και ξαναγυρίζει στο ίδιο δωμάτιο
  socket.on('tv-reconnect', ({ roomId, tvToken } = {}) => {
    const room = rooms[roomId];
    if (!room || !tvToken || room.tvToken !== tvToken) {
      socket.emit('room-gone');
      return;
    }
    clearTimeout(room.tvGraceTimer);
    room.tvSocket = socket.id;
    socket.data.tvRoom = roomId;
    socket.join(roomId);
    sendTvState(socket, roomId);
  });

  // Αν χαθεί η τηλεόραση και δεν γυρίσει μέσα στο όριο, το δωμάτιο κλείνει
  socket.on('disconnect', () => {
    const roomId = socket.data.tvRoom;
    const room = rooms[roomId];
    if (room && room.tvSocket === socket.id) {
      clearTimeout(room.tvGraceTimer);
      room.tvGraceTimer = setTimeout(() => closeRoom(roomId), TV_GRACE_MS);
    }
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
        if (existingSocketId !== socket.id) {
          delete room.players[existingSocketId];
          // Μεταφορά της απάντησης που ίσως είχε ήδη δώσει, ώστε να μην απαντήσει ξανά
          if (room.answersState[existingSocketId]) {
            room.answersState[socket.id] = room.answersState[existingSocketId];
            delete room.answersState[existingSocketId];
          }
        }
        if (room.hostSocket === existingSocketId) {
          room.hostSocket = socket.id;
          room.players[socket.id].isHost = true;
        }
      } else {
        const isHostPlayer = Object.keys(room.players).length === 0;
        room.players[socket.id] = { name: playerName, score: 0, isHost: isHostPlayer };
        if (isHostPlayer) room.hostSocket = socket.id;
      }

      io.to(roomId).emit('update-players', { playersList: Object.values(room.players) });
      socket.emit('joined-successfully', { roomId, playerName, isHost: room.players[socket.id].isHost });

      // Ενημέρωση του κινητού για την τρέχουσα κατάσταση (χρήσιμο σε επανασύνδεση)
      socket.emit('sync-state', {
        questionActive: !!room.acceptingAnswers,
        paused: !!room.isPaused,
        answered: !!room.answersState[socket.id]
      });
    } else {
      socket.emit('error-message', 'Το δωμάτιο δεν βρέθηκε!');
    }
  });

  socket.on('start-game', (roomId) => {
    const room = rooms[roomId];
    if (!isHost(room, socket)) return;

    // Αν το παιχνίδι ήδη τρέχει, αγνοούμε (π.χ. διπλό πάτημα)
    if (room.currentQuestionIndex >= 0 && room.currentQuestionIndex < room.selectedQuestions.length) return;

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
    room.acceptingAnswers = false;

    room.currentQuestionIndex++;
    if (room.currentQuestionIndex < room.selectedQuestions.length) {
      const q = room.selectedQuestions[room.currentQuestionIndex];
      room.answersState = {};

      const payload = {
        questionNum: room.currentQuestionIndex + 1,
        total: room.selectedQuestions.length,
        levelName: q.levelName,
        points: q.points,
        question: q.question,
        imageUrl: q.imageUrl,
        options: q.options
      };
      room.lastQuestion = payload;
      room.timeLeft = 30;
      room.acceptingAnswers = true;

      io.to(roomId).emit('show-question', payload);

      room.timer = setInterval(() => {
        if (room.isPaused) return; // Αν είναι σε παύση, ο χρόνος δεν μετράει

        room.timeLeft--;
        io.to(roomId).emit('timer-update', room.timeLeft);

        const totalPlayers = Object.keys(room.players).length;
        const answeredCount = Object.keys(room.answersState).length;

        if (room.timeLeft <= 0 || (totalPlayers > 0 && answeredCount >= totalPlayers)) {
          clearInterval(room.timer);
          room.acceptingAnswers = false; // Από εδώ και πέρα δεν δεχόμαστε άλλες απαντήσεις
          
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
    // Μόνο ο host, και μόνο όσο τρέχει ερώτηση (όχι στην αποκάλυψη/εξήγηση)
    if (!isHost(room, socket) || !room.acceptingAnswers) return;
    room.isPaused = true;
    io.to(roomId).emit('game-paused');
  });

  socket.on('resume-game', (roomId) => {
    const room = rooms[roomId];
    if (!isHost(room, socket) || !room.isPaused) return;
    room.isPaused = false;
    io.to(roomId).emit('game-resumed');
  });

  socket.on('terminate-game', (roomId) => {
    const room = rooms[roomId];
    if (!isHost(room, socket)) return;
    clearInterval(room.timer);
    clearTimeout(room.autoAdvanceTimer);
    room.currentQuestionIndex = -1;
    room.isPaused = false;
    room.acceptingAnswers = false;
    for (let id in room.players) room.players[id].score = 0;
    io.to(roomId).emit('game-terminated', { playersList: Object.values(room.players) });
  });

  socket.on('submit-answer', ({ roomId, answer }) => {
    const room = rooms[roomId];
    // Απορρίπτεται αν: δεν υπάρχει δωμάτιο, είναι σε παύση, ή η ερώτηση έχει ήδη κλείσει
    if (!room || room.isPaused || !room.acceptingAnswers) return;
    if (!['A', 'B', 'C', 'D'].includes(answer)) return;

    const qIndex = room.currentQuestionIndex;
    const currentQ = room.selectedQuestions[qIndex];
    const player = room.players[socket.id];

    if (currentQ && player && !room.answersState[socket.id]) {
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
