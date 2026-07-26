const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Endpoint to receive data from ESP32
app.post('/api/data', (req, res) => {
    const { sensor_id, temperature, vibration_x, vibration_y, vibration_z, status } = req.body;

    // Data validation and edge-case handling
    if (!sensor_id || typeof temperature !== 'number' || typeof vibration_x !== 'number' ||
        typeof vibration_y !== 'number' || typeof vibration_z !== 'number' || !status) {
        return res.status(400).json({ error: "Invalid or missing data fields." });
    }

    // Plausibility Check (reject physically impossible values)
    if (temperature < -50 || temperature > 1000) {
        return res.status(400).json({ error: "Temperature reading implausible." });
    }

    const query = `INSERT INTO sensor_data (sensor_id, temperature, vibration_x, vibration_y, vibration_z, status) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [sensor_id, temperature, vibration_x, vibration_y, vibration_z, status];

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
    const sensor_id = req.query.sensor_id;
    
    let query = `SELECT * FROM sensor_data`;
    let params = [];

    if (sensor_id) {
        query += ` WHERE sensor_id = ?`;
        params.push(sensor_id);
    }

    query += ` ORDER BY timestamp DESC LIMIT ?`;
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
