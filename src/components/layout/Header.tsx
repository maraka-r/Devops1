'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button-btp';
import { Container } from '@/components/shared/Container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Sun, 
  Moon,
  Wrench,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  {
    label: 'Services',
    children: [
      {
        label: 'Daga Maraka',
        href: '/services/daga-maraka',
        description: 'Ingénierie et références projets'
      },
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
        label: 'Matériel',
        href: '/services/materiel',
        description: 'Catalogue équipements'
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

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Gestion du scroll pour l'effet sticky
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Ici vous pouvez ajouter la logique pour changer le thème
    document.documentElement.classList.toggle('dark');
  };

  // Fermer le menu mobile
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/20 dark:border-gray-700/20" 
          : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      )}
    >
      <Container size="7xl" padding="none">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-btp-orange-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Daga Maraka
              </h1>
              <p className="text-xs text-btp-orange-600 dark:text-btp-orange-400 font-medium">
                BTP Ingénierie
              </p>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item, index) => (
              'children' in item ? (
                // Dropdown Menu
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-btp-orange-600 dark:hover:text-btp-orange-400 transition-colors group">
                    {item.label}
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-2">
                    {item.children?.map((child, childIndex) => (
                      <DropdownMenuItem key={childIndex} asChild>
                        <Link 
                          href={child.href || '#'}
                          className="flex flex-col items-start w-full p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            {child.label}
                          </span>
                          {child.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-btp-orange-600 dark:hover:text-btp-orange-400 transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* Toggle Dark Mode */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Connexion */}
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Connexion
              </Button>
            </Link>

            {/* CTA Devis Gratuit */}
            <Link href="/contact?type=devis">
              <Button variant="primary" size="sm" className="gap-2">
                <Mail className="h-4 w-4" />
                Devis Gratuit
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-6 space-y-6">
              {/* Navigation Mobile */}
              <nav className="space-y-4">
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
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-btp-orange-600 dark:hover:text-btp-orange-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </nav>

              {/* Actions Mobile */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Toggle Dark Mode Mobile */}
                <Button
                  variant="outline"
                  onClick={toggleDarkMode}
                  className="w-full justify-start gap-3"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Mode Clair
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Mode Sombre
                    </>
                  )}
                </Button>

                {/* Connexion Mobile */}
                <Link href="/auth/login" onClick={closeMobileMenu}>
                  <Button variant="outline" className="w-full">
                    Connexion
                  </Button>
                </Link>

                {/* CTA Mobile */}
                <Link href="/contact?type=devis" onClick={closeMobileMenu}>
                  <Button variant="gradient" className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    Demander un Devis Gratuit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
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
        className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-btp-orange-600 dark:hover:text-btp-orange-400 transition-colors"
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
              className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-btp-orange-600 dark:hover:text-btp-orange-400 transition-colors"
            >
              <div>
                <div className="font-medium">{child.label}</div>
                {child.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
