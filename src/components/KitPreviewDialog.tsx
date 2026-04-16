import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gift, PartyPopper, Package, BookOpen, AlertTriangle, CheckCircle2, PawPrint } from 'lucide-react';
import { calcularKit, calcMargemKit, calcEconomia, type FinanceConfig } from '@/lib/calc-kit';
import { formatarCusto } from '@/lib/smart-units';

interface KitPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kitId: string;
  quantidade: number;
  precoUnitario: number;
  taxaPct: number;
  metodoNome: string;
  config: FinanceConfig | null;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function KitPreviewDialog({
  open, onOpenChange, kitId, quantidade, precoUnitario, taxaPct, metodoNome,
  config, onConfirm, isConfirming,
}: KitPreviewDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['kit-preview', kitId, taxaPct, config?.pro_labore, config?.horas_mes, config?.impostos, config?.margem_desejada],
    queryFn: async () => {
      if (!kitId || !config) return null;
      const [{ data: kit }, { data: itens }] = await Promise.all([
        supabase.from('kits').select('*').eq('id', kitId).maybeSingle(),
        supabase.from('kit_itens').select('*').eq('kit_id', kitId),
      ]);
      if (!kit || !itens) return null;
      const breakdown = await calcularKit(
        itens.map((i: any) => ({
          tipo_item: i.tipo_item,
          receita_id: i.receita_id,
          insumo_id: i.insumo_id,
          quantidade: Number(i.quantidade),
        })),
        Number(kit.tempo_montagem_minutos) || 0,
        kit.zerar_mao_obra,
        config,
        taxaPct,
      );
      return { kit, breakdown };
    },
    enabled: open && !!kitId && !!config,
  });

  const precoTotal = precoUnitario * quantidade;
  const margem = data
    ? calcMargemKit(precoUnitario, data.breakdown.custoTotal, taxaPct, config?.impostos ?? 0)
    : null;
  const lucroTotal = margem ? margem.lucroReais * quantidade : 0;
  const economia = data ? calcEconomia(data.breakdown.somaPrecosIndividuais, precoUnitario) : 0;

  const margemPct = margem?.margemPct ?? 0;
  const margemAlerta = margemPct < 10;
  const margemNegativa = margemPct < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-accent" />
            Pré-visualização do Kit
          </DialogTitle>
          <DialogDescription className="text-xs">
            Revise os componentes, custo e margem antes de confirmar
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Nome do kit */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{data.kit.nome}</h3>
                {data.kit.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{data.kit.descricao}</p>
                )}
              </div>
              <Badge variant="secondary" className="gap-1 shrink-0">
                <PartyPopper className="h-3 w-3" /> {quantidade}x
              </Badge>
            </div>

            {/* Itens componentes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Componentes</span>
                <span>{data.breakdown.itens.length} {data.breakdown.itens.length === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="rounded-lg border bg-muted/30 divide-y">
                {data.breakdown.itens.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.tipo === 'receita' ? (
                        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <Package className="h-3.5 w-3.5 text-accent shrink-0" />
                      )}
                      <span className="truncate">{item.nome}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0">
                        ×{item.quantidade}
                      </Badge>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {formatarCusto(item.custoTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Breakdown de custos */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo dos itens</span>
                <span className="font-mono">{formatarCusto(data.breakdown.custoItens)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Mão de obra montagem
                  {data.kit.zerar_mao_obra && <span className="ml-1 text-warning">(zerada)</span>}
                </span>
                <span className="font-mono">{formatarCusto(data.breakdown.custoMontagem)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Custo total / kit</span>
                <span className="font-mono">{formatarCusto(data.breakdown.custoTotal)}</span>
              </div>
            </div>

            <Separator />

            {/* Preço e margem */}
            <div className="space-y-2 rounded-lg bg-primary/5 border border-primary/15 p-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Preço unitário</span>
                <span className="font-bold text-primary">{formatarCusto(precoUnitario)}</span>
              </div>
              {quantidade > 1 && (
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-muted-foreground">Total da venda ({quantidade}×)</span>
                  <span className="font-semibold text-primary">{formatarCusto(precoTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Taxa {metodoNome} ({taxaPct}%)</span>
                <span className="font-mono text-muted-foreground">−{formatarCusto(margem?.taxaValor ?? 0)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium">Lucro líquido / kit</span>
                <span className={`font-bold ${margemNegativa ? 'text-destructive' : margemAlerta ? 'text-warning' : 'text-success'}`}>
                  {formatarCusto(margem?.lucroReais ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Margem de contribuição</span>
                <Badge
                  variant="outline"
                  className={margemNegativa ? 'border-destructive text-destructive' : margemAlerta ? 'border-warning text-warning' : 'border-success text-success'}
                >
                  {margemPct.toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Alertas */}
            {margemNegativa && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Prejuízo!</strong> O preço atual está abaixo do custo total. Você perderá {formatarCusto(Math.abs(margem?.lucroReais ?? 0))} por kit.
                </AlertDescription>
              </Alert>
            )}
            {!margemNegativa && margemAlerta && (
              <Alert className="py-2 border-warning/30 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-xs">
                  Margem abaixo de 10% — considere revisar o preço para garantir lucratividade saudável.
                </AlertDescription>
              </Alert>
            )}
            {!margemAlerta && (
              <Alert className="py-2 border-success/30 bg-success/5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-xs">
                  Margem saudável! Lucro total da venda: <strong>{formatarCusto(lucroTotal)}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Selo de economia */}
            {economia > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
                <PartyPopper className="h-4 w-4 text-accent" />
                <span className="text-xs">
                  Cliente economiza <strong className="text-accent">{economia.toFixed(0)}%</strong> vs comprar separado
                  ({formatarCusto(data.breakdown.somaPrecosIndividuais)})
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || isConfirming || !data}
            className="w-full sm:w-auto gap-2"
          >
            <PawPrint className="h-4 w-4" />
            {isConfirming ? 'Registrando…' : 'Confirmar Venda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
