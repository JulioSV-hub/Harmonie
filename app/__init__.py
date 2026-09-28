from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)

    from app.routes.main import main_bp
    from app.routes.videos import videos_bp
    from app.routes.leitura import leitura_bp
    from app.routes.jogos import jogos_bp
    from app.routes.agendamento import agendamento_bp
    from app.routes.admin import admin_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(videos_bp, url_prefix='/videos')
    app.register_blueprint(leitura_bp, url_prefix='/leitura')
    app.register_blueprint(jogos_bp, url_prefix='/jogos')
    app.register_blueprint(agendamento_bp, url_prefix='/agendamento')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    with app.app_context():
        db.create_all()

    return app
