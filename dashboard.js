const API_URL = 'http://localhost:3000/api/transactions';
let financeData = []; 
let trendChart, categoryChart;
let isEditing = false;

document.addEventListener("DOMContentLoaded", () => {
    loadFromDatabase();
    loadSettings();
    
    // Set Date Restriction (Max = Today)
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("transDate");
    if(dateInput) dateInput.setAttribute("max", today);

    const dateEl = document.getElementById("liveDate");
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById("addEntryBtn")?.addEventListener("click", handleDataAction);
    document.getElementById("runAnalysisBtn")?.addEventListener("click", runAIInsights);
    document.getElementById("sendChatBtn")?.addEventListener("click", sendAIChat);
});

// --- UI UPDATES & BUDGET LOGIC ---
function updateUI() {
    let inc = 0, exp = 0, pgy = 0;
    financeData.forEach(item => {
        const a = Number(item.amount);
        if (item.type === 'income') inc += a;
        else if (item.type === 'expense') exp += a;
        else if (item.type === 'to_piggy') pgy += a;
    });

    document.getElementById("balanceDisplay").innerText = `₹${inc - exp - pgy}`;
    document.getElementById("incomeDisplay").innerText = `₹${inc}`;
    document.getElementById("expenseDisplay").innerText = `₹${exp}`;
    document.getElementById("savingsDisplay").innerText = `₹${pgy}`;

    const recentActivity = document.getElementById("recentActivityList");
    if (recentActivity) {
        recentActivity.innerHTML = [...financeData].reverse().slice(0, 4).map(item => `
            <tr style="border-bottom: 1px solid #222;">
                <td style="padding: 10px 0;">${item.description}</td>
                <td style="text-align: right; color: ${item.type === 'income' ? '#10b981' : '#f43f5e'}">₹${item.amount}</td>
            </tr>
        `).join('') || '<tr><td>No recent activity</td></tr>';
    }

    const budgetLimit = Number(localStorage.getItem("userBudget")) || 0;
    const budgetBar = document.getElementById("budgetBar");
    const budgetStatus = document.getElementById("budgetStatusText");
    const budgetWarning = document.getElementById("budgetWarning");

    if (budgetLimit > 0 && budgetBar) {
        const usage = (exp / budgetLimit) * 100;
        budgetBar.style.width = `${Math.min(usage, 100)}%`;
        budgetStatus.innerText = `₹${exp} / ₹${budgetLimit}`;
        budgetBar.className = "progress-bar";
        if (usage > 90) { budgetBar.classList.add("bg-danger"); budgetWarning.innerText = "🚨 Budget Exceeded!"; }
        else if (usage > 70) { budgetBar.classList.add("bg-warning"); budgetWarning.innerText = "⚠️ Approaching Limit"; }
        else { budgetBar.classList.add("bg-safe"); budgetWarning.innerText = "✅ Within Budget"; }
    }

    const sGoal = Math.min((pgy / 100000) * 100, 100);
    const goalBar = document.getElementById("goalBar");
    if(goalBar) {
        goalBar.style.width = `${sGoal}%`;
        document.getElementById("goalPercent").innerText = `${Math.round(sGoal)}%`;
    }
}

// --- CORE NAVIGATION ---
function showSection(id, title) {
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hide'));
    document.getElementById(id).classList.remove('hide');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    // Update Dynamic Header
    document.getElementById("sectionTitle").innerHTML = title;

    if (id === 'ai-advisor') {
        const name = localStorage.getItem("displayName") || "BHAVYA";
        document.getElementById("chatBox").innerHTML = `<div class="ai-msg" style="background:#2a2a40; padding:10px; border-radius:10px; margin-bottom:10px;"><b>BudgetWise:</b> Heyy ${name}! Need help with your budget?</div>`;
    }
    if (id === 'reports') initCharts();
}

// --- API ACTIONS ---
async function loadFromDatabase() {
    try {
        const response = await fetch(API_URL);
        financeData = await response.json();
        renderTable();
        updateUI();
    } catch (e) { console.error("Database connection error"); }
}

