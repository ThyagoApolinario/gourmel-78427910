import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { CreditCard, TrendingDown, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';

type Periodo = '30' | '90' | '180' | '365' | 'all';

interface VendaRow {
  preco_venda: number;
  quantidade: number;
  taxa_aplicada: number | null;
  custo_insumos_snapshot: number | null;
  valor_liquido_real: number | null;
  metodo_pagamento_nome: string | null;
  data_venda: string;
}

interface MetodoStats {
  metodo: string;
  vendas: number;
  faturamento: number;
  taxaTotal: number;
  custoInsumos: number;
  lucroLiquido: number;
  ticketMedio: number;
  margemPct: number;
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

export default function RelatorioMetodos() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>('90');

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['relatorio_metodos', user?.id, periodo],
    queryFn: async () => {
      let q = supabase
        .from('vendas')
        .select(
          'preco_venda, quantidade, taxa_aplicada, custo_insumos_snapshot, valor_liquido_real, metodo_pagamento_nome, data_venda'
        )
        .eq('user_id', user!.id);

      if (periodo !== 'all') {
        const dias = parseInt(periodo, 10);
        const desde = new Date();
        desde.setDate(desde.getDate() - dias);
        q = q.gte('data_venda', desde.toISOString().split('T')[0]);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as VendaRow[];
    },
    enabled: !!user,
  });

  const { stats, totals } = useMemo(() => {
    const map = new Map<string, MetodoStats>();
    let totFaturamento = 0;
    let totTaxa = 0;
    let totCusto = 0;
    let totLucro = 0;

    for (const v of vendas) {
      const nome = v.metodo_pagamento_nome ?? 'Não informado';
      const bruto = (v.preco_venda || 0) * (v.quantidade || 0);
      const taxaPct = v.taxa_aplicada ?? 0;
      const taxaValor = (bruto * taxaPct) / 100;
      const custo = v.custo_insumos_snapshot ?? 0;
      // Fallback caso valor_liquido_real esteja null (vendas legadas)
      const lucro = v.valor_liquido_real ?? bruto - taxaValor - custo;

      const cur = map.get(nome) ?? {
        metodo: nome,
        vendas: 0,
        faturamento: 0,
        taxaTotal: 0,
        custoInsumos: 0,
        lucroLiquido: 0,
        ticketMedio: 0,
        margemPct: 0,
      };
      cur.vendas += 1;
      cur.faturamento += bruto;
      cur.taxaTotal += taxaValor;
      cur.custoInsumos += custo;
      cur.lucroLiquido += lucro;
      map.set(nome, cur);

      totFaturamento += bruto;
      totTaxa += taxaValor;
      totCusto += custo;
      totLucro += lucro;
    }

    const list = Array.from(map.values()).map((s) => ({
      ...s,
      ticketMedio: s.vendas > 0 ? s.faturamento / s.vendas : 0,
      margemPct: s.faturamento > 0 ? (s.lucroLiquido / s.faturamento) * 100 : 0,
    }));
    list.sort((a, b) => b.faturamento - a.faturamento);

    return {
      stats: list,
      totals: {
        faturamento: totFaturamento,
        taxa: totTaxa,
        custo: totCusto,
        lucro: totLucro,
        vendas: vendas.length,
        margemMediaPct: totFaturamento > 0 ? (totLucro / totFaturamento) * 100 : 0,
      },
    };
  }, [vendas]);

  // Identifica método com pior margem (gargalo) e melhor margem (campeão)
  const piorMargem = stats.length > 1 ? [...stats].sort((a, b) => a.margemPct - b.margemPct)[0] : null;
  const melhorMargem = stats.length > 1 ? [...stats].sort((a, b) => b.margemPct - a.margemPct)[0] : null;

  const chartData = stats.map((s) => ({
    name: s.metodo,
    Faturamento: Number(s.faturamento.toFixed(2)),
    Taxa: Number(s.taxaTotal.toFixed(2)),
    Lucro: Number(s.lucroLiquido.toFixed(2)),
  }));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Performance por Método de Pagamento
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Descubra quais métodos estão corroendo a sua margem
            </p>
          </div>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        ) : vendas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhuma venda registrada no período selecionado.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Faturamento Bruto</p>
                  <p className="font-bold text-lg sm:text-xl text-foreground">{fmtBRL(totals.faturamento)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{totals.vendas} vendas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Taxas Pagas
                  </p>
                  <p className="font-bold text-lg sm:text-xl text-destructive">{fmtBRL(totals.taxa)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {totals.faturamento > 0 ? fmtPct((totals.taxa / totals.faturamento) * 100) : '0%'} do bruto
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Custo de Insumos</p>
                  <p className="font-bold text-lg sm:text-xl text-foreground">{fmtBRL(totals.custo)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {totals.faturamento > 0 ? fmtPct((totals.custo / totals.faturamento) * 100) : '0%'} do bruto
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Lucro Líquido
                  </p>
                  <p className="font-bold text-lg sm:text-xl text-primary">{fmtBRL(totals.lucro)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Margem: {fmtPct(totals.margemMediaPct)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            {(piorMargem || melhorMargem) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {melhorMargem && (
                  <Card className="border-primary/30">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Melhor margem</p>
                        <p className="font-semibold">{melhorMargem.metodo}</p>
                        <p className="text-xs text-muted-foreground">
                          Margem de {fmtPct(melhorMargem.margemPct)} — incentive este canal
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {piorMargem && piorMargem.metodo !== melhorMargem?.metodo && (
                  <Card className="border-destructive/30">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Atenção</p>
                        <p className="font-semibold">{piorMargem.metodo}</p>
                        <p className="text-xs text-muted-foreground">
                          Margem de apenas {fmtPct(piorMargem.margemPct)} — este método está corroendo seu lucro
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Gráfico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparativo Visual</CardTitle>
                <CardDescription>Faturamento, taxas pagas e lucro líquido por método</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        formatter={(v: number) => fmtBRL(v)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Taxa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Lucro" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tabela detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento por Método</CardTitle>
                <CardDescription>
                  Ordenado por faturamento. Margem = lucro líquido ÷ faturamento bruto.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                        <TableHead className="text-right">Taxa Paga</TableHead>
                        <TableHead className="text-right">Custo Insumos</TableHead>
                        <TableHead className="text-right">Lucro Líquido</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.map((s) => {
                        const isMelhor = melhorMargem?.metodo === s.metodo && stats.length > 1;
                        const isPior = piorMargem?.metodo === s.metodo && stats.length > 1 && !isMelhor;
                        return (
                          <TableRow key={s.metodo}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2 flex-wrap">
                                {s.metodo}
                                {isMelhor && (
                                  <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30">
                                    <TrendingUp className="h-2.5 w-2.5" /> Top
                                  </Badge>
                                )}
                                {isPior && (
                                  <Badge variant="secondary" className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/30">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Atenção
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Ticket médio: {fmtBRL(s.ticketMedio)}
                              </p>
                            </TableCell>
                            <TableCell className="text-right text-sm">{s.vendas}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {fmtBRL(s.faturamento)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-destructive">
                              {fmtBRL(s.taxaTotal)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {fmtBRL(s.custoInsumos)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-primary">
                              {fmtBRL(s.lucroLiquido)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              <Badge
                                variant="secondary"
                                className={
                                  s.margemPct >= totals.margemMediaPct
                                    ? 'bg-primary/10 text-primary border-primary/30'
                                    : 'bg-destructive/10 text-destructive border-destructive/30'
                                }
                              >
                                {fmtPct(s.margemPct)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
