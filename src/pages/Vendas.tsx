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
import { PawPrint, Plus, Minus, Trash2, ShoppingBag, CalendarIcon, Filter, TrendingUp, Download } from 'lucide-react';
import { format, subDays, subMonths, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CANAIS = ['Instagram', 'WhatsApp', 'Feira Pet', 'Direto'];

type PeriodoFiltro = '7d' | '30d' | 'custom';

export default function Vendas() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [receitaId, setReceitaId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState('');
  const [canal, setCanal] = useState('Direto');
  const [dataVenda, setDataVenda] = useState<Date>(new Date());

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

  // Fetch receitas for dropdown
  const { data: receitas = [] } = useQuery({
    queryKey: ['receitas-vendas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome')
        .eq('user_id', user!.id)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch ALL vendas within the date range
  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas-filtradas', user?.id, format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
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

  // Apply canal filter
  const vendasFiltradas = useMemo(() => {
    if (filtroCanal === 'todos') return vendas;
    return vendas.filter((v: any) => v.canal_venda === filtroCanal);
  }, [vendas, filtroCanal]);

  // Daily total (today)
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const totalHoje = vendas
    .filter((v: any) => v.data_venda === hoje)
    .reduce((sum: number, v: any) => sum + v.preco_venda * v.quantidade, 0);

  // Period total
  const totalPeriodo = vendasFiltradas
    .reduce((sum: number, v: any) => sum + v.preco_venda * v.quantidade, 0);

  // Chart data: daily revenue
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const total = vendasFiltradas
        .filter((v: any) => v.data_venda === dayStr)
        .reduce((sum: number, v: any) => sum + v.preco_venda * v.quantidade, 0);
      return {
        dia: format(day, 'dd/MM', { locale: ptBR }),
        total: Number(total.toFixed(2)),
      };
    });
  }, [vendasFiltradas, dateRange]);

  // Create venda
  const createMutation = useMutation({
    mutationFn: async () => {
      const valor = parseFloat(valorUnitario.replace(',', '.'));
      if (!receitaId || isNaN(valor) || valor <= 0) throw new Error('Preencha todos os campos');
      const { error } = await supabase.from('vendas').insert({
        user_id: user!.id,
        receita_id: receitaId,
        quantidade,
        preco_venda: valor,
        data_venda: format(dataVenda, 'yyyy-MM-dd'),
        canal_venda: canal,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-filtradas'] });
      toast({
        title: 'Venda registrada! 🐾',
        description: profile === 'canine'
          ? 'Petisco vendido com sucesso! Mais saúde para os pets.'
          : 'Venda registrada com sucesso!',
      });
      setReceitaId('');
      setQuantidade(1);
      setValorUnitario('');
      setCanal('Direto');
      setDataVenda(new Date());
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao registrar venda', description: err.message, variant: 'destructive' });
    },
  });

  // Delete venda
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
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0"
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input type="number" min={1} value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center" />
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0"
                    onClick={() => setQuantidade(quantidade + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor unitário (R$)</Label>
                <Input placeholder="0,00" value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal de Venda</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CANAIS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data da venda</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal',
                      !dataVenda && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dataVenda, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataVenda}
                      onSelect={(d) => d && setDataVenda(d)} initialFocus
                      className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button className="w-full gap-2 mt-2" size="lg"
              disabled={!receitaId || !valorUnitario || createMutation.isPending}
              onClick={() => createMutation.mutate()}>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os canais</SelectItem>
                    {CANAIS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
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
                      <Calendar mode="single" selected={customInicio}
                        onSelect={(d) => d && setCustomInicio(d)} initialFocus
                        className="p-3 pointer-events-auto" />
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
                      <Calendar mode="single" selected={customFim}
                        onSelect={(d) => d && setCustomFim(d)} initialFocus
                        className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Period summary */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{vendasFiltradas.length}</span> vendas no período
              </div>
              <div className="text-lg font-bold text-primary">
                R$ {totalPeriodo.toFixed(2).replace('.', ',')}
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
                      formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Faturamento']}
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
              <Badge variant="secondary" className="text-xs">{vendasFiltradas.length}</Badge>
            </h2>
            {vendasFiltradas.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                const header = 'Produto;Quantidade;Valor Unitário;Total;Canal;Data\n';
                const rows = vendasFiltradas.map((v: any) =>
                  `${v.receitas?.nome || 'Removido'};${v.quantidade};${Number(v.preco_venda).toFixed(2).replace('.', ',')};${(v.preco_venda * v.quantidade).toFixed(2).replace('.', ',')};${v.canal_venda || 'Direto'};${format(new Date(v.data_venda + 'T12:00:00'), 'dd/MM/yyyy')}`
                ).join('\n');
                const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: 'CSV exportado! 📄' });
              }}>
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
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
                        <span>{v.quantidade}x R$ {Number(v.preco_venda).toFixed(2).replace('.', ',')}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{v.canal_venda || 'Direto'}</Badge>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{format(new Date(v.data_venda + 'T12:00:00'), 'dd/MM')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary whitespace-nowrap">
                        R$ {(v.preco_venda * v.quantidade).toFixed(2).replace('.', ',')}
                      </span>
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive"
                        onClick={() => deleteMutation.mutate(v.id)}>
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
