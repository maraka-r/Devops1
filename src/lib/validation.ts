// Schémas de validation avec Zod
// Validation des données d'entrée pour les API et formulaires

import { z } from 'zod';
import { UserRole, UserStatus, MaterielType, MaterielStatus, LocationStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from '@/types';

// ===========================
// SCHÉMAS DE BASE
// ===========================

// Validation des IDs
export const idSchema = z.string().cuid();

// Validation des emails
export const emailSchema = z.string().email('Email invalide');

// Validation des mots de passe
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/(?=.*[a-z])/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/(?=.*[A-Z])/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/(?=.*\d)/, 'Le mot de passe doit contenir au moins un chiffre');

// Validation des numéros de téléphone
export const phoneSchema = z
  .string()
  .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, 'Numéro de téléphone invalide')
  .optional();

// Validation des dates
export const dateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), 'Date invalide')
  .transform((date) => new Date(date));

// Validation des prix
export const priceSchema = z
  .number()
  .positive('Le prix doit être positif')
  .max(99999, 'Le prix ne peut pas dépasser 99,999€');

// ===========================
// SCHÉMAS POUR L'AUTHENTIFICATION
// ===========================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: phoneSchema,
  company: z.string().optional(),
  address: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  token: z.string().min(1, 'Token requis'),
});

// ===========================
// SCHÉMAS POUR LES UTILISATEURS
// ===========================

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  phone: phoneSchema,
  company: z.string().optional(),
  address: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  phone: phoneSchema,
  company: z.string().optional(),
  address: z.string().optional(),
});

// Schéma pour la mise à jour par l'admin (peut modifier le mot de passe)
export const updateUserAdminSchema = z.object({
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  phone: phoneSchema,
  company: z.string().optional(),
  address: z.string().optional(),
});

// Schéma pour la mise à jour du profil utilisateur (client connecté)
export const updateUserProfileSchema = z.object({
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  currentPassword: z.string().optional(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  phone: phoneSchema,
  company: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => {
  // Si on veut changer le mot de passe, le mot de passe actuel est requis
  if (data.password && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Le mot de passe actuel est requis pour modifier le mot de passe',
  path: ['currentPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// ===========================
// SCHÉMAS POUR LES MATÉRIELS
// ===========================

export const createMaterielSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  type: z.nativeEnum(MaterielType),
  description: z.string().optional(),
  pricePerDay: priceSchema,
  status: z.nativeEnum(MaterielStatus).default(MaterielStatus.AVAILABLE),
  specifications: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).default([]),
  manualUrl: z.string().url().optional(),
});

export const updateMaterielSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  type: z.nativeEnum(MaterielType).optional(),
  description: z.string().optional(),
  pricePerDay: priceSchema.optional(),
  status: z.nativeEnum(MaterielStatus).optional(),
  specifications: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).optional(),
  manualUrl: z.string().url().optional(),
});

// Schémas pour les spécifications techniques
export const grueSpecificationsSchema = z.object({
  capaciteMax: z.number().positive('La capacité maximale doit être positive'),
  hauteurMax: z.number().positive('La hauteur maximale doit être positive'),
  porteeMax: z.number().positive('La portée maximale doit être positive'),
  poids: z.number().positive('Le poids doit être positif'),
});

export const nacelleSpecificationsSchema = z.object({
  hauteurTravail: z.number().positive('La hauteur de travail doit être positive'),
  porteeMax: z.number().positive('La portée maximale doit être positive'),
  capacitePersonnes: z.number().int().positive('La capacité doit être un nombre entier positif'),
  poids: z.number().positive('Le poids doit être positif'),
});

export const telescopiqueSpecificationsSchema = z.object({
  capaciteMax: z.number().positive('La capacité maximale doit être positive'),
  hauteurMax: z.number().positive('La hauteur maximale doit être positive'),
  porteeMax: z.number().positive('La portée maximale doit être positive'),
  poids: z.number().positive('Le poids doit être positif'),
});

// ===========================
// SCHÉMAS POUR LES LOCATIONS
// ===========================

export const createLocationSchema = z.object({
  materielId: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  notes: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
}).refine((data) => data.startDate >= new Date(), {
  message: 'La date de début ne peut pas être dans le passé',
  path: ['startDate'],
});

export const updateLocationSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  status: z.nativeEnum(LocationStatus).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
});

// ===========================
// SCHÉMAS POUR LES FILTRES ET PAGINATION
// ===========================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const materielFiltersSchema = z.object({
  type: z.nativeEnum(MaterielType).optional(),
  status: z.nativeEnum(MaterielStatus).optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  search: z.string().optional(),
});

export const locationFiltersSchema = z.object({
  userId: idSchema.optional(),
  materielId: idSchema.optional(),
  status: z.nativeEnum(LocationStatus).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

// ===========================
// SCHÉMAS POUR LES PARAMÈTRES D'URL
// ===========================

export const idParamSchema = z.object({
  id: idSchema,
});

// ===========================
// SCHÉMAS POUR LA FACTURATION
// ===========================

export const createInvoiceSchema = z.object({
  userId: idSchema,
  locationIds: z.array(idSchema).optional(),
  dueDate: dateSchema,
  description: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description requise'),
    quantity: z.number().int().positive('Quantité invalide'),
    unitPrice: z.number().positive('Prix unitaire invalide'),
    locationId: idSchema.optional(),
  })).min(1, 'Au moins un élément requis'),
});

export const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  dueDate: dateSchema.optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const createPaymentSchema = z.object({
  invoiceId: idSchema.optional(),
  amount: z.number().positive('Montant invalide'),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const invoiceFiltersSchema = z.object({
  userId: idSchema.optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const paymentFiltersSchema = z.object({
  userId: idSchema.optional(),
  invoiceId: idSchema.optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const payInvoiceSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive('Montant invalide').optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// ===========================
// TYPES INFÉRÉS
// ===========================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateMaterielInput = z.infer<typeof createMaterielSchema>;
export type UpdateMaterielInput = z.infer<typeof updateMaterielSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type MaterielFiltersInput = z.infer<typeof materielFiltersSchema>;
export type LocationFiltersInput = z.infer<typeof locationFiltersSchema>;
export type GrueSpecificationsInput = z.infer<typeof grueSpecificationsSchema>;
export type NacelleSpecificationsInput = z.infer<typeof nacelleSpecificationsSchema>;
export type TelescopiqueSpecificationsInput = z.infer<typeof telescopiqueSpecificationsSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>;
