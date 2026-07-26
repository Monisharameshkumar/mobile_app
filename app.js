/* ==========================================================================
   FAMILY SAVINGS ACCOUNT - STANDALONE APP ENGINE & NOTIFICATION LOGIC
   ========================================================================== */

const MEMBER_COLORS = ["#16704A", "#2E4E8C", "#B8860B", "#B54B3F", "#1D8577", "#7B4B8A"];
const CATEGORY_COLORS = ["#16704A", "#2E4E8C", "#B8860B", "#B54B3F", "#1D8577", "#7B4B8A", "#6B8F63", "#4E6E9C"];

const uid = () => Math.random().toString(36).slice(2, 10);

const formatINR = (n) => {
    const num = Math.round(Number(n) || 0);
    return "₹" + num.toLocaleString("en-IN");
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthLabel = () => new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

// --- Seed Data & State ---
function getInitialData() {
    const m1 = { id: 'm1', name: "Rajan", role: "Father", income: 50000 };
    const m2 = { id: 'm2', name: "Priya", role: "Mother", income: 30000 };
    const m3 = { id: 'm3', name: "Arjun", role: "Son", income: 8000 };
    return {
        members: [m1, m2, m3],
        expenses: [
            { id: 'e1', category: "Groceries", amount: 7000, paidBy: m2.id, date: todayISO(), notes: "Reliance Fresh" },
            { id: 'e2', category: "Electricity", amount: 1800, paidBy: m1.id, date: todayISO(), notes: "TNEB Bill" },
            { id: 'e3', category: "Petrol", amount: 3500, paidBy: m1.id, date: todayISO(), notes: "Car fuel" },
            { id: 'e4', category: "Milk", amount: 1500, paidBy: m2.id, date: todayISO(), notes: "Aavin milk" },
        ],
        goals: [
            { id: 'g1', name: "Vacation", target: 60000, saved: 18000, deadline: "2026-12-01" },
            { id: 'g2', name: "Emergency fund", target: 150000, saved: 62000, deadline: "2027-03-01" },
        ],
        reminders: [
            { id: 'r1', title: 'TNEB Electricity Bill', amount: 1800, dueDate: '2026-08-05', status: 'Pending' },
            { id: 'r2', title: 'Indane Gas Cylinder', amount: 1200, dueDate: '2026-08-08', status: 'Pending' },
            { id: 'r3', title: 'Airtel Fiber Broadband', amount: 900, dueDate: '2026-08-10', status: 'Pending' },
            { id: 'r4', title: 'Children School Fees', amount: 8000, dueDate: '2026-08-15', status: 'Pending' },
            { id: 'r5', title: 'Home Loan EMI', amount: 12500, dueDate: '2026-08-20', status: 'Pending' }
        ]
    };
}

let state = JSON.parse(localStorage.getItem('FAMILY_SAVINGS_EXACT_STATE')) || getInitialData();

function saveState() {
    localStorage.setItem('FAMILY_SAVINGS_EXACT_STATE', JSON.stringify(state));
    renderApp();
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentMonthLabel').innerText = monthLabel();
    const today = todayISO();
    if (document.getElementById('eDate')) document.getElementById('eDate').value = today;
    if (document.getElementById('gDeadline')) document.getElementById('gDeadline').value = '2026-12-01';
    if (document.getElementById('rDueDate')) document.getElementById('rDueDate').value = '2026-08-05';

    requestNotificationPermission();
    renderApp();
});

// --- System Push Notification Engine ---
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

function sendSystemNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            });
        } catch (e) {
            console.log('Notification error:', e);
        }
    }
    alert(`${title}\n${body}`);
}

