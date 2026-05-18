#!/bin/bash
# =============================================================
# deploy.sh — Script de déploiement production Kessabcom v31
# =============================================================
# Usage sur le VPS :
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prérequis sur le VPS :
#   - Docker + Docker Compose installés
#   - Fichier .env présent à côté de ce script
#   - Fichier firebase-service-account.json présent (ou FIREBASE_SERVICE_ACCOUNT_JSON dans .env)
# =============================================================

set -e  # Arrêter le script si une commande échoue

echo ""
echo "🚀 ====== DÉPLOIEMENT KESSABCOM ====== 🚀"
echo ""

# ── 1. Vérification du fichier .env ──────────────────────────
if [ ! -f ".env" ]; then
  echo "❌ ERREUR : Fichier .env introuvable !"
  echo "   Créez un .env à partir du .env.example :"
  echo "   cp .env.example .env && nano .env"
  exit 1
fi

echo "✅ .env trouvé"

# ── 2. Vérification des variables CashPlus ───────────────────
source .env

if [ "$CASHPLUS_MARCHAND_CODE" = "VOTRE_CODE_MARCHAND_CASHPLUS" ] || [ -z "$CASHPLUS_MARCHAND_CODE" ]; then
  echo "⚠️  AVERTISSEMENT : CASHPLUS_MARCHAND_CODE n'est pas configuré."
  echo "   Le paiement CashPlus sera en mode simulation."
fi

if [ "$CASHPLUS_SECRET_KEY" = "VOTRE_CLE_SECRETE_CASHPLUS" ] || [ -z "$CASHPLUS_SECRET_KEY" ]; then
  echo "⚠️  AVERTISSEMENT : CASHPLUS_SECRET_KEY n'est pas configuré."
fi

# ── 3. Pull du dernier code depuis Git ───────────────────────
echo ""
echo "📦 Récupération du dernier code..."
git pull origin main
echo "✅ Code à jour"

# ── 4. Build et redémarrage Docker ───────────────────────────
echo ""
echo "🐳 Build de l'image Docker..."
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

echo ""
echo "⏳ Attente du démarrage (5 secondes)..."
sleep 5

# ── 5. Vérification santé du serveur ─────────────────────────
echo ""
echo "🔍 Vérification de l'état du serveur..."
if curl -sf http://localhost:3000/api/health > /dev/null; then
  echo "✅ Serveur opérationnel sur http://localhost:3000"
else
  echo "❌ Le serveur ne répond pas ! Vérifiez les logs :"
  echo "   docker compose logs -f kessabcom"
  exit 1
fi

# ── 6. Affichage des logs récents ────────────────────────────
echo ""
echo "📋 Logs récents :"
docker compose logs --tail=20 kessabcom

echo ""
echo "✅ ====== DÉPLOIEMENT TERMINÉ ====== ✅"
echo ""
echo "   🌐 Application : https://kessabcom.ma"
echo "   📡 Callback CashPlus : https://kessabcom.ma/api/payments/cashplus/callback"
echo "   🔍 Santé API : https://kessabcom.ma/api/health"
echo ""
