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
import https from 'https';

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
const CASHPLUS_CALLBACK_URL = process.env.CASHPLUS_CALLBACK_URL || '';
export const SIMULATION_MODE = process.env.CASHPLUS_SIMULATION_MODE === 'true' ||
  (process.env.CASHPLUS_SIMULATION_MODE !== 'false' && process.env.NODE_ENV !== 'production');

/**
 * Construit l'URL complète pour un endpoint CashPlus.
 * Format: base/cpws/cpmarchand/index.cfm/{endpoint}
 */
function buildCashplusUrl(endpoint: string): URL {
  // Enlève le ?endpoint=xxx s'il existe et utilise le path à la place
  const base = CASHPLUS_BASE_URL.split('?')[0];
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return new URL(`${normalized}${ep}`);
}

function generateSimulatedToken(params: GenerateTokenParams): GenerateTokenResult {
  const token = `SIM_${params.requestId.slice(-8)}_${Date.now().toString(36).toUpperCase()}`;
  const defaultExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateExpiration = (
    `${defaultExpiration.getFullYear()}-${pad(defaultExpiration.getMonth() + 1)}-${pad(defaultExpiration.getDate())} ` +
    `${pad(defaultExpiration.getHours())}:${pad(defaultExpiration.getMinutes())}:${pad(defaultExpiration.getSeconds())}`
  );
  console.log(`🧪 CashPlus SIMULATION: Token généré pour ${params.requestId} => ${token}`);
  return { success: true, token, dateExpiration };
}

function simulateCheckStatus(token: string): CheckStatusResult {
  const isSim = token.startsWith('SIM_');
  if (!isSim) return { success: false, isPaid: false, state: 'new', message: 'Token non simulé' };
  return { success: true, isPaid: false, state: 'new' };
}

/**
 * Génère un token de paiement CashPlus.
 * @param params - Paramètres de la transaction
 * @returns Token CashPlus + date d'expiration
 */
export async function generateCashplusToken(params: GenerateTokenParams): Promise<GenerateTokenResult> {
  if (SIMULATION_MODE) {
    return generateSimulatedToken(params);
  }

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
    console.log('📡 CashPlus Body envoyé:', JSON.stringify(body));
    const data: any = await new Promise((resolve, reject) => {
      const fullBody = JSON.stringify(body);
      const url = buildCashplusUrl('/generate_token');
      const opts: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(fullBody, 'utf8') },
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log(`📡 CashPlus Response (generate_token): HTTP ${res.statusCode} | Body:`, data);
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON: ' + data)); }
        });
      });
      req.on('error', reject);
      req.write(fullBody);
      req.end();
    });

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
    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ CashPlus: API inaccessible (${err.message}).`);
      return { success: false, message: `API CashPlus inaccessible: ${err.message}` };
    }
    console.warn(`⚠️ CashPlus: API inaccessible (${err.message}). Bascule automatique en mode simulation (non-production).`);
    return generateSimulatedToken(params);
  }
}

/**
 * Vérifie le statut d'un token CashPlus (payé ou non).
 * @param token - Le token CashPlus généré
 * @returns Statut du paiement
 */
export async function checkCashplusTokenStatus(token: string): Promise<CheckStatusResult> {
  if (SIMULATION_MODE) {
    return simulateCheckStatus(token);
  }
  if (token.startsWith('SIM_')) {
    console.warn(`⚠️ CashPlus: Token SIM_ détecté alors que le mode simulation est désactivé.`);
    return { success: false, isPaid: false, state: 'new', message: 'Token de simulation invalide pour l\'API réelle.' };
  }

  if (!MARCHAND_CODE || !SECRET_KEY) {
    return { success: false, isPaid: false, state: 'new', message: 'Configuration manquante.' };
  }

  const hmac = computeHmacStatusToken(MARCHAND_CODE, SECRET_KEY);

  try {
    console.log(`📡 CashPlus: Vérification statut token=${token}`);
    const data: any = await new Promise((resolve, reject) => {
      const fullBody = JSON.stringify({ token, marchand_code: MARCHAND_CODE, hmac });
      const url = buildCashplusUrl('/status_token');
      const opts: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(fullBody, 'utf8') },
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log(`📡 CashPlus Response (status_token): HTTP ${res.statusCode} | Body:`, data);
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON: ' + data)); }
        });
      });
      req.on('error', reject);
      req.write(fullBody);
      req.end();
    });

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
    if (!SIMULATION_MODE) {
      console.error(`❌ CashPlus: API inaccessible (${err.message}).`);
      return { success: false, isPaid: false, state: 'new', message: `API CashPlus inaccessible: ${err.message}` };
    }
    console.warn(`⚠️ CashPlus: API inaccessible (${err.message}). Simulation mode.`);
    return simulateCheckStatus(token);
  }
}
