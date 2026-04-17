// Central de conteúdo de ajuda — edite aqui sem mexer nos componentes
// Adaptado para Confeitaria Canina Natural 🐾

export interface HelpTopic {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria:
    | 'primeiros-passos'
    | 'configuracoes'
    | 'insumos'
    | 'receitas'
    | 'kits'
    | 'precificacao'
    | 'vendas'
    | 'pagamentos'
    | 'bi'
    | 'relatorios'
    | 'dicas'
    | 'geral';
}

export const HELP_TOOLTIPS: Record<string, string> = {
  // Configurações financeiras
  pro_labore:
    'É o "salário" que você se paga como dona do negócio. Definir esse valor é essencial para calcular quanto custa cada minuto do seu tempo na cozinha — e cobrar adequadamente por isso.',
  horas_mes:
    'Quantas horas por mês você dedica à confeitaria pet. Inclua produção, embalagem, entrega e administração. Junto com o pró-labore, define o custo do seu minuto de trabalho.',
  impostos:
    'Percentual de impostos sobre o faturamento. Para MEI, geralmente é o DAS mensal proporcional. Para Simples Nacional, varia conforme a faixa de faturamento.',
  margem_desejada:
    'Quanto você quer de lucro líquido em cada venda, em %. Ex: 30% significa que de cada R$ 100 vendidos, R$ 30 ficam para você após cobrir custos, taxas e impostos.',
  valor_minuto:
    'Custo do seu minuto de trabalho. Calculado automaticamente: pró-labore ÷ (horas/mês × 60). Esse valor é multiplicado pelo tempo de cada receita ou montagem de kit.',

  // Insumos
  fator_rendimento:
    'É a relação entre o peso bruto e o peso que realmente vai para a receita. Exemplo: se você compra 1kg de fígado bovino, mas após limpeza e cozimento sobram 800g utilizáveis, o fator é 0,80. Isso garante que o custo real seja calculado corretamente.',
  custo_unitario:
    'Preço de compra dividido pelo peso/volume da embalagem. É o custo de cada grama, mililitro ou unidade do ingrediente. Calculado automaticamente pelo sistema.',
  peso_embalagem:
    'A quantidade total do produto na embalagem como foi comprada. Ex: farinha de arroz de 1kg = 1000g, batata-doce = 500g, ovos = 12un.',
  preco_compra:
    'Quanto você pagou pela embalagem inteira do ingrediente. Use o valor da nota fiscal ou comprovante de compra.',
  unidade_medida:
    'Em qual unidade você compra esse insumo: gramas (g), quilos (kg), mililitros (ml), litros (l) ou unidades (un). O sistema converte automaticamente para usar nas receitas.',

  // Receitas
  rendimento:
    'Quantas unidades a receita rende. Ex: uma receita de biscoito de cenoura que rende 60 unidades. Essencial para calcular o custo por unidade vendida.',
  tempo_producao:
    'Tempo total para produzir a receita, incluindo preparo, forno, resfriamento e embalagem. Quanto maior o tempo, maior o custo de mão de obra embutido no produto.',
  composicao_quantidade:
    'Quanto desse ingrediente entra na receita. Use a mesma unidade do insumo (ex: se a farinha foi cadastrada em kg, informe em kg).',
  composicao_fator_rendimento:
    'Use quando esse ingrediente sofre perda no preparo desta receita específica. Ex: 0,80 significa 20% de perda. Deixe 1,00 se não há perda.',

  // Precificação
  margem_contribuicao:
    'É o lucro que sobra de cada venda após descontar todos os custos variáveis (ingredientes, embalagem, mão de obra, taxa de cartão e impostos). Quanto maior, mais o produto contribui para pagar suas contas fixas e gerar lucro.',
  taxa_cartao:
    'Percentual cobrado pela maquininha ou plataforma em cada venda. Ex: PIX 0%, Crédito 3-5%, iFood Pet 12-23%. Cada método tem sua taxa própria.',
  preco_sugerido:
    'Preço calculado automaticamente para atingir sua margem desejada, considerando custos, impostos e taxa do método de pagamento padrão.',

  // Kits
  tempo_montagem:
    'Tempo para montar o kit (separar, embalar, decorar). Não inclui o tempo de produção das receitas — esse já está embutido no custo de cada item.',
  zerar_mao_obra:
    'Marque para não cobrar mão de obra de montagem (útil quando o kit é só agrupamento simples). O custo das receitas individuais continua sendo considerado.',
  desconto_kit:
    'Desconto percentual aplicado sobre o preço sugerido do kit, para incentivar a compra do combo. Ex: 10% de desconto torna o kit mais atrativo que comprar item por item.',
  preco_final_manual:
    'Use quando quiser definir um preço fechado para o kit, ignorando o cálculo automático. O sistema mostra a margem real desse preço.',

  // Vendas
  canal_venda:
    'Por onde a venda aconteceu: Direto, WhatsApp, Instagram, iFood Pet, etc. Útil para análises por canal nos relatórios.',
  metodo_pagamento_venda:
    'Como o cliente pagou: PIX, Crédito, Débito, Vale Refeição. A taxa desse método é registrada como snapshot no momento da venda.',
  valor_liquido:
    'Quanto realmente entrou no caixa após descontar a taxa do método de pagamento. Calculado automaticamente.',

  // Métodos de pagamento
  metodo_padrao:
    'Marque o método mais usado por você. Ele será aplicado por padrão nas precificações e novas vendas.',
  taxa_metodo:
    'Percentual cobrado pelo método. PIX geralmente 0%, débito 1-2%, crédito 3-5%, vouchers 8-15%. Use o valor real da sua máquina/conta.',

  // Custos fixos
  valor_mensal_custo:
    'Quanto você paga por mês desse custo fixo. Use a média dos últimos 3 meses se variar bastante.',
  percentual_rateio:
    'Quanto desse custo deve ser atribuído ao negócio (caso seja compartilhado). Ex: se a internet de casa custa R$ 100 e 50% é para o trabalho, use 50%.',
};

