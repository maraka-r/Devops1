import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { HeroSection } from '@/components/sections/HeroSection';
import { 
  EntitiesSection,
  ServicesSection,
  TestimonialsSection,
  ContactSection
} from '@/components/sections';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';

// Metadata SEO spécifiques à la page d'accueil
export const metadata: Metadata = {
  title: 'Daga Maraka BTP - Expert Conseil & Location Matériel | France & Niger',
  description: 'Daga Maraka BTP : Expert en conseil & ingénierie BTP en France, location de matériel de levage au Niger. Maîtrise d\'œuvre, AMO, grues, télescopiques. 15 ans d\'expérience.',
  keywords: [
    'BTP Niger',
    'BTP France', 
    'conseil BTP',
    'ingénierie BTP',
    'location matériel BTP',
    'maîtrise œuvre',
    'AMO',
    'location grues',
    'télescopiques',
    'nacelles',
    'Daga Maraka',
    'construction Niger',
    'rénovation',
    'suivi chantiers'
  ],
  authors: [{ name: 'Daga Maraka BTP' }],
  creator: 'Daga Maraka BTP',
  publisher: 'Daga Maraka BTP',
  openGraph: {
    title: 'Daga Maraka BTP - Expert Conseil & Location Matériel',
    description: 'Expert en conseil & ingénierie BTP en France, location de matériel au Niger. 15 ans d\'expérience, +200 projets réalisés.',
    url: 'https://dagamaraka.com',
    siteName: 'Daga Maraka BTP',
    images: [
      {
        url: '/og-image-homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'Daga Maraka BTP - Conseil & Location Matériel BTP',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daga Maraka BTP - Expert Conseil & Location Matériel',
    description: 'Expert BTP France & Niger. Conseil, ingénierie, location matériel.',
    creator: '@dagamaraka_btp',
    images: ['/og-image-homepage.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://dagamaraka.com',
  },
};

// Données structurées JSON-LD pour le référencement
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Daga Maraka BTP',
  alternateName: 'Daga Maraka',
  url: 'https://dagamaraka.com',
  logo: 'https://dagamaraka.com/logo.png',
  description: 'Expert en conseil & ingénierie BTP en France, location de matériel de levage au Niger',
  foundingDate: '2009',
  numberOfEmployees: '50-100',
  industry: 'Construction, BTP, Ingénierie',
  keywords: 'BTP, construction, ingénierie, location matériel, Niger, France',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+33-1-23-45-67-89',
      contactType: 'customer service',
      areaServed: 'FR',
      availableLanguage: 'French'
    },
    {
      '@type': 'ContactPoint', 
      telephone: '+227-20-12-34-56',
      contactType: 'customer service',
      areaServed: 'NE',
      availableLanguage: ['French', 'Hausa']
    }
  ],
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: '123 Avenue de la République',
      addressLocality: 'Paris',
      postalCode: '75011',
      addressCountry: 'FR'
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Quartier Plateau, Avenue Marien Ngouabi',
      addressLocality: 'Niamey',
      addressCountry: 'NE'
    }
  ],
  sameAs: [
    'https://linkedin.com/company/daga-maraka-btp',
    'https://facebook.com/dagamarakabtp',
    'https://instagram.com/dagamaraka_btp'
  ],
  services: [
    {
      '@type': 'Service',
      name: 'Maîtrise d\'œuvre BTP',
      description: 'Pilotage complet de projets de construction',
      areaServed: 'FR'
    },
    {
      '@type': 'Service', 
      name: 'Location matériel BTP',
      description: 'Location de grues, télescopiques, nacelles',
      areaServed: 'NE'
    },
    {
      '@type': 'Service',
      name: 'AMO - Assistance Maîtrise d\'Ouvrage',
      description: 'Conseil stratégique et technique BTP',
      areaServed: 'FR'
    },
    {
      '@type': 'Service',
      name: 'Suivi de chantiers',
      description: 'Supervision technique et qualité',
      areaServed: ['FR', 'NE']
    }
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '150',
    bestRating: '5'
  }
};

// Composant de fallback pour le chargement
function SectionSkeleton() {
  return (
    <div className="w-full py-24 bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mx-auto mb-6"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mx-auto mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* JSON-LD pour le référencement */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Redirection automatique selon le rôle utilisateur */}
      <RoleBasedRedirect />
      
      <MainLayout>
        {/* Section Hero - Always Above the Fold */}
        <HeroSection />
        
        {/* Sections Below the Fold avec Lazy Loading */}
        <Suspense fallback={<SectionSkeleton />}>
          <EntitiesSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <ServicesSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <ContactSection />
        </Suspense>
      </MainLayout>
    </>
  );
}