'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-btp';
import { Button } from '@/components/ui/button-btp';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';
import { 
  HardHat, 
  Construction, 
  Wrench,
  ClipboardList,
  Building,
  Truck,
  ArrowRight,
  Users,
  Shield
} from 'lucide-react';
import Link from 'next/link';

// Interface pour un service
interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  cta: string;
  href: string;
}

// Données des services
const services: Service[] = [
  {
    id: 'maitrise-oeuvre',
    title: 'Maîtrise d\'œuvre',
    description: 'Pilotage complet de vos projets BTP de la conception à la réception des travaux.',
    icon: ClipboardList,
    features: [
      'Gestion de projet complète',
      'Coordination des corps d\'état',
      'Suivi planning et budget',
      'Réception et garanties'
    ],
    cta: 'Découvrir',
    href: '/services/maitrise-oeuvre'
  },
  {
    id: 'suivi-chantiers',
    title: 'Suivi de chantiers',
    description: 'Supervision technique et qualité pour garantir la conformité de vos réalisations.',
    icon: HardHat,
    features: [
      'Contrôle qualité permanent',
      'Respect des normes',
      'Reporting hebdomadaire',
      'Sécurité optimisée'
    ],
    cta: 'En savoir plus',
    href: '/services/suivi-chantiers'
  },
  {
    id: 'assistance-maitrise-ouvrage',
    title: 'AMO - Assistance Maîtrise d\'Ouvrage',
    description: 'Conseil stratégique et technique pour optimiser vos décisions d\'investissement.',
    icon: Users,
    features: [
      'Analyse des besoins',
      'Définition du programme',
      'Aide à la décision',
      'Validation des choix'
    ],
    cta: 'Consulter',
    href: '/services/amo'
  },
  {
    id: 'etudes-techniques',
    title: 'Études techniques',
    description: 'Conception et dimensionnement de structures adaptées à vos contraintes.',
    icon: Construction,
    features: [
      'Études de faisabilité',
      'Plans d\'exécution',
      'Calculs de structure',
      'Dossiers réglementaires'
    ],
    cta: 'Découvrir',
    href: '/services/etudes-techniques'
  },
  {
    id: 'equipements-levage',
    title: 'Équipements de levage',
    description: 'Location et maintenance d\'équipements de levage de dernière génération.',
    icon: Truck,
    features: [
      'Grues mobiles',
      'Télescopiques',
      'Matériel certifié',
      'Maintenance préventive'
    ],
    cta: 'Voir la flotte',
    href: '/services/equipements-levage'
  },
  {
    id: 'construction-renovation',
    title: 'Construction & Rénovation',
    description: 'Réalisation de tous types de travaux de construction et de rénovation.',
    icon: Building,
    features: [
      'Gros œuvre',
      'Second œuvre',
      'Rénovation complète',
      'Finitions haut de gamme'
    ],
    cta: 'Nos réalisations',
    href: '/services/construction-renovation'
  }
];

export default function ServicesSection() {
  return (
    <Section id="services" className="py-24 bg-neutral-50 dark:bg-neutral-900">
      <Container>
        {/* En-tête de section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400 font-medium text-sm mb-6">
            <Wrench className="w-4 h-4" />
            Nos Services
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
            Une expertise complète pour vos projets BTP
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            De la conception à la réalisation, nous accompagnons vos projets avec notre savoir-faire technique 
            et notre engagement qualité. Découvrez nos services adaptés à vos besoins.
          </p>
        </div>

        {/* Grille des services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <Card 
                key={service.id} 
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-neutral-800"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="w-px h-8 bg-gradient-to-b from-primary-200 to-transparent dark:from-primary-700" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  
                  {/* Liste des fonctionnalités */}
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link href={service.href} className="block">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between group/btn hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <span>{service.cta}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>

                {/* Effet de survol */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            );
          })}
        </div>

        {/* CTA de section */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-400 text-sm mb-6">
            <Shield className="w-4 h-4" />
            Garantie qualité sur tous nos services
          </div>
          <div className="space-y-4">
            <Link href="/services">
              <Button size="lg" className="text-lg px-8">
                Voir tous nos services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Ou contactez-nous pour un devis personnalisé
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
