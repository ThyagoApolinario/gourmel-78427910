import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatarCusto } from '@/lib/smart-units';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CalendarRange, Trophy, TrendingUp, ShoppingBag, PawPrint } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CANAL_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  WhatsApp: '#25D366',
  'Feira Pet': '#D4A373',
  Direto: '#4A7C59',
};

function buildMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i);
    options.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, "MMMM 'de' yyyy", { locale: ptBR }),
    });
  }
  return options;
}

export default function RelatorioMensal() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const meses = useMemo(buildMonthOptions, []);
  const [mesSelecionado, setMesSelecionado] = useState(meses[0].value);

  const inicioMes = startOfMonth(new Date(mesSelecionado + '-01'));
  const fimMes = endOfMonth(inicioMes);

  const { data: vendas = [] } = useQuery({
    queryKey: ['relatorio-mensal', user?.id, mesSelecionado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*, receitas(nome)')
        .eq('user_id', user!.id)
        .gte('data_venda', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data_venda', format(fimMes, 'yyyy-MM-dd'))
        .order('data_venda', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // KPIs
  const totalFaturamento = vendas.reduce((s, v) => s + v.preco_venda * v.quantidade, 0);
  const totalUnidades = vendas.reduce((s, v) => s + v.quantidade, 0);
  const ticketMedio = vendas.length > 0 ? totalFaturamento / vendas.length : 0;
  const diasComVenda = new Set(vendas.map((v: any) => v.data_venda)).size;

  // Daily chart
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: inicioMes, end: fimMes });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const total = vendas
        .filter((v: any) => v.data_venda === dayStr)
        .reduce((s: number, v: any) => s + v.preco_venda * v.quantidade, 0);
      return { dia: format(day, 'dd'), total: Number(total.toFixed(2)) };
    });
  }, [vendas, inicioMes, fimMes]);

  // By channel
  const canalData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of vendas) {
      const canal = v.canal_venda || 'Direto';
      map[canal] = (map[canal] || 0) + v.preco_venda * v.quantidade;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [vendas]);

  // Product ranking
  const ranking = useMemo(() => {
    const map: Record<string, { nome: string; qtd: number; receita: number }> = {};
    for (const v of vendas) {
      const id = v.receita_id;
      if (!map[id]) map[id] = { nome: v.receitas?.nome || 'Removido', qtd: 0, receita: 0 };
      map[id].qtd += v.quantidade;
      map[id].receita += v.preco_venda * v.quantidade;
    }
    return Object.values(map).sort((a, b) => b.qtd - a.qtd);
  }, [vendas]);

  const mesLabel = meses.find(m => m.value === mesSelecionado)?.label || mesSelecionado;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarRange className="h-6 w-6 text-primary" />
              Relatório Mensal
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile === 'canine' ? 'Análise completa das suas vendas pet 🐾' : 'Análise completa de vendas'}
            </p>
          </div>
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-56 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map(m => (
                <SelectItem key={m.value} value={m.value} className="capitalize">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Faturamento', value: `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`, icon: TrendingUp },
            { label: 'Unidades', value: totalUnidades.toString(), icon: ShoppingBag },
            { label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`, icon: PawPrint },
            { label: 'Dias com venda', value: `${diasComVenda}/${getDaysInMonth(inicioMes)}`, icon: CalendarRange },
          ].map(kpi => (
            <Card key={kpi.label} className="border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Faturamento Diário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} width={55} />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toFixed(2).replace('.', ',')}`, 'Faturamento']}
                    labelFormatter={l => `Dia ${l}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel + Ranking side by side */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Channel Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vendas por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              {canalData.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Sem vendas neste mês</p>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={canalData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={40}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        style={{ fontSize: 10 }}
                      >
                        {canalData.map((entry, i) => (
                          <Cell key={i} fill={CANAL_COLORS[entry.name] || `hsl(${i * 90}, 50%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Ranking */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" />
                Ranking de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Sem vendas neste mês</p>
              ) : (
                <div className="space-y-2">
                  {ranking.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm font-bold w-6 text-center ${
                          i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'
                        }`}>
                          {i + 1}º
                        </span>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[140px]">{p.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{p.qtd} un vendidas</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold">
                        R$ {p.receita.toFixed(2).replace('.', ',')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
