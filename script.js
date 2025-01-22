class FinanceTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.initializeEventListeners();
        this.updateDisplay();
    }

    initializeEventListeners() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        document.getElementById('filterPeriod').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('searchTransaction').addEventListener('input', (e) => {
            this.filterTransactions(e.target.value);
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

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToLocalStorage();
        this.updateDisplay();
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

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(t => {
                const div = document.createElement('div');
                div.className = `transaction-item ${t.type}`;
                div.innerHTML = `
                    <div>
                        <strong>${t.description}</strong>
                        <p>${t.category} - ${t.date}</p>
                    </div>
                    <div>
                        <span>${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span>
                        <button onclick="financeTracker.deleteTransaction(${t.id})">Delete</button>
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