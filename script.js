// ==========================================
// NEON MONEY - COMPLETE AUTHENTICATED VERSION
// ==========================================

// AUTHENTICATION ELEMENTS
const authScreen = document.getElementById("authScreen");
const dashboardApp = document.getElementById("dashboardApp");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const authMessage = document.getElementById("authMessage");
const logoutButton = document.getElementById("logoutButton");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileAvatar = document.getElementById("profileAvatar");

// API URLS
const API_URL = "/api/expenses";
const AUTH_URL = "/api/auth";

const monthlyBudget = 10000;

// SESSION DATA
let token = localStorage.getItem("neonToken");
let currentUser = JSON.parse(localStorage.getItem("neonUser") || "null");

// TRANSACTION DATA
let transactions = [];
let editingId = null;

// HTML ELEMENTS
const expenseForm = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");

const transactionList = document.getElementById("transactionList");
const searchInput = document.getElementById("searchInput");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expenseElement = document.getElementById("expense");
const countElement = document.getElementById("transactionCount");

const budgetProgress = document.getElementById("budgetProgress");
const budgetMessage = document.getElementById("budgetMessage");

// SET TODAY'S DATE
dateInput.value = new Date().toISOString().split("T")[0];

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

// Switch between Login and Registration
function showAuthForm(formType) {

    authMessage.textContent = "";

    if (formType === "login") {

        loginForm.style.display = "block";
        registerForm.style.display = "none";

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

    } else {

        loginForm.style.display = "none";
        registerForm.style.display = "block";

        registerTab.classList.add("active");
        loginTab.classList.remove("active");
    }
}

// Show authenticated dashboard
function showDashboard() {

    authScreen.style.display = "none";
    dashboardApp.style.display = "flex";

    if (currentUser) {

        profileName.textContent = currentUser.name;
        profileEmail.textContent = currentUser.email;

        profileAvatar.textContent =
            currentUser.name.charAt(0).toUpperCase();
    }

    loadTransactions();
}

// Show login screen
function showLogin() {

    authScreen.style.display = "flex";
    dashboardApp.style.display = "none";

    transactions = [];
    editingId = null;

    expenseForm.reset();
    dateInput.value = new Date().toISOString().split("T")[0];

    updateDashboard();

    loginForm.reset();
    registerForm.reset();

    showAuthForm("login");
}

// Save session after successful login or registration
function saveSession(data) {

    token = data.token;
    currentUser = data.user;

    localStorage.setItem("neonToken", token);
    localStorage.setItem("neonUser", JSON.stringify(currentUser));

    authMessage.textContent = "";
    showDashboard();
}

// LOGIN
loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const button = loginForm.querySelector(".auth-submit-button");

    button.disabled = true;
    button.textContent = "LOGGING IN...";

    authMessage.textContent = "";

    try {

        const response = await fetch(`${AUTH_URL}/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        saveSession(result);

    } catch (error) {

        authMessage.textContent = error.message;
        authMessage.style.color = "#ff4fa3";

    } finally {

        button.disabled = false;
        button.textContent = "LOGIN";
    }
});

// REGISTRATION
registerForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    const button = registerForm.querySelector(".auth-submit-button");

    button.disabled = true;
    button.textContent = "CREATING ACCOUNT...";

    authMessage.textContent = "";

    try {

        const response = await fetch(`${AUTH_URL}/register`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        saveSession(result);

    } catch (error) {

        authMessage.textContent = error.message;
        authMessage.style.color = "#ff4fa3";

    } finally {

        button.disabled = false;
        button.textContent = "CREATE ACCOUNT";
    }
});

// LOGOUT
logoutButton.addEventListener("click", function() {

    if (!confirm("Are you sure you want to logout?")) {
        return;
    }

    localStorage.removeItem("neonToken");
    localStorage.removeItem("neonUser");

    token = null;
    currentUser = null;

    showLogin();
});

// ==========================================
// AUTHENTICATED API REQUEST
// ==========================================

async function apiRequest(url, options = {}) {

    if (!token) {
        throw new Error("Please log in to continue.");
    }

    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    const result = await response.json();

    if (response.status === 401) {

        localStorage.removeItem("neonToken");
        localStorage.removeItem("neonUser");

        token = null;
        currentUser = null;

        showLogin();

        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

// ==========================================
// CHART SETUP
// ==========================================

const ctx = document.getElementById("expenseChart");

const expenseChart = new Chart(ctx, {

    type: "doughnut",

    data: {

        labels: [
            "Food",
            "Travel",
            "Shopping",
            "Education",
            "Entertainment",
            "Others"
        ],

        datasets: [{

            data: [0, 0, 0, 0, 0, 0],

            backgroundColor: [
                "#9b5cff",
                "#42c8ff",
                "#ff4fa3",
                "#42e6b5",
                "#ffb84d",
                "#8c91b8"
            ],

            borderWidth: 0,
            hoverOffset: 10
        }]
    },

    options: {

        responsive: true,
        maintainAspectRatio: false,

        plugins: {

            legend: {

                position: "bottom",

                labels: {
                    color: "#c9c8df",
                    padding: 15,
                    usePointStyle: true
                }
            }
        }
    }
});

// ==========================================
// CURRENCY FORMAT
// ==========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2

    }).format(amount);
}

// ==========================================
// GET: LOAD STUDENT TRANSACTIONS
// ==========================================

async function loadTransactions() {

    if (!token) return;

    try {

        transactionList.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    Loading transactions...
                </td>
            </tr>
        `;

        transactions = await apiRequest(API_URL);

        updateDashboard();

    } catch (error) {

        console.error("Loading error:", error);

        if (token) {

            transactionList.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        Unable to load transactions.
                    </td>
                </tr>
            `;
        }
    }
}

// ==========================================
// POST: ADD TRANSACTION
// PUT: UPDATE TRANSACTION
// ==========================================

expenseForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const transaction = {

        title: titleInput.value.trim(),
        amount: Number(amountInput.value),
        category: categoryInput.value,
        type: typeInput.value,
        date: dateInput.value
    };

    if (
        !transaction.title ||
        !Number.isFinite(transaction.amount) ||
        transaction.amount <= 0 ||
        !transaction.category ||
        !transaction.date
    ) {

        alert("Please enter valid transaction details.");
        return;
    }

    const addButton = expenseForm.querySelector(".add-button");

    const isEditing = Boolean(editingId);
    const savedEditingId = editingId;

    addButton.disabled = true;
    addButton.textContent = isEditing ? "Updating..." : "Saving...";

    try {

        await apiRequest(

            isEditing
                ? `${API_URL}/${encodeURIComponent(savedEditingId)}`
                : API_URL,

            {

                method: isEditing ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(transaction)
            }
        );

        alert(isEditing
            ? "Transaction updated successfully!"
            : "Transaction saved successfully!"
        );

        editingId = null;

        expenseForm.reset();

        dateInput.value = new Date().toISOString().split("T")[0];

        await loadTransactions();

    } catch (error) {

        console.error("Save error:", error);
        alert(error.message);

    } finally {

        addButton.disabled = false;
        addButton.textContent = "+ Add Transaction";
    }
});

// ==========================================
// DISPLAY TRANSACTIONS
// ==========================================

function displayTransactions(list = transactions) {

    transactionList.innerHTML = "";

    if (list.length === 0) {

        transactionList.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No transactions found. Add your first one!
                </td>
            </tr>
        `;

        return;
    }

    list.forEach(transaction => {

        const row = document.createElement("tr");

        const amountClass =
            transaction.type === "income"
                ? "income-text"
                : "expense-text";

        const sign =
            transaction.type === "income" ? "+" : "-";

        const titleCell = document.createElement("td");
        titleCell.textContent = transaction.title;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = transaction.date;

        const amountCell = document.createElement("td");

        amountCell.className = amountClass;

        amountCell.textContent =
            sign + formatCurrency(transaction.amount);

        const actionCell = document.createElement("td");

        // EDIT BUTTON
        const editButton = document.createElement("button");

        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editTransaction(transaction);
        });

        // DELETE BUTTON
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(transaction._id);
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);

        row.append(
            titleCell,
            categoryCell,
            dateCell,
            amountCell,
            actionCell
        );

        transactionList.appendChild(row);
    });
}

