// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

// server.js (Backend)
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL Pool
const session = require('express-session');

// PostgreSQL Pool-Setup für Cloudflare-Datenbank
const pool = new Pool({
    database: 'momo',
});

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Session-Setup
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// POST: Anmeldung auf Warteliste
app.post('/api/anmelden', async (req, res) => {
    const { name, email, friseurId } = req.body;

    try {
        // Überprüfen, ob die E-Mail bereits für denselben Friseur auf der Warteliste steht
        const result = await pool.query(
            'SELECT * FROM warteliste WHERE email = $1 AND friseur_id = $2',
            [email, friseurId]
        );

        if (result.rows.length > 0) {
            return res.status(400).json({ message: 'Du bist bereits auf der Warteliste!' });
        }

        // Berechnung der Wartezeit
        const wartelisteResult = await pool.query('SELECT * FROM warteliste WHERE friseur_id = $1', [friseurId]);
        const wartezeit = wartelisteResult.rows.length * 20;

        // Kunde hinzufügen
        await pool.query(
            'INSERT INTO warteliste (kunde_name, friseur_id, wartezeit, email) VALUES ($1, $2, $3, $4)',
            [name, friseurId, wartezeit, email]
        );

        res.json({ message: 'Erfolgreich auf der Warteliste.', daten: { name, friseurId, wartezeit: `${wartezeit} Minuten` } });
    } catch (error) {
        console.error('Fehler bei der Anmeldung:', error);
        res.status(500).json({ message: 'Es gab einen Fehler. Bitte versuche es später erneut.' });
    }
});

// GET: Wartezeit abfragen
app.get('/api/wartezeit', async (req, res) => {
    const { friseurId } = req.query;

    try {
        const wartelisteResult = await pool.query('SELECT * FROM warteliste WHERE friseur_id = $1', [friseurId]);
        const wartezeit = wartelisteResult.rows.length * 20;
        res.json({ wartezeit: `${wartezeit} Minuten`, personCount: wartelisteResult.rows.length });
    } catch (error) {
        console.error('Fehler bei der Wartezeitabfrage:', error);
        res.status(500).json({ message: 'Fehler bei der Berechnung der Wartezeit.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

