class FinanceTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.editingId = null;
        this.initializeEventListeners();
        this.updateDisplay();
    }

    initializeEventListeners() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingId) {
                this.updateTransaction();
            } else {
                this.addTransaction();
            }
        });

        document.getElementById('filterPeriod').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('searchTransaction').addEventListener('input', (e) => {
            this.filterTransactions(e.target.value);
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });
    }

    addTransaction() {
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        const transaction = {
            id: Date.now(),
            type,
            amount,
            description,
            category,
            date,
        };

        this.transactions.push(transaction);
        this.saveToLocalStorage();
        this.updateDisplay();
        document.getElementById('transactionForm').reset();
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Fill the form with transaction data
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('description').value = transaction.description;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;

        // Set editing mode
        this.editingId = id;
        document.getElementById('submitBtn').textContent = 'Update Transaction';
        document.getElementById('cancelEdit').style.display = 'inline-block';
        document.getElementById('formTitle').textContent = 'Edit Transaction';
        
        // Scroll to form
        document.querySelector('.transaction-form').scrollIntoView({ behavior: 'smooth' });
    }

    updateTransaction() {
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        // Find and update the transaction
        this.transactions = this.transactions.map(t => {
            if (t.id === this.editingId) {
                return {
                    ...t,
                    type,
                    amount,
                    description,
                    category,
                    date
                };
            }
            return t;
        });

        this.saveToLocalStorage();
        this.cancelEdit();
        this.updateDisplay();
    }

    cancelEdit() {
        this.editingId = null;
        document.getElementById('transactionForm').reset();
        document.getElementById('submitBtn').textContent = 'Add Transaction';
        document.getElementById('cancelEdit').style.display = 'none';
        document.getElementById('formTitle').textContent = 'Add New Transaction';
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveToLocalStorage();
            this.updateDisplay();
        }
    }

    filterTransactions(searchTerm) {
        const filteredTransactions = this.transactions.filter(t => 
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.displayTransactions(filteredTransactions);
    }

    getFilteredTransactions() {
        const period = document.getElementById('filterPeriod').value;
        const now = new Date();
        const filtered = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            switch(period) {
                case 'week':
                    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    return transactionDate >= weekAgo;
                case 'month':
                    return transactionDate.getMonth() === now.getMonth() &&
                           transactionDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
        return filtered;
    }

    calculateBalance(transactions) {
        return transactions.reduce((balance, t) => {
            return balance + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);
    }

    updateDisplay() {
        const filteredTransactions = this.getFilteredTransactions();
        this.displayTransactions(filteredTransactions);
        this.updateSummary(filteredTransactions);
    }

    displayTransactions(transactions) {
        const transactionsList = document.getElementById('transactionsList');
        transactionsList.innerHTML = '';

        if (transactions.length === 0) {
            transactionsList.innerHTML = '<p class="no-transactions">No transactions found.</p>';
            return;
        }

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(t => {
                const div = document.createElement('div');
                div.className = `transaction-item ${t.type}`;
                div.innerHTML = `
                    <div>
                        <strong>${t.description}</strong>
                        <p>${t.category} - ${t.date}</p>
                    </div>
                    <div class="transaction-actions">
                        <span>${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span>
                        <button class="edit-btn" onclick="financeTracker.editTransaction(${t.id})">Edit</button>
                        <button class="delete-btn" onclick="financeTracker.deleteTransaction(${t.id})">Delete</button>
                    </div>
                `;
                transactionsList.appendChild(div);
            });
    }

    updateSummary(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        document.getElementById('currentBalance').textContent = `$${balance.toFixed(2)}`;
        document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
    }

    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }
}

const financeTracker = new FinanceTracker();


