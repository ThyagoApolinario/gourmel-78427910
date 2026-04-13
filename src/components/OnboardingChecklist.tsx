import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step {
  key: string;
  label: string;
  descricao: string;
  route: string;
}

const STEPS: Step[] = [
  { key: 'config', label: 'Configurar seu pró-labore', descricao: 'Defina quanto você quer ganhar e suas horas de trabalho', route: '/configuracoes' },
  { key: 'insumo', label: 'Cadastrar primeiro insumo', descricao: 'Adicione uma matéria-prima ou embalagem', route: '/' },
  { key: 'receita', label: 'Criar primeira receita', descricao: 'Monte a ficha técnica de um produto', route: '/receitas' },
];

export function OnboardingChecklist() {
  const navigate = useNavigate();

  const { data: configCount = 0 } = useQuery({
    queryKey: ['onboard_config'],
    queryFn: async () => {
      const { count } = await supabase.from('configuracoes_financeiras').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: insumosCount = 0 } = useQuery({
    queryKey: ['onboard_insumos'],
    queryFn: async () => {
      const { count } = await supabase.from('insumos').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: receitasCount = 0 } = useQuery({
    queryKey: ['onboard_receitas'],
    queryFn: async () => {
      const { count } = await supabase.from('receitas').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const completed: Record<string, boolean> = {
    config: configCount > 0,
    insumo: insumosCount > 0,
    receita: receitasCount > 0,
  };

  const allDone = Object.values(completed).every(Boolean);
  if (allDone) return null;

  const doneCount = Object.values(completed).filter(Boolean).length;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Primeiros Passos — {doneCount}/{STEPS.length} concluídos
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Siga esses passos para configurar sua confeitaria e começar a precificar com precisão! 🎂
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {STEPS.map(step => {
          const done = completed[step.key];
          return (
            <button
              key={step.key}
              onClick={() => !done && navigate(step.route)}
              disabled={done}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                done
                  ? 'bg-muted/30 opacity-60'
                  : 'bg-card hover:bg-accent/50 cursor-pointer'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${done ? 'line-through' : ''}`}>{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.descricao}</p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
