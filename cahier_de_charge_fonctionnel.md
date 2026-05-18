# Cahier des Charges Fonctionnel Détaillé et Exhaustif - Plateforme Kessabcom

*Ce document décrit de manière exhaustive l'ensemble des fonctionnalités, de l'architecture technique, et des règles de gestion implémentées dans le code source de l'application Kessabcom.*

---

## 1. Présentation Générale de l'Application
**Kessabcom** est une plateforme digitale avancée (Marketplace) qui connecte directement les éleveurs (Kessaba) et les acheteurs de bétail au Maroc. 
L'application se distingue par une approche **hybride** :
1. **Marketplace Directe :** Catalogue géolocalisé d'annonces de bétail.
2. **Marketplace Inversée (Reverse Marketplace) :** Les acheteurs publient un besoin, et les vendeurs y répondent par des offres ciblées.

Le système intègre également une dimension sociale via un **Module de Solidarité** et des outils d'information du marché (Bourse des moutons).

---

## 2. Rôles et Parcours Utilisateurs

### 2.1. Visiteur (Non Connecté) / Mode Invité (Guest Mode)
L'application est conçue pour l'acquisition d'utilisateurs via un accès fluide sans friction initiale.
*   **Page d'Accueil Dynamique (`Home.tsx`) :**
    *   **Hero Section :** Bannières attractives, compte à rebours dynamique jusqu'à l'Aïd.
    *   **Recherche Express :** Barre de recherche intelligente (Ville, Rayon kilométrique, Bouton "Près de chez moi" utilisant la géolocalisation HTML5 ou l'API IP).
    *   **News Ticker :** Bandeau défilant d'actualités ou de promotions.
    *   **Catalogue Rapide :** Grille des annonces "À la une" classées par proximité algorithmique.
*   **Mode Invité (Guest Buyer Mode) :** Si activé par l'administrateur, un visiteur peut naviguer dans les résultats de recherche (`SearchResults.tsx`) et visualiser le détail des annonces (`ListingDetails.tsx`) sans être bloqué par un écran de connexion, maximisant ainsi le taux d'engagement. Le blocage n'intervient qu'au moment de l'action de contact (Affichage d'une modale `LoginRequiredModal`).
*   **Authentification (`Auth.tsx`) :** Système de connexion ultra-sécurisé via numéro de téléphone marocain (+212) utilisant **Firebase Authentication avec reCAPTCHA**.

### 2.2. Acheteur (Buyer)
Le profil Acheteur dispose d'un espace personnel riche orienté sur la prise de décision.
*   **Tableau de Bord Acheteur (`BuyerDashboard.tsx`) :** Interface centralisée avec menu de navigation latérale (Sidebar).
*   **Recherche et Exploration (`SearchResults.tsx`) :**
    *   **Vue Mixte :** Basculement fluide entre une vue Liste (Cartes) et une vue Carte Interactive (Google Maps avec regroupement/clustering des fermes).
    *   **Filtres Avancés :** Filtrage multicritères (Race, Tranche de prix, Taille, Disponibilité vidéo/audio).
*   **Détail d'une Annonce (`ListingDetails.tsx`) :**
    *   **Galerie Multimédia :** Lecteur vidéo natif/YouTube, slider photo, et lecteur audio pour écouter la description vocale du Kessab.
    *   **Actions :** Sauvegarde en favoris (`FavoritesView`), bouton de signalement, et Contact Direct.
*   **Système de Demande d'Offre (Reverse Marketplace) :**
    *   **Création (`RequestAnimalView`) :** L'acheteur définit un budget cible, la ville, une description, et peut enregistrer un **mémo vocal** (Audio Blob) directement depuis le navigateur.
    *   **Gestion (`BuyerRequestsView` / `KessabaOffersView`) :** Suivi des requêtes envoyées. Le système plafonne techniquement les réponses à **6 offres par demande** pour éviter le spam. L'acheteur peut accepter, refuser ou appeler le vendeur.
*   **Outils d'Aide à l'Achat (`ToolsView` / `PriceCatalog`) :**
    *   Calculatrice d'estimation basée sur le poids vif.
    *   Historique et consultation des cours du marché en temps réel (Bourse des moutons).

