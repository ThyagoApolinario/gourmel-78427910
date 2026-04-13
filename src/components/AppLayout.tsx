import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-14 flex items-center border-b px-3 sm:px-4 bg-card sticky top-0 z-10">
            <SidebarTrigger className="mr-3 sm:mr-4 h-10 w-10 flex items-center justify-center" />
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto pb-safe">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
