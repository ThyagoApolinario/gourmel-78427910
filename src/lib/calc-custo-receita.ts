import { supabase } from '@/integrations/supabase/client';

type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un';

function getConversionFactor(insumoUnit: UnidadeMedida, receitaUnit: UnidadeMedida): number | null {
  if (insumoUnit === receitaUnit) return 1;
  const conv: Record<string, number> = {
    'kg->g': 1000, 'g->kg': 0.001, 'l->ml': 1000, 'ml->l': 0.001,
  };
  return conv[`${insumoUnit}->${receitaUnit}`] ?? null;
}

/**
 * Calcula o custo total de insumos (ingredientes + embalagens) por UNIDADE
 * vendida da receita. Usado para snapshot histórico em vendas.
 */
export async function calcCustoInsumosPorUnidade(receitaId: string): Promise<number> {
  const [{ data: receita }, { data: composicao }] = await Promise.all([
    supabase.from('receitas').select('rendimento_quantidade').eq('id', receitaId).maybeSingle(),
    supabase
      .from('composicao_receita')
      .select('quantidade, fator_rendimento, unidade_medida, insumo:insumos(custo_unitario, unidade_medida)')
      .eq('receita_id', receitaId),
  ]);

  if (!composicao || composicao.length === 0) return 0;

  let custoTotal = 0;
  for (const c of composicao as any[]) {
    const custoUn = c.insumo?.custo_unitario ?? 0;
    const insumoUnit = (c.insumo?.unidade_medida ?? 'g') as UnidadeMedida;
    const receitaUnit = c.unidade_medida as UnidadeMedida;
    const fator = c.fator_rendimento || 1;
    const conv = getConversionFactor(insumoUnit, receitaUnit);
    if (conv === null) {
      custoTotal += (c.quantidade * custoUn) / fator;
    } else {
      custoTotal += (c.quantidade * custoUn) / conv / fator;
    }
  }

  const rend = receita?.rendimento_quantidade || 1;
  return custoTotal / rend;
}
