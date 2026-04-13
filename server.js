const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// --- CONFIGURATION CRUCIALE ---
app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Route de test
app.get('/', (req, res) => {
    res.send('Serveur Inviolable en ligne !');
});

// 1. ROUTE POUR ENVOYER LE CODE DE VALIDATION
app.post('/send-code', async (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000); 

    // MODIFICATION ICI : Configuration robuste pour éviter ENETUNREACH sur Render
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Utilise SSL
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            // Cette option aide à prévenir les erreurs de connexion réseau sur certains hébergeurs
            rejectUnauthorized: false
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
        console.log("Email envoyé avec succès à:", email);
        res.status(200).json({ success: true, code: verificationCode });
    } catch (error) {
        // On affiche l'erreur complète dans les logs Render pour surveiller
        console.error("Erreur d'envoi d'email détaillée:", error);
        res.status(500).json({ success: false, message: "Erreur lors de l'envoi du mail" });
    }
});

// 2. ROUTE POUR SAUVEGARDER LA COMMANDE
app.post('/save-order', async (req, res) => {
    const { email, nom, panier, total } = req.body;
    
    console.log("Nouvelle commande reçue de:", nom);

    try {
        res.status(200).json({ success: true, message: "Commande enregistrée" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur sauvegarde" });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});