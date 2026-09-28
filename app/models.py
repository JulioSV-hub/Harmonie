from app import db, login_manager
from flask_login import UserMixin
from datetime import datetime


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.nome}>'


class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    url_youtube = db.Column(db.String(300), nullable=False)
    categoria = db.Column(db.String(50), nullable=False)
    thumbnail = db.Column(db.String(300))
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Video {self.titulo}>'


class Artigo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    resumo = db.Column(db.String(300))
    categoria = db.Column(db.String(50), nullable=False)
    autor = db.Column(db.String(100), default='Fernando Fernandes')
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Artigo {self.titulo}>'


class Agendamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_paciente = db.Column(db.String(100), nullable=False)
    email_paciente = db.Column(db.String(120), nullable=False)
    telefone = db.Column(db.String(20))
    data_consulta = db.Column(db.Date, nullable=False)
    horario = db.Column(db.String(10), nullable=False)
    motivo = db.Column(db.Text)
    status = db.Column(db.String(20), default='pendente')
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Agendamento {self.nome_paciente} - {self.data_consulta}>'


class EntradaDiario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    texto = db.Column(db.Text, nullable=False)
    humor = db.Column(db.Integer)  # 1-5 scale
    gratidao = db.Column(db.Text)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<EntradaDiario {self.criado_em}>'
