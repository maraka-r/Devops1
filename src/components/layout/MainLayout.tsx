'use client';

import { PublicHeader } from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal de l'application avec header et footer
 * Utilisé pour les pages publiques (accueil, services, contact, etc.)
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header principal fusionné */}
      <PublicHeader />
      
      {/* Contenu principal */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
