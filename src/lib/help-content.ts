// Central de conteúdo de ajuda — edite aqui sem mexer nos componentes
// Adaptado para Confeitaria Canina Natural 🐾

export interface HelpTopic {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: 'insumos' | 'precificacao' | 'bi' | 'geral' | 'dicas';
}

export const HELP_TOOLTIPS: Record<string, string> = {
  fator_rendimento:
    'É a relação entre o peso bruto e o peso que realmente vai para a receita. Exemplo: se você compra 1kg de fígado bovino, mas após limpeza e cozimento sobram 800g utilizáveis, o fator é 0,80. Isso garante que o custo real seja calculado corretamente.',
  margem_contribuicao:
    'É o lucro que sobra de cada venda após descontar todos os custos variáveis (ingredientes naturais, embalagem, mão de obra, taxa de cartão e impostos). Quanto maior, mais o produto contribui para pagar suas contas fixas e gerar lucro.',
  pro_labore:
    'É o "salário" que você se paga como dona do negócio. Definir esse valor é essencial para calcular quanto custa cada minuto do seu tempo na cozinha — e cobrar adequadamente por isso.',
  taxa_cartao:
    'Percentual cobrado pela maquininha ou plataforma de delivery (iFood Pet, Rappi) em cada venda. Ex: se a taxa é 5%, a cada R$100 vendidos, R$5 vão para a plataforma.',
  impostos:
    'Percentual de impostos sobre o faturamento. Para MEI, geralmente é o DAS mensal. Para Simples Nacional, varia conforme a faixa de faturamento.',
  horas_mes:
    'Quantas horas por mês você dedica à confeitaria pet. Inclua produção, embalagem, entrega e administração. Isso define o custo do seu minuto de trabalho.',
  rendimento:
    'Quantas unidades a receita rende. Ex: uma receita de biscoito de cenoura que rende 60 unidades. Essencial para calcular o custo por unidade vendida.',
  tempo_producao:
    'Tempo total para produzir a receita, incluindo preparo, forno e embalagem. Quanto maior o tempo, maior o custo de mão de obra embutido no produto.',
  custo_unitario:
    'Preço de compra dividido pelo peso/volume da embalagem. É o custo de cada grama, mililitro ou unidade do ingrediente natural.',
  peso_embalagem:
    'A quantidade total do produto na embalagem como foi comprada. Ex: farinha de arroz de 1kg = 1000g, batata-doce = 500g.',
};

