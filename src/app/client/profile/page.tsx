'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Save,
  Eye,
  EyeOff,
  Lock,
  Bell,
  Shield,
  History,
  MapPin,
  Loader2,
  UserIcon,
  CreditCard,
} from 'lucide-react';

// Types
interface UserWithRelations {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  avatar?: string | null;
  createdAt: Date;
  locations?: Array<{
    id: string;
    totalPrice: number;
  }>;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  locationReminders: boolean;
  promotionalEmails: boolean;
}

function ProfileInfo({ user }: { user: UserWithRelations }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    company: user.company || '',
    address: user.address || '',
  });

  const handleSave = () => {
    // TODO: Appeler l'API pour sauvegarder
    setIsEditing(false);
  };

  const handleAvatarUploadSuccess = (avatarUrl: string) => {
    setCurrentUser(prev => ({ ...prev, avatar: avatarUrl }));
  };

  const handleAvatarUploadError = (error: string) => {
    console.error('Erreur upload avatar:', error);
  };

  const stats = [
    { label: 'Locations réalisées', value: user.locations?.length || 0, icon: History },
    { label: 'Total dépensé', value: `${(user.locations?.reduce((sum: number, l: { totalPrice: number }) => sum + Number(l.totalPrice || 0), 0) || 0).toLocaleString()} FCFA`, icon: CreditCard },
    { label: 'Membre depuis', value: new Date(user.createdAt).getFullYear(), icon: UserIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Avatar et informations de base */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <AvatarUpload
                currentAvatar={currentUser.avatar || undefined}
                userName={currentUser.name}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleAvatarUploadError}
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <p className="text-gray-600 mb-3">{user.company || 'Entreprise non renseignée'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{stat.label}:</span>
                      <span className="font-medium">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Sauvegarder
                </>
              ) : (
                'Modifier'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Adresse complète</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              disabled={!isEditing}
              placeholder="Saisissez votre adresse complète"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    // TODO: Appeler l'API pour changer le mot de passe
    console.log('Changing password...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Sécurité du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={handleChangePassword} className="w-full">
          <Shield className="w-4 h-4 mr-2" />
          Changer le mot de passe
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationPreferences() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    locationReminders: true,
    promotionalEmails: false,
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev: NotificationSettings) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // TODO: Appeler l'API pour sauvegarder les préférences
    console.log('Saving notification preferences...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Préférences de notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications par email</p>
              <p className="text-sm text-gray-600">Recevoir les notifications importantes par email</p>
            </div>
            <Button
              variant={settings.emailNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('emailNotifications')}
            >
              {settings.emailNotifications ? 'Activé' : 'Désactivé'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications SMS</p>
              <p className="text-sm text-gray-600">Recevoir les alertes urgentes par SMS</p>
            </div>
            <Button
              variant={settings.smsNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('smsNotifications')}
            >
              {settings.smsNotifications ? 'Activé' : 'Désactivé'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rappels de location</p>
              <p className="text-sm text-gray-600">Rappels avant le début et la fin des locations</p>
            </div>
            <Button
              variant={settings.locationReminders ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('locationReminders')}
            >
              {settings.locationReminders ? 'Activé' : 'Désactivé'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Emails promotionnels</p>
              <p className="text-sm text-gray-600">Recevoir les offres spéciales et nouveautés</p>
            </div>
            <Button
              variant={settings.promotionalEmails ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('promotionalEmails')}
            >
              {settings.promotionalEmails ? 'Activé' : 'Désactivé'}
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full mt-6">
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder les préférences
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ProfilPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/client/profile');
    }
  }, [isAuthenticated, router]);

  // Affichage de chargement
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement du profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos informations personnelles et préférences de compte
        </p>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileInfo user={user} />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
