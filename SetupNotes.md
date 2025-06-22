
# REMI Story - Setup Instructions

This guide will help you set up and run the REMI Story application locally using a real Firebase backend and the Gemini API.

## Prerequisites

1.  **Node.js and npm/yarn:** Ensure you have Node.js (which includes npm) or Yarn installed. Vite uses these for its development server.
2.  **Vite:** If you don't have Vite installed globally, you can use `npx vite` to run it.
3.  **Firebase Account:** You'll need a Google account to create and manage Firebase projects.
4.  **Google AI Studio Account (for Gemini API Key):** You'll need an API key for the Gemini API.

## Setup Steps

### 1. Download or Clone the Application

Download or clone the application files to your local machine.

### 2. Firebase Project Setup

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the on-screen instructions to create a new Firebase project.

2.  **Register Your Web App:**
    *   In your new Firebase project, go to Project Overview.
    *   Click the Web icon (`</>`) to add a web app.
    *   Give your app a nickname (e.g., "REMI Story Dev").
    *   **Do NOT** check the box for "Also set up Firebase Hosting for this app" unless you plan to use it.
    *   Click "Register app".
    *   Firebase will provide you with a `firebaseConfig` object. **Copy these values carefully.** You'll need them for your `.env` file. You can find this config later in Project Settings > General > Your apps > SDK setup and configuration.

3.  **Enable Firebase Services:**
    *   **Authentication:**
        *   In the Firebase Console, go to "Authentication" (under Build).
        *   Click "Get started".
        *   Under the "Sign-in method" tab, enable the sign-in providers you want to use (e.g., "Email/Password", "Google", "Microsoft Account", "Apple"). For OAuth providers, you might need additional setup in their respective developer consoles.
    *   **Firestore Database:**
        *   Go to "Firestore Database" (under Build).
        *   Click "Create database".
        *   Choose **Start in test mode** for initial development (this allows open access). **IMPORTANT:** For production, you MUST secure your database with [Security Rules](https://firebase.google.com/docs/firestore/security/get-started).
        *   Select a Firestore location (choose one close to your users).
        *   Click "Enable".
    *   **Storage:**
        *   Go to "Storage" (under Build).
        *   Click "Get started".
        *   Follow the on-screen prompts, again choosing **Start in test mode** for development. **IMPORTANT:** For production, secure your storage with [Security Rules](https://firebase.google.com/docs/storage/security/get-started).
        *   Click "Done".

4.  **Firestore Security Rules (Development - Insecure):**
    *   In the Firebase Console, go to "Firestore Database" > "Rules".
    *   Replace the existing rules with the following for easy development access:
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if true; // WARNING: Insecure for production
            }
          }
        }
        ```
    *   Click "Publish". **Remember to change these to secure rules before going to production!**

5.  **Firebase Storage Security Rules (Development - Insecure):**
    *   In the Firebase Console, go to "Storage" > "Rules".
    *   Replace the existing rules with:
        ```
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            match /{allPaths=**} {
              allow read, write: if true; // WARNING: Insecure for production
            }
          }
        }
        ```
    *   Click "Publish". **Remember to change these to secure rules before going to production!**

### 3. Gemini API Key

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Sign in with your Google account.
3.  Create an API key. Copy this key.

### 4. Environment Variables

1.  In the root directory of your downloaded/cloned application, create a file named `.env`.
2.  Add your Firebase project configuration and Gemini API key to this file. **Replace `YOUR_ACTUAL_..._KEY` with the values you copied.**

    ```env
    # Gemini API Key
    VITE_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY

    # Firebase Configuration
    VITE_FIREBASE_API_KEY=YOUR_ACTUAL_FIREBASE_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN=YOUR_ACTUAL_FIREBASE_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID=YOUR_ACTUAL_FIREBASE_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET=YOUR_ACTUAL_FIREBASE_STORAGE_BUCKET
    VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_ACTUAL_FIREBASE_MESSAGING_SENDER_ID
    VITE_FIREBASE_APP_ID=YOUR_ACTUAL_FIREBASE_APP_ID
    # VITE_FIREBASE_MEASUREMENT_ID=YOUR_ACTUAL_FIREBASE_MEASUREMENT_ID # Optional
    ```

    **IMPORTANT:**
    *   Ensure all variable names start with `VITE_`.
    *   Do not commit your `.env` file to version control (e.g., Git). Add `.env` to your `.gitignore` file.

### 5. Running the Application

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of the application.
3.  Run the Vite development server:
    *   If you have Vite installed globally:
        ```bash
        vite
        ```
    *   Or, using npx (recommended if not installed globally):
        ```bash
        npx vite
        ```
    *   If you have a `package.json` with a dev script (e.g., `"dev": "vite"`):
        ```bash
        npm run dev
        # or
        yarn dev
        ```

4.  Vite will typically start the server and output a URL like `http://localhost:5173/`. Open this URL in your web browser.

### 6. Initial Data and Usage

*   The application will now connect to your real Firebase backend.
*   Since it's a new Firebase project, there will be no initial data (users, spheres, posts, etc.) unless you manually add it to your Firebase console or create it through the application's UI.
*   The `MOCK_SPHERES` and `MOCK_USERS` defined in `constants.ts` are no longer automatically seeded as they were in the mock environment.
    *   New users will get an initial sphere assigned to them upon creation (as per `authService.ts`).
    *   You can create new spheres using the "Skapa ny sfär" button in the sidebar dropdown.
*   Start by creating an account and then a sphere if needed.

## Troubleshooting

*   **Firebase Connection Issues:** Double-check your Firebase configuration values in the `.env` file and ensure they match the ones from your Firebase project settings. Check the browser's developer console for any Firebase-related errors.
*   **Gemini API Issues:** Ensure your `VITE_API_KEY` is correct and that the Gemini API is enabled for your project in Google AI Studio. Check the console for API errors.
*   **"Missing Firebase config values" error:** This means one or more `VITE_FIREBASE_...` variables are not set in your `.env` file or not being picked up by Vite. Ensure the `.env` file is in the project root and restart the Vite server.
*   **Security Rules:** If you encounter permission errors after setting up secure rules, review your Firestore and Storage security rules in the Firebase console to ensure they allow the operations your app is trying to perform. The development rules provided above are very permissive.

---

You should now be able to run and use the REMI Story application with your own Firebase backend!
