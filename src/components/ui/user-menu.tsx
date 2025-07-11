'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ChevronDown,
  Settings,
  LogOut,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
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
          <Link href="/" className="flex items-center">
            <Home className="h-4 w-4 mr-2" />
            Accueil
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
{/*         
        {user.role === 'ADMIN' ? (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Dashboard Admin
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/client" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Espace Client
            </Link>
          </DropdownMenuItem>
        )} */}
        
        <DropdownMenuItem asChild>
          <Link href="/profil" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => logout()}
          className="text-red-600 hover:text-red-700 focus:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
