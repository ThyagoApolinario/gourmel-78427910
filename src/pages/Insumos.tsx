import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { AppLayout } from '@/components/AppLayout';
import { InsumoForm } from '@/components/InsumoForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatarCusto } from '@/lib/smart-units';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';

interface Insumo {
  id: string;
  nome: string;
  marca: string | null;
  fornecedor: string | null;
  categoria: 'ingrediente' | 'embalagem';
  preco_compra: number;
  peso_volume_embalagem: number;
  unidade_medida: 'g' | 'kg' | 'ml' | 'l' | 'un';
  custo_unitario: number | null;
}

export default function Insumos() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Insumo | null>(null);

  const { data: insumos = [], isLoading } = useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Insumo[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('insumos').insert({
        user_id: user!.id,
        nome: form.nome,
        marca: form.marca || null,
        fornecedor: form.fornecedor || null,
        categoria: form.categoria,
        preco_compra: parseFloat(form.preco_compra),
        peso_volume_embalagem: parseFloat(form.peso_volume_embalagem),
        unidade_medida: form.unidade_medida,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      setShowForm(false);
      toast({ title: 'Insumo cadastrado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('insumos').update({
        nome: form.nome,
        marca: form.marca || null,
        fornecedor: form.fornecedor || null,
        categoria: form.categoria,
        preco_compra: parseFloat(form.preco_compra),
        peso_volume_embalagem: parseFloat(form.peso_volume_embalagem),
        unidade_medida: form.unidade_medida,
      }).eq('id', editing!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      setEditing(null);
      toast({ title: 'Insumo atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insumos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      toast({ title: 'Insumo removido!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const ingredientes = insumos.filter(i => i.categoria === 'ingrediente');
  const embalagens = insumos.filter(i => i.categoria === 'embalagem');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <OnboardingChecklist />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Insumos</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Gerencie matérias-primas e embalagens</p>
          </div>
          {!showForm && !editing && (
            <Button onClick={() => setShowForm(true)} className="shrink-0 h-10">
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          )}
        </div>

        {(showForm || editing) && (
          <InsumoForm
            onSubmit={editing ? updateMutation.mutateAsync : createMutation.mutateAsync}
            initialData={editing ? {
              nome: editing.nome,
              marca: editing.marca || '',
              fornecedor: editing.fornecedor || '',
              categoria: editing.categoria,
              preco_compra: String(editing.preco_compra),
              peso_volume_embalagem: String(editing.peso_volume_embalagem),
              unidade_medida: editing.unidade_medida,
            } : null}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {isLoading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
        ) : insumos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum insumo cadastrado</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <InsumoTable
              title="🧈 Ingredientes"
              items={ingredientes}
              onEdit={setEditing}
              onDelete={isAdmin ? (id) => deleteMutation.mutate(id) : undefined}
            />
            <InsumoTable
              title="📦 Embalagens"
              items={embalagens}
              onEdit={setEditing}
              onDelete={isAdmin ? (id) => deleteMutation.mutate(id) : undefined}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}

function InsumoTable({ title, items, onEdit, onDelete }: {
  title: string;
  items: Insumo[];
  onEdit: (i: Insumo) => void;
  onDelete?: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Marca</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Custo/un</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{item.nome}</span>
                      <span className="block text-xs text-muted-foreground md:hidden">{item.marca}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{item.marca || '—'}</TableCell>
                  <TableCell>
                    <div>
                      <span>{formatarCusto(item.preco_compra)}</span>
                      <span className="block text-xs text-muted-foreground">{item.peso_volume_embalagem} {item.unidade_medida}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.custo_unitario ? formatarCusto(item.custo_unitario) : '—'}/{item.unidade_medida}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {onDelete && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => onDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
