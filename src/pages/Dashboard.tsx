import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { formatarCusto } from '@/lib/smart-units';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, ZAxis,
} from 'recharts';
import {
  Star, Zap, Puzzle, Dog, BarChart3, AlertTriangle, Clock, TrendingUp,
  ChevronDown, ChevronUp, Target, Wallet,
} from 'lucide-react';
import { subDays, parseISO, isAfter, format } from 'date-fns';
import { toast } from 'sonner';

// Types
interface Receita {
  id: string;
  nome: string;
  tempo_producao_minutos: number | null;
  rendimento_quantidade: number | null;
  rendimento_unidade: string | null;
}

interface Composicao {
  receita_id: string;
  insumo_id: string;
  quantidade: number;
  fator_rendimento: number;
  insumo: { custo_unitario: number | null; categoria: string } | null;
}

interface Venda {
  receita_id: string | null;
  kit_id: string | null;
  quantidade: number;
  preco_venda: number;
  data_venda: string;
  valor_liquido_real: number | null;
  custo_insumos_snapshot: number | null;
  taxa_aplicada: number | null;
  metodo_pagamento_nome: string | null;
}

interface KitItem {
  kit_id: string;
  receita_id: string | null;
  quantidade: number;
}

interface ConfigFinanceira {
  pro_labore: number;
  horas_mes: number;
  impostos: number;
}

type Quadrante = 'estrela' | 'cavalo' | 'quebracabeca' | 'cao';

interface ProdutoAnalise {
  id: string;
  nome: string;
  volume: number;
  volumeLabel: string;
  margemContribuicao: number;
  custoTotal: number;
  precoMedioVenda: number;
  tempoProducao: number | null;
  quadrante: Quadrante;
  rendimentoUnidade: string;
}

const QUADRANTE_CONFIG: Record<Quadrante, {
  label: string;
  icon: typeof Star;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
  acao: string;
}> = {
  estrela: {
    label: 'Estrelas',
    icon: Star,
    color: 'hsl(145, 60%, 40%)',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30',
    textClass: 'text-success',
    dotColor: '#22c55e',
    acao: 'Manter qualidade e destacar no marketing. São seus produtos campeões!',
  },
  cavalo: {
    label: 'Cavalos de Carga',
    icon: Zap,
    color: 'hsl(35, 90%, 55%)',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/30',
    textClass: 'text-warning',
    dotColor: '#f59e0b',
    acao: 'Aumentar preço ou reduzir custo de insumos (rever ficha técnica).',
  },
  quebracabeca: {
    label: 'Quebra-cabeças',
    icon: Puzzle,
    color: 'hsl(220, 70%, 55%)',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
    textClass: 'text-primary',
    dotColor: '#3b82f6',
    acao: 'Investir em promoção e visibilidade. Esses produtos dão lucro, mas precisam vender mais.',
  },
  cao: {
    label: 'Cães',
    icon: Dog,
    color: 'hsl(0, 60%, 55%)',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/30',
    textClass: 'text-destructive',
    dotColor: '#ef4444',
    acao: 'Avaliar remoção do cardápio ou mudança total na receita.',
  },
};

const PERIODOS = [
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 180 dias' },
  { value: 'all', label: 'Todo o período' },
];

// Breakeven Card with milestone alerts
interface MilestoneInfo {
  pct: number;
  label: string;
  emoji: string;
  msg: string;
}

