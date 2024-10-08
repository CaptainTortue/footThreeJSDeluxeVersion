const Socket = require("socket.io");
const express = require("express");
const app = express();
const path = require('path');
const server = require("http").createServer(app);

const players = {};
let score = {
    team1: 0,
    team2: 0
}

const ball = {
    x: 0,
    y: 0,
    z: -.5
}
let NombrePerssone = 0;

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

     // Ajouter un joueur après qu'il ait choisi son pseudo
    socket.on('setPseudo', (pseudo) => {
        players[socket.id] = { pseudo: pseudo };
        io.emit('listUpdate', players);
    });

    // get infos from player
    socket.on('playerStartInfos', (data, fn) => {
        players[socket.id].id = socket.id
        players[socket.id].x = data.x; // Met à jour x
        players[socket.id].y = data.y; // Met à jour y
        players[socket.id].z = data.z; // Met à jour z
        players[socket.id].angle = data.angle;
        players[socket.id].enter = NombrePerssone;
        NombrePerssone++;
        if (Object.entries(players).filter( infos => infos[1].team === 1).length > Object.entries(players).filter(infos => infos[1].team === 2).length) {
            players[socket.id].team = 2;
        } else {
            players[socket.id].team = 1;
        }

        io.sockets.emit("players", players);
        // emit ball position
        socket.emit('ballPosition', {x: ball.x, y: ball.y, z: ball.z});

        // send score
        socket.emit('score', {team1: score.team1, team2: score.team2});
        fn(players[socket.id].team,players[socket.id].enter);

    });

    socket.on('ballplayer',(data) => {
        socket.broadcast.emit('ballplayer',(data));
    })
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
        ball.x = data.x;
        ball.y = data.y;
        ball.z = data.z;
        // Diffuser la position de la balle et des cubes aux autres clients
        socket.broadcast.emit('ballMoved', data);
        //fn({x: ball.x, y: ball.y, z: ball.z});
    });

    socket.on('goal', (data) => {
        // Diffuser la position de la balle et des cubes aux autres clients
        score[`team${data.team}`] += 1;
        io.sockets.emit('score', {team1: score.team1, team2: score.team2});
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