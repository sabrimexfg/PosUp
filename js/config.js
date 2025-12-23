// Firebase Configuration
// IMPORTANT: Set these values via environment variables or update this file locally (do not commit secrets)
// For local development, create a .env file with your Firebase config values

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
window.firebaseConfig = firebaseConfig;

// Export config if using modules, otherwise it's global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
