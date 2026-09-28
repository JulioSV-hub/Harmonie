from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_required, current_user
from app import db
from app.models import Video, Artigo, Agendamento
from functools import wraps

admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            flash('Acesso negado. Área restrita ao profissional.', 'erro')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/')
@admin_required
def dashboard():
    total_videos = Video.query.count()
    total_artigos = Artigo.query.count()
    total_agendamentos = Agendamento.query.count()
    agendamentos_pendentes = Agendamento.query.filter_by(status='pendente').count()

    ultimos_agendamentos = Agendamento.query.order_by(
        Agendamento.criado_em.desc()
    ).limit(5).all()

    return render_template('admin/dashboard.html',
                           total_videos=total_videos,
                           total_artigos=total_artigos,
                           total_agendamentos=total_agendamentos,
                           agendamentos_pendentes=agendamentos_pendentes,
                           ultimos_agendamentos=ultimos_agendamentos)


@admin_bp.route('/videos')
@admin_required
def videos():
    videos = Video.query.order_by(Video.criado_em.desc()).all()
    return render_template('admin/videos.html', videos=videos)


@admin_bp.route('/videos/novo', methods=['GET', 'POST'])
@admin_required
def novo_video():
    if request.method == 'POST':
        video = Video(
            titulo=request.form.get('titulo'),
            descricao=request.form.get('descricao'),
            url_youtube=request.form.get('url_youtube'),
            categoria=request.form.get('categoria'),
            thumbnail=request.form.get('thumbnail')
        )
        db.session.add(video)
        db.session.commit()
        flash('Vídeo adicionado com sucesso!', 'sucesso')
        return redirect(url_for('admin.videos'))
    return render_template('admin/novo_video.html')


@admin_bp.route('/videos/excluir/<int:id>')
@admin_required
def excluir_video(id):
    video = Video.query.get_or_404(id)
    db.session.delete(video)
    db.session.commit()
    flash('Vídeo removido.', 'sucesso')
    return redirect(url_for('admin.videos'))


@admin_bp.route('/artigos')
@admin_required
def artigos():
    artigos = Artigo.query.order_by(Artigo.criado_em.desc()).all()
    return render_template('admin/artigos.html', artigos=artigos)


@admin_bp.route('/artigos/novo', methods=['GET', 'POST'])
@admin_required
def novo_artigo():
    if request.method == 'POST':
        artigo = Artigo(
            titulo=request.form.get('titulo'),
            conteudo=request.form.get('conteudo'),
            resumo=request.form.get('resumo'),
            categoria=request.form.get('categoria'),
            autor=request.form.get('autor', 'Fernando Fernandes')
        )
        db.session.add(artigo)
        db.session.commit()
        flash('Artigo publicado com sucesso!', 'sucesso')
        return redirect(url_for('admin.artigos'))
    return render_template('admin/novo_artigo.html')


@admin_bp.route('/artigos/excluir/<int:id>')
@admin_required
def excluir_artigo(id):
    artigo = Artigo.query.get_or_404(id)
    db.session.delete(artigo)
    db.session.commit()
    flash('Artigo removido.', 'sucesso')
    return redirect(url_for('admin.artigos'))


@admin_bp.route('/agendamentos')
@admin_required
def agendamentos():
    agendamentos = Agendamento.query.order_by(Agendamento.data_consulta.desc()).all()
    return render_template('admin/agendamentos.html', agendamentos=agendamentos)


@admin_bp.route('/agendamentos/status/<int:id>/<status>')
@admin_required
def atualizar_status(id, status):
    agendamento = Agendamento.query.get_or_404(id)
    agendamento.status = status
    db.session.commit()
    flash(f'Status atualizado para: {status}', 'sucesso')
    return redirect(url_for('admin.agendamentos'))
