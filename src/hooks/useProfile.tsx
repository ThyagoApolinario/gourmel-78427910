import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ProfileType = 'canine' | 'classic';

interface ProfileContextType {
  profile: ProfileType;
  setProfile: (p: ProfileType) => void;
  labels: typeof CANINE_LABELS;
}

const CANINE_LABELS = {
  appName: 'Gourmel Pet — Confeitaria Canina Natural',
  appSubtitle: 'Sistema de gestão para confeitaria canina natural 🐾',
  insumos: 'Ingredientes Naturais',
  insumosDesc: 'Gerencie ingredientes e embalagens pet-friendly',
  receitas: 'Receitas Pet',
  receitasDesc: 'Fichas técnicas para petiscos e biscoitos naturais',
  categorias: 'Categorias',
  configuracoes: 'Configurações',
  dashboard: 'Painel de Vendas',
  vendas: 'Vendas Pet',
  relatorio: 'Relatório Mensal',
  ajuda: 'Guia de Nutrição e Lucro',
  perfil: 'Meu Perfil',
  novoInsumo: 'Novo Ingrediente Natural',
  custoInsumos: 'Custo de Ingredientes Naturais',
  sucessoPreco: 'Preço sugerido gerado com sucesso! Lucro garantido, saúde no prato. 🐶',
  heroTitle: 'A Essência Natural na Tigela do Seu Cão',
  heroSubtitle: 'Precificação sem corantes, sem glúten. Construa seu negócio de confeitaria pet com amor e precisão.',
  welcomeBack: 'Bem-vinda de volta! 🐾',
};

const CLASSIC_LABELS = {
  appName: 'Gourmel Doce Gestão',
  appSubtitle: 'Sistema de gestão para confeitaria artesanal',
  insumos: 'Insumos',
  insumosDesc: 'Gerencie matérias-primas e embalagens',
  receitas: 'Receitas',
  receitasDesc: 'Fichas técnicas para suas receitas',
  categorias: 'Categorias',
  configuracoes: 'Configurações',
  dashboard: 'Dashboard',
  vendas: 'Vendas',
  relatorio: 'Relatório Mensal',
  ajuda: 'Central de Ajuda',
  perfil: 'Meu Perfil',
  novoInsumo: 'Novo Insumo',
  custoInsumos: 'Custo de Insumos',
  sucessoPreco: 'Preço sugerido gerado com sucesso! 🎂',
  heroTitle: 'Doce Gestão para sua Confeitaria',
  heroSubtitle: 'Precificação inteligente para confeitaria artesanal. Controle custos e maximize seus lucros.',
  welcomeBack: 'Bem-vinda de volta! 🎂',
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileType>(() => {
    return (localStorage.getItem('gourmel-profile') as ProfileType) || 'canine';
  });

  const setProfile = (p: ProfileType) => {
    setProfileState(p);
    localStorage.setItem('gourmel-profile', p);

    // Apply/remove theme class
    if (p === 'classic') {
      document.documentElement.classList.add('theme-classic');
    } else {
      document.documentElement.classList.remove('theme-classic');
    }
  };

  useEffect(() => {
    if (profile === 'classic') {
      document.documentElement.classList.add('theme-classic');
    }
  }, []);

  const labels = profile === 'canine' ? CANINE_LABELS : CLASSIC_LABELS;

  return (
    <ProfileContext.Provider value={{ profile, setProfile, labels }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
}
