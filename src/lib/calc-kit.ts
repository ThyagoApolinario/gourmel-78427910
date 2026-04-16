import { supabase } from '@/integrations/supabase/client';
import { calcCustoInsumosPorUnidade } from '@/lib/calc-custo-receita';

type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un';

function getConversionFactor(insumoUnit: UnidadeMedida, receitaUnit: UnidadeMedida): number | null {
  if (insumoUnit === receitaUnit) return 1;
  const conv: Record<string, number> = {
    'kg->g': 1000, 'g->kg': 0.001, 'l->ml': 1000, 'ml->l': 0.001,
  };
  return conv[`${insumoUnit}->${receitaUnit}`] ?? null;
}

export interface KitItemInput {
  tipo_item: 'receita' | 'insumo';
  receita_id?: string | null;
  insumo_id?: string | null;
  quantidade: number;
}

export interface KitCustoBreakdown {
  /** Soma de custos herdados de cada item (insumos+embalagens das receitas + custo de cada insumo avulso) */
  custoItens: number;
  /** Custo de mão de obra de montagem do kit */
  custoMontagem: number;
  /** custoItens + custoMontagem (ou só itens se zerar_mao_obra=true) */
  custoTotal: number;
  /** Soma dos preços individuais sugeridos das receitas (para comparação) */
  somaPrecosIndividuais: number;
  /** Detalhe por item para UI */
  itens: Array<{
    nome: string;
    tipo: 'receita' | 'insumo';
    quantidade: number;
    custoUnitario: number;
    custoTotal: number;
    precoIndividualSugerido?: number;
  }>;
}

export interface FinanceConfig {
  pro_labore: number;
  horas_mes: number;
  impostos: number;
  margem_desejada: number;
}

/**
 * Custo unitário de um insumo já considerando sua unidade base (custo_unitario é por unidade base).
 */
function calcCustoInsumoAvulso(
  insumo: { custo_unitario: number | null; unidade_medida: string },
  qtd: number,
): number {
  const custoUn = insumo.custo_unitario ?? 0;
  // qtd é assumido na mesma unidade do insumo (simplificação UX)
  return custoUn * qtd;
}

/**
 * Calcula o preço sugerido de uma receita usando a mesma fórmula do PrecificacaoCard:
 * Preço Total = Custo Variável / (1 - Taxa% - Impostos% - Margem%)
 */
async function calcPrecoSugeridoReceita(
  receitaId: string,
  config: FinanceConfig,
  taxaPadrao: number,
): Promise<{ preco: number; custoUnitario: number }> {
  const { data: receita } = await supabase
    .from('receitas')
    .select('rendimento_quantidade, tempo_producao_minutos, margem_desejada')
    .eq('id', receitaId)
    .maybeSingle();

  const custoInsumosPorUnidade = await calcCustoInsumosPorUnidade(receitaId);
  const rend = receita?.rendimento_quantidade || 1;
  const custoInsumosTotal = custoInsumosPorUnidade * rend;

  const custoMinuto = config.pro_labore / (config.horas_mes * 60);
  const custoMaoDeObra = (receita?.tempo_producao_minutos || 0) * custoMinuto;
  const custoVariavel = custoInsumosTotal + custoMaoDeObra;

  const margem = receita?.margem_desejada ?? config.margem_desejada;
  const totalPct = (taxaPadrao + config.impostos + margem) / 100;

  if (totalPct >= 1) return { preco: 0, custoUnitario: custoInsumosPorUnidade };

  const precoTotal = custoVariavel / (1 - totalPct);
  return { preco: precoTotal, custoUnitario: custoInsumosPorUnidade };
}

/**
 * Calcula o custo completo do kit + soma dos preços individuais.
 */
