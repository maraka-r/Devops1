import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  UserSettingsResponse, 
  UserSettingsRequest, 
  SettingsActionResponse 
} from '@/types';

// GET /api/settings/user - Récupérer les paramètres de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Validation du userId
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Utilisateur non trouvé' 
        },
        { status: 404 }
      );
    }

    // Récupérer ou créer les paramètres utilisateur
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: userId }
    });

    if (!userSettings) {
      // Créer les paramètres par défaut
      userSettings = await prisma.userSettings.create({
        data: {
          userId: userId,
          theme: 'light',
          language: 'fr',
          timezone: 'Europe/Paris',
          dateFormat: 'DD/MM/YYYY',
          currency: 'EUR',
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          notificationSound: true,
          locationReminders: true,
          paymentReminders: true,
          materialAvailability: true,
          promotionalEmails: false,
          defaultLocationDuration: 1,
          autoRenewal: false,
          favoriteViewFirst: true,
          dashboardLayout: 'default',
          compactMode: false,
          showTutorials: true,
          twoFactorEnabled: false,
          sessionTimeout: 30
        }
      });
    }

    // Formatter la réponse
    const formattedSettings: UserSettingsResponse = {
      id: userSettings.id,
      userId: userSettings.userId,
      theme: userSettings.theme,
      language: userSettings.language,
      timezone: userSettings.timezone,
      dateFormat: userSettings.dateFormat,
      currency: userSettings.currency,
      emailNotifications: userSettings.emailNotifications,
      pushNotifications: userSettings.pushNotifications,
      smsNotifications: userSettings.smsNotifications,
      notificationSound: userSettings.notificationSound,
      locationReminders: userSettings.locationReminders,
      paymentReminders: userSettings.paymentReminders,
      materialAvailability: userSettings.materialAvailability,
      promotionalEmails: userSettings.promotionalEmails,
      defaultLocationDuration: userSettings.defaultLocationDuration,
      autoRenewal: userSettings.autoRenewal,
      favoriteViewFirst: userSettings.favoriteViewFirst,
      dashboardLayout: userSettings.dashboardLayout,
      compactMode: userSettings.compactMode,
      showTutorials: userSettings.showTutorials,
      twoFactorEnabled: userSettings.twoFactorEnabled,
      sessionTimeout: userSettings.sessionTimeout,
      createdAt: userSettings.createdAt.toISOString(),
      updatedAt: userSettings.updatedAt.toISOString()
    };

    const response: SettingsActionResponse = {
      success: true,
      message: 'Paramètres utilisateur récupérés avec succès',
      data: {
        userSettings: formattedSettings
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres utilisateur:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la récupération des paramètres utilisateur' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/settings/user - Mettre à jour les paramètres de l'utilisateur
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Validation du userId
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Utilisateur non trouvé' 
        },
        { status: 404 }
      );
    }

    // Parser le body de la requête
    const body: UserSettingsRequest = await request.json();
    
    // Validation des données
    const updateData: Record<string, unknown> = {};

    if (body.theme !== undefined) {
      if (!['light', 'dark', 'auto'].includes(body.theme)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Thème invalide. Valeurs autorisées: light, dark, auto' 
          },
          { status: 400 }
        );
      }
      updateData.theme = body.theme;
    }

    if (body.language !== undefined) {
      if (!['fr', 'en', 'es', 'de'].includes(body.language)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Langue invalide. Valeurs autorisées: fr, en, es, de' 
          },
          { status: 400 }
        );
      }
      updateData.language = body.language;
    }

    if (body.timezone !== undefined) {
      updateData.timezone = body.timezone;
    }

    if (body.dateFormat !== undefined) {
      if (!['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(body.dateFormat)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Format de date invalide. Valeurs autorisées: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD' 
          },
          { status: 400 }
        );
      }
      updateData.dateFormat = body.dateFormat;
    }

    if (body.currency !== undefined) {
      if (typeof body.currency !== 'string' || body.currency.length !== 3) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La devise doit être un code de 3 lettres (ex: EUR, USD)' 
          },
          { status: 400 }
        );
      }
      updateData.currency = body.currency.toUpperCase();
    }

    // Notifications booléennes
    const booleanFields = [
      'emailNotifications', 'pushNotifications', 'smsNotifications', 'notificationSound',
      'locationReminders', 'paymentReminders', 'materialAvailability', 'promotionalEmails',
      'autoRenewal', 'favoriteViewFirst', 'compactMode', 'showTutorials', 'twoFactorEnabled'
    ];

    booleanFields.forEach(field => {
      if (body[field as keyof UserSettingsRequest] !== undefined) {
        updateData[field] = body[field as keyof UserSettingsRequest];
      }
    });

    if (body.defaultLocationDuration !== undefined) {
      if (typeof body.defaultLocationDuration !== 'number' || body.defaultLocationDuration < 1 || body.defaultLocationDuration > 365) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La durée de location par défaut doit être entre 1 et 365 jours' 
          },
          { status: 400 }
        );
      }
      updateData.defaultLocationDuration = body.defaultLocationDuration;
    }

    if (body.dashboardLayout !== undefined) {
      if (!['default', 'compact', 'expanded', 'grid'].includes(body.dashboardLayout)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Layout invalide. Valeurs autorisées: default, compact, expanded, grid' 
          },
          { status: 400 }
        );
      }
      updateData.dashboardLayout = body.dashboardLayout;
    }

    if (body.sessionTimeout !== undefined) {
      if (typeof body.sessionTimeout !== 'number' || body.sessionTimeout < 5 || body.sessionTimeout > 480) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Le timeout de session doit être entre 5 et 480 minutes' 
          },
          { status: 400 }
        );
      }
      updateData.sessionTimeout = body.sessionTimeout;
    }

    // Récupérer ou créer les paramètres utilisateur
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: userId }
    });

    if (!userSettings) {
      // Créer avec les données fournies et les valeurs par défaut
      userSettings = await prisma.userSettings.create({
        data: {
          userId: userId,
          theme: 'light',
          language: 'fr',
          timezone: 'Europe/Paris',
          dateFormat: 'DD/MM/YYYY',
          currency: 'EUR',
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          notificationSound: true,
          locationReminders: true,
          paymentReminders: true,
          materialAvailability: true,
          promotionalEmails: false,
          defaultLocationDuration: 1,
          autoRenewal: false,
          favoriteViewFirst: true,
          dashboardLayout: 'default',
          compactMode: false,
          showTutorials: true,
          twoFactorEnabled: false,
          sessionTimeout: 30,
          ...updateData
        }
      });
    } else {
      // Mettre à jour les paramètres existants
      userSettings = await prisma.userSettings.update({
        where: { userId: userId },
        data: updateData
      });
    }

    // Formatter la réponse
    const formattedSettings: UserSettingsResponse = {
      id: userSettings.id,
      userId: userSettings.userId,
      theme: userSettings.theme,
      language: userSettings.language,
      timezone: userSettings.timezone,
      dateFormat: userSettings.dateFormat,
      currency: userSettings.currency,
      emailNotifications: userSettings.emailNotifications,
      pushNotifications: userSettings.pushNotifications,
      smsNotifications: userSettings.smsNotifications,
      notificationSound: userSettings.notificationSound,
      locationReminders: userSettings.locationReminders,
      paymentReminders: userSettings.paymentReminders,
      materialAvailability: userSettings.materialAvailability,
      promotionalEmails: userSettings.promotionalEmails,
      defaultLocationDuration: userSettings.defaultLocationDuration,
      autoRenewal: userSettings.autoRenewal,
      favoriteViewFirst: userSettings.favoriteViewFirst,
      dashboardLayout: userSettings.dashboardLayout,
      compactMode: userSettings.compactMode,
      showTutorials: userSettings.showTutorials,
      twoFactorEnabled: userSettings.twoFactorEnabled,
      sessionTimeout: userSettings.sessionTimeout,
      createdAt: userSettings.createdAt.toISOString(),
      updatedAt: userSettings.updatedAt.toISOString()
    };

    const response: SettingsActionResponse = {
      success: true,
      message: 'Paramètres utilisateur mis à jour avec succès',
      data: {
        userSettings: formattedSettings
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres utilisateur:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la mise à jour des paramètres utilisateur' 
      },
      { status: 500 }
    );
  }
}
