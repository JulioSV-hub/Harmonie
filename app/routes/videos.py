from flask import Blueprint, render_template
from app.models import Video

videos_bp = Blueprint('videos', __name__)


@videos_bp.route('/')
def listar():
    videos = Video.query.order_by(Video.criado_em.desc()).all()
    categorias = db_get_categorias_video()
    return render_template('videos/listar.html', videos=videos, categorias=categorias)


@videos_bp.route('/categoria/<categoria>')
def por_categoria(categoria):
    videos = Video.query.filter_by(categoria=categoria).order_by(Video.criado_em.desc()).all()
    categorias = db_get_categorias_video()
    return render_template('videos/listar.html', videos=videos, categorias=categorias, categoria_atual=categoria)


def db_get_categorias_video():
    from app import db
    result = db.session.query(Video.categoria).distinct().all()
    return [r[0] for r in result]
