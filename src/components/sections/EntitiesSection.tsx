'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-btp';
import { Button } from '@/components/ui/button-btp';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';
import { 
  HardHat, 
  Construction, 
  CheckCircle,
  ArrowRight,
  MapPin,
  Users,
  Truck
} from 'lucide-react';
import Link from 'next/link';

// Interface pour les services
interface ServiceItem {
  label: string;
  description: string;
}

// Données des services pour chaque entité
const dagaMarakaServices: ServiceItem[] = [
  {
    label: 'Maîtrise d\'œuvre',
    description: 'Pilotage complet de vos projets BTP'
  },
  {
    label: 'Suivi de chantiers',
    description: 'Supervision technique et qualité'
  },
  {
    label: 'AMO (Assistance Maîtrise d\'Ouvrage)',
    description: 'Conseil stratégique et technique'
  },
  {
    label: 'Études techniques',
    description: 'Conception et dimensionnement'
  }
];

const nigerServices: ServiceItem[] = [
  {
    label: 'Grues mobiles',
    description: 'Grues tout terrain et automotrices'
  },
  {
    label: 'Télescopiques',
    description: 'Chargeurs et manipulateurs'
  },
  {
    label: 'Nacelles élévatrices',
    description: 'Travaux en hauteur sécurisés'
  },
  {
    label: 'Engins de chantier',
    description: 'Matériel BTP complet'
  }
];

export function EntitiesSection() {
  return (
    <Section spacing="xl" background="gray" as="section">
      <Container size="7xl" padding="lg">
        {/* En-tête de section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Nos Deux Entités Complémentaires
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une expertise double pour répondre à tous vos besoins BTP : 
            du conseil en France à la location d&apos;équipements au Niger.
          </p>
        </div>

        {/* Grid des deux entités */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Entité France - Daga Maraka */}
          <Card hover className="h-full group">
            <CardHeader className="text-center pb-6">
              {/* Icône principale */}
              <div className="w-20 h-20 bg-btp-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-btp-orange-200 transition-colors">
                <HardHat className="h-10 w-10 text-btp-orange-600" />
              </div>
              
              {/* Localisation */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500 font-medium">France</span>
              </div>
              
              <CardTitle className="text-2xl text-gray-900 mb-2">
                Daga Maraka France
              </CardTitle>
              <p className="text-lg text-btp-orange-600 font-semibold">
                Conseil & Ingénierie BTP
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <p className="text-gray-600 text-center">
                Bureau d&apos;études et conseil technique pour l&apos;accompagnement 
                de vos projets de construction et d&apos;infrastructure.
              </p>

              {/* Liste des services */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-btp-orange-500" />
                  Nos Services
                </h4>
                <ul className="space-y-3">
                  {dagaMarakaServices.map((service, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">
                          {service.label}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <Link href="/services/daga-maraka">
                  <Button variant="primary" className="w-full gap-2">
                    Découvrir nos services
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Entité Niger - Location */}
          <Card hover className="h-full group">
            <CardHeader className="text-center pb-6">
              {/* Icône principale */}
              <div className="w-20 h-20 bg-btp-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-btp-blue-200 transition-colors">
                <Construction className="h-10 w-10 text-btp-blue-600" />
              </div>
              
              {/* Localisation */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500 font-medium">Niger</span>
              </div>
              
              <CardTitle className="text-2xl text-gray-900 mb-2">
                Entreprise Niger
              </CardTitle>
              <p className="text-lg text-btp-blue-600 font-semibold">
                Location Matériel BTP
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <p className="text-gray-600 text-center">
                Parc de matériel moderne et performant pour tous vos besoins 
                de levage et de manutention sur chantier.
              </p>

              {/* Liste des équipements */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-btp-blue-500" />
                  Nos Équipements
                </h4>
                <ul className="space-y-3">
                  {nigerServices.map((service, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">
                          {service.label}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <Link href="/services/location-niger">
                  <Button variant="secondary" className="w-full gap-2">
                    Voir le catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section bas avec statistiques */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-btp-orange-600 mb-2">15+</div>
            <p className="text-gray-600">Années d&apos;expertise</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-btp-blue-600 mb-2">2</div>
            <p className="text-gray-600">Pays d&apos;intervention</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
            <p className="text-gray-600">Support disponible</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default EntitiesSection;
