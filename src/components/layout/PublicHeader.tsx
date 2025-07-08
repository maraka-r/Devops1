'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Wrench,
  Mail,
  Settings,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Interface pour les items de navigation
export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface DropdownNavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

// Configuration de la navigation
const navigationItems: (NavItem | DropdownNavItem)[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Matériels', href: '/materiels' },
  {
    label: 'Services',
    children: [
      {
        label: 'Ingénierie',
        href: '/services/ingenierie',
        description: 'Bureau d\'études techniques'
      },
      {
        label: 'Références',
        href: '/services/references',
        description: 'Nos projets réalisés'
      },
      {
        label: 'Location Niger',
        href: '/materiels',
        description: 'Location de matériel BTP'
      },
      {
        label: 'Tarifs',
        href: '/services/tarifs',
        description: 'Grille tarifaire location'
      }
    ]
  },
  { label: 'À Propos', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function PublicHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Gestion du scroll pour l'effet sticky
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu mobile
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 transition-all duration-300",
      isScrolled 
        ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/20" 
        : "bg-white shadow-sm border-b"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">
                  Daga Maraka
                </h1>
                <p className="text-xs text-primary font-medium">
                  BTP Ingénierie
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item, index) => (
              'children' in item ? (
                // Dropdown Menu
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors group">
                    {item.label}
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-2">
                    {item.children?.map((child, childIndex) => (
                      <DropdownMenuItem key={childIndex} asChild>
                        <Link 
                          href={child.href || '#'}
                          className="flex flex-col items-start w-full p-3 rounded-md hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">
                            {child.label}
                          </span>
                          {child.description && (
                            <span className="text-xs text-gray-500 mt-1">
                              {child.description}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Lien simple
                <Link
                  key={index}
                  href={item.href || '#'}
                  className="text-gray-700 hover:text-primary font-medium transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* User menu desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user.name}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {user.role === 'ADMIN' ? 'Admin' : 'Client'}
                    </Badge>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profil" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="text-red-600 hover:text-red-700 focus:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Connexion
                  </Link>
                </Button>
                
                <Button asChild size="sm">
                  <Link href="/auth/register">
                    S&apos;inscrire
                  </Link>
                </Button>
                
                {/* CTA Devis */}
                <Link href="/contact?type=devis">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Devis
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-6 space-y-4">
            {/* Navigation mobile */}
            <div className="space-y-3">
              {navigationItems.map((item, index) => (
                'children' in item ? (
                  // Accordéon pour les dropdowns
                  <MobileDropdown 
                    key={index} 
                    item={item} 
                    onClose={closeMobileMenu} 
                  />
                ) : (
                  // Lien simple mobile
                  <Link 
                    key={index}
                    href={item.href || '#'} 
                    className="block text-gray-700 hover:text-primary font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            <div className="border-t pt-4">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {user.role === 'ADMIN' ? 'Admin' : 'Client'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/profil" onClick={() => setMobileMenuOpen(false)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Mon profil
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Connexion
                    </Link>
                  </Button>
                  
                  <Button asChild size="sm" className="w-full">
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      S&apos;inscrire
                    </Link>
                  </Button>
                  
                  {/* CTA Devis Mobile */}
                  <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Link href="/contact?type=devis" onClick={() => setMobileMenuOpen(false)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Demander un devis
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Composant pour les dropdowns mobiles (accordéon)
interface MobileDropdownProps {
  item: DropdownNavItem;
  onClose: () => void;
}

function MobileDropdown({ item, onClose }: MobileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-primary transition-colors"
      >
        {item.label}
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform", 
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      {isOpen && (
        <div className="pl-6 space-y-2">
          {item.children?.map((child, index) => (
            <Link
              key={index}
              href={child.href || '#'}
              onClick={onClose}
              className="block px-3 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <div>
                <div className="font-medium">{child.label}</div>
                {child.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {child.description}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