export const HELP_TOPICS: HelpTopic[] = [
  // Ingredientes Naturais
  {
    id: 'o-que-sao-insumos',
    titulo: 'O que são Ingredientes Naturais?',
    resumo: 'Entenda a base de custos da sua confeitaria pet',
    conteudo:
      'Ingredientes naturais são todas as matérias-primas e embalagens que você usa na produção dos petiscos. Cadastrá-los corretamente é o primeiro passo para saber exatamente quanto custa cada receita.\n\nSepare entre:\n🥕 Ingredientes — farinha de arroz, batata-doce, fígado bovino, cenoura, óleo de coco\n📦 Embalagens — saquinhos kraft, etiquetas, fitas, potes herméticos\n\n💡 Dica: Ingredientes sem glúten e sem corantes artificiais costumam ter custo mais alto. Registre tudo para precificar corretamente!',
    categoria: 'insumos',
  },
  {
    id: 'fator-rendimento',
    titulo: 'O que é o Fator de Rendimento?',
    resumo: 'Entenda como perdas no preparo afetam seus custos',
    conteudo:
      'O fator de rendimento é a porcentagem do ingrediente que efetivamente vai para a receita após o preparo. Por exemplo:\n\n• Fígado bovino após limpeza: fator 0,80 (20% de perda)\n• Batata-doce descascada e cozida: fator 0,75\n• Farinha de arroz peneirada: fator 0,98\n• Cenoura ralada: fator 0,85\n\nSe o fator é 1.0, significa que você usa 100% do que comprou. Um fator de 0.80 significa que 20% é perdido no preparo. O sistema ajusta automaticamente o custo para refletir essas perdas.',
    categoria: 'insumos',
  },
  // Precificação
  {
    id: 'valor-do-minuto',
    titulo: 'Como o tempo afeta o preço?',
    resumo: 'Entenda por que o tempo de produção impacta no lucro',
    conteudo:
      'Cada minuto que você passa produzindo petiscos tem um custo! Se seu pró-labore é R$ 3.000/mês e você trabalha 160h, cada hora custa R$ 18,75 e cada minuto custa R$ 0,31.\n\nUm lote de biscoitos de frango que leva 3 horas (preparo + forno + resfriamento + embalagem) tem R$ 56,25 só de mão de obra. Se você vende por R$ 80, sobra muito pouco de lucro. Por isso é tão importante incluir o tempo na precificação!',
    categoria: 'precificacao',
  },
  {
    id: 'margem-contribuicao',
    titulo: 'O que é Margem de Contribuição?',
    resumo: 'O indicador mais importante do seu negócio pet',
    conteudo:
      'A Margem de Contribuição é quanto "sobra" de cada venda para cobrir seus custos fixos (aluguel, energia, internet) e gerar lucro. A fórmula é:\n\nPreço de Venda − Custos Variáveis = Margem de Contribuição\n\nCustos variáveis incluem: ingredientes naturais + embalagem + mão de obra + taxa de cartão + impostos.\n\nSe a margem é 30%, significa que a cada R$ 100 vendidos, R$ 30 ficam para você. O sistema calcula o preço sugerido para atingir a margem que você deseja.',
    categoria: 'precificacao',
  },
  {
    id: 'formula-preco',
    titulo: 'Como o preço sugerido é calculado?',
    resumo: 'Entenda a fórmula por trás da sugestão',
    conteudo:
      'O sistema usa a fórmula de Markup por Margem de Contribuição:\n\nPreço = Custo Total ÷ (1 − Taxa Cartão% − Impostos% − Margem%)\n\nExemplo: Se o custo total de um lote de biscoitos de cenoura é R$ 25, taxa de cartão 5%, impostos 5% e margem desejada 35%:\n\nPreço = 25 ÷ (1 − 0,05 − 0,05 − 0,35) = 25 ÷ 0,55 = R$ 45,45\n\nAssim, dos R$ 45,45: R$ 2,27 vão para o cartão, R$ 2,27 para impostos, R$ 15,91 é sua margem, e R$ 25 cobrem os custos.',
    categoria: 'precificacao',
  },
  // BI / Dashboard
  {
    id: 'matriz-kasavana',
    titulo: 'O que é a Matriz de Engenharia de Cardápio?',
    resumo: 'Conheça a ferramenta que pet shops profissionais usam',
    conteudo:
      'A Matriz de Kasavana & Smith classifica cada produto do seu cardápio em 4 categorias baseadas em popularidade (volume de vendas) e rentabilidade (margem de contribuição):\n\n⭐ Estrelas — Vendem muito E dão muito lucro. São seus campeões! (Ex: Biscoito de Frango)\n⚡ Cavalos de Carga — Vendem muito, MAS dão pouco lucro. Aumente o preço. (Ex: Palito de Cenoura)\n🧩 Quebra-cabeças — Vendem pouco, MAS dão bom lucro. Divulgue mais. (Ex: Cookie Gourmet de Fígado)\n🐕 Cães — Vendem pouco E dão pouco lucro. Considere reformular ou tirar do cardápio.',
    categoria: 'bi',
  },
  {
    id: 'produto-cao',
    titulo: 'O que fazer com um produto de baixa performance?',
    resumo: 'Estratégias para produtos que não performam',
    conteudo:
      'Um produto de baixa performance não é necessariamente ruim. Antes de remover do cardápio, considere:\n\n1. 🔄 Rever a receita — Trocar ingredientes caros por alternativas mais acessíveis\n2. 💰 Aumentar o preço — Talvez o preço esteja muito baixo\n3. 🎁 Fazer kits — Vender junto com produtos Estrela (ex: kit petisco + biscoito)\n4. ⏱️ Reduzir o tempo de produção — Simplificar a receita\n5. ❌ Remover do cardápio — Se nada funcionar, libere espaço para produtos melhores\n\nO importante é tomar essa decisão com dados, não com intuição!',
    categoria: 'bi',
  },
  // Dicas Práticas
  {
    id: 'armazenamento-insumos',
    titulo: 'Como armazenar ingredientes naturais corretamente?',
    resumo: 'Conserve seus ingredientes e evite desperdício',
    conteudo:
      'O armazenamento correto dos ingredientes protege a qualidade dos petiscos e evita prejuízo:\n\n🧊 Refrigerados (2°C a 8°C): fígado, frango, ovos, iogurte natural. Sempre tampados e identificados com data.\n\n🌡️ Congelados (-18°C): proteínas porcionadas, polpas de frutas, massas prontas. Use embalagens herméticas para evitar queima de frio.\n\n🏠 Temperatura ambiente: farinhas sem glúten (arroz, aveia), óleo de coco, sementes. Guarde em potes fechados, longe da umidade.\n\n💡 Dica de ouro: Use a regra PVPS (Primeiro que Vence, Primeiro que Sai). Ingredientes naturais têm validade mais curta!\n\n📋 Etiquete tudo: nome, data de abertura e validade em cada pote.',
    categoria: 'dicas',
  },
  {
    id: 'fotografar-produtos',
    titulo: 'Como fotografar petiscos para venda?',
    resumo: 'Dicas simples para fotos que vendem mais',
    conteudo:
      'Fotos bonitas fazem toda a diferença nas vendas de petiscos naturais!\n\n📱 Com o celular:\n• Use luz natural (perto de uma janela)\n• Limpe a câmera antes de fotografar\n• Ative o modo retrato para desfocar o fundo\n\n🎨 Composição:\n• Fundo de madeira rústica ou toalha de linho\n• Adicione ingredientes naturais ao redor (cenoura, batata-doce, ervas)\n• Fotografe com um cachorro fofo ao lado (os clientes adoram!)\n• Use flat lay para biscoitos e ângulo lateral para bolos pet\n\n✨ Edição rápida:\n• Aumente levemente o brilho e a saturação\n• Apps gratuitos: Snapseed ou Lightroom Mobile\n\n🐶 Dica especial: Se puder fotografar um cão comendo o petisco, a taxa de conversão sobe muito!',
    categoria: 'dicas',
  },
  {
    id: 'dicas-embalagem',
    titulo: 'Embalagem: como embalar com carinho e economia?',
    resumo: 'Proteja seus petiscos e encante os tutores',
    conteudo:
      'A embalagem é o primeiro contato visual do tutor com o seu produto — ela comunica profissionalismo e cuidado com o pet.\n\n📦 Escolhendo a embalagem certa:\n• Biscoitos: saquinhos kraft com visor ou potes herméticos\n• Bolos pet: caixas de papelão com janela\n• Palitos e petiscos: embalagem a vácuo para maior durabilidade\n• Kits presente: caixas com laço e cartão do pet\n\n💰 Economizando sem perder qualidade:\n• Compre embalagens no atacado (economize até 40%)\n• Padronize tamanhos\n• Use adesivos personalizados com sua logo e informações nutricionais\n\n🐾 Toques especiais que encantam tutores:\n• Cartãozinho com o nome do pet\n• Tabela nutricional e lista de ingredientes\n• Selo "Sem Glúten • Sem Corantes"\n• QR Code para suas redes sociais\n\n⚠️ Inclua SEMPRE o custo da embalagem na sua ficha técnica!',
    categoria: 'dicas',
  },
  {
    id: 'higiene-cozinha',
    titulo: 'Boas práticas de higiene na produção pet',
    resumo: 'Segurança alimentar para confeitaria canina',
    conteudo:
      'A higiene é a base de tudo na confeitaria pet. Produtos naturais sem conservantes exigem cuidado redobrado:\n\n🧼 Antes de começar:\n• Lave bem as mãos com água e sabão por 20 segundos\n• Prenda o cabelo e use avental limpo\n• Higienize a bancada com álcool 70%\n• Separe utensílios exclusivos para a produção pet\n\n🍳 Durante a produção:\n• Não misture utensílios de alimentos humanos e pet\n• Mantenha ingredientes refrigerados até o uso\n• Controle rigorosamente tempos de forno\n\n🧹 Após a produção:\n• Lave todos os utensílios imediatamente\n• Limpe o forno e a bancada\n• Embale os produtos ainda em ambiente controlado\n\n📋 Documentação:\n• Mantenha controle de validade (produtos naturais vencem mais rápido!)\n• Anote temperaturas da geladeira diariamente\n• Guarde notas fiscais dos ingredientes',
    categoria: 'dicas',
  },
  {
    id: 'ingredientes-seguros',
    titulo: 'Ingredientes seguros e proibidos para cães',
    resumo: 'Guia essencial de nutrição canina para confeiteiros',
    conteudo:
      'Conhecer os ingredientes é fundamental para a segurança dos pets!\n\n✅ Ingredientes SEGUROS e nutritivos:\n• Proteínas: frango, fígado bovino, peixe (sem espinhas), ovos\n• Carboidratos: batata-doce, abóbora, arroz, aveia sem glúten\n• Vegetais: cenoura, espinafre, abobrinha, brócolis\n• Frutas: banana, maçã (sem sementes), blueberry, melancia\n• Gorduras: óleo de coco, azeite (pequenas quantidades)\n\n🚫 Ingredientes PROIBIDOS (tóxicos!):\n• Chocolate e cacau\n• Uva e passas\n• Cebola e alho\n• Xilitol (adoçante)\n• Macadâmia\n• Abacate\n• Café e chá\n\n⚠️ Use com moderação:\n• Queijo cottage (verificar lactose)\n• Amendoim (apenas pasta sem sal e sem xilitol)\n• Mel (pequenas quantidades)\n\n💡 Na dúvida, sempre consulte um veterinário nutricionista!',
    categoria: 'dicas',
  },
  // Geral
  {
    id: 'primeiros-passos',
    titulo: 'Por onde começar?',
    resumo: 'Guia rápido para configurar seu sistema',
    conteudo:
      'Siga esta ordem para aproveitar ao máximo o sistema:\n\n1. ⚙️ Configure seu pró-labore e horas de trabalho em Configurações\n2. 🥕 Cadastre seus ingredientes naturais (proteínas, farinhas sem glúten, embalagens)\n3. 📖 Crie suas receitas com ficha técnica completa\n4. 💰 Use a precificação para encontrar o preço ideal\n5. 📊 Registre vendas e acompanhe o Painel de Vendas\n\nCada passo alimenta o próximo. Quanto mais dados, melhores as sugestões do sistema! 🐾',
    categoria: 'geral',
  },
];

export const CATEGORIA_LABELS: Record<string, string> = {
  insumos: '🐾 Ingredientes Naturais',
  precificacao: '💰 Precificação',
  bi: '📊 Inteligência de Negócio',
  dicas: '✨ Dicas Práticas',
  geral: '📋 Geral',
};
