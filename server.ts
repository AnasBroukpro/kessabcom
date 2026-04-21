import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";

import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";
import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (for Auth only)
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};

if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} else {
  console.warn('⚠️ firebase-applet-config.json missing, using environment variables');
  firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
  };
}

if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔑 Using service account from:', serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId: firebaseConfig.projectId,
    });
  } else {
    console.warn('⚠️ No service account file found, falling back to applicationDefault');
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      credential: admin.credential.applicationDefault()
    });
  }
}

// Initialize Firestore with named database
const firestoreOptions: any = {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
};

const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
if (fs.existsSync(serviceAccountPath)) {
  firestoreOptions.keyFilename = serviceAccountPath;
}

const db = new Firestore(firestoreOptions);
const auth = admin.auth();

// Helper to verify reCAPTCHA Enterprise token
const verifyRecaptcha = async (token: string, action: string) => {
  if (!token) return false;
  const projectID = firebaseConfig.projectId;
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
  
  if (!apiKey || !siteKey) {
    console.warn('⚠️ reCAPTCHA skip: missing API_KEY or SITE_KEY in env');
    return true; // Don't block if not configured
  }

  try {
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectID}/assessments?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: {
          token: token,
          siteKey: siteKey,
          expectedAction: action,
        },
      }),
    });
    
    const data: any = await response.json();
    console.log('🛡️ reCAPTCHA Assessment Result:', JSON.stringify(data, null, 2));

    if (!data.tokenProperties?.valid) {
      console.warn('❌ reCAPTCHA invalid:', data.tokenProperties?.invalidReason);
      return false;
    }
    
    // Check score (0.0 to 1.0, where 1.0 is very likely a human)
    if (data.riskAnalysis?.score < 0.3) {
      console.warn('❌ reCAPTCHA low score:', data.riskAnalysis?.score);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ reCAPTCHA error:', error);
    return true; // Fallback to allow progress if API fails
  }
};