function renderTable() {
    const list = document.getElementById("expenseList");
    if (!list) return;
    list.innerHTML = financeData.map(item => `
        <tr>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td><span class="badge" style="background:#222; padding:3px 8px; border-radius:4px;">${item.category}</span></td>
            <td>${item.description}</td>
            <td style="color:${item.type==='income'?'#10b981':'#f43f5e'}">₹${item.amount}</td>
            <td>${item.type}</td>
            <td>
                <button onclick="editItem(${item.id})" class="btn-edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteItem(${item.id})" class="btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Combined Save/Update logic
async function handleDataAction() {
    const id = document.getElementById("editId").value;
    const payload = { 
        date: document.getElementById("transDate").value,
        category: document.getElementById("transCategory").value,
        description: document.getElementById("transName").value,
        amount: Number(document.getElementById("transAmount").value),
        type: document.getElementById("transType").value 
    };

    if(!payload.description || !payload.amount || !payload.date) {
        alert("Please fill all fields");
        return;
    }

    if (isEditing) {
        await fetch(`${API_URL}/${id}`, { 
            method: 'PUT', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(payload) 
        });
        resetForm();
    } else {
        await fetch(API_URL, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(payload) 
        });
    }
    loadFromDatabase();
}

function editItem(id) {
    const item = financeData.find(t => t.id === id);
    if(!item) return;

    document.getElementById("editId").value = item.id;
    document.getElementById("transName").value = item.description;
    document.getElementById("transAmount").value = item.amount;
    document.getElementById("transDate").value = item.date.split('T')[0];
    document.getElementById("transCategory").value = item.category;
    document.getElementById("transType").value = item.type;

    document.getElementById("addEntryBtn").innerText = "Update Entry";
    isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById("editId").value = "";
    document.getElementById("transName").value = "";
    document.getElementById("transAmount").value = "";
    document.getElementById("transDate").value = "";
    document.getElementById("addEntryBtn").innerText = "Add Entry";
    isEditing = false;
}

async function deleteItem(id) {
    if(confirm("Delete this entry?")) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadFromDatabase();
    }
}

// --- SETTINGS & MISC ---
function loadSettings() {
    const name = localStorage.getItem("displayName") || "BHAVYA";
    const budget = localStorage.getItem("userBudget") || "";
    document.getElementById("topName").innerText = name.toUpperCase();
    document.getElementById("profileNameDisplay").innerText = name.toUpperCase();
    document.getElementById("editDisplayName").value = name;
    document.getElementById("budgetLimitInput").value = budget;
    const pic = localStorage.getItem("profilePic");
    if(pic) {
        document.getElementById("profilePicBig").src = pic;
        document.getElementById("navProfilePic").src = pic;
    }
}

function updateSettings() {
    localStorage.setItem("displayName", document.getElementById("editDisplayName").value);
    localStorage.setItem("userBudget", document.getElementById("budgetLimitInput").value);
    loadSettings();
    updateUI();
    alert("Profile Updated!");
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = () => { localStorage.setItem("profilePic", reader.result); loadSettings(); };
    reader.readAsDataURL(event.target.files[0]);
}

async function runAIInsights() {
    const content = document.getElementById("insightsContent");
    content.innerHTML = "Analysing your finances...";
    const res = await fetch('http://localhost:3000/api/ai/insights', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({transactions:financeData})});
    const data = await res.json();
    content.innerHTML = `<div style="white-space: pre-line;">${data.analysis}</div>`;
}

async function sendAIChat() {
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");
    if(!input.value.trim()) return;
    chatBox.innerHTML += `<div class="user-msg" style="align-self:flex-end; background:#6366f1; padding:10px; border-radius:10px; margin-bottom:10px; color:white; margin-left:20%;"><b>You:</b> ${input.value}</div>`;
    const res = await fetch('http://localhost:3000/api/ai/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({query:input.value, transactions:financeData})});
    const data = await res.json();
    chatBox.innerHTML += `<div class="ai-msg" style="background:#2a2a40; padding:10px; border-radius:10px; margin-bottom:10px; margin-right:20%;"><b>BudgetWise:</b> ${data.reply}</div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
}

function initCharts() {
    const ctxTrend = document.getElementById('trendChart')?.getContext('2d');
    const ctxCat = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctxTrend) return;
    if (trendChart) trendChart.destroy();
    if (categoryChart) categoryChart.destroy();

    const sorted = [...financeData].sort((a,b) => new Date(a.date) - new Date(b.date));
    let bal = 0;
    const labels = sorted.map(d => new Date(d.date).toLocaleDateString());
    const dataPoints = sorted.map(d => { bal += (d.type === 'income' ? Number(d.amount) : -Number(d.amount)); return bal; });

    trendChart = new Chart(ctxTrend, { type: 'line', data: { labels, datasets: [{ label: 'Balance Trend', data: dataPoints, borderColor: '#6366f1', tension: 0.4 }] } });
    const cats = {};
    financeData.filter(t => t.type === 'expense').forEach(t => cats[t.category] = (cats[t.category] || 0) + Number(t.amount));
    categoryChart = new Chart(ctxCat, { type: 'doughnut', data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: ['#6366f1','#10b981','#f43f5e','#f59e0b'] }] } });
}

function logout() { window.location.href = "login.html"; }