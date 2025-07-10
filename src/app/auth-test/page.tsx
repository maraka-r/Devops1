'use client';

import { useEffect, useState } from 'react';
import { decodeToken } from '@/lib/jwt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AuthTestPage() {
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Récupérer le token du localStorage (côté client uniquement)
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Aucun token trouvé. Veuillez vous connecter.');
          return;
        }
        
        // Décoder le token sans vérifier (pour affichage)
        const decoded = decodeToken(token);
        if (decoded) {
          setUser({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
          });
        }
      } catch (err) {
        setError('Erreur lors de la vérification du token');
        console.error(err);
      }
    };
    
    checkAuth();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test d&apos;authentification</CardTitle>
          <CardDescription>Vérification de l&apos;état d&apos;authentification actuel</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          ) : user ? (
            <div className="space-y-4">
              <p><strong>État:</strong> Authentifié</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rôle:</strong> {user.role}</p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
              Vérification de l&apos;authentification...
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/auth/login">
            <Button variant="outline">Connexion</Button>
          </Link>
          <Link href="/">
            <Button>Retour à l&apos;accueil</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}