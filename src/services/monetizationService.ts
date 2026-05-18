/**
 * monetizationService.ts
 * ======================
 * Service frontend centralisé pour toute la logique de monétisation.
 * Consomme les endpoints /api/listings/:id/contact/* et /api/payments/*.
 *
 * Architecture :
 * - TOUTE la logique métier de points est côté backend (server.ts).
 * - Ce service n'est qu'une couche d'abstraction HTTP.
 * - Ne JAMAIS calculer les points côté frontend.
 */

import { auth } from '../lib/firebase';

const API_BASE = '/api';

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function apiFetch(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return body;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContactType = 'phone' | 'whatsapp' | 'location';

export interface ContactResult {
  status: 'ok' | 'blocked';
  pointsRemaining: number;
  listingBlocked?: boolean;
  message?: string;
}

export interface PaymentInitResult {
  paymentId: string;
  token: string;
  amount: number;
  dateExpiration: string;
  instructions: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'payment_pending' | 'paid' | 'expired' | 'failed';
  listingReactivated?: boolean;
}

// ─── Contact (Points déduction) ───────────────────────────────────────────────

/**
 * Enregistre un clic de contact et déduit les points côté backend.
 * @returns ContactResult avec le nouveau solde de points
 */
export const monetizationService = {
  async recordContact(listingId: string, type: ContactType): Promise<ContactResult> {
    const headers = await getAuthHeaders();
    return apiFetch(`${API_BASE}/listings/${listingId}/contact/${type}`, {
      method: 'POST',
      headers,
    });
  },

  // ─── Paiement ─────────────────────────────────────────────────────────────

  /**
   * Initie un paiement CashPlus pour réactiver une annonce bloquée.
   * @returns Le token CashPlus à communiquer au vendeur + l'ID interne du paiement
   */
  async initiatePayment(listingId: string): Promise<PaymentInitResult> {
    const headers = await getAuthHeaders();
    return apiFetch(`${API_BASE}/payments/cashplus/generate-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ listingId }),
    });
  },

  /**
   * Vérifie manuellement le statut d'un paiement CashPlus.
   * À appeler après que l'utilisateur affirme avoir payé.
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const headers = await getAuthHeaders();
    return apiFetch(`${API_BASE}/payments/cashplus/check-status/${paymentId}`, {
      method: 'GET',
      headers,
    });
  },
};
