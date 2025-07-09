// Script de seed pour peupler la base de données Maraka
// Données réalistes pour le développement et la démonstration

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyage (optionnel - attention en production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Nettoyage des données existantes...');
    await prisma.supportReply.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.favori.deleteMany();
    await prisma.location.deleteMany();
    await prisma.materiel.deleteMany();
    await prisma.user.deleteMany();
  }

  // ===========================
  // CRÉATION DES UTILISATEURS
  // ===========================
  console.log('👥 Création des utilisateurs...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Admin principal
  const admin = await prisma.user.create({
    data: {
      email: 'admin@maraka.fr',
      password: passwordHash,
      name: 'Administrateur Maraka',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+33 1 23 45 67 89',
      company: 'Maraka SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
    },
  });

  // Employé
  const employee = await prisma.user.create({
    data: {
      email: 'employe@maraka.fr',
      password: passwordHash,
      name: 'Marie Dubois',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 98 76 54 32',
      company: 'Maraka SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
    },
  });

  // Clients
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'jean.martin@entreprise-martin.fr',
        password: passwordHash,
        name: 'Jean Martin',
        role: 'USER',
        status: 'ACTIVE',
        phone: '+33 1 11 22 33 44',
        company: 'Entreprise Martin',
        address: '456 Rue du BTP, 69001 Lyon',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sophie.bernard@btp-solutions.fr',
        password: passwordHash,
        name: 'Sophie Bernard',
        role: 'USER',
        status: 'ACTIVE',
        phone: '+33 1 55 66 77 88',
        company: 'BTP Solutions',
        address: '789 Boulevard des Travaux, 13001 Marseille',
      },
    }),
    prisma.user.create({
      data: {
        email: 'pierre.moreau@construction-moderne.fr',
        password: passwordHash,
        name: 'Pierre Moreau',
        role: 'USER',
        status: 'ACTIVE',
        phone: '+33 1 44 55 66 77',
        company: 'Construction Moderne',
        address: '321 Allée des Bâtisseurs, 31000 Toulouse',
      },
    }),
    prisma.user.create({
      data: {
        email: 'lucie.petit@renovation-pro.fr',
        password: passwordHash,
        name: 'Lucie Petit',
        role: 'USER',
        status: 'ACTIVE',
        phone: '+33 1 77 88 99 00',
        company: 'Rénovation Pro',
        address: '654 Cours de la Rénovation, 44000 Nantes',
      },
    }),
    prisma.user.create({
      data: {
        email: 'marc.durand@travaux-publics.fr',
        password: passwordHash,
        name: 'Marc Durand',
        role: 'USER',
        status: 'ACTIVE',
        phone: '+33 1 00 11 22 33',
        company: 'Travaux Publics Durand',
        address: '987 Route des Infrastructures, 67000 Strasbourg',
      },
    }),
  ]);

  console.log(`✅ ${clients.length + 2} utilisateurs créés`);

  // ===========================
  // CRÉATION DES MATÉRIELS
  // ===========================
  console.log('🏗️ Création des matériels...');

  const materiels = await Promise.all([
    // Grues mobiles
    prisma.materiel.create({
      data: {
        name: 'Grue mobile Liebherr LTM 1030-2.1',
        type: 'GRUE_MOBILE',
        description: 'Grue mobile compacte avec capacité de levage de 30 tonnes. Parfaite pour les chantiers urbains et les espaces restreints.',
        pricePerDay: 450.00,
        status: 'AVAILABLE',
        specifications: {
          capaciteMax: '30 tonnes',
          hauteurMax: '40 mètres',
          porteeMax: '26 mètres',
          poids: '24 tonnes',
          longueurFlèche: '23.8 mètres',
          motorisation: 'Mercedes-Benz OM 906 LA',
          puissance: '170 kW / 231 ch',
        },
        images: [
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/liebherr-ltm-1030.pdf',
      },
    }),
    prisma.materiel.create({
      data: {
        name: 'Grue mobile Tadano ATF 60G-3',
        type: 'GRUE_MOBILE',
        description: 'Grue mobile tout-terrain avec une capacité de 60 tonnes. Idéale pour les gros chantiers de construction.',
        pricePerDay: 650.00,
        status: 'AVAILABLE',
        specifications: {
          capaciteMax: '60 tonnes',
          hauteurMax: '51 mètres',
          porteeMax: '36 mètres',
          poids: '36 tonnes',
          longueurFlèche: '40 mètres',
          motorisation: 'Mercedes-Benz OM 926 LA',
          puissance: '240 kW / 326 ch',
        },
        images: [
          'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/tadano-atf-60g.pdf',
      },
    }),

    // Pelleteuses
    prisma.materiel.create({
      data: {
        name: 'Pelleteuse Caterpillar 320D2',
        type: 'PELLETEUSE',
        description: 'Pelleteuse hydraulique sur chenilles de 20 tonnes. Polyvalente et robuste pour tous types de travaux de terrassement.',
        pricePerDay: 280.00,
        status: 'AVAILABLE',
        specifications: {
          poidsOperationnel: '20.3 tonnes',
          puissanceMoteur: '110 kW / 148 ch',
          profondeurFouille: '6.52 mètres',
          porteeMax: '9.67 mètres',
          hauteurDechargement: '6.32 mètres',
          capaciteGodet: '0.8 m³',
          consommation: '18 L/h',
        },
        images: [
          'https://images.unsplash.com/photo-1631461391608-b9067c92da8c?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/caterpillar-320d2.pdf',
      },
    }),
    prisma.materiel.create({
      data: {
        name: 'Pelleteuse Komatsu PC210LC-11',
        type: 'PELLETEUSE',
        description: 'Pelleteuse hydraulique de nouvelle génération avec technologie hybride pour une efficacité énergétique optimale.',
        pricePerDay: 320.00,
        status: 'AVAILABLE',
        specifications: {
          poidsOperationnel: '21.2 tonnes',
          puissanceMoteur: '123 kW / 165 ch',
          profondeurFouille: '6.49 mètres',
          porteeMax: '9.81 mètres',
          hauteurDechargement: '6.55 mètres',
          capaciteGodet: '0.93 m³',
          consommation: '16 L/h',
          technologie: 'Hybrid HB215LC',
        },
        images: [
          'https://images.unsplash.com/photo-1597149392695-6b1a99edb1c6?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/komatsu-pc210lc.pdf',
      },
    }),

    // Nacelles
    prisma.materiel.create({
      data: {
        name: 'Nacelle ciseaux Genie GS-2632',
        type: 'NACELLE_CISEAUX',
        description: 'Nacelle ciseaux électrique compacte pour travaux en intérieur et extérieur. Hauteur de travail de 10 mètres.',
        pricePerDay: 85.00,
        status: 'AVAILABLE',
        specifications: {
          hauteurTravail: '10.05 mètres',
          hauteurPlateforme: '8.05 mètres',
          capaciteCharge: '227 kg',
          dimensionsPlateforme: '0.81 x 1.83 m',
          largeurHorsTout: '0.81 mètres',
          poids: '1247 kg',
          alimentationElectrique: '24V DC',
          autonomie: '8 heures',
        },
        images: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/genie-gs2632.pdf',
      },
    }),
    prisma.materiel.create({
      data: {
        name: 'Nacelle télescopique JLG 460SJ',
        type: 'NACELLE_TELESCOPIQUE',
        description: 'Nacelle télescopique articulée 4x4 pour accès difficiles. Hauteur de travail de 16 mètres.',
        pricePerDay: 180.00,
        status: 'AVAILABLE',
        specifications: {
          hauteurTravail: '16.15 mètres',
          hauteurPlateforme: '14.15 mètres',
          porteeHorizontale: '7.47 mètres',
          capaciteCharge: '230 kg',
          dimensionsPlateforme: '0.76 x 1.83 m',
          poids: '7030 kg',
          motorisation: 'Deutz diesel',
          traction: '4x4',
        },
        images: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/jlg-460sj.pdf',
      },
    }),

    // Compacteurs
    prisma.materiel.create({
      data: {
        name: 'Compacteur vibrant Bomag BW 120 AD-5',
        type: 'COMPACTEUR',
        description: 'Compacteur monocylindre à vibration pour compactage de sols et asphalte. Largeur de travail 120 cm.',
        pricePerDay: 150.00,
        status: 'AVAILABLE',
        specifications: {
          poids: '2400 kg',
          largeurCylindre: '120 cm',
          diamètreCylindre: '100 cm',
          forceVibration: '35 kN',
          frequenceVibration: '4200 min-1',
          vitesseAvancement: '0-12 km/h',
          motorisation: 'Deutz D2011L03i',
          puissance: '36.8 kW / 50 ch',
        },
        images: [
          'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/bomag-bw120ad.pdf',
      },
    }),

    // Chariots élévateurs
    prisma.materiel.create({
      data: {
        name: 'Chariot élévateur Toyota 02-8FGF25',
        type: 'CHARIOT_ELEVATEUR',
        description: 'Chariot élévateur frontal GPL de 2.5 tonnes. Parfait pour la manutention en entrepôt et chantier.',
        pricePerDay: 95.00,
        status: 'AVAILABLE',
        specifications: {
          capacite: '2500 kg',
          hauteurLevee: '4.7 mètres',
          hauteurMat: '2.13 mètres',
          longueurFourches: '1.22 mètres',
          poids: '4200 kg',
          motorisation: 'Toyota 1DZ-III GPL',
          transmission: 'Automatique',
          rayonBraquage: '2.4 mètres',
        },
        images: [
          'https://images.unsplash.com/photo-1558617719-58e3e5c0f7e9?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/toyota-8fgf25.pdf',
      },
    }),

    // Marteaux piqueurs
    prisma.materiel.create({
      data: {
        name: 'Marteau piqueur Hilti TE 1000-AVR',
        type: 'MARTEAU_PIQUEUR',
        description: 'Marteau-piqueur électrique professionnel avec système anti-vibration. Pour démolition et perçage.',
        pricePerDay: 35.00,
        status: 'AVAILABLE',
        specifications: {
          puissance: '1400 W',
          energie: '20 J',
          frequence: '1900 coups/min',
          poids: '9.2 kg',
          diamètrePerçage: '32 mm',
          emmanchement: 'SDS-max',
          systemAntiVibration: 'AVR',
          longueur: '630 mm',
        },
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/hilti-te1000avr.pdf',
      },
    }),

    // Quelques matériels en maintenance/hors service pour la variété
    prisma.materiel.create({
      data: {
        name: 'Pelleteuse Volvo EC160E',
        type: 'PELLETEUSE',
        description: 'Pelleteuse hydraulique sur chenilles de 16 tonnes. Actuellement en maintenance préventive.',
        pricePerDay: 260.00,
        status: 'MAINTENANCE',
        specifications: {
          poidsOperationnel: '16.2 tonnes',
          puissanceMoteur: '90 kW / 121 ch',
          profondeurFouille: '5.98 mètres',
          porteeMax: '8.95 mètres',
          hauteurDechargement: '6.12 mètres',
          capaciteGodet: '0.65 m³',
        },
        images: [
          'https://images.unsplash.com/photo-1631461391608-b9067c92da8c?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/volvo-ec160e.pdf',
      },
    }),
    prisma.materiel.create({
      data: {
        name: 'Compacteur Caterpillar CS44B',
        type: 'COMPACTEUR',
        description: 'Compacteur vibrant monocylindre. Temporairement hors service pour réparation.',
        pricePerDay: 165.00,
        status: 'OUT_OF_ORDER',
        specifications: {
          poids: '3200 kg',
          largeurCylindre: '168 cm',
          forceVibration: '45 kN',
          puissance: '55 kW / 74 ch',
        },
        images: [
          'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/caterpillar-cs44b.pdf',
      },
    }),
  ]);

  console.log(`✅ ${materiels.length} matériels créés`);

  // ===========================
  // CRÉATION DES LOCATIONS
  // ===========================
  console.log('📅 Création des locations...');

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  // Locations passées (terminées)
  const pastLocations = [
    {
      userId: clients[0].id,
      materielId: materiels[0].id,
      startDate: new Date(now.getTime() - 30 * oneDay),
      endDate: new Date(now.getTime() - 28 * oneDay),
      status: 'COMPLETED' as const,
      totalPrice: 900.00,
      notes: 'Location pour construction d\'un immeuble résidentiel. Client très satisfait.',
    },
    {
      userId: clients[1].id,
      materielId: materiels[2].id,
      startDate: new Date(now.getTime() - 20 * oneDay),
      endDate: new Date(now.getTime() - 15 * oneDay),
      status: 'COMPLETED' as const,
      totalPrice: 1400.00,
      notes: 'Travaux de terrassement pour extension d\'usine.',
    },
    {
      userId: clients[2].id,
      materielId: materiels[4].id,
      startDate: new Date(now.getTime() - 10 * oneDay),
      endDate: new Date(now.getTime() - 8 * oneDay),
      status: 'COMPLETED' as const,
      totalPrice: 170.00,
      notes: 'Maintenance préventive d\'équipements en hauteur.',
    },
  ];

  // Locations actuelles (en cours)
  const currentLocations = [
    {
      userId: clients[0].id,
      materielId: materiels[1].id,
      startDate: new Date(now.getTime() - 3 * oneDay),
      endDate: new Date(now.getTime() + 4 * oneDay),
      status: 'ACTIVE' as const,
      totalPrice: 4550.00,
      notes: 'Construction d\'un pont. Location étendue sur 7 jours.',
    },
    {
      userId: clients[3].id,
      materielId: materiels[6].id,
      startDate: new Date(now.getTime() - 1 * oneDay),
      endDate: new Date(now.getTime() + 2 * oneDay),
      status: 'ACTIVE' as const,
      totalPrice: 450.00,
      notes: 'Compactage de parking d\'entreprise.',
    },
  ];

  // Locations futures (confirmées)
  const futureLocations = [
    {
      userId: clients[1].id,
      materielId: materiels[3].id,
      startDate: new Date(now.getTime() + 5 * oneDay),
      endDate: new Date(now.getTime() + 8 * oneDay),
      status: 'CONFIRMED' as const,
      totalPrice: 960.00,
      notes: 'Projet de rénovation urbaine. Réservé à l\'avance.',
    },
    {
      userId: clients[4].id,
      materielId: materiels[5].id,
      startDate: new Date(now.getTime() + 7 * oneDay),
      endDate: new Date(now.getTime() + 9 * oneDay),
      status: 'CONFIRMED' as const,
      totalPrice: 360.00,
      notes: 'Installation d\'enseignes publicitaires.',
    },
  ];

  // Locations en attente
  const pendingLocations = [
    {
      userId: clients[2].id,
      materielId: materiels[7].id,
      startDate: new Date(now.getTime() + 10 * oneDay),
      endDate: new Date(now.getTime() + 12 * oneDay),
      status: 'PENDING' as const,
      totalPrice: 190.00,
      notes: 'En attente de validation des assurances.',
    },
  ];

  const allLocations = [...pastLocations, ...currentLocations, ...futureLocations, ...pendingLocations];

  const locations = await Promise.all(
    allLocations.map(locationData => 
      prisma.location.create({ data: locationData })
    )
  );

  console.log(`✅ ${locations.length} locations créées`);

  // ===========================
  // CRÉATION DES FAVORIS
  // ===========================
  console.log('❤️ Création des favoris...');

  const favoris = await Promise.all([
    prisma.favori.create({
      data: {
        userId: clients[0].id,
        materielId: materiels[0].id, // Grue Liebherr
      },
    }),
    prisma.favori.create({
      data: {
        userId: clients[0].id,
        materielId: materiels[2].id, // Pelleteuse Cat
      },
    }),
    prisma.favori.create({
      data: {
        userId: clients[1].id,
        materielId: materiels[1].id, // Grue Tadano
      },
    }),
    prisma.favori.create({
      data: {
        userId: clients[2].id,
        materielId: materiels[4].id, // Nacelle ciseaux
      },
    }),
    prisma.favori.create({
      data: {
        userId: clients[3].id,
        materielId: materiels[6].id, // Compacteur
      },
    }),
  ]);

  console.log(`✅ ${favoris.length} favoris créés`);

  // ===========================
  // CRÉATION DES FACTURES ET PAIEMENTS
  // ===========================
  console.log('💰 Création des factures...');

  const invoices = await Promise.all([
    // Facture pour location terminée
    prisma.invoice.create({
      data: {
        number: 'FAC-2024-001',
        userId: clients[0].id,
        status: 'PAID',
        totalAmount: 900.00,
        taxAmount: 180.00,
        issueDate: new Date(now.getTime() - 25 * oneDay),
        dueDate: new Date(now.getTime() - 15 * oneDay),
        paidDate: new Date(now.getTime() - 20 * oneDay),
        description: 'Location Grue mobile Liebherr LTM 1030-2.1',
        items: {
          create: [{
            locationId: locations[0].id,
            description: 'Location grue mobile - 2 jours',
            quantity: 2,
            unitPrice: 450.00,
            totalPrice: 900.00,
          }],
        },
      },
    }),
    // Facture en attente
    prisma.invoice.create({
      data: {
        number: 'FAC-2024-002',
        userId: clients[1].id,
        status: 'PENDING',
        totalAmount: 1400.00,
        taxAmount: 280.00,
        issueDate: new Date(now.getTime() - 10 * oneDay),
        dueDate: new Date(now.getTime() + 5 * oneDay),
        description: 'Location Pelleteuse Caterpillar 320D2',
        items: {
          create: [{
            locationId: locations[1].id,
            description: 'Location pelleteuse - 5 jours',
            quantity: 5,
            unitPrice: 280.00,
            totalPrice: 1400.00,
          }],
        },
      },
    }),
  ]);

  // Paiement pour la première facture
  await prisma.payment.create({
    data: {
      userId: clients[0].id,
      invoiceId: invoices[0].id,
      amount: 900.00,
      method: 'CARD',
      status: 'COMPLETED',
      transactionId: 'TXN-001-2024',
      notes: 'Paiement par carte bancaire',
    },
  });

  console.log(`✅ ${invoices.length} factures créées`);

  // ===========================
  // CRÉATION DES NOTIFICATIONS
  // ===========================
  console.log('🔔 Création des notifications...');

  const notifications = await Promise.all([
    // Notifications pour l'admin
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'LOCATION_CONFIRMED',
        title: 'Nouvelle location confirmée',
        message: 'La location de la grue Tadano par Jean Martin a été confirmée.',
        priority: 'NORMAL',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'MATERIEL_MAINTENANCE',
        title: 'Maintenance programmée',
        message: 'La pelleteuse Volvo EC160E nécessite une maintenance préventive.',
        priority: 'HIGH',
        isRead: false,
      },
    }),
    // Notifications pour les clients
    prisma.notification.create({
      data: {
        userId: clients[0].id,
        type: 'LOCATION_REMINDER',
        title: 'Rappel de location',
        message: 'Votre location de grue se termine dans 2 jours.',
        priority: 'NORMAL',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: clients[1].id,
        type: 'PAYMENT_DUE',
        title: 'Paiement à effectuer',
        message: 'Votre facture FAC-2024-002 est à régler avant le ' + new Date(now.getTime() + 5 * oneDay).toLocaleDateString(),
        priority: 'HIGH',
        isRead: false,
      },
    }),
  ]);

  console.log(`✅ ${notifications.length} notifications créées`);

  // ===========================
  // CRÉATION DES PARAMÈTRES UTILISATEUR
  // ===========================
  console.log('⚙️ Création des paramètres utilisateur...');

  const userSettings = await Promise.all([
    prisma.userSettings.create({
      data: {
        userId: admin.id,
        emailNotifications: true,
        smsNotifications: true,
        language: 'fr',
        timezone: 'Europe/Paris',
        theme: 'light',
      },
    }),
    ...clients.map(client => 
      prisma.userSettings.create({
        data: {
          userId: client.id,
          emailNotifications: true,
          smsNotifications: false,
          language: 'fr',
          timezone: 'Europe/Paris',
          theme: 'light',
        },
      })
    ),
  ]);

  console.log(`✅ ${userSettings.length} paramètres utilisateur créés`);

  // ===========================
  // CRÉATION DES TICKETS DE SUPPORT
  // ===========================
  console.log('🎫 Création des tickets de support...');

  const supportTickets = await Promise.all([
    prisma.supportTicket.create({
      data: {
        title: 'Problème de connexion à l\'application',
        description: 'Je n\'arrive pas à me connecter depuis ce matin. L\'application affiche une erreur.',
        category: 'TECHNICAL',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        userId: clients[0].id,
        assignedToId: employee.id,
        replies: {
          create: [
            {
              message: 'Nous avons identifié le problème et travaillons sur une solution. Merci de votre patience.',
              isInternal: false,
              userId: employee.id,
            },
            {
              message: 'Merci pour votre réponse rapide. Je reste en attente.',
              isInternal: true,
              userId: clients[0].id,
            },
          ],
        },
      },
    }),
    prisma.supportTicket.create({
      data: {
        title: 'Demande de devis pour location longue durée',
        description: 'Nous aurions besoin d\'une pelleteuse pour 3 mois. Pouvez-vous nous faire un devis ?',
        category: 'FEATURE_REQUEST',
        priority: 'NORMAL',
        status: 'RESOLVED',
        userId: clients[1].id,
        assignedToId: admin.id,
        replies: {
          create: [
            {
              message: 'Nous vous envoyons le devis par email. N\'hésitez pas si vous avez des questions.',
              isInternal: false,
              userId: admin.id,
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ ${supportTickets.length} tickets de support créés`);

  console.log('🎉 Seeding terminé avec succès !');
  console.log('\n📊 Résumé des données créées :');
  console.log(`👥 Utilisateurs: ${clients.length + 2} (1 admin + 1 employé + ${clients.length} clients)`);
  console.log(`🏗️ Matériels: ${materiels.length}`);
  console.log(`📅 Locations: ${locations.length}`);
  console.log(`❤️ Favoris: ${favoris.length}`);
  console.log(`💰 Factures: ${invoices.length}`);
  console.log(`🔔 Notifications: ${notifications.length}`);
  console.log(`⚙️ Paramètres: ${userSettings.length}`);
  console.log(`🎫 Tickets: ${supportTickets.length}`);
  console.log('\n🔑 Comptes de test :');
  console.log('Admin: admin@maraka.fr / password123');
  console.log('Employé: employe@maraka.fr / password123');
  console.log('Client: jean.martin@entreprise-martin.fr / password123');
  console.log('Client: sophie.bernard@btp-solutions.fr / password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
