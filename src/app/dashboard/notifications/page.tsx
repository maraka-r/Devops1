import { DashboardLayout } from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Trash2,
  Check,
  Filter,
  Settings,
  Clock,
  User,
  Wrench,
  FileText
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
  category: 'system' | 'location' | 'materiel' | 'user';
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Maintenance requise',
    message: 'La pelleteuse CAT 320 nécessite une maintenance dans 2 jours',
    time: 'Il y a 30 minutes',
    read: false,
    category: 'materiel'
  },
  {
    id: '2',
    type: 'success',
    title: 'Nouvelle location',
    message: 'Location confirmée pour la grue 50T par Entreprise Martin',
    time: 'Il y a 1 heure',
    read: false,
    category: 'location'
  },
  {
    id: '3',
    type: 'info',
    title: 'Nouveau client',
    message: 'Jean Dubois a créé un compte et attend validation',
    time: 'Il y a 2 heures',
    read: true,
    category: 'user'
  },
  {
    id: '4',
    type: 'error',
    title: 'Panne signalée',
    message: 'Problème hydraulique sur la nacelle JLG 450AJ',
    time: 'Il y a 4 heures',
    read: true,
    category: 'materiel'
  },
  {
    id: '5',
    type: 'info',
    title: 'Rapport mensuel',
    message: 'Le rapport de performance de novembre est disponible',
    time: 'Hier',
    read: true,
    category: 'system'
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'materiel':
      return <Wrench className="h-4 w-4" />;
    case 'location':
      return <FileText className="h-4 w-4" />;
    case 'user':
      return <User className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'materiel':
      return 'bg-orange-100 text-orange-800';
    case 'location':
      return 'bg-blue-100 text-blue-800';
    case 'user':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function NotificationsPage() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Toutes vos notifications sont à jour'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
            <Button size="sm">
              <Check className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Non lues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wrench className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications.filter(n => n.category === 'materiel').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Matériel</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications.filter(n => n.category === 'location').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes les notifications</CardTitle>
            <CardDescription>
              Voici toutes vos notifications récentes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className={`p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}>
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`${getCategoryColor(notification.category)}`}
                          >
                            <span className="mr-1">
                              {getCategoryIcon(notification.category)}
                            </span>
                            {notification.category}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Gérez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Configurer les notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Personnalisez vos préférences de notification
                    </p>
                  </div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Marquer toutes comme lues</p>
                    <p className="text-sm text-muted-foreground">
                      Effacer toutes les notifications non lues
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