### 2.3. Vendeur / Éleveur (Kessab)
Le profil Vendeur dispose d'outils professionnels pour la gestion de son cheptel et la relation client.
*   **Tableau de Bord Vendeur (`SellerDashboard.tsx`) :**
    *   **Force de Navigation :** Un mécanisme de "Guard" dans le routeur (`App.tsx`) vérifie si le vendeur possède au moins une annonce. Si son catalogue est vide, il est redirigé de force vers `AddListing.tsx`.
*   **Gestion du Troupeau (`FlockView` / `AddListing.tsx`) :**
    *   **Formulaire Riche (61KB de logique) :** Validation stricte, upload simultané de multiples photos, enregistrement vocal direct, définition des races (Sardi, Bergui...), sélection de gabarit.
    *   **Gestion des Stocks :** Possibilité de marquer comme vendu, de modifier ou de supprimer (avec `DeleteConfirmationModal`).
*   **Traitement des Demandes Acheteurs :**
    *   Visualisation d'un flux de demandes ("Acheteurs cherchant dans ma zone").
    *   Soumission d'offres contenant un prix spécifique et une vidéo dédiée.
*   **Statistiques et Analytique (`SellerStats.tsx`) :**
    *   Tableaux de bord visuels générés avec la librairie `recharts`.
    *   Suivi des KPIs : Nombre d'impressions, taux de clics sur "Voir le numéro", clics sur le GPS (Google Maps).
*   **Abonnements (`SubscriptionView`) :** Interface de montée en gamme (Gratuit, Pro, VIP) gérant les limites d'annonces et les options de boost.

### 2.4. Administrateur (Super Admin)
Le cœur de modération et de configuration du système (`AdminDashboard.tsx`, fichier de 277KB).
*   **Vue d'Ensemble & Analytiques :** Métriques globales de la plateforme (Trafic, Inscriptions, Volume d'annonces).
*   **Gestion des Utilisateurs :** Vue liste avec filtres, possibilité de bannir, de changer le rôle, ou d'attribuer le **Badge "Vérifié"** après contrôle des documents d'identité du Kessab.
*   **Modération du Contenu :** File d'attente des annonces à valider, traitement des signalements utilisateurs.
*   **Gestion de la Bourse :** Interface pour la mise à jour hebdomadaire des prix de référence par région et par race.
*   **Configuration Système (`SettingsView`) :**
    *   **Mode Maintenance :** Interrupteur d'urgence avec programmation d'une `activationDate` (Affiche la vue `Maintenance.tsx` à tous sauf aux admins).
    *   **Toggle Solidarité :** Activation/Désactivation globale du module de dons.
    *   **Gestion Publicitaire :** Édition du contenu du `NewsTicker` et des bannières promotionnelles (Banner 1 & 2).

---

## 3. Modules Transversaux

### 3.1. Espace de Solidarité (Dons)
Si activé par l'administration, la plateforme offre deux vues dédiées :
*   `SolidarityRequest.tsx` : Formulaire pour les familles nécessiteuses demandant une aide pour l'Aïd.
*   `SolidarityDonate.tsx` : Interface pour les Kessaba ou bienfaiteurs souhaitant proposer des moutons gratuitement.

### 3.2. Moteur de Recherche et Cartographie
*   **Intégration Google Maps (`@react-google-maps/api`) :**
    *   Composant `GoogleMap.tsx` centralisé.
    *   Marqueurs interactifs avec fenêtres d'information (InfoWindows).
*   **Normalisation de la Recherche :** Algorithme de recherche de villes robuste (`constants/cityMapping.ts`) supportant l'arabe avec suppression des accents et correspondances par alias.

### 3.3. Centre de Notifications Omnicanal
*   **In-App (`NotificationSidebar.tsx`) :** Tiroir latéral affichant les alertes en temps réel (Firestore listeners).
*   **API WhatsApp :** Logique de génération de liens "Click-to-Chat" `wa.me` avec encodage URI rigoureux pour assurer la prise en charge des caractères arabes, emojis, et sauts de ligne.
*   **Service Email Parallèle (`nodemailer`) :** API backend Node.js (`server.ts`) envoyant des e-mails transactionnels (ex: Alertes de modération, validations) via SMTP.

---

## 4. Architecture Technique

