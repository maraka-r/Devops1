# 🔒 Documentation Sécurité - Protection des Routes

## Vue d'ensemble

L'application Maraka implémente un système de sécurité complet basé sur les rôles utilisateur avec protection au niveau du middleware Next.js.

## 🎯 Architecture de Sécurité

### Rôles Utilisateurs

| Rôle | Description | Accès |
|------|-------------|-------|
| `ADMIN` | Administrateur système | `/dashboard/*` + API admin |
| `USER` | Client standard | `/client/*` + API client |

### Protection Multi-niveau

#### 1. **Middleware Next.js** (`middleware.ts`)
- ✅ Protection des routes frontend (`/dashboard`, `/client`)
- ✅ Protection des API routes sensibles
- ✅ Redirection automatique selon le rôle
- ✅ Logging des tentatives d'accès non autorisées

#### 2. **Composant RoleBasedRedirect**
- ✅ Redirection côté client après connexion
- ✅ Gestion de l'état d'authentification

#### 3. **Hooks d'authentification**
- ✅ Gestion centralisée des tokens JWT
- ✅ Vérification automatique des droits

## 🛡️ Règles de Protection

### Routes Frontend

```typescript
// ADMIN seulement
/dashboard/* → Seuls les utilisateurs avec role="ADMIN"

// USER (clients) seulement  
/client/* → Seuls les utilisateurs avec role="USER"
```

### Routes API

```typescript
// API publiques (pas d'authentification)
/api/health
/api/auth/login
/api/auth/register
/api/materiels (catalogue public)
/api/materiels/categories

// API ADMIN seulement
/api/dashboard/admin/*
/api/users/*
/api/reports/*
/api/settings/company

// Autres API → Authentification requise
```

## 🔐 Mécanisme de Protection

### 1. Vérification du Token
```typescript
const token = request.cookies.get('token')?.value || 
              request.headers.get('authorization')?.replace('Bearer ', '');
```

### 2. Validation JWT
```typescript
const user: JwtPayload = verifyToken(token);
// Vérifie la signature, l'expiration, et decode le payload
```

### 3. Contrôle d'Accès
```typescript
if (user.role !== 'ADMIN') {
  // Redirection ou erreur 403
}
```

## 🚨 Gestion des Erreurs

### Redirections Automatiques

| Situation | Action |
|-----------|--------|
| Token manquant | → `/auth/login` |
| ADMIN accède à `/client` | → `/dashboard` |
| USER accède à `/dashboard` | → `/client` |
| Token expiré/invalide | → `/auth/login` |

### Réponses API

```typescript
// Token manquant
{ error: "Token d'authentification requis", status: 401 }

// Droits insuffisants
{ error: "Accès interdit - Droits administrateur requis", status: 403 }

// Token invalide
{ error: "Token invalide ou expiré", status: 401 }
```

## 📝 Logging de Sécurité

Le middleware log automatiquement :

```typescript
// Tentatives d'accès non autorisées
console.warn(`🔒 Tentative d'accès non autorisée à ${pathname} par ${user.email} (rôle: ${user.role})`);

// Erreurs de token
console.error('❌ Erreur de vérification du token:', error);
```

## 🧪 Tests de Sécurité

### Page de Test
Accédez à `/middleware-test` pour tester :
- ✅ Connexion/déconnexion
- ✅ Accès aux différentes sections selon le rôle
- ✅ Redirections automatiques

### Comptes de Test

```bash
# Admin
Email: admin@maraka.fr
Password: password123
Accès: /dashboard + API admin

# Client
Email: jean.martin@entreprise-martin.fr  
Password: password123
Accès: /client + API client
```

## 🔧 Configuration

### Variables d'Environnement
```bash
JWT_SECRET="votre-secret-jwt-securise"
JWT_EXPIRES_IN="7d"
```

### Matcher du Middleware
```typescript
export const config = {
  matcher: [
    '/api/:path*',          // Protection API
    '/dashboard/:path*',    // Protection dashboard
    '/client/:path*',       // Protection client
  ],
};
```

## 🚀 Déploiement Sécurisé

### Checklist Pré-Production

- [ ] **Changer le JWT_SECRET** pour une valeur unique et sécurisée
- [ ] **Activer HTTPS** avec certificat SSL/TLS
- [ ] **Configurer les CORS** pour le domaine de production
- [ ] **Tester tous les scénarios** d'accès avec différents rôles
- [ ] **Vérifier les logs** de sécurité en production
- [ ] **Changer les mots de passe** par défaut du seed

### Monitoring

Le middleware capture les métriques de sécurité :
- Tentatives d'accès non autorisées
- Erreurs de token
- Temps de réponse des vérifications

---

**🛡️ La sécurité est un processus continu. Surveillez régulièrement les logs et mettez à jour les protections selon l'évolution des menaces.**
