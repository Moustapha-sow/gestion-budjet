/*// Ajouter une transaction
document.getElementById('transaction-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const amount = parseFloat(document.getElementById('amount').value);

    fetch('/add_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, category, type, amount })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        updateSummary();
        updateTransactions();
    })
    .catch(error => {
        console.error('Erreur lors de l\'ajout de la transaction:', error);
        alert('Une erreur est survenue. Veuillez réessayer plus tard.');
    });
});

// Mise à jour du résumé
function updateSummary() {
    fetch('/get_summary')
        .then(response => response.json())
        .then(summary => {
            document.getElementById('current-balance').textContent = `${summary.current_balance} €`;
            document.getElementById('total-income').textContent = `${summary.total_income} €`;
            document.getElementById('total-expense').textContent = `${summary.total_expense} €`;

            // Mise à jour des graphiques après le résumé
            updateCharts(summary);

            // Vérification du budget après mise à jour du résumé
            checkBudget(summary);
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour du résumé:', error);
            alert('Une erreur est survenue lors de la mise à jour du résumé.');
        });
}

// Vérification du budget mensuel 
function checkBudget(summary) {
    const budgetElement = document.getElementById('current-budget').textContent;
    console.log('Raw Monthly Budget:', budgetElement); // Affiche la valeur brute

    const monthlyBudget = parseFloat(budgetElement) || 0;
    console.log('Total Expense:', summary.total_expense);
    console.log('Monthly Budget:', monthlyBudget);

    if (!isNaN(monthlyBudget) && summary.total_expense > monthlyBudget) {
        Swal.fire({
            title: 'Alerte!',
            text: 'Le budget mensuel est dépassé!',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
}


// Fonction pour ajouter ou modifier le budget
document.getElementById('budget-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const monthlyBudget = parseFloat(document.getElementById('monthly-budget').value);
    if (isNaN(monthlyBudget)) {
        alert('Veuillez entrer un montant valide pour le budget.');
        return;
    }

    fetch('/set_budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: monthlyBudget })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById('current-budget').textContent = monthlyBudget.toFixed(2);
    })
    .catch(error => {
        console.error('Erreur lors de la mise à jour du budget:', error);
        alert('Une erreur est survenue lors de la mise à jour du budget.');
    });
});



// Mise à jour des transactions
function updateTransactions() {
    fetch('/get_transactions')
        .then(response => response.json())
        .then(transactions => {
            const transactionTable = document.getElementById('transactions');
            transactionTable.innerHTML = '';

            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.date}</td>
                    <td>${transaction.category}</td>
                    <td>${transaction.type}</td>
                    <td>${transaction.amount.toFixed(2)} €</td>
                    <td>
                        <button class="edit-btn">Modifier</button>
                        <button class="delete-btn">Supprimer</button>
                    </td>
                `;
                transactionTable.appendChild(row);

                // Ajouter des écouteurs d'événements pour les boutons
                row.querySelector('.edit-btn').addEventListener('click', () => editTransaction(transaction));
                row.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(transaction.id));
            });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des transactions:', error);
            alert('Une erreur est survenue. Veuillez réessayer plus tard.');
        });
}

// Supprimer une transaction
function deleteTransaction(transactionId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        fetch('/delete_transaction', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: transactionId })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            updateSummary();
            updateTransactions();
        })
        .catch(error => {
            console.error('Erreur lors de la suppression de la transaction:', error);
            alert('Une erreur est survenue lors de la suppression de la transaction.');
        });
    }
}

// Modifier une transaction
function editTransaction(transaction) {
    const newDate = prompt('Nouvelle date (AAAA-MM-JJ) :', transaction.date);
    const newCategory = prompt('Nouvelle catégorie :', transaction.category);
    const newType = prompt('Nouveau type (income/expense) :', transaction.type);
    const newAmount = parseFloat(prompt('Nouveau montant :', transaction.amount));

    if (newDate && newCategory && newType && !isNaN(newAmount)) {
        fetch('/edit_transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: transaction.id,
                date: newDate,
                category: newCategory,
                type: newType,
                amount: newAmount
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            updateSummary();
            updateTransactions();
        })
        .catch(error => {
            console.error('Erreur lors de la modification de la transaction:', error);
            alert('Une erreur est survenue lors de la modification de la transaction.');
        });
    }
}

// Mise à jour des graphiques
let budgetChartInstance;
let barChartInstance;

function updateCharts(summary) {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    const barCtx = document.getElementById('barChart').getContext('2d');

    // Détruire les anciens graphiques s'ils existent
    if (budgetChartInstance) {
        budgetChartInstance.destroy();
    }
    if (barChartInstance) {
        barChartInstance.destroy();
    }

    // Créer le graphique en donut
    budgetChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenu', 'Dépense'],
            datasets: [{
                label: 'Budget',
                data: [summary.total_income, summary.total_expense],
                backgroundColor: ['#36a2eb', '#ff6384']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Créer le graphique en barres
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Revenu', 'Dépense'],
            datasets: [{
                label: 'Budget',
                data: [summary.total_income, summary.total_expense],
                backgroundColor: ['#4caf50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Application des filtres
function applyFilters() {
    const dateFilter = document.getElementById('filter-date').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const typeFilter = document.getElementById('filter-type').value;
    const url = new URL('/get_filtered_transactions', window.location.origin);

    if (dateFilter) url.searchParams.append('date', dateFilter);
    if (categoryFilter) url.searchParams.append('category', categoryFilter);
    if (typeFilter) url.searchParams.append('type', typeFilter);

    fetch(url)
        .then(response => response.json())
        .then(transactions => {
            const transactionTable = document.getElementById('transactions');
            transactionTable.innerHTML = '';

            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.date}</td>
                    <td>${transaction.category}</td>
                    <td>${transaction.type}</td>
                    <td>${transaction.amount.toFixed(2)} €</td>
                    <td>
                        <button class="edit-btn">Modifier</button>
                        <button class="delete-btn">Supprimer</button>
                    </td>
                `;
                transactionTable.appendChild(row);

                row.querySelector('.edit-btn').addEventListener('click', () => editTransaction(transaction));
                row.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(transaction.id));
            });
        })
        .catch(error => {
            console.error('Erreur lors de l\'application des filtres:', error);
            alert('Une erreur est survenue lors de l\'application des filtres.');
        });
}

// Appliquer les filtres au clic
document.getElementById('apply-filters').addEventListener('click', applyFilters);

// Mise à jour initiale au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    updateSummary();
    updateTransactions();
});
*/
