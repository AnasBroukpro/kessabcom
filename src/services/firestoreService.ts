/**
 * firestoreService.ts
 * ===================
 * Architecture note (Bug #22):
 *
 * WRITES  → Express API (/api/*) — secured by Admin SDK + verifyToken middleware.
 * READS (one-shot) — also via Express API for consistency.
 * READS (real-time) — direct Firestore onSnapshot, because HTTP cannot push events.
 *
 * This is intentional: the real-time subscriptions are governed exclusively by
 * firestore.rules (not by server.ts middleware). The rules must therefore be
 * correct and complete. As of this version, isEmailVerified() has been removed
 * from all rules to be compatible with phone authentication.
 *
 * Security posture:
 * - Public collections (announcements, offerRequests): read allowed to anyone — this
 *   is deliberate for a marketplace. Writes still require auth.
 * - Private collections (notifications, favorites): read requires isOwner(userId).
 * - Admin collections: restricted to admin role.
 */
import { auth } from '../lib/firebase';
import { onSnapshot, query, collection, where, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

export const firestoreService = {
  // Auth & Users
  async syncUser(uid: string, email: string, fullName: string, role: string, phone: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ uid, email, fullName, role, phone })
    }).then(res => res.json());
  },

  async getUserProfile(uid: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/users/${uid}`, { headers }).then(res => res.json());
  },

  async getPublicProfile(id: string) {
    return fetch(`${API_BASE}/users/${id}`).then(res => res.json());
  },

  async checkPhoneExists(phone: string) {
    return fetch(`${API_BASE}/auth/check-phone/${encodeURIComponent(phone)}`).then(res => res.json());
  },

  async updateProfile(data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  // Listings (Announcements)
  async getAnnouncements(category?: string) {
    const url = category ? `${API_BASE}/listings?category=${category}` : `${API_BASE}/listings`;
    return fetch(url).then(res => res.json());
  },

  async getAnnouncement(id: string) {
    return fetch(`${API_BASE}/listings/${id}`).then(res => res.json());
  },

  async createAnnouncement(data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async updateAnnouncement(id: string, data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/listings/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async deleteAnnouncement(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/listings/${id}`, {
      method: 'DELETE',
      headers
    }).then(res => res.json());
  },

  async getSellerListings(sellerId: string) {
    try {
      const res = await fetch(`${API_BASE}/listings/seller/${sellerId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("getSellerListings error:", error);
      return [];
    }
  },

  // Requests
  async getOfferRequests() {
    try {
      const res = await fetch(`${API_BASE}/offer-requests`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("getOfferRequests error:", error);
      return [];
    }
  },

  async createOfferRequest(data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offer-requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async getOfferRequest(id: string) {
    return fetch(`${API_BASE}/offer-requests/${id}`).then(res => res.json());
  },

  async deleteOfferRequest(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offer-requests/${id}`, {
      method: 'DELETE',
      headers
    }).then(res => res.json());
  },

  // Offers
  async createOffer(data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async getOffersForRequest(requestId: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offers/request/${requestId}`, { headers }).then(res => res.json());
  },

  async acceptOffer(offerId: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offers/${offerId}/accept`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },

  // Favorites
  async getFavorites() {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/favorites`, { headers }).then(res => res.json());
  },

  async toggleFavorite(listingId: string, isFavorite: boolean) {
    const headers = await getAuthHeaders();
    if (isFavorite) {
      return fetch(`${API_BASE}/favorites/${listingId}`, { method: 'DELETE', headers }).then(res => res.json());
    } else {
      return fetch(`${API_BASE}/favorites`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ listingId })
      }).then(res => res.json());
    }
  },

  // Reports
  async createReport(data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  // Admin section ...

  async adminGetUsers() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/users`, { headers });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  },

  async adminVerifyUser(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/users/${id}/verify`, { method: 'PUT', headers }).then(res => res.json());
  },

  async adminUpdateUserStatus(id: string, status: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status })
    }).then(res => res.json());
  },

  async adminDeleteUser(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers }).then(res => res.json());
  },

  async adminBanUser(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/users/${id}/ban`, { method: 'PUT', headers }).then(res => res.json());
  },

  async adminGetListings() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/listings`, { headers });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching admin listings:", error);
      return [];
    }
  },

  async adminApproveListing(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/listings/${id}/approve`, { method: 'PUT', headers }).then(res => res.json());
  },

  async adminUpdateListingStatus(id: string, status: string, reason?: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/listings/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status, reason })
    }).then(res => res.json());
  },

  async adminDeleteListing(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/listings/${id}`, { method: 'DELETE', headers }).then(res => res.json());
  },

  async adminGetReports() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/reports`, { headers });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching admin reports:", error);
      return [];
    }
  },

  async adminUpdateReportStatus(id: string, status: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/reports/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    }).then(res => res.json());
  },

  async adminDeleteReport(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/reports/${id}`, { method: 'DELETE', headers }).then(res => res.json());
  },

  async adminSystemReset() {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/system-reset`, { method: 'POST', headers }).then(res => res.json());
  },

  async adminGetDonations() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/donations`, { headers });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching admin donations:", error);
      return [];
    }
  },

  async adminGetLogs() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/logs`, { headers });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      return [];
    }
  },

  async adminUpdateSetting(collection: string, data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ collection, data })
    }).then(res => res.json());
  },

  async getSettings() {
    return fetch(`${API_BASE}/settings`).then(res => res.json());
  },

  async createNotification(userId: string, data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/users/${userId}/notify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async boostAnnouncement(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/listings/${id}/boost`, {
      method: "POST",
      headers
    }).then(res => res.json());
  },

  async toggleUserStatus(id: string, activate: boolean) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: activate ? 'active' : 'blocked' })
    }).then(res => res.json());
  },

  async importListings(data: any[]) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/listings/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data })
    }).then(res => res.json());
  },

  async exportCollection(collectionName: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/admin/export?collection=${collectionName}`, { headers }).then(res => res.json());
  },

  async updateOfferStatus(offerId: string, status: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offers/${offerId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    }).then(res => res.json());
  },

  async archiveOfferRequest(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offer-requests/${id}/archive`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },

  async createDonation(data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/donations`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  /**
   * subscribeToFavorites (Bug #23)
   * Reads from users/{userId}/favorites sub-collection.
   * This matches the server-side POST /api/favorites which also writes there.
   * The Firestore rules enforce isOwner(userId) so only the user can see their favorites.
   */
  subscribeToFavorites(userId: string, callback: (favorites: any[]) => void) {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, 'users', userId, 'favorites'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('[subscribeToFavorites] Firestore error:', error.code, error.message);
        callback([]);
      }
    );
  },

  async rateAnnouncement(id: string, rating: number) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/listings/${id}/rate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ rating })
    }).then(res => res.json());
  },

  async addSellerReview(sellerId: string, data: any) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/users/${sellerId}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  async deleteSellerReview(sellerId: string, reviewId: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/users/${sellerId}/reviews/${reviewId}`, {
      method: "DELETE",
      headers
    }).then(res => res.json());
  },

  async deleteOffer(id: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/offers/${id}`, {
      method: 'DELETE',
      headers
    }).then(res => res.json());
  },

  // Stats & Public
  async getPlatformStats() {
    return fetch(`${API_BASE}/stats`).then(res => res.json());
  },

  async getMarketTrends() {
    return fetch(`${API_BASE}/market-trends`).then(res => res.json());
  },

  async submitDonation(data: any) {
    return this.createDonation(data);
  },

  // Real-time subscriptions (Keeping these as client-side onSnapshot for best UX)
  /**
   * subscribeToAnnouncements
   * Public read — firestore.rules: allow read: if true (marketplace listings).
   * Keeping as onSnapshot for real-time UX (new listings appear without page refresh).
   */
  subscribeToAnnouncements(callback: (announcements: any[]) => void) {
    const q = query(
      collection(db, 'announcements'), 
      where('status', '==', 'active'), 
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('[subscribeToAnnouncements] Firestore error:', error.code, error.message);
        // Fall back to REST API on Firestore permission/index error
        this.getAnnouncements().then(callback).catch(console.error);
      }
    );
  },

  /**
   * subscribeToUserNotifications
   * Private read — firestore.rules: allow read: if isOwner(userId).
   * Requires the user to be signed in. Caller must ensure userId is valid.
   */
  subscribeToUserNotifications(userId: string, callback: (notifications: any[]) => void) {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('[subscribeToUserNotifications] Firestore error:', error.code, error.message);
        callback([]);
      }
    );
  },

  /**
   * subscribeToOffersForRequest
   * Private read — requires auth (firestore.rules: allow read: if isSignedIn()).
   */
  subscribeToOffersForRequest(requestId: string, callback: (offers: any[]) => void) {
    if (!requestId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, 'offers'),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('[subscribeToOffersForRequest] Firestore error:', error.code, error.message);
        callback([]);
      }
    );
  },

  /**
   * subscribeToUserRequests
   * Private read — filters by buyerId == current user.
   * firestore.rules: allow read: if true (public collection, but filtered by buyer).
   */
  subscribeToUserRequests(userId: string, callback: (requests: any[]) => void) {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, 'offerRequests'), 
      where('buyerId', '==', userId), 
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('[subscribeToUserRequests] Firestore error:', error.code, error.message);
        callback([]);
      }
    );
  },

  // Re-adding essential methods for existing components
  async incrementContactClick(announcementId: string, type: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/clicks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ listingId: announcementId, type })
    }).catch(() => {});
  },

  async markNotificationAsRead(userId: string, notificationId: string) {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  }
};
