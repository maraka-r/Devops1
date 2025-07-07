import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  CompanySettingsResponse, 
  CompanySettingsRequest, 
  SettingsActionResponse 
} from '@/types';

// GET /api/settings/company - Récupérer les paramètres de l'entreprise
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

    // Vérifier que l'utilisateur a les permissions (admin uniquement)
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

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Accès refusé - Privilèges administrateur requis' 
        },
        { status: 403 }
      );
    }

    // Récupérer ou créer les paramètres d'entreprise
    let companySettings = await prisma.companySettings.findFirst();

    if (!companySettings) {
      // Créer les paramètres par défaut
      companySettings = await prisma.companySettings.create({
        data: {
          companyName: 'Daga Maraka',
          email: 'contact@daga-maraka.com',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          language: 'fr',
          taxRate: 0.20,
          defaultRentalDuration: 1,
          minRentalDuration: 1,
          maxRentalDuration: 365,
          emailNotifications: true,
          smsNotifications: false,
          maintenanceMode: false
        }
      });
    }

    // Formatter la réponse
    const formattedSettings: CompanySettingsResponse = {
      id: companySettings.id,
      companyName: companySettings.companyName,
      email: companySettings.email || undefined,
      phone: companySettings.phone || undefined,
      address: companySettings.address || undefined,
      website: companySettings.website || undefined,
      logo: companySettings.logo || undefined,
      taxRate: companySettings.taxRate,
      currency: companySettings.currency,
      timezone: companySettings.timezone,
      language: companySettings.language,
      defaultRentalDuration: companySettings.defaultRentalDuration,
      minRentalDuration: companySettings.minRentalDuration,
      maxRentalDuration: companySettings.maxRentalDuration,
      emailNotifications: companySettings.emailNotifications,
      smsNotifications: companySettings.smsNotifications,
      maintenanceMode: companySettings.maintenanceMode,
      maintenanceMessage: companySettings.maintenanceMessage || undefined,
      createdAt: companySettings.createdAt.toISOString(),
      updatedAt: companySettings.updatedAt.toISOString()
    };

    const response: SettingsActionResponse = {
      success: true,
      message: 'Paramètres d\'entreprise récupérés avec succès',
      data: {
        companySettings: formattedSettings
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres d\'entreprise:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la récupération des paramètres d\'entreprise' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/settings/company - Mettre à jour les paramètres de l'entreprise
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

    // Vérifier que l'utilisateur a les permissions (admin uniquement)
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

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Accès refusé - Privilèges administrateur requis' 
        },
        { status: 403 }
      );
    }

    // Parser le body de la requête
    const body: CompanySettingsRequest = await request.json();
    
    // Validation des données
    const updateData: Record<string, unknown> = {};

    if (body.companyName !== undefined) {
      if (typeof body.companyName !== 'string' || body.companyName.length < 2 || body.companyName.length > 100) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Le nom de l\'entreprise doit contenir entre 2 et 100 caractères' 
          },
          { status: 400 }
        );
      }
      updateData.companyName = body.companyName;
    }

    if (body.email !== undefined) {
      if (body.email && (typeof body.email !== 'string' || !body.email.includes('@'))) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email invalide' 
          },
          { status: 400 }
        );
      }
      updateData.email = body.email;
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }

    if (body.address !== undefined) {
      updateData.address = body.address;
    }

    if (body.website !== undefined) {
      updateData.website = body.website;
    }

    if (body.logo !== undefined) {
      updateData.logo = body.logo;
    }

    if (body.taxRate !== undefined) {
      if (typeof body.taxRate !== 'number' || body.taxRate < 0 || body.taxRate > 1) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Le taux de TVA doit être entre 0 et 1 (0% à 100%)' 
          },
          { status: 400 }
        );
      }
      updateData.taxRate = body.taxRate;
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

    if (body.timezone !== undefined) {
      updateData.timezone = body.timezone;
    }

    if (body.language !== undefined) {
      updateData.language = body.language;
    }

    if (body.defaultRentalDuration !== undefined) {
      if (typeof body.defaultRentalDuration !== 'number' || body.defaultRentalDuration < 1) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La durée de location par défaut doit être d\'au moins 1 jour' 
          },
          { status: 400 }
        );
      }
      updateData.defaultRentalDuration = body.defaultRentalDuration;
    }

    if (body.minRentalDuration !== undefined) {
      if (typeof body.minRentalDuration !== 'number' || body.minRentalDuration < 1) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La durée minimum de location doit être d\'au moins 1 jour' 
          },
          { status: 400 }
        );
      }
      updateData.minRentalDuration = body.minRentalDuration;
    }

    if (body.maxRentalDuration !== undefined) {
      if (typeof body.maxRentalDuration !== 'number' || body.maxRentalDuration < 1) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La durée maximum de location doit être d\'au moins 1 jour' 
          },
          { status: 400 }
        );
      }
      updateData.maxRentalDuration = body.maxRentalDuration;
    }

    if (body.emailNotifications !== undefined) {
      updateData.emailNotifications = body.emailNotifications;
    }

    if (body.smsNotifications !== undefined) {
      updateData.smsNotifications = body.smsNotifications;
    }

    if (body.maintenanceMode !== undefined) {
      updateData.maintenanceMode = body.maintenanceMode;
    }

    if (body.maintenanceMessage !== undefined) {
      updateData.maintenanceMessage = body.maintenanceMessage;
    }

    // Récupérer ou créer les paramètres existants
    let companySettings = await prisma.companySettings.findFirst();

    if (!companySettings) {
      // Créer avec les données fournies et les valeurs par défaut
      companySettings = await prisma.companySettings.create({
        data: {
          companyName: 'Daga Maraka',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          language: 'fr',
          taxRate: 0.20,
          defaultRentalDuration: 1,
          minRentalDuration: 1,
          maxRentalDuration: 365,
          emailNotifications: true,
          smsNotifications: false,
          maintenanceMode: false,
          ...updateData
        }
      });
    } else {
      // Mettre à jour les paramètres existants
      companySettings = await prisma.companySettings.update({
        where: { id: companySettings.id },
        data: updateData
      });
    }

    // Formatter la réponse
    const formattedSettings: CompanySettingsResponse = {
      id: companySettings.id,
      companyName: companySettings.companyName,
      email: companySettings.email || undefined,
      phone: companySettings.phone || undefined,
      address: companySettings.address || undefined,
      website: companySettings.website || undefined,
      logo: companySettings.logo || undefined,
      taxRate: companySettings.taxRate,
      currency: companySettings.currency,
      timezone: companySettings.timezone,
      language: companySettings.language,
      defaultRentalDuration: companySettings.defaultRentalDuration,
      minRentalDuration: companySettings.minRentalDuration,
      maxRentalDuration: companySettings.maxRentalDuration,
      emailNotifications: companySettings.emailNotifications,
      smsNotifications: companySettings.smsNotifications,
      maintenanceMode: companySettings.maintenanceMode,
      maintenanceMessage: companySettings.maintenanceMessage || undefined,
      createdAt: companySettings.createdAt.toISOString(),
      updatedAt: companySettings.updatedAt.toISOString()
    };

    const response: SettingsActionResponse = {
      success: true,
      message: 'Paramètres d\'entreprise mis à jour avec succès',
      data: {
        companySettings: formattedSettings
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres d\'entreprise:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la mise à jour des paramètres d\'entreprise' 
      },
      { status: 500 }
    );
  }
}
