// Leitura do conteúdo público e envio de agendamentos.
// Usa o conteúdo inicial (seed-conteudo.js / defaults.js) quando o Firebase não está configurado
// ou quando o banco ainda não foi iniciado (config/site inexistente). A importação do conteúdo
// inicial grava config/site junto com todo o resto, numa única operação; a partir daí o site
// passa a ler apenas do banco.
import {
    collection, doc, getDoc, getDocs, addDoc, query, where, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';
import { db, isConfigured } from './firebase.js';
import { DEFAULT_SITE, DEFAULT_ATIVIDADES, DEFAULT_ASSINATURA } from './defaults.js';
import { VIDEOS, ARTIGOS } from './seed-conteudo.js';

export { isConfigured };

const byDateDesc = (a, b) => String(b.data || '').localeCompare(String(a.data || ''));
const byCreatedDesc = (a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0);

async function getConfigDoc(name) {
    const snap = await getDoc(doc(db, 'config', name));
    return snap.exists() ? snap.data() : null;
}

// config/site é lido uma única vez por página e reaproveitado.
let siteDocPromise = null;
function siteDoc() {
    if (!siteDocPromise) siteDocPromise = getConfigDoc('site');
    return siteDocPromise;
}

async function usarConteudoInicial() {
    return !isConfigured || (await siteDoc()) === null;
}

export async function getSite() {
    if (!isConfigured) return { ...DEFAULT_SITE };
    return { ...DEFAULT_SITE, ...(await siteDoc()) };
}

export async function getAtividades() {
    if (await usarConteudoInicial()) return structuredClone(DEFAULT_ATIVIDADES);
    const data = (await getConfigDoc('atividades')) || {};
    return {
        respiracao: { ...DEFAULT_ATIVIDADES.respiracao, ...data.respiracao },
        meditacao: { ...DEFAULT_ATIVIDADES.meditacao, ...data.meditacao },
    };
}

export async function getAssinatura() {
    if (await usarConteudoInicial()) return structuredClone(DEFAULT_ASSINATURA);
    return mergeAssinatura((await getConfigDoc('assinatura')) || {});
}

// Campos ausentes no banco usam o padrão; os planos são mesclados pelo id.
export function mergeAssinatura(data = {}) {
    const base = structuredClone(DEFAULT_ASSINATURA);
    const planos = base.planos.map(p => ({ ...p, ...(data.planos || []).find(x => x.id === p.id) }));
    return { ...base, ...data, planos };
}

export async function listVideos() {
    if (await usarConteudoInicial()) return VIDEOS.map(v => ({ ...v }));
    const snap = await getDocs(collection(db, 'videos'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(byCreatedDesc);
}

export async function listArtigos() {
    if (await usarConteudoInicial()) return ARTIGOS.filter(a => a.publicado).sort(byDateDesc);
    const snap = await getDocs(query(collection(db, 'artigos'), where('publicado', '==', true)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(byDateDesc);
}

export async function getArtigo(id) {
    if (!id) return null;
    if (await usarConteudoInicial()) return ARTIGOS.find(a => a.id === id && a.publicado) || null;
    try {
        const snap = await getDoc(doc(db, 'artigos', id));
        return snap.exists() && snap.data().publicado ? { id: snap.id, ...snap.data() } : null;
    } catch (e) {
        // Rascunhos não são legíveis pelo público: tratar como "não encontrado".
        if (e.code === 'permission-denied') return null;
        throw e;
    }
}

// Registra o pedido para o painel admin. Retorna a Promise da gravação (ou null sem Firebase).
export function criarAgendamento({ nome, email, data, horario, modalidade, motivo }) {
    if (!isConfigured) return null;
    const registro = { nome, data, horario, status: 'pendente', criadoEm: serverTimestamp() };
    if (email) registro.email = email;
    if (modalidade) registro.modalidade = modalidade;
    if (motivo) registro.motivo = motivo;
    return addDoc(collection(db, 'agendamentos'), registro);
}
