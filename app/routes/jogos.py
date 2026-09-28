from flask import Blueprint, render_template, request, jsonify
from app import db
from app.models import EntradaDiario

jogos_bp = Blueprint('jogos', __name__)


@jogos_bp.route('/')
def listar():
    return render_template('jogos/listar.html')


@jogos_bp.route('/respiracao')
def respiracao():
    return render_template('jogos/respiracao.html')


@jogos_bp.route('/gratidao')
def gratidao():
    entradas = EntradaDiario.query.order_by(EntradaDiario.criado_em.desc()).limit(10).all()
    return render_template('jogos/gratidao.html', entradas=entradas)


@jogos_bp.route('/gratidao/salvar', methods=['POST'])
def salvar_gratidao():
    texto = request.form.get('texto', '')
    humor = request.form.get('humor', 3, type=int)
    gratidao = request.form.get('gratidao', '')

    entrada = EntradaDiario(texto=texto, humor=humor, gratidao=gratidao)
    db.session.add(entrada)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Entrada salva com sucesso!'})


@jogos_bp.route('/meditacao')
def meditacao():
    return render_template('jogos/meditacao.html')
