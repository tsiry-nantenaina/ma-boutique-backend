const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// --- CONFIGURATION CRUCIALE ---
// app.use(cors()) permet à ton navigateur d'accepter les réponses de Render
app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Route de test (celle qui affiche "Cannot GET /" si on ne met rien)
app.get('/', (req, res) => {
    res.send('Serveur Inviolable en ligne !');
});

// 1. ROUTE POUR ENVOYER LE CODE DE VALIDATION
app.post('/send-code', async (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // Code à 6 chiffres

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Votre code de validation - Ma Boutique',
        text: `Votre code de validation est : ${verificationCode}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, code: verificationCode });
    } catch (error) {
        console.error("Erreur d'envoi d'email:", error);
        res.status(500).json({ success: false, message: "Erreur lors de l'envoi du mail" });
    }
});

// 2. ROUTE POUR SAUVEGARDER LA COMMANDE
app.post('/save-order', async (req, res) => {
    const { email, nom, panier, total } = req.body;
    
    // Ici, tu peux ajouter la logique pour enregistrer dans Excel ou envoyer un autre mail
    console.log("Nouvelle commande reçue de:", nom);

    try {
        // Simulation d'enregistrement réussi
        res.status(200).json({ success: true, message: "Commande enregistrée" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur sauvegarde" });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});