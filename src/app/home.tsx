import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Daga Maraka</h1>
              <span className="ml-2 text-sm text-gray-500">BTP Solutions</span>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/auth/login" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Connexion
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Inscription
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Location de Matériel BTP
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Daga Maraka : Votre partenaire de confiance pour la location d&apos;équipements BTP. 
            Grues, télescopiques, nacelles et plus encore pour tous vos projets de construction.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link 
              href="/materiels" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Voir le Matériel
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Commencer
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Équipements Modernes</h3>
            <p className="text-gray-600">
              Parc moderne de grues, télescopiques et nacelles entretenus régulièrement pour garantir sécurité et performance.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Disponibilité 24/7</h3>
            <p className="text-gray-600">
              Réservation en ligne simple et rapide. Vérification de disponibilité en temps réel pour planifier vos projets.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Expert</h3>
            <p className="text-gray-600">
              Équipe technique expérimentée pour vous conseiller et vous accompagner dans le choix du matériel adapté.
            </p>
          </div>
        </div>
      </section>

      {/* Equipment Types */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Notre Matériel</h3>
            <p className="text-xl text-gray-600">Découvrez notre gamme complète d&apos;équipements BTP</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Grues Mobiles</h4>
              <p className="text-gray-600">Grues mobiles de 25 à 200 tonnes pour tous vos travaux de levage</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Télescopiques</h4>
              <p className="text-gray-600">Chariots télescopiques pour la manutention et le transport</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Nacelles</h4>
              <p className="text-gray-600">Nacelles élévatrices pour travaux en hauteur en toute sécurité</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Équipements Spécialisés</h4>
              <p className="text-gray-600">Matériel spécialisé pour répondre à tous vos besoins</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Prêt à démarrer votre projet ?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Réservez dès maintenant le matériel dont vous avez besoin
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/auth/register" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Créer un Compte
            </Link>
            <Link 
              href="/materiels" 
              className="bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Voir les Équipements
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Daga Maraka</h4>
              <p className="text-gray-400">
                Votre partenaire de confiance pour la location de matériel BTP en France et au Niger.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Location de grues</li>
                <li>Location de télescopiques</li>
                <li>Location de nacelles</li>
                <li>Conseil technique</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Zones d&apos;intervention</h4>
              <ul className="space-y-2 text-gray-400">
                <li>France (Conseil)</li>
                <li>Niger (Location)</li>
                <li>Afrique de l&apos;Ouest</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: contact@daga-maraka.com</li>
                <li>Téléphone: +33 1 23 45 67 89</li>
                <li>Niger: +227 20 XX XX XX</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Daga Maraka. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
