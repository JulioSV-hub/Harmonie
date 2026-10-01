// Apresentação dos planos de assinatura (página pública, chamadas do site e painel).

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(valor) {
    return brl.format(Number(valor) || 0);
}

// Só links https são aceitos como checkout.
export function linkSeguro(url) {
    try {
        const u = new URL(String(url || '').trim());
        return u.protocol === 'https:' ? u.href : null;
    } catch {
        return null;
    }
}

// Plano aparece no site somente com preço e link de checkout válidos.
export function planoDisponivel(plano) {
    return Number(plano?.preco) > 0 && Boolean(linkSeguro(plano?.link));
}

export function planosDisponiveis(assinatura) {
    return (assinatura?.planos || []).filter(planoDisponivel);
}

// Anual: equivalente mensal e economia em relação a 12 mensalidades.
export function resumoAnual(assinatura) {
    const mensal = assinatura.planos.find(p => p.id === 'mensal');
    const anual = assinatura.planos.find(p => p.id === 'anual');
    if (!(Number(anual?.preco) > 0)) return null;
    const porMes = Number(anual.preco) / 12;
    const economia = Number(mensal?.preco) > 0
        ? Math.round((1 - Number(anual.preco) / (Number(mensal.preco) * 12)) * 100)
        : 0;
    return { porMes, economia: economia > 0 ? economia : 0 };
}
