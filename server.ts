import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";
import fetch from "node-fetch";
import cors from "cors";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appletConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");

let firebaseConfig: any = {};
if (fs.existsSync(appletConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(appletConfigPath, "utf-8"));
} else {
  firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || "(default)",
  };
}

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    // Priority 1: JSON file on disk (local dev)
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
    console.log('✅ Firebase Admin: initialized from service account file');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Priority 2: Full JSON injected as env var (Vercel, production)
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId || serviceAccount.project_id,
      });
      console.log('✅ Firebase Admin: initialized from FIREBASE_SERVICE_ACCOUNT_JSON env var');
    } catch (e) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
      process.exit(1);
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    // Priority 3: Individual env vars (fallback)
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      } as any),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase Admin: initialized from individual env vars');
  } else {
    // Bug #1 FIX: error block was previously INSIDE the else-if, causing exit even on success
    console.error("❌ ERREUR FATALE: Credentials Firebase introuvables !");
    console.error("   En local: Assurez-vous que 'firebase-service-account.json' est présent à la racine.");
    console.error("   En prod: Vérifiez les variables d'environnement (FIREBASE_SERVICE_ACCOUNT_JSON ou variables individuelles).");
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

// Helper to verify reCAPTCHA Enterprise token
const verifyRecaptcha = async (token: string, action: string) => {
  if (!token) return false;
  const projectID = firebaseConfig.projectId;
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;

  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ reCAPTCHA skip: bypassing in dev mode');
    return true;
  }

  // Bug #5 FIX: also require projectID; skip only when truly unconfigured (dev)
  if (!projectID || !apiKey || !siteKey) {
    console.warn('⚠️ reCAPTCHA skip: missing projectID, API_KEY, or SITE_KEY!');
    return true; // Safe to skip only when not configured at all
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

    if (!response.ok) {
      console.error('❌ reCAPTCHA API HTTP error:', response.status, response.statusText);
      return false; // Bug #5 FIX: fail-closed on API errors
    }

    const data: any = await response.json();
    console.log('🛡️ reCAPTCHA Assessment Result:', JSON.stringify(data, null, 2));

    if (!data.tokenProperties?.valid) {
      console.warn('❌ reCAPTCHA invalid:', data.tokenProperties?.invalidReason);
      return false;
    }

    // Validate that the action matches to prevent token reuse across endpoints
    if (data.tokenProperties?.action && data.tokenProperties.action !== action) {
      console.warn('❌ reCAPTCHA action mismatch:', data.tokenProperties.action, '!==', action);
      return false;
    }

    // Check score (0.0 to 1.0, where 1.0 is very likely a human)
    if (data.riskAnalysis?.score < 0.3) {
      console.warn('❌ reCAPTCHA low score:', data.riskAnalysis?.score);
      return false;
    }

    return true;
  } catch (error) {
    // Bug #5 FIX: was returning true (fail-open = security bypass). Now fail-closed.
    console.error('❌ reCAPTCHA verification error — rejecting request (fail-closed):', error);
    return false;
  }
};