export const HELP_TOPICS: HelpTopic[] = [
  // ============= PRIMEIROS PASSOS =============
  {
    id: 'primeiros-passos',
    titulo: 'Por onde começar?',
    resumo: 'Guia rápido para configurar seu sistema do zero',
    conteudo:
      'Siga esta ordem para aproveitar ao máximo o sistema:\n\n1. ⚙️ **Configurações** — Defina seu pró-labore, horas trabalhadas por mês, impostos e margem desejada\n2. 💳 **Métodos de Pagamento** — Cadastre PIX, crédito, débito e outros que você aceita, com a taxa real de cada um\n3. 🏠 **Custos Fixos** — Liste aluguel, energia, internet, marketing e outros gastos mensais\n4. 🥕 **Insumos** — Cadastre todos os ingredientes naturais e embalagens com preço e peso\n5. 📖 **Receitas** — Crie suas fichas técnicas com composição e tempo de produção\n6. 📦 **Kits** (opcional) — Monte combos juntando receitas e insumos\n7. 💰 **Precificação** — Veja o preço sugerido para cada produto\n8. 🛒 **Vendas** — Registre cada venda com método de pagamento\n9. 📊 **Painel & Relatórios** — Acompanhe lucro, ponto de equilíbrio e classificação dos produtos\n\nCada passo alimenta o próximo. Quanto mais dados, melhores as análises! 🐾',
    categoria: 'primeiros-passos',
  },
  {
    id: 'fluxo-dados',
    titulo: 'Como os dados se conectam?',
    resumo: 'Entenda o fluxo de informação do sistema',
    conteudo:
      'Tudo no sistema está conectado de forma inteligente:\n\n🥕 **Insumo** tem preço e peso → calcula custo por grama/ml/un\n📖 **Receita** usa insumos (com fator de rendimento) + tempo → calcula custo total e por unidade\n📦 **Kit** junta receitas + insumos avulsos + tempo de montagem → calcula custo do combo\n💰 **Precificação** pega custo + margem + taxa + impostos → sugere preço de venda\n🛒 **Venda** registra preço + método de pagamento → guarda snapshot do custo e taxa naquele momento\n📊 **BI** lê todas as vendas → calcula margem real, ponto de equilíbrio e classifica produtos\n\nIsso significa que mesmo se você mudar o preço de um insumo depois, as vendas antigas mantêm o custo correto da época!',
    categoria: 'primeiros-passos',
  },

  // ============= CONFIGURAÇÕES =============
  {
    id: 'pro-labore-explicado',
    titulo: 'O que é Pró-labore e por que importa?',
    resumo: 'O salário que você precisa se pagar',
    conteudo:
      'Pró-labore é o valor que você se paga mensalmente como dona do negócio — diferente do lucro, é seu "salário" pelo trabalho.\n\n💡 **Por que cadastrar?** Junto com as horas trabalhadas, o sistema calcula quanto custa cada minuto do seu tempo. Esse custo é embutido em cada receita e kit.\n\n📐 **Cálculo:**\nValor do minuto = Pró-labore ÷ (horas/mês × 60)\n\n**Exemplo:**\n• Pró-labore: R$ 3.000\n• Horas/mês: 160h (40h/semana)\n• Minuto = 3000 ÷ 9600 = R$ 0,3125\n• Uma receita de 60 minutos tem R$ 18,75 só de mão de obra!\n\n⚠️ **Não esqueça** de incluir tempo de embalagem, entregas e administração nas suas horas mensais.',
    categoria: 'configuracoes',
  },
  {
    id: 'margem-desejada-config',
    titulo: 'Como escolher minha margem desejada?',
    resumo: 'Definindo o lucro que você quer em cada venda',
    conteudo:
      'A margem desejada é o % de lucro líquido que você quer em cada venda, depois de cobrir todos os custos, taxas e impostos.\n\n📊 **Faixas comuns na confeitaria pet:**\n• 20-30% — Concorrência forte ou produtos de entrada\n• 30-45% — Saudável para a maioria dos produtos artesanais\n• 45-60% — Produtos premium, gourmet ou de nicho\n• 60%+ — Produtos exclusivos com baixo volume\n\n⚠️ **Atenção:** Margem muito alta = preço alto = menos vendas. Margem muito baixa = sem dinheiro para crescer. Equilibre!\n\n💡 Você pode definir uma margem padrão em Configurações e sobrescrever em cada receita específica.',
    categoria: 'configuracoes',
  },
  {
    id: 'impostos-config',
    titulo: 'Como configurar os impostos?',
    resumo: 'MEI, Simples Nacional e o que considerar',
    conteudo:
      'O campo "Impostos %" representa quanto do seu faturamento vai para tributos.\n\n💼 **MEI (Microempreendedor Individual):**\nVocê paga DAS fixo (~R$ 75-90/mês). Se fatura R$ 5.000/mês, isso é ~1,7%. Use esse valor proporcional.\n\n💼 **Simples Nacional (anexo III - serviços):**\nVaria de 6% a 33% conforme o faturamento. Comece com 6% se está iniciando.\n\n💼 **Sem CNPJ (informal):**\nDeixe em 0%, mas considere reservar 5-10% para regularização futura.\n\n⚠️ **Importante:** Esse valor entra direto na fórmula de preço sugerido, garantindo que o imposto não "coma" sua margem.',
    categoria: 'configuracoes',
  },

  // ============= INSUMOS =============
  {
    id: 'o-que-sao-insumos',
    titulo: 'O que são Insumos / Ingredientes?',
    resumo: 'A base de custos da sua confeitaria pet',
    conteudo:
      'Insumos são todas as matérias-primas e embalagens que você usa na produção. Cadastrá-los corretamente é o primeiro passo para saber quanto custa cada receita.\n\n🥕 **Ingredientes:**\nFarinha de arroz, batata-doce, fígado bovino, cenoura, óleo de coco, ovos, etc.\n\n📦 **Embalagens:**\nSaquinhos kraft, etiquetas, fitas, potes herméticos, cake boards, caixas.\n\n📝 **O que cadastrar:**\n• Nome claro (ex: "Farinha de arroz integral")\n• Categoria (ingrediente ou embalagem)\n• Preço de compra da embalagem inteira\n• Peso/volume total da embalagem\n• Unidade de medida (g, kg, ml, l, un)\n• Marca e fornecedor (opcional, ajuda em comparações)\n\n💡 **Dica:** Ingredientes naturais sem glúten e sem corantes costumam ser mais caros. Cadastre tudo para precificar corretamente!',
    categoria: 'insumos',
  },
  {
    id: 'fator-rendimento',
    titulo: 'O que é Fator de Rendimento?',
    resumo: 'Como perdas no preparo afetam seus custos',
    conteudo:
      'O fator de rendimento é a porcentagem do ingrediente que efetivamente vai para a receita após o preparo.\n\n📐 **Como funciona:**\n• Fator 1,00 = 100% aproveitado (sem perda)\n• Fator 0,80 = 80% aproveitado (20% de perda)\n• Fator 0,50 = 50% aproveitado (metade vira perda)\n\n🥩 **Exemplos típicos:**\n• Fígado bovino após limpeza e cozimento: 0,80\n• Batata-doce descascada e cozida: 0,75\n• Farinha de arroz peneirada: 0,98\n• Cenoura ralada: 0,85\n• Frango desfiado: 0,70\n\n💰 **Por que importa?**\nSe você usa 200g de batata-doce na receita, mas o fator é 0,75, na verdade você precisa comprar 267g (200 ÷ 0,75) para ter 200g utilizáveis. O sistema ajusta o custo automaticamente.\n\n📍 **Onde configurar:**\nO fator pode ser definido em cada item da composição da receita, permitindo precisão por preparo específico.',
    categoria: 'insumos',
  },
  {
    id: 'custo-unitario-insumo',
    titulo: 'Como o custo unitário é calculado?',
    resumo: 'Entenda o cálculo automático por grama/ml/un',
    conteudo:
      'O custo unitário é calculado automaticamente quando você cadastra um insumo:\n\n📐 **Fórmula:**\nCusto unitário = Preço de compra ÷ Peso/volume da embalagem\n\n**Exemplos:**\n• Farinha de arroz 1kg por R$ 20,00 → R$ 0,02/g\n• Óleo de coco 500ml por R$ 35,00 → R$ 0,07/ml\n• Caixa de 50 sacos por R$ 50,00 → R$ 1,00/un\n\n💡 **Dica de leitura:**\nO sistema mostra o custo na unidade base. Se cadastrou em kg, o custo aparece "por g" para facilitar visualização nas receitas.\n\n🔄 **Atualizando preços:**\nQuando você muda o preço de compra (ex: ingrediente subiu), o custo unitário se atualiza, mas vendas antigas mantêm o snapshot do custo da época da venda.',
    categoria: 'insumos',
  },
  {
    id: 'unidades-conversao',
    titulo: 'Como funcionam as conversões de unidade?',
    resumo: 'kg ↔ g, l ↔ ml automaticamente',
    conteudo:
      'O sistema converte unidades automaticamente quando o insumo está em uma unidade e a receita usa outra:\n\n🔄 **Conversões suportadas:**\n• 1 kg = 1.000 g\n• 1 l = 1.000 ml\n• un = sem conversão (sempre unidade)\n\n**Exemplo prático:**\nVocê cadastra farinha em kg (1kg por R$ 20). Na receita, usa 200g. O sistema:\n1. Converte 200g para 0,2kg\n2. Calcula: 0,2 × R$ 20 = R$ 4,00\n3. Mostra o custo correto\n\n⚠️ **O que NÃO converte:**\nO sistema não converte entre tipos diferentes (ex: g para ml), porque a densidade varia por ingrediente. Sempre cadastre o insumo na unidade compatível com o uso na receita.\n\n💡 **Dica:** Para ovos, sempre use "un" (unidade), não tente cadastrar em gramas.',
    categoria: 'insumos',
  },

  // ============= RECEITAS =============
  {
    id: 'criar-receita',
    titulo: 'Como criar uma receita / ficha técnica?',
    resumo: 'Passo a passo para sua primeira ficha',
    conteudo:
      'Uma receita (ficha técnica) é a estrutura que define quanto custa produzir um produto.\n\n📋 **Passo a passo:**\n\n1. **Nome e descrição** — Ex: "Biscoito de Frango com Cenoura"\n2. **Categoria** — Agrupa receitas similares (biscoitos, bolos, palitos)\n3. **Rendimento** — Quantas unidades a receita produz (ex: 60 biscoitos)\n4. **Tempo de produção** — Em minutos, incluindo preparo, forno e resfriamento\n5. **Composição** — Adicione cada insumo com quantidade e fator de rendimento\n6. **Margem desejada** (opcional) — Se diferente da padrão, configure aqui\n\n💡 **Dicas importantes:**\n• Inclua TUDO na composição: ingredientes + embalagem por unidade\n• Tempo de produção deve incluir embalagem individual\n• Use fator de rendimento quando há perdas no preparo\n• O custo por unidade aparece automaticamente após salvar',
    categoria: 'receitas',
  },
  {
    id: 'composicao-receita',
    titulo: 'Como adicionar ingredientes à composição?',
    resumo: 'Detalhando cada item da ficha técnica',
    conteudo:
      'Cada item da composição liga um insumo à receita:\n\n📝 **Campos por item:**\n• **Insumo** — Selecione da lista cadastrada\n• **Quantidade** — Quanto desse insumo vai na receita inteira (não por unidade!)\n• **Unidade** — Mesma do insumo (g, ml, un)\n• **Fator de rendimento** — Use 1,00 se não há perda\n\n**Exemplo — Biscoito de Frango (rende 60un):**\n• 200g de farinha de arroz (fator 1,00)\n• 300g de frango desfiado (fator 0,70 — perde 30% no cozimento)\n• 50ml de óleo de coco (fator 1,00)\n• 60un de saco kraft (fator 1,00) — 1 por biscoito\n\n💡 **Cuidado comum:**\nA quantidade é da receita TODA, não por unidade. Se rende 60 biscoitos, informe quanto foi usado para produzir os 60.',
    categoria: 'receitas',
  },
  {
    id: 'tempo-producao-impacto',
    titulo: 'Por que o tempo de produção afeta tanto?',
    resumo: 'Mão de obra é o custo invisível que mais pesa',
    conteudo:
      'Cada minuto que você passa produzindo tem um custo! Se seu pró-labore é R$ 3.000/mês e você trabalha 160h, cada minuto custa R$ 0,3125.\n\n📐 **Cálculo do impacto:**\nMão de obra = Tempo (min) × Valor do minuto\n\n**Exemplo concreto:**\n• Lote de biscoitos de frango: 180min (preparo + forno + resfriamento + embalagem)\n• Custo de mão de obra: 180 × R$ 0,3125 = R$ 56,25\n• Se rende 60 biscoitos: R$ 0,94 de mão de obra por unidade\n\n⚠️ **Erros comuns:**\n• Esquecer tempo de embalagem individual\n• Não contar tempo de limpeza\n• Subestimar tempo de descanso de massa (mesmo parado, é tempo investido)\n\n💡 **Cronometre uma vez** cada receita do início ao fim para ter dados reais.',
    categoria: 'receitas',
  },

  // ============= KITS =============
  {
    id: 'o-que-sao-kits',
    titulo: 'O que são Kits / Combos?',
    resumo: 'Agrupando produtos para vender mais',
    conteudo:
      'Kits são combinações de receitas e/ou insumos vendidos como um único produto. Estratégia poderosa para aumentar ticket médio!\n\n📦 **Exemplos de kits pet:**\n• **Kit Festa Pet** — 5 muffins + 1 vela + caixa decorativa\n• **Kit Degustação** — 3 sabores de biscoito (10un cada)\n• **Kit Presente** — 1 bolo pet + cartão personalizado + laço\n• **Kit Mensal** — 4 pacotes de biscoito (assinatura)\n\n✅ **Vantagens:**\n• Ticket médio maior\n• Cliente percebe valor agregado\n• Você pode dar desconto e ainda lucrar mais (vende mais volume)\n• Reduz tempo de venda (uma negociação, vários produtos)\n\n📍 **Onde criar:** Menu lateral > Kits > Novo Kit',
    categoria: 'kits',
  },
  {
    id: 'composicao-kit',
    titulo: 'Como montar a composição de um kit?',
    resumo: 'Receitas + insumos avulsos no mesmo combo',
    conteudo:
      'Um kit pode ter dois tipos de itens:\n\n📖 **Receitas:**\nProdutos que você já tem ficha técnica. O custo (insumos + mão de obra) é puxado automaticamente.\n• Ex: 5 unidades do "Biscoito de Frango"\n\n🥕 **Insumos avulsos:**\nItens que vão direto no kit sem virar receita. Útil para embalagens especiais, cartões, brindes.\n• Ex: 1 caixa decorativa, 1 cartão personalizado, 1 laço de fita\n\n⏱️ **Tempo de montagem:**\nQuanto tempo leva para montar o kit (separar, embalar, decorar). NÃO inclua tempo de produção das receitas — esse já está embutido no custo de cada uma.\n\n🚫 **Zerar mão de obra:**\nMarque se o kit é só agrupamento simples (ex: empilhar 3 pacotes prontos numa sacola). O custo das receitas continua, só não soma tempo de montagem.',
    categoria: 'kits',
  },
  {
    id: 'preco-kit-desconto',
    titulo: 'Como precificar um kit com desconto?',
    resumo: 'Equilibrando atratividade e lucro',
    conteudo:
      'O sistema oferece 3 formas de definir o preço do kit:\n\n1️⃣ **Preço sugerido automático**\nSoma os preços individuais das receitas, aplica 10% de desconto base. Bom ponto de partida.\n\n2️⃣ **Desconto percentual**\nVocê define % de desconto sobre a soma individual. Ex: 15% de desconto faz o cliente economizar e ainda mantém boa margem.\n\n3️⃣ **Preço final manual**\nDefina um valor "redondo" (ex: R$ 99,90). O sistema mostra a margem real desse preço para você decidir se vale a pena.\n\n📊 **Margem real do kit:**\nO sistema sempre calcula:\n• Custo total (itens + montagem)\n• Taxa do método de pagamento padrão\n• Impostos\n• Lucro líquido em R$ e %\n\n⚠️ **Cuidado:** Desconto muito alto pode zerar sua margem. O sistema avisa em vermelho se a margem ficar negativa.',
    categoria: 'kits',
  },
  {
    id: 'card-marketing-kit',
    titulo: 'Como compartilhar um kit com clientes?',
    resumo: 'Card de marketing pronto para divulgação',
    conteudo:
      'Cada kit tem um card de marketing pronto para compartilhar nas redes sociais:\n\n📱 **O que aparece no card:**\n• Nome e descrição do kit\n• Lista de itens incluídos com quantidades\n• Preço final destacado\n• % de economia em relação aos itens individuais\n• Visual com a paleta da sua marca\n\n📤 **Como usar:**\n1. Abra o kit na lista\n2. Clique no botão "Compartilhar"\n3. Salve a imagem ou copie o texto pronto\n4. Cole no Instagram, WhatsApp Business, Status\n\n💡 **Dica de venda:**\nPostagens com preço transparente e economia visível convertem 3x mais que postagens só com foto. O card já segue essa estratégia!',
    categoria: 'kits',
  },

  // ============= PRECIFICAÇÃO =============
  {
    id: 'margem-contribuicao',
    titulo: 'O que é Margem de Contribuição?',
    resumo: 'O indicador mais importante do seu negócio',
    conteudo:
      'A Margem de Contribuição é quanto "sobra" de cada venda para cobrir seus custos fixos (aluguel, energia, internet) e gerar lucro.\n\n📐 **Fórmula:**\nMargem = Preço de Venda − Custos Variáveis\n\n**Custos variáveis incluem:**\n• Ingredientes naturais\n• Embalagens\n• Mão de obra do produto\n• Taxa do método de pagamento\n• Impostos sobre a venda\n\n**Exemplo:**\nVoce vende um bolo por R$ 100:\n• Custo total: R$ 40\n• Taxa de cartão (5%): R$ 5\n• Imposto (5%): R$ 5\n• Margem de contribuição: R$ 50 (50%)\n\nEsses R$ 50 vão pagar aluguel, luz, marketing e o que sobrar é lucro real.\n\n🎯 **Meta saudável:** Manter margem entre 30% e 50% para a maioria dos produtos artesanais pet.',
    categoria: 'precificacao',
  },
  {
    id: 'formula-preco-sugerido',
    titulo: 'Como o preço sugerido é calculado?',
    resumo: 'A fórmula matemática por trás da sugestão',
    conteudo:
      'O sistema usa a fórmula de Markup por Margem de Contribuição:\n\n📐 **Fórmula:**\nPreço = Custo Variável ÷ (1 − Taxa% − Impostos% − Margem%)\n\n**Exemplo passo a passo:**\nLote de biscoitos de cenoura:\n• Custo de insumos: R$ 15\n• Custo de mão de obra: R$ 10\n• Custo total: R$ 25\n• Taxa de cartão padrão: 5%\n• Impostos: 5%\n• Margem desejada: 35%\n\nCálculo:\n1. Soma dos %: 5 + 5 + 35 = 45%\n2. Divisor: 1 − 0,45 = 0,55\n3. Preço: 25 ÷ 0,55 = **R$ 45,45**\n\n**Conferindo:**\nDos R$ 45,45:\n• R$ 25,00 → cobre custos variáveis\n• R$ 2,27 → vai para taxa de cartão (5%)\n• R$ 2,27 → vai para impostos (5%)\n• R$ 15,91 → sua margem de contribuição (35%)\n\n✅ Total: R$ 45,45 ✓',
    categoria: 'precificacao',
  },
  {
    id: 'preco-vs-mercado',
    titulo: 'E se meu preço sugerido está acima do mercado?',
    resumo: 'Estratégias quando o cálculo dá alto demais',
    conteudo:
      'Se o preço sugerido está acima do que o mercado paga, considere:\n\n🔍 **1. Investigar o custo:**\n• Há ingrediente caro que pode ser substituído?\n• O fornecedor está cobrando justo?\n• Existe atacado ou compra coletiva na sua região?\n\n⏱️ **2. Reduzir tempo de produção:**\n• Pode produzir lotes maiores?\n• Há etapa que pode ser otimizada?\n• Vale comprar equipamento que acelera (batedeira, forno maior)?\n\n💰 **3. Reduzir margem (com cuidado):**\n• Aceite margem menor APENAS se vai vender muito mais volume\n• Nunca venda abaixo do custo + taxa + imposto\n\n🎯 **4. Reposicionar produto:**\n• Comunique melhor o valor (orgânico, sem glúten, artesanal)\n• Foque em clientes que valorizam qualidade\n• Crie versão "premium" com preço maior\n\n❌ **NÃO faça:**\n• Reduzir margem para igualar concorrente que vende mais barato (ele pode estar perdendo dinheiro!)',
    categoria: 'precificacao',
  },

  // ============= MÉTODOS DE PAGAMENTO =============
  {
    id: 'metodos-pagamento',
    titulo: 'Por que cadastrar métodos de pagamento?',
    resumo: 'Cada forma de pagamento afeta seu lucro',
    conteudo:
      'Cada método de pagamento tem uma taxa diferente que IMPACTA DIRETAMENTE seu lucro:\n\n💳 **Taxas típicas:**\n• PIX: 0% (gratuito)\n• Débito: 1-2%\n• Crédito à vista: 3-5%\n• Crédito parcelado: 4-8%\n• Vale Refeição: 8-15%\n• iFood Pet: 12-23%\n• Rappi: 18-30%\n\n📊 **Impacto real:**\nVenda de R$ 100:\n• Via PIX → você recebe R$ 100\n• Via Crédito (5%) → recebe R$ 95\n• Via iFood (20%) → recebe R$ 80!\n\n📍 **O que cadastrar:**\n• Nome do método (PIX, Crédito Stone, iFood Pet, etc.)\n• Taxa real cobrada (consulte sua máquina/extrato)\n• Marque um como **padrão** — usado nas precificações\n• Defina ativo/inativo (pode desabilitar sazonalmente)\n\n💡 **Dica estratégica:** Ofereça desconto no PIX para incentivar e economizar em taxas!',
    categoria: 'pagamentos',
  },
  {
    id: 'metodo-padrao',
    titulo: 'O que é o método de pagamento padrão?',
    resumo: 'Por que marcar um como principal',
    conteudo:
      'Marcar um método como "padrão" tem dois efeitos importantes:\n\n1️⃣ **Na precificação:**\nO preço sugerido é calculado usando a taxa desse método. Use o mais comum no seu negócio para que o preço sugerido reflita a realidade.\n\n2️⃣ **Em novas vendas:**\nVem pré-selecionado ao registrar uma venda, agilizando o cadastro.\n\n💡 **Como escolher o padrão:**\n• Se 60%+ das vendas são PIX → padrão = PIX\n• Se vende muito por delivery → padrão = iFood/Rappi\n• Se a maioria é máquina → padrão = Crédito\n\n⚠️ **Atenção:** O método padrão NÃO força ninguém a usar ele. Cada venda registra seu próprio método com sua própria taxa real.',
    categoria: 'pagamentos',
  },

  // ============= VENDAS =============
  {
    id: 'registrar-venda',
    titulo: 'Como registrar uma venda?',
    resumo: 'Cadastrando vendas para ter dados reais',
    conteudo:
      'Cada venda registrada alimenta os relatórios e a inteligência do sistema.\n\n📝 **Campos da venda:**\n• **Data** — Quando foi a venda (default: hoje)\n• **Receita ou Kit** — O que foi vendido\n• **Quantidade** — Quantas unidades/kits\n• **Preço de venda** — Quanto o cliente pagou (preço unitário)\n• **Método de pagamento** — Como recebeu\n• **Canal de venda** — Por onde veio (Direto, WhatsApp, iFood)\n\n💾 **O que o sistema salva automaticamente (snapshot):**\n• Custo dos insumos no momento da venda\n• Taxa do método de pagamento aplicada\n• Valor líquido real (preço − taxa)\n• Nome do método (caso o método seja editado depois)\n\n💡 **Por que snapshot importa:**\nSe você muda o preço de um insumo amanhã, as vendas de hoje mantêm o custo correto da época. Seus relatórios sempre mostram a realidade histórica!',
    categoria: 'vendas',
  },
  {
    id: 'snapshot-venda',
    titulo: 'O que é "snapshot" da venda?',
    resumo: 'Por que vendas guardam custos da época',
    conteudo:
      'Snapshot = "fotografia" dos dados no momento exato da venda.\n\n📸 **O que é fotografado:**\n• Custo de produção dos insumos naquele dia\n• Taxa do método de pagamento usada\n• Nome do método (caso seja renomeado/excluído depois)\n• Valor líquido calculado\n\n🎯 **Por que isso é genial:**\n\n**Cenário 1 — Insumo subiu de preço:**\n• Em janeiro, farinha custava R$ 15/kg → vendas guardam custo baseado nisso\n• Em março, farinha sobe para R$ 25/kg\n• Vendas de janeiro CONTINUAM mostrando margem correta da época\n• Você vê a evolução real do seu custo/margem\n\n**Cenário 2 — Mudou taxa de cartão:**\n• Stone cobrava 4,5% em janeiro\n• Subiu para 5,2% em março\n• Cada venda registra a taxa que valia naquele dia\n\n📊 Isso garante que **relatórios históricos sempre refletem a verdade**, não os preços atuais retroativos.',
    categoria: 'vendas',
  },

  // ============= BI / DASHBOARD =============
  {
    id: 'painel-vendas',
    titulo: 'Como ler o Painel de Vendas?',
    resumo: 'Os números que importam no dia a dia',
    conteudo:
      'O painel mostra a saúde financeira do seu negócio em tempo real:\n\n💰 **Faturamento Bruto** — Soma de todos os preços de venda\n💸 **Faturamento Líquido** — Após descontar taxas dos métodos de pagamento\n📦 **Custo Total** — Soma dos custos variáveis (insumos + mão de obra)\n📈 **Lucro Bruto** — Líquido − Custo total (antes de custos fixos)\n🎯 **Margem Média** — % médio de lucro nas vendas\n📊 **Ticket Médio** — Valor médio por venda\n\n📅 **Filtros disponíveis:**\n• Por período (hoje, semana, mês, customizado)\n• Por canal (Direto, WhatsApp, iFood)\n• Por método de pagamento\n\n💡 **Como interpretar:**\n• Margem caindo? → Insumos subiram ou está dando muito desconto\n• Ticket médio baixo? → Foque em kits e upsell\n• Faturamento OK mas lucro baixo? → Custos fixos altos demais',
    categoria: 'bi',
  },
  {
    id: 'ponto-equilibrio',
    titulo: 'O que é Ponto de Equilíbrio?',
    resumo: 'Quanto você precisa vender para não dar prejuízo',
    conteudo:
      'O Ponto de Equilíbrio (break-even) é o faturamento mínimo para pagar TODAS as suas contas — sem lucro, sem prejuízo.\n\n📐 **Fórmula:**\nPonto Equilíbrio = Custos Fixos ÷ Margem de Contribuição Média (%)\n\n**Exemplo:**\n• Custos fixos: R$ 2.000/mês (aluguel, luz, internet, marketing)\n• Margem média das vendas: 40%\n• Ponto de equilíbrio: 2000 ÷ 0,40 = **R$ 5.000/mês**\n\nIsso significa que você precisa faturar R$ 5.000 para empatar. Tudo acima disso é lucro real!\n\n📊 **A página /ponto-equilibrio mostra:**\n• Quanto você já faturou no mês\n• Quanto falta para atingir o equilíbrio\n• Visualização gráfica do progresso\n• Quantas unidades médias precisa vender\n\n⚠️ **Sinal de alerta:**\nSe nunca atinge o ponto de equilíbrio, é hora de:\n1. Reduzir custos fixos\n2. Aumentar margem (preço ou eficiência)\n3. Aumentar volume de vendas',
    categoria: 'bi',
  },
  {
    id: 'matriz-kasavana',
    titulo: 'O que é a Matriz Kasavana & Smith?',
    resumo: 'Classificação inteligente dos seus produtos',
    conteudo:
      'A Matriz de Kasavana & Smith classifica cada produto do seu cardápio em 4 categorias baseadas em popularidade (volume de vendas) e rentabilidade (margem de contribuição):\n\n⭐ **Estrelas** — Vendem MUITO E dão MUITO lucro\nSeus campeões! Mantenha sempre disponíveis, dê destaque, use como isca.\n• Ex: Biscoito de Frango (vende 200un/mês, 45% margem)\n\n🐎 **Cavalos de Carga** — Vendem MUITO, mas dão POUCO lucro\nPopulares mas mal precificados. AUMENTE O PREÇO gradualmente. Teste 5-10% e veja se o volume mantém.\n• Ex: Palito de Cenoura (vende muito a R$ 8, mas margem só 15%)\n\n🧩 **Quebra-cabeças** — Vendem POUCO, mas dão BOM lucro\nProdutos premium subaproveitados. Divulgue mais, ofereça em kits, faça promoção pontual.\n• Ex: Cookie Gourmet de Fígado (margem 60%, mas só 20un/mês)\n\n🐕 **Cães** — Vendem POUCO E dão POUCO lucro\nProdutos problemáticos. Reformule, aumente preço ou TIRE do cardápio.\n• Ex: Bolinho de Brócolis (10un/mês, 12% margem)\n\n📊 A matriz aparece no Dashboard, atualizada com vendas reais.',
    categoria: 'bi',
  },
  {
    id: 'produto-cao-acao',
    titulo: 'O que fazer com um produto "Cão"?',
    resumo: 'Estratégias antes de tirar do cardápio',
    conteudo:
      'Um produto "Cão" (baixa popularidade, baixa margem) não é necessariamente ruim. Antes de remover, considere:\n\n1. 🔄 **Rever a receita**\nTroque ingredientes caros por alternativas mais acessíveis sem perder qualidade.\n\n2. 💰 **Aumentar o preço**\nTalvez esteja com preço muito baixo. Teste +15-20% — pode mover para "Quebra-cabeça".\n\n3. 🎁 **Incluir em kits**\nVenda junto com produtos Estrela. Cliente leva o combo e o "Cão" é escoado.\n\n4. ⏱️ **Reduzir tempo de produção**\nSimplifique a receita. Menos tempo = menor custo de mão de obra.\n\n5. 📣 **Reposicionar comunicação**\nÀs vezes vende pouco porque ninguém sabe que existe. Faça campanha focada.\n\n6. ❌ **Remover do cardápio**\nSe nada funcionar, libere espaço para produtos melhores. Foco gera resultados.\n\n💡 **Lembre-se:** Decisão por dados > intuição. Use a matriz para guiar, não para julgar emocionalmente.',
    categoria: 'bi',
  },

  // ============= RELATÓRIOS =============
  {
    id: 'relatorio-mensal',
    titulo: 'Como usar o Relatório Mensal?',
    resumo: 'Análise consolidada do mês',
    conteudo:
      'O Relatório Mensal traz uma visão consolidada para tomada de decisão:\n\n📊 **O que você vê:**\n• Faturamento bruto e líquido do mês\n• Custos totais (variáveis + fixos)\n• Lucro líquido final\n• Comparação com mês anterior\n• Top produtos mais vendidos\n• Top produtos mais lucrativos\n• Vendas por canal\n• Vendas por método de pagamento\n\n📥 **Exportação:**\nVocê pode exportar o relatório para guardar histórico, mostrar para contador ou analisar offline.\n\n💡 **Use mensalmente para:**\n• Avaliar se metas foram batidas\n• Identificar tendências (subindo/caindo)\n• Decidir investimentos do próximo mês\n• Justificar aumento de preço quando custos subirem',
    categoria: 'relatorios',
  },
  {
    id: 'relatorio-metodos',
    titulo: 'Relatório por Método de Pagamento',
    resumo: 'Descubra onde sua taxa está comendo lucro',
    conteudo:
      'Esse relatório mostra quanto cada método de pagamento representa no seu negócio:\n\n📊 **Métricas por método:**\n• Quantidade de vendas\n• Faturamento bruto\n• Total de taxas pagas\n• Faturamento líquido\n• % de participação no total\n\n💰 **Insights típicos:**\n\n**Cenário comum:**\n• 40% das vendas via Crédito → R$ 200 de taxa/mês\n• 30% via PIX → R$ 0 de taxa\n• 20% via iFood → R$ 800 de taxa/mês!\n\n**Decisões possíveis:**\n• Oferecer 5% desconto no PIX (incentivar) → economiza taxa\n• Aumentar preço no iFood em 15% (compensar taxa) → mantém margem\n• Negociar taxa menor com a maquininha (volume justifica)\n\n💡 **Dica de ouro:** Se um método representa muito faturamento mas pouco líquido, é hora de revisar a estratégia.',
    categoria: 'relatorios',
  },

  // ============= CUSTOS FIXOS =============
  {
    id: 'custos-fixos-explicado',
    titulo: 'O que são Custos Fixos?',
    resumo: 'Os gastos que existem mesmo sem vendas',
    conteudo:
      'Custos fixos são aqueles que você paga TODO mês, vendendo pouco ou muito:\n\n🏠 **Categorias comuns:**\n• **Aluguel/Cozinha** — Espaço de produção\n• **Energia/Água** — Contas básicas\n• **Internet** — Conectividade\n• **Marketing** — Anúncios, design, fotografia\n• **Pró-labore** — Seu salário\n• **Ferramentas/Software** — Sistemas como este, app de delivery\n• **Outros** — Contador, transporte, embalagens de uso geral\n\n📊 **Por que cadastrar?**\nSeus custos fixos definem o **ponto de equilíbrio**. Quanto maior o custo fixo, mais você precisa vender para não ter prejuízo.\n\n📐 **Percentual de rateio:**\nUse quando o custo é compartilhado. Ex: internet de casa custa R$ 100, mas só 50% é uso profissional → cadastre R$ 100 com 50% de rateio (sistema considera R$ 50).\n\n💡 **Revisar trimestralmente:** Custos fixos tendem a crescer sem você perceber. Audite a cada 3 meses.',
    categoria: 'configuracoes',
  },

  // ============= DICAS PRÁTICAS =============
  {
    id: 'armazenamento-insumos',
    titulo: 'Como armazenar ingredientes naturais?',
    resumo: 'Conserve seus ingredientes e evite desperdício',
    conteudo:
      'O armazenamento correto protege a qualidade dos petiscos e evita prejuízo:\n\n🧊 **Refrigerados (2°C a 8°C):**\nFígado, frango, ovos, iogurte natural. Sempre tampados e identificados com data.\n\n🌡️ **Congelados (-18°C):**\nProteínas porcionadas, polpas de frutas, massas prontas. Use embalagens herméticas para evitar queima de frio.\n\n🏠 **Temperatura ambiente:**\nFarinhas sem glúten (arroz, aveia), óleo de coco, sementes. Guarde em potes fechados, longe da umidade.\n\n💡 **Regra de ouro:**\nUse PVPS (Primeiro que Vence, Primeiro que Sai). Ingredientes naturais têm validade mais curta que industrializados!\n\n📋 **Etiquete tudo:**\nNome, data de abertura e validade em cada pote. Reduz perdas em até 30%.',
    categoria: 'dicas',
  },
  {
    id: 'fotografar-produtos',
    titulo: 'Como fotografar petiscos para venda?',
    resumo: 'Dicas simples para fotos que vendem mais',
    conteudo:
      'Fotos bonitas fazem toda a diferença nas vendas de petiscos naturais!\n\n📱 **Com o celular:**\n• Use luz natural (perto de uma janela)\n• Limpe a câmera antes de fotografar\n• Ative o modo retrato para desfocar o fundo\n\n🎨 **Composição:**\n• Fundo de madeira rústica ou toalha de linho\n• Adicione ingredientes naturais ao redor (cenoura, batata-doce, ervas)\n• Fotografe com um cachorro fofo ao lado (os clientes adoram!)\n• Use flat lay para biscoitos e ângulo lateral para bolos pet\n\n✨ **Edição rápida:**\n• Aumente levemente o brilho e a saturação\n• Apps gratuitos: Snapseed ou Lightroom Mobile\n\n🐶 **Dica especial:** Se puder fotografar um cão comendo o petisco, a taxa de conversão sobe muito!',
    categoria: 'dicas',
  },
  {
    id: 'dicas-embalagem',
    titulo: 'Embalagem: como embalar com carinho e economia?',
    resumo: 'Proteja seus petiscos e encante os tutores',
    conteudo:
      'A embalagem é o primeiro contato visual do tutor com o seu produto — ela comunica profissionalismo e cuidado.\n\n📦 **Escolhendo a embalagem certa:**\n• Biscoitos: saquinhos kraft com visor ou potes herméticos\n• Bolos pet: caixas de papelão com janela\n• Palitos e petiscos: embalagem a vácuo para maior durabilidade\n• Kits presente: caixas com laço e cartão do pet\n\n💰 **Economizando sem perder qualidade:**\n• Compre embalagens no atacado (economize até 40%)\n• Padronize tamanhos\n• Use adesivos personalizados com sua logo\n\n🐾 **Toques que encantam:**\n• Cartãozinho com o nome do pet\n• Tabela nutricional e lista de ingredientes\n• Selo "Sem Glúten • Sem Corantes"\n• QR Code para suas redes sociais\n\n⚠️ **SEMPRE inclua o custo da embalagem na ficha técnica!**',
    categoria: 'dicas',
  },
  {
    id: 'higiene-cozinha',
    titulo: 'Boas práticas de higiene na produção pet',
    resumo: 'Segurança alimentar para confeitaria canina',
    conteudo:
      'A higiene é a base de tudo. Produtos naturais sem conservantes exigem cuidado redobrado:\n\n🧼 **Antes de começar:**\n• Lave as mãos por 20 segundos\n• Prenda o cabelo, use avental limpo\n• Higienize a bancada com álcool 70%\n• Separe utensílios exclusivos para a produção pet\n\n🍳 **Durante a produção:**\n• Não misture utensílios humanos e pet\n• Mantenha ingredientes refrigerados até o uso\n• Controle rigorosamente tempos de forno\n\n🧹 **Após a produção:**\n• Lave utensílios imediatamente\n• Limpe forno e bancada\n• Embale em ambiente controlado\n\n📋 **Documentação:**\n• Controle de validade (produtos naturais vencem mais rápido!)\n• Temperaturas da geladeira diariamente\n• Notas fiscais dos ingredientes',
    categoria: 'dicas',
  },
  {
    id: 'ingredientes-seguros',
    titulo: 'Ingredientes seguros e proibidos para cães',
    resumo: 'Guia essencial de nutrição canina',
    conteudo:
      'Conhecer os ingredientes é fundamental para a segurança dos pets!\n\n✅ **SEGUROS e nutritivos:**\n• Proteínas: frango, fígado bovino, peixe (sem espinhas), ovos\n• Carboidratos: batata-doce, abóbora, arroz, aveia sem glúten\n• Vegetais: cenoura, espinafre, abobrinha, brócolis\n• Frutas: banana, maçã (sem sementes), blueberry, melancia\n• Gorduras: óleo de coco, azeite (pequenas quantidades)\n\n🚫 **PROIBIDOS (tóxicos!):**\n• Chocolate e cacau\n• Uva e passas\n• Cebola e alho\n• Xilitol (adoçante)\n• Macadâmia\n• Abacate\n• Café e chá\n\n⚠️ **Use com moderação:**\n• Queijo cottage (verificar lactose)\n• Amendoim (apenas pasta sem sal e sem xilitol)\n• Mel (pequenas quantidades)\n\n💡 **Na dúvida, consulte um veterinário nutricionista!**',
    categoria: 'dicas',
  },

  // ============= GERAL =============
  {
    id: 'seguranca-isolamento',
    titulo: 'Meus dados estão seguros?',
    resumo: 'Como funciona a proteção e isolamento',
    conteudo:
      'Sim! O sistema usa autenticação obrigatória e isolamento por usuário:\n\n🔒 **Como funciona:**\n• Cada usuária só vê seus próprios dados\n• Dados ficam protegidos por Row-Level Security (RLS) no banco\n• Senha criptografada (nem o sistema vê)\n• Sessão expira por inatividade\n• Páginas protegidas redirecionam para login se não autenticada\n\n🛡️ **O que isso garante:**\n• Outras pessoas com conta no sistema NÃO veem suas receitas, custos ou vendas\n• Mesmo que alguém acesse o banco, sem login não vê nada\n• Senhas seguem padrões mínimos de segurança\n\n💡 **Boas práticas:**\n• Nunca compartilhe sua senha\n• Saia da conta em computadores compartilhados\n• Use senha forte (8+ caracteres, com números)\n• Reset de senha via e-mail é seguro\n\n📧 Em caso de dúvida sobre segurança, use a opção "Recuperar senha" na tela de login.',
    categoria: 'geral',
  },
  {
    id: 'perfil-temas',
    titulo: 'Posso personalizar o sistema?',
    resumo: 'Perfis canino e clássico, paleta visual',
    conteudo:
      'Sim! O sistema oferece dois perfis visuais:\n\n🐾 **Perfil Canino (padrão):**\n• Cores verde sálvia + terracota\n• Linguagem pet-friendly\n• Ícones de patinha\n• Conteúdo adaptado para confeitaria pet natural\n\n🎂 **Perfil Clássico:**\n• Paleta original rosa\n• Linguagem genérica de confeitaria\n• Útil se você produz tanto para humanos quanto pets\n\n📍 **Onde mudar:**\nMenu lateral > Perfil > Trocar perfil\n\n💡 A escolha fica salva no seu navegador. Pode mudar quantas vezes quiser sem perder dados.',
    categoria: 'geral',
  },
];

export const CATEGORIA_LABELS: Record<string, string> = {
  'primeiros-passos': '🚀 Primeiros Passos',
  configuracoes: '⚙️ Configurações',
  insumos: '🥕 Insumos / Ingredientes',
  receitas: '📖 Receitas / Fichas Técnicas',
  kits: '📦 Kits / Combos',
  precificacao: '💰 Precificação',
  pagamentos: '💳 Métodos de Pagamento',
  vendas: '🛒 Vendas',
  bi: '📊 BI / Painel',
  relatorios: '📈 Relatórios',
  dicas: '✨ Dicas Práticas',
  geral: '📋 Geral & Segurança',
};
