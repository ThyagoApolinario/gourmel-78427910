import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  PawPrint, Plus, Minus, Trash2, ShoppingBag, CalendarIcon, Filter, Download,
  FileSpreadsheet, Scale, CreditCard, Star, AlertTriangle, Gift, BookOpen,
} from 'lucide-react';
import { exportVendasXlsx } from '@/lib/export-vendas';
import { format, subDays, subMonths, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calcCustoInsumosPorUnidade } from '@/lib/calc-custo-receita';
import { calcularKit, type FinanceConfig } from '@/lib/calc-kit';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CANAIS = ['Instagram', 'WhatsApp', 'Feira Pet', 'Direto'];

type PeriodoFiltro = '7d' | '30d' | 'custom';

interface MetodoPagamento {
  id: string;
  nome: string;
  taxa_percentual: number;
  is_padrao_precificacao: boolean;
  ativo: boolean;
}

export default function Vendas() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [tipoItem, setTipoItem] = useState<'receita' | 'kit'>('receita');
  const [receitaId, setReceitaId] = useState('');
  const [kitId, setKitId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState('');
  const [canal, setCanal] = useState('Direto');
  const [dataVenda, setDataVenda] = useState<Date>(new Date());
  const [metodoPagamentoId, setMetodoPagamentoId] = useState('');

  // Filter state
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('7d');
  const [filtroCanal, setFiltroCanal] = useState<string>('todos');
  const [customInicio, setCustomInicio] = useState<Date>(subDays(new Date(), 7));
  const [customFim, setCustomFim] = useState<Date>(new Date());

  const dateRange = useMemo(() => {
    const now = new Date();
    if (periodo === '7d') return { start: subDays(now, 7), end: now };
    if (periodo === '30d') return { start: subMonths(now, 1), end: now };
    return { start: customInicio, end: customFim };
  }, [periodo, customInicio, customFim]);

  // Receitas
  const { data: receitas = [] } = useQuery({
    queryKey: ['receitas-vendas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, rendimento_unidade')
        .eq('user_id', user!.id)
        .order('nome');
      if (error) throw error;
      return data as { id: string; nome: string; rendimento_unidade: string | null }[];
    },
    enabled: !!user,
  });

  // Métodos de pagamento ativos
  const { data: metodos = [] } = useQuery({
    queryKey: ['metodos_pagamento', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metodos_pagamento')
        .select('*')
        .eq('user_id', user!.id)
        .eq('ativo', true)
        .order('ordem');
      if (error) throw error;
      return data as MetodoPagamento[];
    },
    enabled: !!user,
  });

  // Auto-select método padrão na 1ª carga
  useMemo(() => {
    if (metodos.length > 0 && !metodoPagamentoId) {
      const padrao = metodos.find((m) => m.is_padrao_precificacao);
      setMetodoPagamentoId(padrao?.id ?? metodos[0].id);
    }
  }, [metodos, metodoPagamentoId]);

  const receitaSelecionada = receitas.find((r) => r.id === receitaId);
  const isVendaPorPeso = receitaSelecionada?.rendimento_unidade === 'g';

  // Vendas no período
  const { data: vendas = [] } = useQuery({
    queryKey: [
      'vendas-filtradas',
      user?.id,
      format(dateRange.start, 'yyyy-MM-dd'),
      format(dateRange.end, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*, receitas(nome)')
        .eq('user_id', user!.id)
        .gte('data_venda', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('data_venda', format(dateRange.end, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const vendasFiltradas = useMemo(() => {
    if (filtroCanal === 'todos') return vendas;
    return vendas.filter((v: any) => v.canal_venda === filtroCanal);
  }, [vendas, filtroCanal]);

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const totalHoje = vendas
    .filter((v: any) => v.data_venda === hoje)
    .reduce((sum: number, v: any) => sum + v.preco_venda * v.quantidade, 0);

  const totalPeriodo = vendasFiltradas.reduce(
    (sum: number, v: any) => sum + v.preco_venda * v.quantidade,
    0,
  );

  // Lucro líquido real do período (snapshot)
  const lucroRealPeriodo = vendasFiltradas.reduce(
    (sum: number, v: any) => sum + (Number(v.valor_liquido_real) || 0),
    0,
  );

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const total = vendasFiltradas
        .filter((v: any) => v.data_venda === dayStr)
        .reduce((sum: number, v: any) => sum + v.preco_venda * v.quantidade, 0);
      return { dia: format(day, 'dd/MM', { locale: ptBR }), total: Number(total.toFixed(2)) };
    });
  }, [vendasFiltradas, dateRange]);

  // Há vendas antigas sem método?
  const vendasSemMetodo = vendas.filter((v: any) => !v.metodo_pagamento_id).length;

  // Create venda — com snapshot
  const createMutation = useMutation({
    mutationFn: async () => {
      const valor = parseFloat(valorUnitario.replace(',', '.'));
      if (!receitaId || isNaN(valor) || valor <= 0) throw new Error('Preencha todos os campos');
      if (!metodoPagamentoId) throw new Error('Selecione o método de pagamento');

      const metodo = metodos.find((m) => m.id === metodoPagamentoId);
      if (!metodo) throw new Error('Método de pagamento inválido');

      // Snapshot do custo de insumos no momento da venda
      const custoUnitarioSnapshot = await calcCustoInsumosPorUnidade(receitaId);
      const custoTotalSnapshot = custoUnitarioSnapshot * quantidade;

      const { error } = await supabase.from('vendas').insert({
        user_id: user!.id,
        receita_id: receitaId,
        quantidade,
        preco_venda: valor,
        data_venda: format(dataVenda, 'yyyy-MM-dd'),
        canal_venda: canal,
        metodo_pagamento_id: metodo.id,
        metodo_pagamento_nome: metodo.nome,
        taxa_aplicada: metodo.taxa_percentual,
        custo_insumos_snapshot: custoTotalSnapshot,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-filtradas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Venda registrada! 🐾',
        description:
          profile === 'canine'
            ? 'Petisco vendido com sucesso! Mais saúde para os pets.'
            : 'Venda registrada com sucesso!',
      });
      setReceitaId('');
      setQuantidade(1);
      setValorUnitario('');
      setCanal('Direto');
      setDataVenda(new Date());
      // mantém método selecionado para registro rápido
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao registrar venda', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vendas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-filtradas'] });
      toast({ title: 'Venda removida' });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            {profile === 'canine' ? 'Registro de Vendas Pet' : 'Registro de Vendas'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {profile === 'canine'
              ? 'Registre cada venda rapidamente e alimente seu painel de inteligência 🐾'
              : 'Registre suas vendas e acompanhe seu faturamento'}
          </p>
        </div>

        {/* Aviso vendas antigas */}
        {vendasSemMetodo > 0 && (
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-xs">
              <strong>{vendasSemMetodo}</strong> venda(s) no período sem método de pagamento. Edite-as
              para que o lucro real seja calculado corretamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Daily Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total vendido hoje</span>
            <span className="text-2xl font-bold text-primary">
              R$ {totalHoje.toFixed(2).replace('.', ',')}
            </span>
          </CardContent>
        </Card>

        {/* Quick Entry Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-accent" />
              Registro Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{profile === 'canine' ? 'Produto Pet' : 'Produto'}</Label>
              <Select value={receitaId} onValueChange={setReceitaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto..." />
                </SelectTrigger>
                <SelectContent>
                  {receitas.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Quantidade {isVendaPorPeso && <Scale className="h-3.5 w-3.5 text-muted-foreground" />}
                </Label>
                {isVendaPorPeso ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                      className="text-center"
                      placeholder="Ex: 0.5"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">g</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setQuantidade(quantidade + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valor unitário (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                />
              </div>
            </div>

            {/* Método de Pagamento — segmented buttons */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Método de Pagamento
                <span className="text-destructive">*</span>
              </Label>
              {metodos.length === 0 ? (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">
                    Nenhum método ativo. Cadastre em Configurações.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {metodos.map((m) => {
                    const selected = metodoPagamentoId === m.id;
                    return (
                      <Button
                        key={m.id}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        className={cn(
                          'h-auto py-2.5 px-3 flex flex-col items-center justify-center gap-0.5 text-xs sm:text-sm relative',
                          selected && 'ring-2 ring-primary/30',
                        )}
                        onClick={() => setMetodoPagamentoId(m.id)}
                      >
                        {m.is_padrao_precificacao && (
                          <Star className="h-2.5 w-2.5 absolute top-1 right-1 text-accent fill-accent" />
                        )}
                        <span className="font-medium leading-tight">{m.nome}</span>
                        <span className="text-[10px] opacity-80">{m.taxa_percentual}%</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal de Venda</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANAIS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data da venda</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dataVenda && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dataVenda, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataVenda}
                      onSelect={(d) => d && setDataVenda(d)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              className="w-full gap-2 mt-2"
              size="lg"
              disabled={!receitaId || !valorUnitario || !metodoPagamentoId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <PawPrint className="h-5 w-5" />
              Confirmar Venda
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-accent" />
              Filtros e Evolução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Último mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={filtroCanal} onValueChange={setFiltroCanal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os canais</SelectItem>
                    {CANAIS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {periodo === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>De</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(customInicio, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customInicio}
                        onSelect={(d) => d && setCustomInicio(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Até</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(customFim, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customFim}
                        onSelect={(d) => d && setCustomFim(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Period summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Faturamento Bruto
                </p>
                <p className="text-lg font-bold text-primary">
                  R$ {totalPeriodo.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {vendasFiltradas.length} venda(s)
                </p>
              </div>
              <div className="bg-success/10 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Lucro Real (líq.)
                </p>
                <p
                  className={`text-lg font-bold ${
                    lucroRealPeriodo >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  R$ {lucroRealPeriodo.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-[10px] text-muted-foreground">após taxas e custos</p>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} interval={periodo === '30d' ? 4 : 0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} width={60} />
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toFixed(2).replace('.', ',')}`,
                        'Faturamento',
                      ]}
                      labelFormatter={(label) => `Dia ${label}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Histórico de vendas
              <Badge variant="secondary" className="text-xs">
                {vendasFiltradas.length}
              </Badge>
            </h2>
            {vendasFiltradas.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const header =
                      'Produto;Quantidade;Valor Unitário;Total;Método;Taxa%;Líquido Real;Canal;Data\n';
                    const rows = vendasFiltradas
                      .map(
                        (v: any) =>
                          `${v.receitas?.nome || 'Removido'};${v.quantidade};${Number(v.preco_venda)
                            .toFixed(2)
                            .replace('.', ',')};${(v.preco_venda * v.quantidade)
                            .toFixed(2)
                            .replace('.', ',')};${v.metodo_pagamento_nome || '—'};${
                            v.taxa_aplicada ?? '—'
                          };${
                            v.valor_liquido_real != null
                              ? Number(v.valor_liquido_real).toFixed(2).replace('.', ',')
                              : '—'
                          };${v.canal_venda || 'Direto'};${format(
                            new Date(v.data_venda + 'T12:00:00'),
                            'dd/MM/yyyy',
                          )}`,
                      )
                      .join('\n');
                    const blob = new Blob(['\uFEFF' + header + rows], {
                      type: 'text/csv;charset=utf-8;',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast({ title: 'CSV exportado! 📄' });
                  }}
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={async () => {
                    const periodoLabel =
                      periodo === '7d'
                        ? 'Últimos 7 dias'
                        : periodo === '30d'
                          ? 'Último mês'
                          : `${format(customInicio, 'dd/MM')} a ${format(customFim, 'dd/MM')}`;
                    await exportVendasXlsx(
                      vendasFiltradas.map((v: any) => ({
                        produto: v.receitas?.nome || 'Removido',
                        quantidade: v.quantidade,
                        valorUnitario: Number(v.preco_venda),
                        total: v.preco_venda * v.quantidade,
                        canal: v.canal_venda || 'Direto',
                        data: format(new Date(v.data_venda + 'T12:00:00'), 'dd/MM/yyyy'),
                      })),
                      periodoLabel,
                    );
                    toast({ title: 'Planilha exportada! 📊' });
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            )}
          </div>

          {vendasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma venda no período selecionado 🐾
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {vendasFiltradas.map((v: any) => (
                <Card key={v.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {v.receitas?.nome || 'Produto removido'}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>
                          {v.quantidade}x R$ {Number(v.preco_venda).toFixed(2).replace('.', ',')}
                        </span>
                        <Separator orientation="vertical" className="h-3" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {v.canal_venda || 'Direto'}
                        </Badge>
                        {v.metodo_pagamento_nome ? (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 gap-0.5"
                            >
                              <CreditCard className="h-2.5 w-2.5" />
                              {v.metodo_pagamento_nome} ({v.taxa_aplicada}%)
                            </Badge>
                          </>
                        ) : (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-warning/40 text-warning"
                            >
                              sem método
                            </Badge>
                          </>
                        )}
                        <Separator orientation="vertical" className="h-3" />
                        <span>{format(new Date(v.data_venda + 'T12:00:00'), 'dd/MM')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-primary whitespace-nowrap text-sm">
                          R$ {(v.preco_venda * v.quantidade).toFixed(2).replace('.', ',')}
                        </div>
                        {v.valor_liquido_real != null && (
                          <div
                            className={`text-[10px] whitespace-nowrap ${
                              Number(v.valor_liquido_real) >= 0 ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            líq. R${' '}
                            {Number(v.valor_liquido_real).toFixed(2).replace('.', ',')}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive"
                        onClick={() => deleteMutation.mutate(v.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
