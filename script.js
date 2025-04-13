// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load transactions from localStorage
    loadTransactions();
    
    // Set today's date as default for the date input
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    // Add event listeners
    document.getElementById('transaction-form').addEventListener('submit', addTransaction);
    document.getElementById('edit-transaction-form').addEventListener('submit', saveEditedTransaction);
    document.getElementById('time-period').addEventListener('change', filterTransactionsByTime);
    document.getElementById('search-transactions').addEventListener('input', searchTransactions);
    document.getElementById('category-filter').addEventListener('change', filterTransactionsByCategory);
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Show/hide categories based on transaction type
    document.getElementById('transaction-type').addEventListener('change', updateCategoryOptions);
    document.getElementById('edit-transaction-type').addEventListener('change', updateEditCategoryOptions);
    
    // Initialize category options
    updateCategoryOptions();
    populateCategoryFilter();
});

// Global variables
let transactions = [];

// Load transactions from localStorage
function loadTransactions() {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
        displayTransactions();
        updateSummary();
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Add a new transaction
function addTransaction(e) {
    e.preventDefault();
    
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const category = document.getElementById('transaction-category').value;
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('transaction-description').value;
    
    const newTransaction = {
        id: Date.now(), // Unique ID using timestamp
        type: type,
        amount: amount,
        category: category,
        date: date,
        description: description
    };
    
    transactions.push(newTransaction);
    saveTransactions();
    displayTransactions();
    updateSummary();
    
    // Reset form
    document.getElementById('transaction-form').reset();
    document.getElementById('transaction-date').valueAsDate = new Date();
}

// Display all transactions
function displayTransactions(filteredTransactions = null) {
    const transactionsContainer = document.getElementById('transactions-container');
    const transactionsToDisplay = filteredTransactions || transactions;
    
    // Clear container
    transactionsContainer.innerHTML = '';
    
    if (transactionsToDisplay.length === 0) {
        transactionsContainer.innerHTML = '<p class="empty-state">No transactions found.</p>';
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactionsToDisplay].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.classList.add('transaction-item');
        
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        transactionEl.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description || 'No description'}</div>
                <div class="transaction-details">
                    <span class="transaction-category">${transaction.category}</span>
                    <span class="transaction-date">${formattedDate}</span>
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</div>
            <div class="transaction-actions">
                <button class="edit-btn" onclick="editTransaction(${transaction.id})">✏️</button>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">🗑️</button>
            </div>
        `;
        
        transactionsContainer.appendChild(transactionEl);
    });
}

// Update financial summary
function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    
    const balance = totalIncome - totalExpenses;
    
    document.getElementById('current-balance').textContent = `$${balance.toFixed(2)}`;
    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
    
    // Change balance color based on value
    const balanceEl = document.getElementById('current-balance');
    if (balance < 0) {
        balanceEl.style.color = '#e74c3c';
    } else {
        balanceEl.style.color = '#27ae60';
    }
}

// Delete a transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        displayTransactions();
        updateSummary();
    }
}

// Edit a transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Fill the edit form
    document.getElementById('edit-transaction-id').value = transaction.id;
    document.getElementById('edit-transaction-type').value = transaction.type;
    document.getElementById('edit-transaction-amount').value = transaction.amount;
    
    // Update category options based on type
    updateEditCategoryOptions();
    document.getElementById('edit-transaction-category').value = transaction.category;
    
    document.getElementById('edit-transaction-date').value = transaction.date;
    document.getElementById('edit-transaction-description').value = transaction.description || '';
    
    // Show the modal
    document.getElementById('edit-modal').style.display = 'block';
}

// Save edited transaction
function saveEditedTransaction(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-transaction-id').value);
    const type = document.getElementById('edit-transaction-type').value;
    const amount = parseFloat(document.getElementById('edit-transaction-amount').value);
    const category = document.getElementById('edit-transaction-category').value;
    const date = document.getElementById('edit-transaction-date').value;
    const description = document.getElementById('edit-transaction-description').value;
    
    // Find and update the transaction
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index] = {
            id: id,
            type: type,
            amount: amount,
            category: category,
            date: date,
            description: description
        };
        
        saveTransactions();
        displayTransactions();
        updateSummary();
        closeModal();
    }
}

// Close the edit modal
function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Filter transactions by time period
function filterTransactionsByTime() {
    const timePeriod = document.getElementById('time-period').value;
    let filteredTransactions = [];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month
    const startOfYear = new Date(today.getFullYear(), 0, 1); // Start of current year
    
    switch (timePeriod) {
        case 'week':
            filteredTransactions = transactions.filter(t => new Date(t.date) >= startOfWeek);
            break;
        case 'month':
            filteredTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth);
            break;
        case 'year':
            filteredTransactions = transactions.filter(t => new Date(t.date) >= startOfYear);
            break;
        default: // 'all'
            filteredTransactions = transactions;
    }
    
    displayTransactions(filteredTransactions);
    
    // Update summary for the filtered period
    updateFilteredSummary(filteredTransactions);
}

// Update summary for filtered transactions
function updateFilteredSummary(filteredTransactions) {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    filteredTransactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    
    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
}

// Search transactions
function searchTransactions() {
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        displayTransactions();
        return;
    }
    
    const filteredTransactions = transactions.filter(transaction => {
        return (
            transaction.description.toLowerCase().includes(searchTerm) ||
            transaction.category.toLowerCase().includes(searchTerm) ||
            transaction.amount.toString().includes(searchTerm)
        );
    });
    
    displayTransactions(filteredTransactions);
}

// Filter transactions by category
function filterTransactionsByCategory() {
    const categoryFilter = document.getElementById('category-filter').value;
    
    if (categoryFilter === 'all') {
        displayTransactions();
        return;
    }
    
    let filteredTransactions;
    
    if (categoryFilter === 'income') {
        filteredTransactions = transactions.filter(t => t.type === 'income');
    } else if (categoryFilter === 'expense') {
        filteredTransactions = transactions.filter(t => t.type === 'expense');
    } else {
        filteredTransactions = transactions.filter(t => t.category === categoryFilter);
    }
    
    displayTransactions(filteredTransactions);
    updateFilteredSummary(filteredTransactions);
}

// Update category options based on transaction type
function updateCategoryOptions() {
    const type = document.getElementById('transaction-type').value;
    const categorySelect = document.getElementById('transaction-category');
    
    // Clear existing options
    categorySelect.innerHTML = '';
    
    // Add appropriate options based on type
    if (type === 'income') {
        addOption(categorySelect, 'salary', 'Part-time Job');
        addOption(categorySelect, 'allowance', 'Allowance');
        addOption(categorySelect, 'scholarship', 'Scholarship');
        addOption(categorySelect, 'gift', 'Gift');
        addOption(categorySelect, 'other-income', 'Other Income');
    } else {
        addOption(categorySelect, 'food', 'Food');
        addOption(categorySelect, 'rent', 'Rent');
        addOption(categorySelect, 'utilities', 'Utilities');
        addOption(categorySelect, 'transportation', 'Transportation');
        addOption(categorySelect, 'entertainment', 'Entertainment');
        addOption(categorySelect, 'education', 'Education');
        addOption(categorySelect, 'shopping', 'Shopping');
        addOption(categorySelect, 'other-expense', 'Other Expense');
    }
}

// Update edit form category options
function updateEditCategoryOptions() {
    const type = document.getElementById('edit-transaction-type').value;
    const categorySelect = document.getElementById('edit-transaction-category');
    
    // Clear existing options
    categorySelect.innerHTML = '';
    
    // Add appropriate options based on type
    if (type === 'income') {
        addOption(categorySelect, 'salary', 'Part-time Job');
        addOption(categorySelect, 'allowance', 'Allowance');
        addOption(categorySelect, 'scholarship', 'Scholarship');
        addOption(categorySelect, 'gift', 'Gift');
        addOption(categorySelect, 'other-income', 'Other Income');
    } else {
        addOption(categorySelect, 'food', 'Food');
        addOption(categorySelect, 'rent', 'Rent');
        addOption(categorySelect, 'utilities', 'Utilities');
        addOption(categorySelect, 'transportation', 'Transportation');
        addOption(categorySelect, 'entertainment', 'Entertainment');
        addOption(categorySelect, 'education', 'Education');
        addOption(categorySelect, 'shopping', 'Shopping');
        addOption(categorySelect, 'other-expense', 'Other Expense');
    }
}

// Helper function to add options to select elements
function addOption(selectElement, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    selectElement.appendChild(option);
}

// Populate category filter with all categories
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    
    // Add income categories
    const incomeOptgroup = document.createElement('optgroup');
    incomeOptgroup.label = 'Income Categories';
    
    addOption(incomeOptgroup, 'salary', 'Part-time Job');
    addOption(incomeOptgroup, 'allowance', 'Allowance');
    addOption(incomeOptgroup, 'scholarship', 'Scholarship');
    addOption(incomeOptgroup, 'gift', 'Gift');
    addOption(incomeOptgroup, 'other-income', 'Other Income');
    
    categoryFilter.appendChild(incomeOptgroup);
    
    // Add expense categories
    const expenseOptgroup = document.createElement('optgroup');
    expenseOptgroup.label = 'Expense Categories';
    
    addOption(expenseOptgroup, 'food', 'Food');
    addOption(expenseOptgroup, 'rent', 'Rent');
    addOption(expenseOptgroup, 'utilities', 'Utilities');
    addOption(expenseOptgroup, 'transportation', 'Transportation');
    addOption(expenseOptgroup, 'entertainment', 'Entertainment');
    addOption(expenseOptgroup, 'education', 'Education');
    addOption(expenseOptgroup, 'shopping', 'Shopping');
    addOption(expenseOptgroup, 'other-expense', 'Other Expense');
    
    categoryFilter.appendChild(expenseOptgroup);
}



