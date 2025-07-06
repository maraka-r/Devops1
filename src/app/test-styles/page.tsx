export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Test des Styles</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Test Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Test Card 1</h2>
            <p className="text-gray-600 mb-4">
              Ceci est un test pour vérifier que les styles Tailwind CSS sont correctement appliqués.
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
              Bouton Test
            </button>
          </div>

          {/* Test Card 2 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Test Card 2</h2>
            <p className="text-green-700 mb-4">
              Cette carte teste les couleurs vertes et les bordures.
            </p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded">
              Bouton Vert
            </button>
          </div>

          {/* Test Card 3 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-purple-800 mb-4">Test Card 3</h2>
            <p className="text-purple-700 mb-4">
              Dernière carte pour tester les couleurs violettes.
            </p>
            <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded">
              Bouton Violet
            </button>
          </div>
        </div>

        {/* Test de différentes utilités */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Test des Utilités</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <span className="text-lg font-medium">Flexbox Test</span>
              <div className="flex space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-100 text-blue-800 p-4 rounded text-center">Grid 1</div>
              <div className="bg-red-100 text-red-800 p-4 rounded text-center">Grid 2</div>
              <div className="bg-green-100 text-green-800 p-4 rounded text-center">Grid 3</div>
              <div className="bg-yellow-100 text-yellow-800 p-4 rounded text-center">Grid 4</div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">Si vous voyez des styles colorés et espacés, Tailwind CSS fonctionne !</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
