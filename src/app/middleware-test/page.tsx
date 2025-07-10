'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MiddlewareTestPage() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDashboardAccess = () => {
    addTestResult('🧪 Test accès /dashboard...');
    router.push('/dashboard');
  };

  const testClientAccess = () => {
    addTestResult('🧪 Test accès /client...');
    router.push('/client');
  };

  const loginAsAdmin = async () => {
    try {
      addTestResult('🔑 Connexion en tant qu\'admin...');
      await login({ email: 'admin@maraka.fr', password: 'password123' });
      addTestResult('✅ Connexion admin réussie');
    } catch (error) {
      addTestResult(`❌ Erreur connexion admin: ${error}`);
    }
  };

  const loginAsClient = async () => {
    try {
      addTestResult('🔑 Connexion en tant que client...');
      await login({ email: 'jean.martin@entreprise-martin.fr', password: 'password123' });
      addTestResult('✅ Connexion client réussie');
    } catch (error) {
      addTestResult(`❌ Erreur connexion client: ${error}`);
    }
  };

  const handleLogout = async () => {
    try {
      addTestResult('🚪 Déconnexion...');
      await logout();
      addTestResult('✅ Déconnexion réussie');
    } catch (error) {
      addTestResult(`❌ Erreur déconnexion: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Test du Middleware de Protection des Routes
          </h1>

          {/* État de l'authentification */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">État d&apos;authentification</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Connecté:</span> {isAuthenticated ? '✅ Oui' : '❌ Non'}</p>
              {user && (
                <>
                  <p><span className="font-medium">Utilisateur:</span> {user.name}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Rôle:</span> <span className={`px-2 py-1 rounded text-sm ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></p>
                </>
              )}
            </div>
          </div>

          {/* Actions de test */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Actions de test</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tests de connexion */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Connexion</h3>
                <button
                  onClick={loginAsAdmin}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Se connecter comme ADMIN
                </button>
                <button
                  onClick={loginAsClient}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Se connecter comme CLIENT
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>

              {/* Tests d'accès */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Accès aux routes</h3>
                <button
                  onClick={testDashboardAccess}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Accéder à /dashboard
                </button>
                <button
                  onClick={testClientAccess}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  Accéder à /client
                </button>
              </div>
            </div>
          </div>

          {/* Explications */}
          <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🎯 Comportements attendus</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Si ADMIN essaie d&apos;accéder à /client:</strong> Redirection vers /dashboard</p>
              <p><strong>Si CLIENT (USER) essaie d&apos;accéder à /dashboard:</strong> Redirection vers /client</p>
              <p><strong>Si non connecté:</strong> Redirection vers /auth/login</p>
              <p><strong>Page d&apos;accueil (/):</strong> Redirection automatique selon le rôle si connecté</p>
            </div>
          </div>

          {/* Journal des tests */}
          <div>
            <h2 className="text-xl font-semibold mb-4">📝 Journal des tests</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">Aucun test effectué...</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Effacer le journal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
