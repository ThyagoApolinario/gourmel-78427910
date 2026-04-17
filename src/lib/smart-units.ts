type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un';

interface SugestaoUnidade {
  unidade: UnidadeMedida;
  pesoSugerido?: number;
}

const SUGESTOES: Record<string, SugestaoUnidade> = {
  // Farinhas e pós
  farinha: { unidade: 'kg', pesoSugerido: 1000 },
  amido: { unidade: 'g', pesoSugerido: 500 },
  fermento: { unidade: 'g', pesoSugerido: 100 },
  cacau: { unidade: 'g', pesoSugerido: 200 },
  'açúcar': { unidade: 'kg', pesoSugerido: 1000 },
  acucar: { unidade: 'kg', pesoSugerido: 1000 },
  polvilho: { unidade: 'kg', pesoSugerido: 1000 },
  'maizena': { unidade: 'g', pesoSugerido: 500 },
  canela: { unidade: 'g', pesoSugerido: 50 },
  sal: { unidade: 'kg', pesoSugerido: 1000 },
  'bicarbonato': { unidade: 'g', pesoSugerido: 100 },

  // Líquidos
  leite: { unidade: 'l', pesoSugerido: 1000 },
  'creme de leite': { unidade: 'ml', pesoSugerido: 200 },
  'leite condensado': { unidade: 'g', pesoSugerido: 395 },
  'óleo': { unidade: 'ml', pesoSugerido: 900 },
  oleo: { unidade: 'ml', pesoSugerido: 900 },
  azeite: { unidade: 'ml', pesoSugerido: 500 },
  'essência': { unidade: 'ml', pesoSugerido: 30 },
  essencia: { unidade: 'ml', pesoSugerido: 30 },
  'extrato': { unidade: 'ml', pesoSugerido: 30 },
  'água': { unidade: 'ml' },
  agua: { unidade: 'ml' },

  // Gorduras
  manteiga: { unidade: 'g', pesoSugerido: 200 },
  margarina: { unidade: 'g', pesoSugerido: 500 },
  'gordura': { unidade: 'g', pesoSugerido: 500 },

  // Ovos e unidades
  ovo: { unidade: 'un', pesoSugerido: 12 },
  ovos: { unidade: 'un', pesoSugerido: 12 },

  // Chocolates
  chocolate: { unidade: 'g', pesoSugerido: 1000 },
  'gotas de chocolate': { unidade: 'g', pesoSugerido: 1000 },
  'granulado': { unidade: 'g', pesoSugerido: 500 },
  'confeito': { unidade: 'g', pesoSugerido: 500 },

  // Frutas e outros
  morango: { unidade: 'g', pesoSugerido: 300 },
  'frutas': { unidade: 'g' },
  coco: { unidade: 'g', pesoSugerido: 100 },
  nozes: { unidade: 'g', pesoSugerido: 100 },
  castanha: { unidade: 'g', pesoSugerido: 100 },
  'amendoim': { unidade: 'g', pesoSugerido: 500 },

  // Embalagens
  caixa: { unidade: 'un', pesoSugerido: 1 },
  'cake board': { unidade: 'un', pesoSugerido: 1 },
  fita: { unidade: 'un', pesoSugerido: 1 },
  tag: { unidade: 'un', pesoSugerido: 1 },
  sacola: { unidade: 'un', pesoSugerido: 1 },
  'papel manteiga': { unidade: 'un', pesoSugerido: 1 },
  forma: { unidade: 'un', pesoSugerido: 1 },
  'forminha': { unidade: 'un', pesoSugerido: 100 },
  suporte: { unidade: 'un', pesoSugerido: 1 },
};

export function sugerirUnidade(nome: string): SugestaoUnidade | null {
  const nomeLower = nome.toLowerCase().trim();
  
  // Exact match first
  if (SUGESTOES[nomeLower]) return SUGESTOES[nomeLower];
  
  // Partial match
  for (const [key, valor] of Object.entries(SUGESTOES)) {
    if (nomeLower.includes(key) || key.includes(nomeLower)) {
      return valor;
    }
  }
  
  return null;
}

export function formatarCusto(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function calcularCustoUnitario(preco: number, pesoVolume: number): number {
  if (pesoVolume === 0) return 0;
  return preco / pesoVolume;
}

export function unidadeLabel(unidade: UnidadeMedida): string {
  const labels: Record<UnidadeMedida, string> = {
    g: 'grama',
    kg: 'quilograma',
    ml: 'mililitro',
    l: 'litro',
    un: 'unidade',
  };
  return labels[unidade];
}
