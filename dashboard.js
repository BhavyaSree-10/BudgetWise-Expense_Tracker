const API_URL = 'http://localhost:3000/api/transactions';
let financeData = []; 
let trendChart, pieChart;
let notificationCount = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadFromDatabase();
    loadSavedProfile();

    // Set Live Date
    const dateEl = document.getElementById("liveDate");
    if (dateEl) {
        dateEl.innerText = new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Handle Profile Image Upload
    const imgInput = document.getElementById("imageUpload");
    if (imgInput) {
        imgInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => saveProfilePic(event.target.result);
                reader.readAsDataURL(file);
            }
        });
    }

    document.getElementById("addEntryBtn").addEventListener("click", saveData);
});

// --- NOTIFICATION SYSTEM (Matches image_1b1cfb.png) ---
function toggleNotifications() {
    const panel = document.getElementById("notifPanel");
    if (!panel) return;
    panel.classList.toggle("hide");
    if (!panel.classList.contains("hide")) {
        notificationCount = 0;
        const badge = document.getElementById("notifCount");
        if (badge) badge.style.display = "none";
    }
}

function addNotification(msg, type) {
    const list = document.getElementById("notifList");
    const badge = document.getElementById("notifCount");
    
    if (notificationCount === 0 && list) list.innerHTML = "";

    notificationCount++;
    const color = type === 'danger' ? '#f43f5e' : '#f59e0b';
    
    const notifHtml = `
        <div class="notif-item" style="border-left: 4px solid ${color}; background: #252538; padding: 10px; margin-bottom: 8px; border-radius: 4px;">
            <p style="margin:0; color:white; font-size: 0.85rem;">${msg}</p>
            <small style="color: #888;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
        </div>
    `;

    if (list) list.insertAdjacentHTML('afterbegin', notifHtml);
    if (badge) {
        badge.innerText = notificationCount;
        badge.style.display = "block";
    }
}

// --- AI ADVISOR (Fixes image_19b118.png repetition) ---
function sendMessage() {
    const input = document.getElementById('aiInput');
    const container = document.getElementById('chatContainer');
    const query = input.value.toLowerCase().trim();
    
    if (!query) return;

    // Display User Message
    const userDiv = document.createElement('div');
    userDiv.style = "background: #4b5563; padding: 12px; border-radius: 15px 15px 0 15px; align-self: flex-end; max-width: 80%; color: white; margin-bottom: 10px;";
    userDiv.innerText = input.value;
    container.appendChild(userDiv);

    // AI Logic based on data
    setTimeout(() => {
        const aiDiv = document.createElement('div');
        aiDiv.style = "background: #312e81; padding: 12px; border-radius: 15px 15px 15px 0; align-self: flex-start; max-width: 80%; color: white; margin-bottom: 10px;";
        
        const totalInc = financeData.filter(d => d.type === 'income').reduce((s, d) => s + Number(d.amount), 0);
        const totalExp = financeData.filter(d => d.type === 'expense').reduce((s, d) => s + Number(d.amount), 0);
        const foodExp = financeData.filter(d => d.category === 'Food').reduce((s, d) => s + Number(d.amount), 0);
        const balance = totalInc - totalExp;

        let response = "I'm ready to analyze your spending. What would you like to know?";

        if (query.includes("hello") || query.includes("hi")) {
            response = "Hello Bhavya! I'm your AI BudgetWise Assistant. Ask me anything about your spending!";
        } else if (query.includes("food")) {
            response = `I've analyzed your data. You have spent ₹${foodExp} on Food so far.`;
        } else if (query.includes("balance") || query.includes("how much do i have")) {
            response = `Your current available balance is ₹${balance}.`;
        } else if (query.includes("income")) {
            response = `Your total recorded income is ₹${totalInc}.`;
        } else {
            response = "I can help with balance, income, or specific category totals like Food.";
        }

        aiDiv.innerText = response;
        container.appendChild(aiDiv);
        container.scrollTop = container.scrollHeight;
    }, 600);

    input.value = '';
}

