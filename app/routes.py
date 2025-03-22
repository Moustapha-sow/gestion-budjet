from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

def init_app(app):
    # Route pour la page d'accueil
    @app.route('/')
    def home():
        return render_template('accueil.html')

    # Route pour afficher le tableau de bord
    @app.route('/dashboard')
    def dashboard():
        return render_template('index.html')

    # Route pour récupérer le résumé
    @app.route('/get_summary', methods=['GET'])
    def get_summary():
        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT SUM(amount) FROM transactions WHERE type = "income"')
            total_income = cursor.fetchone()[0] or 0
            cursor.execute('SELECT SUM(amount) FROM transactions WHERE type = "expense"')
            total_expense = cursor.fetchone()[0] or 0
            current_balance = total_income - total_expense

        summary = {
            'current_balance': current_balance,
            'total_income': total_income,
            'total_expense': total_expense
        }
        return jsonify(summary)

    # Route pour récupérer toutes les transactions
    @app.route('/get_transactions', methods=['GET'])
    def get_transactions():
        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, date, category, type, amount FROM transactions')
            transactions = cursor.fetchall()

        transactions_list = [
            {'id': row[0], 'date': row[1], 'category': row[2], 'type': row[3], 'amount': row[4]}
            for row in transactions
        ]
        return jsonify(transactions_list)

    # Route pour ajouter une transaction
    @app.route('/add_transaction', methods=['POST'])
    def add_transaction():
        data = request.get_json() or request.form
        date = data.get('date')
        category = data.get('category')
        type_ = data.get('type')
        amount = data.get('amount')

        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute('INSERT INTO transactions (amount, type, category, date) VALUES (?, ?, ?, ?)', 
                           (amount, type_, category, date))
            conn.commit()

        return jsonify({'message': 'Transaction ajoutée avec succès!'})

    # Route pour supprimer une transaction
    @app.route('/delete_transaction', methods=['DELETE'])
    def delete_transaction():
        data = request.get_json()
        transaction_id = data.get('id')

        if not transaction_id:
            return jsonify({'message': 'ID de la transaction manquant'}), 400

        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
            conn.commit()

        return jsonify({"message": "Transaction supprimée avec succès"}), 200

    # Route pour modifier une transaction
    @app.route('/edit_transaction', methods=['POST'])
    def edit_transaction():
        data = request.get_json()
        transaction_id = data.get('id')
        date = data.get('date')
        category = data.get('category')
        type_ = data.get('type')
        amount = data.get('amount')

        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE transactions SET date = ?, category = ?, type = ?, amount = ? WHERE id = ?', 
                           (date, category,  type_, amount, transaction_id))
            conn.commit()

        return jsonify({'message': 'Transaction modifiée avec succès!'})

    # Route pour récupérer les transactions filtrées
    @app.route('/get_filtered_transactions', methods=['GET'])
    def get_filtered_transactions():
        date_filter = request.args.get('date')
        category_filter = request.args.get('category')
        type_filter = request.args.get('type')
        query = 'SELECT id, date, category, type, amount FROM transactions WHERE 1=1'
        params = []

        if date_filter:
            query += ' AND date = ?'
            params.append(date_filter)
        if category_filter:
            query += ' AND category LIKE ?'
            params.append(f'%{category_filter}%')    
        if type_filter:
            query += ' AND type = ?'
            params.append(type_filter)

        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            transactions = cursor.fetchall()

        transactions_list = [
            {'id': row[0], 'date': row[1], 'category': row[2], 'type': row[3], 'amount': row[4]}
            for row in transactions
        ]
        return jsonify(transactions_list)

    # Route pour définir le budget mensuel
    @app.route('/set_budget', methods=['POST'])
    def set_budget():
        data = request.get_json()
        monthly_budget = data.get('monthly_budget')

        if monthly_budget is None:
            return jsonify({'message': 'Le budget mensuel est requis'}), 400

        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS budgets (
                    id INTEGER PRIMARY KEY,
                    amount REAL
                )
            ''')
            cursor.execute('INSERT OR REPLACE INTO budgets (id, amount) VALUES (1, ?)', (monthly_budget,))
            conn.commit()

        return jsonify({'message': 'Budget mensuel défini avec succès!'})

    # Route pour récupérer le budget mensuel
    @app.route('/get_budget', methods=['GET'])
    def get_budget():
        with sqlite3.connect('budget.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT amount FROM budgets WHERE id = 1')
            budget = cursor.fetchone()
            return jsonify({'monthly_budget': budget[0] if budget else 0})



