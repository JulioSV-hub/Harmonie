// Valores padrão dos textos, dados do site e atividades.
// Campos salvos pelo painel admin substituem estes; campos ausentes no banco usam estes.

const HORARIOS_SEMANA = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export const DEFAULT_SITE = {
    profissional: 'Fernando Fernandes',
    profissao: 'Psicólogo',
    crp: '',
    whatsapp: '',
    fotoUrl: '',
    bio: 'Profissional dedicado ao cuidado da saúde mental, com foco em acolhimento humanizado e técnicas terapêuticas baseadas em evidências. Aqui você encontra um espaço seguro para cuidar de si.',
    heroTitulo: 'Você não está sozinho(a)',
    heroSubtitulo: 'Um espaço seguro para cuidar da sua saúde mental, com recursos profissionais e acolhimento humano.',
    citacao: 'A jornada de mil milhas começa com um único passo.',
    citacaoAutor: 'Lao Tzu',
    sobreHtml: '<p>O Harmony nasceu da vontade de tornar o cuidado com a saúde mental mais acessível e acolhedor. Acreditamos que todos merecem apoio profissional e recursos de qualidade para enfrentar os desafios da vida.</p>'
        + '<p>Aqui você encontra um espaço seguro para explorar ferramentas terapêuticas, aprender sobre si mesmo e dar os primeiros passos rumo ao seu bem-estar emocional.</p>',
    horariosTexto: 'Segunda a Sexta: 8h às 18h\nSábado: 8h às 12h',
    atendimentoTexto: 'Presencial e Online\nPrimeira consulta: acolhimento e avaliação',
    sigiloTexto: 'Todas as informações são tratadas com total sigilo profissional, conforme o Código de Ética.',
    // Dia da semana (0 = domingo ... 6 = sábado) → horários oferecidos.
    horarios: {
        0: [],
        1: HORARIOS_SEMANA,
        2: HORARIOS_SEMANA,
        3: HORARIOS_SEMANA,
        4: HORARIOS_SEMANA,
        5: HORARIOS_SEMANA,
        6: ['08:00', '09:00', '10:00', '11:00'],
    },
};

export const DEFAULT_ATIVIDADES = {
    respiracao: {
        // "tipo" controla a animação do círculo e não é editável.
        fases: [
            { tipo: 'inhale', nome: 'Inspire', instrucao: 'Puxe o ar pelo nariz lentamente', duracao: 4 },
            { tipo: 'hold', nome: 'Segure', instrucao: 'Mantenha o ar nos pulmões', duracao: 7 },
            { tipo: 'exhale', nome: 'Expire', instrucao: 'Solte o ar pela boca suavemente', duracao: 8 },
        ],
        beneficios: ['Reduz a ansiedade', 'Melhora o sono', 'Diminui o estresse', 'Acalma o sistema nervoso'],
    },
    meditacao: {
        duracaoEtapa: 30,
        etapas: [
            { titulo: 'Preparação', texto: 'Encontre uma posição confortável. Feche os olhos se desejar. Respire naturalmente.' },
            { titulo: 'Atenção ao Corpo', texto: 'Sinta o peso do seu corpo. Observe os pontos de contato com a cadeira ou o chão. Relaxe os ombros.' },
            { titulo: 'Atenção à Respiração', texto: 'Observe sua respiração natural. Não tente mudá-la. Apenas observe o ar entrando e saindo.' },
            { titulo: 'Observar Pensamentos', texto: 'Se pensamentos surgirem, apenas observe-os sem julgamento. Deixe-os passar como nuvens no céu.' },
            { titulo: 'Gratidão', texto: 'Traga à mente algo pelo qual você é grato(a). Sinta a gratidão no seu coração.' },
            { titulo: 'Encerramento', texto: 'Gentilmente traga sua atenção de volta. Mova os dedos das mãos e pés. Abra os olhos quando estiver pronto(a).' },
        ],
    },
};
