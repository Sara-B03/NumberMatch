const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config(); // To use environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } // Required for Render
});

// 📥 Route to submit score
app.post('/submit', async (req, res) => {
    const { name, score } = req.body;

    if (!name || score == null) {
        return res.status(400).json({ error: 'Missing name or score' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO leaderboard (name, score) VALUES ($1, $2) RETURNING id',
            [name, score]
        );
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('❌ PostgreSQL Insert Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 📊 Route to get top scores
app.get('/leaderboard', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 10'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ PostgreSQL Fetch Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
