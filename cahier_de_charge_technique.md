# Cahier des Charges Technique Exhaustif - Plateforme Kessabcom v31

*Ce document représente la spécification technique complète et détaillée au plus bas niveau de l'application Kessabcom, destinée aux ingénieurs logiciels, architectes systèmes et administrateurs DevOps.*

---

## 1. Architecture Logicielle et Choix Techniques (Stack)

L'application repose sur un couplage fort entre une **Single Page Application (SPA)** très réactive et un écosystème **BaaS (Firebase)**, soutenu par un **Micro-Service API Node.js** pour les opérations sensibles.

### 1.1 Stack Frontend (Client-Side)
*   **Cœur :** React 18.3.1 avec TypeScript 5.8 (Typage strict activé).
*   **Build & Bundler :** Vite 6.2 (remplace Webpack pour le Hot Module Replacement ultra-rapide).
*   **Routage :** React Router DOM v7 (Gestion des vues, paramètres d'URL `?city=&radius=`, et intercepteurs de route).
*   **State Management :** Context API natif de React (`AuthContext`, `SettingsContext`, `GoogleMapsProvider`).
*   **Styles & UI :** TailwindCSS v4.1 (Moteur JIT), Lucide React (Icônes vectorielles légères).
*   **Animations :** Framer Motion (Transitions de pages, Skeletons, Micro-interactions).
*   **Cartographie :** `@react-google-maps/api` (Rendu des `MarkerF`, `InfoWindowF`, `MarkerClusterer`).
*   **Data Viz :** Recharts 3.8 (Génération de graphiques SVG pour les dashboards vendeurs et admins).

### 1.2 Stack Backend & Base de Données
*   **Serveur API :** Node.js + Express 4.18 (Script `server.ts`).
*   **Base de Données Principale :** Google Cloud Firestore (Base NoSQL temps réel).
*   **Stockage Fichiers :** Firebase Storage (Hébergement des blobs audios, images et vidéos mp4).
*   **Authentification :** Firebase Authentication (Module Phone Auth OTP + intégration Firebase App Check / reCAPTCHA Enterprise).
*   **Communication :** `nodemailer` 6.9 (Protocole SMTP sécurisé TLS).

---

## 2. Dictionnaire de Données (Schémas Firestore Détaillés)

Bien que Firestore soit NoSQL, l'application impose un typage strict via TypeScript (`UserProfile`, `Announcement`, etc.).

### 2.1 Collection Principale : `users`
Contient les métadonnées de l'utilisateur. La clé du document correspond à l'`uid` généré par Firebase Auth.
*   `uid` (string) : Identifiant unique.
*   `phoneNumber` (string) : Numéro formaté (ex: `+2126...`).
*   `email` (string, optionnel) : Email de contact.
*   `fullName` / `displayName` (string) : Nom public.
*   `pseudo` (string, optionnel) : Alias du vendeur.
*   `city` (string) : Ville de résidence.
*   `role` (enum) : `"buyer"` | `"seller"` | `"admin"`.
*   `status` (enum) : `"active"` | `"blocked"`.
*   `verified` (boolean) : True si les documents (CIN) ont été validés par un admin.
*   `createdAt` / `updatedAt` (Timestamp) : Horodatage serveur.
*   **Sous-collections :**
    *   `/notifications` : Contient les alertes (`type`, `message`, `read`, `link`).
    *   `/favorites` : Liste des ID d'annonces sauvegardées.
    *   `/reviews` : Évaluations laissées sur le vendeur (statut `pending` ou `approved`).

### 2.2 Collection : `announcements` (Troupeaux / Annonces)
*   `id` (string) : Auto-généré.
*   `sellerId` (string) : Référence au créateur (`uid`).
*   `sellerName` / `sellerPseudo` (string) : Dénormalisé pour éviter une jointure à la lecture.
*   `title` (string) : Titre de l'annonce (Max 200 char).
*   `description` (string) : Texte détaillé.
*   `price` (number, optionnel) : Prix en MAD.
*   `sheepCount` (number) : Nombre de têtes.
*   `category` (string) : Catégorie principale.
*   `races` (Array<string>) : Ex: `["سردي", "بركي"]`.
*   `sizes` (Array<string>) : Ex: `["grand", "moyen"]`.
*   `weight` / `age` / `ages` (string) : Caractéristiques physiques.
*   `location` / `farmLocation` (string) : Chaînes de localisation.
*   `coordinates` (GeoPoint) : `{ lat: number, lng: number }`.
*   `images` (Array<string>) : URLs Firebase Storage (Max 10).
*   `videoUrl` / `youtubeLink` (string) : Médias animés.
*   `audioUrl` (string) : Lien du blob audio descriptif.
*   `status` (enum) : `"active"` | `"pending"` | `"sold"` | `"paused"`.
*   `views` (number) : Compteur de vues uniques.
*   `clicks` (Object) : `{ phone: number, whatsapp: number }`.
*   **Sous-collections :**
    *   `/interactions` : Logs des vues uniques basés sur l'IP pour éviter le spam de rafraîchissement (`IP_listingId_date`).
    *   `/reviews` : Évaluations de la bête spécifique.

### 2.3 Collection : `offerRequests` (Marketplace Inversée)
*   `buyerId` (string) : Créateur de la demande.
*   `budget` (number) : Budget maximum ciblé.
*   `description` (string) : Besoins spécifiques.
*   `audioRequestUrl` (string) : Note vocale de l'acheteur.
*   `location` (string) : Zone de recherche.
*   `status` (enum) : `"Open"` | `"Active"` | `"Archived"` | `"Completed"`.
*   `offerCount` (number) : Incrémenté via transaction (Maximum défini dans les Settings, ex: 6).

### 2.4 Collection : `offers` (Réponses des Vendeurs)
*   `requestId` (string) : Référence à la demande `offerRequests`.
*   `sellerId` (string) : Émetteur de l'offre.
*   `price` (number) : Proposition tarifaire.
*   `description` (string) : Message d'accompagnement.
*   `mediaUrl` / `videoUrl` (string) : Preuve multimédia (ex: vidéo du mouton proposé).
*   `status` (enum) : `"pending"` | `"accepted"` | `"rejected"`.

### 2.5 Collection : `settings` (Singleton Configuration)
Document unique `global` dictant la logique métier en temps réel sans redéploiement :
*   `maintenanceMode` (boolean) : Force l'affichage du composant `<Maintenance />`.
*   `activationDate` (Timestamp) : Date de fin de maintenance.
*   `guestBuyerMode` (boolean) : Autorise ou non le bypass du `LoginRequiredModal`.
*   `solidarityDonationEnabled` (boolean) : Affiche/Masque les routes `/solidarity-*`.
*   `banners` (Object) : Gestion du `banner1Url`, `banner1Desktop`, `banner1MobileEnabled`.
*   `monetization` (Object) : Tarifs des plans Pro, VIP et Boost (ex: `boost3Days: 49`).

---

## 3. Architecture Contextuelle et Gestion d'État (React)

### 3.1 AuthContext (`src/contexts/AuthContext.tsx`)
Cœur de la sécurité frontend.
*   **Mécanisme :** Écoute `onIdTokenChanged` (et non `onAuthStateChanged`) pour gérer automatiquement la rotation des tokens JWT toutes les heures sans déconnecter silencieusement l'utilisateur.
*   **Récupération Profil :** Dès que le JWT est valide, exécute `firestoreService.getUserProfile(uid)`. Implémente une **stratégie de retry (3 tentatives)** si le profil Firestore n'est pas encore synchronisé (gestion du délai de création).
*   **State Publié :** 
    *   `user` (Objet User Firebase natif).
    *   `profile` (Typé `UserProfile`, issu de Firestore).
    *   `notifications` (Array temps réel via `onSnapshot`).
    *   `unreadCount` (Dérivé des notifications).

### 3.2 SettingsContext (`src/contexts/SettingsContext.tsx`)
Fournit la configuration globale téléchargée depuis `/api/settings`. Fournit un fallback automatique en cas de panne de l'API.

---

## 4. Conception de l'API REST Express (`server.ts`)

Le serveur Node.js est chargé des opérations sécurisées (`Admin SDK`), agissant comme un middleware de confiance.

### 4.1 Middlewares de Sécurité
*   **CORS Strict :** La fonction `cors` filtre les requêtes en vérifiant dynamiquement l'en-tête `Origin` (rejetant les requêtes directes type cURL en production si l'origine n'est pas dans la whitelist `https://kessabcom.ma`).
*   **Rate Limiting (`express-rate-limit`) :** Limitation appliquée par exemple sur `/api/auth/check-phone/:phone` (Max 10 requêtes / minute) pour éviter le brute-force de découverte de numéros.
*   **`verifyToken` :** Intercepte le header `Authorization: Bearer <JWT>`, vérifie sa validité via `auth.verifyIdToken()`, et injecte `req.user`.
*   **`isAdmin` :** Intercepte `req.user.uid`, interroge Firestore (`users`), et rejette avec une erreur `403 Forbidden` si `role !== 'admin'`.

### 4.2 Endpoints Critiques (Extraits)
*   `POST /api/auth/register` : Création/Synchronisation sécurisée de l'utilisateur. Vérifie si le rôle "admin" est usurpé (exige une vérification d'email).
*   `POST /api/listings` : 
    *   Valide le token reCAPTCHA Enterprise (`verifyRecaptcha`) avant l'insertion.
    *   Sanitisation complète des inputs (Trimming, limites de taille `title.slice(0, 200)`, conversion des types `Number(price)`).
    *   Force l'injection de `req.user.uid` dans le champ `sellerId` pour interdire l'usurpation d'auteur.
    *   Vérifie les quotas (si le système de paiement est inactif, vérifie si l'utilisateur a dépassé `maxListingsPerFreeUser`).
*   `PUT /api/auth/profile` : Mise à jour du profil. **Logique de cascade :** Si le nom ou le pseudo change, un `db.batch()` met à jour tous les documents de la collection `announcements` rattachés à ce vendeur.
*   `POST /api/listings/:id/view` : Logique anti-spam. Récupère l'IP du client (`x-forwarded-for`), génère un ID unique (`IP_listingId_date`) et exécute une `db.runTransaction` pour s'assurer qu'une seule vue est comptabilisée par IP et par jour.

---

## 5. Intégrations Tiers et Algorithmes

### 5.1 Sécurité Google reCAPTCHA Enterprise
*   Processus backend : Envoi d'une requête POST vers `https://recaptchaenterprise.googleapis.com/v1/projects/...`.
*   Évaluation du risque : Le système rejette silencieusement toute action ayant un score de confiance inférieur à 0.3 (`data.riskAnalysis?.score < 0.3`) ou si l'`action` (ex: `create_listing`) ne correspond pas. Mode **Fail-closed** implémenté en cas d'indisponibilité de l'API Google.

### 5.2 Géolocalisation & Recherche (Frontend)
*   **Calcul de distance (Formule de Haversine) :** Implémenté mathématiquement dans le composant `Home.tsx` pour trier le catalogue : `R * c` (Rayon de la terre = 6371km).
*   **Auto-Détection IP :** Appel à l'API publique `freeipapi.com` si l'utilisateur n'a pas autorisé le GPS, suivi d'un mapping vers la ville marocaine la plus proche via `cityCoords`.
*   **Normalisation Arabe (`constants/cityMapping.ts`) :** Fonction `normalizeArabic` qui supprime les accents, hamzas, tashkeel et harmonise les lettres (ex: Alif, Yaa) pour rendre la recherche insensible à l'orthographe stricte.

### 5.3 Enregistrement Audio Web (MediaRecorder API)
*   Utilisé dans l'ajout d'annonce et les requêtes.
*   Instanciation de `new MediaRecorder(stream)`. Écoute de l'événement `ondataavailable` pour accumuler les "Chunks" audio.
*   Conversion finale en `new Blob(chunks, { type: 'audio/webm' })` puis transmission à la méthode `firestoreService.uploadFileWithProgress`.

---

## 6. Déploiement et DevOps

### 6.1 Fichier `.env` (Mapping des Variables)
L'infrastructure nécessite un fichier `.env` strict comprenant :
*   `PORT` (Ex: 3001 pour le backend).
*   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (Ou le fichier JSON complet injecté dans `FIREBASE_SERVICE_ACCOUNT_JSON`).
*   `VITE_RECAPTCHA_SITE_KEY` & `GOOGLE_CLOUD_API_KEY`.
*   `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (Configuration Nodemailer).

### 6.2 Dockerisation
*   Le projet comprend un fichier `Dockerfile` multi-stage :
    *   **Build Stage :** `npm run build` (Exécute Vite pour compiler le TS/React en assets statiques HTML/JS/CSS vers le dossier `/dist`).
    *   **Run Stage :** Lance `server.ts` via `tsx` (ou compilé) qui sert simultanément l'API sur `/api/*` et délivre les fichiers statiques du frontend via `express.static('dist')`.
*   `docker-compose.yml` définit le service, le montage des volumes, le mappage des ports (3000:3000) et la politique de redémarrage `always` pour la haute disponibilité.
