import { MainLayout } from '@/components/layout/MainLayout';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            À Propos de Daga Maraka
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre expertise en ingénierie BTP et location de matériel au Niger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Notre Mission</h3>
            <p className="text-gray-600">
              Fournir des solutions d&apos;ingénierie et de location de matériel BTP 
              de qualité pour accompagner le développement des infrastructures au Niger.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Notre Vision</h3>
            <p className="text-gray-600">
              Devenir le partenaire de référence pour tous les projets BTP 
              en offrant expertise technique et matériel de pointe.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
