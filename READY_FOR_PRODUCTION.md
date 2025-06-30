# 🚀 Ready for Production Checklist

This checklist will help you prepare your REMI Story app for production deployment. Follow each step to ensure your app is secure, stable, and ready for real users.

---

## 1. Environment Variables
- [ ] **Create a `.env.production` or `.env` file** (do NOT use `.env.development.local` for production).
- [ ] **Set all required Firebase config variables** with your real Firebase project values:
  ```env
  VITE_FIREBASE_API_KEY=your_production_firebase_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)
  VITE_GEMINI_API_KEY=your_production_gemini_api_key
  ```
- [ ] **NEVER commit your `.env` files to version control!**

---

## 2. Firebase Configuration
- [ ] **Remove all emulator connections** from your code. In `src/firebase.ts`, remove or comment out any `connectFirestoreEmulator`, `connectAuthEmulator`, and `connectStorageEmulator` calls.
- [ ] **Double-check your Firebase project settings** in the [Firebase Console](https://console.firebase.google.com/).
- [ ] **Set up Firestore and Storage security rules** for production (do NOT use open rules!).

---

## 3. CORS and Hosting
- [ ] **If using Firebase Hosting**, configure your `firebase.json` for production hosting.
- [ ] **If using Firebase Storage directly from the browser**, set up [CORS rules](https://firebase.google.com/docs/storage/web/download-files#cors_configuration) for your storage bucket.

---

## 4. API Keys and Secrets
- [ ] **Use production API keys** for Gemini and Firebase.
- [ ] **Do NOT expose any sensitive keys in client-side code** (only public keys should be in `.env`).

---

## 5. Security & Best Practices
- [ ] **Review and tighten Firestore and Storage security rules.**
- [ ] **Remove any test users or data** from your production Firebase project.
- [ ] **Audit your dependencies** for vulnerabilities (`npm audit`).
- [ ] **Set up monitoring and error reporting** (e.g., Sentry, Firebase Crashlytics).

---

## 6. Build and Deploy
- [ ] **Run a production build:**
  ```sh
  npm run build
  ```
- [ ] **Test the production build locally:**
  ```sh
  npm run preview
  ```
- [ ] **Deploy to your hosting provider** (Firebase Hosting, Vercel, Netlify, etc.).

---

## 7. Final Testing
- [ ] **Test all critical flows** (signup, login, image upload, Gemini analysis, etc.) in production.
- [ ] **Check for any console errors or warnings.**
- [ ] **Verify that no emulator warnings or banners appear.**

---

## 8. Documentation & Support
- [ ] **Update your README.md** with production setup instructions.
- [ ] **Document any manual steps for future deployments.**

---

## 9. Optional: Analytics & SEO
- [ ] **Set up analytics** (Google Analytics, Firebase Analytics, etc.).
- [ ] **Add SEO meta tags and social sharing images.**

---

## 10. Backup & Rollback Plan
- [ ] **Have a backup and rollback plan** in case of issues after deployment.

---

**Congratulations!** 🎉 Your app is now ready for production. Double-check each item before going live. 