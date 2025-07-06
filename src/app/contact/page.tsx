import { MainLayout } from '@/components/layout/MainLayout';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-btp';
import { Button } from '@/components/ui/button-btp';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <MainLayout>
      <Section spacing="xl" background="white">
        <Container size="7xl" padding="lg">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contactez-Nous
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous sommes là pour répondre à vos besoins en ingénierie et location de matériel BTP.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Informations de contact */}
            <div className="space-y-8">
              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-btp-orange-500" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">contact@dagamaraka.ne</p>
                  <p className="text-gray-600">devis@dagamaraka.ne</p>
                </CardContent>
              </Card>

              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-btp-orange-500" />
                    Téléphone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">+227 XX XX XX XX</p>
                  <p className="text-gray-600">+227 XX XX XX XX</p>
                </CardContent>
              </Card>

              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-btp-orange-500" />
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Niamey, Niger<br />
                    Zone industrielle
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Formulaire de contact */}
            <Card hover>
              <CardHeader>
                <CardTitle>Demande de Devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Nom" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-btp-orange-500 focus:border-transparent"
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-btp-orange-500 focus:border-transparent"
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Sujet" 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-btp-orange-500 focus:border-transparent"
                />
                <textarea 
                  rows={6}
                  placeholder="Décrivez votre projet ou vos besoins..." 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-btp-orange-500 focus:border-transparent"
                />
                <Button variant="gradient" className="w-full">
                  Envoyer la Demande
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </MainLayout>
  );
}
