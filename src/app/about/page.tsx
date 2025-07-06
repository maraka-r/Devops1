import { MainLayout } from '@/components/layout/MainLayout';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-btp';

export default function AboutPage() {
  return (
    <MainLayout>
      <Section spacing="xl" background="white">
        <Container size="7xl" padding="lg">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              À Propos de Daga Maraka
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez notre expertise en ingénierie BTP et location de matériel au Niger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card hover>
              <CardHeader>
                <CardTitle>Notre Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Fournir des solutions d&apos;ingénierie et de location de matériel BTP 
                  de qualité pour accompagner le développement des infrastructures au Niger.
                </p>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Notre Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Devenir le partenaire de référence pour tous les projets BTP 
                  en offrant expertise technique et matériel de pointe.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </MainLayout>
  );
}
