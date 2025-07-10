// Script de seed pour peupler la base de données Maraka
// Version corrigée pour éviter les erreurs de contrainte unique en production
// Utilise upsert() pour toutes les entités avec des contraintes uniques

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyage (uniquement en développement)
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
  const admin = await prisma.user.upsert({
    where: { email: 'admin@maraka.fr' },
    update: {
      password: passwordHash,
      name: 'Administrateur Maraka',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+33 1 23 45 67 89',
      company: 'Maraka SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
    },
    create: {
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

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@maraka.fr' },
    update: {
      password: passwordHash,
      name: 'Administrateur Maraka',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+33 1 23 45 67 89',
      company: 'Maraka SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
    },
    create: {
      email: 'admin2@maraka.fr',
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
  const employee = await prisma.user.upsert({
    where: { email: 'employe@maraka.fr' },
    update: {
      password: passwordHash,
      name: 'Marie Dubois',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 98 76 54 32',
      company: 'Maraka SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
    },
    create: {
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
  const client1 = await prisma.user.upsert({
    where: { email: 'jean.martin@entreprise-martin.fr' },
    update: {
      password: passwordHash,
      name: 'Jean Martin',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 11 22 33 44',
      company: 'Entreprise Martin',
      address: '456 Rue du BTP, 69001 Lyon',
    },
    create: {
      email: 'jean.martin@entreprise-martin.fr',
      password: passwordHash,
      name: 'Jean Martin',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 11 22 33 44',
      company: 'Entreprise Martin',
      address: '456 Rue du BTP, 69001 Lyon',
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'sophie.bernard@btp-solutions.fr' },
    update: {
      password: passwordHash,
      name: 'Sophie Bernard',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 55 66 77 88',
      company: 'BTP Solutions',
      address: '789 Boulevard des Travaux, 13001 Marseille',
    },
    create: {
      email: 'sophie.bernard@btp-solutions.fr',
      password: passwordHash,
      name: 'Sophie Bernard',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 55 66 77 88',
      company: 'BTP Solutions',
      address: '789 Boulevard des Travaux, 13001 Marseille',
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'pierre.moreau@construction-moderne.fr' },
    update: {
      password: passwordHash,
      name: 'Pierre Moreau',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 44 55 66 77',
      company: 'Construction Moderne',
      address: '321 Allée des Bâtisseurs, 31000 Toulouse',
    },
    create: {
      email: 'pierre.moreau@construction-moderne.fr',
      password: passwordHash,
      name: 'Pierre Moreau',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 44 55 66 77',
      company: 'Construction Moderne',
      address: '321 Allée des Bâtisseurs, 31000 Toulouse',
    },
  });

  const client4 = await prisma.user.upsert({
    where: { email: 'lucie.petit@renovation-pro.fr' },
    update: {
      password: passwordHash,
      name: 'Lucie Petit',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 77 88 99 00',
      company: 'Rénovation Pro',
      address: '654 Cours de la Rénovation, 44000 Nantes',
    },
    create: {
      email: 'lucie.petit@renovation-pro.fr',
      password: passwordHash,
      name: 'Lucie Petit',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 77 88 99 00',
      company: 'Rénovation Pro',
      address: '654 Cours de la Rénovation, 44000 Nantes',
    },
  });

  const client5 = await prisma.user.upsert({
    where: { email: 'marc.durand@travaux-publics.fr' },
    update: {
      password: passwordHash,
      name: 'Marc Durand',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 00 11 22 33',
      company: 'Travaux Publics Durand',
      address: '987 Route des Infrastructures, 67000 Strasbourg',
    },
    create: {
      email: 'marc.durand@travaux-publics.fr',
      password: passwordHash,
      name: 'Marc Durand',
      role: 'USER',
      status: 'ACTIVE',
      phone: '+33 1 00 11 22 33',
      company: 'Travaux Publics Durand',
      address: '987 Route des Infrastructures, 67000 Strasbourg',
    },
  });

  console.log('✅ 7 utilisateurs créés/mis à jour');

  // ===========================
  // CRÉATION DES MATÉRIELS
  // ===========================
  console.log('🏗️ Création des matériels...');

  // Pour les matériels, nous vérifions d'abord s'ils existent avant de les créer
  let materiel1 = await prisma.materiel.findFirst({
    where: { name: 'Grue mobile Liebherr LTM 1030-2.1' }
  });
  
  if (!materiel1) {
    materiel1 = await prisma.materiel.create({
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
    });
  }

  let materiel2 = await prisma.materiel.findFirst({
    where: { name: 'Grue mobile Tadano ATF 60G-3' }
  });
  
  if (!materiel2) {
    materiel2 = await prisma.materiel.create({
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
    });
  }

  let materiel3 = await prisma.materiel.findFirst({
    where: { name: 'Pelleteuse Caterpillar 320D2' }
  });
  
  if (!materiel3) {
    materiel3 = await prisma.materiel.create({
      data: {
        name: 'Pelleteuse Caterpillar 320D2',
        type: 'PELLETEUSE',
        description: 'Pelleteuse hydraulique de 20 tonnes avec excellente polyvalence pour terrassement et démolition.',
        pricePerDay: 380.00,
        status: 'AVAILABLE',
        specifications: {
          poidsOperationnel: '20.3 tonnes',
          puissanceMoteur: '110 kW / 148 ch',
          capaciteGodet: '0.7 - 1.2 m³',
          porteeMax: '9.9 mètres',
          profondeurMax: '6.6 mètres',
          hauteurDeversement: '7.1 mètres',
        },
        images: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/caterpillar-320d2.pdf',
      },
    });
  }

  // Continuons avec quelques autres matériels essentiels
  let materiel4 = await prisma.materiel.findFirst({
    where: { name: 'Chariot élévateur Caterpillar EP20KT' }
  });
  
  if (!materiel4) {
    materiel4 = await prisma.materiel.create({
      data: {
        name: 'Chariot élévateur Caterpillar EP20KT',
        type: 'CHARIOT_ELEVATEUR',
        description: 'Chariot élévateur électrique compact et efficace pour manutention et chargement de matériaux.',
        pricePerDay: 120.00,
        status: 'AVAILABLE',
        specifications: {
          capaciteCharge: '2.0 tonnes',
          hauteurLevee: '3.0 mètres',
          autonomieBatterie: '8 heures',
          poids: '2.8 tonnes',
          largeurAllees: '2.4 mètres',
        },
        images: [
          'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/caterpillar-ep20kt.pdf',
      },
    });
  }

  let materiel5 = await prisma.materiel.findFirst({
    where: { name: 'Compacteur Bomag BW 213 D-5' }
  });
  
  if (!materiel5) {
    materiel5 = await prisma.materiel.create({
      data: {
        name: 'Compacteur Bomag BW 213 D-5',
        type: 'COMPACTEUR',
        description: 'Compacteur monocylindre pour compactage de sols et matériaux granulaires.',
        pricePerDay: 280.00,
        status: 'AVAILABLE',
        specifications: {
          largeurCompactage: '213 cm',
          puissanceMoteur: '110 kW / 148 ch',
          poids: '14.5 tonnes',
          vitesseMax: '11 km/h',
          forceExcitation: '450 kN',
        },
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center',
        ],
        manualUrl: '/manuals/bomag-bw213d5.pdf',
      },
    });
  }

  console.log('✅ 5 matériels créés/mis à jour');

  // ===========================
  // CRÉATION DES LOCATIONS
  // ===========================
  console.log('📅 Création des locations...');

  // Créer quelques locations d'exemple (sans upsert car pas de contrainte unique)
  try {
    // Vérifier si des locations existent déjà pour éviter les doublons
    const existingLocations = await prisma.location.findMany();
    
    if (existingLocations.length === 0) {
      await prisma.location.create({
        data: {
          userId: client1.id,
          materielId: materiel1.id,
          startDate: new Date('2024-02-15T08:00:00Z'),
          endDate: new Date('2024-02-20T18:00:00Z'),
          status: 'CONFIRMED',
          totalPrice: 2250.00, // 5 jours × 450€
          notes: 'Livraison tôt le matin souhaitée - 456 Rue du BTP, 69001 Lyon',
        },
      });

      await prisma.location.create({
        data: {
          userId: client2.id,
          materielId: materiel3.id,
          startDate: new Date('2024-02-10T08:00:00Z'),
          endDate: new Date('2024-02-14T18:00:00Z'),
          status: 'COMPLETED',
          totalPrice: 1520.00, // 4 jours × 380€
          notes: 'Chantier de terrassement - accès difficile - 789 Boulevard des Travaux, 13001 Marseille',
        },
      });

      console.log('✅ 2 locations créées');
    } else {
      console.log('✅ Locations déjà existantes, passage en revue');
    }
  } catch (error) {
    console.log('⚠️ Erreur lors de la création des locations:', error);
  }

  // ===========================
  // CRÉATION DES NOTIFICATIONS
  // ===========================
  console.log('🔔 Création des notifications...');

  try {
    // Vérifier si des notifications existent déjà
    const existingNotifications = await prisma.notification.findMany();
    
    if (existingNotifications.length === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId: admin.id,
            title: 'Nouvelle réservation',
            message: 'Une nouvelle réservation a été effectuée par Jean Martin',
            type: 'LOCATION_CONFIRMED',
            isRead: false,
            createdAt: new Date(),
          },
          {
            userId: client1.id,
            title: 'Réservation confirmée',
            message: 'Votre réservation de la grue Liebherr a été confirmée',
            type: 'LOCATION_CONFIRMED',
            isRead: false,
            createdAt: new Date(),
          },
        ],
      });

      console.log('✅ 2 notifications créées');
    } else {
      console.log('✅ Notifications déjà existantes, passage en revue');
    }
  } catch (error) {
    console.log('⚠️ Erreur lors de la création des notifications:', error);
  }

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
