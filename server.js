const Socket = require("socket.io");
const express = require("express");
const app = express();
const path = require('path');
const server = require("http").createServer(app);

const players = {};

const PORT = 5000;

const io = Socket(server, {
    // options
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

// Définir le dossier statique pour le client (où se trouve index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Lorsqu'un client se connecte
io.on('connection', (socket) => {
    //console.log('Un joueur s\'est connecté :', socket.id);

    // Chaque joueur a aussi une couleur aléatoire.
    players[socket.id] = {
        id: socket.id, // ID unique pour identifier le joueur
        x: Math.random() * 5 - 3, // Position X du joueur (aléatoire)
        y: 0, // Position Y (0 car les joueurs sont sur le sol)
        z: Math.random() * 5 - 3, // Position Z du joueur (aléatoire)
    };
    console.log(players[socket.id].x, players[socket.id].z)

    if (Object.entries(players).filter( infos => infos[1].team === 1).length > Object.entries(players).filter(infos => infos[1].team === 2).length) {
        players[socket.id].color = "orange"
        players[socket.id].team = 2;
    } else {
        players[socket.id].color = "red"
        players[socket.id].team = 1;
    }
    //console.log(players)
    io.sockets.emit("players", players);

    // Envoyer la position des objets lorsque le client demande une mise à jour
    socket.on('updatePosition', (data) => {
      // Diffuser la position de la balle et des cubes aux autres clients
      socket.broadcast.emit('playerMoved', data);
    });

    socket.on('ballMoved', (data) => {
      // Diffuser la position de la balle et des cubes aux autres clients
      socket.broadcast.emit('ballMoved', data);
    });

    socket.on('goal', (data) => {
        // Diffuser la position de la balle et des cubes aux autres clients
        socket.broadcast.emit('goal', data);
    })

    // Lorsqu'un client se déconnecte
    socket.on('disconnect', () => {
      console.log('Un joueur s\'est déconnecté :', socket.id);

        // Retirer le joueur de la liste des joueurs connectés
        delete players[socket.id];

        // Informer tous les autres joueurs qu'un joueur s'est déconnecté
        io.emit('playerDisconnected', socket.id);
    });
});

  server.listen(PORT, () => {
    console.log("listening on PORT: ", PORT);
});