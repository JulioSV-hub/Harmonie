# Harmonie

Site de saúde mental e bem-estar do terapeuta integrativo Fernando Fernandes. Tem vídeos, artigos, atividades terapêuticas (respiração, meditação e diário de gratidão), pedidos de agendamento pelo WhatsApp e um **painel admin com login** para o dono editar tudo.

- **Site:** HTML, CSS e JavaScript puros, na pasta [`docs/`](docs/). Hospedado no GitHub Pages, sem etapa de build.
- **Login e dados:** Firebase (Authentication e Firestore), no plano gratuito.
- **Painel admin:** `https://<site>/admin/`.

## O que o dono edita pelo painel

| Aba | Conteúdo |
|---|---|
| Agendamentos | Ver pedidos, confirmar, cancelar, marcar como concluído e excluir |
| Vídeos | Criar, editar e excluir (basta colar o link do YouTube) |
| Artigos | Criar e editar com editor de texto formatado, rascunho ou publicado, destaque na página inicial |
| Textos e dados | Nome, profissão, registro profissional, WhatsApp, foto, apresentação, textos da página inicial e da página Sobre, horários de atendimento |
| Atividades | Fases e tempos da respiração, benefícios, etapas e duração da meditação |
| Assinatura | Página "Área Exclusiva": planos mensal/anual, preços, links de checkout da plataforma de pagamento, benefícios; liga/desliga a página |

As alterações aparecem no site na hora.

## Assinatura (Área Exclusiva)

O pagamento e o conteúdo exclusivo ficam numa plataforma parceira (recomendada: Kiwify), que cuida de Pix/cartão, recorrência, cancelamento e área de membros. O site só apresenta os planos e leva ao checkout:

1. Na plataforma, crie o produto de assinatura com dois planos (mensal e anual) e copie o **link de checkout** de cada um e o link da **área de membros**.
2. No painel, aba **Assinatura**: preencha preços e links, use **Pré-visualizar** e marque **Página ativa no site**.
3. Com a página ativa, aparecem o item **Exclusivo** no menu, o link no rodapé e uma chamada na página inicial e no fim dos artigos. Desativada, a página mostra "Em breve".

## Colocar no ar

1. **Configurar o Firebase:** siga o [SETUP-FIREBASE.md](SETUP-FIREBASE.md), o que inclui criar o login do dono.
2. **Publicar no GitHub Pages:**
   ```bash
   git remote add origin https://github.com/<usuario>/<repositorio>.git
   git push -u origin main
   ```
   No GitHub, abra **Settings → Pages**. Em **Source**, escolha **Deploy from a branch**. Em **Branch**, escolha `main` e a pasta **`/docs`**. Em cerca de 1 minuto, o site estará em `https://<usuario>.github.io/<repositorio>/`.

Enquanto o Firebase não estiver configurado, o site funciona com o conteúdo de exemplo e o painel mostra "Painel indisponível".

## Estrutura

```
docs/                     site publicado
  admin/index.html        painel admin
  assets/js/
    firebase-config.js    chaves do projeto Firebase (preencher)
    store.js              leitura do conteúdo e envio de agendamentos
    admin.js              lógica do painel
    defaults.js           textos e atividades padrão
    seed-conteudo.js      vídeos e artigos de exemplo
    layout.js             menu, rodapé e utilitários
firestore.rules           regras de acesso ao banco (colar no Console do Firebase)
firebase.json             configuração do emulador local
```

## Testar localmente

```bash
python -m http.server 8000 --directory docs
# abra http://localhost:8000
```

É preciso usar um servidor local: abrir o arquivo direto no navegador (`file://`) não funciona, porque o site usa módulos JavaScript. Para testar o painel sem um projeto real, veja a seção de emulador no [SETUP-FIREBASE.md](SETUP-FIREBASE.md).

## Privacidade

- **Diário de Gratidão:** fica apenas no navegador de cada visitante. Nada é enviado pela internet.
- **Pedidos de agendamento:** são enviados pelo WhatsApp e registrados no Firestore. Pelas regras de acesso, só o admin consegue ler esses registros.
- O site não tem cookies de rastreamento nem analytics.

## Protótipo Flask (legado)

Os arquivos `app/`, `run.py`, `config.py`, `seed_db.py` e `add_artigo.py` são a versão original em Flask. Eles não fazem parte do site publicado. O `harmony.db` está no `.gitignore`.
