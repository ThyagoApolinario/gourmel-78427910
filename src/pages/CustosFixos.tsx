import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useProfile } from '@/hooks/useProfile';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  Wallet, Plus, Trash2, Edit2, Target, Info, Home, TrendingUp,
  Lightbulb, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatarCusto } from '@/lib/smart-units';
import type { Database } from '@/integrations/supabase/types';

type CategoriaCusto = Database['public']['Enums']['categoria_custo_fixo'];

const CATEGORIA_LABELS: Record<CategoriaCusto, string> = {
  aluguel_cozinha: 'Aluguel / Cozinha',
  energia_agua: 'Energia / Água',
  internet: 'Internet',
  marketing: 'Marketing',
  pro_labore: 'Pró-labore Fixa',
  ferramentas_software: 'Ferramentas / Software',
  outros: 'Outros',
};

const CATEGORIA_COLORS: Record<CategoriaCusto, string> = {
  aluguel_cozinha: '#4A7C59',
  energia_agua: '#D4A373',
  internet: '#6B8F71',
  marketing: '#E1306C',
  pro_labore: '#C17F59',
  ferramentas_software: '#7BA38C',
  outros: '#A0A0A0',
};

interface CustoFixo {
  id: string;
  nome: string;
  categoria: CategoriaCusto;
  valor_mensal: number;
  percentual_rateio: number;
  descricao: string | null;
}

