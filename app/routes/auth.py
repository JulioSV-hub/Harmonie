from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_user, logout_user, login_required
from werkzeug.security import check_password_hash
from app.models import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.senha_hash, senha):
            login_user(user)
            flash('Login realizado com sucesso!', 'sucesso')
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Email ou senha incorretos.', 'erro')

    return render_template('auth/login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Você saiu da sua conta.', 'info')
    return redirect(url_for('main.index'))
