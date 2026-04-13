// Central de conteúdo de ajuda — edite aqui sem mexer nos componentes

export interface HelpTopic {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: 'insumos' | 'precificacao' | 'bi' | 'geral' | 'dicas';
}

export const HELP_TOOLTIPS: Record<string, string> = {
  fator_rendimento:
    'É a relação entre o peso bruto e o peso que realmente vai para a receita. Exemplo: se você compra 1kg de chocolate, mas após a têmpera sobram 950g utilizáveis, o fator é 0,95. Isso garante que o custo real seja calculado corretamente.',
  margem_contribuicao:
    'É o lucro que sobra de cada venda após descontar todos os custos variáveis (insumos, embalagem, mão de obra, taxa de cartão e impostos). Quanto maior, mais o produto contribui para pagar suas contas fixas e gerar lucro.',
  pro_labore:
    'É o "salário" que você se paga como dona do negócio. Definir esse valor é essencial para calcular quanto custa cada minuto do seu tempo na cozinha — e cobrar adequadamente por isso.',
  taxa_cartao:
    'Percentual cobrado pela maquininha ou plataforma de delivery (iFood, Rappi) em cada venda. Ex: se a taxa é 5%, a cada R$100 vendidos, R$5 vão para a plataforma.',
  impostos:
    'Percentual de impostos sobre o faturamento. Para MEI, geralmente é o DAS mensal. Para Simples Nacional, varia conforme a faixa de faturamento.',
  horas_mes:
    'Quantas horas por mês você dedica à confeitaria. Inclua produção, decoração, entrega e administração. Isso define o custo do seu minuto de trabalho.',
  rendimento:
    'Quantas unidades a receita rende. Ex: uma receita de brigadeiro que rende 50 unidades. Essencial para calcular o custo por unidade vendida.',
  tempo_producao:
    'Tempo total para produzir a receita, incluindo preparo, forno, montagem e decoração. Quanto maior o tempo, maior o custo de mão de obra embutido no produto.',
  custo_unitario:
    'Preço de compra dividido pelo peso/volume da embalagem. É o custo de cada grama, mililitro ou unidade do insumo.',
  peso_embalagem:
    'A quantidade total do produto na embalagem como foi comprada. Ex: farinha de 1kg = 1000g, leite condensado = 395g.',
};

