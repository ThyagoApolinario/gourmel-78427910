import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { formatarCusto } from '@/lib/smart-units';
import { Plus, Trash2, BookOpen, Calculator, Package, CakeSlice, Clock } from 'lucide-react';
import { PrecificacaoCard } from '@/components/PrecificacaoCard';

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
  const [formRendUn, setFormRendUn] = useState('');
  const [formTempoMin, setFormTempoMin] = useState('');

  // Composição form
  const [addInsumoId, setAddInsumoId] = useState('');
  const [addQtd, setAddQtd] = useState('');
  const [addFator, setAddFator] = useState('1');

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
        rendimento_unidade: formRendUn || null,
        tempo_producao_minutos: formTempoMin ? parseFloat(formTempoMin) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      setShowReceitaForm(false);
      setFormNome(''); setFormDescricao(''); setFormCategoriaId(''); setFormRendQtd(''); setFormRendUn(''); setFormTempoMin('');
      toast({ title: 'Receita criada!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const addComposicaoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('composicao_receita').insert({
        user_id: user!.id,
        receita_id: selectedReceita!,
        insumo_id: addInsumoId,
        quantidade: parseFloat(addQtd),
        fator_rendimento: parseFloat(addFator) || 1,
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

  // Cost calculations
  const calcItemCost = (c: Composicao) => {
    const custoUn = c.insumo?.custo_unitario ?? 0;
    const fator = c.fator_rendimento || 1;
    return (c.quantidade * custoUn) / fator;
  };

  const ingredientesComp = composicao.filter(c => c.insumo?.categoria === 'ingrediente');
  const embalagensComp = composicao.filter(c => c.insumo?.categoria === 'embalagem');
  const custoIngredientes = ingredientesComp.reduce((sum, c) => sum + calcItemCost(c), 0);
  const custoEmbalagens = embalagensComp.reduce((sum, c) => sum + calcItemCost(c), 0);
  const custoTotal = custoIngredientes + custoEmbalagens;

  const receitaSelecionada = receitas.find(r => r.id === selectedReceita);
  const custoPorUnidade = receitaSelecionada?.rendimento_quantidade
    ? custoTotal / receitaSelecionada.rendimento_quantidade
    : null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Receitas</h1>
            <p className="text-muted-foreground text-sm">Fichas técnicas com controle de custos</p>
          </div>
          {!showReceitaForm && (
            <Button onClick={() => setShowReceitaForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Receita
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
                      <Label>Rendimento</Label>
                      <Input type="number" value={formRendQtd} onChange={e => setFormRendQtd(e.target.value)} placeholder="Ex: 12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Input value={formRendUn} onChange={e => setFormRendUn(e.target.value)} placeholder="fatias" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Tempo de Produção (min)</Label>
                    <Input type="number" min="0" value={formTempoMin} onChange={e => setFormTempoMin(e.target.value)} placeholder="Ex: 120" />
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
            <div className="grid gap-3 sm:grid-cols-2">
              {receitas.map(r => (
                <Card key={r.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedReceita(r.id)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.nome}</p>
                      {r.descricao && <p className="text-sm text-muted-foreground">{r.descricao}</p>}
                      {r.rendimento_quantidade && (
                        <p className="text-xs text-muted-foreground mt-1">Rende: {r.rendimento_quantidade} {r.rendimento_unidade}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={e => { e.stopPropagation(); deleteReceitaMutation.mutate(r.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Detalhes da receita selecionada */}
        {selectedReceita && receitaSelecionada && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReceita(null)}>← Voltar</Button>
              <h2 className="text-xl font-bold">{receitaSelecionada.nome}</h2>
            </div>

            {/* Card de Resumo de Custo */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Resumo de Custos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    <p className="text-xs text-muted-foreground">Custo/Unidade</p>
                    <p className="font-bold text-lg">{custoPorUnidade ? formatarCusto(custoPorUnidade) : '—'}</p>
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
            />

            {/* Adicionar item */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Adicionar Insumo à Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); addComposicaoMutation.mutate(); }} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Insumo</Label>
                    <Select value={addInsumoId} onValueChange={setAddInsumoId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {insumos.map(i => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.categoria === 'embalagem' ? '📦' : '🧈'} {i.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input type="number" step="0.01" min="0" value={addQtd} onChange={e => setAddQtd(e.target.value)} placeholder="0" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fator Rend.</Label>
                    <div className="flex gap-2">
                      <Input type="number" step="0.01" min="0.01" max="2" value={addFator} onChange={e => setAddFator(e.target.value)} placeholder="1.0" />
                      <Button type="submit" disabled={!addInsumoId || addComposicaoMutation.isPending} size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
                {parseFloat(addFator) < 1 && parseFloat(addFator) > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Fator {addFator} = {((1 - parseFloat(addFator)) * 100).toFixed(0)}% de perda — o custo será ajustado para cima
                  </p>
                )}
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
                        {composicao.map(c => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{c.insumo?.categoria === 'embalagem' ? '📦' : '🧈'}</span>
                                <span className="font-medium text-sm">{c.insumo?.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{c.quantidade} {c.insumo?.unidade_medida}</TableCell>
                            <TableCell>
                              {c.fator_rendimento !== 1 ? (
                                <Badge variant="outline" className="text-xs">{c.fator_rendimento}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">1.0</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{formatarCusto(calcItemCost(c))}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeComposicaoMutation.mutate(c.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
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
