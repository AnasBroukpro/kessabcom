/**
 * cashplusService.ts
 * ==================
 * Service d'intégration de l'API CashPlus Marchand (2025).
 * Toute la logique de génération de token, vérification de statut,
 * validation HMAC et callback est centralisée ici.
 *
 * Documentation CashPlus : /generate_token, /status_token, /token_status_for_period
 *
 * Variables d'environnement requises :
 *   CASHPLUS_BASE_URL       ex: https://cpay.ma/cpws/cpmarchand/index.cfm
 *   CASHPLUS_MARCHAND_CODE  ex: KESSABCOM001
 *   CASHPLUS_SECRET_KEY     ex: (clé secrète fournie par CashPlus)
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateTokenParams {
  requestId: string;
  amount: number;
  fees?: number;
  jsonData?: Array<{ key: string; value: string }>;
  dateExpiration?: string; // format: yyyy-mm-dd HH:nn:ss
}

export interface GenerateTokenResult {
  success: boolean;
  token?: string;
  dateExpiration?: string;
  message?: string;
}

export interface CheckStatusResult {
  success: boolean;
  isPaid: boolean;
  state: 'new' | 'expired' | 'paid';
  datePaid?: string;
  message?: string;
}

// ─── HMAC Helpers ─────────────────────────────────────────────────────────────

/**
 * Calcule le HMAC pour la génération de token.
 * Formule: UPPERCASE(SHA2(marchand_code + secret_key + amount))
 */
export function computeHmacGenerateToken(
  marchandCode: string,
  secretKey: string,
  amount: number
): string {
  const payload = `${marchandCode}${secretKey}${amount}`;
  return crypto.createHash('sha256').update(payload).digest('hex').toUpperCase();
}

/**
 * Calcule le HMAC pour la vérification de statut.
 * Formule: UPPERCASE(SHA2(marchand_code + secret_key))
 */
export function computeHmacStatusToken(
  marchandCode: string,
  secretKey: string
): string {
  const payload = `${marchandCode}${secretKey}`;
  return crypto.createHash('sha256').update(payload).digest('hex').toUpperCase();
}

/**
 * Vérifie le HMAC du callback CashPlus.
 * Formule: UPPERCASE(SHA2(request_id + secret_key))
 */
export function verifyCallbackHmac(
  requestId: string,
  receivedHmac: string,
  secretKey: string
): boolean {
  const payload = `${requestId}${secretKey}`;
  const expected = crypto.createHash('sha256').update(payload).digest('hex').toUpperCase();
  // Utilisation d'un timing-safe comparison pour éviter les timing attacks
  if (expected.length !== receivedHmac.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(receivedHmac.toUpperCase(), 'utf8')
  );
}

// ─── Service Principal ────────────────────────────────────────────────────────

const CASHPLUS_BASE_URL = process.env.CASHPLUS_BASE_URL || 'https://cpay.ma/cpws/cpmarchand/index.cfm';
const MARCHAND_CODE = process.env.CASHPLUS_MARCHAND_CODE || '';
const SECRET_KEY = process.env.CASHPLUS_SECRET_KEY || '';

/**
 * Génère un token de paiement CashPlus.
 * @param params - Paramètres de la transaction
 * @returns Token CashPlus + date d'expiration
 */
export async function generateCashplusToken(params: GenerateTokenParams): Promise<GenerateTokenResult> {
  if (!MARCHAND_CODE || !SECRET_KEY) {
    console.error('❌ CashPlus: CASHPLUS_MARCHAND_CODE ou CASHPLUS_SECRET_KEY manquant dans .env');
    return { success: false, message: 'Configuration CashPlus manquante sur le serveur.' };
  }

  const hmac = computeHmacGenerateToken(MARCHAND_CODE, SECRET_KEY, params.amount);

  // Expiration dans 24h par défaut si non fournie
  const defaultExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateExpiration = params.dateExpiration || (
    `${defaultExpiration.getFullYear()}-${pad(defaultExpiration.getMonth() + 1)}-${pad(defaultExpiration.getDate())} ` +
    `${pad(defaultExpiration.getHours())}:${pad(defaultExpiration.getMinutes())}:${pad(defaultExpiration.getSeconds())}`
  );

  const body: Record<string, any> = {
    request_id: params.requestId,
    amount: params.amount,
    fees: params.fees ?? 0,
    marchand_code: MARCHAND_CODE,
    hmac,
    date_expiration: dateExpiration,
  };

  if (params.jsonData) {
    body.json_data = JSON.stringify(params.jsonData);
  }

  try {
    console.log(`📡 CashPlus: Génération token pour request_id=${params.requestId}, montant=${params.amount} MAD`);
    const res = await fetch(`${CASHPLUS_BASE_URL}?endpoint=/generate_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data: any = await res.json();
    console.log('📡 CashPlus Response (generate_token):', JSON.stringify(data));

    if (data.SUCCESS === 1) {
      return {
        success: true,
        token: data.TOKEN,
        dateExpiration: data.DATE_EXPIRATION,
      };
    } else {
      return { success: false, message: data.MESSAGE || 'Erreur CashPlus inconnue.' };
    }
  } catch (err: any) {
    console.error('❌ CashPlus: Erreur réseau generate_token:', err.message);
    return { success: false, message: `Erreur réseau CashPlus: ${err.message}` };
  }
}

/**
 * Vérifie le statut d'un token CashPlus (payé ou non).
 * @param token - Le token CashPlus généré
 * @returns Statut du paiement
 */
export async function checkCashplusTokenStatus(token: string): Promise<CheckStatusResult> {
  if (!MARCHAND_CODE || !SECRET_KEY) {
    return { success: false, isPaid: false, state: 'new', message: 'Configuration manquante.' };
  }

  const hmac = computeHmacStatusToken(MARCHAND_CODE, SECRET_KEY);

  try {
    console.log(`📡 CashPlus: Vérification statut token=${token}`);
    const res = await fetch(`${CASHPLUS_BASE_URL}?endpoint=/status_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, marchand_code: MARCHAND_CODE, hmac }),
    });

    const data: any = await res.json();
    console.log('📡 CashPlus Response (status_token):', JSON.stringify(data));

    if (data.SUCCESS !== 1) {
      return { success: false, isPaid: false, state: 'new', message: data.MESSAGE };
    }

    return {
      success: true,
      isPaid: data.IS_PAID === true,
      state: data.STATE,
      datePaid: data.DATE_PAID,
    };
  } catch (err: any) {
    console.error('❌ CashPlus: Erreur réseau status_token:', err.message);
    return { success: false, isPaid: false, state: 'new', message: err.message };
  }
}
