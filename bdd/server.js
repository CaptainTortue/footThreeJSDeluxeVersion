const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// Rate limiter for sensitive endpoints
const rateLimit = require("express-rate-limit");
// Allow max 10 requests per minute per IP to score increment endpoint
const scoreIncrementLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: "Too many requests, please try again later." }
});

// Allow max 60 requests per minute per IP to score GET endpoint
const scoreGetLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { error: "Too many requests, please try again later." }
});

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
app.get("/score/:idGame", scoreGetLimiter, async (req, res) => {
    const { idGame } = req.params;
    try {
        let game = await Game.findOne({ idGame });
        res.json({ id: idGame, score1: game.score1, score2: game.score2 });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Mettre à jour le score d'un joueur
app.post("/score/increment", scoreIncrementLimiter, async (req, res) => {
    let { idGame, team } = req.body;
    console.log(req.body);
    // Validate idGame is a number and not an object
    idGame = Number(idGame);
    if (!Number.isFinite(idGame)) {
        return res.status(400).json({ error: "Invalid idGame value" });
    }
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
