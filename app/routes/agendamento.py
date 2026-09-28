from flask import Blueprint, render_template, request, flash, redirect, url_for
from app import db
from app.models import Agendamento
from datetime import datetime

agendamento_bp = Blueprint('agendamento', __name__)


@agendamento_bp.route('/')
def index():
    return render_template('agendamento/index.html')


@agendamento_bp.route('/agendar', methods=['POST'])
def agendar():
    nome = request.form.get('nome')
    email = request.form.get('email')
    telefone = request.form.get('telefone')
    data_str = request.form.get('data')
    horario = request.form.get('horario')
    motivo = request.form.get('motivo')

    if not all([nome, email, data_str, horario]):
        flash('Por favor, preencha todos os campos obrigatórios.', 'erro')
        return redirect(url_for('agendamento.index'))

    try:
        data_consulta = datetime.strptime(data_str, '%Y-%m-%d').date()
    except ValueError:
        flash('Data inválida.', 'erro')
        return redirect(url_for('agendamento.index'))

    agendamento = Agendamento(
        nome_paciente=nome,
        email_paciente=email,
        telefone=telefone,
        data_consulta=data_consulta,
        horario=horario,
        motivo=motivo
    )

    db.session.add(agendamento)
    db.session.commit()

    flash('Consulta agendada com sucesso! Entraremos em contato para confirmar.', 'sucesso')
    return redirect(url_for('agendamento.index'))