export default function CustosFixos() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    categoria: 'outros' as CategoriaCusto,
    valor_mensal: '',
    percentual_rateio: '100',
    descricao: '',
  });

  // Fetch custos fixos
  const { data: custos = [] } = useQuery({
    queryKey: ['custos_fixos', user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('custos_fixos')
        .select('*')
        .order('categoria', { ascending: true });
      if (!isAdmin) {
        query = query.eq('user_id', user!.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as CustoFixo[];
    },
    enabled: !!user,
  });

  // Fetch vendas for breakeven calculation
  const { data: vendasMes = [] } = useQuery({
    queryKey: ['vendas_mes_atual', user?.id],
    queryFn: async () => {
      const now = new Date();
      const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data, error } = await supabase
        .from('vendas')
        .select('preco_venda, quantidade')
        .eq('user_id', user!.id)
        .gte('data_venda', inicioMes);
      if (error) throw error;
      return data as { preco_venda: number; quantidade: number }[];
    },
    enabled: !!user,
  });

  // Fetch composicoes for margin calculation
  const { data: composicoes = [] } = useQuery({
    queryKey: ['composicao_custos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('composicao_receita')
        .select('receita_id, quantidade, fator_rendimento, insumo:insumos(custo_unitario)');
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: receitasData = [] } = useQuery({
    queryKey: ['receitas_custos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('receitas').select('id, rendimento_quantidade');
      if (error) throw error;
      return data as { id: string; rendimento_quantidade: number | null }[];
    },
  });

  const { data: vendasAll = [] } = useQuery({
    queryKey: ['vendas_all_custos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('receita_id, preco_venda, quantidade');
      if (error) throw error;
      return data as { receita_id: string; preco_venda: number; quantidade: number }[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        nome: form.nome,
        categoria: form.categoria,
        valor_mensal: parseFloat(form.valor_mensal) || 0,
        percentual_rateio: parseFloat(form.percentual_rateio) || 100,
        descricao: form.descricao || null,
      };
      if (editingId) {
        const { error } = await supabase.from('custos_fixos').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('custos_fixos').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos_fixos'] });
      toast.success(editingId ? 'Despesa atualizada! 📝' : 'Despesa registrada! ✅');
      resetForm();
    },
    onError: () => toast.error('Erro ao salvar despesa'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custos_fixos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos_fixos'] });
      toast.success('Despesa removida');
    },
  });

  function resetForm() {
    setForm({ nome: '', categoria: 'outros', valor_mensal: '', percentual_rateio: '100', descricao: '' });
    setEditingId(null);
    setDialogOpen(false);
  }

  function openEdit(c: CustoFixo) {
    setForm({
      nome: c.nome,
      categoria: c.categoria,
      valor_mensal: c.valor_mensal.toString(),
      percentual_rateio: c.percentual_rateio.toString(),
      descricao: c.descricao || '',
    });
    setEditingId(c.id);
    setDialogOpen(true);
  }

  // Calculate totals
  const custoFixoTotal = useMemo(() => {
    return custos.reduce((s, c) => s + (c.valor_mensal * c.percentual_rateio / 100), 0);
  }, [custos]);

  // Pie chart data by category
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of custos) {
      const val = c.valor_mensal * c.percentual_rateio / 100;
      map[c.categoria] = (map[c.categoria] || 0) + val;
    }
    return Object.entries(map)
      .map(([key, value]) => ({
        name: CATEGORIA_LABELS[key as CategoriaCusto],
        value: Number(value.toFixed(2)),
        categoria: key as CategoriaCusto,
      }))
      .sort((a, b) => b.value - a.value);
  }, [custos]);

  // Breakeven calculation
  const breakeven = useMemo(() => {
    // Margem de contribuição média = (preço médio - custo médio) / preço médio
    const custosPorReceita: Record<string, number> = {};
    for (const comp of composicoes) {
      const custoUn = comp.insumo?.custo_unitario ?? 0;
      const fator = comp.fator_rendimento || 1;
      custosPorReceita[comp.receita_id] = (custosPorReceita[comp.receita_id] || 0) + (comp.quantidade * custoUn / fator);
    }

    // Custo por unidade
    const custoPorUnidade: Record<string, number> = {};
    for (const r of receitasData) {
      const custoTotal = custosPorReceita[r.id] || 0;
      custoPorUnidade[r.id] = r.rendimento_quantidade ? custoTotal / r.rendimento_quantidade : custoTotal;
    }

    // Margem média ponderada
    let totalReceita = 0;
    let totalCusto = 0;
    let totalQtd = 0;
    for (const v of vendasAll) {
      const custo = custoPorUnidade[v.receita_id] || 0;
      totalReceita += v.preco_venda * v.quantidade;
      totalCusto += custo * v.quantidade;
      totalQtd += v.quantidade;
    }

    const margemPct = totalReceita > 0 ? (totalReceita - totalCusto) / totalReceita : 0;
    const precoMedio = totalQtd > 0 ? totalReceita / totalQtd : 0;
    const margemMediaUnidade = totalQtd > 0 ? (totalReceita - totalCusto) / totalQtd : 0;

    const breakevenReais = margemPct > 0 ? custoFixoTotal / margemPct : 0;
    const breakevenUnidades = margemMediaUnidade > 0 ? Math.ceil(custoFixoTotal / margemMediaUnidade) : 0;

    // Current month progress
    const faturamentoMes = vendasMes.reduce((s, v) => s + v.preco_venda * v.quantidade, 0);
    const progressoPct = breakevenReais > 0 ? Math.min((faturamentoMes / breakevenReais) * 100, 100) : 0;

    return { margemPct, breakevenReais, breakevenUnidades, faturamentoMes, progressoPct, precoMedio };
  }, [composicoes, receitasData, vendasAll, vendasMes, custoFixoTotal]);

  const showRateioHint = custos.some(c =>
    (c.categoria === 'energia_agua' || c.categoria === 'aluguel_cozinha') && c.percentual_rateio === 100
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Custos Fixos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile === 'canine'
                ? 'Gerencie o investimento mensal para operar sua confeitaria pet 🐾'
                : 'Gerencie o investimento mensal para operar'}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Despesa' : 'Nova Despesa Fixa'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div>
                  <Label>Nome da Despesa</Label>
                  <Input
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Ex: Conta de luz"
                    required
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v as CategoriaCusto }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Valor Mensal (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.valor_mensal}
                      onChange={e => setForm(f => ({ ...f, valor_mensal: e.target.value }))}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">
                      Rateio (%)
                      <span className="text-muted-foreground text-[10px]">cozinha domiciliar</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={form.percentual_rateio}
                      onChange={e => setForm(f => ({ ...f, percentual_rateio: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Observações sobre esta despesa..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {editingId ? 'Salvar Alterações' : 'Adicionar Despesa'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI: Total */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  Investimento Mensal para Operar
                </p>
                <p className="text-3xl font-bold mt-1">
                  R$ {custoFixoTotal.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {custos.length} despesa{custos.length !== 1 ? 's' : ''} fixa{custos.length !== 1 ? 's' : ''} cadastrada{custos.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Wallet className="h-12 w-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* Rateio Hint */}
        {showRateioHint && (
          <Alert className="border-accent/30 bg-accent/5">
            <Home className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm">
              <strong>Dica de Cozinha Domiciliar:</strong> Como você trabalha em casa, cadastre apenas a porcentagem
              das contas de luz e água que corresponde ao uso do negócio (geralmente 20-40%).
              Use o campo "Rateio %" ao editar a despesa.
            </AlertDescription>
          </Alert>
        )}

        {/* Breakeven Card */}
        {custoFixoTotal > 0 && (
          <Card className="border-accent/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Ponto de Equilíbrio (Breakeven)
              </CardTitle>
              <CardDescription>
                Meta mínima de vendas para cobrir todos os custos fixos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {breakeven.margemPct > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Em Reais</p>
                      <p className="text-lg font-bold">
                        R$ {breakeven.breakevenReais.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        vendas/mês para cobrir custos
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Em Unidades</p>
                      <p className="text-lg font-bold">{breakeven.breakevenUnidades} un</p>
                      <p className="text-[10px] text-muted-foreground">
                        ~R$ {breakeven.precoMedio.toFixed(2).replace('.', ',')} preço médio
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso este mês</span>
                      <span className="font-medium">
                        R$ {breakeven.faturamentoMes.toFixed(2).replace('.', ',')} / R$ {breakeven.breakevenReais.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <Progress value={breakeven.progressoPct} className="h-3" />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {breakeven.progressoPct >= 100
                        ? '🎉 Parabéns! Você já cobriu os custos fixos — agora é lucro real!'
                        : `Falta ${(100 - breakeven.progressoPct).toFixed(0)}% para cobrir os custos fixos`}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Margem de contribuição média:</strong>{' '}
                        {(breakeven.margemPct * 100).toFixed(1).replace('.', ',')}%.
                        Isso significa que a cada R$ 100 em vendas, R$ {(breakeven.margemPct * 100).toFixed(0)} cobrem custos fixos e lucro.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Cadastre receitas com custos e registre vendas para calcular o ponto de equilíbrio.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pie Chart + Expenses List */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Composição dos Custos</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Nenhuma despesa cadastrada
                </p>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={40}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        style={{ fontSize: 9 }}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={CATEGORIA_COLORS[entry.categoria]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Despesas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {custos.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Clique em "Nova Despesa" para começar
                </p>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {custos.map(c => {
                    const valorEfetivo = c.valor_mensal * c.percentual_rateio / 100;
                    return (
                      <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: CATEGORIA_COLORS[c.categoria] }}
                            />
                            <p className="text-sm font-medium truncate">{c.nome}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 ml-[18px]">
                            <span className="text-[10px] text-muted-foreground">
                              {CATEGORIA_LABELS[c.categoria]}
                            </span>
                            {c.percentual_rateio < 100 && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {c.percentual_rateio}% rateio
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              R$ {valorEfetivo.toFixed(2).replace('.', ',')}
                            </p>
                            {c.percentual_rateio < 100 && (
                              <p className="text-[9px] text-muted-foreground line-through">
                                R$ {c.valor_mensal.toFixed(2).replace('.', ',')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteMutation.mutate(c.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
