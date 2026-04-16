import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProfileProvider } from "@/hooks/useProfile";
import Auth from "./pages/Auth";
import Insumos from "./pages/Insumos";
import Receitas from "./pages/Receitas";
import Vendas from "./pages/Vendas";
import RelatorioMensal from "./pages/RelatorioMensal";
import CustosFixos from "./pages/CustosFixos";
import Categorias from "./pages/Categorias";
import Configuracoes from "./pages/Configuracoes";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Ajuda from "./pages/Ajuda";
import PontoEquilibrio from "./pages/PontoEquilibrio";
import RelatorioMetodos from "./pages/RelatorioMetodos";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { useSessionGuard } from "./hooks/useSessionGuard";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  useSessionGuard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <Routes>
      <Route path="/" element={<Insumos />} />
      <Route path="/receitas" element={<Receitas />} />
      <Route path="/vendas" element={<Vendas />} />
      <Route path="/relatorio" element={<RelatorioMensal />} />
      <Route path="/custos-fixos" element={<CustosFixos />} />
      <Route path="/ponto-equilibrio" element={<PontoEquilibrio />} />
      <Route path="/categorias" element={<Categorias />} />
      <Route path="/relatorio-metodos" element={<RelatorioMetodos />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/ajuda" element={<Ajuda />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <Routes>
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
