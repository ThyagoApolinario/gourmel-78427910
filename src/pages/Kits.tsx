import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KitForm } from '@/components/KitForm';
import { Gift, Plus, Pencil, Trash2, PartyPopper, Power, PowerOff } from 'lucide-react';
import { formatarCusto } from '@/lib/smart-units';

interface Kit {
  id: string;
  nome: string;
  descricao: string | null;
  tempo_montagem_minutos: number;
  zerar_mao_obra: boolean;
  preco_final_manual: number | null;
  desconto_percentual: number | null;
  ativo: boolean;
}

export default function Kits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: kits = [] } = useQuery({
    queryKey: ['kits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kits')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Kit[];
    },
    enabled: !!user,
  });

  const { data: kitItensCount = {} } = useQuery({
    queryKey: ['kit-itens-count', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('kit_itens').select('kit_id').eq('user_id', user!.id);
      const counts: Record<string, number> = {};
      for (const r of (data || []) as { kit_id: string }[]) {
        counts[r.kit_id] = (counts[r.kit_id] || 0) + 1;
      }
      return counts;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kits'] });
      toast({ title: 'Kit removido' });
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('kits').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kits'] }),
  });

  if (showForm) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto pb-12">
          <KitForm kitId={editId} onClose={() => { setShowForm(false); setEditId(null); }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-accent" />
              Kits e Combos
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Bundles estratégicos com precificação diferenciada 🎁
            </p>
          </div>
          <Button onClick={() => { setEditId(null); setShowForm(true); }} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Novo Kit</span><span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {kits.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <PartyPopper className="h-12 w-12 mx-auto text-accent/40" />
              <h3 className="font-semibold">Crie seu primeiro Kit ✨</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Combine receitas + insumos em pacotes especiais com preço estratégico. Ideal para datas comemorativas, brindes e promoções.
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2 mt-2">
                <Gift className="h-4 w-4" /> Criar primeiro Kit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kits.map(kit => {
              const itens = kitItensCount[kit.id] || 0;
              return (
                <Card
                  key={kit.id}
                  className={`transition-all hover:border-accent/40 ${!kit.ativo ? 'opacity-60' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2 min-w-0">
                        <Gift className="h-4 w-4 text-accent shrink-0" />
                        <span className="truncate">{kit.nome}</span>
                      </CardTitle>
                      {!kit.ativo && <Badge variant="outline" className="text-[10px]">Arquivado</Badge>}
                    </div>
                    {kit.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{kit.descricao}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <PartyPopper className="h-2.5 w-2.5" /> {itens} {itens === 1 ? 'item' : 'itens'}
                      </Badge>
                      {kit.tempo_montagem_minutos > 0 && !kit.zerar_mao_obra && (
                        <Badge variant="outline" className="text-[10px]">
                          {kit.tempo_montagem_minutos} min montagem
                        </Badge>
                      )}
                      {kit.zerar_mao_obra && (
                        <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                          Mão de obra zerada
                        </Badge>
                      )}
                      {kit.preco_final_manual != null && (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-0">
                          Preço fixo {formatarCusto(Number(kit.preco_final_manual))}
                        </Badge>
                      )}
                      {kit.desconto_percentual != null && (
                        <Badge className="text-[10px] bg-accent/15 text-accent border-0">
                          −{kit.desconto_percentual}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setEditId(kit.id); setShowForm(true); }}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={kit.ativo ? 'Arquivar' : 'Reativar'}
                        onClick={() => toggleAtivoMutation.mutate({ id: kit.id, ativo: !kit.ativo })}
                      >
                        {kit.ativo ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5 text-success" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Excluir "${kit.nome}"?`)) deleteMutation.mutate(kit.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
