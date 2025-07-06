'use client';

import { Header } from '@/components/layout/Header';
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
      {/* Header principal */}
      <Header />
      
      {/* Contenu principal avec padding-top pour compenser le header fixe */}
      <main className="pt-16 flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
