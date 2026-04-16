import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
}

export default function Categorias() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['categorias', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias_receita').select('*').eq('user_id', user!.id).order('nome');
      if (error) throw error;
      return data as Categoria[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from('categorias_receita').update({ nome, descricao: descricao || null }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categorias_receita').insert({ user_id: user!.id, nome, descricao: descricao || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      resetForm();
      toast({ title: editing ? 'Categoria atualizada!' : 'Categoria criada!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categorias_receita').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast({ title: 'Categoria removida!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setNome('');
    setDescricao('');
  };

  const startEdit = (cat: Categoria) => {
    setEditing(cat);
    setNome(cat.nome);
    setDescricao(cat.descricao || '');
    setShowForm(true);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Categorias</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Organize suas receitas por tipo</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="shrink-0 h-10">
              <Plus className="h-4 w-4 mr-1" /> Nova
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader><CardTitle className="text-lg">{editing ? 'Editar' : 'Nova'} Categoria</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Bolos" required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Bolos de festa e confeitados" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
        ) : categorias.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Tags className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhuma categoria criada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {categorias.map(cat => (
              <Card key={cat.id}>
                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{cat.nome}</p>
                    {cat.descricao && <p className="text-sm text-muted-foreground truncate">{cat.descricao}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => startEdit(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => deleteMutation.mutate(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