// --- Master Render Function ---
function renderApp() {
    const totalIncome = state.members.reduce((s, m) => s + Number(m.income || 0), 0);
    const totalExpense = state.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const savings = totalIncome - totalExpense;
    const savingsPct = totalIncome > 0 ? Math.max(0, Math.round((savings / totalIncome) * 100)) : 0;
    const healthScore = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round(45 + savingsPct * 1.1))) : 0;

    // 1. Dashboard Gauge & Metrics
    updateHealthGauge(healthScore);
    document.getElementById('valFamilyBalance').innerText = formatINR(savings);
    document.getElementById('valSavingsRate').innerText = `${savingsPct}%`;
    document.getElementById('valMonthlyIncome').innerText = formatINR(totalIncome);
    document.getElementById('valMonthlyExpense').innerText = formatINR(totalExpense);

    // 2. Render Ledger
    renderLedger(totalIncome);

    // 3. Render Dashboard Charts
    renderCategoryChart();
    renderIncomeVsExpenseChart(totalIncome, totalExpense);

    // 4. Render Members List
    renderMembersList();

    // 5. Render Expenses List
    renderExpensesList();

    // 6. Render Goals List
    renderGoalsList();

    // 7. Render Reminders List
    renderRemindersList();

    // 8. Render Notifications Modal List
    renderNotifModalList();

    if (window.lucide) lucide.createIcons();
}

// --- Health Gauge Arc ---
function updateHealthGauge(score) {
    document.getElementById('gaugeScoreText').innerText = score;
    const label = score >= 70 ? "Healthy" : score >= 40 ? "Watch spending" : "At risk";
    const labelEl = document.getElementById('healthStatusLabel');
    labelEl.innerText = label;
    labelEl.style.color = score >= 70 ? "#16704A" : score >= 40 ? "#B8860B" : "#B54B3F";

    const pathEl = document.getElementById('gaugeArcPath');
    const color = score >= 70 ? "#16704A" : score >= 40 ? "#B8860B" : "#B54B3F";
    pathEl.setAttribute('stroke', color);

    const pct = Math.max(0, Math.min(100, score));
    const angle = (pct / 100) * 180;
    const r = 70, cx = 90, cy = 90;
    const rad = (Math.PI * (180 - angle)) / 180;
    const ex = cx + r * Math.cos(rad);
    const ey = cy - r * Math.sin(rad);
    const largeArc = angle > 180 ? 1 : 0;
    pathEl.setAttribute('d', `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`);
}

// --- Family Contribution Ledger ---
function renderLedger(totalIncome) {
    const barContainer = document.getElementById('ledgerBarContainer');
    const legendContainer = document.getElementById('ledgerLegendContainer');

    if (!barContainer || !legendContainer) return;

    if (state.members.length === 0 || totalIncome === 0) {
        barContainer.innerHTML = '<div style="font-size:12.5px; color:#5B6960; padding:4px;">Add family members with income to see the ledger.</div>';
        legendContainer.innerHTML = '';
        return;
    }

    barContainer.innerHTML = state.members.map((m, i) => {
        const pct = Math.round((m.income / totalIncome) * 100);
        return `<div class="ledger-segment" style="width: ${pct}%; background: ${MEMBER_COLORS[i % MEMBER_COLORS.length]};"></div>`;
    }).join('');

    legendContainer.innerHTML = state.members.map((m, i) => {
        const pct = Math.round((m.income / totalIncome) * 100);
        return `
            <div class="legend-item">
                <span class="legend-dot" style="background: ${MEMBER_COLORS[i % MEMBER_COLORS.length]};"></span>
                <span class="legend-name">${m.name}</span>
                <span class="legend-pct">${pct}%</span>
            </div>
        `;
    }).join('');
}

// --- Charts Engine ---
let catChartInstance = null;
let barChartInstance = null;

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChartCanvas');
    if (!ctx) return;

    const catTotals = {};
    state.expenses.forEach(e => {
        catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount || 0);
    });

    const labels = Object.keys(catTotals);
    const dataVals = Object.values(catTotals);

    if (catChartInstance) catChartInstance.destroy();
    catChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataVals,
                backgroundColor: CATEGORY_COLORS,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { font: { family: 'Inter', size: 11 }, color: '#5B6960' } }
            }
        }
    });
}

function renderIncomeVsExpenseChart(income, expense) {
    const ctx = document.getElementById('incomeVsExpenseCanvas');
    if (!ctx) return;

    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#16704A', '#B54B3F'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#5B6960', font: { family: 'Inter' } } },
                y: { grid: { color: '#E6ECE5' }, ticks: { color: '#5B6960', font: { family: 'Inter' } } }
            }
        }
    });
}

