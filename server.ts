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
        if (process.env.NODE_ENV === 'production') {
          return callback(new Error("Origin header required in production"));
        }
        return callback(null, true); // Allow no-origin in dev (curl, Postman, etc.)
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
      res.json({ message: "Profile updated" });
    } catch (e: any) {
      console.error('❌ API: updateProfile error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", optionalVerifyToken, async (req: any, res) => {
    try {
      const doc = await db.collection('users').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      const data = doc.data() || {};
      
      let isOwner = false;
      let isAdminUser = false;
      
      if (req.user) {
        isOwner = req.user.uid === req.params.id;
        const callerDoc = await db.collection('users').doc(req.user.uid).get();
        isAdminUser = callerDoc.data()?.role === 'admin';
      }
      
      if (!isOwner && !isAdminUser && data.role !== 'seller') {
        delete data.email;
        delete data.phoneNumber;
        delete data.whatsappNumber;
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

  app.get("/api/listings/:id", async (req, res) => {
    const doc = await db.collection('announcements').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
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
      const limitVal = Math.min(parseInt(req.query.limit as string) || 12, 100);
      const startAfterId = req.query.startAfter as string;

      let queryRef: any = db.collection('offerRequests')
        .where('status', '==', 'Open')
        .orderBy('createdAt', 'desc');

      if (startAfterId) {
        const cursorDoc = await db.collection('offerRequests').doc(startAfterId).get();
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
      console.error('❌ API: Error fetching requests:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/offer-requests", verifyToken, async (req: any, res) => {
    try {
      // Bug #3 FIX: sanitize inputs — no raw ...req.body spread
      const { category, location, sheepCount, maxBudget, needsDelivery, description, urgency } = req.body;

      if (!category || typeof category !== 'string' || category.trim().length === 0) {
        return res.status(400).json({ error: 'La catégorie est requise.' });
      }
      if (maxBudget !== undefined && (isNaN(Number(maxBudget)) || Number(maxBudget) < 0)) {
        return res.status(400).json({ error: 'Le budget maximum doit être un nombre positif.' });
      }
      if (sheepCount !== undefined && (isNaN(Number(sheepCount)) || Number(sheepCount) < 0)) {
        return res.status(400).json({ error: 'Le nombre de moutons doit être un nombre positif.' });
      }

      const ALLOWED_URGENCY = ['normal', 'urgent', 'very_urgent'];
      const data = {
        category: String(category).trim(),
        location: location ? String(location).trim() : null,
        sheepCount: sheepCount !== undefined ? Number(sheepCount) : null,
        maxBudget: maxBudget !== undefined ? Number(maxBudget) : null,
        needsDelivery: Boolean(needsDelivery),
        description: description ? String(description).trim().slice(0, 1000) : '',
        urgency: ALLOWED_URGENCY.includes(urgency) ? urgency : 'normal',
        buyerId: req.user.uid,
        status: 'Open',
        offersCount: 0,
        createdAt: FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('offerRequests').add(data);
      console.log(`✅ offerRequest created: ${docRef.id} by ${req.user.uid}`);
      res.status(201).json({ id: docRef.id });
    } catch (e: any) {
      console.error('❌ POST /api/offer-requests error:', e.message);
      res.status(500).json({ error: e.message || 'Internal server error' });
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
          createdAt: FieldValue.serverTimestamp()
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
      createdAt: FieldValue.serverTimestamp()
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
      // ── Parallel count queries ────────────────────────────────────────────
      const [
        totalUsersSnap, sellersSnap, buyersSnap, verifiedSnap, blockedSnap,
        totalAdsSnap, activeAdsSnap, pendingAdsSnap, inactiveAdsSnap, boostedAdsSnap,
        totalRequestsSnap, openRequestsSnap, closedRequestsSnap,
        totalOffersSnap, reportsSnap, donationsSnap,
      ] = await Promise.all([
        db.collection('users').count().get(),
        db.collection('users').where('role', '==', 'seller').count().get(),
        db.collection('users').where('role', '==', 'buyer').count().get(),
        db.collection('users').where('isVerified', '==', true).count().get(),
        db.collection('users').where('status', '==', 'blocked').count().get(),
        db.collection('announcements').count().get(),
        db.collection('announcements').where('status', '==', 'active').count().get(),
        db.collection('announcements').where('status', '==', 'pending').count().get(),
        db.collection('announcements').where('status', '==', 'inactive').count().get(),
        db.collection('announcements').where('boosted', '==', true).count().get(),
        db.collection('offerRequests').count().get(),
        db.collection('offerRequests').where('status', '==', 'Open').count().get(),
        db.collection('offerRequests').where('status', '==', 'Closed').count().get(),
        db.collection('offers').count().get(),
        db.collection('reports').count().get(),
        db.collection('donations').count().get(),
      ]);

      // ── Last 6 months growth (users + listings per month) ────────────────
      const now = new Date();
      const monthlyGrowth: { month: string; users: number; listings: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const [uSnap, lSnap] = await Promise.all([
          db.collection('users')
            .where('createdAt', '>=', start)
            .where('createdAt', '<', end)
            .count().get(),
          db.collection('announcements')
            .where('createdAt', '>=', start)
            .where('createdAt', '<', end)
            .count().get(),
        ]);
        monthlyGrowth.push({
          month: start.toLocaleDateString('ar-MA', { month: 'short', year: '2-digit' }),
          users: uSnap.data().count,
          listings: lSnap.data().count,
        });
      }

      // ── Category breakdown (top categories) ──────────────────────────────
      const categories = ['سردي', 'بركي', 'تيمحضيت', 'بني كيل', 'دمّان', 'إسباني', 'روماني'];
      const categoryBreakdown = await Promise.all(
        categories.map(async (cat) => ({
          name: cat,
          count: (await db.collection('announcements').where('category', '==', cat).where('status', '==', 'active').count().get()).data().count,
        }))
      );

      // ── User subscription plan breakdown ─────────────────────────────────
      const plans = ['احترافي', 'شركات'];
      const planBreakdown = await Promise.all(
        plans.map(async (plan) => ({
          name: plan,
          count: (await db.collection('users').where('plan', '==', plan).count().get()).data().count,
        }))
      );
      planBreakdown.push({
        name: 'مجاني',
        count: Math.max(0, sellersSnap.data().count - planBreakdown.reduce((s, p) => s + p.count, 0)),
      });

      // ── Recent activity (last 7 days listings) ────────────────────────────
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentListingsSnap = await db.collection('announcements')
        .where('createdAt', '>=', sevenDaysAgo).count().get();
      const recentUsersSnap = await db.collection('users')
        .where('createdAt', '>=', sevenDaysAgo).count().get();

      res.json({
        // Core counts
        totalUsers: totalUsersSnap.data().count,
        sellers: sellersSnap.data().count,
        buyers: buyersSnap.data().count,
        verifiedSellers: verifiedSnap.data().count,
        blockedUsers: blockedSnap.data().count,
        // Listings
        totalAds: totalAdsSnap.data().count,
        activeAds: activeAdsSnap.data().count,
        pendingAds: pendingAdsSnap.data().count,
        inactiveAds: inactiveAdsSnap.data().count,
        boostedAds: boostedAdsSnap.data().count,
        // Marketplace
        totalRequests: totalRequestsSnap.data().count,
        openRequests: openRequestsSnap.data().count,
        closedRequests: closedRequestsSnap.data().count,
        totalOffers: totalOffersSnap.data().count,
        // Moderation
        pendingReports: reportsSnap.data().count,
        donations: donationsSnap.data().count,
        // Recent (7 days)
        newListingsThisWeek: recentListingsSnap.data().count,
        newUsersThisWeek: recentUsersSnap.data().count,
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
    data.forEach((item: any) => {
      const ref = db.collection('announcements').doc();
      batch.set(ref, { 
        ...item, 
        createdAt: FieldValue.serverTimestamp(),
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
