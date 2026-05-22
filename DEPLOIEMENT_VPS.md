# Guide Déploiement VPS — Kessabcom Production

Ce guide explique comment déployer Kessabcom sur votre serveur VPS avec Docker,
en incluant la configuration CashPlus pour les paiements réels.

---

## Étape 1 — Connexion au VPS

```bash
ssh root@VOTRE_IP_VPS
```

---

## Étape 2 — Cloner le projet (première fois seulement)

```bash
cd /opt
git clone https://github.com/anasbrouk/kessabcom-v31.git kessabcom
cd kessabcom
```

---

## Étape 3 — Créer le fichier `.env` sur le VPS

```bash
cp .env.example .env
nano .env
```

Remplissez les valeurs suivantes (les plus critiques) :

```env
# ── Serveur ───────────────────────────────────────────────────
PORT=3000

# ── Firebase Admin (choisir Option B pour production) ─────────
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"kessabcom-0004",...}'
FIREBASE_PROJECT_ID=kessabcom-0004

# ── CashPlus ──────────────────────────────────────────────────
CASHPLUS_BASE_URL=https://cpay.ma/cpws/cpmarchand/index.cfm
CASHPLUS_MARCHAND_CODE=VOTRE_VRAI_CODE
CASHPLUS_SECRET_KEY=VOTRE_VRAIE_CLE

# ── SMTP ──────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kessabcom.maroc@gmail.com
SMTP_PASS=VOTRE_MOT_DE_PASSE_APP
```

> **Astuce Firebase :** Pour générer le JSON sur une seule ligne :
> ```bash
> cat firebase-service-account.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)))"
> ```

---

## Étape 4 — Déployer avec le script automatique

```bash
chmod +x deploy.sh
./deploy.sh
```

Le script va :
1. Vérifier que `.env` est bien configuré
2. Puller le dernier code Git
3. Rebuilder l'image Docker
4. Redémarrer le conteneur
5. Vérifier que le serveur répond sur `/api/health`

---

## Étape 5 — Déclarer l'URL de callback à CashPlus

📧 **Envoyez un email ou appelez CashPlus** pour déclarer votre URL de callback :

```text
{CASHPLUS_CALLBACK_URL}
```

> ℹ️ La variable d'environnement `CASHPLUS_CALLBACK_URL` est définie dans `.env` (ou via Docker/PM2). En production : `https://kessabcom.ma/api/payments/cashplus/callback`
https://kessabcom.ma/api/payments/cashplus/callback
```

CashPlus enverra un POST à cette URL dès qu'un client paie en agence.
Votre serveur doit répondre `OK` (déjà implémenté).

---

## Étape 6 — Configuration Nginx (si applicable)

Si vous utilisez Nginx comme reverse proxy :

```nginx
server {
    listen 443 ssl;
    server_name kessabcom.ma www.kessabcom.ma;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> ⚠️ L'en-tête `X-Forwarded-For` est **critique** pour que l'anti-spam IP fonctionne correctement.

---

## Commandes utiles en production

```bash
# Voir les logs en temps réel
docker compose logs -f kessabcom

# Redémarrer sans rebuild
docker compose restart kessabcom

# Vérifier l'état
docker compose ps

# Mettre à jour depuis Git + restart
./deploy.sh

# Tester le callback CashPlus manuellement
# (remplacer REQUEST_ID et HMAC par des vraies valeurs)
curl -X POST {VOTRE_DOMAIN}/api/payments/cashplus/callback \
  -H "Content-Type: application/json" \
  -d '{"request_id": "TEST_123", "hmac": "XXXXXX"}'

# Vérifier la santé de l'API
curl {VOTRE_DOMAIN}/api/health
```

---

## Checklist finale avant mise en production

- [ ] `.env` sur le VPS avec les vraies clés CashPlus
- [ ] `firebase-service-account.json` présent sur le VPS (ou `FIREBASE_SERVICE_ACCOUNT_JSON` dans `.env`)
- [ ] URL de callback déclarée à CashPlus : `{CASHPLUS_CALLBACK_URL}`
- [ ] SSL/HTTPS activé sur le domaine `kessabcom.ma`
- [ ] Nginx configuré avec `X-Forwarded-For`
- [ ] `docker compose up -d` et `/api/health` répond `{"status":"ok"}`
- [ ] Test d'un paiement réel de 500 MAD en agence CashPlus
