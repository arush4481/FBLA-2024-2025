class FinanceTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.savings = parseFloat(localStorage.getItem('savings')) || 0;
        this.editingId = null;
        this.categoryIcons = {
            // Income categories
            'salary': 'fa-briefcase',
            'allowance': 'fa-hand-holding-usd',
            'gift': 'fa-gift',
            'scholarship': 'fa-graduation-cap',
            // Expense categories
            'food': 'fa-utensils',
            'transport': 'fa-bus',
            'books': 'fa-book',
            'entertainment': 'fa-film',
            'shopping': 'fa-shopping-bag',
            'utilities': 'fa-bolt',
            'rent': 'fa-home',
            'health': 'fa-heartbeat',
            'other': 'fa-question-circle'
        };
        
        this.initializeApp();
    }

    initializeApp() {
        this.initializeEventListeners();
        this.updateCurrentDate();
        this.updateDisplay();
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    }

    initializeEventListeners() {
        // Transaction form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingId) {
                this.updateTransaction();
            } else {
                this.addTransaction();
            }
        });

        // Filters
        document.getElementById('filterPeriod').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('filterType').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('searchTransaction').addEventListener('input', (e) => {
            this.filterTransactions(e.target.value);
        });

        // Edit/Cancel buttons
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Savings buttons
        document.getElementById('addToSavings').addEventListener('click', () => {
            this.openSavingsModal('add');
        });

        document.getElementById('withdrawFromSavings').addEventListener('click', () => {
            this.openSavingsModal('withdraw');
        });

        // Savings modal
        document.getElementById('confirmSavings').addEventListener('click', () => {
            this.processSavingsTransaction();
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('savingsModal').style.display = 'none';
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            const savingsModal = document.getElementById('savingsModal');
            if (e.target === savingsModal) {
                savingsModal.style.display = 'none';
            }
        });
    }

    openSavingsModal(type) {
        const modal = document.getElementById('savingsModal');
        const title = document.getElementById('savingsModalTitle');
        
        if (type === 'add') {
            title.textContent = 'Add to Savings';
        } else {
            title.textContent = 'Withdraw from Savings';
        }
        
        modal.dataset.type = type;
        modal.style.display = 'flex';
        document.getElementById('savingsAmount').value = '';
        document.getElementById('savingsAmount').focus();
    }

    processSavingsTransaction() {
        const modal = document.getElementById('savingsModal');
        const amount = parseFloat(document.getElementById('savingsAmount').value);
        const type = modal.dataset.type;
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (type === 'add') {
            // Check if there's enough in the balance
            const currentBalance = this.calculateBalance(this.transactions);
            if (amount > currentBalance) {
                alert('Not enough funds in your current balance');
                return;
            }
            
            this.savings += amount;
            
            // Add a transaction to record the transfer to savings
            const transaction = {
                id: Date.now(),
                type: 'expense',
                amount: amount,
                description: 'Transfer to Savings',
                category: 'other',
                date: new Date().toISOString().split('T')[0]
            };
            
            this.transactions.push(transaction);
            
        } else if (type === 'withdraw') {
            if (amount > this.savings) {
                alert('Not enough funds in your savings');
                return;
            }
            
            this.savings -= amount;
            
            // Add a transaction to record the transfer from savings
            const transaction = {
                id: Date.now(),
                type: 'income',
                amount: amount,
                description: 'Transfer from Savings',
                category: 'other',
                date: new Date().toISOString().split('T')[0]
            };
            
            this.transactions.push(transaction);
        }
        
        this.saveToLocalStorage();
        this.updateDisplay();
        modal.style.display = 'none';
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
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update Transaction';
        document.getElementById('cancelEdit').style.display = 'inline-block';
        document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Transaction';
        
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
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Add Transaction';
        document.getElementById('cancelEdit').style.display = 'none';
        document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Transaction';
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveToLocalStorage();
            this.updateDisplay();
        }
    }

    filterTransactions(searchTerm) {
        let filteredTransactions = this.getFilteredTransactions();
        
        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        this.displayTransactions(filteredTransactions);
    }

    getFilteredTransactions() {
        const period = document.getElementById('filterPeriod').value;
        const type = document.getElementById('filterType').value;
        const now = new Date();
        
        return this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            
            // Filter by period
            let matchesPeriod = true;
            switch(period) {
                case 'week':
                    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    matchesPeriod = transactionDate >= weekAgo;
                    break;
                case 'month':
                    matchesPeriod = transactionDate.getMonth() === now.getMonth() &&
                                   transactionDate.getFullYear() === now.getFullYear();
                    break;
            }
            
            // Filter by type
            let matchesType = true;
            if (type !== 'all') {
                matchesType = t.type === type;
            }
            
            return matchesPeriod && matchesType;
        });
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
            transactionsList.innerHTML = '<p class="no-transactions"><i class="fas fa-info-circle"></i> No transactions found.</p>';
            return;
        }

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(t => {
                const div = document.createElement('div');
                div.className = `transaction-item ${t.type}`;
                
                const icon = this.categoryIcons[t.category] || 'fa-question-circle';
                
                div.innerHTML = `
                    <div class="transaction-info">
                        <div class="category-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="transaction-details">
                            <h3>${t.description}</h3>
                            <p>${this.formatCategory(t.category)} • ${this.formatDate(t.date)}</p>
                        </div>
                    </div>
                    <div class="transaction-actions">
                        <span class="transaction-amount">${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span>
                        <button class="edit-btn" onclick="financeTracker.editTransaction(${t.id})"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" onclick="financeTracker.deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                transactionsList.appendChild(div);
            });
    }

    formatCategory(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    updateSummary(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = this.calculateBalance(this.transactions);
        const savingsAmount = this.savings;

        document.getElementById('currentBalance').textContent = `$${balance.toFixed(2)}`;
        document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
        document.getElementById('savingsAmount').textContent = `$${savingsAmount.toFixed(2)}`;
    }

    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('savings', this.savings);
    }
}

// Initialize the app
const financeTracker = new FinanceTracker();

