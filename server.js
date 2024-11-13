const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL Pool
const session = require('express-session');
const { v4: uuidv4 } = require('uuid'); // UUID Generator

// PostgreSQL Pool-Setup
const pool = new Pool({
    user: 'postgres',   // Dein PostgreSQL Benutzername
    host: 'localhost',
    database: 'momo',   // Der Name deiner PostgreSQL-Datenbank
    password: 'lamo',   // Dein PostgreSQL Passwort
    port: 5432          // Standard-Port für PostgreSQL
});

const app = express();

// CORS und JSON-Middleware
app.use(cors({
    origin: '*', // Erlaube alle Ursprünge, du kannst dies später anpassen
}));
app.use(express.json());

// Session-Setup
app.use(session({
    secret: 'yourSecretKey',  // Setze hier ein geheimes Schlüsselwort für deine Session
    resave: false,
    saveUninitialized: true
}));

// POST: Anmeldung auf Warteliste
app.post('/api/anmelden', async (req, res) => {
    const { name, email, friseurId } = req.body;

    try {
        // Überprüfen, ob der Benutzer mit der gleichen E-Mail-Adresse bereits auf der Warteliste steht
        const result = await pool.query(
            'SELECT * FROM warteliste WHERE email = $1 AND friseur_id = $2',
            [email, friseurId]
        );

        if (result.rows.length > 0) {
            // Wenn der Benutzer bereits auf der Warteliste steht, gebe eine Fehlermeldung zurück
            return res.status(400).json({
                message: 'Du bist bereits auf der Warteliste!'
            });
        }

        // Abrufen der Warteliste für den gewählten Friseur
        const wartelisteResult = await pool.query('SELECT * FROM warteliste WHERE friseur_id = $1', [friseurId]);
        const warteliste = wartelisteResult.rows;

        // Berechne die Wartezeit (jede Person braucht 20 Minuten)
        const wartezeit = warteliste.length * 20; // 20 Minuten pro Kunde

        // Füge den neuen Kunden zur Warteliste hinzu
        await pool.query(
            'INSERT INTO warteliste (kunde_name, friseur_id, wartezeit, email) VALUES ($1, $2, $3, $4)', 
            [name, friseurId, wartezeit, email]
        );

        // Antwort mit der berechneten Wartezeit
        res.json({
            message: 'Du wurdest erfolgreich zur Warteliste hinzugefügt.',
            daten: {
                name,
                friseurId,
                wartezeit: `${wartezeit} Minuten`,
                email
            }
        });
    } catch (error) {
        console.error('Fehler bei der Anfrage:', error);
        res.status(500).json({ message: 'Es gab einen Fehler. Bitte versuche es später erneut.' });
    }
});

// GET: Wartezeit abfragen
app.get('/api/wartezeit', async (req, res) => {
    const { friseurId } = req.query;

    try {
        const wartelisteResult = await pool.query('SELECT * FROM warteliste WHERE friseur_id = $1', [friseurId]);
        const warteliste = wartelisteResult.rows;

        // Berechne die Wartezeit (jede Person braucht 20 Minuten)
        const wartezeit = warteliste.length * 20; // 20 Minuten pro Person

        // Antwort mit der Wartezeit und der Anzahl der Personen
        res.json({
            wartezeit: `${wartezeit} Minuten`,
            personCount: warteliste.length
        });
    } catch (error) {
        console.error('Fehler bei der Berechnung der Wartezeit:', error);
        res.status(500).json({ message: 'Fehler bei der Berechnung der Wartezeit.' });
    }
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
