'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
          Une erreur s&apos;est produite
        </h2>
        
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Impossible de charger votre espace client. Veuillez réessayer ou contactez le support si le problème persiste.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-btp-orange-500 text-white rounded-lg hover:bg-btp-orange-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
        
        {error.digest && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-6">
            Code d&apos;erreur: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
