'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button-btp';
import { Container } from '@/components/shared/Container';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  HardHat, 
  Construction, 
  TrendingUp,
  Users,
  Calendar,
  Award
} from 'lucide-react';
import Link from 'next/link';

// Interface pour les statistiques
interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Données des statistiques
const stats: Stat[] = [
  {
    value: 15,
    suffix: '+',
    label: 'Années d\'expérience',
    icon: Calendar
  },
  {
    value: 200,
    suffix: '+',
    label: 'Projets réalisés',
    icon: TrendingUp
  },
  {
    value: 150,
    suffix: '+',
    label: 'Clients satisfaits',
    icon: Users
  },
  {
    value: 98,
    suffix: '%',
    label: 'Taux de satisfaction',
    icon: Award
  }
];

// Hook pour l'animation des compteurs
function useCounterAnimation(targetValue: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * targetValue);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration, isVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return count;
}

// Composant StatCard avec animation
function StatCard({ stat }: { stat: Stat }) {
  const animatedValue = useCounterAnimation(stat.value);
  const IconComponent = stat.icon;

  return (
    <div className="text-center group">
      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
        <IconComponent className="h-8 w-8 text-white" />
      </div>
      <div className="text-4xl font-bold text-white mb-2">
        {animatedValue}{stat.suffix}
      </div>
      <p className="text-white/90 text-sm font-medium">
        {stat.label}
      </p>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image avec Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Placeholder pour image de fond - chantier BTP */}
        <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black">
          {/* Pattern optionnel pour simuler un chantier */}
          <div className="absolute inset-0 opacity-10 bg-repeat" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                 backgroundSize: '60px 60px'
               }}>
          </div>
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-btp-orange-500/80 via-btp-blue-600/70 to-gray-900/90"></div>
      </div>

      {/* Contenu Principal */}
      <Container size="7xl" padding="lg" className="relative z-10">
        <div className="text-center text-white">
          {/* Badge d'introduction */}
          <div className="flex justify-center mb-8">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
              🏗️ Leader BTP Niger & France
            </Badge>
          </div>

          {/* Titre Principal */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="block">Partenaires de vos</span>
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">
              Projets BTP
            </span>
          </h1>

          {/* Sous-titre */}
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white/90">
            De l&apos;Ingénierie au Matériel de Levage
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/80 max-w-4xl mx-auto mb-12 leading-relaxed">
            <strong>Daga Maraka France</strong> vous accompagne avec expertise en conseil et ingénierie BTP, 
            tandis que notre <strong>entité Niger</strong> propose la location de matériel de levage 
            et équipements de chantier pour tous vos projets de construction.
          </p>

          {/* CTA Principaux */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/services/ingenierie">
              <Button 
                variant="secondary" 
                size="xl" 
                className="gap-3 bg-white text-gray-900 hover:bg-gray-100 shadow-2xl min-w-[240px]"
              >
                <HardHat className="h-5 w-5" />
                Services Ingénierie
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/services/location-niger">
              <Button 
                variant="outline" 
                size="xl" 
                className="gap-3 border-white text-gray-900 hover:bg-white hover:text-gray-900 min-w-[240px]"
              >
                <Construction className="h-5 w-5" />
                Location Matériel
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Statistiques avec Animations */}
          <div id="stats-section" className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </div>
      </Container>

      {/* Indicateur de scroll */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
