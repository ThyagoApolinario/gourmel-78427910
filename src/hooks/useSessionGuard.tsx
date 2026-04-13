import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSessionGuard() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        // Session refreshed successfully - no action needed
      }
      if (event === 'SIGNED_OUT') {
        toast.error('Sessão encerrada', {
          description: 'Faça login novamente para continuar.',
        });
      }
    });

    // Periodic session check every 5 minutes
    const interval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        toast.error('Sessão expirada', {
          description: 'Sua sessão expirou. Faça login novamente.',
        });
        await supabase.auth.signOut();
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);
}