// --- Members List ---
function renderMembersList() {
    const container = document.getElementById('membersListContainer');
    if (!container) return;

    container.innerHTML = state.members.map((m, i) => {
        const initials = m.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase();
        return `
            <div class="card item-card">
                <div class="avatar-circle" style="background: ${MEMBER_COLORS[i % MEMBER_COLORS.length]};">${initials}</div>
                <div class="item-info">
                    <div class="item-title">${m.name}</div>
                    <div class="item-sub">${m.role}</div>
                </div>
                <div class="item-amount amount-green">${formatINR(m.income)}</div>
                <button class="trash-btn" onclick="removeMember('${m.id}')"><i data-lucide="trash-2"></i></button>
            </div>
        `;
    }).join('');
}

function removeMember(id) {
    state.members = state.members.filter(m => m.id !== id);
    saveState();
}

function showAddMemberForm() { document.getElementById('addMemberCard').style.display = 'block'; }
function hideAddMemberForm() { document.getElementById('addMemberCard').style.display = 'none'; }

function handleAddMember() {
    const name = document.getElementById('mName').value.trim();
    const role = document.getElementById('mRole').value;
    const income = Number(document.getElementById('mIncome').value || 0);

    if (!name || !income) return;

    state.members.push({ id: uid(), name, role, income });
    saveState();
    hideAddMemberForm();
    document.getElementById('mName').value = '';
    document.getElementById('mIncome').value = '';
}

// --- Expenses List ---
function renderExpensesList() {
    const container = document.getElementById('expensesListContainer');
    const selectPaidBy = document.getElementById('ePaidBy');
    if (!container) return;

    if (selectPaidBy) {
        selectPaidBy.innerHTML = state.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    container.innerHTML = state.expenses.map(e => {
        const paidByName = state.members.find(m => m.id === e.paidBy)?.name || "Unknown";
        return `
            <div class="card item-card">
                <div class="item-info">
                    <div class="item-title">${e.category}</div>
                    <div class="item-sub">Paid by ${paidByName} • ${e.date}</div>
                    ${e.notes ? `<div class="item-notes">${e.notes}</div>` : ''}
                </div>
                <div class="item-amount amount-rose">-${formatINR(e.amount)}</div>
                <button class="trash-btn" onclick="removeExpense('${e.id}')"><i data-lucide="trash-2"></i></button>
            </div>
        `;
    }).join('');
}

function removeExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
}

function showAddExpenseForm() { document.getElementById('addExpenseCard').style.display = 'block'; }
function hideAddExpenseForm() { document.getElementById('addExpenseCard').style.display = 'none'; }

function handleAddExpense() {
    const category = document.getElementById('eCategory').value;
    const amount = Number(document.getElementById('eAmount').value);
    const paidBy = document.getElementById('ePaidBy').value;
    const date = document.getElementById('eDate').value || todayISO();
    const notes = document.getElementById('eNotes').value;

    if (!amount || !paidBy) return;

    state.expenses.unshift({ id: uid(), category, amount, paidBy, date, notes });
    saveState();
    hideAddExpenseForm();
    document.getElementById('eAmount').value = '';
    document.getElementById('eNotes').value = '';
}

// --- Goals List ---
function renderGoalsList() {
    const container = document.getElementById('goalsListContainer');
    if (!container) return;

    container.innerHTML = state.goals.map(g => {
        const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
        const color = pct >= 100 ? "#16704A" : "#B8860B";
        return `
            <div class="card goal-card-box">
                <div class="goal-top-row">
                    <div>
                        <div class="item-title">${g.name}</div>
                        ${g.deadline ? `<div class="item-sub">📅 ${g.deadline}</div>` : ''}
                    </div>
                    <button class="trash-btn" onclick="removeGoal('${g.id}')"><i data-lucide="trash-2"></i></button>
                </div>
                <div class="goal-progress-bg">
                    <div class="goal-progress-fill" style="width: ${pct}%; background: ${color};"></div>
                </div>
                <div class="goal-bottom-row">
                    <span class="goal-stats">${formatINR(g.saved)} of ${formatINR(g.target)} • ${pct}%</span>
                    <button class="bump-btn" onclick="bumpGoal('${g.id}', 1000)">+₹1000</button>
                </div>
            </div>
        `;
    }).join('');
}

