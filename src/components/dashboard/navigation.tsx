'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Wrench, 
  FileText, 
  Users, 
  User,
  Settings, 
  Menu, 
  BarChart3,
  Calendar,
  Bell,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Matériel', href: '/dashboard/materiels', icon: Wrench },
  { name: 'Locations', href: '/dashboard/locations', icon: FileText },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Calendrier', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Rapports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

interface DashboardNavigationProps {
  mobileOnly?: boolean;
}

export function DashboardNavigation({ mobileOnly = false }: DashboardNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ item, mobile = false }: { item: typeof navigation[0], mobile?: boolean }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        } ${mobile ? 'w-full' : ''}`}
        onClick={() => mobile && setIsOpen(false)}
      >
        <Icon className="h-4 w-4" />
        {item.name}
        {item.name === 'Notifications' && (
          <Badge variant="destructive" className="ml-auto">
            3
          </Badge>
        )}
      </Link>
    );
  };

  // Si mobileOnly est true, ne retourner que le bouton mobile
  if (mobileOnly) {
    return (
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Daga Maraka</h2>
                <p className="text-sm text-muted-foreground">Gestion BTP</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} mobile />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block w-64 bg-card border-r fixed top-0 bottom-0 left-0 overflow-y-auto">
        <div className="flex flex-col justify-between h-full p-6">
          {/* Top section with logo and navigation */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Daga Maraka</h2>
                <p className="text-sm text-muted-foreground">Gestion BTP</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </nav>
          </div>
          
          {/* Bottom section with user info and actions */}
          <div className="mt-auto pt-6 border-t">
            <Link href="/dashboard/profile" className="block mb-4">
              <div className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-sm text-muted-foreground">admin@dagamaraka.com</p>
                </div>
              </div>
            </Link>
            
            <div className="space-y-2">
              
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
              
              <Link 
                href="/logout" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Daga Maraka</h2>
                <p className="text-sm text-muted-foreground">Gestion BTP</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} mobile />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
