import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, TrendingUp, DollarSign, Wallet, Lightbulb, AlertTriangle } from 'lucide-react';
import { formatarCusto } from '@/lib/smart-units';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un';

function getConversionFactor(from: UnidadeMedida, to: UnidadeMedida): number | null {
  if (from === to) return 1;
  const map: Record<string, number> = { 'kg->g': 1000, 'g->kg': 0.001, 'l->ml': 1000, 'ml->l': 0.001 };
  return map[`${from}->${to}`] ?? null;
}

function buildMonthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    opts.push({
      value: format(d, 'yyyy-MM-dd'),
      label: format(d, 'MMMM yyyy', { locale: ptBR }),
    });
  }
  return opts;
}

export default function PontoEquilibrio() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const mesStart = selectedMonth;
  const mesEnd = format(endOfMonth(parseISO(selectedMonth)), 'yyyy-MM-dd');

  // Receitas for the selected month
  const { data: receitas = [] } = useQuery({
    queryKey: ['receitas_pe', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, rendimento_quantidade, rendimento_unidade, tempo_producao_minutos, margem_desejada, mes_producao')
        .eq('user_id', user!.id)
        .gte('mes_producao', mesStart)
        .lte('mes_producao', mesEnd)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Composições for those recipes
  const receitaIds = receitas.map(r => r.id);
  const { data: composicoes = [] } = useQuery({
    queryKey: ['composicao_pe', receitaIds],
    queryFn: async () => {
      if (receitaIds.length === 0) return [];
      const { data, error } = await supabase
        .from('composicao_receita')
        .select('receita_id, quantidade, fator_rendimento, unidade_medida, insumo:insumos(custo_unitario, unidade_medida, categoria)')
        .in('receita_id', receitaIds);
      if (error) throw error;
      return data as any[];
    },
    enabled: receitaIds.length > 0,
  });

  // Vendas in the month
  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas_pe', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('receita_id, preco_venda, quantidade')
        .eq('user_id', user!.id)
        .gte('data_venda', mesStart)
        .lte('data_venda', mesEnd);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Custos fixos
  const { data: custosFixos = [] } = useQuery({
    queryKey: ['custos_fixos_pe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('valor_mensal, percentual_rateio')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Config financeira
  const { data: config } = useQuery({
    queryKey: ['config_pe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_financeiras')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const custoFixoTotal = useMemo(() =>
    custosFixos.reduce((s, c) => s + (c.valor_mensal * c.percentual_rateio / 100), 0),
    [custosFixos]
  );

  const taxaCartao = config?.taxa_cartao ?? 5;
  const impostos = config?.impostos ?? 5;
  const custoMinuto = config ? config.pro_labore / (config.horas_mes * 60) : 0;

  // Per-recipe breakdown
  const receitaBreakdown = useMemo(() => {
    return receitas.map(r => {
      const comps = composicoes.filter(c => c.receita_id === r.id);
      let custoInsumos = 0;
      let custoEmbalagens = 0;

      for (const c of comps) {
        const custoUn = c.insumo?.custo_unitario ?? 0;
        const insumoUnit = (c.insumo?.unidade_medida ?? 'g') as UnidadeMedida;
        const receitaUnit = c.unidade_medida as UnidadeMedida;
        const fator = c.fator_rendimento || 1;
        const conv = getConversionFactor(insumoUnit, receitaUnit) ?? 1;
        const cost = (c.quantidade * custoUn) / conv / fator;

        if (c.insumo?.categoria === 'embalagem') {
          custoEmbalagens += cost;
        } else {
          custoInsumos += cost;
        }
      }

      const custoMaoDeObra = r.tempo_producao_minutos ? r.tempo_producao_minutos * custoMinuto : 0;
      const custoVariavel = custoInsumos + custoEmbalagens + custoMaoDeObra;
      const margem = r.margem_desejada ?? config?.margem_desejada ?? 30;
      const totalPct = (taxaCartao + impostos + margem) / 100;

      const precoTotal = totalPct < 1 ? custoVariavel / (1 - totalPct) : null;
      const rendimento = r.rendimento_quantidade ?? 1;
      const precoPorUn = precoTotal ? precoTotal / rendimento : null;

      // Vendas do mês para esta receita
      const vendasReceita = vendas.filter(v => v.receita_id === r.id);
      const qtdVendida = vendasReceita.reduce((s, v) => s + v.quantidade, 0);
      const faturamento = vendasReceita.reduce((s, v) => s + v.preco_venda * v.quantidade, 0);
      const custoVendas = qtdVendida * (custoVariavel / rendimento);
      const margemContrib = faturamento - custoVendas - (faturamento * (taxaCartao + impostos) / 100);

      return {
        id: r.id,
        nome: r.nome,
        rendimento,
        unidade: r.rendimento_unidade || 'un',
        custoVariavel,
        margem,
        precoPorUn,
        qtdVendida,
        faturamento,
        margemContrib,
      };
    });
  }, [receitas, composicoes, vendas, config, taxaCartao, impostos, custoMinuto]);

  // Global totals
  const totals = useMemo(() => {
    const faturamentoTotal = receitaBreakdown.reduce((s, r) => s + r.faturamento, 0);
    const margemContribTotal = receitaBreakdown.reduce((s, r) => s + r.margemContrib, 0);
    const lucroOperacional = margemContribTotal - custoFixoTotal;
    const margemPct = faturamentoTotal > 0 ? margemContribTotal / faturamentoTotal : 0;
    const breakevenReais = margemPct > 0 ? custoFixoTotal / margemPct : 0;
    const progressoPct = breakevenReais > 0 ? Math.min((faturamentoTotal / breakevenReais) * 100, 100) : 0;

    return { faturamentoTotal, margemContribTotal, lucroOperacional, breakevenReais, progressoPct };
  }, [receitaBreakdown, custoFixoTotal]);

  const selectedLabel = monthOptions.find(o => o.value === selectedMonth)?.label ?? '';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Ponto de Equilíbrio
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile === 'canine'
                ? 'Visão mensal consolidada da sua confeitaria pet 🐾'
                : 'Visão mensal consolidada de todas as receitas'}
            </p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label.charAt(0).toUpperCase() + o.label.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!config && (
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Configure suas <strong>Configurações Financeiras</strong> para cálculos precisos.
            </AlertDescription>
          </Alert>
        )}

        {receitas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                Nenhuma receita atribuída a <strong>{selectedLabel}</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Edite suas receitas e defina o mês de produção para vê-las aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-primary/20">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <DollarSign className="h-3 w-3" /> Faturamento
                  </p>
                  <p className="font-bold text-lg">{formatarCusto(totals.faturamentoTotal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Margem Contrib.
                  </p>
                  <p className="font-bold text-lg">{formatarCusto(totals.margemContribTotal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <Wallet className="h-3 w-3" /> Custos Fixos
                  </p>
                  <p className="font-bold text-lg">{formatarCusto(custoFixoTotal)}</p>
                </CardContent>
              </Card>
              <Card className={totals.lucroOperacional >= 0 ? 'border-success/30' : 'border-destructive/30'}>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Lucro Operacional</p>
                  <p className={`font-bold text-lg ${totals.lucroOperacional >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatarCusto(totals.lucroOperacional)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Breakeven Progress */}
            {totals.breakevenReais > 0 && (
              <Card className="border-accent/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    Progresso para o Ponto de Equilíbrio
                  </CardTitle>
                  <CardDescription>
                    Meta: {formatarCusto(totals.breakevenReais)} em vendas para cobrir custos fixos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Faturamento atual</span>
                    <span className="font-medium">
                      {formatarCusto(totals.faturamentoTotal)} / {formatarCusto(totals.breakevenReais)}
                    </span>
                  </div>
                  <Progress value={totals.progressoPct} className="h-3" />
                  <p className="text-[10px] text-muted-foreground">
                    {totals.progressoPct >= 100
                      ? '🎉 Parabéns! Custos fixos cobertos — agora é lucro!'
                      : `Falta ${(100 - totals.progressoPct).toFixed(0)}% para cobrir custos fixos`}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recipe table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Receitas de {selectedLabel}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receita</TableHead>
                      <TableHead className="text-center">Rend.</TableHead>
                      <TableHead className="text-right">Preço/Un</TableHead>
                      <TableHead className="text-center">Vendido</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitaBreakdown.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px]">
                            {r.rendimento} {r.unidade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.precoPorUn ? formatarCusto(r.precoPorUn) : '—'}
                        </TableCell>
                        <TableCell className="text-center">{r.qtdVendida}</TableCell>
                        <TableCell className="text-right">{formatarCusto(r.faturamento)}</TableCell>
                        <TableCell className={`text-right font-medium ${r.margemContrib >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatarCusto(r.margemContrib)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Tip */}
            <Alert className="border-primary/20 bg-primary/5">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                O ponto de equilíbrio é calculado com base na margem de contribuição de <strong>todas as receitas do mês</strong>, 
                distribuindo os custos fixos proporcionalmente. Quanto mais receitas produzidas e vendidas, menor o peso dos custos fixos em cada unidade.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </AppLayout>
  );
}
