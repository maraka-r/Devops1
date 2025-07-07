// Utilitaires pour la gestion des JWT
// Signature, vérification et décodage des tokens

import jwt from 'jsonwebtoken';

// Interface pour le payload JWT
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Clé secrète pour signer les tokens (à déplacer dans les variables d'environnement)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Génère un token JWT
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expiré');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token invalide');
    } else {
      throw new Error('Erreur de vérification du token');
    }
  }
}

/**
 * Décode un token JWT sans vérifier la signature
 * Utile pour lire les informations d'un token côté client
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    console.error('Erreur lors du décodage du token');
    return null;
  }
}

/**
 * Vérifie si un token est expiré
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
}

/**
 * Rafraîchit un token JWT
 */
export function refreshToken(token: string): string {
  try {
    const decoded = verifyToken(token);
    
    // Créer un nouveau token avec les mêmes informations
    const newPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    return generateToken(newPayload);
  } catch {
    throw new Error('Impossible de rafraîchir le token');
  }
}

/**
 * Extrait le token d'une chaîne Authorization
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Valide le format d'un token JWT
 */
export function isValidTokenFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3;
}
