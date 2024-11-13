// app.js
const express = require('express');
const app = express();
const cors = require('cors');

// Middleware für CORS und JSON-Parsing
app.use(cors());
app.use(express.json());  // Hiermit wird der Body der Anfrage automatisch als JSON geparsed

app.post('/api/anmelden', (req, res) => {
    const name = req.body.name;  // Hier greifst du auf die Daten zu, die im Body der Anfrage gesendet wurden

    if (name) {
        res.json({
            message: "Daten erfolgreich empfangen",
            daten: {
                name: name
            }
        });
    } else {
        res.status(400).json({
            message: "Kein Name gesendet"
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

