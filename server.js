const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = './database.json';

const readDB = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Transactions
app.get('/api/transactions', (req, res) => res.json(readDB()));

app.post('/api/transactions', (req, res) => {
    const db = readDB();
    const newEntry = { id: Date.now(), ...req.body };
    db.push(newEntry);
    writeDB(db);
    res.json(newEntry);
});

// Update Transaction (Edit)
app.put('/api/transactions/:id', (req, res) => {
    let db = readDB();
    const index = db.findIndex(t => t.id == req.params.id);
    if (index !== -1) {
        db[index] = { ...db[index], ...req.body };
        writeDB(db);
        res.json(db[index]);
    } else {
        res.status(404).json({ error: "Transaction not found" });
    }
});

app.delete('/api/transactions/:id', (req, res) => {
    let db = readDB();
    db = db.filter(t => t.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// AI Advisor - Dynamic Logic
app.post('/api/ai/chat', (req, res) => {
    const query = req.body.query?.toLowerCase() || "";
    const transactions = req.body.transactions || [];

    // Extract unique categories from actual transactions
    const existingCategories = [...new Set(transactions.map(t => t.category.toLowerCase()))];
    const foundCategory = existingCategories.find(cat => query.includes(cat));

    if (foundCategory) {
        const total = transactions
            .filter(t => t.category.toLowerCase() === foundCategory)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const firstTrans = transactions.find(t => t.category.toLowerCase() === foundCategory);
        const action = firstTrans.type === 'income' ? 'earned' : 'spent';
        
        return res.json({ reply: `You have ${action} a total of ₹${total} on ${foundCategory}.` });
    }

    if (query.includes("save") || query.includes("balance") || query.includes("status")) {
        let income = 0, expense = 0, piggy = 0;
        transactions.forEach(t => {
            if (t.type === "income") income += Number(t.amount);
            else if (t.type === "expense") expense += Number(t.amount);
            else if (t.type === "to_piggy") piggy += Number(t.amount);
        });
        return res.json({ reply: `Your current balance is ₹${income - expense - piggy}, and you've saved ₹${piggy} in your piggy bank.` });
    }

    res.json({ reply: "I can track any category you've added. Try asking about 'fees', 'travel', or 'salary'!" });
});

// AI Insights
app.post('/api/ai/insights', (req, res) => {
    const transactions = req.body.transactions || [];
    let inc = 0, exp = 0, savy = 0;
    transactions.forEach(t => {
        if (t.type === "income") inc += Number(t.amount);
        else if (t.type === "expense") exp += Number(t.amount);
        else if (t.type === "to_piggy") savy += Number(t.amount);
    });
    const analysis = `📊 Financial Summary:\n💰 Total Income: ₹${inc}\n💸 Total Expenses: ₹${exp}\n📦 Savings: ₹${savy}\n\n💡 Tip: Try saving 20% of your income!`;
    res.json({ analysis });
});

app.listen(3000, () => console.log("✅ Server running at http://localhost:3000"));