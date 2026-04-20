# Cahier des Charges Fonctionnel Détaillé - Plateforme Kessabcom

## 1. Vision du Projet
**Kessabcom** est une "Marketplace" hybride (Directe et Inversée) dédiée au secteur de l'élevage au Maroc. Elle vise à digitaliser le commerce de bétail en offrant une transparence totale sur les prix, une vérification rigoureuse des vendeurs et des outils d'aide à la décision pour les acheteurs.

---

## 2. Architecture des Profils & Micro-Détails

### 2.1. Profil Acheteur (Buyer)
#### A. Recherche et Découverte
*   **Recherche Géo-localisée :**
    *   Filtre par ville (Sattat, Berrechid, etc.) avec rayon de distance (10km, 20km, 50km, Tout le Maroc).
    *   Vue Carte (Map) avec pins interactifs affichant une mini-preview (Image + Titre + Race).
    *   Vue Liste avec tri par pertinence ou proximité.
*   **Filtres Avancés :** Race (Sardi, Bergui, Timahdit, etc.), Poids estimé, Tranche de prix, Avis du vendeur.

#### B. Système de "Demande d'Offre" (Reverse Marketplace)
*   **Création de Demande :**
    *   Champ "Budget" (ex: "1800 DH").
    *   Champ "Description" textuelle détaillée.
    *   **Micro-détail :** Enregistrement vocal (Mic) pour décrire le besoin sans écrire.
*   **Gestion des Offres Reçues :**
    *   Limite de **6 offres maximum** par demande pour éviter la surcharge.
    *   Statuts de la demande : `Ouvert`, `Complet` (6 offres), `Sélectionné` (offre choisie), `Fermé`.
    *   Actions sur l'offre : "Voir la vidéo", "Écouter l'audio", "Contacter le Kessab" (WhatsApp/Appel).

#### C. Outils d'Aide (Buyer Tools)
*   **Calculatrice de prix :** Estimation basée sur le poids vif et la race.
*   **Estimateur de Transport :** Calcul du coût de livraison selon la distance.
*   **Guide des Races :** Fiches pédagogiques sur les caractéristiques des races marocaines.
*   **Bourse des Moutons :** Graphique des tendances de prix (TrendingUp).

---

### 2.2. Profil Vendeur (Kessab)
#### A. Gestion des Annonces (Troupeau)
*   **Formulaire d'ajout riche :**
    *   Support Vidéo (Upload direct ou lien YouTube).
    *   Galerie de 4 photos minimum recommandée.
    *   **Micro-détail :** Enregistrement audio de description du lot (âge, alimentation, vaccins).
    *   Sélection multiple de tailles (Petit, Moyen, Grand, Très Grand).
*   **Boost & Promotion :** Option pour mettre l'annonce en "Tête de liste" ou "Recommandée".

#### B. Tableau de Bord (Analytics)
*   **KPIs Dynamiques :**
    *   Nombre de vues totales.
    *   Nombre de clics sur "Localisation GPS".
    *   Nombre de contacts directs (Appels/WhatsApp).
*   **Filtres Temporels :** Vue "Aujourd'hui" vs "Ce mois-ci" pour mesurer l'impact des boosts.

#### C. Réponse aux Demandes d'Acheteurs
*   Consultation des demandes publiées dans sa zone géographique.
*   Envoi d'offre incluant : Prix, Description, Vidéo spécifique de la bête, Message vocal.

#### D. Solidarité (Don)
*   Formulaire dédié pour proposer des bêtes en don.
*   Suivi des dons effectués et badges de reconnaissance "Kessab Solidaire".

---

### 2.3. Profil Administrateur (Admin)
#### A. Modération & Sécurité
*   **Validation des Vendeurs :** Vérification des documents (CIN, Certificat de ferme).
*   **Badge "Vérifié" :** Attribué manuellement après contrôle.
*   **Gestion des Signalements :** Interface pour traiter les abus ou fausses annonces.

#### B. Gestion de la Bourse (Stock Market)
*   Mise à jour hebdomadaire des prix de référence par race.
*   Configuration des alertes de prix pour les utilisateurs.

---

## 3. Détails UI/UX & Design System

### 3.1. Identité Visuelle
*   **Couleur Primaire :** Vert Émeraude (`#2E7D32`) évoquant la nature et l'agriculture.
*   **Typographie :** Utilisation de polices sans-serif modernes avec support optimal de l'Arabe (RTL).
*   **Composants :** Cartes arrondies (3xl), ombres légères, boutons à gradients "Hero".

### 3.2. Interactions Micro-Détails
*   **Feedback Visuel :** Squelettes de chargement (Skeletons) lors du fetch des données.
*   **Animations :** Transitions douces entre les vues (Framer Motion).
*   **Accessibilité :** Icônes explicites (Lucide) doublées de texte en Arabe/Français.

---

## 4. Flux de Données & Logique Métier

### 4.1. Cycle de vie d'une Annonce
1.  Création par le Kessab (Statut: `En attente`).
2.  Modération Admin (Statut: `Publié` ou `Rejeté`).
3.  Consultation par les acheteurs.
4.  Archivage automatique après 30 jours ou marquage "Vendu".

### 4.2. Logique de la Reverse Marketplace
*   Une demande est diffusée aux Kessaba dans un rayon de 50km.
*   Dès que 6 Kessaba répondent, la demande disparaît du flux public des vendeurs.
*   L'acheteur reçoit une notification pour chaque nouvelle offre.

