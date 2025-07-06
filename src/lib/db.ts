// Configuration de la base de données avec Prisma
// Singleton pour éviter les connexions multiples en développement

import { PrismaClient } from '@/generated/prisma';

// Fonction pour créer une instance Prisma avec les bonnes options
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

// Déclaration globale pour TypeScript
declare global {
  var prisma: PrismaClient | undefined;
}

// Singleton pattern pour éviter les connexions multiples
const prisma = globalThis.prisma || createPrismaClient();

// En développement, stocker l'instance dans globalThis
if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

// Fonction pour fermer la connexion proprement
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

// Fonction pour vérifier la connexion
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
};

// Type pour les transactions Prisma
type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Fonction pour effectuer des transactions
export const withTransaction = async <T>(
  callback: (tx: PrismaTransaction) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(callback);
};

export default prisma;
