// Utilitaires pour l'authentification
// Gestion des tokens JWT, validation des mots de passe

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ===========================
// TYPES POUR L'AUTHENTIFICATION
// ===========================

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface TokenData {
  token: string;
  expiresIn: string;
}

// ===========================
// UTILITAIRES POUR LES MOTS DE PASSE
// ===========================

/**
 * Hasher un mot de passe avec bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Vérifier un mot de passe avec bcrypt
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Valider la force d'un mot de passe
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  
  return { isValid: true };
};

// ===========================
// UTILITAIRES POUR LES TOKENS JWT
// ===========================

/**
 * Générer un token JWT
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenData => {
  const token = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);
  
  return {
    token,
    expiresIn: JWT_EXPIRES_IN,
  };
};

/**
 * Vérifier et décoder un token JWT
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
};

/**
 * Extraire le token du header Authorization
 */
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

/**
 * Vérifier si un token est expiré
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
};

// ===========================
// UTILITAIRES POUR LES RÔLES
// ===========================

/**
 * Vérifier si un utilisateur a le rôle requis
 */
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.USER]: 1,
    [UserRole.ADMIN]: 2,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Vérifier si un utilisateur est admin
 */
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === UserRole.ADMIN;
};

// ===========================
// UTILITAIRES POUR LA VALIDATION EMAIL
// ===========================

/**
 * Valider le format d'un email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Normaliser un email (lowercase, trim)
 */
export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};
