'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-btp';
import { Button } from '@/components/ui/button-btp';
import { Container } from '@/components/shared/Container';
import { Section } from '@/components/shared/Section';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Interface pour une localisation
interface Location {
  id: string;
  name: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  description: string;
  services: string[];
  flag: string;
}

// Données des localisations
const locations: Location[] = [
  {
    id: 'france',
    name: 'Daga Maraka France',
    country: 'France',
    address: '123 Avenue de la République, 75011 Paris',
    phone: '+33 1 23 45 67 89',
    email: 'contact@dagamaraka.fr',
    hours: 'Lun-Ven : 8h-18h',
    description: 'Siège social et bureau d\'études techniques',
    services: ['Maîtrise d\'œuvre', 'AMO', 'Études techniques', 'Conseil'],
    flag: '🇫🇷'
  },
  {
    id: 'niger',
    name: 'Daga Maraka Niger',
    country: 'Niger',
    address: 'Quartier Plateau, Avenue Marien Ngouabi, Niamey',
    phone: '+227 20 12 34 56',
    email: 'niger@dagamaraka.com',
    hours: 'Lun-Ven : 7h-17h',
    description: 'Siège opérationnel et parc matériel',
    services: ['Construction', 'Rénovation', 'Location matériel', 'Maintenance'],
    flag: '🇳🇪'
  }
];

// Interface pour le formulaire
interface ContactForm {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
  location: string;
}

export default function ContactSection() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
    location: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.subject.trim()) newErrors.subject = 'Le sujet est requis';
    if (!formData.message.trim()) newErrors.message = 'Le message est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Simulation d'envoi - à remplacer par l'API réelle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: '',
        location: ''
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section id="contact" className="py-24 bg-neutral-50 dark:bg-neutral-900">
      <Container>
        {/* En-tête de section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400 font-medium text-sm mb-6">
            <MapPin className="w-4 h-4" />
            Nous contacter
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
            Démarrons votre projet ensemble
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Contactez-nous pour discuter de votre projet BTP. Nos équipes en France et au Niger 
            sont à votre disposition pour vous accompagner.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulaire de contact */}
          <Card className="border-0 shadow-lg bg-white dark:bg-neutral-800">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-neutral-900 dark:text-white">
                Envoyez-nous un message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
                      } bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                      placeholder="Votre nom"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
                      } bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                      placeholder="votre@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 focus:border-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                      placeholder="Nom de votre entreprise"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 focus:border-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Sujet *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.subject 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
                    } bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="devis">Demande de devis</option>
                    <option value="maitrise-oeuvre">Maîtrise d&apos;œuvre</option>
                    <option value="construction">Construction</option>
                    <option value="renovation">Rénovation</option>
                    <option value="location-materiel">Location matériel</option>
                    <option value="autre">Autre</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.message 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
                    } bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors resize-none`}
                    placeholder="Décrivez votre projet..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                  )}
                </div>

                {/* Message de statut */}
                {submitStatus === 'success' && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-green-700 dark:text-green-400">
                      Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 dark:text-red-400">
                      Une erreur s&apos;est produite. Veuillez réessayer ou nous contacter directement.
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Localisations */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                Nos localisations
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Présents en France et au Niger, nous sommes à votre service pour tous vos projets BTP.
              </p>
            </div>

            {locations.map((location) => (
              <Card key={location.id} className="border-0 shadow-lg bg-white dark:bg-neutral-800">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{location.flag}</span>
                    <div>
                      <CardTitle className="text-xl font-semibold text-neutral-900 dark:text-white">
                        {location.name}
                      </CardTitle>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        {location.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm">
                          {location.address}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <a 
                        href={`tel:${location.phone}`}
                        className="text-neutral-700 dark:text-neutral-300 text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {location.phone}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <a 
                        href={`mailto:${location.email}`}
                        className="text-neutral-700 dark:text-neutral-300 text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {location.email}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <p className="text-neutral-700 dark:text-neutral-300 text-sm">
                        {location.hours}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
                      Services disponibles :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {location.services.map((service, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-xs font-medium"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
