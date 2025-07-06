import { Metadata } from 'next';
import { ClientDashboardLayout } from '@/components/layout/ClientDashboardLayout';

export const metadata: Metadata = {
  title: 'Espace Client - Daga Maraka BTP',
  description: 'Gérez vos locations de matériel BTP, consultez vos factures et suivez vos projets.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientDashboardLayout>{children}</ClientDashboardLayout>;
}
