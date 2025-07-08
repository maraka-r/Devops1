'use client';

import { ReactNode } from 'react';
import { PublicHeader } from './PublicHeader';
import Footer from '@/components/layout/Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