// Middleware: Verify Token
const verifyToken = async (req: any, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = header.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Middleware: Admin Only
const isAdmin = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    if (userData?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error checking role' });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Middleware
  app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://kessabcom.ma', 'https://www.kessabcom.ma'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]); // Fallback to first
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Simple In-memory Rate Limiter for sensitive endpoints
  const phoneCheckLimiter: Record<string, { count: number, resetAt: number }> = {};

  // --- PUBLIC ENDPOINTS ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- SETTINGS ENDPOINTS ---
  app.get("/api/settings", async (req, res) => {
    console.log('📡 API: Fetching settings...');
    try {
      const snap = await db.collection('settings').get();
      console.log(`✅ API: Settings fetched (${snap.size} docs)`);
      const settings: any = {};
      snap.docs.forEach(doc => {
        settings[doc.id === 'global' ? 'main' : doc.id] = doc.data();
      });
      res.json(settings);
    } catch (e: any) {
      console.error("❌ API: Settings fetch failed:", e.message);
      // Return default settings structure so frontend doesn't crash
      res.json({
        main: { solidarityDonationEnabled: true, maintenanceMode: false, monetization: { proMonthly: 199, farmMonthly: 499, boost3Days: 49, boost7Days: 99 } }
      });
    }
  });

  app.put("/api/settings", verifyToken, isAdmin, async (req: any, res) => {
    try {
      const { collection = 'global', data } = req.body;
      await db.collection('settings').doc(collection).set(data, { merge: true });
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- STATS ---
  app.get("/api/stats", async (req, res) => {
    try {
      const usersCount = (await db.collection('users').count().get()).data().count;
      const listingsCount = (await db.collection('announcements').where('status', '==', 'active').count().get()).data().count;
      const requestsCount = (await db.collection('offerRequests').count().get()).data().count;
      
      res.json({
        totalUsers: usersCount,
        activeListings: listingsCount,
        totalRequests: requestsCount,
        regionsCovered: 12,
        lastUpdated: new Date().toISOString()
      });
    } catch (e) {
      console.error("Stats error:", e);
      res.json({ totalUsers: 0, activeListings: 0, totalRequests: 0 });
    }
  });

  app.get("/api/market-trends", (req, res) => {
    res.json([
      { breed: "سردي", trend: "up", change: "+2.5%", avgPrice: 3200 },
      { breed: "بركي", trend: "stable", change: "0%", avgPrice: 2800 },
      { breed: "مستورد", trend: "down", change: "-1.2%", avgPrice: 3500 }
    ]);
  });

  app.get("/api/categories", (req, res) => {
    res.json(["سردي", "بركي", "تيمحضيت", "بني كيل", "دمّان", "إسباني", "روماني"]);
  });

  app.get("/api/cities", (req, res) => {
    res.json(["سطات", "برشيد", "خريبكة", "الدار البيضاء", "الرباط", "مراكش", "أزرو", "خنيفرة", "وجدة", "الراشيدية", "طنجة"]);
  });

  // --- AUTH & USER ENDPOINTS ---

  app.post("/api/auth/register", async (req, res) => {
    const { uid, email, fullName, role } = req.body;
    const phone = req.body.phone || req.body.phoneNumber;
    console.log(`📝 API: Registering user ${uid} with role: ${role}, phone: ${phone}`);
    try {
      await db.collection('users').doc(uid).set({
        email: email || '',
        fullName: fullName || '',
        phoneNumber: phone || '',
        role: role || '', // Remove default 'buyer' to detect incomplete profiles
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`✅ API: User ${uid} profile created/updated`);
      res.status(201).json({ message: "User profile created" });
    } catch (e: any) {
      console.error(`❌ API: Registration error for ${uid}:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", verifyToken, async (req: any, res) => {
    // Just sync/verify user exists
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.json({ status: "ok", role: userDoc.data()?.role });
  });

  app.get("/api/auth/me", verifyToken, async (req: any, res) => {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User profile not found" });
    res.json({ id: userDoc.id, ...userDoc.data() });
  });

  app.get("/api/auth/check-phone/:phone", (req, res, next) => {
    // Simple rate limit: 10 checks per minute per IP
    const ip = req.ip || req.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    if (!phoneCheckLimiter[ip] || now > phoneCheckLimiter[ip].resetAt) {
      phoneCheckLimiter[ip] = { count: 1, resetAt: now + 60000 };
    } else {
      phoneCheckLimiter[ip].count++;
    }
    if (phoneCheckLimiter[ip].count > 10) {
      return res.status(429).json({ error: "Too many attempts. Please wait a minute." });
    }
    next();
  }, async (req, res) => {
    try {
      const snap = await db.collection('users').where('phoneNumber', '==', req.params.phone).limit(1).get();
      res.json({ exists: !snap.empty });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/auth/profile", verifyToken, async (req: any, res) => {
    try {
      await db.collection('users').doc(req.user.uid).set({
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      res.json({ message: "Profile updated" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", verifyToken, async (req: any, res) => {
    try {
      const doc = await db.collection('users').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      const data = doc.data() || {};
      // Filter sensitive data unless admin or owner
      const isOwner = req.user.uid === req.params.id;
      const isAdminUser = req.user.role === 'admin';
      
      if (!isOwner && !isAdminUser) {
        delete data.email;
        delete data.phoneNumber;
      }
      
      res.json({ id: doc.id, ...data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- LISTINGS ENDPOINTS ---

  app.get("/api/listings", async (req, res) => {
    try {
      const { category, sellerId } = req.query;
      let query: any = db.collection('announcements');
      if (category) query = query.where('category', '==', category);
      if (sellerId) query = query.where('sellerId', '==', sellerId);
      
      // Removed orderBy to prevent composite index crash locally if not created
      query = query.where('status', '==', 'active');
      
      const snap = await query.limit(50).get();
      const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (e: any) {
      console.error('API Listings Error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    const doc = await db.collection('announcements').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  });

  app.post("/api/listings", verifyToken, async (req: any, res) => {
    console.log(`📝 API: Creating new listing for user ${req.user.uid}...`);
    try {
      // Optional reCAPTCHA verification if token is provided
      if (req.body.recaptchaToken) {
        const isValid = await verifyRecaptcha(req.body.recaptchaToken, 'create_listing');
        if (!isValid) {
          return res.status(403).json({ error: 'reCAPTCHA verification failed. Please try again.' });
        }
      }

      const data = {
        ...req.body,
        sellerId: req.user.uid,
        status: 'active',
        clicks: { phone: 0, whatsapp: 0 },
        totalClicks: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      console.log('Listing Data:', { ...data, images: `${data.images?.length || 0} images` });
      
      const docRef = await db.collection('announcements').add(data);
      console.log(`✅ API: Listing created successfully (ID: ${docRef.id})`);
      res.status(201).json({ id: docRef.id });
    } catch (e: any) {
      console.error(`❌ API: Listing creation failed:`, e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/listings/:id", verifyToken, async (req: any, res) => {
    const docRef = db.collection('announcements').doc(req.params.id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });
    if (snap.data()?.sellerId !== req.user.uid) return res.status(403).json({ error: "Unauthorized" });

    await docRef.update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ status: "updated" });
  });

  app.delete("/api/listings/:id", verifyToken, async (req: any, res) => {
    const docRef = db.collection('announcements').doc(req.params.id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });
    if (snap.data()?.sellerId !== req.user.uid) return res.status(403).json({ error: "Unauthorized" });

    await docRef.delete();
    res.json({ status: "deleted" });
  });

  app.get("/api/listings/seller/:sellerId", async (req, res) => {
    try {
      console.log(`📡 API: Fetching listings for seller ${req.params.sellerId}`);
      const snap = await db.collection('announcements')
        .where('sellerId', '==', req.params.sellerId)
        .get();
      
      const listings = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      // Sort in JS to avoid index requirement
      listings.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      res.json(listings);
    } catch (e: any) {
      console.error('❌ API: Error fetching seller listings:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/listings/:id/boost", verifyToken, async (req: any, res) => {
    await db.collection('announcements').doc(req.params.id).update({ boosted: true });
    res.json({ status: "ok" });
  });

  app.post("/api/listings/:id/rate", verifyToken, async (req: any, res) => {
    const { rating } = req.body;
    await db.collection('announcements').doc(req.params.id).update({ 
      rating: FieldValue.increment(rating),
      ratingCount: FieldValue.increment(1)
    });
    res.json({ status: "ok" });
  });

  // --- REQUESTS ENDPOINTS ---

  app.get("/api/offer-requests", async (req, res) => {
    try {
      console.log('📡 API: Fetching open requests...');
      const snap = await db.collection('offerRequests').where('status', '==', 'Open').get();
      const requests = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      // Sort in JS to avoid index requirement
      requests.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      res.json(requests);
    } catch (e: any) {
      console.error('❌ API: Error fetching requests:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/offer-requests", verifyToken, async (req: any, res) => {
    const data = {
      ...req.body,
      buyerId: req.user.uid,
      status: 'Open',
      offersCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('offerRequests').add(data);
    res.status(201).json({ id: docRef.id });
  });

  app.get("/api/offer-requests/:id", async (req, res) => {
    const doc = await db.collection('offerRequests').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  });

  app.put("/api/offer-requests/:id/archive", verifyToken, async (req: any, res) => {
    await db.collection('offerRequests').doc(req.params.id).update({ status: 'archived' });
    res.json({ status: "ok" });
  });

  app.delete("/api/offer-requests/:id", verifyToken, async (req: any, res) => {
    const docRef = db.collection('offerRequests').doc(req.params.id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });
    if (snap.data()?.buyerId !== req.user.uid) return res.status(403).json({ error: "Unauthorized" });

    await docRef.delete();
    res.json({ status: "deleted" });
  });

  // --- OFFERS ENDPOINTS ---

  app.post("/api/offers", verifyToken, async (req: any, res) => {
    const { requestId, price, message, deliveryIncluded } = req.body;
    const requestRef = db.collection('offerRequests').doc(requestId);
    
    try {
      await db.runTransaction(async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists) throw new Error("Request not found");
        
        const requestData = requestSnap.data();
        if (requestData?.offersCount >= 6) throw new Error("Maximum offers reached (6)");

        const offerRef = db.collection('offers').doc();
        transaction.set(offerRef, {
          requestId,
          sellerId: req.user.uid,
          price,
          message,
          deliveryIncluded,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        transaction.update(requestRef, {
          offersCount: FieldValue.increment(1)
        });
      });
      res.status(201).json({ status: "ok" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/offers/request/:requestId", verifyToken, async (req: any, res) => {
    try {
      const snap = await db.collection('offers')
        .where('requestId', '==', req.params.requestId)
        .orderBy('createdAt', 'desc')
        .get();
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) {
      console.error('❌ API: Error fetching offers:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/offers/:id/accept", verifyToken, async (req: any, res) => {
    const offerRef = db.collection('offers').doc(req.params.id);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists) return res.status(404).json({ error: "Not found" });
    
    const offerData = offerSnap.data();
    const requestRef = db.collection('offerRequests').doc(offerData?.requestId);
    const requestSnap = await requestRef.get();
    
    if (requestSnap.data()?.buyerId !== req.user.uid) return res.status(403).json({ error: "Unauthorized" });

    await db.runTransaction(async (transaction) => {
      transaction.update(offerRef, { status: 'accepted' });
      transaction.update(requestRef, { status: 'Closed' });
      
      // Update listing stock or count if needed
      if (offerData?.listingId) {
        transaction.update(db.collection('announcements').doc(offerData.listingId), {
          sheepCount: FieldValue.increment(-(offerData.sheepCount || 0))
        });
      }
    });
    res.json({ status: "accepted" });
  });

  app.put("/api/offers/:id/status", verifyToken, async (req: any, res) => {
    try {
      const offerRef = db.collection('offers').doc(req.params.id);
      const offerSnap = await offerRef.get();
      if (!offerSnap.exists) return res.status(404).json({ error: "Offer not found" });
      
      const offerData = offerSnap.data();
      const requestId = offerData?.requestId;
      const requestSnap = await db.collection('offerRequests').doc(requestId).get();
      const requestData = requestSnap.data();

      // Check if user is the seller of the offer OR the buyer of the request
      const isSeller = offerData?.sellerId === req.user.uid;
      const isBuyer = requestData?.buyerId === req.user.uid;
      const isAdminUser = req.user.role === 'admin';

      if (!isSeller && !isBuyer && !isAdminUser) {
        return res.status(403).json({ error: "Unauthorized to update this offer" });
      }

      await offerRef.update({ status: req.body.status });
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/offers/:id", verifyToken, async (req: any, res) => {
    try {
      const offerRef = db.collection('offers').doc(req.params.id);
      const offerSnap = await offerRef.get();
      if (!offerSnap.exists) return res.sendStatus(200); // Already deleted
      
      if (offerSnap.data()?.sellerId !== req.user.uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await offerRef.delete();
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- FAVORITES ENDPOINTS ---

  app.get("/api/favorites", verifyToken, async (req: any, res) => {
    const snap = await db.collection('users').doc(req.user.uid).collection('favorites').get();
    res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
  });

  app.post("/api/favorites", verifyToken, async (req: any, res) => {
    const { listingId } = req.body;
    await db.collection('users').doc(req.user.uid).collection('favorites').doc(listingId).set({
      listingId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ status: "ok" });
  });

  app.delete("/api/favorites/:listingId", verifyToken, async (req: any, res) => {
    await db.collection('users').doc(req.user.uid).collection('favorites').doc(req.params.listingId).delete();
    res.json({ status: "ok" });
  });

  // --- REPORTS & DONATIONS ---
  app.post("/api/reports", verifyToken, async (req: any, res) => {
    try {
      const data = {
        ...req.body,
        reporterId: req.user.uid,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('reports').add(data);
      res.status(201).json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/donations", verifyToken, async (req: any, res) => {
    try {
      const data = {
        ...req.body,
        donorId: req.user.uid,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('donations').add(data);
      res.status(201).json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users/:sellerId/reviews", verifyToken, async (req: any, res) => {
    const data = {
      ...req.body,
      authorId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('users').doc(req.params.sellerId).collection('reviews').add(data);
    res.json({ status: "ok" });
  });

  app.delete("/api/users/:sellerId/reviews/:reviewId", verifyToken, async (req: any, res) => {
    await db.collection('users').doc(req.params.sellerId).collection('reviews').doc(req.params.reviewId).delete();
    res.json({ status: "ok" });
  });

  // --- ADMIN ENDPOINTS ---

  app.get("/api/admin/stats", verifyToken, isAdmin, async (req, res) => {
    try {
      const [usersSnap, adsSnap, activeAdsSnap, requestsSnap] = await Promise.all([
        db.collection('users').count().get(),
        db.collection('announcements').count().get(),
        db.collection('announcements').where('status', '==', 'active').count().get(),
        db.collection('offerRequests').count().get(),
      ]);

      res.json({
        totalUsers: usersSnap.data().count,
        totalAds: adsSnap.data().count,
        activeAds: activeAdsSnap.data().count,
        totalRequests: requestsSnap.data().count
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", verifyToken, isAdmin, async (req, res) => {
    try {
      const snap = await db.collection('users').get();
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (error: any) {
      console.error("Error fetching admin users:", error.message);
      // Return empty list if quota exceeded
      res.json([]);
    }
  });

  app.post("/api/admin/users/:userId/notify", verifyToken, isAdmin, async (req, res) => {
    const notification = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    };
    await db.collection('users').doc(req.params.userId).collection('notifications').add(notification);
    res.json({ status: "ok" });
  });

  app.put("/api/admin/users/:id/verify", verifyToken, isAdmin, async (req, res) => {
    await db.collection('users').doc(req.params.id).update({ isVerified: true });
    res.json({ status: "ok" });
  });

  app.put("/api/admin/users/:id/status", verifyToken, isAdmin, async (req, res) => {
    await db.collection('users').doc(req.params.id).update({ status: req.body.status });
    res.json({ status: "ok" });
  });

  app.delete("/api/admin/users/:id", verifyToken, isAdmin, async (req, res) => {
    await db.collection('users').doc(req.params.id).delete();
    res.json({ status: "ok" });
  });

  app.put("/api/admin/users/:id/ban", verifyToken, isAdmin, async (req, res) => {
    await db.collection('users').doc(req.params.id).update({ status: 'blocked' });
    res.json({ status: "ok" });
  });

  app.get("/api/admin/listings", verifyToken, isAdmin, async (req, res) => {
    try {
      const snap = await db.collection('announcements').orderBy('createdAt', 'desc').get();
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching admin listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.post("/api/admin/listings/import", verifyToken, isAdmin, async (req: any, res) => {
    const { data } = req.body;
    const batch = db.batch();
    data.forEach((item: any) => {
      const ref = db.collection('announcements').doc();
      batch.set(ref, { 
        ...item, 
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      });
    });
    await batch.commit();
    res.json({ status: "ok" });
  });

  app.put("/api/admin/listings/:id/approve", verifyToken, isAdmin, async (req, res) => {
    await db.collection('announcements').doc(req.params.id).update({ status: 'active' });
    res.json({ status: "ok" });
  });

  app.put("/api/admin/listings/:id/status", verifyToken, isAdmin, async (req, res) => {
    const { status, reason } = req.body;
    const updateData: any = { status };
    if (reason) updateData.rejectReason = reason;
    await db.collection('announcements').doc(req.params.id).update(updateData);
    res.json({ status: "ok" });
  });

  app.delete("/api/admin/listings/:id", verifyToken, isAdmin, async (req, res) => {
    await db.collection('announcements').doc(req.params.id).delete();
    res.json({ status: "ok" });
  });

  app.get("/api/admin/reports", verifyToken, isAdmin, async (req, res) => {
    try {
      const snap = await db.collection('reports').get();
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching admin reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.put("/api/admin/reports/:id/status", verifyToken, isAdmin, async (req, res) => {
    await db.collection('reports').doc(req.params.id).update({ status: req.body.status });
    res.json({ status: "ok" });
  });

  app.delete("/api/admin/reports/:id", verifyToken, isAdmin, async (req, res) => {
    await db.collection('reports').doc(req.params.id).delete();
    res.json({ status: "ok" });
  });

  app.post("/api/admin/system-reset", verifyToken, isAdmin, async (req, res) => {
    try {
      const collections = ['announcements', 'offerRequests', 'offers', 'reports', 'donations', 'adminLogs'];
      for (const coll of collections) {
        const snap = await db.collection(coll).get();
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      
      // Cleanup users but keep the caller
      const usersSnap = await db.collection('users').get();
      const userBatch = db.batch();
      usersSnap.docs.forEach(doc => {
        if (doc.id !== (req as any).user.uid) userBatch.delete(doc.ref);
      });
      await userBatch.commit();

      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/donations", verifyToken, isAdmin, async (req, res) => {
    try {
      const snap = await db.collection('donations').orderBy('createdAt', 'desc').get();
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching admin donations:", error);
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  app.get("/api/admin/export", verifyToken, isAdmin, async (req, res) => {
    const { collection } = req.query;
    if (!collection) return res.status(400).json({ error: "No collection specified" });
    const snap = await db.collection(collection as string).get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  app.get("/api/admin/logs", verifyToken, isAdmin, async (req, res) => {
    const snap = await db.collection('adminLogs').orderBy('createdAt', 'desc').limit(200).get();
    res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
  });



  app.post("/api/clicks", verifyToken, async (req: any, res) => {
    const { listingId, type } = req.body;
    try {
      const docRef = db.collection('announcements').doc(listingId);
      await docRef.update({
        [`clicks.${type}`]: admin.firestore.FieldValue.increment(1),
        totalClicks: admin.firestore.FieldValue.increment(1)
      });
      res.json({ status: "ok" });
    } catch (e) {
      res.status(500).json({ error: "Failed to log click" });
    }
  });

  app.post("/api/notifications", verifyToken, async (req: any, res) => {
    try {
      const { userId, title, message, type, relatedId } = req.body;
      const data = {
        title,
        message,
        type,
        relatedId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('users').doc(userId).collection('notifications').add(data);
      res.status(201).json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/notifications", verifyToken, async (req: any, res) => {
    try {
      const snap = await db.collection('users').doc(req.user.uid).collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/notifications/:id/read", verifyToken, async (req: any, res) => {
    try {
      await db.collection('users').doc(req.user.uid).collection('notifications').doc(req.params.id).update({
        read: true
      });
      res.json({ status: "ok" });
    } catch (e) {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // --- VITE MIDDLEWARE (production only) ---
  // In development, Vite runs separately on port 5173 via `npm run dev:client`
  // and proxies /api calls to this server on port 3000.
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ API Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`🎨 Frontend dev server: http://localhost:5173`);
      console.log(`   Run 'npm run dev:client' in another terminal if not already running.`);
    }
  });
}

startServer();
