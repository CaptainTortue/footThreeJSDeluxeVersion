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

    // get infos from player
    socket.on('playerStartInfos', (data) => {
        players[socket.id] = {
            x: data.x,
            y: data.y,
            z: data.z,
            id: socket.id,
            angle: data.angle
        }
        if (Object.entries(players).filter( infos => infos[1].team === 1).length > Object.entries(players).filter(infos => infos[1].team === 2).length) {
            players[socket.id].team = 2;
        } else {
            players[socket.id].team = 1;
        }
        io.sockets.emit("players", players);
    });

    // Envoyer la position des objets lorsque le client demande une mise à jour
    socket.on('move', (data) => {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].z = data.z;
        players[socket.id].angle = data.angle;
        // Diffuser la position de la balle et des cubes aux autres clients
        socket.broadcast.emit('playerMoved', data);
    });

    // Colision entre les joueurs
    socket.on('collision', (data) => {
        console.log(data)
        // Diffuser la position de la balle et des cubes aux autres clients
        socket.broadcast.emit('collision', data);
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