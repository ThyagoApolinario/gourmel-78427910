import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Gift, PartyPopper, Plus, Trash2, BookOpen, Package, Save, AlertTriangle, Sparkles, TrendingUp, Cookie } from 'lucide-react';
import { formatarCusto } from '@/lib/smart-units';
import {
  calcularKit,
  calcPrecoSugeridoKit,
  calcMargemKit,
  calcEconomia,
  type KitItemInput,
  type FinanceConfig,
  type KitCustoBreakdown,
} from '@/lib/calc-kit';

interface KitFormProps {
  kitId?: string | null;
  onClose: () => void;
}

interface ItemDraft extends KitItemInput {
  _key: string;
}

export function KitForm({ kitId, onClose }: KitFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!kitId;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tempoMontagem, setTempoMontagem] = useState(0);
  const [zerarMaoObra, setZerarMaoObra] = useState(false);
  const [itens, setItens] = useState<ItemDraft[]>([]);
  const [modoOverride, setModoOverride] = useState<'sugerido' | 'desconto' | 'manual'>('sugerido');
  const [descontoPct, setDescontoPct] = useState(10);
  const [precoManual, setPrecoManual] = useState('');
  const [breakdown, setBreakdown] = useState<KitCustoBreakdown | null>(null);

  // Add item form
  const [addTipo, setAddTipo] = useState<'receita' | 'insumo'>('receita');
  const [addRefId, setAddRefId] = useState('');
  const [addQtd, setAddQtd] = useState('1');

  // Carregar receitas/insumos/config/método padrão
  const { data: receitas = [] } = useQuery({
    queryKey: ['receitas-kit', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('receitas').select('id, nome').eq('user_id', user!.id).order('nome');
      return (data || []) as { id: string; nome: string }[];
    },
    enabled: !!user,
  });

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos-kit', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('insumos').select('id, nome, custo_unitario, unidade_medida, categoria').eq('user_id', user!.id).order('nome');
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const { data: config } = useQuery({
    queryKey: ['config-kit', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('configuracoes_financeiras').select('*').eq('user_id', user!.id).maybeSingle();
      return data as FinanceConfig | null;
    },
    enabled: !!user,
  });

  const { data: metodos = [] } = useQuery({
    queryKey: ['metodos-kit', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('metodos_pagamento').select('*').eq('user_id', user!.id).eq('ativo', true).order('ordem');
      return (data || []) as { id: string; nome: string; taxa_percentual: number; is_padrao_precificacao: boolean }[];
    },
    enabled: !!user,
  });

  const metodoPadrao = metodos.find(m => m.is_padrao_precificacao);
  const taxaPadrao = metodoPadrao?.taxa_percentual ?? 0;

  // Carregar kit existente
  useEffect(() => {
    if (!kitId || !user) return;
    (async () => {
      const [{ data: kit }, { data: kitItens }] = await Promise.all([
        supabase.from('kits').select('*').eq('id', kitId).maybeSingle(),
        supabase.from('kit_itens').select('*').eq('kit_id', kitId),
      ]);
      if (kit) {
        setNome(kit.nome);
        setDescricao(kit.descricao || '');
        setTempoMontagem(Number(kit.tempo_montagem_minutos) || 0);
        setZerarMaoObra(kit.zerar_mao_obra);
        if (kit.preco_final_manual != null) {
          setModoOverride('manual');
          setPrecoManual(String(kit.preco_final_manual).replace('.', ','));
        } else if (kit.desconto_percentual != null) {
          setModoOverride('desconto');
          setDescontoPct(Number(kit.desconto_percentual));
        }
      }
      if (kitItens) {
        setItens(
          kitItens.map((i: any, idx: number) => ({
            _key: `${i.id}-${idx}`,
            tipo_item: i.tipo_item,
            receita_id: i.receita_id,
            insumo_id: i.insumo_id,
            quantidade: Number(i.quantidade),
          })),
        );
      }
    })();
  }, [kitId, user]);

  // Recalcular breakdown quando muda algo
  useEffect(() => {
    if (!config || itens.length === 0) {
      setBreakdown(null);
      return;
    }
    let cancelled = false;
    calcularKit(itens, tempoMontagem, zerarMaoObra, config, taxaPadrao).then(b => {
      if (!cancelled) setBreakdown(b);
    });
    return () => { cancelled = true; };
  }, [itens, tempoMontagem, zerarMaoObra, config, taxaPadrao]);

  const handleAddItem = () => {
    if (!addRefId || !addQtd) return;
    const qtd = parseFloat(addQtd.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      toast({ title: 'Quantidade inválida', variant: 'destructive' });
      return;
    }
    setItens(prev => [
      ...prev,
      {
        _key: `${Date.now()}-${Math.random()}`,
        tipo_item: addTipo,
        receita_id: addTipo === 'receita' ? addRefId : null,
        insumo_id: addTipo === 'insumo' ? addRefId : null,
        quantidade: qtd,
      },
    ]);
    setAddRefId('');
    setAddQtd('1');
  };

  const handleRemoveItem = (key: string) => {
    setItens(prev => prev.filter(i => i._key !== key));
  };

  // Cálculo de preço final dependendo do modo
  const somaIndividuais = breakdown?.somaPrecosIndividuais ?? 0;
  const precoSugerido = useMemo(() => calcPrecoSugeridoKit(somaIndividuais), [somaIndividuais]);
  const precoFinal = useMemo(() => {
    if (modoOverride === 'manual') {
      const v = parseFloat(precoManual.replace(',', '.'));
      return isNaN(v) ? 0 : v;
    }
    if (modoOverride === 'desconto') {
      return somaIndividuais * (1 - descontoPct / 100);
    }
    return precoSugerido;
  }, [modoOverride, precoManual, descontoPct, somaIndividuais, precoSugerido]);

  const margemInfo = useMemo(() => {
    if (!breakdown || !config) return null;
    return calcMargemKit(precoFinal, breakdown.custoTotal, taxaPadrao, config.impostos);
  }, [precoFinal, breakdown, taxaPadrao, config]);

  const economia = calcEconomia(somaIndividuais, precoFinal);
  const margemNegativa = margemInfo && margemInfo.lucroReais < 0;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error('Nome é obrigatório');
      if (itens.length === 0) throw new Error('Adicione pelo menos um item');

      const payload = {
        user_id: user!.id,
        nome,
        descricao: descricao || null,
        tempo_montagem_minutos: tempoMontagem,
        zerar_mao_obra: zerarMaoObra,
        preco_final_manual: modoOverride === 'manual' ? parseFloat(precoManual.replace(',', '.')) : null,
        desconto_percentual: modoOverride === 'desconto' ? descontoPct : null,
        ativo: true,
      };

      let savedId = kitId;
      if (isEdit) {
        const { error } = await supabase.from('kits').update(payload).eq('id', kitId!);
        if (error) throw error;
        // Apaga itens antigos e reinsere (mais simples que diff)
        await supabase.from('kit_itens').delete().eq('kit_id', kitId!);
      } else {
        const { data, error } = await supabase.from('kits').insert(payload).select('id').single();
        if (error) throw error;
        savedId = data.id;
      }

      const itensPayload = itens.map(i => ({
        user_id: user!.id,
        kit_id: savedId!,
        tipo_item: i.tipo_item,
        receita_id: i.receita_id || null,
        insumo_id: i.insumo_id || null,
        quantidade: i.quantidade,
      }));
      const { error: itensErr } = await supabase.from('kit_itens').insert(itensPayload);
      if (itensErr) throw itensErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kits'] });
      toast({ title: isEdit ? 'Kit atualizado! 🎁' : 'Kit criado com sucesso! 🎁' });
      onClose();
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            {isEdit ? 'Editar Kit' : 'Novo Kit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome do Kit</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Kit Aniversário Pet 🎂" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes para marketing..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Tempo de montagem (min)</Label>
              <Input type="number" min="0" value={tempoMontagem} onChange={e => setTempoMontagem(Number(e.target.value) || 0)} disabled={zerarMaoObra} />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs">Zerar mão de obra</Label>
                  <p className="text-[10px] text-muted-foreground">Para kits promocionais de volume</p>
                </div>
                <Switch checked={zerarMaoObra} onCheckedChange={setZerarMaoObra} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Builder de Itens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-accent" /> Composição do Kit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 sm:col-span-3 space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={addTipo} onValueChange={(v: any) => { setAddTipo(v); setAddRefId(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita"><span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Receita</span></SelectItem>
                  <SelectItem value="insumo"><span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Insumo avulso</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-8 sm:col-span-6 space-y-1">
              <Label className="text-xs">Item</Label>
              <Select value={addRefId} onValueChange={setAddRefId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {addTipo === 'receita'
                    ? receitas.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)
                    : insumos.map(i => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome} <span className="text-[10px] text-muted-foreground ml-1">({i.unidade_medida})</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 sm:col-span-2 space-y-1">
              <Label className="text-xs">Qtd</Label>
              <Input type="text" value={addQtd} onChange={e => setAddQtd(e.target.value)} />
            </div>
            <div className="col-span-1 sm:col-span-1">
              <Button size="icon" onClick={handleAddItem} disabled={!addRefId} className="w-full">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {itens.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">Adicione receitas e insumos avulsos ao kit</p>
          ) : (
            <div className="space-y-1.5">
              {itens.map((item, idx) => {
                const detalhe = breakdown?.itens[idx];
                const Icon = item.tipo_item === 'receita' ? BookOpen : Package;
                return (
                  <div key={item._key} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{detalhe?.nome ?? '...'}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">×{item.quantidade}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {detalhe && (
                        <span className="text-xs text-muted-foreground font-mono">{formatarCusto(detalhe.custoTotal)}</span>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveItem(item._key)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel de Comparação e Override */}
      {breakdown && config && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Painel de Precificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Custo itens</p>
                <p className="font-semibold text-sm">{formatarCusto(breakdown.custoItens)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground">Montagem</p>
                <p className="font-semibold text-sm">{formatarCusto(breakdown.custoMontagem)}</p>
                {tempoMontagem > 0 && !zerarMaoObra && (
                  <p className="text-[10px] text-muted-foreground">{tempoMontagem} min</p>
                )}
              </div>
              <div className="text-center p-2 rounded-lg bg-primary/10">
                <p className="text-[10px] text-muted-foreground">Custo total</p>
                <p className="font-bold text-sm text-primary">{formatarCusto(breakdown.custoTotal)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent/10">
                <p className="text-[10px] text-muted-foreground">Soma individuais</p>
                <p className="font-bold text-sm text-accent">{formatarCusto(somaIndividuais)}</p>
              </div>
            </div>

            <Separator />

            {/* Modo de definição de preço */}
            <div className="space-y-3">
              <Label className="text-sm">Estratégia de Preço</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['sugerido', 'desconto', 'manual'] as const).map(m => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={modoOverride === m ? 'default' : 'outline'}
                    onClick={() => setModoOverride(m)}
                    className="text-xs"
                  >
                    {m === 'sugerido' && '✨ Sugerido'}
                    {m === 'desconto' && '% Desconto'}
                    {m === 'manual' && '🎯 Manual'}
                  </Button>
                ))}
              </div>

              {modoOverride === 'sugerido' && (
                <p className="text-[11px] text-muted-foreground">
                  Soma dos preços individuais com 10% de desconto (padrão de bundle).
                </p>
              )}

              {modoOverride === 'desconto' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Desconto sobre soma individual</Label>
                    <Badge variant="outline" className="font-mono">{descontoPct}%</Badge>
                  </div>
                  <Slider value={[descontoPct]} onValueChange={([v]) => setDescontoPct(v)} min={0} max={50} step={1} />
                </div>
              )}

              {modoOverride === 'manual' && (
                <div className="space-y-2">
                  <Label className="text-xs">Preço final em R$</Label>
                  <Input value={precoManual} onChange={e => setPrecoManual(e.target.value)} placeholder="0,00" />
                </div>
              )}
            </div>

            <Separator />

            {/* Resultado */}
            <div className="rounded-lg bg-success/5 border border-success/30 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Preço Final</p>
                  <p className="text-xl font-bold text-success">{formatarCusto(precoFinal)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-xl font-bold ${margemNegativa ? 'text-destructive' : 'text-foreground'}`}>
                    {margemInfo ? formatarCusto(margemInfo.lucroReais) : '—'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-muted-foreground">Margem</p>
                  <p className={`text-xl font-bold ${margemNegativa ? 'text-destructive' : 'text-primary'}`}>
                    {margemInfo ? `${margemInfo.margemPct.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>

              {economia > 0 && !margemNegativa && (
                <Badge className="w-full justify-center gap-1 bg-accent/15 text-accent border-accent/30">
                  <Sparkles className="h-3 w-3" /> Economia para o cliente: {economia.toFixed(1)}%
                </Badge>
              )}

              {margemNegativa && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">
                    O desconto está <strong>comendo o lucro</strong>! Esse preço gera prejuízo de {formatarCusto(Math.abs(margemInfo!.lucroReais))}.
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                Taxa do método padrão: {taxaPadrao}% • Impostos: {config.impostos}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 sticky bottom-0 bg-background py-2 -mx-2 px-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 gap-2">
          <Save className="h-4 w-4" />
          {isEdit ? 'Salvar' : 'Criar Kit'}
        </Button>
      </div>
    </div>
  );
}
