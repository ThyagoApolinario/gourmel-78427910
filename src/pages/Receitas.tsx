import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatarCusto } from '@/lib/smart-units';
import { Plus, Trash2, BookOpen, Calculator, Package, CakeSlice, Clock, Scale, Cookie, AlertTriangle, Check, Pencil, X, Search, CalendarRange } from 'lucide-react';
import { PrecificacaoCard } from '@/components/PrecificacaoCard';
import { HelpTooltip } from '@/components/HelpTooltip';

type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un';

// Conversion factor: how many "from" units fit in one "to" unit
function getConversionFactor(insumoUnit: UnidadeMedida, receitaUnit: UnidadeMedida): number | null {
  // Same unit = no conversion
  if (insumoUnit === receitaUnit) return 1;

  const conversions: Record<string, number> = {
    'kg->g': 1000,
    'g->kg': 0.001,
    'l->ml': 1000,
    'ml->l': 0.001,
  };

  const key = `${insumoUnit}->${receitaUnit}`;
  return conversions[key] ?? null; // null = incompatible
}

function areUnitsCompatible(a: UnidadeMedida, b: UnidadeMedida): boolean {
  if (a === b) return true;
  const weight: UnidadeMedida[] = ['g', 'kg'];
  const volume: UnidadeMedida[] = ['ml', 'l'];
  if (weight.includes(a) && weight.includes(b)) return true;
  if (volume.includes(a) && volume.includes(b)) return true;
  return false;
}

interface Insumo {
  id: string;
  nome: string;
  categoria: 'ingrediente' | 'embalagem';
  custo_unitario: number | null;
  unidade_medida: string;
}

interface Composicao {
  id: string;
  insumo_id: string;
  quantidade: number;
  fator_rendimento: number;
  unidade_medida: UnidadeMedida;
  insumo?: Insumo;
}

interface Receita {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  rendimento_quantidade: number | null;
  rendimento_unidade: string | null;
  tempo_producao_minutos: number | null;
  margem_desejada: number | null;
  mes_producao: string | null;
}

interface Categoria {
  id: string;
  nome: string;
}

