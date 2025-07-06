import type { Metadata } from 'next';
import { ClientOverview } from '@/components/client/ClientOverview';

export const metadata: Metadata = {
  title: 'Vue d\'ensemble - Espace Client',
  description: 'Tableau de bord de votre espace client Daga Maraka BTP',
};

export default function ClientDashboardPage() {
  return <ClientOverview />;
}
