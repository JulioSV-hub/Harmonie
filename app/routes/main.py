from flask import Blueprint, render_template
from app.models import Artigo

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    # Artigo em destaque: o mais recente marcado como reflexão, senão o mais recente
    artigo_destaque = Artigo.query.filter_by(
        titulo='Cuidar de Si Também é Saúde'
    ).first()
    if not artigo_destaque:
        artigo_destaque = Artigo.query.order_by(Artigo.criado_em.desc()).first()
    return render_template('index.html', artigo_destaque=artigo_destaque)


@main_bp.route('/sobre')
def sobre():
    return render_template('sobre.html')