function BreakevenCard({
  custoFixoTotal, breakevenReais, faturamentoTotal, progressoPct,
  milestones, reachedMilestones, nextMilestone,
}: {
  custoFixoTotal: number;
  breakevenReais: number;
  faturamentoTotal: number;
  progressoPct: number;
  milestones: MilestoneInfo[];
  reachedMilestones: MilestoneInfo[];
  nextMilestone: MilestoneInfo | undefined;
}) {
  const shownRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const monthKey = format(new Date(), 'yyyy-MM');
    const storageKey = `gourmel_milestones_${monthKey}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]') as number[];
    shownRef.current = new Set(stored);

    for (const m of reachedMilestones) {
      if (!shownRef.current.has(m.pct)) {
        shownRef.current.add(m.pct);
        toast.success(`${m.emoji} ${m.label}`, { description: m.msg, duration: 6000 });
      }
    }

    localStorage.setItem(storageKey, JSON.stringify([...shownRef.current]));
  }, [reachedMilestones]);

  return (
    <Card className="border-accent/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">Cobertura de Custos Fixos</span>
          </div>
          <a href="/custos-fixos" className="text-xs text-primary hover:underline flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Gerenciar
          </a>
        </div>

        {/* Progress bar with milestone markers */}
        <div className="relative">
          <Progress value={progressoPct} className="h-3" />
          <div className="absolute inset-0 pointer-events-none">
            {milestones.map(m => (
              <div
                key={m.pct}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}
              >
                <div className={`w-1 h-4 rounded-full ${progressoPct >= m.pct ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Milestone labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
          <span>0%</span>
          {milestones.map(m => (
            <span key={m.pct} className={progressoPct >= m.pct ? 'text-primary font-medium' : ''}>
              {m.emoji} {m.pct}%
            </span>
          ))}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>R$ {faturamentoTotal.toFixed(2).replace('.', ',')} vendidos</span>
          <span>Meta: R$ {breakevenReais.toFixed(2).replace('.', ',')}</span>
        </div>

        {/* Status message */}
        {progressoPct >= 100 ? (
          <Alert className="border-success/30 bg-success/5 py-2">
            <AlertDescription className="text-xs text-success font-medium">
              🎉 Custos fixos cobertos! A partir daqui é lucro real no bolso.
            </AlertDescription>
          </Alert>
        ) : nextMilestone ? (
          <p className="text-[10px] text-muted-foreground">
            {nextMilestone.emoji} Próximo marco: <strong>{nextMilestone.pct}%</strong> — {nextMilestone.msg}
            {' '}(faltam R$ {((breakevenReais * nextMilestone.pct / 100) - faturamentoTotal).toFixed(2).replace('.', ',')})
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            Falta {(100 - progressoPct).toFixed(0)}% para cobrir R$ {custoFixoTotal.toFixed(2).replace('.', ',')} de custos fixos mensais
          </p>
        )}

        {/* Reached milestones badges */}
        {reachedMilestones.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {reachedMilestones.map(m => (
              <Badge key={m.pct} variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                {m.emoji} {m.label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState('90');
  const [expandedQuadrante, setExpandedQuadrante] = useState<Quadrante | null>(null);

  // Fetch all data
  const { data: receitas = [] } = useQuery({
    queryKey: ['receitas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('receitas').select('id, nome, tempo_producao_minutos, rendimento_quantidade, rendimento_unidade').eq('user_id', user!.id);
      if (error) throw error;
      return data as Receita[];
    },
    enabled: !!user,
  });

  const { data: composicoes = [] } = useQuery({
    queryKey: ['composicao_all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('composicao_receita')
        .select('receita_id, insumo_id, quantidade, fator_rendimento, insumo:insumos(custo_unitario, categoria)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || []) as Composicao[];
    },
    enabled: !!user,
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('receita_id, kit_id, quantidade, preco_venda, data_venda, valor_liquido_real, custo_insumos_snapshot, taxa_aplicada, metodo_pagamento_nome')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || []) as Venda[];
    },
    enabled: !!user,
  });

  // Itens dos kits — para distribuir popularidade nos sub-itens (receitas)
  const { data: kitItens = [] } = useQuery({
    queryKey: ['kit-itens-dashboard', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kit_itens')
        .select('kit_id, receita_id, quantidade')
        .eq('user_id', user!.id)
        .eq('tipo_item', 'receita');
      if (error) throw error;
      return (data || []) as KitItem[];
    },
    enabled: !!user,
  });

  const { data: config } = useQuery({
    queryKey: ['configuracoes_financeiras', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracoes_financeiras').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data as ConfigFinanceira | null;
    },
    enabled: !!user,
  });

  // Custos fixos for breakeven bar
  const { data: custosFixos = [] } = useQuery({
    queryKey: ['custos_fixos_dashboard', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('valor_mensal, percentual_rateio')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as { valor_mensal: number; percentual_rateio: number }[];
    },
    enabled: !!user,
  });

  // Filtered vendas by period
  const vendasFiltradas = useMemo(() => {
    if (periodo === 'all') return vendas;
    const cutoff = subDays(new Date(), parseInt(periodo));
    return vendas.filter(v => isAfter(parseISO(v.data_venda), cutoff));
  }, [vendas, periodo]);

  // Calculate analysis per product — usa LUCRO REAL do snapshot quando disponível
  // Para vendas de KITS: distribui popularidade proporcionalmente nos sub-itens (receitas) do kit
  const { produtos, mediaVolume, mediaMargem } = useMemo(() => {
    const custoMinuto = config ? config.pro_labore / (config.horas_mes * 60) : 0;

    // Indexar itens dos kits por kit_id
    const itensPorKit = new Map<string, KitItem[]>();
    for (const ki of kitItens) {
      if (!ki.receita_id) continue;
      if (!itensPorKit.has(ki.kit_id)) itensPorKit.set(ki.kit_id, []);
      itensPorKit.get(ki.kit_id)!.push(ki);
    }

    // Aggregate sales per recipe — incluindo lucro líquido real
    const vendasPorReceita: Record<string, {
      totalQtd: number;
      totalReceita: number;
      totalLiquidoReal: number;
      qtdComSnapshot: number;
    }> = {};

    const incrementar = (
      receitaId: string,
      qtd: number,
      receita: number,
      liquido: number | null,
    ) => {
      if (!vendasPorReceita[receitaId]) {
        vendasPorReceita[receitaId] = { totalQtd: 0, totalReceita: 0, totalLiquidoReal: 0, qtdComSnapshot: 0 };
      }
      const acc = vendasPorReceita[receitaId];
      acc.totalQtd += qtd;
      acc.totalReceita += receita;
      if (liquido != null) {
        acc.totalLiquidoReal += liquido;
        acc.qtdComSnapshot += qtd;
      }
    };

    for (const v of vendasFiltradas) {
      if (v.kit_id && itensPorKit.has(v.kit_id)) {
        // Distribuir nos sub-itens (receitas componentes)
        const itens = itensPorKit.get(v.kit_id)!;
        const totalQtdItens = itens.reduce((s, i) => s + Number(i.quantidade), 0);
        if (totalQtdItens > 0) {
          for (const it of itens) {
            const peso = Number(it.quantidade) / totalQtdItens;
            const qtdAtribuida = v.quantidade * Number(it.quantidade);
            const receitaAtribuida = v.quantidade * v.preco_venda * peso;
            const liquidoAtribuido =
              v.valor_liquido_real != null ? Number(v.valor_liquido_real) * peso : null;
            incrementar(it.receita_id!, qtdAtribuida, receitaAtribuida, liquidoAtribuido);
          }
        }
      } else if (v.receita_id) {
        incrementar(
          v.receita_id,
          v.quantidade,
          v.quantidade * v.preco_venda,
          v.valor_liquido_real != null ? Number(v.valor_liquido_real) : null,
        );
      }
    }

    const receitasComVendas = receitas.filter((r) => vendasPorReceita[r.id]);

    const produtos: ProdutoAnalise[] = receitasComVendas.map((r) => {
      const vData = vendasPorReceita[r.id];
      const volume = vData.totalQtd;
      const unidade = r.rendimento_unidade || 'un';
      const isPeso = unidade === 'g';
      const precoMedioVenda = vData.totalReceita / vData.totalQtd;

      const volumeLabel = isPeso
        ? volume >= 1000
          ? `${(volume / 1000).toFixed(1)} kg`
          : `${volume.toFixed(0)} g`
        : `${volume} un`;

      // Calcular custo teórico (para fallback)
      const comps = composicoes.filter((c) => c.receita_id === r.id);
      let custoInsumos = 0;
      for (const c of comps) {
        const custoUn = c.insumo?.custo_unitario ?? 0;
        const fator = c.fator_rendimento || 1;
        custoInsumos += (c.quantidade * custoUn) / fator;
      }
      const custoMaoDeObra = r.tempo_producao_minutos ? r.tempo_producao_minutos * custoMinuto : 0;
      const custoTotalReceita = custoInsumos + custoMaoDeObra;
      const custoPorUnidade = r.rendimento_quantidade
        ? custoTotalReceita / r.rendimento_quantidade
        : custoTotalReceita;

      // Margem REAL: usa lucro líquido do snapshot quando vendas têm método registrado.
      // Fallback para cálculo teórico quando não há snapshot.
      let margemContribuicao: number;
      if (vData.qtdComSnapshot > 0) {
        // Lucro real médio por unidade (já inclui taxa do método e custo de insumos do momento)
        margemContribuicao = vData.totalLiquidoReal / vData.qtdComSnapshot;
      } else {
        margemContribuicao = precoMedioVenda - custoPorUnidade;
      }

      return {
        id: r.id,
        nome: r.nome,
        volume,
        volumeLabel,
        margemContribuicao,
        custoTotal: custoPorUnidade,
        precoMedioVenda,
        tempoProducao: r.tempo_producao_minutos,
        quadrante: 'cao' as Quadrante,
        rendimentoUnidade: unidade,
      };
    });

    const mediaVolume =
      produtos.length > 0 ? produtos.reduce((s, p) => s + p.volume, 0) / produtos.length : 0;
    const mediaMargem =
      produtos.length > 0
        ? produtos.reduce((s, p) => s + p.margemContribuicao, 0) / produtos.length
        : 0;

    for (const p of produtos) {
      if (p.volume >= mediaVolume && p.margemContribuicao >= mediaMargem) p.quadrante = 'estrela';
      else if (p.volume >= mediaVolume && p.margemContribuicao < mediaMargem) p.quadrante = 'cavalo';
      else if (p.volume < mediaVolume && p.margemContribuicao >= mediaMargem) p.quadrante = 'quebracabeca';
      else p.quadrante = 'cao';
    }

    return { produtos, mediaVolume, mediaMargem };
  }, [receitas, composicoes, vendasFiltradas, config, kitItens]);

  // Group by quadrant
  const produtosPorQuadrante = useMemo(() => {
    const groups: Record<Quadrante, ProdutoAnalise[]> = {
      estrela: [], cavalo: [], quebracabeca: [], cao: [],
    };
    for (const p of produtos) groups[p.quadrante].push(p);
    return groups;
  }, [produtos]);

  // High production time threshold (top 25%)
  const altoTempoProducao = useMemo(() => {
    const tempos = produtos.filter(p => p.tempoProducao).map(p => p.tempoProducao!).sort((a, b) => a - b);
    if (tempos.length === 0) return 120;
    return tempos[Math.floor(tempos.length * 0.75)] || 120;
  }, [produtos]);

  // Cavalos com alto tempo
  const cavalosAltoTempo = produtosPorQuadrante.cavalo.filter(
    p => p.tempoProducao && p.tempoProducao >= altoTempoProducao
  );

  const hasData = produtos.length > 0;

  // Scatter data
  const scatterData = produtos.map(p => ({
    x: p.volume,
    y: p.margemContribuicao,
    z: 100,
    nome: p.nome,
    quadrante: p.quadrante,
    volumeLabel: p.volumeLabel,
    rendimentoUnidade: p.rendimentoUnidade,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const q = QUADRANTE_CONFIG[d.quadrante as Quadrante];
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg text-sm">
        <p className="font-semibold">{d.nome}</p>
        <p className="text-muted-foreground">Volume: {d.volumeLabel}</p>
        <p className="text-muted-foreground">Margem: {formatarCusto(d.y)}{d.rendimentoUnidade === 'g' ? '/g' : '/un'}</p>
        <Badge className={`mt-1 ${q.bgClass} ${q.textClass} border-0`}>{q.label}</Badge>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Engenharia de Cardápio
            </h1>
            <p className="text-muted-foreground text-sm">
              Matriz Kasavana &amp; Smith — Análise de popularidade × rentabilidade
            </p>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!hasData ? (
          <Card className="border-primary/20">
            <CardContent className="p-8 sm:p-12 text-center space-y-4">
              <BarChart3 className="h-16 w-16 mx-auto text-primary/30 mb-2" />
              <h3 className="text-lg font-semibold">Sua Matriz de Cardápio vai aparecer aqui ✨</h3>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                A Engenharia de Cardápio é uma ferramenta usada por restaurantes profissionais para descobrir quais produtos
                são os verdadeiros campeões do seu negócio — e quais estão roubando seu tempo sem dar retorno.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left text-xs">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-semibold mb-1">⭐ Estrelas</p>
                  <p className="text-muted-foreground">Vendem muito e dão lucro. Seus campeões!</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-semibold mb-1">⚡ Cavalos de Carga</p>
                  <p className="text-muted-foreground">Vendem muito, mas o lucro é baixo.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-semibold mb-1">🧩 Quebra-cabeças</p>
                  <p className="text-muted-foreground">Dão lucro, mas precisam vender mais.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-semibold mb-1">🐕 Cães</p>
                  <p className="text-muted-foreground">Vendem pouco e dão pouco lucro.</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Para começar, registre vendas nas suas receitas. O sistema precisa de dados de volume e preço para classificar seus produtos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['estrela', 'cavalo', 'quebracabeca', 'cao'] as Quadrante[]).map(q => {
                const cfg = QUADRANTE_CONFIG[q];
                const Icon = cfg.icon;
                const count = produtosPorQuadrante[q].length;
                return (
                  <Card key={q} className={`${cfg.borderClass} cursor-pointer transition-colors hover:shadow-md`}
                    onClick={() => setExpandedQuadrante(expandedQuadrante === q ? null : q)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cfg.bgClass}`}>
                        <Icon className={`h-5 w-5 ${cfg.textClass}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{cfg.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Scatter Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Matriz de Desempenho</CardTitle>
                <CardDescription>
                  Cada ponto é um produto. Linhas tracejadas = médias do cardápio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Volume"
                        label={{ value: 'Volume (qtd vendida)', position: 'bottom', offset: 20, className: 'fill-muted-foreground text-xs' }}
                        className="text-xs"
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Margem"
                        label={{ value: 'Margem (R$)', angle: -90, position: 'insideLeft', offset: 0, className: 'fill-muted-foreground text-xs' }}
                        className="text-xs"
                        tickFormatter={(v: number) => `R$${v.toFixed(0)}`}
                      />
                      <ZAxis type="number" dataKey="z" range={[80, 200]} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        x={mediaVolume}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                        label={{ value: `Média Vol: ${mediaVolume.toFixed(0)}`, position: 'top', className: 'fill-muted-foreground text-[10px]' }}
                      />
                      <ReferenceLine
                        y={mediaMargem}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                        label={{ value: `Média Margem: ${formatarCusto(mediaMargem)}`, position: 'right', className: 'fill-muted-foreground text-[10px]' }}
                      />
                      <Scatter data={scatterData} name="Produtos">
                        {scatterData.map((entry, i) => (
                          <Cell key={i} fill={QUADRANTE_CONFIG[entry.quadrante as Quadrante].dotColor} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Alert: Cavalos com alto tempo */}
            {cavalosAltoTempo.length > 0 && (
              <Alert className="border-warning/30 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  <strong className="text-warning">Alerta de Tempo × Margem:</strong>{' '}
                  {cavalosAltoTempo.length === 1
                    ? `"${cavalosAltoTempo[0].nome}" é um Cavalo de Carga com alto tempo de produção (${cavalosAltoTempo[0].tempoProducao} min).`
                    : `${cavalosAltoTempo.length} produtos são Cavalos de Carga com alto tempo de produção.`}
                  {' '}Esses itens vendem bem, mas a margem é baixa e o tempo investido é alto — estão drenando sua energia sem retorno proporcional.
                  Considere aumentar o preço ou simplificar a produção.
                </AlertDescription>
              </Alert>
            )}

            {/* Breakeven Progress with Milestone Alerts */}
            {(() => {
              const custoFixoTotal = custosFixos.reduce((s, c) => s + (c.valor_mensal * c.percentual_rateio / 100), 0);
              if (custoFixoTotal <= 0 || mediaMargem <= 0) return null;
              const margemPctMedia = mediaMargem > 0 && produtos.length > 0
                ? produtos.reduce((s, p) => s + (p.margemContribuicao / (p.precoMedioVenda || 1)), 0) / produtos.length
                : 0;
              if (margemPctMedia <= 0) return null;
              const breakevenReais = custoFixoTotal / margemPctMedia;
              const faturamentoTotal = vendasFiltradas.reduce((s, v) => s + v.preco_venda * v.quantidade, 0);
              const progressoPct = Math.min((faturamentoTotal / breakevenReais) * 100, 100);

              const milestones = [
                { pct: 50, label: 'Meio caminho!', emoji: '🚀', msg: 'Você já cobriu metade dos custos fixos. Continue assim!' },
                { pct: 75, label: 'Quase lá!', emoji: '🔥', msg: 'Falta apenas 25% para cobrir todos os custos fixos!' },
                { pct: 100, label: 'Meta atingida!', emoji: '🎉', msg: 'Custos fixos cobertos! A partir daqui é lucro real!' },
              ];

              const reachedMilestones = milestones.filter(m => progressoPct >= m.pct);
              const nextMilestone = milestones.find(m => progressoPct < m.pct);

              return (
                <BreakevenCard
                  custoFixoTotal={custoFixoTotal}
                  breakevenReais={breakevenReais}
                  faturamentoTotal={faturamentoTotal}
                  progressoPct={progressoPct}
                  milestones={milestones}
                  reachedMilestones={reachedMilestones}
                  nextMilestone={nextMilestone}
                />
              );
            })()}

            {/* Strategy Cards */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ações Estratégicas
              </h2>
              {(['estrela', 'cavalo', 'quebracabeca', 'cao'] as Quadrante[]).map(q => {
                const cfg = QUADRANTE_CONFIG[q];
                const Icon = cfg.icon;
                const items = produtosPorQuadrante[q];
                const isExpanded = expandedQuadrante === q;

                return (
                  <Card key={q} className={`${cfg.borderClass} transition-all`}>
                    <CardHeader
                      className="pb-2 cursor-pointer"
                      onClick={() => setExpandedQuadrante(isExpanded ? null : q)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${cfg.textClass}`} />
                          {cfg.label}
                          <Badge variant="outline" className="ml-2">{items.length}</Badge>
                        </CardTitle>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <CardDescription className="text-xs">{cfg.acao}</CardDescription>
                    </CardHeader>
                    {isExpanded && items.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {items.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{p.nome}</span>
                                {q === 'cavalo' && p.tempoProducao && p.tempoProducao >= altoTempoProducao && (
                                  <Badge variant="outline" className="text-[10px] border-warning/50 text-warning gap-1">
                                    <Clock className="h-2.5 w-2.5" /> {p.tempoProducao}min
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{p.volumeLabel} vendidos</span>
                                <span className={p.margemContribuicao >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
                                  {formatarCusto(p.margemContribuicao)}/{p.rendimentoUnidade === 'g' ? 'g' : 'un'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                    {isExpanded && items.length === 0 && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">Nenhum produto nesta categoria.</p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Benchmarks */}
            <Card className="border-muted">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Produtos analisados</p>
                    <p className="font-bold text-lg">{produtos.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Média Volume</p>
                    <p className="font-bold text-lg">{mediaVolume.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Média Margem</p>
                    <p className="font-bold text-lg">{formatarCusto(mediaMargem)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
