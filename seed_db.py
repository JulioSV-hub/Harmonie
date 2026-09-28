"""
Script para popular o banco de dados com dados demo.
Execute: python seed_db.py
"""
from app import create_app, db
from app.models import User, Video, Artigo, Agendamento, EntradaDiario
from werkzeug.security import generate_password_hash
from datetime import datetime, date, timedelta

app = create_app()

with app.app_context():
    # Limpar dados existentes
    db.drop_all()
    db.create_all()

    # === USUÁRIO ADMIN ===
    admin = User(
        nome='Fernando Fernandes',
        email='admin@harmony.com',
        senha_hash=generate_password_hash('admin123'),
        is_admin=True
    )
    db.session.add(admin)

    # === VÍDEOS DE DESENVOLVIMENTO PESSOAL ===
    videos = [
        Video(
            titulo='Como lidar com a ansiedade no dia a dia',
            descricao='Técnicas práticas para gerenciar a ansiedade em situações cotidianas. Aprenda a reconhecer os sinais e controlar os sintomas.',
            url_youtube='https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            categoria='Ansiedade',
            thumbnail='https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        ),
        Video(
            titulo='Mindfulness: Vivendo o momento presente',
            descricao='Introdução à prática de mindfulness e como ela pode transformar sua relação com pensamentos negativos.',
            url_youtube='https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            categoria='Mindfulness',
            thumbnail='https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        ),
        Video(
            titulo='Construindo uma autoestima saudável',
            descricao='Entenda o que é autoestima, como ela se forma e passos para fortalecê-la no seu dia a dia.',
            url_youtube='https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            categoria='Autoestima',
            thumbnail='https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        ),
        Video(
            titulo='Sono e saúde mental: a conexão essencial',
            descricao='Como a qualidade do sono afeta sua saúde mental e dicas para melhorar sua rotina noturna.',
            url_youtube='https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            categoria='Sono',
            thumbnail='https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        ),
        Video(
            titulo='Comunicação não-violenta nos relacionamentos',
            descricao='Aprenda técnicas de comunicação que fortalecem vínculos e reduzem conflitos.',
            url_youtube='https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            categoria='Relacionamentos',
            thumbnail='https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        ),
        Video(
            titulo='Superando a procrastinação',
            descricao='Entenda as raízes emocionais da procrastinação e descubra estratégias para superá-la com gentileza.',
            url_youtube='https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            categoria='Motivação',
            thumbnail='https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        ),
    ]
    db.session.add_all(videos)

    # === ARTIGOS DE LEITURA ===
    artigos = [
        Artigo(
            titulo='Cuidar de Si Também é Saúde',
            conteudo='''<p>Pare por alguns segundos e pense: como você realmente está?</p>

<p>Não estou perguntando se está tudo bem. Essa é uma resposta que muitas vezes damos automaticamente.</p>

<p>Estou perguntando outra coisa: <strong>Como você tem se sentido nos últimos dias?</strong></p>

<p>Você tem dormido bem? Tem conseguido descansar de verdade? Tem acordado disposto ou já começa o dia cansado?</p>

<p>E quando alguma coisa incomoda você, o que costuma fazer: enfrenta, conversa sobre isso ou simplesmente tenta não pensar?</p>

<h3>Aperte o botão de pausa</h3>

<p>Agora, imagine que você pudesse apertar o botão de pausa por alguns minutos.</p>

<p>Sem celular. Sem cobranças. Sem precisar resolver nada. Apenas observar.</p>

<p>O que estaria acontecendo dentro de você nesse momento?</p>

<p>Talvez você perceba uma preocupação que vem se repetindo. Talvez um pensamento que aparece todos os dias. Talvez uma sensação no corpo que você já se acostumou a ignorar.</p>

<p>E aqui começa uma questão importante: <em>Será que estamos realmente percebendo o que sentimos ou apenas funcionando no automático?</em></p>

<p>Nossa rotina pode ser tão acelerada que passamos boa parte do tempo reagindo às situações, cumprindo tarefas e tentando dar conta de tudo, sem reservar espaço para olhar para nós mesmos.</p>

<p>Mas pense: se você não para para perceber o que está acontecendo com você, como vai saber do que realmente precisa?</p>

<h3>É aí que entra o autoconhecimento</h3>

<p>Autoconhecimento não significa analisar cada pensamento ou tentar controlar todas as emoções. Significa desenvolver a capacidade de observar, compreender e fazer escolhas mais conscientes.</p>

<p>Por exemplo:</p>

<ul>
<li>Quando você fica irritado, sabe o que realmente desencadeou essa irritação?</li>
<li>Quando sente ansiedade, consegue identificar quais pensamentos aparecem?</li>
<li>Quando está triste, você se permite sentir ou imediatamente tenta fugir da sensação?</li>
<li>E quando algo não acontece como você gostaria, como você costuma falar consigo mesmo?</li>
</ul>

<p>Essas perguntas parecem simples, mas podem revelar muita coisa.</p>

<p>O cuidado com a saúde mental não precisa começar somente quando existe um grande problema. Ele também pode começar antes — através da prevenção, do conhecimento, da reflexão e de pequenas mudanças na maneira como lidamos com nossa própria vida.</p>

<p>É justamente essa a proposta desta plataforma.</p>

<p>Aqui, você encontrará conteúdos, exercícios e práticas que podem ajudar a desenvolver uma relação mais consciente com seus pensamentos, emoções, comportamentos e hábitos.</p>

<h3>Um ponto importante</h3>

<p>Mas existe algo importante que precisamos deixar claro: <strong>autocuidado não substitui tratamento.</strong></p>

<p>Se você está enfrentando um sofrimento intenso ou persistente, se percebe mudanças importantes no sono, no comportamento, nos relacionamentos ou na capacidade de realizar suas atividades, procure ajuda de um profissional qualificado.</p>

<p>Psicólogos e outros profissionais da saúde podem oferecer um acompanhamento individualizado e adequado às suas necessidades.</p>

<p>Esta plataforma não pretende substituir esse cuidado. Ela pretende ser uma ferramenta complementar. Um espaço para aprender. Para refletir. Para experimentar novas estratégias. E, principalmente, para começar a olhar para si com mais atenção.</p>

<h3>Uma última pergunta</h3>

<p>Então, antes de continuar, quero deixar uma última pergunta:</p>

<p><em>Se você começasse hoje a cuidar um pouco melhor de si, qual seria a primeira coisa que poderia mudar?</em></p>

<p>Talvez a resposta seja pequena. E tudo bem.</p>

<p>Porque grandes mudanças, muitas vezes, começam justamente com uma pequena pergunta.</p>''',
            resumo='Como você realmente está? Um convite para apertar o botão de pausa, olhar para dentro e descobrir o poder do autoconhecimento no cuidado com a saúde mental.',
            categoria='Reflexão',
            autor='Fernando Fernandes'
        ),
        Artigo(
            titulo='5 Técnicas de Respiração para Acalmar a Ansiedade',
            conteudo='''<p>A ansiedade é uma resposta natural do nosso corpo, mas quando se torna excessiva, pode prejudicar nossa qualidade de vida. A boa notícia é que existem técnicas simples que podem ajudar a acalmar o sistema nervoso.</p>

<h3>1. Respiração 4-7-8</h3>
<p>Inspire por 4 segundos, segure por 7 segundos e expire por 8 segundos. Essa técnica ativa o sistema nervoso parassimpático, promovendo relaxamento.</p>

<h3>2. Respiração Diafragmática</h3>
<p>Coloque uma mão no peito e outra no abdômen. Respire de forma que apenas a mão do abdômen se mova. Isso promove uma respiração mais profunda e relaxante.</p>

<h3>3. Respiração Quadrada</h3>
<p>Inspire por 4 segundos, segure por 4, expire por 4 e aguarde 4 segundos antes de inspirar novamente. Útil em momentos de estresse agudo.</p>

<h3>4. Respiração Alternada</h3>
<p>Feche uma narina, inspire pela outra, depois alterne. Essa técnica equilibra os hemisférios cerebrais e promove calma.</p>

<h3>5. Suspiro Fisiológico</h3>
<p>Faça duas inspirações curtas pelo nariz seguidas de uma expiração longa pela boca. É a forma mais rápida de acalmar o sistema nervoso.</p>

<p><em>Lembre-se: a prática regular é mais importante que a perfeição. Comece com 2-3 minutos por dia e aumente gradualmente.</em></p>''',
            resumo='Técnicas simples de respiração que podem ajudar a reduzir a ansiedade e promover o relaxamento.',
            categoria='Ansiedade',
            autor='Fernando Fernandes'
        ),
        Artigo(
            titulo='O Poder da Gratidão na Saúde Mental',
            conteudo='''<p>Estudos científicos mostram que a prática regular da gratidão pode transformar significativamente nossa saúde mental. Pessoas que cultivam a gratidão tendem a ter menos sintomas de depressão e ansiedade.</p>

<h3>O que diz a ciência</h3>
<p>Pesquisas em neurociência demonstram que a gratidão ativa áreas do cérebro relacionadas ao prazer e à recompensa, liberando dopamina e serotonina — neurotransmissores do bem-estar.</p>

<h3>Como praticar</h3>
<ul>
<li><strong>Diário de Gratidão:</strong> Anote 3 coisas pelas quais você é grato(a) todos os dias</li>
<li><strong>Cartas de Gratidão:</strong> Escreva para alguém que fez diferença na sua vida</li>
<li><strong>Momento de Pausa:</strong> Antes de dormir, reflita sobre o dia com olhos de gratidão</li>
</ul>

<h3>Benefícios comprovados</h3>
<p>A prática regular da gratidão pode: melhorar a qualidade do sono, reduzir a ansiedade, fortalecer relacionamentos, aumentar a resiliência e promover uma visão mais positiva da vida.</p>

<p><em>Comece hoje: use nossa ferramenta de Diário de Gratidão aqui na plataforma!</em></p>''',
            resumo='Descubra como a prática da gratidão pode melhorar sua saúde mental e emocional, segundo a ciência.',
            categoria='Bem-estar',
            autor='Fernando Fernandes'
        ),
        Artigo(
            titulo='Entendendo a Depressão: Sinais, Mitos e Caminhos',
            conteudo='''<p>A depressão é muito mais do que "tristeza". É uma condição de saúde mental que afeta milhões de pessoas e merece atenção, cuidado e tratamento profissional.</p>

<h3>Sinais de alerta</h3>
<ul>
<li>Tristeza persistente por mais de duas semanas</li>
<li>Perda de interesse em atividades que antes eram prazerosas</li>
<li>Alterações no sono (insônia ou excesso de sono)</li>
<li>Fadiga constante e falta de energia</li>
<li>Dificuldade de concentração</li>
<li>Sentimentos de culpa ou inutilidade</li>
</ul>

<h3>Mitos que precisamos derrubar</h3>
<p><strong>"É frescura"</strong> — Depressão é uma condição médica real com alterações neuroquímicas no cérebro.</p>
<p><strong>"Basta querer melhorar"</strong> — Assim como diabetes ou hipertensão, a depressão requer tratamento adequado.</p>
<p><strong>"Remédio vicia"</strong> — Antidepressivos não causam dependência quando usados corretamente.</p>

<h3>Caminhos para a recuperação</h3>
<p>O tratamento da depressão geralmente envolve psicoterapia, e em alguns casos, medicação. Não hesite em buscar ajuda profissional. O primeiro passo é o mais importante.</p>

<p><em>Se você se identificou com esses sinais, considere agendar uma consulta. Estamos aqui para ajudar.</em></p>''',
            resumo='Entenda o que é depressão de verdade, reconheça os sinais e saiba que existe caminho para a recuperação.',
            categoria='Depressão',
            autor='Fernando Fernandes'
        ),
        Artigo(
            titulo='Mindfulness no Cotidiano: Práticas Simples',
            conteudo='''<p>Mindfulness não precisa ser algo complicado ou demorado. Pequenas práticas ao longo do dia podem transformar sua relação com o estresse e a ansiedade.</p>

<h3>O que é Mindfulness?</h3>
<p>É a prática de estar plenamente presente no momento atual, sem julgamento. É observar seus pensamentos e sensações sem se prender a eles.</p>

<h3>Práticas para o dia a dia</h3>

<p><strong>Ao acordar:</strong> Antes de pegar o celular, faça 3 respirações conscientes e observe como seu corpo se sente.</p>

<p><strong>Ao comer:</strong> Faça pelo menos uma refeição por dia com atenção plena. Observe as cores, texturas, sabores e aromas.</p>

<p><strong>Ao caminhar:</strong> Sinta seus pés tocando o chão, o vento no rosto, os sons ao seu redor.</p>

<p><strong>Ao esperar:</strong> Em filas ou no trânsito, ao invés de pegar o celular, observe sua respiração.</p>

<h3>Os 3 pilares</h3>
<ol>
<li><strong>Intenção:</strong> Decida estar presente</li>
<li><strong>Atenção:</strong> Foque no momento atual</li>
<li><strong>Atitude:</strong> Sem julgamento, com curiosidade</li>
</ol>

<p><em>Experimente nossa Meditação Guiada na seção de Atividades para começar!</em></p>''',
            resumo='Aprenda práticas simples de mindfulness que podem ser incorporadas ao seu dia a dia sem complicação.',
            categoria='Mindfulness',
            autor='Fernando Fernandes'
        ),
    ]
    db.session.add_all(artigos)

    # === AGENDAMENTOS DEMO ===
    hoje = date.today()
    agendamentos = [
        Agendamento(
            nome_paciente='Maria Silva',
            email_paciente='maria@email.com',
            telefone='(11) 98765-4321',
            data_consulta=hoje + timedelta(days=2),
            horario='10:00',
            motivo='Estou enfrentando dificuldades com ansiedade no trabalho.',
            status='pendente'
        ),
        Agendamento(
            nome_paciente='João Santos',
            email_paciente='joao@email.com',
            telefone='(11) 91234-5678',
            data_consulta=hoje + timedelta(days=5),
            horario='14:00',
            motivo='Gostaria de iniciar terapia para autoconhecimento.',
            status='confirmado'
        ),
        Agendamento(
            nome_paciente='Ana Oliveira',
            email_paciente='ana@email.com',
            telefone='(11) 99876-5432',
            data_consulta=hoje + timedelta(days=1),
            horario='09:00',
            motivo='Problemas de relacionamento e comunicação.',
            status='pendente'
        ),
    ]
    db.session.add_all(agendamentos)

    # === ENTRADAS DE DIÁRIO DEMO ===
    entradas = [
        EntradaDiario(
            texto='Hoje foi um dia bom. Consegui completar minhas tarefas e tive tempo para ler.',
            humor=4,
            gratidao='Sou grato pela minha família e pelo café da manhã em paz.',
            criado_em=datetime.utcnow() - timedelta(days=2)
        ),
        EntradaDiario(
            texto='Me senti um pouco ansioso pela manhã, mas o exercício de respiração ajudou.',
            humor=3,
            gratidao='Agradeço pelo sol e pela música que me acompanhou no caminho.',
            criado_em=datetime.utcnow() - timedelta(days=1)
        ),
    ]
    db.session.add_all(entradas)

    db.session.commit()
    print('✅ Banco de dados populado com sucesso!')
    print('')
    print('📋 Dados criados:')
    print(f'   👤 1 usuário admin (admin@harmony.com / admin123)')
    print(f'   🎬 {len(videos)} vídeos de desenvolvimento pessoal')
    print(f'   📖 {len(artigos)} artigos')
    print(f'   📅 {len(agendamentos)} agendamentos')
    print(f'   📓 {len(entradas)} entradas de diário')
