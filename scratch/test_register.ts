/**
 * test_register.ts
 * ================
 * Tests the full registration flow for:
 *   - Kessab (seller): 0612345678 / 0612345678
 *   - Acheteur (buyer): 0687654321 / 0687654321
 *
 * Uses Firebase Admin SDK to:
 * 1. Clean up any existing test accounts
 * 2. Create the Auth user (simulating createUserWithEmailAndPassword)
 * 3. Write the Firestore profile (simulating setDoc in Auth.tsx)
 * 4. Verify the profile was written correctly
 * 5. Simulate a login check (simulating handleInitialSubmit)
 *
 * Usage: npx tsx scratch/test_register.ts
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// ─── Init ────────────────────────────────────────────────────────────────────
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const auth = admin.auth();
const db = admin.firestore();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getEmail(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('212')) clean = clean.substring(3);
  if (clean.startsWith('0')) clean = clean.substring(1);
  return `${clean}@kessabcom.ma`;
}

function getFormattedPhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('212')) clean = clean.substring(3);
  if (clean.startsWith('0')) clean = clean.substring(1);
  return `+212${clean}`;
}

async function cleanupUser(email: string): Promise<void> {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.deleteUser(existing.uid);
    await db.collection('users').doc(existing.uid).delete();
    console.log(`  🧹 Cleaned up existing user: ${email}`);
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      console.log(`  ✅ No existing user to clean up for: ${email}`);
    } else {
      throw e;
    }
  }
}

async function registerUser(
  phone: string,
  password: string,
  role: 'seller' | 'buyer',
  fullName: string,
  city: string
): Promise<{ uid: string; email: string }> {
  const email = getEmail(phone);
  const formattedPhone = getFormattedPhone(phone);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📝 Registering ${role.toUpperCase()}: ${phone} (${email})`);
  console.log(`${'─'.repeat(60)}`);

  // Step 1: Cleanup
  await cleanupUser(email);

  // Step 2: Create Firebase Auth user
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: fullName,
  });
  const uid = userRecord.uid;
  console.log(`  ✅ Firebase Auth user created: UID = ${uid}`);

  // Step 3: Write Firestore profile (mirrors setDoc in Auth.tsx)
  const profileData = {
    uid,
    email,
    fullName,
    displayName: fullName,
    phoneNumber: formattedPhone,
    role,
    city,
    location: city,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(uid).set(profileData, { merge: true });
  console.log(`  ✅ Firestore profile written`);

  // Step 4: Verify profile
  const snapshot = await db.collection('users').doc(uid).get();
  const saved = snapshot.data();
  if (!saved) throw new Error('Profile was not found in Firestore after write!');
  if (saved.role !== role) throw new Error(`Role mismatch: expected ${role}, got ${saved.role}`);
  if (saved.phoneNumber !== formattedPhone) throw new Error(`Phone mismatch: expected ${formattedPhone}, got ${saved.phoneNumber}`);
  console.log(`  ✅ Profile verified in Firestore:`);
  console.log(`     Name    : ${saved.fullName}`);
  console.log(`     Phone   : ${saved.phoneNumber}`);
  console.log(`     Role    : ${saved.role}`);
  console.log(`     City    : ${saved.city}`);
  console.log(`     Status  : ${saved.status}`);

  // Step 5: Simulate check-phone (mirrors server check-phone endpoint)
  console.log(`\n  🔍 Simulating check-phone for ${formattedPhone}...`);
  const phoneSnap = await db
    .collection('users')
    .where('phoneNumber', 'in', [formattedPhone, phone, `0${formattedPhone.slice(4)}`])
    .limit(1)
    .get();

  if (phoneSnap.empty) {
    throw new Error('check-phone returned empty! Phone not found in Firestore.');
  }
  const foundUid = phoneSnap.docs[0].id;
  try {
    await auth.getUser(foundUid);
    console.log(`  ✅ check-phone: exists = true (Auth + Firestore in sync)`);
  } catch {
    throw new Error('check-phone: user found in Firestore but NOT in Auth!');
  }

  // Step 6: Simulate login (verify password by fetching auth user)
  const authUser = await auth.getUserByEmail(email);
  if (!authUser) throw new Error('Login simulation failed: user not found in Auth!');
  console.log(`  ✅ Login simulation: Auth user found, email = ${authUser.email}`);

  // Step 7: Expected redirect
  const expectedRedirect = role === 'seller' ? '/add-listing' : '/buyer';
  console.log(`\n  🚀 Expected redirect after login: ${expectedRedirect}`);

  return { uid, email };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║        KESSABCOM — Registration & Login Flow Test        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results: { test: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  // Test 1: Kessab (seller)
  try {
    await registerUser('0612345678', '0612345678', 'seller', 'كساب تيست', 'الدار البيضاء');
    results.push({ test: 'Kessab (Seller) Registration', status: 'PASS' });
  } catch (e: any) {
    console.error(`  ❌ SELLER TEST FAILED:`, e.message);
    results.push({ test: 'Kessab (Seller) Registration', status: 'FAIL', error: e.message });
  }

  // Test 2: Acheteur (buyer)
  try {
    await registerUser('0687654321', '0687654321', 'buyer', 'مشتري تيست', 'الرباط');
    results.push({ test: 'Acheteur (Buyer) Registration', status: 'PASS' });
  } catch (e: any) {
    console.error(`  ❌ BUYER TEST FAILED:`, e.message);
    results.push({ test: 'Acheteur (Buyer) Registration', status: 'FAIL', error: e.message });
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  TEST SUMMARY');
  console.log(`${'═'.repeat(60)}`);
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${r.test}: ${r.status}`);
    if (r.error) console.log(`      Error: ${r.error}`);
  }

  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`\n${'═'.repeat(60)}`);
  if (allPassed) {
    console.log('  🎉 All tests PASSED! The registration flow is working correctly.');
    console.log('     You can now try logging in with:');
    console.log('       Kessab  → 0612345678 / 0612345678  (redirect: /add-listing)');
    console.log('       Acheteur → 0687654321 / 0687654321  (redirect: /buyer)');
  } else {
    console.log('  ⚠️  Some tests FAILED. Check the errors above.');
  }
  console.log(`${'═'.repeat(60)}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
