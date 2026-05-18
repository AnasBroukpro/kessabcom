/**
 * whatsappService.ts
 * ==================
 * Service d'envoi de messages WhatsApp automatiques.
 * 
 * Couche d'abstraction modulaire :
 * - Actuellement via lien wa.me (Click-to-Send manuel)
 * - Prêt à être branché sur WhatsApp Business API officielle
 *   ou n'importe quel provider (Twilio, 360dialog, etc.)
 *
 * IMPORTANT : Ce service n'effectue PAS d'appel vocal.
 * Il génère uniquement des messages texte.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppMessage {
  to: string;       // Numéro de téléphone (format international: 212XXXXXXXXX)
  message: string;
}

interface SendResult {
  success: boolean;
  method: 'wa_link' | 'api';
  link?: string;     // Lien wa.me généré (pour copier/coller manuellement)
  message?: string;
}

// ─── Normalisation du numéro ──────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '212' + clean.substring(1);
  if (!clean.startsWith('212')) clean = '212' + clean;
  return clean;
}

// ─── Providers ────────────────────────────────────────────────────────────────

/**
 * Méthode actuelle : génère un lien wa.me.
 * En production, ce lien est utilisé par l'admin/système
 * pour envoyer le message manuellement ou via un bot.
 */
function sendViaWaLink(params: WhatsAppMessage): SendResult {
  const phone = normalizePhone(params.to);
  const encodedMessage = encodeURIComponent(params.message);
  const link = `https://wa.me/${phone}?text=${encodedMessage}`;

  console.log(`📱 WhatsApp (wa.me): Message préparé pour ${phone}`);
  console.log(`   Lien: ${link.substring(0, 120)}...`);
  console.log(`   Message: ${params.message.substring(0, 100)}...`);

  // Dans le futur, insérer ici l'appel à l'API WhatsApp Business :
  // await axios.post('https://graph.facebook.com/v18.0/{phone_id}/messages', {...})

  return { success: true, method: 'wa_link', link };
}

// ─── Messages Métier ──────────────────────────────────────────────────────────

/**
 * Envoie un message WhatsApp quand une annonce est bloquée pour paiement.
 * @param sellerPhone - Numéro du vendeur
 * @param listingTitle - Titre de l'annonce
 * @returns Résultat de l'envoi
 */
export async function sendListingBlockedMessage(
  sellerPhone: string,
  listingTitle: string
): Promise<SendResult> {
  const message = [
    '🔔 *تنبيه من منصة kessabcom.ma*',
    '',
    `السلام عليكم،`,
    ``,
    `إعلانك *"${listingTitle}"* وصل للحد المجاني.`,
    `تم إيقافه مؤقتاً.`,
    ``,
    `باش تعيد تشغيله، خاصك تخلص *500 درهم*.`,
    ``,
    `تواصل معنا أو ادفع مباشرة من حسابك في المنصة.`,
    ``,
    `شكراً على ثقتك 🤝`,
    `— فريق kessabcom.ma`,
  ].join('\n');

  return sendViaWaLink({ to: sellerPhone, message });
}

/**
 * Envoie une confirmation après paiement et réactivation de l'annonce.
 */
export async function sendPaymentConfirmedMessage(
  sellerPhone: string,
  listingTitle: string
): Promise<SendResult> {
  const message = [
    '✅ *تأكيد الدفع - kessabcom.ma*',
    '',
    'السلام عليكم،',
    '',
    `تم استلام دفعتك بنجاح.`,
    `إعلانك *"${listingTitle}"* رجع نشيط الآن.`,
    ``,
    `عندك 12 نقطة جديدة للتواصل.`,
    ``,
    `شكراً على ثقتك 🤝`,
    `— فريق kessabcom.ma`,
  ].join('\n');

  return sendViaWaLink({ to: sellerPhone, message });
}