### 4.1. Technologies Frontend
*   **Core :** React 18, TypeScript.
*   **Routage :** React Router v7 (`BrowserRouter`) avec gestion d'état complexe et redirections (Auth Guards).
*   **Interface & UX :** TailwindCSS v4 pour le styling, composants lucide-react pour l'iconographie, `framer-motion` pour des transitions de pages fluides (Micro-animations).
*   **Performances Web :** Implémentation du **Lazy Loading (React.lazy et Suspense)** sur la quasi-totalité des vues (Buyer, Seller, Admin, Auth) pour optimiser le bundle initial (critique pour la navigation 3G/4G).
*   **Résilience :** Présence d'un composant global **Error Boundary** dans `App.tsx` pour capturer les erreurs d'exécution et afficher un écran de récupération propre au lieu d'un crash silencieux (Écran blanc).

### 4.2. Infrastructure Backend & Firebase
*   **Base de Données :** Firestore (NoSQL).
    *   Système de requêtage en temps réel avec écouteurs (`onSnapshot`) isolés dans des hooks personnalisés.
*   **API Express (`server.ts`) :**
    *   Serveur Node.js (Express, CORS, express-rate-limit).
    *   Gère les endpoints complexes qui nécessitent des privilèges (Firebase Admin SDK), l'envoi d'emails (`nodemailer`), et potentiellement les webhooks de paiement ou de SMS.
*   **Déploiement :** Conteneurisation via Docker (`Dockerfile`, `docker-compose.yml`, `.dockerignore`) permettant des lancements isolés et la gestion des variables d'environnement (`.env`).

---

## 5. Schéma de la Base de Données (Collections Firestore)

1.  **`users` :**
    *   Champs clés : `uid`, `phoneNumber`, `role` (`buyer`, `seller`, `admin`), `fullName`, `city`, `isVerified`, `createdAt`.
2.  **`announcements` (ou `listings`) :**
    *   Champs clés : `id`, `sellerId`, `title`, `price`, `breed`, `weight`, `size`, `location`, `coordinates` (GeoPoint), `media` (Array URLs), `audioUrl`, `status` (`active`, `pending`, `sold`, `paused`), `stats` (views, clicks).
3.  **`offerRequests` (Demandes Acheteurs) :**
    *   Champs clés : `buyerId`, `budget`, `description`, `audioRequestUrl`, `location`, `status` (`open`, `completed`, `closed`), `offerCount`.
4.  **`offers` (Réponses Vendeurs) :**
    *   Champs clés : `requestId`, `sellerId`, `price`, `description`, `mediaUrl`, `status`.
5.  **`settings` (Configuration Globale) :**
    *   Document unique contenant : `maintenanceMode`, `activationDate`, `guestBuyerMode`, `solidarityDonationEnabled`, `bannersConfig`.
6.  **`notifications` :**
    *   Sous-collection des utilisateurs pour le système de messagerie in-app (`type`, `message`, `read`, `timestamp`).

---

## 6. Workflow et Statuts Spécifiques

### 6.1. Cycle de vie d'une Annonce (Listing)
1.  **Création :** Le Kessab soumet le formulaire. Statut initial : `pending` (En attente).
2.  **Modération :** L'admin valide. Statut passe à `active` (Publié).
3.  **Interactions :** Les compteurs de vues et clics s'incrémentent.
4.  **Clôture :** L'annonce est modifiée manuellement en `sold` (Vendu) ou supprimée (Soft delete ou Hard delete).

### 6.2. Logique de Navigation Sécurisée (App.tsx Routing Guard)
*   Un système d'interception écoute les changements de l'état d'authentification (`profile`).
*   Si un `buyer` tente d'accéder à l'URL `/seller`, il est forcé vers `/buyer`.
*   Si un `seller` accède à `/login` alors qu'il est déjà connecté, l'application vérifie asynchronement (`hasUserListings`) :
    *   S'il a des annonces -> Redirection vers son Dashboard.
    *   S'il n'a pas d'annonces -> Redirection immédiate vers `/add-listing`.

---

*Fin du document. Ce cahier des charges représente l'état exact et exhaustif du code applicatif Kessabcom v31 (Front-end React, Back-end Express/Firebase, et configuration DevOps).*