// --- ANALYTICS (Matches image_19cf84.jpg and image_1a28c3.png) ---
function renderCharts() {
    const ctxStock = document.getElementById('stockTrendChart');
    const ctxPie = document.getElementById('percentagePieChart');

    if (!ctxStock || !ctxPie) return; // Stop if elements aren't loaded

    if (trendChart) trendChart.destroy();
    if (pieChart) pieChart.destroy();

    // 1. Calculate Summary Cards
    const expenseData = financeData.filter(d => d.type === 'expense');
    const totalExp = expenseData.reduce((s, d) => s + Number(d.amount), 0);
    
    const totalSpendingEl = document.getElementById('totalSpendingYear');
    const dailyAvgEl = document.getElementById('dailyAverage');
    
    if (totalSpendingEl) totalSpendingEl.innerText = `₹${totalExp.toFixed(2)}`;
    if (dailyAvgEl) dailyAvgEl.innerText = `₹${(totalExp / 30).toFixed(2)}`;

    // 2. Stock Market Style Trend Graph
    const gradient = ctxStock.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    trendChart = new Chart(ctxStock, {
        type: 'line',
        data: {
            labels: financeData.map(d => new Date(d.date).toLocaleDateString()).reverse(),
            datasets: [{
                label: 'Spending',
                data: financeData.map(d => d.amount).reverse(),
                borderColor: '#6366f1',
                borderWidth: 3,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4, 
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                x: { grid: { display: false }, ticks: { color: '#888' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 3. Percentage Pie Chart
    const cats = [...new Set(expenseData.map(d => d.category))];
    const values = cats.map(c => expenseData.filter(d => d.category === c).reduce((s, d) => s + Number(d.amount), 0));

    pieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: cats,
            datasets: [{
                data: values,
                backgroundColor: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'],
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const val = context.raw;
                            const percent = ((val / totalExp) * 100).toFixed(1);
                            return ` ₹${val} (${percent}%)`;
                        }
                    }
                },
                legend: { position: 'bottom', labels: { color: '#ccc' } }
            },
            cutout: '70%'
        }
    });
}

// --- CORE DATA LOGIC ---
async function loadFromDatabase() {
    try {
        const response = await fetch(API_URL);
        financeData = await response.json();
        renderTable();
        updateUI();
        // Automatically render charts if the user is on the reports tab
        if (!document.getElementById('reports').classList.contains('hide')) renderCharts();
    } catch (e) { console.error("Database error", e); }
}

function updateUI() {
    let inc = 0, exp = 0, pgy = 0;
    financeData.forEach(item => {
        const a = Number(item.amount);
        if (item.type === 'income') inc += a;
        else if (item.type === 'expense') exp += a;
        else if (item.type === 'to_piggy') pgy += a;
    });
    
    const balance = inc - exp - pgy;
    const balDisp = document.getElementById("balanceDisplay");
    const incDisp = document.getElementById("incomeDisplay");
    const expDisp = document.getElementById("expenseDisplay");
    const savDisp = document.getElementById("savingsDisplay");

    if (balDisp) balDisp.innerText = `₹${balance}`;
    if (incDisp) incDisp.innerText = `₹${inc}`;
    if (expDisp) expDisp.innerText = `₹${exp}`;
    if (savDisp) savDisp.innerText = `₹${pgy}`;

    // Auto-Alert Notifications
    if (exp > inc && inc > 0) addNotification("Critical: Expenses exceed income!", "danger");
    else if (balance < (inc * 0.1) && inc > 0) addNotification("Low Balance Warning!", "warning");
}

async function saveData() {
    const id = document.getElementById("editId").value;
    const payload = {
        date: document.getElementById("transDate").value,
        category: document.getElementById("transCategory").value,
        description: document.getElementById("transName").value,
        amount: Number(document.getElementById("transAmount").value),
        type: document.getElementById("transType").value
    };

    if (!payload.description || !payload.amount) return alert("Please fill all fields!");

    const url = id ? `${API_URL}/${id}` : API_URL;
    await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    document.getElementById("editId").value = "";
    loadFromDatabase();
}

function renderTable() {
    const list = document.getElementById("expenseList");
    if (!list) return;
    list.innerHTML = financeData.map(item => `
        <tr>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td><span class="badge">${item.category}</span></td>
            <td>${item.description}</td>
            <td style="color:${item.type==='income'?'#10b981':'#f43f5e'}">₹${item.amount}</td>
            <td>${item.type}</td>
            <td><button onclick="deleteItem(${item.id})">🗑️</button></td>
        </tr>
    `).join('');
}

function showSection(id) {
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hide'));
    document.getElementById(id).classList.remove('hide');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    
    // Crucial: Run chart logic when switching to reports
    if (id === 'reports') renderCharts();
}

async function deleteItem(id) {
    if(confirm("Are you sure?")) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadFromDatabase();
    }
}

function saveProfilePic(base64) {
    localStorage.setItem("userAvatar", base64);
    loadSavedProfile();
}

function loadSavedProfile() {
    const savedPic = localStorage.getItem("userAvatar");
    if (savedPic) {
        const navPic = document.getElementById("navProfilePic");
        const bigPic = document.getElementById("profilePicBig");
        if (navPic) navPic.src = savedPic;
        if (bigPic) bigPic.src = savedPic;
    }
}

function logout() { window.location.href = "login.html"; }