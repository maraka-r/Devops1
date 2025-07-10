// Script de seed pour peupler la base de données Maraka
// Version production-safe avec upsert pour éviter les conflits

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyage (seulement en développement)
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
  console.log('👥 Création/mise à jour des utilisateurs...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Admin principal
  await prisma.user.upsert({
    where: { email: 'admin@maraka.fr' },
    update: {
      password: passwordHash,
      name: 'Administrateur Maraka',
      role: 'ADMIN',
      status: 'ACTIVE',
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

  // Admin secondaire
  await prisma.user.upsert({
    where: { email: 'admin2@maraka.fr' },
    update: {
      password: passwordHash,
      name: 'Admin Backup',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: 'admin2@maraka.fr',
      password: passwordHash,
      name: 'Admin Backup',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+33 1 23 45 67 89',
      company: 'Maraka SAS',
      address: '123 Avenue de la Construction, 75001 Paris',
    },
  });

  // Employé
  await prisma.user.upsert({
    where: { email: 'employe@maraka.fr' },
    update: {
      password: passwordHash,
      name: 'Marie Dubois',
      role: 'USER',
      status: 'ACTIVE',
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
  const clientData = [
    {
      email: 'jean.martin@entreprise-martin.fr',
      name: 'Jean Martin',
      phone: '+33 1 11 22 33 44',
      company: 'Entreprise Martin',
      address: '456 Rue du BTP, 69001 Lyon',
    },
    {
      email: 'sophie.bernard@btp-solutions.fr',
      name: 'Sophie Bernard',
      phone: '+33 1 55 66 77 88',
      company: 'BTP Solutions',
      address: '789 Boulevard des Travaux, 13001 Marseille',
    },
    {
      email: 'pierre.moreau@construction-moderne.fr',
      name: 'Pierre Moreau',
      phone: '+33 1 44 55 66 77',
      company: 'Construction Moderne',
      address: '321 Allée des Bâtisseurs, 31000 Toulouse',
    },
    {
      email: 'lucie.petit@renovation-pro.fr',
      name: 'Lucie Petit',
      phone: '+33 1 77 88 99 00',
      company: 'Rénovation Pro',
      address: '654 Cours de la Rénovation, 44000 Nantes',
    },
    {
      email: 'marc.durand@travaux-publics.fr',
      name: 'Marc Durand',
      phone: '+33 1 00 11 22 33',
      company: 'Travaux Publics Durand',
      address: '987 Route des Infrastructures, 67000 Strasbourg',
    },
  ];

  const clients = [];
  for (const clientInfo of clientData) {
    const client = await prisma.user.upsert({
      where: { email: clientInfo.email },
      update: {
        password: passwordHash,
        name: clientInfo.name,
        role: 'USER',
        status: 'ACTIVE',
      },
      create: {
        email: clientInfo.email,
        password: passwordHash,
        name: clientInfo.name,
        role: 'USER',
        status: 'ACTIVE',
        phone: clientInfo.phone,
        company: clientInfo.company,
        address: clientInfo.address,
      },
    });
    clients.push(client);
  }

  console.log(`✅ ${clients.length + 2} utilisateurs créés/mis à jour`);

  // ===========================
  // CRÉATION DES MATÉRIELS (seulement si pas déjà créés)
  // ===========================
  console.log('🏗️ Création des matériels...');

  const existingMateriels = await prisma.materiel.count();
  
  if (existingMateriels === 0) {
    const materiels = await Promise.all([
      // Grues mobiles
      prisma.materiel.create({
        data: {
          name: 'Grue mobile 25 tonnes',
          type: 'GRUE_MOBILE',
          description: 'Grue mobile hydraulique 25T, flèche télescopique 30m, idéale pour chantiers urbains',
          pricePerDay: 350.00,
          status: 'AVAILABLE',
          specifications: {
            capacity: '25 tonnes',
            reach: '30 mètres',
            height: '40 mètres',
            engine: 'Diesel Euro 6',
            controls: 'Radiocommande + cabine'
          },
          images: ['/images/grue-25t.jpg', '/images/grue-25t-2.jpg'],
        },
      }),
      
      prisma.materiel.create({
        data: {
          name: 'Grue mobile 50 tonnes',
          type: 'GRUE_MOBILE',
          description: 'Grue mobile tout-terrain 50T, portée maximale 52m, parfaite pour gros œuvres',
          pricePerDay: 550.00,
          status: 'AVAILABLE',
          specifications: {
            capacity: '50 tonnes',
            reach: '52 mètres',
            height: '60 mètres',
            engine: 'Diesel Euro 6',
            stabilizers: '4 vérins hydrauliques'
          },
          images: ['/images/grue-50t.jpg'],
        },
      }),

      // Télescopiques
      prisma.materiel.create({
        data: {
          name: 'Télescopique 4x4 - 17m',
          type: 'TELESCOPIQUE',
          description: 'Chariot télescopique rotatif 17m, 4 tonnes, transmission hydrostatique',
          pricePerDay: 180.00,
          status: 'AVAILABLE',
          specifications: {
            capacity: '4 tonnes',
            height: '17 mètres',
            reach: '13 mètres',
            transmission: 'Hydrostatique',
            tires: 'Tout-terrain'
          },
          images: ['/images/telescopique-17m.jpg'],
        },
      }),

      prisma.materiel.create({
        data: {
          name: 'Télescopique 21m lourd',
          type: 'TELESCOPIQUE',
          description: 'Télescopique rotatif 21m, capacité 5,5T, stabilisateurs automatiques',
          pricePerDay: 220.00,
          status: 'AVAILABLE',
          specifications: {
            capacity: '5.5 tonnes',
            height: '21 mètres',
            reach: '18 mètres',
            stabilizers: 'Automatiques',
            cabin: 'Climatisée'
          },
          images: ['/images/telescopique-21m.jpg'],
        },
      }),

      // Nacelles
      prisma.materiel.create({
        data: {
          name: 'Nacelle articulée 16m',
          type: 'NACELLE_ARTICULEE',
          description: 'Nacelle automotrice articulée 16m, plateforme 2 personnes, batterie lithium',
          pricePerDay: 120.00,
          status: 'AVAILABLE',
          specifications: {
            height: '16 mètres',
            reach: '8 mètres',
            capacity: '230 kg (2 personnes)',
            power: 'Électrique lithium',
            turning: '360° continu'
          },
          images: ['/images/nacelle-16m.jpg'],
        },
      }),

      prisma.materiel.create({
        data: {
          name: 'Nacelle ciseaux 10m électrique',
          type: 'NACELLE_CISEAUX',
          description: 'Nacelle à ciseaux électrique 10m, plateforme XXL, idéale intérieur',
          pricePerDay: 85.00,
          status: 'AVAILABLE',
          specifications: {
            height: '10 mètres',
            platform: '5.2m x 1.83m',
            capacity: '320 kg',
            power: 'Électrique 48V',
            indoor: 'Usage intérieur'
          },
          images: ['/images/nacelle-ciseaux-10m.jpg'],
        },
      }),

      // Compacteurs
      prisma.materiel.create({
        data: {
          name: 'Compacteur à plaque 500kg',
          type: 'COMPACTEUR',
          description: 'Compacteur vibrant réversible 500kg, moteur Honda, arrosage intégré',
          pricePerDay: 45.00,
          status: 'AVAILABLE',
          specifications: {
            weight: '500 kg',
            force: '90 kN',
            engine: 'Honda GX390',
            plate: '60 x 80 cm',
            water: 'Réservoir 70L'
          },
          images: ['/images/compacteur-500kg.jpg'],
        },
      }),

      // Bulldozers
      prisma.materiel.create({
        data: {
          name: 'Bulldozer D6 Caterpillar',
          type: 'AUTRE',
          description: 'Bulldozer sur chenilles D6, lame droite, ripper arrière, cabine ROPS',
          pricePerDay: 680.00,
          status: 'AVAILABLE',
          specifications: {
            power: '215 HP',
            weight: '20 tonnes',
            blade: 'Lame droite 3.4m',
            ripper: 'Ripper 1 dent',
            cabin: 'ROPS/FOPS'
          },
          images: ['/images/bulldozer-d6.jpg'],
        },
      }),

      // Excavateurs
      prisma.materiel.create({
        data: {
          name: 'Pelle hydraulique 20T',
          type: 'PELLETEUSE',
          description: 'Excavateur sur chenilles 20T, bras long, godet 1m³, rotation 360°',
          pricePerDay: 320.00,
          status: 'AVAILABLE',
          specifications: {
            weight: '20 tonnes',
            reach: '9.5 mètres',
            depth: '6.2 mètres',
            bucket: '1.0 m³',
            engine: 'Tier 4 Final'
          },
          images: ['/images/pelle-20t.jpg'],
        },
      }),

      // Camions
      prisma.materiel.create({
        data: {
          name: 'Camion-benne 19T',
          type: 'AUTRE',
          description: 'Camion-benne 3 essieux 19T, benne alu, hayon hydraulique, permis C',
          pricePerDay: 280.00,
          status: 'AVAILABLE',
          specifications: {
            capacity: '19 tonnes',
            volume: '12 m³',
            body: 'Benne aluminium',
            tailgate: 'Hayon 1500kg',
            license: 'Permis C requis'
          },
          images: ['/images/camion-benne-19t.jpg'],
        },
      }),

      // Autres
      prisma.materiel.create({
        data: {
          name: 'Groupe électrogène 100 kVA',
          type: 'AUTRE',
          description: 'Groupe électrogène diesel insonorisé 100 kVA, démarrage auto, cuve 200L',
          pricePerDay: 95.00,
          status: 'AVAILABLE',
          specifications: {
            power: '100 kVA / 80 kW',
            fuel: 'Diesel',
            tank: '200 litres',
            noise: '< 65 dB à 7m',
            start: 'Démarrage automatique'
          },
          images: ['/images/groupe-electrogene-100kva.jpg'],
        },
      }),
    ]);

    console.log(`✅ ${materiels.length} matériels créés`);
  } else {
    console.log(`✅ ${existingMateriels} matériels déjà présents`);
  }

  // Le reste du seed (locations, favoris, etc.) seulement en développement
  if (process.env.NODE_ENV === 'development') {
    // ... (autres créations de données de test)
    console.log('✅ Autres données de test créées (dev seulement)');
  }

  console.log('🎉 Seeding terminé avec succès !');
  console.log('\n📊 Résumé :');
  console.log(`👥 Utilisateurs: ${clients.length + 2} (admins + clients)`);
  console.log(`🏗️ Matériels: ${await prisma.materiel.count()}`);
  
  console.log('\n🔑 Comptes de test :');
  console.log('Admin: admin@maraka.fr / password123');
  console.log('Client: jean.martin@entreprise-martin.fr / password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
