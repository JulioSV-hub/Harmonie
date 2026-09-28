"""
Adiciona o artigo 'Cuidar de Si Também é Saúde' ao banco de dados existente,
sem apagar os dados atuais.
Execute: python add_artigo.py
"""
from app import create_app, db
from app.models import Artigo

CONTEUDO = '''<p>Pare por alguns segundos e pense: como você realmente está?</p>

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

<p>Porque grandes mudanças, muitas vezes, começam justamente com uma pequena pergunta.</p>'''

app = create_app()

with app.app_context():
    # Verifica se o artigo já existe para não duplicar
    existente = Artigo.query.filter_by(titulo='Cuidar de Si Também é Saúde').first()
    if existente:
        existente.conteudo = CONTEUDO
        existente.resumo = 'Como você realmente está? Um convite para apertar o botão de pausa, olhar para dentro e descobrir o poder do autoconhecimento no cuidado com a saúde mental.'
        existente.categoria = 'Reflexão'
        existente.autor = 'Fernando Fernandes'
        db.session.commit()
        print('✅ Artigo atualizado com sucesso!')
    else:
        artigo = Artigo(
            titulo='Cuidar de Si Também é Saúde',
            conteudo=CONTEUDO,
            resumo='Como você realmente está? Um convite para apertar o botão de pausa, olhar para dentro e descobrir o poder do autoconhecimento no cuidado com a saúde mental.',
            categoria='Reflexão',
            autor='Fernando Fernandes'
        )
        db.session.add(artigo)
        db.session.commit()
        print('✅ Artigo "Cuidar de Si Também é Saúde" adicionado com sucesso!')
