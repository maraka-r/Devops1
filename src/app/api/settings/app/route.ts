import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/settings/app - Récupérer les paramètres de l'application (combo entreprise + utilisateur)
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
      select: { id: true, role: true }
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

    // Récupérer les paramètres utilisateur
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: userId }
    });

    // Récupérer les paramètres entreprise (publics uniquement)
    const companySettings = await prisma.companySettings.findFirst({
      select: {
        companyName: true,
        currency: true,
        timezone: true,
        language: true,
        taxRate: true,
        defaultRentalDuration: true,
        minRentalDuration: true,
        maxRentalDuration: true,
        maintenanceMode: true,
        maintenanceMessage: true
      }
    });

    // Formatter la réponse combinée
    const response = {
      success: true,
      data: {
        user: {
          id: userId,
          role: user.role,
          // Paramètres utilisateur ou valeurs par défaut
          theme: userSettings?.theme || 'light',
          language: userSettings?.language || 'fr',
          timezone: userSettings?.timezone || 'Europe/Paris',
          dateFormat: userSettings?.dateFormat || 'DD/MM/YYYY',
          currency: userSettings?.currency || 'EUR',
          emailNotifications: userSettings?.emailNotifications ?? true,
          pushNotifications: userSettings?.pushNotifications ?? true,
          smsNotifications: userSettings?.smsNotifications ?? false,
          notificationSound: userSettings?.notificationSound ?? true,
          locationReminders: userSettings?.locationReminders ?? true,
          paymentReminders: userSettings?.paymentReminders ?? true,
          materialAvailability: userSettings?.materialAvailability ?? true,
          promotionalEmails: userSettings?.promotionalEmails ?? false,
          defaultLocationDuration: userSettings?.defaultLocationDuration || 1,
          autoRenewal: userSettings?.autoRenewal ?? false,
          favoriteViewFirst: userSettings?.favoriteViewFirst ?? true,
          dashboardLayout: userSettings?.dashboardLayout || 'default',
          compactMode: userSettings?.compactMode ?? false,
          showTutorials: userSettings?.showTutorials ?? true,
          twoFactorEnabled: userSettings?.twoFactorEnabled ?? false,
          sessionTimeout: userSettings?.sessionTimeout || 30
        },
        company: {
          // Paramètres entreprise ou valeurs par défaut
          companyName: companySettings?.companyName || 'Daga Maraka',
          currency: companySettings?.currency || 'EUR',
          timezone: companySettings?.timezone || 'Europe/Paris',
          language: companySettings?.language || 'fr',
          taxRate: companySettings?.taxRate ?? 0.20,
          defaultRentalDuration: companySettings?.defaultRentalDuration || 1,
          minRentalDuration: companySettings?.minRentalDuration || 1,
          maxRentalDuration: companySettings?.maxRentalDuration || 365,
          maintenanceMode: companySettings?.maintenanceMode ?? false,
          maintenanceMessage: companySettings?.maintenanceMessage || null
        },
        computed: {
          // Paramètres calculés avec priorité utilisateur > entreprise
          effectiveLanguage: userSettings?.language || companySettings?.language || 'fr',
          effectiveCurrency: userSettings?.currency || companySettings?.currency || 'EUR',
          effectiveTimezone: userSettings?.timezone || companySettings?.timezone || 'Europe/Paris',
          effectiveDefaultDuration: userSettings?.defaultLocationDuration || companySettings?.defaultRentalDuration || 1,
          
          // Limites effectives
          minRentalDuration: companySettings?.minRentalDuration || 1,
          maxRentalDuration: companySettings?.maxRentalDuration || 365,
          taxRate: companySettings?.taxRate ?? 0.20,
          
          // Modes spéciaux
          maintenanceMode: companySettings?.maintenanceMode ?? false,
          isAdmin: user.role === 'ADMIN'
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de l\'application:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la récupération des paramètres de l\'application' 
      },
      { status: 500 }
    );
  }
}
