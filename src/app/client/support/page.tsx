'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Send,
  Clock,
  CheckCircle,
  ChevronRight,
  Plus,
  XCircle,
} from 'lucide-react';

// Types
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  createdAt: Date;
  updatedAt: Date;
  responses: {
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: Date;
  }[];
}

// Configuration des statuts et priorités
const statusConfig = {
  OPEN: { label: 'Ouvert', color: 'bg-blue-100 text-blue-800', icon: Clock },
  IN_PROGRESS: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  RESOLVED: { label: 'Résolu', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CLOSED: { label: 'Fermé', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const priorityConfig = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Moyen', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'Élevé', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
};

// Mock data
const mockFAQs: FAQ[] = [
  {
    id: '1',
    question: 'Comment réserver un matériel ?',
    answer: 'Pour réserver un matériel, rendez-vous sur la page catalogue, sélectionnez le matériel souhaité, cliquez sur "Louer" et suivez les étapes du formulaire de réservation.',
    category: 'Réservation',
    helpful: 24,
  },
  {
    id: '2',
    question: 'Quels sont les modes de paiement acceptés ?',
    answer: 'Nous acceptons les paiements par virement bancaire, Mobile Money (Orange Money, MTN MoMo), espèces et chèques certifiés.',
    category: 'Paiement',
    helpful: 18,
  },
  {
    id: '3',
    question: 'Puis-je annuler ma réservation ?',
    answer: 'Oui, vous pouvez annuler votre réservation jusqu\'à 24h avant la date de début. Des frais d\'annulation peuvent s\'appliquer selon les conditions.',
    category: 'Réservation',
    helpful: 15,
  },
  {
    id: '4',
    question: 'Comment modifier mes informations de profil ?',
    answer: 'Rendez-vous dans la section "Mon Profil" de votre espace client, cliquez sur "Modifier" et mettez à jour vos informations.',
    category: 'Compte',
    helpful: 12,
  },
];

const mockTickets: Ticket[] = [
  {
    id: '1',
    subject: 'Problème de facturation',
    description: 'Je n\'ai pas reçu ma facture pour la location du mois dernier.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'Facturation',
    createdAt: new Date('2025-07-08'),
    updatedAt: new Date('2025-07-09'),
    responses: [
      {
        id: '1',
        message: 'Bonjour, nous vérifions votre dossier et vous enverrons la facture sous 24h.',
        isAdmin: true,
        createdAt: new Date('2025-07-09'),
      },
    ],
  },
  {
    id: '2',
    subject: 'Question sur matériel disponible',
    description: 'Avez-vous des grues de plus de 50T disponibles pour fin juillet ?',
    status: 'RESOLVED',
    priority: 'LOW',
    category: 'Catalogue',
    createdAt: new Date('2025-07-05'),
    updatedAt: new Date('2025-07-06'),
    responses: [
      {
        id: '2',
        message: 'Oui, nous avons une grue 75T disponible du 25 au 31 juillet.',
        isAdmin: true,
        createdAt: new Date('2025-07-06'),
      },
    ],
  },
];

function FAQSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');

  const categories = ['Toutes', ...Array.from(new Set(mockFAQs.map(faq => faq.category)))];

  const filteredFAQs = mockFAQs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Toutes' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans la FAQ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions fréquentes */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <Card key={faq.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <HelpCircle className="w-5 h-5 text-blue-500 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 mb-3">{faq.answer}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <Badge variant="secondary">{faq.category}</Badge>
                    <span>{faq.helpful} personnes ont trouvé cela utile</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Aucune question trouvée</h3>
            <p className="text-gray-500">Essayez avec d&apos;autres mots-clés ou contactez notre support.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContactSection() {
  const [formData, setFormData] = useState<{
    subject: string;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    message: string;
  }>({
    subject: '',
    category: '',
    priority: 'MEDIUM',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Appeler l'API pour créer un ticket
    console.log('Creating ticket:', formData);
  };

  const contactMethods = [
    {
      icon: Phone,
      title: 'Téléphone',
      description: 'Appelez-nous pour une assistance immédiate',
      value: '+225 27 20 XX XX XX',
      action: 'Appeler',
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'Envoyez-nous un email, nous répondrons sous 24h',
      value: 'support@maraka.fr',
      action: 'Écrire',
    },
    {
      icon: MessageCircle,
      title: 'Chat en direct',
      description: 'Discutez avec notre équipe en temps réel',
      value: 'Disponible 8h-18h',
      action: 'Démarrer',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Méthodes de contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                <p className="font-medium text-gray-900 mb-4">{method.value}</p>
                <Button size="sm" className="w-full">
                  {method.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Formulaire de contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Créer un ticket de support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Décrivez brièvement votre problème"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionnez une catégorie</option>
                  <option value="Réservation">Réservation</option>
                  <option value="Facturation">Facturation</option>
                  <option value="Catalogue">Catalogue</option>
                  <option value="Compte">Compte</option>
                  <option value="Technique">Problème technique</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as typeof formData.priority})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Décrivez votre problème en détail..."
                rows={5}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Envoyer le ticket
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TicketsSection() {
  const [tickets] = useState(mockTickets);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = tickets.filter(t => t.status === status).length;
          const Icon = config.icon;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{config.label}</p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Liste des tickets */}
      <div className="space-y-4">
        {tickets.map((ticket) => {
          const statusConf = statusConfig[ticket.status];
          const priorityConf = priorityConfig[ticket.priority];
          const StatusIcon = statusConf.icon;

          return (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                      <Badge className={statusConf.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConf.label}
                      </Badge>
                      <Badge className={priorityConf.color}>
                        {priorityConf.label}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>#{ticket.id}</span>
                      <span>{ticket.category}</span>
                      <span>Créé le {ticket.createdAt.toLocaleDateString('fr-FR')}</span>
                      {ticket.responses.length > 0 && (
                        <span>{ticket.responses.length} réponse(s)</span>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Voir détails
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tickets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Aucun ticket de support</h3>
            <p className="text-gray-500 mb-4">
              Vous n&apos;avez pas encore créé de ticket de support.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer un ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/client/support');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centre de Support</h1>
        <p className="text-gray-600 mt-1">
          Trouvez des réponses à vos questions ou contactez notre équipe
        </p>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Nous contacter</TabsTrigger>
          <TabsTrigger value="tickets">Mes tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <FAQSection />
        </TabsContent>

        <TabsContent value="contact">
          <ContactSection />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
