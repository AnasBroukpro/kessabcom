# Guide Monétisation — Kessabcom v31
## Variables d'environnement à ajouter dans `.env`

```env
# ── CashPlus Marchand API ──────────────────────────────────
CASHPLUS_BASE_URL=https://cpay.ma/cpws/cpmarchand/index.cfm
CASHPLUS_MARCHAND_CODE=VOTRE_CODE_MARCHAND
CASHPLUS_SECRET_KEY=VOTRE_CLE_SECRETE

# ── SMTP (déjà configuré) ──────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kessabcom.maroc@gmail.com
SMTP_PASS=votre_mot_de_passe_app
```

> ℹ️ Fournir l'URL de callback à CashPlus : définir `CASHPLUS_CALLBACK_URL` dans `.env` (ex: `https://kessabcom.ma/api/payments/cashplus/callback` en prod, ou l'URL Ngrok en dev)

---

## Collections Firestore ajoutées

### `payments` (nouvelle collection)
```
{
  requestId:               "KESSAB_<listingId>_<timestamp>",
  cashplusToken:           "cm442xq9k7",
  cashplusDateExpiration:  "2025-05-20 10:00:00",
  amount:                  500,
  status:                  "payment_pending" | "paid" | "expired" | "failed",
  listingId:               "<announcementId>",
  sellerId:                "<uid>",
  createdAt:               Timestamp,
  updatedAt:               Timestamp,
  paidAt?:                 Timestamp
}
```

### `announcements/{id}/monetizationEvents` (sous-collection)
```
{
  type:          "contact_click" | "listing_reactivated" | "whatsapp_blocked_notification",
  contactType?:  "phone" | "whatsapp" | "location",
  cost?:         2 | 1,
  pointsBefore?: 12,
  pointsAfter?:  10,
  ip?:           "x.x.x.x",
  triggeredBy?:  "<uid>" | "guest",
  paymentId?:    "<paymentDocId>",
  waLink?:       "https://wa.me/...",
  createdAt:     Timestamp
}
```

### Champs ajoutés sur `announcements`
```
monetization: {
  pointsRemaining:   12,      // Démarre à 12, décrément à chaque contact
  pointsUsed:        0,       // Total cumulé des points consommés
  paymentRequired:   false,   // True quand bloqué
  blockedAt:         null,    // Timestamp blocage
  reactivationPrice: 500,     // MAD
  plan:              "free",  // future: "pro", "farm"
  lastReactivatedAt: null,    // Dernier paiement reçu
  lastPaymentId:     null     // Référence vers payments collection
}
```

---

## Nouveaux statuts d'annonce

| Statut | Description |
|---|---|
| `active` | Annonce visible, points > 0 |
| `pending` | En attente de validation admin |
| `sold` | Vendue par le vendeur |
| `paused_for_payment` | Points = 0, paiement de 500 MAD requis |
| `inactive` | Masquée manuellement par le vendeur |

---

## Guide de test manuel

### Test 1 — Quota gratuit de 2 annonces
1. Connectez-vous avec un compte vendeur vierge.
2. Créez annonce n°1 → ✅ Devrait réussir.
3. Créez annonce n°2 → ✅ Devrait réussir.
4. Créez annonce n°3 → ❌ Doit retourner : *"لقد وصلت إلى الحد الأقصى للإعلانات المجانية (2)"*

### Test 2 — Déduction de points (GSM)
1. Sur une fiche annonce, ouvrez le modal de contact.
2. Cliquez sur le bouton **GSM**.
3. Vérifiez dans Firestore : `monetization.pointsRemaining` doit passer de 12 à **10**.
4. Vérifiez la sous-collection `interactions` : une entrée `IP_listingId_phone_YYYY-MM-DD` doit exister.

### Test 3 — Anti-spam (même IP, même jour)
1. Cliquez une 2ème fois sur GSM le même jour.
2. `monetization.pointsRemaining` doit rester à **10** (pas de double débit).
3. L'API répond `{ status: "already_counted" }`.

### Test 4 — Déduction WhatsApp (-2 pts) et Localisation (-1 pt)
- Cliquez WhatsApp → points passent de 10 à **8**.
- Cliquez Localisation → points passent de 8 à **7**.

