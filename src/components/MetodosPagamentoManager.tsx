import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Plus, Trash2, Star, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MetodoPagamento {
  id: string;
  nome: string;
  taxa_percentual: number;
  is_padrao_precificacao: boolean;
  ativo: boolean;
  ordem: number;
}

export function MetodosPagamentoManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [novoNome, setNovoNome] = useState('');
  const [novaTaxa, setNovaTaxa] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTaxa, setEditTaxa] = useState('');

  const { data: metodos = [], isLoading } = useQuery({
    queryKey: ['metodos_pagamento', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metodos_pagamento')
        .select('*')
        .eq('user_id', user!.id)
        .order('ordem');
      if (error) throw error;
      return data as MetodoPagamento[];
    },
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['metodos_pagamento'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const taxa = parseFloat(novaTaxa.replace(',', '.'));
      if (!novoNome.trim()) throw new Error('Nome obrigatório');
      if (isNaN(taxa) || taxa < 0 || taxa > 100) throw new Error('Taxa inválida (0-100)');
      const maxOrdem = metodos.reduce((m, x) => Math.max(m, x.ordem), 0);
      const { error } = await supabase.from('metodos_pagamento').insert({
        user_id: user!.id,
        nome: novoNome.trim(),
        taxa_percentual: taxa,
        ordem: maxOrdem + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setNovoNome('');
      setNovaTaxa('');
      toast({ title: 'Método adicionado' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nome, taxa }: { id: string; nome: string; taxa: number }) => {
      const { error } = await supabase
        .from('metodos_pagamento')
        .update({ nome, taxa_percentual: taxa })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast({ title: 'Método atualizado' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metodos_pagamento').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Método removido' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const setPadraoMutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove padrão atual e seta novo (operação sequencial — index único impede dois padrões)
      const { error: e1 } = await supabase
        .from('metodos_pagamento')
        .update({ is_padrao_precificacao: false })
        .eq('user_id', user!.id)
        .eq('is_padrao_precificacao', true);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('metodos_pagamento')
        .update({ is_padrao_precificacao: true })
        .eq('id', id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Padrão de precificação atualizado' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('metodos_pagamento').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const startEdit = (m: MetodoPagamento) => {
    setEditingId(m.id);
    setEditNome(m.nome);
    setEditTaxa(String(m.taxa_percentual));
  };

  const saveEdit = (id: string) => {
    const taxa = parseFloat(editTaxa.replace(',', '.'));
    if (!editNome.trim() || isNaN(taxa) || taxa < 0) {
      toast({ title: 'Dados inválidos', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({ id, nome: editNome.trim(), taxa });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Métodos de Pagamento
        </CardTitle>
        <CardDescription>
          Cadastre as formas de recebimento e suas taxas. O método marcado como{' '}
          <Star className="inline h-3 w-3 text-accent" /> Padrão é usado para gerar o preço sugerido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista */}
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {metodos.map((m) => {
            const isEditing = editingId === m.id;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border ${
                  m.is_padrao_precificacao ? 'border-accent/40 bg-accent/5' : 'bg-card'
                } ${!m.ativo ? 'opacity-60' : ''}`}
              >
                {isEditing ? (
                  <>
                    <Input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="h-8 text-sm flex-1 min-w-0"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editTaxa}
                        onChange={(e) => setEditTaxa(e.target.value)}
                        className="h-8 w-20 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-primary"
                      onClick={() => saveEdit(m.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{m.nome}</span>
                        {m.is_padrao_precificacao && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Star className="h-2.5 w-2.5" /> Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Taxa: {m.taxa_percentual}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!m.is_padrao_precificacao && m.ativo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs gap-1"
                          onClick={() => setPadraoMutation.mutate(m.id)}
                          title="Marcar como padrão"
                        >
                          <Star className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Padrão</span>
                        </Button>
                      )}
                      <Switch
                        checked={m.ativo}
                        onCheckedChange={(v) => toggleAtivoMutation.mutate({ id: m.id, ativo: v })}
                        title={m.ativo ? 'Ativo' : 'Inativo'}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (m.is_padrao_precificacao) {
                            toast({
                              title: 'Não é possível excluir',
                              description: 'Marque outro método como padrão antes.',
                              variant: 'destructive',
                            });
                            return;
                          }
                          deleteMutation.mutate(m.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {!isLoading && metodos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum método cadastrado. Adicione o primeiro abaixo.
            </p>
          )}
        </div>

        {/* Adicionar novo */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-col sm:flex-row gap-2 pt-3 border-t"
        >
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input
              placeholder="Ex: Vale Refeição"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-32 space-y-1">
            <Label className="text-xs">Taxa (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0"
              value={novaTaxa}
              onChange={(e) => setNovaTaxa(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="sm:self-end gap-1">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
