import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings, Clock, DollarSign, Calculator } from 'lucide-react';

interface ConfigFinanceira {
  id: string;
  taxa_cartao: number;
  impostos: number;
  margem_desejada: number;
  pro_labore: number;
  horas_mes: number;
}

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [taxaCartao, setTaxaCartao] = useState('5');
  const [impostos, setImpostos] = useState('5');
  const [margemDesejada, setMargemDesejada] = useState('30');
  const [proLabore, setProLabore] = useState('3000');
  const [horasMes, setHorasMes] = useState('160');

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracoes_financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_financeiras')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as ConfigFinanceira | null;
    },
  });

  useEffect(() => {
    if (config) {
      setTaxaCartao(String(config.taxa_cartao));
      setImpostos(String(config.impostos));
      setMargemDesejada(String(config.margem_desejada));
      setProLabore(String(config.pro_labore));
      setHorasMes(String(config.horas_mes));
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        taxa_cartao: parseFloat(taxaCartao) || 0,
        impostos: parseFloat(impostos) || 0,
        margem_desejada: parseFloat(margemDesejada) || 0,
        pro_labore: parseFloat(proLabore) || 0,
        horas_mes: parseFloat(horasMes) || 1,
      };

      if (config) {
        const { error } = await supabase
          .from('configuracoes_financeiras')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracoes_financeiras')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes_financeiras'] });
      toast({ title: 'Configurações salvas!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const horasNum = parseFloat(horasMes) || 1;
  const proLaboreNum = parseFloat(proLabore) || 0;
  const custoMinuto = proLaboreNum / (horasNum * 60);
  const custoHora = proLaboreNum / horasNum;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações Financeiras</h1>
          <p className="text-muted-foreground text-sm">Defina as variáveis do seu negócio para precificação</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
          {/* Taxas e Impostos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Taxas e Impostos
              </CardTitle>
              <CardDescription>Percentuais que incidem sobre o preço de venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taxa de Cartão/Plataforma (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxaCartao}
                    onChange={e => setTaxaCartao(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Ex: 5% por venda via iFood/cartão</p>
                </div>
                <div className="space-y-2">
                  <Label>Impostos - MEI/Simples (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={impostos}
                    onChange={e => setImpostos(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Ex: 5% para MEI</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Margem de Contribuição Desejada (%)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="90"
                  value={margemDesejada}
                  onChange={e => setMargemDesejada(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Alvo de lucro bruto após custos variáveis</p>
              </div>
            </CardContent>
          </Card>

          {/* Mão de Obra */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Custo de Mão de Obra
              </CardTitle>
              <CardDescription>Calcule o valor do seu tempo de trabalho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pró-labore Desejado (R$)</Label>
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={proLabore}
                    onChange={e => setProLabore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas Trabalhadas/Mês</Label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    max="744"
                    value={horasMes}
                    onChange={e => setHorasMes(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Valor do Seu Tempo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-card">
                      <p className="text-xs text-muted-foreground">Custo por Hora</p>
                      <p className="font-bold text-xl text-primary">
                        R$ {custoHora.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-card">
                      <p className="text-xs text-muted-foreground">Custo por Minuto</p>
                      <p className="font-bold text-xl text-primary">
                        R$ {custoMinuto.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
