import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price in euros
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(numPrice);
}

/**
 * Handle Prisma errors and return appropriate HTTP responses
 */
export function handlePrismaError(
  error: unknown
): { status: number; message: string } {
  console.error("Prisma Error:", error);

  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    switch (prismaError.code) {
      case "P2002":
        return {
          status: 400,
          message: "Une entrée avec ces données existe déjà",
        };
      case "P2025":
        return {
          status: 404,
          message: "Enregistrement non trouvé",
        };
      case "P2003":
        return {
          status: 400,
          message: "Violation de contrainte de clé étrangère",
        };
      case "P2014":
        return {
          status: 400,
          message: "Les données fournies violent une contrainte relationnelle",
        };
      default:
        return {
          status: 500,
          message: "Erreur de base de données",
        };
    }
  }

  return {
    status: 500,
    message: "Erreur interne du serveur",
  };
}

/**
 * Formate une date au format ISO
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Formate une date au format lisible français
 */
export function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formate un montant en euros
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Calcule le nombre de jours entre deux dates
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Vérifie si une date est passée
 */
export function isPastDate(date: Date): boolean {
  return date < new Date();
}

/**
 * Génère un numéro de facture unique
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  return `FAC-${year}${month}${day}-${timestamp}`;
}

/**
 * Génère un ID de transaction unique
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

/**
 * Calcule le taux de TVA français (20%)
 */
export function calculateTVA(amount: number): number {
  return Math.round(amount * 0.20 * 100) / 100;
}

/**
 * Calcule le montant HT à partir du montant TTC
 */
export function calculateHT(amountTTC: number): number {
  return Math.round((amountTTC / 1.20) * 100) / 100;
}

/**
 * Valide une adresse email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
