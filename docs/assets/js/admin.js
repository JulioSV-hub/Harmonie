// Painel admin: login (Firebase Auth) e edição do conteúdo (Firestore).
import {
    getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
    updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.4.16/dist/purify.es.mjs';
import { app, db, isConfigured, emulator } from './firebase.js';
import { DEFAULT_SITE, DEFAULT_ATIVIDADES } from './defaults.js';
import { mergeAssinatura } from './store.js';
import { formatBRL, linkSeguro, planosDisponiveis, resumoAnual } from './assinatura-ui.js';
import { VIDEOS, ARTIGOS } from './seed-conteudo.js';

const { escapeHtml, formatDate, showNotification, youtubeId } = window.Harmonie;
const $ = id => document.getElementById(id);

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const STATUS_LABEL = { pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' };
const FOTO_PADRAO = '../assets/images/profissional.jpg';

// ---------------------------------------------------------------------------
// Utilitários

function showView(id) {
    ['viewCarregando', 'viewNaoConfigurado', 'viewLogin', 'viewSemPermissao', 'viewTrocarSenha', 'viewPainel']
        .forEach(v => { $(v).hidden = v !== id; });
    $('alterarSenhaBtn').hidden = id !== 'viewPainel';
}

// Botão "olho": mostra/oculta o conteúdo do campo de senha ao lado.
document.querySelectorAll('.toggle-senha').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const mostrar = input.type === 'password';
        input.type = mostrar ? 'text' : 'password';
        btn.querySelector('i').className = mostrar ? 'fas fa-eye-slash' : 'fas fa-eye';
        const rotulo = mostrar ? 'Ocultar senha' : 'Mostrar senha';
        btn.setAttribute('aria-label', rotulo);
        btn.title = rotulo;
        input.focus();
    });
});

function ocultarSenhas(form) {
    form.querySelectorAll('.password-field input').forEach(i => { i.type = 'password'; });
    form.querySelectorAll('.toggle-senha i').forEach(i => { i.className = 'fas fa-eye'; });
}

function setError(el, msg) {
    el.textContent = msg || '';
    el.hidden = !msg;
}

function errorMessage(err) {
    const code = err?.code || '';
    if (code === 'permission-denied') return 'Sem permissão para esta ação. Faça login novamente.';
    if (code === 'unavailable' || code === 'auth/network-request-failed') return 'Sem conexão. Verifique a internet e tente de novo.';
    return 'Algo deu errado. Tente novamente.';
}

function fail(err) {
    console.error(err);
    showNotification(errorMessage(err), 'erro');
}

// Evita duplo clique em botões de salvar durante a gravação.
async function withBusy(button, fn) {
    if (button.disabled) return;
    button.disabled = true;
    try {
        return await fn();
    } finally {
        button.disabled = false;
    }
}

function todayIso() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function slugify(text) {
    return String(text).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'artigo';
}

function fillDatalist(el, values) {
    el.innerHTML = [...new Set(values.filter(Boolean))].sort()
        .map(v => `<option value="${escapeHtml(v)}">`).join('');
}

// Alterações não salvas: avisa antes de sair da página ou trocar de aba.
const dirtyForms = new Set();
function trackDirty(form) {
    form.addEventListener('input', () => dirtyForms.add(form.id));
    form.addEventListener('change', () => dirtyForms.add(form.id));
}
function clearDirty(form) { dirtyForms.delete(form.id); }
function confirmDiscard() {
    return dirtyForms.size === 0 || confirm('Há alterações não salvas. Deseja descartá-las?');
}
window.addEventListener('beforeunload', e => {
    if (dirtyForms.size) { e.preventDefault(); e.returnValue = ''; }
});

function createEditor(selector, onChange) {
    const quill = new window.Quill(selector, {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'link'],
                ['clean'],
            ],
        },
    });
    quill.on('text-change', (delta, old, source) => { if (source === 'user') onChange(); });
    return {
        set(html) { quill.setContents([], 'silent'); quill.clipboard.dangerouslyPasteHTML(html || '', 'silent'); },
        // getSemanticHTML gera <ul>/<ol> corretos; espaços viram &nbsp; e são normalizados aqui.
        get() { return quill.getText().trim() ? DOMPurify.sanitize(quill.getSemanticHTML().replace(/&nbsp;/g, ' ')) : ''; },
    };
}

// ---------------------------------------------------------------------------
// Autenticação

const auth = isConfigured ? getAuth(app) : null;
if (auth && emulator) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

if (!isConfigured) {
    showView('viewNaoConfigurado');
} else {
    onAuthStateChanged(auth, async user => {
        $('sairBtn').hidden = !user;
        $('usuarioEmail').textContent = user?.email || '';
        if (!user) {
            showView('viewLogin');
            return;
        }
        showView('viewCarregando');
        try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (!adminDoc.exists()) {
                $('semPermissaoUid').textContent = user.uid;
                showView('viewSemPermissao');
                return;
            }
            if (await usandoSenhaProvisoria(user)) {
                abrirTrocaSenha(true);
                return;
            }
            await abrirPainel();
        } catch (err) {
            fail(err);
            showView('viewLogin');
        }
    });
}

let painelCarregado = false;
async function abrirPainel() {
    showView('viewPainel');
    if (!painelCarregado) {
        painelCarregado = true;
        await loadAll();
        // Primeiro acesso com o banco vazio: importa o conteúdo inicial automaticamente,
        // para o site não ficar sem conteúdo. Só acontece uma vez (cria config/site).
        if (bancoVazio()) {
            try {
                await importarConteudoInicial();
                showNotification('Bem-vindo! O conteúdo inicial do site foi carregado. Agora é só editar.', 'info');
            } catch (err) { fail(err); }
        }
    }
}

