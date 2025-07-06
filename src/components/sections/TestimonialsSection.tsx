'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card-btp';
import { Button } from '@/components/ui/button-btp';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star,
  Quote,
  Users,
  Play,
  Pause
} from 'lucide-react';

// Interface pour un témoignage
interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  project: string;
  location: string;
  avatar?: string;
}

// Données des témoignages
const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Amadou Diallo',
    role: 'Directeur Général',
    company: 'Groupe Sahel Construction',
    content: 'Daga Maraka BTP a réalisé la construction de notre siège social avec un professionnalisme exemplaire. La qualité des finitions et le respect des délais ont dépassé nos attentes. Une équipe technique de haut niveau.',
    rating: 5,
    project: 'Siège social - 2500m²',
    location: 'Niamey, Niger'
  },
  {
    id: 'testimonial-2',
    name: 'Marie Dubois',
    role: 'Responsable Projets',
    company: 'ONG Solidarité Sahel',
    content: 'Pour la construction de notre centre médical, l\'accompagnement de Daga Maraka a été déterminant. Leur expertise en maîtrise d\'œuvre et leur connaissance du terrain local nous ont permis de mener à bien ce projet humanitaire.',
    rating: 5,
    project: 'Centre médical - 800m²',
    location: 'Dosso, Niger'
  },
  {
    id: 'testimonial-3',
    name: 'Ibrahim Oumarou',
    role: 'Maire',
    company: 'Commune de Tillabéri',
    content: 'La rénovation de notre école primaire a été menée avec une attention particulière aux contraintes locales. L\'équipe de Daga Maraka a su allier efficacité technique et respect des traditions architecturales.',
    rating: 5,
    project: 'École primaire - Rénovation',
    location: 'Tillabéri, Niger'
  },
  {
    id: 'testimonial-4',
    name: 'Sophie Martin',
    role: 'Chef de projet',
    company: 'Développement Rural International',
    content: 'Excellente collaboration pour la construction de notre base logistique. La réactivité de l\'équipe et la qualité du suivi de chantier ont été remarquables. Je recommande vivement leurs services.',
    rating: 5,
    project: 'Base logistique - 1200m²',
    location: 'Maradi, Niger'
  },
  {
    id: 'testimonial-5',
    name: 'Moussa Adamou',
    role: 'Directeur Technique',
    company: 'Entreprise Bâtir Ensemble',
    content: 'Partenariat fructueux avec Daga Maraka sur plusieurs projets. Leur expertise en AMO et leur capacité à gérer des projets complexes font d\'eux un partenaire de choix pour le développement du BTP au Niger.',
    rating: 5,
    project: 'Complexe commercial - 3000m²',
    location: 'Zinder, Niger'
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play du carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000); // Change toutes les 6 secondes

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-neutral-300 dark:text-neutral-600'
        }`}
      />
    ));
  };

  return (
    <Section id="testimonials" className="py-24 bg-white dark:bg-neutral-900">
      <Container>
        {/* En-tête de section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400 font-medium text-sm mb-6">
            <Users className="w-4 h-4" />
            Témoignages Clients
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Découvrez les retours d&apos;expérience de nos clients sur nos projets de construction, 
            rénovation et maîtrise d&apos;œuvre au Niger et en France.
          </p>
        </div>

        {/* Carousel principal */}
        <div className="relative max-w-6xl mx-auto">
          {/* Contrôles du carousel */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                className="h-10 w-10 rounded-full p-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="h-10 w-10 rounded-full p-0"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAutoPlay}
              className="h-10 px-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isAutoPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>

          {/* Testimonial actuel */}
          <Card className="relative overflow-hidden border-0 shadow-xl bg-neutral-50 dark:bg-neutral-800">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Contenu du témoignage */}
                <div className="flex-1">
                  <div className="mb-6">
                    <Quote className="w-8 h-8 text-primary-500 opacity-60 mb-4" />
                    <p className="text-lg md:text-xl text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                      {testimonials[currentIndex].content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    {renderStars(testimonials[currentIndex].rating)}
                  </div>
                </div>

                {/* Informations du client */}
                <div className="lg:w-80 flex-shrink-0">
                  <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm">
                    <div className="mb-4">
                      <h4 className="font-semibold text-neutral-900 dark:text-white text-lg">
                        {testimonials[currentIndex].name}
                      </h4>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        {testimonials[currentIndex].role}
                      </p>
                      <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                        {testimonials[currentIndex].company}
                      </p>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Projet :</span>
                        <br />
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {testimonials[currentIndex].project}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Localisation :</span>
                        <br />
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {testimonials[currentIndex].location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicateurs de pagination */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary-500 w-8'
                    : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA de section */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-400 text-sm mb-6">
            <Star className="w-4 h-4 text-yellow-400" />
            98% de satisfaction client
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Prêt à démarrer votre projet ?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Rejoignez nos clients satisfaits et bénéficiez de notre expertise 
              pour la réalisation de vos projets BTP.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8">
                Demander un devis
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Voir nos réalisations
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
