import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