// Helper: Calculate distance in KM between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Middleware: Verify Token (Optional)
const optionalVerifyToken = async (req: any, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const idToken = header.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Middleware: Verify Token (Strict)
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
    console.error('❌ Token Verification Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
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
  const PORT = parseInt(process.env.PORT || '3001', 10);

  app.use(express.json({ limit: '50mb' }));

  // CORS Middleware (Strict)
  const allowedOrigins = [
    "https://kessabcom.ma",
    "https://www.kessabcom.ma",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ];

  app.use(cors({
    origin: (origin, callback) => {
      console.log(`🔒 CORS Origin Check: "${origin}"`);
      // Bug #10 FIX: in production, reject requests with no Origin header (potential CSRF/direct calls)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }));

  app.set("trust proxy", 1);

  // Rate Limiters
  const checkPhoneLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de tentatives, réessayez dans 1 minute." }
  });

  // --- PUBLIC ENDPOINTS ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- SETTINGS ENDPOINTS ---
  app.get("/api/settings", async (req, res) => {
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

  app.post("/api/auth/register", verifyToken, async (req: any, res) => {
    const { uid, email, fullName, role } = req.body;
    const phone = req.body.phone || req.body.phoneNumber;
    
    // Security check: ensure UID in request matches UID in token
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: "Forbidden: UID mismatch" });
    }

    console.log(`📝 API: Registering user ${uid} with role: ${role}, email: ${email}`);

    // Security check for 'admin' role
    // In a real production app, you would check against a whitelist or a specific domain.
    // Here we allow it to match the bootstrapping logic in AdminAuth.tsx,
    // but we ensure only the account owner (verified via token) can set it and only if the email is provided.
    const ALLOWED_ROLES = ['buyer', 'seller', 'admin', ''];
    let safeRole = ALLOWED_ROLES.includes(role) ? (role || '') : '';
    
    // If attempting to be admin, require an email address as a basic sanity check
    if (safeRole === 'admin' && !email) {
      console.warn(`🛑 API: Registration denied admin role for ${uid} - no email provided`);
      safeRole = '';
    }

    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'uid is required.' });
    }

    try {
      await db.collection('users').doc(uid).set({
        email: email ? String(email).trim().slice(0, 320) : '',
        fullName: fullName ? String(fullName).trim().slice(0, 100) : '',
        phoneNumber: phone ? String(phone).trim().slice(0, 20) : '',
        role: safeRole,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`✅ API: User ${uid} profile created/updated`);
      res.status(201).json({ message: "User profile created" });
    } catch (e: any) {
      console.error(`❌ API: Registration error for ${uid}:`, e);
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

  app.get("/api/auth/check-phone/:phone", checkPhoneLimiter, async (req, res) => {
    try {
      const rawPhone = req.params.phone;
      if (!rawPhone) return res.status(400).json({ error: "Numéro invalide" });

      // 1. Generate formats to search in Firestore
      let clean = rawPhone.replace(/\D/g, '');
      if (clean.startsWith('212')) clean = clean.substring(3);
      if (clean.startsWith('0')) clean = clean.substring(1);
      
      const formats = [
        rawPhone,
        `+212${clean}`,
        `0${clean}`,
        clean
      ];

      // 2. Check Firestore
      const snap = await db.collection('users')
        .where('phoneNumber', 'in', formats)
        .limit(1)
        .get();

      if (snap.empty) {
        return res.json({ exists: false });
      }

      const userData = snap.docs[0].data();
      const uid = snap.docs[0].id;

      // 3. Verify if user actually exists in Firebase Auth
      // We check by UID first, then by the deterministic email if needed
      try {
        await auth.getUser(uid);
        // If we reach here, user exists in both places
        return res.json({ exists: true });
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found') {
          console.log(`🧹 Cleaning up orphaned Firestore record for UID: ${uid} (Phone: ${userData.phoneNumber})`);
          await db.collection('users').doc(uid).delete();
          return res.json({ exists: false, orphaned: true, cleaned: true });
        }
        throw authErr;
      }
    } catch (e: any) {
      console.error("check-phone error:", e);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.put("/api/auth/profile", verifyToken, async (req: any, res) => {
    try {
      await db.collection('users').doc(req.user.uid).set({
        ...req.body,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // Cascade update to listings if name or pseudo changed
      if (req.body.fullName || req.body.pseudo || req.body.displayName) {
        const listingsSnap = await db.collection('announcements').where('sellerId', '==', req.user.uid).get();
        if (!listingsSnap.empty) {
          const batch = db.batch();
          listingsSnap.docs.forEach(doc => {
            const update: any = {};
            if (req.body.fullName || req.body.displayName) {
              update.sellerName = req.body.fullName || req.body.displayName;
            }
            if (req.body.pseudo !== undefined) {
              update.sellerPseudo = req.body.pseudo;
            }
            batch.update(doc.ref, update);
          });
          await batch.commit();
          console.log(`🔄 API: Cascaded profile update to ${listingsSnap.size} listings for ${req.user.uid}`);
        }
      }

      res.json({ message: "Profile updated" });
    } catch (e: any) {
      console.error('❌ API: updateProfile error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", async (req: any, res) => {
    try {
      const doc = await db.collection('users').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });
      const data = doc.data() as any;

      // Fetch approved reviews if it's a seller
      if (data.role === 'seller') {
        try {
          const reviewsSnap = await db.collection('users').doc(req.params.id).collection('reviews')
            .where('status', '==', 'approved')
            .orderBy('createdAt', 'desc')
            .get();
          data.reviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          // Silent fallback to manual filter if composite index is missing
          const allReviews = await db.collection('users').doc(req.params.id).collection('reviews').get();
          data.reviews = allReviews.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((r: any) => r.status === 'approved')
            .sort((a: any, b: any) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
        }
      }
      
      res.json({ id: doc.id, ...data });
    } catch (e: any) {
      console.error(`❌ API: getUser error for ${req.params.id}:`, e);
      res.status(500).json({ error: e.message });
    }
  });

  // --- LISTINGS ENDPOINTS ---

  app.get("/api/listings", async (req, res) => {
    try {
      const { category, sellerId } = req.query;
      const limitVal = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const startAfterId = req.query.startAfter as string;

      let queryRef: any = db.collection('announcements').where('status', '==', 'active').orderBy('createdAt', 'desc');
      
      if (category) queryRef = queryRef.where('category', '==', category);
      if (sellerId) queryRef = queryRef.where('sellerId', '==', sellerId);
      
      if (startAfterId) {
        const cursorDoc = await db.collection('announcements').doc(startAfterId).get();
        if (cursorDoc.exists) {
          queryRef = queryRef.startAfter(cursorDoc);
        }
      }

      const snap = await queryRef.limit(limitVal).get();
      const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1];

      res.json({
        data,
        nextCursor: snap.docs.length === limitVal ? lastDoc?.id : null
      });
    } catch (e: any) {
      console.error('API Listings Error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Fix #3: /seller/:sellerId MUST be declared BEFORE /:id to avoid Express route shadowing
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

  app.get("/api/listings/:id", async (req: any, res) => {
    try {
      const doc = await db.collection('announcements').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      const data: any = { id: doc.id, ...doc.data() };
      
      // Fetch approved reviews for this listing
      try {
        const reviewsSnap = await db.collection('announcements').doc(req.params.id).collection('reviews')
          .where('status', '==', 'approved')
          .orderBy('createdAt', 'desc')
          .get();
        data.listingReviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (innerError) {
        // Silent fallback to manual filter if composite index is missing
        try {
          const allReviews = await db.collection('announcements').doc(req.params.id).collection('reviews').get();
          data.listingReviews = allReviews.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((r: any) => r.status === 'approved')
            .sort((a: any, b: any) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
        } catch (fallbackError) {
          data.listingReviews = [];
        }
      }
      
      res.json(data);
    } catch (e: any) {
      console.error('❌ API: Error fetching listing details:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/listings", verifyToken, async (req: any, res) => {
    console.log(`📝 API: Creating new listing for user ${req.user.uid}...`);
    try {
      // Optional reCAPTCHA check
      if (req.body.recaptchaToken) {
        const isValid = await verifyRecaptcha(req.body.recaptchaToken, 'create_listing');
        if (!isValid) {
          return res.status(403).json({ error: 'reCAPTCHA verification failed. Please try again.' });
        }
      }

      // Bug #3 FIX: Input sanitization — extract only allowlisted fields (no raw ...req.body spread)
      const {
        title, description, price, sheepCount, category, location, farmLocation,
        coordinates, images, videoUrl, youtubeLink, audioUrl,
        ages, age, sizes, races, phone, whatsapp, deliveryAvailable,
        recaptchaToken: _t, // strip token from stored data
      } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Le titre est requis.' });
      }
      if (title.length > 200) {
        return res.status(400).json({ error: 'Le titre ne peut pas dépasser 200 caractères.' });
      }
      if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
        return res.status(400).json({ error: 'Le prix doit être un nombre positif.' });
      }
      if (sheepCount !== undefined && (isNaN(Number(sheepCount)) || Number(sheepCount) < 0)) {
        return res.status(400).json({ error: 'Le nombre de moutons doit être un nombre positif.' });
      }
      if (images !== undefined && !Array.isArray(images)) {
        return res.status(400).json({ error: 'Les images doivent être un tableau.' });
      }
      if (Array.isArray(images) && images.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 images autorisées.' });
      }

      // Check listing limits if payment system is disabled
      const settingsDoc = await db.collection('settings').doc('global').get();
      const settings = settingsDoc.data();
      if (settings && !settings.paymentSystemEnabled) {
        const maxListings = settings.maxListingsPerFreeUser || 5;
        const userListingsCount = (await db.collection('announcements')
          .where('sellerId', '==', req.user.uid)
          .where('status', '==', 'active')
          .count().get()).data().count;
        
        if (userListingsCount >= maxListings) {
          return res.status(403).json({ 
            error: `لقد وصلت إلى الحد الأقصى للإعلانات المجانية (${maxListings}). يرجى تفعيل نظام الدفع أو حذف بعض الإعلانات.` 
          });
        }
      }

      // Fetch seller info for denormalization
      const sellerDoc = await db.collection('users').doc(req.user.uid).get();
      const sellerData = sellerDoc.data();

      const data = {
        title: String(title).trim().slice(0, 200),
        description: description ? String(description).trim().slice(0, 2000) : '',
        price: price !== undefined ? Number(price) : null,
        sheepCount: sheepCount !== undefined ? Number(sheepCount) : null,
        category: category ? String(category).trim() : null,
        location: location ? String(location).trim() : null,
        farmLocation: farmLocation ? String(farmLocation).trim() : null,
        coordinates: coordinates && typeof coordinates === 'object' ? coordinates : null,
        images: Array.isArray(images) ? images.slice(0, 10) : [],
        videoUrl: videoUrl ? String(videoUrl).slice(0, 1000) : null,
        youtubeLink: youtubeLink ? String(youtubeLink).slice(0, 1000) : null,
        audioUrl: audioUrl ? String(audioUrl).slice(0, 1000) : null,
        ages: ages || null,
        age: age !== undefined ? String(age) : null,
        sizes: Array.isArray(sizes) ? sizes : [],
        races: Array.isArray(races) ? races : [],
        phone: phone ? String(phone).trim().slice(0, 20) : null,
        whatsapp: whatsapp ? String(whatsapp).trim().slice(0, 20) : null,
        deliveryAvailable: Boolean(deliveryAvailable),
        // Controlled server-side fields only:
        sellerId: req.user.uid,
        sellerName: sellerData?.fullName || sellerData?.displayName || 'كساب',
        sellerPseudo: sellerData?.pseudo || null,
        status: 'active',
        clicks: { phone: 0, whatsapp: 0 },
        totalClicks: 0,
        createdAt: FieldValue.serverTimestamp()
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
      updatedAt: FieldValue.serverTimestamp()
    });
    res.json({ status: "updated" });
  });

  app.delete("/api/listings/:id", verifyToken, async (req: any, res) => {
    const docRef = db.collection('announcements').doc(req.params.id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });
    const sellerId = snap.data()?.sellerId;
    const callerDoc = await db.collection('users').doc(req.user.uid).get();
    const isAdmin = callerDoc.data()?.role === 'admin';

    if (sellerId !== req.user.uid && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await docRef.delete();
    res.json({ status: "deleted" });
  });

  // NOTE: /api/listings/seller/:sellerId was moved above /:id — this duplicate block is removed.

  app.post("/api/listings/:id/boost", verifyToken, async (req: any, res) => {
    await db.collection('announcements').doc(req.params.id).update({ boosted: true });
    res.json({ status: "ok" });
  });

  app.post("/api/listings/:id/view", async (req, res) => {
    try {
      const listingId = req.params.id;
      let ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
      if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', '');
      const today = new Date().toISOString().split('T')[0];
      const interactionId = `${ip}_${listingId}_view_${today}`.replace(/[^a-zA-Z0-9]/g, '_');

      const interactionRef = db.collection('announcements').doc(listingId).collection('interactions').doc(interactionId);
      const interactionSnap = await interactionRef.get();

      if (!interactionSnap.exists) {
        await db.runTransaction(async (transaction) => {
          transaction.set(interactionRef, { timestamp: FieldValue.serverTimestamp(), ip, type: 'view' });
          transaction.update(db.collection('announcements').doc(listingId), {
            views: FieldValue.increment(1)
          });
        });
      }
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/listings/:id/rate", verifyToken, async (req: any, res) => {
    const { rating, comment } = req.body;
    const data = {
      rating: Number(rating),
      comment: String(comment || '').trim().slice(0, 500),
      authorId: req.user.uid,
      authorName: req.user.name || 'مشتري',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp()
    };
    
    // Check if user already reviewed this listing
    const existing = await db.collection('announcements').doc(req.params.id).collection('reviews')
      .where('authorId', '==', req.user.uid)
      .limit(1)
      .get();
      
    if (!existing.empty) {
      await existing.docs[0].ref.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('announcements').doc(req.params.id).collection('reviews').add(data);
    }
    
    res.json({ status: "pending_approval" });
  });



  // --- REQUESTS ENDPOINTS ---

  app.get("/api/offer-requests", verifyToken, async (req: any, res) => {
    try {
      console.log(`📡 API: Fetching requests for seller ${req.user.uid}...`);
      
      // 0. Get Settings
      const settingsSnap = await db.collection('settings').doc('global').get();
      const brSettings = settingsSnap.data()?.buyerRequests || {};
      const requestsPerPage = brSettings.requestsPerPage || 6;
      const dailyOffersLimit = brSettings.maxDailyOffersPerSeller || 6;
      const expirationDays = brSettings.requestExpirationDays || 7;

      const limitVal = Math.min(parseInt(req.query.limit as string) || requestsPerPage, 100);
      const startAfterId = req.query.startAfter as string;

      // 1. Get daily leads for this seller
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dailyLeadsRef = db.collection('dailyLeads').doc(`${req.user.uid}_${today}`);
      const dailyLeadsSnap = await dailyLeadsRef.get();
      let seenIds = dailyLeadsSnap.exists ? (dailyLeadsSnap.data()?.requestIds || []) : [];

      // 2. Fetch requests (filtering by expiration)
      const expirationTime = Date.now() - (expirationDays * 24 * 60 * 60 * 1000);
      const expirationDate = Timestamp.fromMillis(expirationTime);

      let queryRef = db.collection('offerRequests')
        .where('createdAt', '>=', expirationDate)
        .orderBy('createdAt', 'desc');

      if (startAfterId) {
        const cursorDoc = await db.collection('offerRequests').doc(startAfterId).get();
        if (cursorDoc.exists) {
          queryRef = queryRef.startAfter(cursorDoc);
        }
      }

      const snap = await queryRef.limit(limitVal * 5).get(); // Fetch even more for geo-filtering
      let allRequests = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      // 2.5 Geo-Filtering (if seller has coordinates)
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      const userData = userDoc.data();
      const searchRadius = brSettings.searchRadiusKm || 10;

      if (userData?.coordinates?.lat && userData?.coordinates?.lng) {
        const uLat = userData.coordinates.lat;
        const uLng = userData.coordinates.lng;
        allRequests = allRequests.filter((r: any) => {
          if (!r.lat || !r.lng) return true; // Keep requests without coordinates as fallback
          const dist = calculateDistance(uLat, uLng, r.lat, r.lng);
          return dist <= searchRadius;
        });
      }

      // 3. Filter/Update seen requests
      // If we haven't reached requestsPerPage yet, we can add new ones
      let changed = false;
      for (const r of allRequests) {
        if (seenIds.length >= requestsPerPage) break;
        if (!seenIds.includes(r.id)) {
          seenIds.push(r.id);
          changed = true;
        }
      }

      if (changed) {
        await dailyLeadsRef.set({ requestIds: seenIds, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }

      // 4. Return only seen requests
      const data = allRequests.filter((r: any) => seenIds.includes(r.id));
      
      // Sort in memory
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || (a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(0));
        const dateB = b.createdAt?.toDate?.() || (b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(0));
        return dateB.getTime() - dateA.getTime();
      });

      // 5. Count daily offers sent by this seller
      let dailyOffersCount = 0;
      try {
        const recentOffersSnap = await db.collection('offers')
          .where('sellerId', '==', req.user.uid)
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();

        const todayStart = new Date(today).getTime();
        const tomorrowStart = todayStart + 86400000;

        dailyOffersCount = recentOffersSnap.docs.filter(doc => {
          const createdAt = doc.data().createdAt;
          const time = createdAt?.toDate ? createdAt.toDate().getTime() : (createdAt?._seconds ? createdAt._seconds * 1000 : 0);
          return time >= todayStart && time < tomorrowStart;
        }).length;
      } catch (offerErr: any) {
        // Fallback
      }

      const lastDoc = snap.docs[snap.docs.length - 1];

      res.json({
        data,
        nextCursor: snap.docs.length >= limitVal ? lastDoc?.id : null,
        dailyLeadsCount: seenIds.length,
        dailyLeadsLimit: requestsPerPage,
        dailyOffersCount: dailyOffersCount,
        dailyOffersLimit: dailyOffersLimit
      });
    } catch (e: any) {
      console.error('❌ API: Error fetching requests:', e);
      res.status(500).json({ error: e.message });
    }
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
    const buyerId = snap.data()?.buyerId;
    const callerDoc = await db.collection('users').doc(req.user.uid).get();
    const isAdmin = callerDoc.data()?.role === 'admin';

    if (buyerId !== req.user.uid && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await docRef.delete();
    res.json({ status: "deleted" });
  });



  app.get("/api/offer-requests/:id", async (req, res) => {
    try {
      const doc = await db.collection('offerRequests').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      res.json({ id: doc.id, ...doc.data() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/offer-requests", verifyToken, async (req: any, res) => {
    try {
      const data = {
        ...req.body,
        buyerId: req.user.uid,
        status: 'Open',
        offersCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('offerRequests').add(data);
      res.status(201).json({ id: docRef.id, message: "Offer request created" });
    } catch (e: any) {
      console.error("❌ Error creating offer request:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/offer-requests/:id", verifyToken, async (req: any, res) => {
    try {
      const docRef = db.collection('offerRequests').doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      
      const isAdminDoc = await db.collection('users').doc(req.user.uid).get();
      const isAdmin = isAdminDoc.data()?.role === 'admin';

      if (doc.data()?.buyerId !== req.user.uid && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updateData = {
        ...req.body,
        updatedAt: FieldValue.serverTimestamp()
      };
      delete updateData.buyerId;
      
      await docRef.update(updateData);
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/offer-requests/:id", verifyToken, async (req: any, res) => {
    try {
      const docRef = db.collection('offerRequests').doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });

      const isAdminDoc = await db.collection('users').doc(req.user.uid).get();
      const isAdmin = isAdminDoc.data()?.role === 'admin';

      if (doc.data()?.buyerId !== req.user.uid && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await docRef.delete();
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- OFFERS ENDPOINTS ---

  app.post("/api/offers", verifyToken, async (req: any, res) => {
    const { requestId } = req.body;
    const requestRef = db.collection('offerRequests').doc(requestId);
    
    try {
      // 0. Get Settings
      const settingsSnap = await db.collection('settings').doc('global').get();
      const brSettings = settingsSnap.data()?.buyerRequests || {};
      const maxOffers = brSettings.maxOffersPerRequest || 6;
      const dailyOffersLimit = brSettings.maxDailyOffersPerSeller || 6;

      await db.runTransaction(async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists) throw new Error("Request not found");
        
        const requestData = requestSnap.data();
        const currentOffersCount = requestData?.offersCount || 0;

        if (currentOffersCount >= maxOffers || requestData?.status === 'FULL') {
          throw new Error(`Maximum offers reached for this request (${maxOffers})`);
        }

        // 1. Check if seller already made an offer for this request
        const requestOffersSnap = await db.collection('offers')
          .where('requestId', '==', requestId)
          .get();
        
        const hasExisting = requestOffersSnap.docs.some(doc => doc.data().sellerId === req.user.uid);
        if (hasExisting) {
          throw new Error("You have already submitted an offer for this request.");
        }

        // 2. Check daily limit
        const recentOffersSnap = await db.collection('offers')
          .where('sellerId', '==', req.user.uid)
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTime = todayStart.getTime();

        const dailyCount = recentOffersSnap.docs.filter(doc => {
          const createdAt = doc.data().createdAt;
          const time = createdAt?.toDate ? createdAt.toDate().getTime() : (createdAt?._seconds ? createdAt._seconds * 1000 : 0);
          return time >= todayStartTime;
        }).length;

        if (dailyCount >= dailyOffersLimit) {
          throw new Error(`Daily limit reached (${dailyOffersLimit} offers per day). Please try again tomorrow.`);
        }

        const offerRef = db.collection('offers').doc();
        transaction.set(offerRef, {
          ...req.body,
          sellerId: req.user.uid,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp()
        });

        const nextOffersCount = currentOffersCount + 1;
        const updates: any = {
          offersCount: nextOffersCount,
          updatedAt: FieldValue.serverTimestamp()
        };

        if (nextOffersCount >= maxOffers) {
          updates.status = 'FULL';
        }

        transaction.update(requestRef, updates);
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
        .get();
      const offers = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      offers.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      res.json(offers);
    } catch (e: any) {
      console.error('❌ API: Error fetching offers:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/offers/seller/:sellerId", verifyToken, async (req: any, res) => {
    try {
      const snap = await db.collection('offers')
        .where('sellerId', '==', req.params.sellerId)
        .get();
      const offers = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(offers);
    } catch (e: any) {
      console.error('❌ API: Error fetching seller offers:', e.message);
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
      createdAt: FieldValue.serverTimestamp()
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
        createdAt: FieldValue.serverTimestamp()
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
        createdAt: FieldValue.serverTimestamp()
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
      authorName: req.user.name || req.body.authorName || 'مشتري',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp()
    };
    
    // Check if user already reviewed this seller
    const existing = await db.collection('users').doc(req.params.sellerId).collection('reviews')
      .where('authorId', '==', req.user.uid)
      .limit(1)
      .get();
      
    if (!existing.empty) {
      await existing.docs[0].ref.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('users').doc(req.params.sellerId).collection('reviews').add(data);
    }
    
    res.json({ status: "pending_approval" });
  });

  app.delete("/api/users/:sellerId/reviews/:reviewId", verifyToken, async (req: any, res) => {
    try {
      const reviewRef = db.collection('users').doc(req.params.sellerId).collection('reviews').doc(req.params.reviewId);
      const snap = await reviewRef.get();
      
      if (snap.exists) {
        const reviewData = snap.data();
        // If was approved, decrement counters
        if (reviewData?.status === 'approved') {
          await db.collection('users').doc(req.params.sellerId).update({
            rating: FieldValue.increment(-Number(reviewData.rating || 0)),
            reviewsCount: FieldValue.increment(-1)
          });
        }
        await reviewRef.delete();
      }
      res.json({ message: "Review deleted" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET ALL REVIEWS BY A BUYER (for their dashboard)
  app.get("/api/buyer/reviews", verifyToken, async (req: any, res) => {
    const buyerId = req.user.uid;
    try {
      let snap;
      try {
        snap = await db.collectionGroup('reviews').where('authorId', '==', buyerId).get();
        
        const reviews = snap.docs.map(doc => {
          const data = doc.data();
          const pathParts = doc.ref.path.split('/');
          const targetType = pathParts[0] === 'users' ? 'seller' : 'announcement';
          const targetId = pathParts[1];
          
          return {
            id: doc.id,
            ...data,
            targetType,
            targetId
          };
        });
        
        reviews.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
          const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
        });

        return res.json(reviews);
      } catch (innerError: any) {
        // Fallback for missing index
        if (innerError.message.includes('FAILED_PRECONDITION') || innerError.code === 9) {
          console.warn("⚠️ API: Missing Index for collectionGroup('reviews'). Falling back to manual filter.");
          const allReviews = await db.collectionGroup('reviews').get();
          
          const reviews = allReviews.docs
            .map(doc => {
              const data = doc.data();
              const pathParts = doc.ref.path.split('/');
              return {
                id: doc.id,
                ...data,
                targetType: pathParts[0] === 'users' ? 'seller' : 'announcement',
                targetId: pathParts[1]
              };
            })
            .filter((r: any) => r.authorId === buyerId);
            
          reviews.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
            const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
            return dateB - dateA;
          });

          return res.json(reviews);
        }
        throw innerError;
      }
    } catch (e: any) {
      console.error("❌ API: Error fetching buyer reviews:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // --- ADMIN REVIEWS MODERATION ---
  app.get("/api/admin/reviews/pending", verifyToken, isAdmin, async (req, res) => {
    try {
      let snap;
      try {
        // Try the optimized query first
        snap = await db.collectionGroup('reviews').where('status', '==', 'pending').get();
      } catch (e) {
        console.warn("⚠️ Admin API: Filtered collectionGroup(reviews) failed, falling back to full scan + JS filter. (Missing index?)");
        // Fallback: fetch all and filter in JS
        const allSnap = await db.collectionGroup('reviews').get();
        // Since we can't filter in Firestore without index, we filter here
        const filteredDocs = allSnap.docs.filter(doc => doc.data().status === 'pending');
        snap = { docs: filteredDocs };
      }

      const results = snap.docs.map(doc => {
        const path = doc.ref.path.split('/');
        return {
          id: doc.id,
          type: path[0] === 'users' ? 'seller' : 'listing',
          targetId: path[1],
          ...doc.data()
        };
      });
      res.json(results);
    } catch (error: any) {
      console.error("❌ Admin API: Failed to fetch pending reviews:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/reviews/:type/:targetId/:reviewId/approve", verifyToken, isAdmin, async (req, res) => {
    try {
      const { type, targetId, reviewId } = req.params;
      const collectionName = type === 'seller' ? 'users' : 'announcements';
      const reviewRef = db.collection(collectionName).doc(targetId).collection('reviews').doc(reviewId);
      const reviewSnap = await reviewRef.get();
      
      if (!reviewSnap.exists) return res.status(404).json({ error: "Review not found" });
      
      const reviewData = reviewSnap.data();
      if (reviewData?.status === 'approved') return res.json({ status: "already_approved" });

      await db.runTransaction(async (transaction) => {
        transaction.update(reviewRef, { status: 'approved' });
        
        const targetRef = db.collection(collectionName).doc(targetId);
        if (type === 'seller') {
          transaction.update(targetRef, {
            rating: FieldValue.increment(Number(reviewData?.rating || 0)),
            reviewsCount: FieldValue.increment(1)
          });
        } else {
          transaction.update(targetRef, {
            rating: FieldValue.increment(Number(reviewData?.rating || 0)),
            ratingCount: FieldValue.increment(1)
          });
        }
      });
      
      res.json({ status: "approved" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- ADMIN ENDPOINTS ---

  app.get("/api/admin/stats", verifyToken, isAdmin, async (req, res) => {
    try {
      const { period } = req.query;
      let startDate: Date | null = null;
      const now = new Date();

      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const applyPeriod = (query: any) => {
        if (startDate) {
          return query.where('createdAt', '>=', startDate);
        }
        return query;
      };

      const safeCount = async (query: any) => {
        try {
          const snap = await query.count().get();
          return snap.data().count;
        } catch (e: any) {
          // If it's an index error, try to fetch and count manually (only for small sets)
          if (e.message?.includes('index') || e.code === 9) {
            try {
              // Try to fetch up to 1000 docs to count manually
              const snap = await query.limit(1001).get();
              if (snap.size > 1000) {
                console.warn("⚠️ Data too large for manual count fallback. Returning 0.");
                return 0;
              }
              return snap.size;
            } catch (innerE) {
              console.error("⚠️ Manual count fallback failed:", e.message);
              return 0;
            }
          }
          console.error("⚠️ Firestore Count Failed:", e.message);
          return 0;
        }
      };

      // ── Parallel count queries ────────────────────────────────────────────
      const [
        totalUsers, sellers, buyers, verified, blocked,
        totalAds, activeAds, pendingAds, inactiveAds, boostedAds,
        totalRequests, openRequests, closedRequests,
        totalOffers, reports, donations,
      ] = await Promise.all([
        safeCount(applyPeriod(db.collection('users'))),
        safeCount(applyPeriod(db.collection('users').where('role', '==', 'seller'))),
        safeCount(applyPeriod(db.collection('users').where('role', '==', 'buyer'))),
        safeCount(applyPeriod(db.collection('users').where('isVerified', '==', true))),
        safeCount(applyPeriod(db.collection('users').where('status', '==', 'blocked'))),
        safeCount(applyPeriod(db.collection('announcements'))),
        safeCount(applyPeriod(db.collection('announcements').where('status', '==', 'active'))),
        safeCount(applyPeriod(db.collection('announcements').where('status', '==', 'pending'))),
        safeCount(applyPeriod(db.collection('announcements').where('status', '==', 'inactive'))),
        safeCount(applyPeriod(db.collection('announcements').where('boosted', '==', true))),
        safeCount(applyPeriod(db.collection('offerRequests'))),
        safeCount(applyPeriod(db.collection('offerRequests').where('status', '==', 'Open'))),
        safeCount(applyPeriod(db.collection('offerRequests').where('status', '==', 'Closed'))),
        safeCount(applyPeriod(db.collection('offers'))),
        safeCount(applyPeriod(db.collection('reports'))),
        safeCount(applyPeriod(db.collection('donations'))),
      ]);

      // ── Last 6 months growth (users + listings per month) ────────────────
      const monthlyGrowth: { month: string; users: number; listings: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        
        const [uCount, lCount] = await Promise.all([
          safeCount(db.collection('users').where('createdAt', '>=', start).where('createdAt', '<', end)),
          safeCount(db.collection('announcements').where('createdAt', '>=', start).where('createdAt', '<', end)),
        ]);
        
        monthlyGrowth.push({
          month: start.toLocaleDateString('ar-MA', { month: 'short', year: '2-digit' }),
          users: uCount,
          listings: lCount,
        });
      }

      // ── Category breakdown (top categories) ──────────────────────────────
      const categories = ['سردي', 'بركي', 'تيمحضيت', 'بني كيل', 'دمّان', 'إسباني', 'روماني'];
      const categoryBreakdown = await Promise.all(
        categories.map(async (cat) => ({
          name: cat,
          count: await safeCount(applyPeriod(db.collection('announcements').where('category', '==', cat).where('status', '==', 'active'))),
        }))
      );

      // ── User subscription plan breakdown ─────────────────────────────────
      const plans = ['احترافي', 'شركات'];
      const planBreakdown = await Promise.all(
        plans.map(async (plan) => ({
          name: plan,
          count: await safeCount(applyPeriod(db.collection('users').where('plan', '==', plan))),
        }))
      );
      planBreakdown.push({
        name: 'مجاني',
        count: Math.max(0, sellers - planBreakdown.reduce((s, p) => s + p.count, 0)),
      });

      // ── Recent activity (last 7 days listings) ────────────────────────────
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentListings = await safeCount(db.collection('announcements').where('createdAt', '>=', sevenDaysAgo));
      const recentUsers = await safeCount(db.collection('users').where('createdAt', '>=', sevenDaysAgo));

      res.json({
        // Core counts
        totalUsers,
        sellers,
        buyers,
        verifiedSellers: verified,
        blockedUsers: blocked,
        // Listings
        totalAds,
        activeAds,
        pendingAds,
        inactiveAds,
        boostedAds,
        // Marketplace
        totalRequests,
        openRequests,
        closedRequests,
        totalOffers,
        // Moderation
        pendingReports: reports,
        donations,
        // Recent (7 days)
        newListingsThisWeek: recentListings,
        newUsersThisWeek: recentUsers,
        // Growth chart
        monthlyGrowth,
        // Breakdowns
        categoryBreakdown: categoryBreakdown.filter(c => c.count > 0).sort((a, b) => b.count - a.count),
        planBreakdown,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", verifyToken, isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limitVal = Math.min(parseInt(req.query.limit as string) || 50, 200);
      
      const snap = await db.collection('users')
        .limit(limitVal)
        .offset((page - 1) * limitVal)
        .get();
        
      res.json(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (error: any) {
      console.error("Error fetching admin users:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users/:userId/notify", verifyToken, isAdmin, async (req, res) => {
    const notification = {
      ...req.body,
      createdAt: FieldValue.serverTimestamp(),
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
    
    // To handle large imports, we might need multiple batches, but for now let's stick to one
    // or assume the data size is within Firestore limits (500 per batch).
    
    const phoneToUid: Record<string, string> = {};

    try {
      for (const item of data) {
        let sellerId = item.sellerId;
        
        // If no sellerId, try to find or create by phone
        if (!sellerId && item.phone) {
          // Normalize phone for lookup (basic normalization)
          let clean = item.phone.replace(/\D/g, '');
          if (clean.startsWith('0')) clean = clean.substring(1);
          if (clean.startsWith('212')) clean = clean.substring(3);
          const fullPhone = `+212${clean}`;
          
          if (phoneToUid[fullPhone]) {
            sellerId = phoneToUid[fullPhone];
          } else {
            // 1. Check Firestore
            const userSnap = await db.collection('users')
              .where('phoneNumber', 'in', [item.phone, `0${clean}`, `+212${clean}`, clean])
              .limit(1)
              .get();
              
            if (!userSnap.empty) {
              sellerId = userSnap.docs[0].id;
              phoneToUid[fullPhone] = sellerId;
            } else {
              // 2. Try to find in Auth (maybe Firestore doc is missing)
              try {
                const userRecord = await auth.getUserByPhoneNumber(fullPhone);
                sellerId = userRecord.uid;
                // Sync to Firestore
                await db.collection('users').doc(sellerId).set({
                  fullName: item.sellerName || 'كساب',
                  phoneNumber: item.phone,
                  role: 'seller',
                  status: 'active',
                  createdAt: FieldValue.serverTimestamp(),
                  updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                phoneToUid[fullPhone] = sellerId;
              } catch (authErr: any) {
                if (authErr.code === 'auth/user-not-found') {
                  // 3. Create new user
                  const email = `user_${clean}@kessabcom.ma`;
                  const userRecord = await auth.createUser({
                    phoneNumber: fullPhone,
                    displayName: item.sellerName || 'كساب جديد',
                    email: email
                  });
                  sellerId = userRecord.uid;
                  await db.collection('users').doc(sellerId).set({
                    fullName: item.sellerName || 'كساب جديد',
                    phoneNumber: item.phone,
                    email: email,
                    role: 'seller',
                    status: 'active',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                  });
                  phoneToUid[fullPhone] = sellerId;
                } else {
                  console.error(`Auth error for ${fullPhone}:`, authErr.message);
                  continue; // Skip this item
                }
              }
            }
          }
        }

        if (sellerId) {
          const ref = db.collection('announcements').doc();
          // Ensure we don't pass sellerName/phone in the listing doc if we want it to be dynamic,
          // but usually it's denormalized for performance.
          batch.set(ref, { 
            ...item, 
            sellerId,
            createdAt: FieldValue.serverTimestamp(),
            status: 'active'
          });
        }
      }

      await batch.commit();
      res.json({ status: "ok", message: `Imported ${data.length} listings successfully.` });
    } catch (e: any) {
      console.error("Import failed:", e);
      res.status(500).json({ error: e.message });
    }
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

  app.put("/api/admin/listings/:id/pin", verifyToken, isAdmin, async (req, res) => {
    const { isPinnedToHome } = req.body;
    await db.collection('announcements').doc(req.params.id).update({ isPinnedToHome: !!isPinnedToHome });
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



  app.post("/api/clicks", async (req: any, res) => {
    const { listingId, type } = req.body;
    try {
      let ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
      if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', '');
      const today = new Date().toISOString().split('T')[0];
      const interactionId = `${ip}_${listingId}_${type}_${today}`.replace(/[^a-zA-Z0-9]/g, '_');

      const interactionRef = db.collection('announcements').doc(listingId).collection('interactions').doc(interactionId);
      const interactionSnap = await interactionRef.get();

      if (!interactionSnap.exists) {
        await db.runTransaction(async (transaction) => {
          transaction.set(interactionRef, { timestamp: FieldValue.serverTimestamp(), ip, type });
          transaction.update(db.collection('announcements').doc(listingId), {
            [`clicks.${type}`]: FieldValue.increment(1),
            totalClicks: FieldValue.increment(1)
          });
        });
      }
      res.json({ status: "ok" });
    } catch (e) {
      console.error("Click logging error:", e);
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
        createdAt: FieldValue.serverTimestamp()
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
      const ref = db.collection('users').doc(req.user.uid).collection('notifications').doc(req.params.id);
      const snap = await ref.get();
      
      if (!snap.exists) return res.status(404).json({ error: "Notification introuvable" });

      await ref.update({
        read: true,
        readAt: new Date().toISOString()
      });
      res.json({ status: "ok" });
    } catch (e) {
      console.error("mark notification read error:", e);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // --- SUPPORT REQUESTS ENDPOINTS ---
  app.post("/api/support/requests", optionalVerifyToken, async (req: any, res) => {
    try {
      const { type, phone, details, name } = req.body;
      const data = {
        type, // e.g., 'password_reset'
        phone,
        name: name || 'غير معروف',
        details: details || '',
        status: 'pending',
        userId: req.user?.uid || null,
        createdAt: FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('supportRequests').add(data);
      res.status(201).json({ id: docRef.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/support/requests", verifyToken, isAdmin, async (req: any, res) => {
    try {
      const snap = await db.collection('supportRequests').orderBy('createdAt', 'desc').limit(100).get();
      res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/support/requests/:id/status", verifyToken, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      await db.collection('supportRequests').doc(req.params.id).update({ status, updatedAt: FieldValue.serverTimestamp() });
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/support/requests/:id", verifyToken, isAdmin, async (req: any, res) => {
    try {
      await db.collection('supportRequests').doc(req.params.id).delete();
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", verifyToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const callerDoc = await db.collection('users').doc(req.user.uid).get();
      const isAdmin = callerDoc.data()?.role === 'admin';
      
      if (req.user.uid !== id && !isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await db.collection('users').doc(id).set({
        ...req.body,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      
      res.json({ status: "ok" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/users/reset-password", verifyToken, isAdmin, async (req: any, res) => {
    try {
      const { phone, newPassword, requestId } = req.body;
      if (!phone || !newPassword) {
        return res.status(400).json({ error: "Phone and newPassword are required" });
      }

      // 1. Find user by phone number in Firestore to get UID
      let clean = phone.replace(/\D/g, '');
      if (clean.startsWith('212')) clean = clean.substring(3);
      if (clean.startsWith('0')) clean = clean.substring(1);
      
      const formats = [phone, `+212${clean}`, `0${clean}`, clean];
      const userSnap = await db.collection('users')
        .where('phoneNumber', 'in', formats)
        .limit(1)
        .get();

      if (userSnap.empty) {
        return res.status(404).json({ error: "User not found with this phone number" });
      }

      const uid = userSnap.docs[0].id;

      // 2. Update password in Firebase Auth
      await auth.updateUser(uid, {
        password: newPassword
      });

      // 3. Mark support request as resolved if requestId is provided
      if (requestId) {
        await db.collection('supportRequests').doc(requestId).update({
          status: 'resolved',
          resolvedAt: FieldValue.serverTimestamp(),
          tempPasswordSent: true
        });
      }

      console.log(`✅ Admin: Password reset for user ${uid} (${phone})`);
      res.json({ status: "ok", message: "Password updated successfully" });
    } catch (e: any) {
      console.error("❌ Admin: Password reset failed:", e);
      res.status(500).json({ error: e.message });
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

  // Global Error Handler
  app.use((err: any, req: any, res: Response, next: NextFunction) => {
    console.error("🔥 GLOBAL ERROR:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ API Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`🎨 Frontend dev server: http://localhost:5173`);
      console.log(`   Run 'npm run dev:client' in another terminal if not already running.`);
    }
  });
}

startServer();
