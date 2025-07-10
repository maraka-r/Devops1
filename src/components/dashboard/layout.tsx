'use client';

import { DashboardNavigation } from '@/components/dashboard/navigation';
import { Button } from '@/components/ui/button-btp';
import Link from 'next/link';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar Navigation */}
        <DashboardNavigation />
        
        {/* Main Content - Adding left margin to account for fixed sidebar */}
        <div className="flex-1 flex flex-col md:ml-64">
          {/* Header */}
          <header className="bg-card border-b px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button - Only visible on mobile */}
                <DashboardNavigation mobileOnly />
                <h1 className="text-xl font-semibold">Dashboard</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>DM</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <Link href="/dashboard/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/settings">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Paramètres</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
