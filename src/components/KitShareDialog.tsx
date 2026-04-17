import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download, Share2, MessageCircle, Instagram, Copy, CheckCircle2, Sparkles,
} from 'lucide-react';
import { calcularKit, calcEconomia, type FinanceConfig } from '@/lib/calc-kit';
import {
  KitMarketingCard, KIT_TEMPLATES, KIT_FORMATS,
  type KitTemplateId, type KitFormat,
} from './KitMarketingCard';
import { formatarCusto } from '@/lib/smart-units';
import { cn } from '@/lib/utils';

interface KitShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kitId: string;
}

export function KitShareDialog({ open, onOpenChange, kitId }: KitShareDialogProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState<KitTemplateId>('festivo');
  const [format, setFormat] = useState<KitFormat>('square');
  const [previewScale, setPreviewScale] = useState(0.3);

  const cardDims = format === 'story'
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1080 };

  // Compute scale dynamically so the card always fits the modal width
  useLayoutEffect(() => {
    if (!open) return;
    const el = previewWrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setPreviewScale(w / cardDims.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, kitId, format, cardDims.width]);

  // Config + método padrão (para calcular preço sugerido)
  const { data: config } = useQuery({
    queryKey: ['config-share', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracoes_financeiras').select('*').eq('user_id', user!.id).maybeSingle();
      return data as FinanceConfig | null;
    },
    enabled: !!user && open,
  });

  const { data: metodoPadrao } = useQuery({
    queryKey: ['metodo-padrao-share', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('metodos_pagamento').select('taxa_percentual')
        .eq('user_id', user!.id).eq('is_padrao_precificacao', true).maybeSingle();
      return data?.taxa_percentual ?? 3.5;
    },
    enabled: !!user && open,
  });

  // Carrega kit + cálculo de preços
  const { data: kitData, isLoading } = useQuery({
    queryKey: ['kit-share', kitId, config?.pro_labore, metodoPadrao],
    queryFn: async () => {
      if (!config) return null;
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
        metodoPadrao ?? 3.5,
      );
      // Preço a usar: manual override > preço com desconto > soma com 10% off
      const desconto = kit.desconto_percentual ?? 10;
      const precoFinal =
        kit.preco_final_manual != null
          ? Number(kit.preco_final_manual)
          : breakdown.somaPrecosIndividuais * (1 - desconto / 100);
      const economia = calcEconomia(breakdown.somaPrecosIndividuais, precoFinal);
      return { kit, breakdown, precoFinal, economia };
    },
    enabled: open && !!config,
  });

  // Gera PNG
  const generatePng = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1080,
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } finally {
      setGenerating(false);
    }
  };

  const downloadPng = async () => {
    const blob = await generatePng();
    if (!blob || !kitData) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kit-${kitData.kit.nome.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Imagem baixada! 📥', description: 'Pronto para postar nas redes.' });
  };

  const buildMessage = () => {
    if (!kitData) return '';
    const { kit, precoFinal, economia } = kitData;
    let msg = `🎁 *${kit.nome}*\n\n`;
    if (kit.descricao) msg += `${kit.descricao}\n\n`;
    msg += `💰 Por apenas *${formatarCusto(precoFinal)}*\n`;
    if (economia > 0) msg += `🎉 Você economiza *${Math.round(economia)}%* vs comprar separado!\n`;
    msg += `\n📲 Faça seu pedido agora!`;
    return msg;
  };

  const shareWhatsapp = async () => {
    const blob = await generatePng();
    const msg = buildMessage();
    // Try Web Share API with image first (works on mobile)
    if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'kit.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({
          files: [new File([blob], 'kit.png', { type: 'image/png' })],
          text: msg,
        });
        return;
      } catch {/* user cancelled or unsupported */}
    }
    // Fallback: download image + open WhatsApp web with text
    if (blob && kitData) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kit-${kitData.kit.nome.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    toast({
      title: 'Imagem baixada! 📥',
      description: 'Anexe a imagem na conversa do WhatsApp que abriu.',
    });
  };

  const shareInstagram = async () => {
    const blob = await generatePng();
    if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'kit.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({
          files: [new File([blob], 'kit.png', { type: 'image/png' })],
          text: buildMessage(),
        });
        return;
      } catch {/* fallback */}
    }
    // Instagram doesn't support direct web sharing — download and instruct
    await downloadPng();
    toast({
      title: 'Próximo passo no Instagram 📸',
      description: 'Abra o Instagram, crie um post/story e selecione a imagem que acabou de baixar.',
    });
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(buildMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Texto copiado! ✨' });
  };

  const shareNative = async () => {
    const blob = await generatePng();
    if (!blob) return;
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'kit.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({
          files: [new File([blob], 'kit.png', { type: 'image/png' })],
          text: buildMessage(),
          title: kitData?.kit.nome,
        });
      } catch {/* cancelled */}
    } else {
      toast({
        title: 'Compartilhamento não disponível',
        description: 'Use os botões específicos abaixo.',
        variant: 'destructive',
      });
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const brandName = profile === 'canine' ? 'Confeitaria Pet' : 'Confeitaria';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Compartilhar Kit
          </DialogTitle>
          <DialogDescription className="text-xs">
            Imagem pronta para WhatsApp, Instagram e e-mail
          </DialogDescription>
        </DialogHeader>

        {isLoading || !kitData ? (
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Template selector */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Estilo do card</p>
              <div className="grid grid-cols-3 gap-1.5">
                {KIT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-lg border-2 p-2 text-center transition-all',
                      template === t.id
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-border hover:border-accent/40 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-lg leading-none">{t.emoji}</span>
                    <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview (scaled) */}
            <div
              ref={previewWrapRef}
              className="rounded-xl overflow-hidden border-2 border-border shadow-md bg-muted relative w-full"
              style={{ aspectRatio: '1 / 1' }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                  width: 1080,
                  height: 1080,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                <KitMarketingCard
                  ref={cardRef}
                  template={template}
                  nome={kitData.kit.nome}
                  descricao={kitData.kit.descricao}
                  itens={kitData.breakdown.itens.map((i) => ({
                    nome: i.nome,
                    tipo: i.tipo,
                    quantidade: i.quantidade,
                  }))}
                  preco={kitData.precoFinal}
                  precoIndividual={kitData.breakdown.somaPrecosIndividuais}
                  economiaPct={kitData.economia}
                  brandName={brandName}
                />
              </div>
            </div>

            {kitData.economia <= 0 && (
              <Alert className="py-2 border-warning/30 bg-warning/5">
                <AlertDescription className="text-xs">
                  Defina um preço final menor que a soma individual ({formatarCusto(kitData.breakdown.somaPrecosIndividuais)})
                  para mostrar o selo de economia ao cliente.
                </AlertDescription>
              </Alert>
            )}

            {/* Native share (mobile) */}
            {canNativeShare && (
              <Button onClick={shareNative} className="w-full gap-2" disabled={generating} size="lg">
                <Share2 className="h-5 w-5" />
                Compartilhar (escolher app)
              </Button>
            )}

            {/* Specific channel buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={shareWhatsapp}
                disabled={generating}
                className="flex flex-col h-auto py-3 gap-1 border-success/40 hover:bg-success/5 hover:text-success"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-[11px]">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                onClick={shareInstagram}
                disabled={generating}
                className="flex flex-col h-auto py-3 gap-1 border-accent/40 hover:bg-accent/5 hover:text-accent"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-[11px]">Instagram</span>
              </Button>
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={downloadPng} disabled={generating} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar PNG
              </Button>
              <Button variant="ghost" onClick={copyMessage} disabled={generating} className="gap-2">
                {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar texto'}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              💡 No celular, o botão "Compartilhar" abre o seletor nativo com a imagem anexada.
              No desktop, baixe e anexe manualmente.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