### Test 5 — Blocage automatique à 0 point
1. Consommez les 12 points via des clics (depuis des IPs différentes ou des jours différents).
2. Au dernier clic : l'annonce doit passer en `paused_for_payment`.
3. Vérifiez :
   - ✅ Firestore : `status = "paused_for_payment"` et `monetization.paymentRequired = true`.
   - ✅ Sous-collection `notifications` du vendeur : nouvelle notification.
   - ✅ Console serveur : `📱 WhatsApp envoyé au vendeur ...`.
   - ✅ Firestore `monetizationEvents` : entrée `whatsapp_blocked_notification` avec le lien `waLink`.

### Test 6 — Blocage des contacts sur annonce bloquée
1. Ouvrez la fiche d'une annonce en `paused_for_payment`.
2. Cliquez "تواصل مع الكساب".
3. Le modal doit afficher "هذا الإعلان موقوف" avec un cadenas 🔒.
4. Aucun bouton de contact ne doit être cliquable.

### Test 7 — Génération token CashPlus
1. En tant que vendeur, allez sur la tab "القطيع ديالي" (`FlockView`).
2. Sur une annonce bloquée, cliquez "خلص 500 درهم".
3. Le `PaymentModal` s'ouvre → Cliquez "ولد كود الدفع".
4. Vérifiez :
   - ✅ La collection `payments` contient un nouveau document.
   - ✅ Le token CashPlus s'affiche dans le modal.
   - ✅ Le bouton "نسخ" copie le token dans le presse-papier.

### Test 8 — Callback HMAC valide
Simulez un callback CashPlus avec cURL :
```bash
# Calculer le HMAC: SHA256(request_id + secret_key) en UPPERCASE
HMAC=$(echo -n "KESSAB_<listingId>_<timestamp><votre_secret>" | sha256sum | tr 'a-z' 'A-Z' | awk '{print $1}')

curl -X POST https://kessabcom.ma/api/payments/cashplus/callback \
  -H "Content-Type: application/json" \
  -d "{\"request_id\": \"KESSAB_<listingId>_<timestamp>\", \"hmac\": \"$HMAC\"}"
```
→ Doit répondre `OK`.

### Test 9 — Callback HMAC invalide
```bash
curl -X POST https://kessabcom.ma/api/payments/cashplus/callback \
  -H "Content-Type: application/json" \
  -d '{"request_id": "KESSAB_xxx", "hmac": "FAKEFAKEFAKE"}'
```
→ Doit répondre `NOK`.

### Test 10 — Réactivation après paiement confirmé
1. Après un callback valide ou via `GET /api/payments/cashplus/check-status/:paymentId` :
2. Vérifiez Firestore :
   - ✅ `payments/{id}.status = "paid"`.
   - ✅ `announcements/{id}.status = "active"`.
   - ✅ `announcements/{id}.monetization.pointsRemaining = 12`.
   - ✅ Nouvelle notification in-app `"✅ تم الدفع - إعلانك رجع نشيط"`.
3. Le FlockView affiche l'annonce comme "نشيط" avec 12/12 points.

### Test 11 — Idempotence double callback
1. Envoyez le même callback valide 2 fois.
2. La réactivation doit s'exécuter UNE seule fois.
3. Le 2ème appel répond `OK` mais ne modifie rien (log: `"Idempotence OK"`).

---

## Décisions techniques

| Décision | Raison |
|---|---|
| Points gérés côté **backend uniquement** | Sécurité : impossible de tricher côté client |
| **Transaction Firestore atomique** pour déduire points | Évite les race conditions sur les clics simultanés |
| Anti-spam par **IP + type + date** | 1 débit max par IP, par type de contact, par jour |
| Helpers `cashplusService.ts` et `whatsappService.ts` **séparés** | Maintenabilité, testabilité, évolutivité |
| Collection `payments` **séparée** des annonces | Permet un audit financier complet indépendant des annonces |
| Sous-collection `monetizationEvents` par annonce | Historique granulaire sans polluer la collection principale |
| **Idempotence** sur le callback CashPlus | Évite la double réactivation si CashPlus envoie le callback 2x |
| HMAC vérifié avec `crypto.timingSafeEqual` | Prévention des timing attacks |
| `paused_for_payment` statut **distinct** de `sold` | Évite toute confusion entre "vendu" et "bloqué pour paiement" |
