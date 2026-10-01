// Cabeçalho, rodapé e utilitários compartilhados por todas as páginas.
(function () {
    const NAV = [
        { page: 'inicio', href: 'index.html', icon: 'fa-home', label: 'Início' },
        { page: 'videos', href: 'videos.html', icon: 'fa-video', label: 'Desenvolvimento' },
        { page: 'leitura', href: 'leitura.html', icon: 'fa-book-open', label: 'Leitura' },
        { page: 'atividades', href: 'atividades.html', icon: 'fa-gamepad', label: 'Atividades' },
        { page: 'agendamento', href: 'agendamento.html', icon: 'fa-calendar-check', label: 'Agendar' },
    ];

    function renderHeader() {
        const el = document.getElementById('site-header');
        if (!el) return;
        const current = document.body.dataset.page;
        const links = NAV.map(n =>
            `<li><a href="${n.href}" class="nav-link${n.page === current ? ' active' : ''}"` +
            `${n.page === current ? ' aria-current="page"' : ''}><i class="fas ${n.icon}"></i> ${n.label}</a></li>`
        ).join('');

        el.innerHTML = `
        <nav class="navbar">
            <div class="container nav-container">
                <a href="index.html" class="nav-logo">
                    <i class="fas fa-spa"></i>
                    <span>Harmonie</span>
                </a>
                <button class="nav-toggle" id="navToggle" aria-label="Abrir menu" aria-expanded="false">
                    <i class="fas fa-bars"></i>
                </button>
                <ul class="nav-menu" id="navMenu">${links}</ul>
            </div>
        </nav>`;

        const toggle = document.getElementById('navToggle');
        const menu = document.getElementById('navMenu');
        toggle.addEventListener('click', () => {
            const open = menu.classList.toggle('active');
            toggle.setAttribute('aria-expanded', open);
        });
        menu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => menu.classList.remove('active'));
        });
    }

    function renderFooter() {
        const el = document.getElementById('site-footer');
        if (!el) return;
        const ano = new Date().getFullYear();

        el.innerHTML = `
        <footer class="footer">
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-section">
                        <h3><i class="fas fa-spa"></i> Harmonie</h3>
                        <p>Seu espaço seguro para cuidar da saúde mental. Aqui você encontra recursos, apoio e acolhimento profissional.</p>
                        <p class="footer-note">Os conteúdos deste site não substituem acompanhamento profissional.</p>
                    </div>
                    <div class="footer-section">
                        <h3>Navegação</h3>
                        <ul>
                            <li><a href="videos.html">Desenvolvimento Pessoal</a></li>
                            <li><a href="leitura.html">Material de Leitura</a></li>
                            <li><a href="atividades.html">Atividades Terapêuticas</a></li>
                            <li><a href="agendamento.html">Agendar Consulta</a></li>
                            <li><a href="sobre.html">Sobre</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h3>Emergência</h3>
                        <p><strong>CVV - Centro de Valorização da Vida</strong></p>
                        <p><i class="fas fa-phone"></i> Ligue 188</p>
                        <p><i class="fas fa-comment"></i> Chat: <a href="https://cvv.org.br" target="_blank" rel="noopener">cvv.org.br</a></p>
                        <p class="footer-note">Disponível 24h, todos os dias</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${ano} Harmonie<span id="footerProfissional"></span>. Cuidando de você com carinho e profissionalismo.</p>
                    <p><a href="admin/" class="footer-note">Área do profissional</a></p>
                </div>
            </div>
        </footer>`;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 'AAAA-MM-DD' -> 'DD/MM/AAAA'
    function formatDate(iso) {
        const [a, m, d] = String(iso).slice(0, 10).split('-');
        return d && m && a ? `${d}/${m}/${a}` : '';
    }

    function showNotification(message, type = 'sucesso') {
        const icons = { sucesso: 'check-circle', erro: 'exclamation-circle', info: 'info-circle' };
        const n = document.createElement('div');
        n.className = `flash-message flash-${type}`;
        n.setAttribute('role', 'status');
        n.innerHTML = `<i class="fas fa-${icons[type] || icons.info}"></i><span></span>`;
        n.querySelector('span').textContent = message;
        // Abaixo da barra de navegação, para não cobrir os botões dela.
        Object.assign(n.style, { position: 'fixed', top: '88px', right: '20px', zIndex: '9999' });
        document.body.appendChild(n);
        setTimeout(() => {
            n.style.opacity = '0';
            setTimeout(() => n.remove(), 300);
        }, 4000);
    }

    // Filtro por categoria com ?categoria=... na URL.
    function setupCategoryFilter(container, items, onChange) {
        const categorias = [...new Set(items.map(i => i.categoria))];
        const params = new URLSearchParams(location.search);
        let atual = params.get('categoria');
        if (!categorias.includes(atual)) atual = null;

        function render() {
            container.innerHTML = [null, ...categorias].map(cat =>
                `<button type="button" class="filter-tag${cat === atual ? ' active' : ''}" data-cat="${escapeHtml(cat || '')}">` +
                `${escapeHtml(cat || 'Todos')}</button>`
            ).join('');
            onChange(atual ? items.filter(i => i.categoria === atual) : items);
        }

        container.addEventListener('click', e => {
            const btn = e.target.closest('.filter-tag');
            if (!btn) return;
            atual = btn.dataset.cat || null;
            const url = new URL(location.href);
            if (atual) url.searchParams.set('categoria', atual);
            else url.searchParams.delete('categoria');
            history.replaceState(null, '', url);
            render();
        });

        if (categorias.length) render();
        else onChange(items);
    }

    // ID de 11 caracteres de um link do YouTube (watch, youtu.be, embed, shorts).
    function youtubeId(url) {
        const m = String(url || '').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
        return m ? m[1] : null;
    }

    // Preenche dados do profissional no rodapé.
    function applySite(site) {
        const el = document.getElementById('footerProfissional');
        if (!el || !site) return;
        el.textContent = [site.profissional, site.registro].filter(Boolean).map(s => ' · ' + s).join('');
    }

    // Texto com quebras de linha → parágrafos (conteúdo escapado).
    function linesToParagraphs(text) {
        return String(text || '').split('\n').map(l => l.trim()).filter(Boolean)
            .map(l => `<p>${escapeHtml(l)}</p>`).join('');
    }

    // Conteúdo dinâmico fica oculto (classe is-loading) até a página carregar os dados.
    function doneLoading() {
        document.body.classList.remove('is-loading');
    }

    function loadError(err) {
        console.error(err);
        doneLoading();
        showNotification('Não foi possível carregar o conteúdo. Verifique sua conexão e recarregue a página.', 'erro');
    }

    window.Harmonie = {
        escapeHtml, formatDate, showNotification, setupCategoryFilter, youtubeId,
        applySite, linesToParagraphs, doneLoading, loadError,
    };

    // Área Exclusiva: quando ativa no painel, aparece no menu, no rodapé e nas chamadas
    // marcadas com data-cta-assinatura (página inicial e artigos).
    function loadAssinatura() {
        if (!document.getElementById('site-header')) return;
        Promise.all([import('./store.js'), import('./assinatura-ui.js')])
            .then(([store, ui]) => store.getAssinatura().then(a => ({ a, ui })))
            .then(({ a, ui }) => {
                if (!a.ativa || ui.planosDisponiveis(a).length === 0) return;
                const current = document.body.dataset.page;

                const li = document.createElement('li');
                li.innerHTML = `<a href="assinatura.html" class="nav-link${current === 'assinatura' ? ' active' : ''}">`
                    + `<i class="fas fa-crown"></i> Exclusivo</a>`;
                const menu = document.getElementById('navMenu');
                menu.insertBefore(li, menu.lastElementChild);
                li.querySelector('a').addEventListener('click', () => menu.classList.remove('active'));

                const nav = document.querySelector('.footer-section ul');
                if (nav) nav.insertAdjacentHTML('beforeend', '<li><a href="assinatura.html">Área Exclusiva</a></li>');

                document.querySelectorAll('[data-cta-assinatura]').forEach(el => {
                    el.innerHTML = `
                    <section class="cta-section">
                        <div class="container">
                            <div class="cta-card cta-exclusivo">
                                <div class="cta-content">
                                    <h2>${escapeHtml(a.titulo)}</h2>
                                    <p>${escapeHtml(a.chamada)}</p>
                                    <a href="assinatura.html" class="btn btn-primary"><i class="fas fa-crown"></i> Conhecer os planos</a>
                                </div>
                                <div class="cta-decoration"><i class="fas fa-crown"></i></div>
                            </div>
                        </div>
                    </section>`;
                    el.hidden = false;
                });
            })
            .catch(err => console.error(err));
    }

    renderHeader();
    renderFooter();
    loadAssinatura();
    setTimeout(doneLoading, 10000);
})();
