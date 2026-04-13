import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Lock, Shield, CheckCircle2, Dog, Cake } from 'lucide-react';
import { useProfile, type ProfileType } from '@/hooks/useProfile';

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { profile, setProfile } = useProfile();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error('Erro ao alterar senha', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Gerencie seus dados de acesso e segurança</p>
        </div>

        {/* Status da Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Dados da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium text-sm">{user?.email ?? '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ativa
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Conta criada em</Label>
                <p className="text-sm">{createdAt}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Último acesso</Label>
                <p className="text-sm">{lastSignIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perfil do Negócio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dog className="h-5 w-5 text-primary" />
              Perfil do Negócio
            </CardTitle>
            <CardDescription>Escolha o tipo da sua confeitaria para personalizar a interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setProfile('canine'); toast.success('Perfil alterado para Confeitaria Canina! 🐾'); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  profile === 'canine'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <Dog className={`h-8 w-8 ${profile === 'canine' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-sm">Canina Natural</span>
                <span className="text-xs text-muted-foreground text-center">Petiscos e biscoitos pet</span>
              </button>
              <button
                onClick={() => { setProfile('classic'); toast.success('Perfil alterado para Confeitaria Artesanal! 🎂'); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  profile === 'classic'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <Cake className={`h-8 w-8 ${profile === 'classic' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-sm">Artesanal</span>
                <span className="text-xs text-muted-foreground text-center">Bolos, doces e sobremesas</span>
              </button>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Alterar Senha
            </CardTitle>
            <CardDescription>Defina uma nova senha para sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                  placeholder="Repita a nova senha"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Indicador de Segurança */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-700">Conexão Segura</p>
                <p className="text-xs text-muted-foreground">
                  Seus dados estão protegidos com criptografia e isolamento por conta (RLS).
                  Nenhum outro usuário pode acessar suas receitas e insumos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Button variant="destructive" className="w-full" onClick={signOut}>
          Sair da Conta
        </Button>
      </div>
    </AppLayout>
  );
}
