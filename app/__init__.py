from flask import Flask
from .routes import init_app
from flask_sqlalchemy import SQLAlchemy

# Initialisation de SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Configurer l'application (par exemple, la base de données)
    app.config['DATABASE'] = 'budget.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///budget.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialisation de la base de données avec l'application
    db.init_app(app)

    # Importer et initialiser les routes après la création de l'application
    
    init_app(app)

    return app
