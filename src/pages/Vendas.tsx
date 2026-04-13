import { useState } from 'react';
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
import { PawPrint, Plus, Minus, Trash2, ShoppingBag, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const CANAIS = ['Instagram', 'WhatsApp', 'Feira Pet', 'Direto'];

export default function Vendas() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [receitaId, setReceitaId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState('');
  const [canal, setCanal] = useState('Direto');
  const [dataVenda, setDataVenda] = useState<Date>(new Date());

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

  // Fetch recent vendas
  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas-recentes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*, receitas(nome)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Daily total
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const totalHoje = vendas
    .filter((v: any) => v.data_venda === hoje)
    .reduce((sum: number, v: any) => sum + v.preco_venda * v.quantidade, 0);

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
      queryClient.invalidateQueries({ queryKey: ['vendas-recentes'] });
      toast({
        title: 'Venda registrada! 🐾',
        description: profile === 'canine'
          ? 'Petisco vendido com sucesso! Mais saúde para os pets.'
          : 'Venda registrada com sucesso!',
      });
      // Reset form
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
      queryClient.invalidateQueries({ queryKey: ['vendas-recentes'] });
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
            {/* Produto */}
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

            {/* Quantidade + Valor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
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

            {/* Canal + Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal de Venda</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dataVenda && 'text-muted-foreground'
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
              disabled={!receitaId || !valorUnitario || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <PawPrint className="h-5 w-5" />
              Confirmar Venda
            </Button>
          </CardContent>
        </Card>

        {/* Sales Feed */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Últimas vendas
            <Badge variant="secondary" className="text-xs">{vendas.length}</Badge>
          </h2>

          {vendas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma venda registrada ainda. Comece acima! 🐾
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {vendas.map((v: any) => (
                <Card key={v.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {v.receitas?.nome || 'Produto removido'}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{v.quantidade}x R$ {Number(v.preco_venda).toFixed(2).replace('.', ',')}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{v.canal_venda || 'Direto'}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{format(new Date(v.data_venda + 'T12:00:00'), 'dd/MM')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary whitespace-nowrap">
                        R$ {(v.preco_venda * v.quantidade).toFixed(2).replace('.', ',')}
                      </span>
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
