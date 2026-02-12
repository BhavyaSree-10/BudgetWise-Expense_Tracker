const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: '127.0.0.1', 
    user: 'root',
    password: 'Root@321', 
    database: 'budgetwise'
});

db.connect(err => {
    if (err) console.error('MySQL Failed:', err.message);
    else console.log('✅ MySQL Connected');
});

app.get('/api/transactions', (req, res) => {
    db.query('SELECT * FROM transactions ORDER BY date DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/transactions', (req, res) => {
    const { date, category, description, amount, type } = req.body;
    const sql = 'INSERT INTO transactions (date, category, description, amount, type) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [date, category, description, amount, type], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId });
    });
});

app.delete('/api/transactions/:id', (req, res) => {
    db.query('DELETE FROM transactions WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Deleted" });
    });
});

app.listen(3000, () => console.log('🚀 Server at http://localhost:3000'));