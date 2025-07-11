"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/ui/user-menu';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  History,
  BookOpen,
  Heart,
  CreditCard,
  User,
  HelpCircle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Building,
  ChevronDown,
} from 'lucide-react';

// Types
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  submenu?: NavItem[];
}

interface User {
  name: string;
  email: string;
  company: string;
  avatar?: string;
}

// Navigation items
const navigation: NavItem[] = [
  {
    name: 'Vue d\'ensemble',
    href: '/client',
    icon: LayoutDashboard,
  },
  {
    name: 'Mes Locations',
    href: '/client/locations',
    icon: Package,
    badge: '3',
    submenu: [
      { name: 'En cours', href: '/client/locations/en-cours', icon: Package },
      { name: 'À venir', href: '/client/locations/a-venir', icon: Package },
      { name: 'En attente', href: '/client/locations/en-attente', icon: Package },
    ],
  },
  {
    name: 'Historique',
    href: '/client/history',
    icon: History,
  },
  {
    name: 'Catalogue',
    href: '/client/catalogue',
    icon: BookOpen,
  },
  {
    name: 'Favoris',
    href: '/client/favorites',
    icon: Heart,
    badge: '12',
  },
  {
    name: 'Facturation',
    href: '/client/billing',
    icon: CreditCard,
  },
  {
    name: 'Mon Profil',
    href: '/client/profile',
    icon: User,
  },
  {
    name: 'Support',
    href: '/client/support',
    icon: HelpCircle,
  },
];

// Mock user data
const mockUser: User = {
  name: 'Ahmed Ousmane',
  email: 'a.ousmane@construction-sahel.ne',
  company: 'Construction Sahel SARL',
  avatar: undefined,
};

export function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 border-r border-border",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link href="/client" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">
                  Daga Maraka
                </div>
                <div className="text-xs text-orange-500 font-medium">
                  Espace Client
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    pathname === item.href
                      ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
                
                {/* Submenu */}
                {item.submenu && pathname.startsWith(item.href) && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                          pathname === subItem.href
                            ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="w-2 h-2 bg-current rounded-full opacity-50" />
                        <span>{subItem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {mockUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">
                    {mockUser.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {mockUser.company}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* User menu */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-lg shadow-lg border border-border py-2">
                  <Link
                    href="/client/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Link>
                  <Link
                    href="/client/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                  <hr className="my-2 border-border" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-muted"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Espace Client
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gérez vos locations et projets BTP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-muted">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu - Desktop */}
              <div className="hidden md:block">
                <UserMenu />
              </div>

              {/* User info mobile - fallback */}
              <div className="md:hidden flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {mockUser.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mockUser.company}
                  </div>
                </div>
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {mockUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