export default function Receitas() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReceita, setSelectedReceita] = useState<string | null>(null);
  const [showReceitaForm, setShowReceitaForm] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('');
  const [formRendQtd, setFormRendQtd] = useState('');
  const [formRendUn, setFormRendUn] = useState('un');
  const [formTempoMin, setFormTempoMin] = useState('');
  const currentMonthDefault = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);
  const [formMesProducao, setFormMesProducao] = useState(currentMonthDefault);

  // Composição form
  const [addInsumoId, setAddInsumoId] = useState('');
  const [addQtd, setAddQtd] = useState('');
  const [addFator, setAddFator] = useState('1');
  const [addUnidade, setAddUnidade] = useState<UnidadeMedida>('g');
  const [unitWarning, setUnitWarning] = useState<string | null>(null);
  const [buscaReceita, setBuscaReceita] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQtd, setEditQtd] = useState('');
  const [editUnidade, setEditUnidade] = useState<UnidadeMedida>('g');
  const [editFator, setEditFator] = useState('1');

  const { data: receitas = [] } = useQuery({
    queryKey: ['receitas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('receitas').select('*').order('nome');
      if (error) throw error;
      return data as Receita[];
    },
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias_receita').select('id, nome').order('nome');
      if (error) throw error;
      return data as Categoria[];
    },
  });

  const { data: insumos = [] } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('insumos').select('id, nome, categoria, custo_unitario, unidade_medida').order('nome');
      if (error) throw error;
      return data as Insumo[];
    },
  });

  // Auto-fill unit when insumo is selected
  useEffect(() => {
    if (addInsumoId) {
      const insumo = insumos.find(i => i.id === addInsumoId);
      if (insumo) {
        setAddUnidade(insumo.unidade_medida as UnidadeMedida);
        setUnitWarning(null);
      }
    }
  }, [addInsumoId, insumos]);

  // Check unit compatibility
  useEffect(() => {
    if (addInsumoId && addUnidade) {
      const insumo = insumos.find(i => i.id === addInsumoId);
      if (insumo && !areUnitsCompatible(insumo.unidade_medida as UnidadeMedida, addUnidade)) {
        setUnitWarning(`Atenção: "${insumo.nome}" é cadastrado em ${insumo.unidade_medida}, mas você selecionou ${addUnidade}. Unidades incompatíveis!`);
      } else {
        setUnitWarning(null);
      }
    }
  }, [addUnidade, addInsumoId, insumos]);

  const { data: composicao = [] } = useQuery({
    queryKey: ['composicao', selectedReceita],
    enabled: !!selectedReceita,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('composicao_receita')
        .select('*, insumo:insumos(id, nome, categoria, custo_unitario, unidade_medida)')
        .eq('receita_id', selectedReceita!);
      if (error) throw error;
      return (data || []).map((c: any) => ({ ...c, insumo: c.insumo })) as Composicao[];
    },
  });

  const createReceitaMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('receitas').insert({
        user_id: user!.id,
        nome: formNome,
        descricao: formDescricao || null,
        categoria_id: formCategoriaId || null,
        rendimento_quantidade: formRendQtd ? parseFloat(formRendQtd) : null,
        rendimento_unidade: formRendUn || 'un',
        tempo_producao_minutos: formTempoMin ? parseFloat(formTempoMin) : null,
        mes_producao: formMesProducao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      setShowReceitaForm(false);
      setFormNome(''); setFormDescricao(''); setFormCategoriaId(''); setFormRendQtd(''); setFormRendUn('un'); setFormTempoMin('');
      toast({ title: 'Receita criada!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const addComposicaoMutation = useMutation({
    mutationFn: async () => {
      const qty = parseFloat(addQtd);
      const fator = parseFloat(addFator) || 1;
      if (!qty || qty <= 0) throw new Error('A quantidade deve ser maior que zero.');
      if (fator <= 0) throw new Error('O fator de rendimento deve ser maior que zero.');
      const { error } = await supabase.from('composicao_receita').insert({
        user_id: user!.id,
        receita_id: selectedReceita!,
        insumo_id: addInsumoId,
        quantidade: qty,
        fator_rendimento: fator,
        unidade_medida: addUnidade,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicao'] });
      setAddInsumoId(''); setAddQtd(''); setAddFator('1');
      toast({ title: 'Item adicionado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const removeComposicaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('composicao_receita').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicao'] });
      toast({ title: 'Item removido!' });
    },
  });

  const updateComposicaoMutation = useMutation({
    mutationFn: async ({ id, quantidade, unidade_medida, fator_rendimento }: { id: string; quantidade: number; unidade_medida: UnidadeMedida; fator_rendimento: number }) => {
      if (quantidade <= 0) throw new Error('A quantidade deve ser maior que zero.');
      if (fator_rendimento <= 0) throw new Error('O fator de rendimento deve ser maior que zero.');
      const { error } = await supabase.from('composicao_receita').update({ quantidade, unidade_medida, fator_rendimento }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicao'] });
      setEditingId(null);
      toast({ title: 'Item atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteReceitaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('receitas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      if (selectedReceita) setSelectedReceita(null);
      toast({ title: 'Receita removida!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  // Update mes_producao mutation
  const updateMesProducaoMutation = useMutation({
    mutationFn: async ({ id, mes }: { id: string; mes: string }) => {
      const { error } = await supabase.from('receitas').update({ mes_producao: mes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      toast({ title: 'Mês de produção atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });




  const calcItemCost = (c: Composicao) => {
    const custoUn = c.insumo?.custo_unitario ?? 0; // cost per insumo unit (e.g. per g, per ml)
    const insumoUnit = (c.insumo?.unidade_medida ?? 'g') as UnidadeMedida;
    const receitaUnit = c.unidade_medida as UnidadeMedida;
    const fator = c.fator_rendimento || 1;

    // Convert: if insumo is in kg (custo per g) and recipe uses g, factor = 1
    // getConversionFactor returns how many receitaUnits per insumoUnit
    const convFactor = getConversionFactor(insumoUnit, receitaUnit);
    if (convFactor === null) {
      // Incompatible units — use direct calc as fallback
      return (c.quantidade * custoUn) / fator;
    }
    // custoUn is price per insumo base unit. 
    // If insumo is kg and custo_unitario = price/kg, recipe uses g:
    // cost = qty_g * (price_per_kg / 1000) / fator
    // convFactor (kg->g) = 1000, so: cost = qty * custoUn / convFactor / fator
    return (c.quantidade * custoUn) / convFactor / fator;
  };

  const ingredientesComp = composicao.filter(c => c.insumo?.categoria === 'ingrediente');
  const embalagensComp = composicao.filter(c => c.insumo?.categoria === 'embalagem');
  const custoIngredientes = ingredientesComp.reduce((sum, c) => sum + calcItemCost(c), 0);
  const custoEmbalagens = embalagensComp.reduce((sum, c) => sum + calcItemCost(c), 0);
  const custoTotal = custoIngredientes + custoEmbalagens;

  const receitaSelecionada = receitas.find(r => r.id === selectedReceita);
  const rendUnidade = receitaSelecionada?.rendimento_unidade || 'un';
  const isGramas = rendUnidade === 'g';
  const custoLabel = isGramas ? 'Custo/Grama' : 'Custo/Unidade';
  const custoPorUnidade = receitaSelecionada?.rendimento_quantidade
    ? custoTotal / receitaSelecionada.rendimento_quantidade
    : null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Receitas</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Fichas técnicas com controle de custos</p>
          </div>
          {!showReceitaForm && (
            <Button onClick={() => setShowReceitaForm(true)} className="shrink-0 h-10 sm:h-10">
              <Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Nova Receita</span><span className="sm:hidden">Nova</span>
            </Button>
          )}
        </div>

        {showReceitaForm && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Nova Receita</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={e => { e.preventDefault(); createReceitaMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome</Label>
                    <Input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Ex: Bolo de Chocolate" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Input value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Observações da receita" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formCategoriaId} onValueChange={setFormCategoriaId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">Rendimento <HelpTooltip field="rendimento" /></Label>
                      <Input type="number" step="0.01" value={formRendQtd} onChange={e => setFormRendQtd(e.target.value)} placeholder={formRendUn === 'g' ? 'Ex: 500' : 'Ex: 12'} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Select value={formRendUn} onValueChange={setFormRendUn}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="un">
                            <span className="flex items-center gap-1.5"><Cookie className="h-3.5 w-3.5" /> Unidades (un)</span>
                          </SelectItem>
                          <SelectItem value="g">
                            <span className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" /> Gramas (g)</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formRendUn === 'g' && (
                    <p className="text-[10px] text-muted-foreground md:col-span-2">
                      ⚖️ Ao vender por peso, o custo será calculado <strong>por grama</strong>. Ideal para biscoitos vendidos a granel!
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Tempo de Produção (min) <HelpTooltip field="tempo_producao" /></Label>
                    <Input type="number" min="0" value={formTempoMin} onChange={e => setFormTempoMin(e.target.value)} placeholder="Ex: 120" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><CalendarRange className="h-3.5 w-3.5" /> Mês de Produção</Label>
                    <Input type="month" value={formMesProducao.slice(0, 7)} onChange={e => setFormMesProducao(e.target.value + '-01')} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createReceitaMutation.isPending} className="flex-1">Criar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowReceitaForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de receitas */}
        {!selectedReceita && (
          receitas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhuma receita cadastrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar receita por nome..."
                  value={buscaReceita}
                  onChange={e => setBuscaReceita(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid gap-3">
              {receitas.filter(r => !buscaReceita || r.nome.toLowerCase().includes(buscaReceita.toLowerCase())).map(r => (
                <Card key={r.id} className="cursor-pointer hover:border-primary/30 active:bg-muted/30 transition-colors" onClick={() => setSelectedReceita(r.id)}>
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.nome}</p>
                      {r.descricao && <p className="text-sm text-muted-foreground truncate">{r.descricao}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {r.rendimento_quantidade && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {r.rendimento_unidade === 'g' ? <Scale className="h-3 w-3" /> : <Cookie className="h-3 w-3" />}
                            Rende: {r.rendimento_quantidade} {r.rendimento_unidade === 'g' ? 'g' : 'un'}
                          </span>
                        )}
                        {r.margem_desejada && (
                          <Badge variant="secondary" className="text-[10px]">Margem: {r.margem_desejada}%</Badge>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0 ml-2" onClick={e => { e.stopPropagation(); deleteReceitaMutation.mutate(r.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
            </div>
          )
        )}

        {/* Detalhes da receita selecionada */}
        {selectedReceita && receitaSelecionada && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReceita(null)}>← Voltar</Button>
              <h2 className="text-xl font-bold flex-1">{receitaSelecionada.nome}</h2>
            </div>

            {/* Mês de produção editável */}
            <div className="flex items-center gap-3 flex-wrap">
              <Label className="flex items-center gap-1.5 text-sm">
                <CalendarRange className="h-3.5 w-3.5" /> Mês de Produção:
              </Label>
              <Input
                type="month"
                className="w-[180px]"
                value={receitaSelecionada.mes_producao ? receitaSelecionada.mes_producao.slice(0, 7) : ''}
                onChange={e => {
                  if (e.target.value) {
                    updateMesProducaoMutation.mutate({ id: receitaSelecionada.id, mes: e.target.value + '-01' });
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                Mude livremente — os relatórios usam a data de cada venda.
              </p>
            </div>

            {/* Card de Resumo de Custo */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Resumo de Custos</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="text-center p-2 rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CakeSlice className="h-3 w-3" /> Ingredientes</p>
                    <p className="font-bold text-lg">{formatarCusto(custoIngredientes)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Package className="h-3 w-3" /> Embalagens</p>
                    <p className="font-bold text-lg">{formatarCusto(custoEmbalagens)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-lg text-primary">{formatarCusto(custoTotal)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-card">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      {isGramas ? <Scale className="h-3 w-3" /> : <Cookie className="h-3 w-3" />} {custoLabel}
                    </p>
                    <p className="font-bold text-lg">{custoPorUnidade ? (isGramas ? `R$ ${custoPorUnidade.toFixed(4).replace('.', ',')}` : formatarCusto(custoPorUnidade)) : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Motor de Precificação */}
            <PrecificacaoCard
              custoInsumos={custoIngredientes}
              custoEmbalagens={custoEmbalagens}
              tempoProducao={receitaSelecionada.tempo_producao_minutos}
              rendimentoQuantidade={receitaSelecionada.rendimento_quantidade}
              rendimentoUnidade={receitaSelecionada.rendimento_unidade}
              receitaId={receitaSelecionada.id}
              margemSalva={receitaSelecionada.margem_desejada}
            />

            {/* Adicionar item */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Adicionar Insumo à Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); addComposicaoMutation.mutate(); }} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Insumo</Label>
                      <Select value={addInsumoId} onValueChange={setAddInsumoId}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {insumos.map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.categoria === 'embalagem' ? '📦' : '🧈'} {i.nome} <span className="text-muted-foreground">({i.unidade_medida})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantidade + Unidade</Label>
                      <div className="flex gap-2">
                        <Input type="number" step="0.01" min="0.01" value={addQtd} onChange={e => setAddQtd(e.target.value)} placeholder="Ex: 250" required className="flex-1" />
                        <Select value={addUnidade} onValueChange={v => setAddUnidade(v as UnidadeMedida)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="l">L</SelectItem>
                            <SelectItem value="un">un</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">Fator Rend. <HelpTooltip field="fator_rendimento" /></Label>
                      <div className="flex gap-2">
                        <Input type="number" step="0.01" min="0.01" max="2" value={addFator} onChange={e => setAddFator(e.target.value)} placeholder="1.0" />
                        <Button type="submit" disabled={!addInsumoId || !!unitWarning || !addQtd || parseFloat(addQtd) <= 0 || addComposicaoMutation.isPending} size="icon" className="shrink-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {unitWarning && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{unitWarning}</AlertDescription>
                    </Alert>
                  )}
                  {parseFloat(addFator) < 1 && parseFloat(addFator) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Fator {addFator} = {((1 - parseFloat(addFator)) * 100).toFixed(0)}% de perda — o custo será ajustado para cima
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Tabela de composição */}
            {composicao.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Insumo</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Fator</TableHead>
                          <TableHead>Custo</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {composicao.map(c => {
                          const isEditing = editingId === c.id;
                          const startEdit = () => {
                            setEditingId(c.id);
                            setEditQtd(String(c.quantidade));
                            setEditUnidade(c.unidade_medida);
                            setEditFator(String(c.fator_rendimento));
                          };
                          const cancelEdit = () => setEditingId(null);
                          const saveEdit = () => {
                            updateComposicaoMutation.mutate({
                              id: c.id,
                              quantidade: parseFloat(editQtd),
                              unidade_medida: editUnidade,
                              fator_rendimento: parseFloat(editFator) || 1,
                            });
                          };

                          return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{c.insumo?.categoria === 'embalagem' ? '📦' : '🧈'}</span>
                                <span className="font-medium text-sm">{c.insumo?.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1 items-center">
                                  <Input type="number" step="0.01" min="0.01" value={editQtd} onChange={e => setEditQtd(e.target.value)} className="h-7 w-20 text-sm" />
                                  <Select value={editUnidade} onValueChange={v => setEditUnidade(v as UnidadeMedida)}>
                                    <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="g">g</SelectItem>
                                      <SelectItem value="kg">kg</SelectItem>
                                      <SelectItem value="ml">ml</SelectItem>
                                      <SelectItem value="l">L</SelectItem>
                                      <SelectItem value="un">un</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <span className="text-sm">{c.quantidade} {c.unidade_medida}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input type="number" step="0.01" min="0.01" max="2" value={editFator} onChange={e => setEditFator(e.target.value)} className="h-7 w-16 text-sm" />
                              ) : c.fator_rendimento !== 1 ? (
                                <Badge variant="outline" className="text-xs">{c.fator_rendimento}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">1.0</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{formatarCusto(calcItemCost(c))}</TableCell>
                            <TableCell>
                              <div className="flex gap-0.5">
                                {isEditing ? (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveEdit} disabled={!editQtd || parseFloat(editQtd) <= 0 || updateComposicaoMutation.isPending}>
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={startEdit}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeComposicaoMutation.mutate(c.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
