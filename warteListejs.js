
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

// Funktion zur Reduzierung der Wartezeit in der Warteliste const aktualisiereWartezeiten = async () => { try { // Reduziere die Wartezeit für alle Personen in der Warteliste um 1 Minute await pool.query( 'UPDATE warteliste SET wartezeit = wartezeit - 1 WHERE wartezeit > 0' ); } catch (error) { console.error('Fehler beim Aktualisieren der Wartezeiten:', error); } }; // Alle 60 Sekunden die Wartezeit um 1 Minute reduzieren setInterval(aktualisiereWartezeiten, 60000);

// POST: Anmeldung auf Warteliste
// POST: Anmeldung auf Warteliste
app.post('/api/anmelden', async (req, res) => {
    const { name, friseurId } = req.body;

    // Holen der Session-ID als eindeutigen Kunden-Identifier
    const kundeIdentifier = req.sessionID; // Verwenden der Session-ID als eindeutige Kunden-ID

    try {
        // Überprüfe, ob der Benutzer bereits auf der Warteliste für diesen Friseur steht
        const result = await pool.query(
            'SELECT * FROM warteliste WHERE kunde_identifier = $1 AND friseur_id = $2',
            [kundeIdentifier, friseurId]
        );

        if (result.rows.length > 0) {
            // Wenn der Benutzer bereits auf der Warteliste steht
            return res.status(400).json({
                message: 'Du bist bereits auf der Warteliste für diesen Friseur.'
            });
        }

        // Abrufen der Warteliste für den gewählten Friseur
        const wartelisteResult = await pool.query('SELECT * FROM warteliste WHERE friseur_id = $1', [friseurId]);
        const warteliste = wartelisteResult.rows;

        // Berechne die Wartezeit (jede Person braucht 20 Minuten)
        const wartezeit = warteliste.length * 20; // 20 Minuten pro Kunde

        // Füge den neuen Kunden zur Warteliste hinzu
        await pool.query(
            'INSERT INTO warteliste (kunde_name, friseur_id, wartezeit, kunde_identifier) VALUES ($1, $2, $3, $4)', 
            [name, friseurId, wartezeit, kundeIdentifier]
        );

        // Antwort mit der berechneten Wartezeit
        res.json({
            message: 'Daten erfolgreich empfangen',
            daten: {
                name,
                friseurId,
                wartezeit: `${wartezeit} Minuten`,
                kundeIdentifier
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

        res.json({
            wartezeit: `${wartezeit} Minuten`,
            personCount: warteliste.length
        });
    } catch (error) {
        console.error('Fehler bei der Berechnung der Wartezeit:', error);
        res.status(500).json({ message: 'Fehler bei der Berechnung der Wartezeit.' });
    }
});

// Alle 60 Sekunden die Wartezeiten automatisch aktualisieren
setInterval(async () => {
    const friseurId = document.getElementById("friseur").value;  // Hole die aktuelle Friseur-ID

    if (!friseurId) {
        console.error("Friseur-ID nicht ausgewählt.");
        return;  // Wenn keine Friseur-ID ausgewählt ist, nichts tun
    }

    try {
        const response = await fetch(`http://localhost:3000/api/wartezeiten?friseurId=${friseurId}`);
        if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Wartezeit');
        }

        const result = await response.json();
        document.getElementById("wartezeitAnzeige").innerText = "Aktualisierte Wartezeit: " + result.daten.wartezeit;
    } catch (error) {
        console.error("Fehler bei der Aktualisierung:", error);
    }
}, 60000); // Aktualisierung alle 60 Sekunden
