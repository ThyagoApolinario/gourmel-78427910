import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, Target, DollarSign } from 'lucide-react';
import { formatarCusto } from '@/lib/smart-units';

interface ConfigFinanceira {
  taxa_cartao: number;
  impostos: number;
  margem_desejada: number;
  pro_labore: number;
  horas_mes: number;
}

interface PrecificacaoCardProps {
  custoInsumos: number;
  custoEmbalagens: number;
  tempoProducao: number | null;
  rendimentoQuantidade: number | null;
}

export function PrecificacaoCard({
  custoInsumos,
  custoEmbalagens,
  tempoProducao,
  rendimentoQuantidade,
}: PrecificacaoCardProps) {
  const { data: config } = useQuery({
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

  const defaultMargem = config?.margem_desejada ?? 30;
  const [margemSlider, setMargemSlider] = useState<number | null>(null);
  const margem = margemSlider ?? defaultMargem;

  // Recalculate when config loads
  const taxaCartao = config?.taxa_cartao ?? 5;
  const impostos = config?.impostos ?? 5;
  const custoMinuto = config ? config.pro_labore / (config.horas_mes * 60) : 0;

  const custoMaoDeObra = tempoProducao ? tempoProducao * custoMinuto : 0;
  const custoVariavelTotal = custoInsumos + custoEmbalagens + custoMaoDeObra;

  const totalPercentuais = (taxaCartao + impostos + margem) / 100;

  const isMargemCritica = totalPercentuais >= 1;

  const precoSugerido = useMemo(() => {
    if (isMargemCritica || totalPercentuais >= 1) return null;
    return custoVariavelTotal / (1 - totalPercentuais);
  }, [custoVariavelTotal, totalPercentuais, isMargemCritica]);

  const precoSugeridoPorUnidade = precoSugerido && rendimentoQuantidade
    ? precoSugerido / rendimentoQuantidade
    : null;

  const lucroLiquidoPorUnidade = precoSugeridoPorUnidade && rendimentoQuantidade
    ? precoSugeridoPorUnidade - (custoVariavelTotal / rendimentoQuantidade)
      - (precoSugeridoPorUnidade * (taxaCartao + impostos) / 100)
    : null;

  const pontoEquilibrio = precoSugeridoPorUnidade && precoSugeridoPorUnidade > 0
    ? custoVariavelTotal / precoSugeridoPorUnidade
    : null;

  if (!config) {
    return (
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            ⚙️ Configure suas <strong>Configurações Financeiras</strong> no menu lateral para ativar a precificação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Motor de Precificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground">Insumos</p>
            <p className="font-semibold text-sm">{formatarCusto(custoInsumos)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground">Embalagens</p>
            <p className="font-semibold text-sm">{formatarCusto(custoEmbalagens)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground">Mão de Obra</p>
            <p className="font-semibold text-sm">
              {tempoProducao ? formatarCusto(custoMaoDeObra) : '—'}
            </p>
            {tempoProducao && (
              <p className="text-[10px] text-muted-foreground">{tempoProducao} min</p>
            )}
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <p className="text-[10px] text-muted-foreground">Custo Total</p>
            <p className="font-bold text-sm text-primary">{formatarCusto(custoVariavelTotal)}</p>
          </div>
        </div>

        {/* Margin slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Margem de Contribuição</Label>
            <Badge variant="outline" className="font-mono">{margem.toFixed(0)}%</Badge>
          </div>
          <Slider
            value={[margem]}
            onValueChange={([v]) => setMargemSlider(v)}
            min={10}
            max={80}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>10%</span>
            <span className="text-xs">Taxas: {taxaCartao}% + Imp: {impostos}% + Margem: {margem.toFixed(0)}% = {(totalPercentuais * 100).toFixed(0)}%</span>
            <span>80%</span>
          </div>
        </div>

        {/* Critical alert */}
        {isMargemCritica && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Margem crítica!</strong> A soma de taxas + impostos + margem é ≥ 100%.
              Reduza a margem ou revise as taxas.
            </AlertDescription>
          </Alert>
        )}

        {/* Price result */}
        {!isMargemCritica && precoSugerido !== null && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <DollarSign className="h-3 w-3" /> Preço Total
                  </p>
                  <p className="font-bold text-xl text-success">{formatarCusto(precoSugerido)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Preço/Unidade</p>
                  <p className="font-bold text-lg">
                    {precoSugeridoPorUnidade ? formatarCusto(precoSugeridoPorUnidade) : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Target className="h-3 w-3" /> Ponto Equilíbrio
                  </p>
                  <p className="font-bold text-lg">
                    {pontoEquilibrio ? `${pontoEquilibrio.toFixed(1)} un` : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Lucro/Unidade</p>
                  <p className={`font-bold text-lg ${lucroLiquidoPorUnidade && lucroLiquidoPorUnidade > 0 ? 'text-success' : 'text-destructive'}`}>
                    {lucroLiquidoPorUnidade ? formatarCusto(lucroLiquidoPorUnidade) : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formula explanation */}
        <p className="text-[10px] text-muted-foreground text-center">
          Preço = Custo Variável ÷ (1 − Taxas% − Impostos% − Margem%)
        </p>
      </CardContent>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