export const HELP_TOPICS: HelpTopic[] = [
  // Insumos
  {
    id: 'o-que-sao-insumos',
    titulo: 'O que são Insumos?',
    resumo: 'Entenda a base de custos da sua confeitaria',
    conteudo:
      'Insumos são todas as matérias-primas e embalagens que você usa na produção. Cadastrá-los corretamente é o primeiro passo para saber exatamente quanto custa cada receita. Separe entre Ingredientes (farinha, chocolate, ovos) e Embalagens (caixas, fitas, papel manteiga).',
    categoria: 'insumos',
  },
  {
    id: 'fator-rendimento',
    titulo: 'O que é o Fator de Rendimento?',
    resumo: 'Entenda como perdas no preparo afetam seus custos',
    conteudo:
      'O fator de rendimento é a porcentagem do insumo que efetivamente vai para a receita após o preparo. Por exemplo:\n\n• Chocolate após têmpera: fator 0,95 (5% de perda)\n• Frutas descascadas: fator 0,70 a 0,85\n• Farinha peneirada: fator 0,98\n\nSe o fator é 1.0, significa que você usa 100% do que comprou. Um fator de 0.80 significa que 20% é perdido no preparo. O sistema ajusta automaticamente o custo para refletir essas perdas.',
    categoria: 'insumos',
  },
  // Precificação
  {
    id: 'valor-do-minuto',
    titulo: 'Como o tempo afeta o preço?',
    resumo: 'Entenda por que o tempo de decoração impacta no lucro',
    conteudo:
      'Cada minuto que você passa decorando um bolo tem um custo! Se seu pró-labore é R$ 3.000/mês e você trabalha 160h, cada hora custa R$ 18,75 e cada minuto custa R$ 0,31.\n\nUm bolo com pasta americana que leva 4 horas de decoração tem R$ 75 só de mão de obra. Se você cobra R$ 120 por ele, sobra muito pouco de lucro. Por isso é tão importante incluir o tempo na precificação!',
    categoria: 'precificacao',
  },
  {
    id: 'margem-contribuicao',
    titulo: 'O que é Margem de Contribuição?',
    resumo: 'O indicador mais importante do seu negócio',
    conteudo:
      'A Margem de Contribuição é quanto "sobra" de cada venda para cobrir seus custos fixos (aluguel, energia, internet) e gerar lucro. A fórmula é:\n\nPreço de Venda − Custos Variáveis = Margem de Contribuição\n\nCustos variáveis incluem: insumos + embalagem + mão de obra + taxa de cartão + impostos.\n\nSe a margem é 30%, significa que a cada R$ 100 vendidos, R$ 30 ficam para você. O sistema calcula o preço sugerido para atingir a margem que você deseja.',
    categoria: 'precificacao',
  },
  {
    id: 'formula-preco',
    titulo: 'Como o preço sugerido é calculado?',
    resumo: 'Entenda a fórmula por trás da sugestão',
    conteudo:
      'O sistema usa a fórmula de Markup por Margem de Contribuição:\n\nPreço = Custo Total ÷ (1 − Taxa Cartão% − Impostos% − Margem%)\n\nExemplo: Se o custo total é R$ 30, taxa de cartão 5%, impostos 5% e margem desejada 30%:\n\nPreço = 30 ÷ (1 − 0,05 − 0,05 − 0,30) = 30 ÷ 0,60 = R$ 50,00\n\nAssim, dos R$ 50: R$ 2,50 vão para o cartão, R$ 2,50 para impostos, R$ 15 é sua margem, e R$ 30 cobrem os custos.',
    categoria: 'precificacao',
  },
  // BI / Dashboard
  {
    id: 'matriz-kasavana',
    titulo: 'O que é a Matriz de Engenharia de Cardápio?',
    resumo: 'Conheça a ferramenta que restaurantes profissionais usam',
    conteudo:
      'A Matriz de Kasavana & Smith classifica cada produto do seu cardápio em 4 categorias baseadas em popularidade (volume de vendas) e rentabilidade (margem de contribuição):\n\n⭐ Estrelas — Vendem muito E dão muito lucro. São seus campeões!\n⚡ Cavalos de Carga — Vendem muito, MAS dão pouco lucro. Aumente o preço.\n🧩 Quebra-cabeças — Vendem pouco, MAS dão bom lucro. Divulgue mais.\n🐕 Cães — Vendem pouco E dão pouco lucro. Considere tirar do cardápio.',
    categoria: 'bi',
  },
  {
    id: 'produto-cao',
    titulo: 'O que fazer com um produto "Cão"?',
    resumo: 'Estratégias para produtos que não performam',
    conteudo:
      'Um produto classificado como "Cão" não é necessariamente ruim. Antes de remover do cardápio, considere:\n\n1. Rever a receita — Trocar insumos caros por alternativas mais baratas\n2. Aumentar o preço — Talvez o preço esteja muito baixo\n3. Fazer promoções cruzadas — Vender junto com Estrelas\n4. Reduzir o tempo de produção — Simplificar a decoração\n5. Remover do cardápio — Se nada funcionar, libere espaço para produtos melhores\n\nO importante é tomar essa decisão com dados, não com intuição!',
    categoria: 'bi',
  },
  // Dicas Práticas
  {
    id: 'armazenamento-insumos',
    titulo: 'Como armazenar insumos corretamente?',
    resumo: 'Conserve seus ingredientes e evite desperdício',
    conteudo:
      'O armazenamento correto dos insumos protege a qualidade dos seus produtos e evita prejuízo com perdas:\n\n🧊 Refrigerados (2°C a 8°C): manteigas, cremes, frutas frescas, leite e ovos. Sempre tampados e identificados com data.\n\n🌡️ Congelados (-18°C): massas prontas, polpas de frutas, chocolates moldados. Use embalagens herméticas para evitar queima de frio.\n\n🏠 Temperatura ambiente: farinhas, açúcares, cacau em pó. Guarde em potes fechados, longe da umidade e da luz direta.\n\n💡 Dica de ouro: Use a regra PVPS (Primeiro que Vence, Primeiro que Sai). Coloque os produtos mais antigos na frente para usar antes!\n\n📋 Etiquete tudo: coloque o nome, a data de abertura e a validade em cada pote. Isso evita surpresas desagradáveis.',
    categoria: 'dicas',
  },
  {
    id: 'fotografar-produtos',
    titulo: 'Como fotografar seus produtos para venda?',
    resumo: 'Dicas simples para fotos que vendem mais',
    conteudo:
      'Fotos bonitas fazem toda a diferença nas vendas — e você não precisa de equipamento profissional!\n\n📱 Com o celular:\n• Use luz natural (perto de uma janela, nunca sob luz amarela direta)\n• Limpe a câmera antes de fotografar\n• Ative o modo retrato para desfocar o fundo\n\n🎨 Composição:\n• Fundo limpo e neutro (papel cartão branco ou madeira clara)\n• Adicione elementos que contem uma história: espátula, ingredientes, flores\n• Fotografe de cima (flat lay) para bolos redondos e de lado para bolos altos\n\n✨ Edição rápida:\n• Aumente levemente o brilho e a saturação\n• Ajuste o balanço de branco para cores fiéis\n• Use apps gratuitos como Snapseed ou Lightroom Mobile\n\n🚫 Evite:\n• Flash (deixa o doce com aparência artificial)\n• Fundos bagunçados\n• Fotos escuras ou tremidas',
    categoria: 'dicas',
  },
  {
    id: 'dicas-embalagem',
    titulo: 'Embalagem: como embalar com carinho e economia?',
    resumo: 'Proteja seus produtos e encante seus clientes',
    conteudo:
      'A embalagem é o primeiro contato visual do cliente com o seu produto — ela comunica profissionalismo e cuidado.\n\n📦 Escolhendo a embalagem certa:\n• Bolos: caixas de papelão com visor (o cliente adora espiar!)\n• Brigadeiros/docinhos: forminhas em caixas com berço\n• Cookies: saquinhos transparentes com lacre\n• Tortas: caixas rígidas para proteger a decoração\n\n💰 Economizando sem perder qualidade:\n• Compre embalagens no atacado (economize até 40%)\n• Padronize tamanhos para reduzir variedade de estoque\n• Use adesivos personalizados em vez de caixas impressas\n\n🎀 Toques especiais que encantam:\n• Cartãozinho de agradecimento escrito à mão\n• Fita de cetim ou barbante rústico\n• Instruções de conservação e validade\n• QR Code para suas redes sociais\n\n⚠️ Não esqueça: inclua SEMPRE o custo da embalagem na sua ficha técnica! Cadastre cada item como insumo do tipo "Embalagem" no sistema.',
    categoria: 'dicas',
  },
  {
    id: 'higiene-cozinha',
    titulo: 'Boas práticas de higiene na cozinha',
    resumo: 'Segurança alimentar para confeitaria artesanal',
    conteudo:
      'A higiene é a base de tudo na confeitaria. Além de proteger seus clientes, evita desperdício e retrabalho:\n\n🧼 Antes de começar:\n• Lave bem as mãos com água e sabão por 20 segundos\n• Prenda o cabelo e use avental limpo\n• Higienize a bancada com álcool 70%\n\n🍳 Durante a produção:\n• Não prove com a mesma colher que mexe\n• Separe utensílios para alimentos crus e prontos\n• Mantenha panos de prato sempre limpos e secos\n\n🧹 Após a produção:\n• Lave todos os utensílios imediatamente\n• Limpe o forno e a bancada\n• Descarte resíduos corretamente\n\n📋 Documentação:\n• Mantenha um caderno de controle de validade\n• Anote temperaturas da geladeira diariamente\n• Guarde notas fiscais dos insumos por segurança',
    categoria: 'dicas',
  },
  // Geral
  {
    id: 'primeiros-passos',
    titulo: 'Por onde começar?',
    resumo: 'Guia rápido para configurar seu sistema',
    conteudo:
      'Siga esta ordem para aproveitar ao máximo o sistema:\n\n1. ⚙️ Configure seu pró-labore e horas de trabalho em Configurações\n2. 🧈 Cadastre seus insumos (ingredientes e embalagens)\n3. 📖 Crie suas receitas com ficha técnica completa\n4. 💰 Use a precificação para encontrar o preço ideal\n5. 📊 Registre vendas e acompanhe o Dashboard\n\nCada passo alimenta o próximo. Quanto mais dados, melhores as sugestões do sistema!',
    categoria: 'geral',
  },
];

export const CATEGORIA_LABELS: Record<string, string> = {
  insumos: '🧈 Insumos',
  precificacao: '💰 Precificação',
  bi: '📊 Inteligência de Negócio',
  dicas: '✨ Dicas Práticas',
  geral: '📋 Geral',
};