export async function calcularKit(
  itens: KitItemInput[],
  tempoMontagemMin: number,
  zerarMaoObra: boolean,
  config: FinanceConfig,
  taxaPadrao: number,
): Promise<KitCustoBreakdown> {
  const detalhes: KitCustoBreakdown['itens'] = [];
  let custoItens = 0;
  let somaPrecosIndividuais = 0;

  // Buscar dados de cada item em paralelo
  const receitaIds = itens.filter(i => i.tipo_item === 'receita' && i.receita_id).map(i => i.receita_id!);
  const insumoIds = itens.filter(i => i.tipo_item === 'insumo' && i.insumo_id).map(i => i.insumo_id!);

  const [receitasRes, insumosRes] = await Promise.all([
    receitaIds.length
      ? supabase.from('receitas').select('id, nome').in('id', receitaIds)
      : Promise.resolve({ data: [] as any[] }),
    insumoIds.length
      ? supabase.from('insumos').select('id, nome, custo_unitario, unidade_medida').in('id', insumoIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const receitasMap = new Map((receitasRes.data || []).map((r: any) => [r.id, r]));
  const insumosMap = new Map((insumosRes.data || []).map((i: any) => [i.id, i]));

  // Pré-calcula preço/custo de cada receita uma vez
  const precosReceitas = new Map<string, { preco: number; custoUnitario: number }>();
  for (const rid of new Set(receitaIds)) {
    precosReceitas.set(rid, await calcPrecoSugeridoReceita(rid, config, taxaPadrao));
  }

  for (const item of itens) {
    if (item.tipo_item === 'receita' && item.receita_id) {
      const receita = receitasMap.get(item.receita_id);
      const precoData = precosReceitas.get(item.receita_id);
      if (!receita || !precoData) continue;

      const custoUn = precoData.custoUnitario;
      const custoTotal = custoUn * item.quantidade;
      const precoIndividual = precoData.preco * item.quantidade;
      custoItens += custoTotal;
      somaPrecosIndividuais += precoIndividual;
      detalhes.push({
        nome: receita.nome,
        tipo: 'receita',
        quantidade: item.quantidade,
        custoUnitario: custoUn,
        custoTotal,
        precoIndividualSugerido: precoIndividual,
      });
    } else if (item.tipo_item === 'insumo' && item.insumo_id) {
      const insumo = insumosMap.get(item.insumo_id);
      if (!insumo) continue;

      const custoTotal = calcCustoInsumoAvulso(insumo, item.quantidade);
      custoItens += custoTotal;
      detalhes.push({
        nome: insumo.nome,
        tipo: 'insumo',
        quantidade: item.quantidade,
        custoUnitario: insumo.custo_unitario ?? 0,
        custoTotal,
      });
    }
  }

  const custoMinuto = config.pro_labore / (config.horas_mes * 60);
  const custoMontagem = zerarMaoObra ? 0 : tempoMontagemMin * custoMinuto;
  const custoTotal = custoItens + custoMontagem;

  return { custoItens, custoMontagem, custoTotal, somaPrecosIndividuais, itens: detalhes };
}

/**
 * Calcula preço sugerido do kit: soma individuais com 10% desconto sobre essa soma.
 */
export function calcPrecoSugeridoKit(somaPrecosIndividuais: number): number {
  return somaPrecosIndividuais * 0.9;
}

/**
 * Aplica desconto% sobre uma base (soma individuais).
 */
export function aplicarDesconto(precoBase: number, descontoPct: number): number {
  return precoBase * (1 - descontoPct / 100);
}

/**
 * Calcula margem de contribuição em R$ e % a partir do preço final, custo total e taxa do método de pagamento.
 */
export function calcMargemKit(
  precoFinal: number,
  custoTotal: number,
  taxaPct: number,
  impostosPct: number,
): { lucroReais: number; margemPct: number; taxaValor: number } {
  const taxaValor = (precoFinal * taxaPct) / 100;
  const impostoValor = (precoFinal * impostosPct) / 100;
  const lucroReais = precoFinal - custoTotal - taxaValor - impostoValor;
  const margemPct = precoFinal > 0 ? (lucroReais / precoFinal) * 100 : 0;
  return { lucroReais, margemPct, taxaValor };
}

/**
 * Calcula o % de economia para o cliente comparando preço final do kit vs soma individual.
 */
export function calcEconomia(somaIndividuais: number, precoKit: number): number {
  if (somaIndividuais <= 0) return 0;
  return ((somaIndividuais - precoKit) / somaIndividuais) * 100;
}
