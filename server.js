require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// --- INITIALISATION BASE DE DONNÉES ---
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({ commandes: [] }).write();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- RÉFÉRENTIEL DE PRIX OFFICIEL (Protection contre la fraude) ---
const PRODUITS_OFFICIELS = {
    "Casque Bluetooth": 59.00,
    "Souris Gamer": 25.00,
    "Clavier Mécanique": 85.00
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

app.post('/verify-contact', (req, res) => {
    const { email } = req.body;
    const code = Math.floor(1000 + Math.random() * 9000);
    console.log(`[LOG] Code pour ${email} : ${code}`);

    const mailOptions = {
        from: `"Boutique Tech" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Votre code de vérification',
        text: `Votre code de validation est : ${code}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return res.json({ success: true, code: code });
        res.json({ success: true, code: code });
    });
});

// --- ROUTE DE SAUVEGARDE AVEC PROTECTION EXCEL ---
app.post('/save-order', async (req, res) => {
    const { email, nom, panier } = req.body;

    let totalCalcule = 0;
    let detailsProduits = "";

    for (let nomProduit in panier) {
        const quantite = panier[nomProduit].quantity;
        const prixUnitaire = PRODUITS_OFFICIELS[nomProduit];

        if (prixUnitaire) {
            totalCalcule += prixUnitaire * quantite;
            detailsProduits += `${quantite}x ${nomProduit}, `;
        }
    }
    detailsProduits = detailsProduits.slice(0, -2);

    const nouvelleCommande = {
        id: "CMD-" + Date.now(),
        date: new Date().toLocaleString('fr-FR'),
        client: nom,
        email: email,
        articles_liste: detailsProduits,
        montant_total: totalCalcule.toFixed(2) + " €"
    };

    db.get('commandes').push(nouvelleCommande).write();

    try {
        const commandes = db.get('commandes').value();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ventes_Securisees');

        // Configuration des colonnes
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Client', key: 'client', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Articles', key: 'articles', width: 45 },
            { header: 'Total', key: 'total', width: 15 }
        ];

        commandes.forEach(c => {
            worksheet.addRow({
                id: c.id,
                date: c.date,
                client: c.client,
                email: c.email,
                articles: c.articles_liste,
                total: c.montant_total
            });
        });

        // Style En-tête
        worksheet.getRow(1).font = { bold: true };

        // --- PROTECTION DU FICHIER CONTRE LA SAISIE ---
        // Le mot de passe est 'admin123'. Sans lui, impossible de modifier les cases dans Excel.
        await worksheet.protect('admin123', {
            selectLockedCells: true,     // On peut cliquer sur les cases...
            selectUnlockedCells: false,  // ...mais on ne peut rien taper.
            formatCells: false,
            insertRows: false,
            deleteRows: false
        });

        await workbook.xlsx.writeFile('commandes_boutique.xlsx');
        
        console.log(`✅ Commande enregistrée. Fichier Excel verrouillé.`);
        res.json({ success: true });
    } catch (error) {
        console.error("Erreur protection Excel:", error);
        res.json({ success: false });
    }
});

app.listen(PORT, () => console.log(`Serveur Inviolable démarré : http://localhost:${PORT}`));