function bumpGoal(id, delta) {
    const g = state.goals.find(x => x.id === id);
    if (g) {
        g.saved = Math.max(0, g.saved + delta);
        saveState();
    }
}

function removeGoal(id) {
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
}

function showAddGoalForm() { document.getElementById('addGoalCard').style.display = 'block'; }
function hideAddGoalForm() { document.getElementById('addGoalCard').style.display = 'none'; }

function handleAddGoal() {
    const name = document.getElementById('gName').value.trim();
    const target = Number(document.getElementById('gTarget').value);
    const saved = Number(document.getElementById('gSaved').value || 0);
    const deadline = document.getElementById('gDeadline').value;

    if (!name || !target) return;

    state.goals.push({ id: uid(), name, target, saved, deadline });
    saveState();
    hideAddGoalForm();
    document.getElementById('gName').value = '';
    document.getElementById('gTarget').value = '';
    document.getElementById('gSaved').value = '';
}

// --- Reminders List ---
function renderRemindersList() {
    const container = document.getElementById('remindersListContainer');
    if (!container) return;

    container.innerHTML = state.reminders.map(r => `
        <div class="card item-card">
            <div class="item-info">
                <div class="item-title">${r.title}</div>
                <div class="item-sub">Due Date: <strong>${r.dueDate}</strong></div>
            </div>
            <div class="item-amount amount-rose">${formatINR(r.amount)}</div>
            <button class="bump-btn" onclick="triggerAlert('${r.title}', '${r.amount}', '${r.dueDate}')">🔔 Alert</button>
            <button class="trash-btn" onclick="removeReminder('${r.id}')"><i data-lucide="trash-2"></i></button>
        </div>
    `).join('');
}

function triggerAlert(title, amount, dueDate) {
    sendSystemNotification(`⚡ Reminder: ${title}`, `Amount ${formatINR(amount)} is due on ${dueDate}. Please pay on time!`);
}

function removeReminder(id) {
    state.reminders = state.reminders.filter(r => r.id !== id);
    saveState();
}

function showAddReminderForm() { document.getElementById('addReminderCard').style.display = 'block'; }
function hideAddReminderForm() { document.getElementById('addReminderCard').style.display = 'none'; }

function handleAddReminder() {
    const title = document.getElementById('rTitle').value.trim();
    const amount = Number(document.getElementById('rAmount').value);
    const dueDate = document.getElementById('rDueDate').value;

    if (!title || !amount) return;

    state.reminders.push({ id: uid(), title, amount, dueDate, status: 'Pending' });
    saveState();
    hideAddReminderForm();
    document.getElementById('rTitle').value = '';
    document.getElementById('rAmount').value = '';
}

// --- Notifications Modal Drawer ---
function openNotifModal() { document.getElementById('notifModalBackdrop').classList.add('active'); }
function closeNotifModal() { document.getElementById('notifModalBackdrop').classList.remove('active'); }

function renderNotifModalList() {
    const container = document.getElementById('notifModalList');
    if (!container) return;

    container.innerHTML = state.reminders.map(r => `
        <div class="notif-card-item urgent">
            <i data-lucide="bell" class="notif-card-icon"></i>
            <div>
                <div class="notif-card-title">${r.title}</div>
                <div class="notif-card-body">Amount: <strong>${formatINR(r.amount)}</strong> • Due: ${r.dueDate}</div>
            </div>
        </div>
    `).join('');
}

// --- Tab Switcher ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-nav-btn').forEach(el => el.classList.remove('active'));

    const targetPane = document.getElementById(`tab-${tabId}`);
    const targetBtn = document.getElementById(`btn-tab-${tabId}`);

    if (targetPane) targetPane.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');

    if (window.lucide) lucide.createIcons();
}
