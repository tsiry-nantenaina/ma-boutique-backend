const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('Serveur Inviolable en ligne !');
});

app.post('/send-code', async (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000); 

    // FORCE IPv4 : On utilise l'IP directe du serveur SMTP de Google
    let transporter = nodemailer.createTransport({
        host: '74.125.133.108', // Adresse IPv4 directe de Google
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false,
            servername: 'smtp.gmail.com' // Indispensable pour que Google accepte la connexion sur son IP
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
        console.log("SUCCÈS : Email envoyé à", email);
        res.status(200).json({ success: true, code: verificationCode });
    } catch (error) {
        console.error("ERREUR RÉSEAU DÉTECTÉE :", error.message);
        res.status(500).json({ success: false, message: "Erreur lors de l'envoi" });
    }
});

app.post('/save-order', async (req, res) => {
    const { email, nom, panier, total } = req.body;
    console.log("Commande reçue:", nom);
    res.status(200).json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});