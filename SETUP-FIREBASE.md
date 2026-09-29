# Configurar o Firebase (login admin e banco de dados)

Guia para o desenvolvedor. Leva uns 15 minutos. Tudo cabe no plano gratuito (Spark).

> **Recomendado:** crie o projeto com a **conta Google do dono do site** e adicione a sua como colaborador (Configurações do projeto → Usuários e permissões). Assim os dados dos pacientes ficam sob responsabilidade do profissional, e você pode sair do projeto no futuro sem que nada se perca.

## 1. Criar o projeto

1. Acesse <https://console.firebase.google.com> e clique em **Criar projeto**.
2. Dê um nome (ex.: `harmony-site`). O Google Analytics pode ficar **desativado**.

## 2. Registrar o app web

1. Na página do projeto, clique no ícone **Web** (`</>`) e registre um app com o nome `Harmonie`. Não é preciso configurar o Firebase Hosting.
2. O console mostra um bloco `firebaseConfig`. Copie os valores para [`docs/assets/js/firebase-config.js`](docs/assets/js/firebase-config.js).

Esses valores não são segredos: eles aparecem no navegador de qualquer visitante. Quem protege os dados são as regras do passo 4.

## 3. Ativar o login

1. Abra **Authentication → Primeiros passos → Método de login**, ative **E-mail/senha** e salve.
2. Em **Authentication → Configurações → Ações do usuário**, **desmarque "Ativar criação (inscrição)"**. Assim ninguém consegue criar conta sozinho.
3. Em **Authentication → Usuários → Adicionar usuário**, informe o e-mail do dono e uma senha provisória.
4. Copie o **UID do usuário** (a coluna "UID do usuário" na lista).
5. Em **Authentication → Configurações → Domínios autorizados**, adicione o domínio do site, ex.: `usuario.github.io`.

## 4. Criar o banco e publicar as regras

1. Abra **Firestore Database → Criar banco de dados**.
2. Escolha **Edição Standard**, local **`southamerica-east1` (São Paulo)** e **modo de produção**.
3. Na aba **Regras**, apague o conteúdo e cole o arquivo [`firestore.rules`](firestore.rules) inteiro. Clique em **Publicar**.

## 5. Tornar o dono administrador

1. Em **Firestore Database → Dados**, clique em **Iniciar coleção**.
2. ID da coleção: `admins`.
3. ID do documento: **o UID copiado no passo 3**.
4. Adicione um campo `nome` (string) com o nome do dono e salve.

Para dar acesso a outra pessoa depois, repita os passos 3.3, 3.4 e 5 com o UID dela. Para remover o acesso, apague o documento dela em `admins`.

## 6. Publicar e fazer o primeiro acesso

1. Faça commit e push. O GitHub Pages publica a pasta `docs/` (veja o [README](README.md)).
2. O dono acessa `https://<site>/admin/`, digita o e-mail e clica em **Esqueci minha senha** para criar a própria senha. Assim você não fica sabendo a senha dele.
3. Já logado, o dono abre a aba **Textos e dados** e clica em **Importar conteúdo inicial**. Isso copia os vídeos, artigos, textos e atividades de exemplo.
4. Ainda em **Textos e dados**, o dono preenche o **WhatsApp** e o **registro profissional**, troca a foto e salva. Até o WhatsApp ser preenchido, o formulário de agendamento não envia nada.
5. O dono troca os vídeos de exemplo pelos reais (todos apontam para o mesmo vídeo de teste).

## O que fica onde

| Dado | Onde | Quem lê | Quem altera |
|---|---|---|---|
| Textos, foto, WhatsApp, horários | `config/site` | Todos | Admin |
| Respiração e meditação | `config/atividades` | Todos | Admin |
| Vídeos | `videos/*` | Todos | Admin |
| Artigos | `artigos/*` | Todos (só publicados) | Admin |
| Pedidos de agendamento | `agendamentos/*` | Só o admin | Público só cria; admin altera ou exclui |
| Administradores | `admins/*` | A própria pessoa | Só pelo console |
| Diário de gratidão | Navegador do visitante | Só o visitante | Só o visitante |

## Recomendações

- **Limite a chave da API** (opcional, mas recomendado): no Google Cloud Console, abra **APIs e serviços → Credenciais**, clique na chave "Browser key", escolha **Restrições de aplicativo → Referenciadores HTTP** e adicione `https://usuario.github.io/*`.
- **Spam de agendamentos:** as regras validam formato e tamanho de cada pedido, mas não limitam a quantidade. Se aparecer spam, ative o **App Check** com reCAPTCHA Enterprise (Firebase → App Check) e me avise para eu adicionar a verificação no site.
- **Backup:** o plano gratuito não faz backup automático. Os pedidos de agendamento também chegam pelo WhatsApp, então a perda de dados tem impacto baixo. Mesmo assim, evite excluir itens em massa.
- **Limites do plano gratuito:** 50 mil leituras e 20 mil gravações por dia. Cada visita de página faz entre 2 e 12 leituras, o que dá milhares de visitas por dia.

## Testar localmente com o emulador (desenvolvedor)

Você vai precisar do Java 11+ e do `firebase-tools`.

```bash
npx firebase-tools emulators:start --only firestore,auth --project demo-harmony
python -m http.server 8000 --directory docs
```

No navegador, em `http://localhost:8000`, rode no console `localStorage.setItem('harmony.emulator', '1')` e recarregue. O site passa a usar o emulador. Crie usuários pela interface do emulador (se ela estiver ativada em `firebase.json`) ou pela API REST.

> O emulador (Java) não abre arquivos em pastas com nome em japonês, como `プロジェクト`. Se isso acontecer, rode o emulador a partir de uma cópia do `firebase.json` e do `firestore.rules` em outra pasta.
