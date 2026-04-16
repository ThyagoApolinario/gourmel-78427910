import { Package, BookOpen, LogOut, Tags, Settings, BarChart3, UserCircle, HelpCircle, Dog, ShoppingBag, CalendarRange, Wallet, Target, CreditCard, Gift } from 'lucide-react';
import logoGourmel from '@/assets/Logo_Gourmel.jpeg';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile, labels } = useProfile();

  const menuItems = [
    { title: labels.insumos, url: '/', icon: profile === 'canine' ? Dog : Package },
    { title: labels.receitas, url: '/receitas', icon: BookOpen },
    { title: labels.kits, url: '/kits', icon: Gift },
    { title: labels.vendas, url: '/vendas', icon: ShoppingBag },
    { title: labels.categorias, url: '/categorias', icon: Tags },
    { title: labels.dashboard, url: '/dashboard', icon: BarChart3 },
    { title: labels.relatorio, url: '/relatorio', icon: CalendarRange },
    { title: labels.relatorioMetodos, url: '/relatorio-metodos', icon: CreditCard },
    { title: labels.custosFixos, url: '/custos-fixos', icon: Wallet },
    { title: labels.pontoEquilibrio, url: '/ponto-equilibrio', icon: Target },
    { title: labels.configuracoes, url: '/configuracoes', icon: Settings },
    { title: labels.perfil, url: '/perfil', icon: UserCircle },
    { title: labels.ajuda, url: '/ajuda', icon: HelpCircle },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <img src={logoGourmel} alt="Gourmel" className="h-7 w-7 object-contain" />
              {!collapsed && <span className="font-semibold text-xs">{labels.appName}</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          className="w-full justify-start text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
