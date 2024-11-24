const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connexion à MongoDB
const mongoURI = "mongodb://localhost:27017/"; // Remplacez par votre URI MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connecté"))
    .catch(err => console.error("Erreur de connexion à MongoDB :", err));

// Schéma pour les scores
const gameSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    score1: { type: Number, default: 0 },
    score2: { type: Number, default: 0 },
});

const Game = mongoose.model("game", gameSchema);

// Endpoints

// Créer une nouvelle partie
app.post("/game", async (req, res) => {
    // id aléatoire, TODO: vérifier qu'il n'existe pas déjà
    const idGame = Math.floor(Math.random() * 1000000);
    try {
        const game = new Game({ id: idGame });
        console.log("Nouvelle partie créée :", game);
        res.json({ idGame: game.id, score1: game.score1, score2: game.score2 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Récupérer le score d'un joueur
app.get("/score/:idGame", async (req, res) => {
    const { idGame } = req.params;
    try {
        let game = await Game.findOne({ idGame });
        res.json({ id: idGame, score1: game.score1, score2: game.score2 });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Mettre à jour le score d'un joueur
app.post("/score/increment", async (req, res) => {
    const { idGame, team } = req.body;
    console.log(req.body);
    try {
        let game;
        if (team == 1) {
            game = await Game.findOneAndUpdate(
                {id: idGame},
                {$inc: {score1: 1}},
                {new: true, upsert: true}
            );
        } else {
            game = await Game.findOneAndUpdate(
                {id: idGame},
                {$inc: {score2: 1}},
                {new: true, upsert: true}
            );
        }
        res.json({ idGame: game.idGame, score1: game.score1, score2: game.score2 });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Erreur serveur", err: err });
    }
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