---

---

## 5. Spécifications Techniques
*   **Langage :** TypeScript.
*   **Framework :** React 18+.
*   **Gestion d'état :** Hooks React (useState, useEffect, useRef).
*   **Routage :** Système de navigation interne basé sur un état `currentView`.
*   **Multimédia :** Intégration d'iframes YouTube et gestion des blobs audio pour les enregistrements.

---

## 6. Détails des Formulaires et Validations

### 6.1. Publication d'une Annonce (Kessab)
*   **Médias :**
    *   Vidéo principale obligatoire (max 60s).
    *   Minimum 3 photos (Profil, Face, Arrière).
    *   Lien YouTube optionnel avec prévisualisation.
*   **Caractéristiques :**
    *   Nombre de têtes : Entier positif.
    *   Taille : Sélection unique parmi `Petit`, `Moyen`, `Grand`, `Très Grand`.
    *   Race : Sélection unique parmi les races certifiées (Sardi, Bergui, etc.).
*   **Description Vocale :** Enregistrement audio intégré pour expliquer les spécificités (alimentation bio, vaccins à jour).

### 6.2. Demande d'Offre (Acheteur)
*   **Budget :** Format monétaire (DH).
*   **Description :** Texte libre (min 20 caractères).
*   **Audio :** Enregistrement optionnel pour les utilisateurs préférant le vocal.

### 6.3. Soumission d'Offre (Kessab vers Acheteur)
*   **Prix :** Doit être cohérent avec le budget de l'acheteur.
*   **Poids :** Poids estimé en Kg.
*   **Preuve Multimédia :** Possibilité de filmer la bête spécifiquement pour cet acheteur.

---

## 7. Logique des Statuts et Notifications

### 7.1. Cycle de la Demande d'Offre
*   `Ouvert` : La demande est visible par tous les Kessaba à proximité.
*   `Complet` : La limite de 6 offres est atteinte. La demande disparaît du flux "Vendeur".
*   `Sélectionné` : L'acheteur a cliqué sur "Contacter le Kessab" pour une offre précise.
*   `Fermé` : L'acheteur a trouvé son bonheur ou a annulé la demande.

### 7.2. Notifications Temps Réel
*   **Acheteur :** Reçoit une notification (Badge rouge) pour chaque nouvelle offre reçue.
*   **Kessab :** Reçoit une alerte lorsqu'une nouvelle demande est publiée dans sa zone (50km).
*   **Admin :** Alerte pour chaque nouvelle annonce à modérer.

---

## 8. Détails des Plans d'Abonnement

### 8.1. Pour les Acheteurs
*   **Gratuit :** Accès illimité aux annonces, 1 demande d'offre active à la fois.
*   **VIP (29 DH/mois) :**
    *   Accès prioritaire aux nouvelles annonces (1h avant).
    *   Support technique dédié.
    *   Réductions sur le transport partenaire.

### 8.2. Pour les Vendeurs (Kessaba)
*   **Gratuit :** Jusqu'à 5 annonces actives, photos uniquement.
*   **Pro (199 DH/mois) :**
    *   Jusqu'à 20 annonces actives.
    *   Support Vidéo et Audio.
    *   Statistiques détaillées (Vues, Clics GPS).
*   **Pack Ferme (499 DH/mois) :**
    *   Annonces illimitées.
    *   Boosts inclus.
    *   Service de photographie/vidéographie professionnel sur place.

---

## 9. Sécurité et Modération

### 9.1. Vérification d'Identité
*   Le Kessab doit uploader une photo de sa CIN et un justificatif de son exploitation.
*   L'Admin valide manuellement pour débloquer le badge "Kessab Vérifié".

### 9.2. Système de Signalement
*   Bouton "Signaler" sur chaque annonce (Fraude, Prix abusif, Mauvaise race).
*   Blocage automatique du compte après 3 signalements vérifiés.

---

## 11. Implémentation Technique (Firebase & Firestore)

### 11.1. Authentification
*   **Méthode :** Firebase Phone Number Authentication.
*   **Flux :** Saisie du numéro (+212) -> reCAPTCHA invisible -> Réception OTP via SMS -> Vérification OTP -> Création/Récupération du profil Firestore.
*   **Rôles :** Gérés via le champ `role` dans le document utilisateur (`buyer`, `seller`, `admin`).

### 11.2. Structure de la Base de Données (Firestore)
*   **`users` :** Profils utilisateurs (Nom, Ville, Téléphone, Rôle, Statut de vérification).
*   **`announcements` :** Annonces de troupeaux (Titre, Description, Prix, Race, Taille, Médias, ID Vendeur).
*   **`offerRequests` :** Demandes d'offres des acheteurs (Budget, Description, Audio, ID Acheteur, Statut).
*   **`offers` :** Offres envoyées par les vendeurs (Prix, Description, Vidéo, ID Vendeur, ID Demande).
*   **`donations` :** Offres de dons solidaires.

### 11.3. Sécurité (Firestore Rules)
*   **Lecture :** Authentification requise pour la plupart des données.
*   **Écriture :** Validation stricte des types et des formats. Protection des champs immuables (`createdAt`, `uid`).
*   **Propriété :** Seul l'auteur d'un document peut le modifier ou le supprimer (sauf Admin).