// Senha provisória = nunca trocada desde que a conta foi criada no Console do Firebase.
// Quem já redefiniu pelo "Esqueci minha senha" ou pelo painel não é obrigado a trocar de novo.
async function usandoSenhaProvisoria(user) {
    try {
        const base = emulator ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com' : 'https://identitytoolkit.googleapis.com';
        const resp = await fetch(`${base}/v1/accounts:lookup?key=${app.options.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: await user.getIdToken() }),
        });
        if (!resp.ok) throw new Error(`accounts:lookup ${resp.status}`);
        const info = (await resp.json()).users?.[0] || {};
        const criada = Number(info.createdAt);
        const senhaAlterada = Number(info.passwordUpdatedAt);
        // Na criação as duas datas são iguais; qualquer troca posterior as separa.
        return Boolean(criada && senhaAlterada) && senhaAlterada - criada < 2000;
    } catch (err) {
        // Falha na consulta não bloqueia o acesso; a troca segue disponível no botão "Senha".
        console.warn('Não foi possível verificar a senha provisória.', err);
        return false;
    }
}

let trocaObrigatoria = false;
function abrirTrocaSenha(obrigatoria) {
    trocaObrigatoria = obrigatoria;
    const form = $('trocarSenhaForm');
    form.reset();
    ocultarSenhas(form);
    $('trocarSenhaUsuario').value = auth.currentUser?.email || '';
    $('trocarSenhaTitulo').textContent = obrigatoria ? 'Crie sua senha' : 'Alterar senha';
    $('trocarSenhaTexto').textContent = obrigatoria
        ? 'Por segurança, troque a senha provisória antes de usar o painel.'
        : 'Escolha uma nova senha para acessar o painel.';
    $('trocarSenhaCancelar').hidden = obrigatoria;
    setError($('trocarSenhaErro'), '');
    showView('viewTrocarSenha');
    $('senhaAtual').focus();
}

$('alterarSenhaBtn').addEventListener('click', () => {
    if (!confirmDiscard()) return;
    abrirTrocaSenha(false);
});

$('trocarSenhaCancelar').addEventListener('click', () => abrirPainel());

$('trocarSenhaForm').addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('trocarSenhaErro');
    const atual = $('senhaAtual').value;
    const nova = $('senhaNova').value;
    if (!atual) return setError(erro, 'Digite a senha atual.');
    if (nova.length < 8 || !/[A-Za-z]/.test(nova) || !/\d/.test(nova)) {
        return setError(erro, 'A nova senha precisa ter pelo menos 8 caracteres, com letras e números.');
    }
    if (nova === atual) return setError(erro, 'A nova senha precisa ser diferente da atual.');
    if (nova !== $('senhaConfirmar').value) return setError(erro, 'A confirmação não confere com a nova senha.');
    setError(erro, '');

    await withBusy($('trocarSenhaForm').querySelector('button[type=submit]'), async () => {
        const user = auth.currentUser;
        try {
            // Confirmar a senha atual também evita o erro de "login recente necessário".
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, atual));
            await updatePassword(user, nova);
            $('trocarSenhaForm').reset();
            ocultarSenhas($('trocarSenhaForm'));
            showNotification('Senha alterada com sucesso.');
            await abrirPainel();
        } catch (err) {
            const code = err.code || '';
            if (['auth/invalid-credential', 'auth/wrong-password'].includes(code)) setError(erro, 'Senha atual incorreta.');
            else if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') setError(erro, 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.');
            else if (code === 'auth/too-many-requests') setError(erro, 'Muitas tentativas. Aguarde alguns minutos.');
            else setError(erro, errorMessage(err));
        }
    });
});

$('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('loginErro');
    setError(erro, '');
    await withBusy(e.submitter || $('loginForm').querySelector('button'), async () => {
        try {
            await signInWithEmailAndPassword(auth, $('loginEmail').value.trim(), $('loginSenha').value);
            $('loginSenha').value = '';
            ocultarSenhas($('loginForm'));
        } catch (err) {
            const code = err.code || '';
            if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) {
                setError(erro, 'E-mail ou senha incorretos.');
            } else if (code === 'auth/too-many-requests') {
                setError(erro, 'Muitas tentativas. Aguarde alguns minutos ou redefina a senha.');
            } else {
                setError(erro, errorMessage(err));
            }
        }
    });
});

$('esqueciBtn').addEventListener('click', async () => {
    const email = $('loginEmail').value.trim();
    if (!email) {
        setError($('loginErro'), 'Digite seu e-mail acima e clique novamente em "Esqueci minha senha".');
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (err) {
        console.error(err);
    }
    // Mesma mensagem com ou sem conta, para não revelar quais e-mails existem.
    setError($('loginErro'), '');
    showNotification('Se este e-mail tiver acesso, você receberá um link para criar uma nova senha.', 'info');
});

$('sairBtn').addEventListener('click', () => {
    if (!confirmDiscard()) return;
    dirtyForms.clear();
    painelCarregado = false;
    signOut(auth);
});

// ---------------------------------------------------------------------------
// Abas

document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;
        if (!confirmDiscard()) return;
        discardAll();
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t === tab));
        document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
    });
});

function discardAll() {
    dirtyForms.clear();
    closeVideoForm();
    closeArtigoForm();
    renderSiteForm();
    renderAtividadesForm();
    renderAssinaturaForm();
}

async function loadAll() {
    await Promise.all([loadAgendamentos(), loadVideos(), loadArtigos(), loadSite(), loadAtividades(), loadAssinatura()]);
    updateImportBox();
}

// ---------------------------------------------------------------------------
// Agendamentos

let agendamentos = [];

async function loadAgendamentos() {
    const snap = await getDocs(collection(db, 'agendamentos'));
    agendamentos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
    renderAgendamentos();
}

function renderAgendamentos() {
    const filtro = $('agFiltro').value;
    const hoje = todayIso();
    let lista = agendamentos;
    if (filtro === 'proximos') {
        lista = lista.filter(a => a.data >= hoje && ['pendente', 'confirmado'].includes(a.status));
    } else if (filtro !== 'todos') {
        lista = lista.filter(a => a.status === filtro);
    }
    // Histórico: mais recentes primeiro; próximos: ordem cronológica.
    if (!['proximos', 'pendente', 'confirmado'].includes(filtro)) lista = [...lista].reverse();

    const pendentes = agendamentos.filter(a => a.status === 'pendente' && a.data >= hoje).length;
    $('pendentesBadge').textContent = pendentes;
    $('pendentesBadge').hidden = pendentes === 0;

    $('agVazio').hidden = lista.length > 0;
    $('agTabelaBox').hidden = lista.length === 0;
    $('agTabela').innerHTML = lista.map(a => {
        const dia = a.data ? DIAS[new Date(a.data + 'T12:00').getDay()] : '';
        const passado = a.data < hoje;
        const acoes = [];
        if (a.status === 'pendente') acoes.push(['confirmado', 'fa-check', 'btn-confirm', 'Confirmar']);
        if (a.status === 'confirmado') acoes.push(['concluido', 'fa-check-double', 'btn-confirm', 'Marcar como concluído']);
        if (['pendente', 'confirmado'].includes(a.status)) acoes.push(['cancelado', 'fa-times', 'btn-cancel', 'Cancelar']);
        if (['cancelado', 'concluido'].includes(a.status)) acoes.push(['pendente', 'fa-undo', '', 'Voltar para pendente']);
        return `
        <tr>
            <td>${formatDate(a.data)}<div class="muted">${dia}${passado ? ' · passado' : ''}</div></td>
            <td>${escapeHtml(a.horario)}</td>
            <td>${escapeHtml(a.nome)}${a.email ? `<div class="muted"><a href="mailto:${escapeHtml(a.email)}">${escapeHtml(a.email)}</a></div>` : ''}</td>
            <td>${escapeHtml(a.modalidade || '')}</td>
            <td class="motivo">${escapeHtml(a.motivo || '')}</td>
            <td><span class="status-badge status-${escapeHtml(a.status)}">${STATUS_LABEL[a.status] || escapeHtml(a.status)}</span></td>
            <td class="actions">
                ${acoes.map(([st, icon, cls, title]) =>
                    `<button type="button" class="btn-action ${cls}" data-ag="${a.id}" data-status="${st}" title="${title}" aria-label="${title}"><i class="fas ${icon}"></i></button>`).join('')}
                <button type="button" class="btn-action btn-cancel" data-ag-excluir="${a.id}" title="Excluir" aria-label="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

$('agFiltro').addEventListener('change', renderAgendamentos);
$('agRecarregar').addEventListener('click', () => withBusy($('agRecarregar'), () => loadAgendamentos().catch(fail)));

$('agTabela').addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.ag || btn.dataset.agExcluir;
    const item = agendamentos.find(a => a.id === id);
    if (!item) return;
    try {
        if (btn.dataset.agExcluir) {
            if (!confirm(`Excluir o pedido de ${item.nome}? Isso não pode ser desfeito.`)) return;
            await deleteDoc(doc(db, 'agendamentos', id));
            agendamentos = agendamentos.filter(a => a.id !== id);
            showNotification('Pedido excluído.');
        } else {
            const status = btn.dataset.status;
            await updateDoc(doc(db, 'agendamentos', id), { status, atualizadoEm: serverTimestamp() });
            item.status = status;
            showNotification(`Status alterado para "${STATUS_LABEL[status]}".`);
        }
        renderAgendamentos();
    } catch (err) {
        fail(err);
    }
});

// ---------------------------------------------------------------------------
// Vídeos

let videos = [];
let videoEditId = null;
const videoForm = $('videoForm');
trackDirty(videoForm);

async function loadVideos() {
    const snap = await getDocs(collection(db, 'videos'));
    videos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
    renderVideos();
}

function renderVideos() {
    $('videosVazio').hidden = videos.length > 0;
    $('videosTabelaBox').hidden = videos.length === 0;
    fillDatalist($('videoCategorias'), videos.map(v => v.categoria));
    $('videosTabela').innerHTML = videos.map(v => {
        const yt = youtubeId(v.youtube);
        return `
        <tr>
            <td>${yt ? `<img class="thumb" src="https://img.youtube.com/vi/${yt}/mqdefault.jpg" alt="">` : ''}</td>
            <td>${escapeHtml(v.titulo)}<div class="muted">${escapeHtml((v.descricao || '').slice(0, 90))}</div></td>
            <td><span class="category-badge">${escapeHtml(v.categoria)}</span></td>
            <td class="actions">
                <button type="button" class="btn-action" data-video-editar="${v.id}" title="Editar" aria-label="Editar"><i class="fas fa-pen"></i></button>
                <a class="btn-action" href="https://www.youtube.com/watch?v=${yt || ''}" target="_blank" rel="noopener" title="Abrir no YouTube"><i class="fas fa-external-link-alt"></i></a>
                <button type="button" class="btn-action btn-cancel" data-video-excluir="${v.id}" title="Excluir" aria-label="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function openVideoForm(video) {
    if (!confirmDiscard()) return;
    discardAll();
    videoEditId = video?.id || null;
    $('videoFormTitulo').textContent = video ? 'Editar vídeo' : 'Novo vídeo';
    $('videoTitulo').value = video?.titulo || '';
    $('videoYoutube').value = video?.youtube || '';
    $('videoCategoria').value = video?.categoria || '';
    $('videoDescricao').value = video?.descricao || '';
    setError($('videoErro'), '');
    videoForm.hidden = false;
    $('videoTitulo').focus();
}

function closeVideoForm() {
    videoForm.hidden = true;
    videoEditId = null;
    clearDirty(videoForm);
}

$('videoNovo').addEventListener('click', () => openVideoForm(null));

$('videosTabela').addEventListener('click', async e => {
    const editar = e.target.closest('[data-video-editar]');
    const excluir = e.target.closest('[data-video-excluir]');
    if (editar) openVideoForm(videos.find(v => v.id === editar.dataset.videoEditar));
    if (excluir) {
        const v = videos.find(x => x.id === excluir.dataset.videoExcluir);
        if (!v || !confirm(`Excluir o vídeo "${v.titulo}"?`)) return;
        try {
            await deleteDoc(doc(db, 'videos', v.id));
            videos = videos.filter(x => x.id !== v.id);
            if (videoEditId === v.id) closeVideoForm();
            renderVideos();
            updateImportBox();
            showNotification('Vídeo excluído.');
        } catch (err) { fail(err); }
    }
});

videoForm.addEventListener('submit', e => {
    e.preventDefault();
    const erro = $('videoErro');
    const dados = {
        titulo: $('videoTitulo').value.trim(),
        youtube: $('videoYoutube').value.trim(),
        categoria: $('videoCategoria').value.trim(),
        descricao: $('videoDescricao').value.trim(),
    };
    if (!dados.titulo) return setError(erro, 'Informe o título.');
    const yt = youtubeId(dados.youtube);
    if (!yt) return setError(erro, 'Link do YouTube inválido. Copie o endereço do vídeo no YouTube.');
    if (!dados.categoria) return setError(erro, 'Informe a categoria.');
    dados.youtube = `https://www.youtube.com/watch?v=${yt}`;
    setError(erro, '');

    withBusy(videoForm.querySelector('button[type=submit]'), async () => {
        try {
            if (videoEditId) {
                await updateDoc(doc(db, 'videos', videoEditId), { ...dados, atualizadoEm: serverTimestamp() });
            } else {
                await setDoc(doc(collection(db, 'videos')), { ...dados, criadoEm: serverTimestamp() });
            }
            await loadVideos();
            closeVideoForm();
            updateImportBox();
            showNotification('Vídeo salvo.');
        } catch (err) { fail(err); }
    });
});

// ---------------------------------------------------------------------------
// Artigos

let artigos = [];
let artigoEditId = null;
const artigoForm = $('artigoForm');
trackDirty(artigoForm);
const artigoEditor = createEditor('#artigoEditor', () => dirtyForms.add('artigoForm'));

async function loadArtigos() {
    const snap = await getDocs(collection(db, 'artigos'));
    artigos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
    renderArtigos();
}

function renderArtigos() {
    $('artigosVazio').hidden = artigos.length > 0;
    $('artigosTabelaBox').hidden = artigos.length === 0;
    fillDatalist($('artigoCategorias'), artigos.map(a => a.categoria));
    $('artigosTabela').innerHTML = artigos.map(a => `
        <tr>
            <td>${a.destaque ? '<i class="fas fa-star" style="color:var(--accent-dark)" title="Em destaque"></i> ' : ''}${escapeHtml(a.titulo)}</td>
            <td><span class="category-badge">${escapeHtml(a.categoria)}</span></td>
            <td>${formatDate(a.data)}</td>
            <td><span class="status-badge ${a.publicado ? 'status-confirmado' : 'status-pendente'}">${a.publicado ? 'Publicado' : 'Rascunho'}</span></td>
            <td class="actions">
                <button type="button" class="btn-action" data-artigo-editar="${escapeHtml(a.id)}" title="Editar" aria-label="Editar"><i class="fas fa-pen"></i></button>
                ${a.publicado ? `<a class="btn-action" href="../artigo.html?id=${encodeURIComponent(a.id)}" target="_blank" rel="noopener" title="Ver no site"><i class="fas fa-external-link-alt"></i></a>` : ''}
                <button type="button" class="btn-action btn-cancel" data-artigo-excluir="${escapeHtml(a.id)}" title="Excluir" aria-label="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function updateArtigoEndereco() {
    const id = artigoEditId || slugify($('artigoTitulo').value);
    $('artigoEndereco').textContent = `Endereço: artigo.html?id=${id}` + (artigoEditId ? '' : ' (definido ao salvar pela primeira vez)');
}

function openArtigoForm(artigo) {
    if (!confirmDiscard()) return;
    discardAll();
    artigoEditId = artigo?.id || null;
    $('artigoFormTitulo').textContent = artigo ? 'Editar artigo' : 'Novo artigo';
    $('artigoTitulo').value = artigo?.titulo || '';
    $('artigoResumo').value = artigo?.resumo || '';
    $('artigoCategoria').value = artigo?.categoria || '';
    $('artigoAutor').value = artigo?.autor ?? siteData.profissional;
    $('artigoData').value = artigo?.data || todayIso();
    $('artigoPublicado').checked = artigo ? Boolean(artigo.publicado) : false;
    $('artigoDestaque').checked = Boolean(artigo?.destaque);
    artigoEditor.set(artigo?.conteudo || '');
    updateArtigoEndereco();
    setError($('artigoErro'), '');
    artigoForm.hidden = false;
    clearDirty(artigoForm);
    $('artigoTitulo').focus();
}

function closeArtigoForm() {
    artigoForm.hidden = true;
    artigoEditId = null;
    clearDirty(artigoForm);
}

$('artigoTitulo').addEventListener('input', updateArtigoEndereco);

// Abre o artigo como ficará no site, sem salvar. O rascunho passa pelo localStorage deste navegador.
$('artigoPreview').addEventListener('click', () => {
    const conteudo = artigoEditor.get();
    if (!conteudo) {
        setError($('artigoErro'), 'Escreva o conteúdo do artigo para pré-visualizar.');
        return;
    }
    setError($('artigoErro'), '');
    localStorage.setItem('harmonie.preview', JSON.stringify({
        titulo: $('artigoTitulo').value.trim() || '(Sem título)',
        categoria: $('artigoCategoria').value.trim() || 'Sem categoria',
        autor: $('artigoAutor').value.trim(),
        data: $('artigoData').value || todayIso(),
        conteudo,
    }));
    // Mesmo nome de janela: clicar de novo atualiza a aba de pré-visualização já aberta.
    window.open('../artigo.html?preview=1', 'harmonie-preview');
});
$('artigoNovo').addEventListener('click', () => openArtigoForm(null));

$('artigosTabela').addEventListener('click', async e => {
    const editar = e.target.closest('[data-artigo-editar]');
    const excluir = e.target.closest('[data-artigo-excluir]');
    if (editar) openArtigoForm(artigos.find(a => a.id === editar.dataset.artigoEditar));
    if (excluir) {
        const a = artigos.find(x => x.id === excluir.dataset.artigoExcluir);
        if (!a || !confirm(`Excluir o artigo "${a.titulo}"? Isso não pode ser desfeito.`)) return;
        try {
            await deleteDoc(doc(db, 'artigos', a.id));
            artigos = artigos.filter(x => x.id !== a.id);
            if (artigoEditId === a.id) closeArtigoForm();
            renderArtigos();
            updateImportBox();
            showNotification('Artigo excluído.');
        } catch (err) { fail(err); }
    }
});

artigoForm.addEventListener('submit', e => {
    e.preventDefault();
    const erro = $('artigoErro');
    const dados = {
        titulo: $('artigoTitulo').value.trim(),
        resumo: $('artigoResumo').value.trim(),
        categoria: $('artigoCategoria').value.trim(),
        autor: $('artigoAutor').value.trim(),
        data: $('artigoData').value || todayIso(),
        publicado: $('artigoPublicado').checked,
        destaque: $('artigoDestaque').checked,
        conteudo: artigoEditor.get(),
    };
    if (!dados.titulo) return setError(erro, 'Informe o título.');
    if (!dados.categoria) return setError(erro, 'Informe a categoria.');
    if (!dados.conteudo) return setError(erro, 'Escreva o conteúdo do artigo.');
    if (dados.destaque && !dados.publicado) return setError(erro, 'Para ficar em destaque, o artigo precisa estar publicado.');
    setError(erro, '');

    withBusy(artigoForm.querySelector('button[type=submit]'), async () => {
        try {
            let id = artigoEditId;
            if (!id) {
                // Endereço único a partir do título.
                const base = slugify(dados.titulo);
                id = base;
                for (let n = 2; (await getDoc(doc(db, 'artigos', id))).exists(); n++) id = `${base}-${n}`;
            }
            const batch = writeBatch(db);
            const payload = { ...dados, atualizadoEm: serverTimestamp() };
            if (!artigoEditId) payload.criadoEm = serverTimestamp();
            batch.set(doc(db, 'artigos', id), payload, { merge: true });
            // Apenas um artigo em destaque.
            if (dados.destaque) {
                artigos.filter(a => a.destaque && a.id !== id)
                    .forEach(a => batch.update(doc(db, 'artigos', a.id), { destaque: false }));
            }
            await batch.commit();
            await loadArtigos();
            closeArtigoForm();
            updateImportBox();
            showNotification(dados.publicado ? 'Artigo salvo e publicado.' : 'Rascunho salvo (não aparece no site).');
        } catch (err) { fail(err); }
    });
});

document.querySelectorAll('[data-cancelar]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!confirmDiscard()) return;
        if (btn.dataset.cancelar === 'video') closeVideoForm();
        else closeArtigoForm();
    });
});

// ---------------------------------------------------------------------------
// Textos e dados do site

let siteData = { ...DEFAULT_SITE };
let siteExiste = false;
let fotoAtual = '';
const siteForm = $('siteForm');
trackDirty(siteForm);
const sobreEditor = createEditor('#sobreEditor', () => dirtyForms.add('siteForm'));

const SITE_CAMPOS = {
    siteProfissional: 'profissional', siteProfissao: 'profissao', siteRegistro: 'registro', siteWhatsapp: 'whatsapp',
    siteBio: 'bio', siteHeroTitulo: 'heroTitulo', siteHeroSubtitulo: 'heroSubtitulo', siteCitacao: 'citacao',
    siteCitacaoAutor: 'citacaoAutor', siteHorariosTexto: 'horariosTexto', siteAtendimentoTexto: 'atendimentoTexto',
    siteSigiloTexto: 'sigiloTexto',
};

$('horariosGrid').innerHTML = DIAS.map((dia, i) =>
    `<label for="horarios${i}">${dia}</label><input type="text" id="horarios${i}" placeholder="Sem atendimento">`).join('');

async function loadSite() {
    const snap = await getDoc(doc(db, 'config', 'site'));
    siteExiste = snap.exists();
    siteData = { ...DEFAULT_SITE, ...(snap.exists() ? snap.data() : {}) };
    renderSiteForm();
}

function renderSiteForm() {
    for (const [id, campo] of Object.entries(SITE_CAMPOS)) $(id).value = siteData[campo] || '';
    DIAS.forEach((_, i) => { $(`horarios${i}`).value = (siteData.horarios?.[i] || []).join(', '); });
    fotoAtual = siteData.fotoUrl || '';
    $('fotoPreview').src = fotoAtual || FOTO_PADRAO;
    sobreEditor.set(siteData.sobreHtml);
    setError($('siteErro'), '');
    clearDirty(siteForm);
}

$('fotoTrocar').addEventListener('click', () => $('fotoArquivo').click());
$('fotoRemover').addEventListener('click', () => {
    fotoAtual = '';
    $('fotoPreview').src = FOTO_PADRAO;
    dirtyForms.add('siteForm');
});

// Reduz a foto para no máximo 480px e salva como JPEG (texto base64 no próprio documento).
$('fotoArquivo').addEventListener('change', async () => {
    const file = $('fotoArquivo').files[0];
    $('fotoArquivo').value = '';
    if (!file) return;
    try {
        const bitmap = await createImageBitmap(file);
        const escala = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * escala);
        canvas.height = Math.round(bitmap.height * escala);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (dataUrl.length > 700000) throw new Error('imagem grande demais');
        fotoAtual = dataUrl;
        $('fotoPreview').src = dataUrl;
        dirtyForms.add('siteForm');
    } catch (err) {
        console.error(err);
        showNotification('Não foi possível usar esta imagem. Tente uma foto JPG ou PNG.', 'erro');
    }
});

function parseHorarios(text) {
    const itens = text.split(/[\s,;]+/).filter(Boolean);
    const invalidos = itens.filter(h => !/^([01]\d|2[0-3]):[0-5]\d$/.test(h));
    return { lista: [...new Set(itens)].sort(), invalidos };
}

siteForm.addEventListener('submit', e => {
    e.preventDefault();
    const erro = $('siteErro');
    const dados = {};
    for (const [id, campo] of Object.entries(SITE_CAMPOS)) dados[campo] = $(id).value.trim();
    if (!dados.profissional) return setError(erro, 'Informe o nome do profissional.');
    const digitos = dados.whatsapp.replace(/\D/g, '');
    if (dados.whatsapp && (digitos.length < 12 || digitos.length > 13 || !digitos.startsWith('55'))) {
        return setError(erro, 'WhatsApp inválido. Use 55 + DDD + número, ex.: 5511987654321.');
    }
    dados.whatsapp = digitos;
    dados.horarios = {};
    for (let i = 0; i < 7; i++) {
        const { lista, invalidos } = parseHorarios($(`horarios${i}`).value);
        if (invalidos.length) return setError(erro, `Horário inválido em ${DIAS[i]}: ${invalidos.join(', ')}. Use o formato 08:00.`);
        dados.horarios[i] = lista;
    }
    dados.sobreHtml = sobreEditor.get();
    dados.fotoUrl = fotoAtual;
    setError(erro, '');

    withBusy(siteForm.querySelector('button[type=submit]'), async () => {
        try {
            await setDoc(doc(db, 'config', 'site'), { ...dados, atualizadoEm: serverTimestamp() });
            siteData = { ...DEFAULT_SITE, ...dados };
            siteExiste = true;
            clearDirty(siteForm);
            updateImportBox();
            showNotification('Textos e dados salvos.');
        } catch (err) { fail(err); }
    });
});

// ---------------------------------------------------------------------------
// Atividades

let atividadesData = structuredClone(DEFAULT_ATIVIDADES);
let atividadesExiste = false;
const atividadesForm = $('atividadesForm');
trackDirty(atividadesForm);

async function loadAtividades() {
    const snap = await getDoc(doc(db, 'config', 'atividades'));
    atividadesExiste = snap.exists();
    const data = snap.exists() ? snap.data() : {};
    atividadesData = {
        respiracao: { ...DEFAULT_ATIVIDADES.respiracao, ...data.respiracao },
        meditacao: { ...DEFAULT_ATIVIDADES.meditacao, ...data.meditacao },
    };
    renderAtividadesForm();
}

function etapaHtml(etapa = { titulo: '', texto: '' }) {
    return `
    <div class="repeat-item" data-etapa>
        <div class="fields">
            <input type="text" data-campo="titulo" maxlength="80" placeholder="Título da etapa" value="${escapeHtml(etapa.titulo)}" aria-label="Título da etapa">
            <textarea data-campo="texto" rows="2" maxlength="500" placeholder="Orientação exibida durante a etapa" aria-label="Orientação">${escapeHtml(etapa.texto)}</textarea>
        </div>
        <div class="item-actions">
            <button type="button" class="btn-action" data-mover="-1" title="Subir" aria-label="Subir"><i class="fas fa-arrow-up"></i></button>
            <button type="button" class="btn-action" data-mover="1" title="Descer" aria-label="Descer"><i class="fas fa-arrow-down"></i></button>
            <button type="button" class="btn-action btn-cancel" data-remover title="Remover" aria-label="Remover"><i class="fas fa-trash"></i></button>
        </div>
    </div>`;
}

function renderAtividadesForm() {
    const { respiracao, meditacao } = atividadesData;
    $('fasesLista').innerHTML = respiracao.fases.map((f, i) => `
        <div class="repeat-item" data-fase="${i}">
            <div class="fields fase">
                <input type="text" data-campo="nome" maxlength="30" value="${escapeHtml(f.nome)}" aria-label="Nome da fase">
                <input type="text" data-campo="instrucao" maxlength="150" value="${escapeHtml(f.instrucao)}" aria-label="Instrução">
                <input type="number" data-campo="duracao" min="1" max="30" value="${Number(f.duracao)}" aria-label="Duração em segundos">
            </div>
            <div class="item-actions"></div>
        </div>`).join('');
    $('beneficios').value = respiracao.beneficios.join('\n');
    $('duracaoEtapa').value = meditacao.duracaoEtapa;
    $('etapasLista').innerHTML = meditacao.etapas.map(etapaHtml).join('');
    setError($('atividadesErro'), '');
    clearDirty(atividadesForm);
}

$('etapaAdicionar').addEventListener('click', () => {
    $('etapasLista').insertAdjacentHTML('beforeend', etapaHtml());
    $('etapasLista').lastElementChild.querySelector('input').focus();
    dirtyForms.add('atividadesForm');
});

$('etapasLista').addEventListener('click', e => {
    const item = e.target.closest('[data-etapa]');
    if (!item) return;
    if (e.target.closest('[data-remover]')) {
        item.remove();
    } else if (e.target.closest('[data-mover]')) {
        const dir = Number(e.target.closest('[data-mover]').dataset.mover);
        const alvo = dir < 0 ? item.previousElementSibling : item.nextElementSibling;
        if (!alvo) return;
        if (dir < 0) alvo.before(item); else alvo.after(item);
    } else {
        return;
    }
    dirtyForms.add('atividadesForm');
});

atividadesForm.addEventListener('submit', e => {
    e.preventDefault();
    const erro = $('atividadesErro');
    const fases = [...$('fasesLista').querySelectorAll('[data-fase]')].map((el, i) => ({
        tipo: DEFAULT_ATIVIDADES.respiracao.fases[i].tipo,
        nome: el.querySelector('[data-campo=nome]').value.trim(),
        instrucao: el.querySelector('[data-campo=instrucao]').value.trim(),
        duracao: Number(el.querySelector('[data-campo=duracao]').value),
    }));
    if (fases.some(f => !f.nome)) return setError(erro, 'Dê um nome a cada fase da respiração.');
    if (fases.some(f => !Number.isInteger(f.duracao) || f.duracao < 1 || f.duracao > 30)) {
        return setError(erro, 'A duração de cada fase da respiração deve ser de 1 a 30 segundos.');
    }
    const beneficios = $('beneficios').value.split('\n').map(s => s.trim()).filter(Boolean);
    const duracaoEtapa = Number($('duracaoEtapa').value);
    if (!Number.isInteger(duracaoEtapa) || duracaoEtapa < 10 || duracaoEtapa > 300) {
        return setError(erro, 'A duração de cada etapa da meditação deve ser de 10 a 300 segundos.');
    }
    const etapas = [...$('etapasLista').querySelectorAll('[data-etapa]')].map(el => ({
        titulo: el.querySelector('[data-campo=titulo]').value.trim(),
        texto: el.querySelector('[data-campo=texto]').value.trim(),
    })).filter(et => et.titulo || et.texto);
    if (!etapas.length) return setError(erro, 'A meditação precisa de pelo menos uma etapa.');
    if (etapas.some(et => !et.titulo)) return setError(erro, 'Dê um título a cada etapa da meditação.');
    setError(erro, '');

    const dados = { respiracao: { fases, beneficios }, meditacao: { duracaoEtapa, etapas } };
    withBusy(atividadesForm.querySelector('button[type=submit]'), async () => {
        try {
            await setDoc(doc(db, 'config', 'atividades'), { ...dados, atualizadoEm: serverTimestamp() });
            atividadesData = dados;
            atividadesExiste = true;
            renderAtividadesForm();
            updateImportBox();
            showNotification('Atividades salvas.');
        } catch (err) { fail(err); }
    });
});

// ---------------------------------------------------------------------------
// Assinatura (Área Exclusiva)

let assinaturaData = mergeAssinatura();
const assinaturaForm = $('assinaturaForm');
trackDirty(assinaturaForm);
const assDescricaoEditor = createEditor('#assDescricaoEditor', () => dirtyForms.add('assinaturaForm'));

// Aceita "39,90", "39.90" e "1.299,00".
function parsePreco(texto) {
    let t = String(texto || '').replace(/[^\d.,]/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

function precoParaCampo(n) {
    return Number(n) > 0 ? Number(n).toFixed(2).replace('.', ',') : '';
}

async function loadAssinatura() {
    const snap = await getDoc(doc(db, 'config', 'assinatura'));
    assinaturaData = mergeAssinatura(snap.exists() ? snap.data() : {});
    renderAssinaturaForm();
}

function renderAssinaturaForm() {
    const a = assinaturaData;
    $('assAtiva').checked = Boolean(a.ativa);
    $('assTitulo').value = a.titulo;
    $('assSubtitulo').value = a.subtitulo;
    assDescricaoEditor.set(a.descricaoHtml);
    $('assBeneficios').value = a.beneficios.join('\n');
    $('assChamada').value = a.chamada;
    $('assLinkAssinantes').value = a.linkAssinantes;
    $('assGarantia').value = a.garantia;
    $('assPlanos').innerHTML = a.planos.map(p => `
        <div class="repeat-item" data-plano="${p.id}">
            <div class="fields">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome do plano</label>
                        <input type="text" data-campo="nome" maxlength="40" value="${escapeHtml(p.nome)}">
                    </div>
                    <div class="form-group">
                        <label>Preço (R$ por ${escapeHtml(p.periodo)})</label>
                        <input type="text" inputmode="decimal" data-campo="preco" placeholder="0,00" value="${precoParaCampo(p.preco)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Frase curta</label>
                        <input type="text" data-campo="descricao" maxlength="80" value="${escapeHtml(p.descricao)}">
                    </div>
                    <div class="form-group">
                        <label>Selo (opcional)</label>
                        <input type="text" data-campo="selo" maxlength="30" placeholder="Ex.: Mais vantajoso" value="${escapeHtml(p.selo)}">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Link de checkout</label>
                    <input type="url" data-campo="link" placeholder="https://pay.kiwify.com.br/..." value="${escapeHtml(p.link)}">
                </div>
            </div>
            <div class="item-actions"></div>
        </div>`).join('');
    $('assDestaque').innerHTML = a.planos.map(p =>
        `<label><input type="radio" name="assDestaque" value="${p.id}"${p.id === a.planoDestaque ? ' checked' : ''}> ${escapeHtml(p.nome)}</label>`).join('');
    setError($('assErro'), '');
    clearDirty(assinaturaForm);
    updateAssinaturaStatus();
}

function lerAssinaturaForm() {
    const planos = [...$('assPlanos').querySelectorAll('[data-plano]')].map(el => {
        const base = assinaturaData.planos.find(p => p.id === el.dataset.plano);
        const campo = c => el.querySelector(`[data-campo=${c}]`).value.trim();
        return { ...base, nome: campo('nome'), preco: parsePreco(campo('preco')), descricao: campo('descricao'), selo: campo('selo'), link: campo('link') };
    });
    return {
        ativa: $('assAtiva').checked,
        titulo: $('assTitulo').value.trim(),
        subtitulo: $('assSubtitulo').value.trim(),
        descricaoHtml: assDescricaoEditor.get(),
        beneficios: $('assBeneficios').value.split('\n').map(s => s.trim()).filter(Boolean),
        chamada: $('assChamada').value.trim(),
        planos,
        planoDestaque: assinaturaForm.querySelector('input[name=assDestaque]:checked')?.value || 'anual',
        linkAssinantes: $('assLinkAssinantes').value.trim(),
        garantia: $('assGarantia').value.trim(),
    };
}

// Resumo do que o site está mostrando agora, baseado no que está salvo.
function updateAssinaturaStatus() {
    const disponiveis = planosDisponiveis(assinaturaData).map(p => p.nome);
    const r = resumoAnual(assinaturaData);
    let texto;
    if (assinaturaData.ativa && disponiveis.length) {
        texto = `No ar com os planos: ${disponiveis.join(' e ')}.`;
    } else if (assinaturaData.ativa) {
        texto = 'Ativa, mas nenhum plano tem preço e link válidos; o site mostra "Em breve".';
    } else {
        texto = 'Desativada: a página mostra "Em breve" e não aparece no menu.';
    }
    if (r) texto += ` Anual equivale a ${formatBRL(r.porMes)}/mês${r.economia ? ` (economia de ${r.economia}%)` : ''}.`;
    $('assStatus').textContent = texto;
    $('assVer').hidden = !(assinaturaData.ativa && disponiveis.length);
}

function validarAssinatura(dados) {
    if (!dados.titulo) return 'Informe o título da página.';
    for (const p of dados.planos) {
        if (!p.nome) return 'Dê um nome a cada plano.';
        if (Number.isNaN(p.preco) || p.preco < 0) return `Preço inválido no plano ${p.nome}. Use o formato 39,90.`;
        if (p.link && !linkSeguro(p.link)) return `O link do plano ${p.nome} precisa começar com https://`;
        if (p.preco > 0 && !p.link) return `Falta o link de checkout do plano ${p.nome}.`;
        if (p.link && !(p.preco > 0)) return `Falta o preço do plano ${p.nome}.`;
    }
    if (dados.linkAssinantes && !linkSeguro(dados.linkAssinantes)) return 'O link da área de membros precisa começar com https://';
    if (dados.ativa && !planosDisponiveis(dados).length) {
        return 'Para ativar a página, preencha preço e link de checkout de pelo menos um plano.';
    }
    return '';
}

assinaturaForm.addEventListener('submit', e => {
    e.preventDefault();
    const dados = lerAssinaturaForm();
    const msg = validarAssinatura(dados);
    if (msg) return setError($('assErro'), msg);
    setError($('assErro'), '');
    dados.planos.forEach(p => { p.link = p.link ? linkSeguro(p.link) : ''; });
    if (dados.linkAssinantes) dados.linkAssinantes = linkSeguro(dados.linkAssinantes);

    withBusy(assinaturaForm.querySelector('button[type=submit]'), async () => {
        try {
            await setDoc(doc(db, 'config', 'assinatura'), { ...dados, atualizadoEm: serverTimestamp() });
            assinaturaData = mergeAssinatura(dados);
            renderAssinaturaForm();
            showNotification(dados.ativa ? 'Assinatura salva. A página está no ar.' : 'Assinatura salva (página desativada).');
        } catch (err) { fail(err); }
    });
});

$('assPreview').addEventListener('click', () => {
    const dados = lerAssinaturaForm();
    const precosRuins = dados.planos.filter(p => Number.isNaN(p.preco));
    if (precosRuins.length) return setError($('assErro'), `Preço inválido no plano ${precosRuins[0].nome}. Use o formato 39,90.`);
    if (!planosDisponiveis(dados).length) {
        return setError($('assErro'), 'Para pré-visualizar, preencha preço e link de checkout de pelo menos um plano.');
    }
    setError($('assErro'), '');
    localStorage.setItem('harmonie.preview.assinatura', JSON.stringify(dados));
    window.open('../assinatura.html?preview=1', 'harmonie-preview');
});

// ---------------------------------------------------------------------------
// Importação do conteúdo inicial (banco vazio)

function updateImportBox() {
    $('importarBox').hidden = videos.length > 0 || artigos.length > 0 || siteExiste || atividadesExiste;
}

function bancoVazio() {
    return videos.length === 0 && artigos.length === 0 && !siteExiste && !atividadesExiste;
}

// Copia os vídeos, artigos, textos e atividades de exemplo para o banco.
async function importarConteudoInicial() {
    const batch = writeBatch(db);
    batch.set(doc(db, 'config', 'site'), { ...DEFAULT_SITE, atualizadoEm: serverTimestamp() });
    batch.set(doc(db, 'config', 'atividades'), { ...structuredClone(DEFAULT_ATIVIDADES), atualizadoEm: serverTimestamp() });
    // Vídeos de exemplo ficam com data antiga para não aparecerem como "Novo";
    // a ordem original é mantida (o primeiro da lista é o mais recente).
    const base = Date.parse('2026-08-18T12:00:00Z');
    VIDEOS.forEach(({ id, ...v }, i) => {
        batch.set(doc(collection(db, 'videos')), { ...v, criadoEm: Timestamp.fromMillis(base - i * 1000) });
    });
    ARTIGOS.forEach(({ id, ...a }) => {
        batch.set(doc(db, 'artigos', id), { ...a, criadoEm: serverTimestamp() });
    });
    await batch.commit();
    await loadAll();
}

$('importarBtn').addEventListener('click', () => {
    if (!confirm('Importar os vídeos, artigos, textos e atividades de exemplo?')) return;
    withBusy($('importarBtn'), async () => {
        try {
            await importarConteudoInicial();
            showNotification('Conteúdo inicial importado.');
        } catch (err) { fail(err); }
    });
});
