from flask import Blueprint, render_template
from app.models import Artigo

leitura_bp = Blueprint('leitura', __name__)


@leitura_bp.route('/')
def listar():
    artigos = Artigo.query.order_by(Artigo.criado_em.desc()).all()
    categorias = db_get_categorias_artigo()
    return render_template('leitura/listar.html', artigos=artigos, categorias=categorias)


@leitura_bp.route('/artigo/<int:id>')
def ver_artigo(id):
    artigo = Artigo.query.get_or_404(id)
    return render_template('leitura/artigo.html', artigo=artigo)


@leitura_bp.route('/categoria/<categoria>')
def por_categoria(categoria):
    artigos = Artigo.query.filter_by(categoria=categoria).order_by(Artigo.criado_em.desc()).all()
    categorias = db_get_categorias_artigo()
    return render_template('leitura/listar.html', artigos=artigos, categorias=categorias, categoria_atual=categoria)


def db_get_categorias_artigo():
    from app import db
    result = db.session.query(Artigo.categoria).distinct().all()
    return [r[0] for r in result]
