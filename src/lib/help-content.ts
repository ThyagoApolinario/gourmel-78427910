// Central de conteúdo de ajuda — edite aqui sem mexer nos componentes

export interface HelpTopic {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: 'insumos' | 'precificacao' | 'bi' | 'geral';
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
  geral: '📋 Geral',
};