// ==========================================
// EDIT TRANSACTION
// ==========================================

function editTransaction(transaction) {

    editingId = transaction._id;

    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    typeInput.value = transaction.type;
    dateInput.value = transaction.date;

    const addButton = expenseForm.querySelector(".add-button");

    addButton.textContent = "Update Transaction";

    expenseForm.scrollIntoView({

        behavior: "smooth",
        block: "center"
    });
}

// ==========================================
// DELETE TRANSACTION
// ==========================================

async function deleteTransaction(id) {

    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    try {

        await apiRequest(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        alert("Transaction deleted successfully!");

        await loadTransactions();

    } catch (error) {

        console.error("Delete error:", error);
        alert(error.message);
    }
}

// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard() {

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpense;

    balanceElement.textContent = formatCurrency(balance);
    incomeElement.textContent = formatCurrency(totalIncome);
    expenseElement.textContent = formatCurrency(totalExpense);

    countElement.textContent = transactions.length;

    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyExpense = transactions

        .filter(transaction =>
            transaction.type === "expense" &&
            transaction.date.startsWith(currentMonth)
        )

        .reduce(
            (total, transaction) => total + transaction.amount,
            0
        );

    const percentage = Math.min(
        (monthlyExpense / monthlyBudget) * 100,
        100
    );

    budgetProgress.style.width = percentage + "%";

    if (monthlyExpense > monthlyBudget) {

        budgetMessage.textContent =
            "⚠️ Budget exceeded! Be careful.";

    } else {

        budgetMessage.textContent =
            formatCurrency(monthlyExpense) +
            " spent out of " +
            formatCurrency(monthlyBudget);
    }

    updateChart();
    displayTransactions();
}

// ==========================================
// UPDATE SPENDING CHART
// ==========================================

function updateChart() {

    const categories = [
        "Food",
        "Travel",
        "Shopping",
        "Education",
        "Entertainment",
        "Others"
    ];

    const categoryTotals = categories.map(category => {

        return transactions

            .filter(transaction =>
                transaction.category === category &&
                transaction.type === "expense"
            )

            .reduce(
                (total, transaction) => total + transaction.amount,
                0
            );
    });

    expenseChart.data.datasets[0].data = categoryTotals;

    expenseChart.update();
}

// ==========================================
// SEARCH TRANSACTIONS
// ==========================================

searchInput.addEventListener("input", function() {

    const searchText = searchInput.value.toLowerCase();

    const filteredTransactions = transactions.filter(transaction => {

        return (

            transaction.title.toLowerCase().includes(searchText) ||

            transaction.category.toLowerCase().includes(searchText) ||

            transaction.type.toLowerCase().includes(searchText)
        );
    });

    displayTransactions(filteredTransactions);
});

// ==========================================
// START APPLICATION
// ==========================================

// Do not load expenses before authentication.
if (token && currentUser) {

    showDashboard();

} else {

    showLogin();
}