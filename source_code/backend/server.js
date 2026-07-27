const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Endpoint to receive data from ESP32
app.post('/api/data', (req, res) => {
    const { machine_id, vibration, temperature, alert_flag } = req.body;

    // Data validation and edge-case handling
    // Temperature can be missing or empty for our missing value anomaly
    if (!machine_id || typeof vibration !== 'number' || !alert_flag) {
        return res.status(400).json({ error: "Invalid or missing data fields." });
    }

    // Plausibility Check (reject physically impossible values)
    if (temperature !== undefined && temperature !== null && temperature !== "" && (temperature < -50 || temperature > 1000)) {
        return res.status(400).json({ error: "Temperature reading implausible." });
    }

    const query = `INSERT INTO sensor_data (machine_id, vibration, temperature, alert_flag) 
                   VALUES (?, ?, ?, ?)`;
    const params = [machine_id, vibration, temperature, alert_flag];

    db.run(query, params, function(err) {
        if (err) {
            console.error("Error inserting data:", err.message);
            return res.status(500).json({ error: "Database error." });
        }
        res.status(201).json({ message: "Data received", id: this.lastID });
    });
});

// API Endpoint to fetch historical data for the frontend dashboard
app.get('/api/data', (req, res) => {
    // Optional filtering query parameters
    const limit = req.query.limit || 100;
    const machine_id = req.query.machine_id;
    
    let query = `SELECT * FROM sensor_data`;
    let params = [];

    if (machine_id) {
        query += ` WHERE machine_id = ?`;
        params.push(machine_id);
    }

    query += ` ORDER BY recorded_at DESC LIMIT ?`;
    params.push(limit);

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Error fetching data:", err.message);
            return res.status(500).json({ error: "Database error." });
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
