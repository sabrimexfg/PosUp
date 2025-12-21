// Firebase Configuration
// IMPORTANT: You must add your Web App ID and Measurement ID below from the Firebase Console.

const firebaseConfig = {
    apiKey: "AIzaSyAN7PXrQgW-jGdnvJocgMT20mq1vpz8-1k",
    authDomain: "posup-ba5be.firebaseapp.com", // Derived from Project ID
    projectId: "posup-ba5be",
    storageBucket: "posup-ba5be.firebasestorage.app",
    messagingSenderId: "659640233256",
    appId: "INSERT_YOUR_WEB_APP_ID_HERE", // ⚠️ REQUIRED: Get this from Firebase Console -> Project Settings -> General -> Your apps -> Web App
    measurementId: "INSERT_YOUR_MEASUREMENT_ID_HERE" // Optional: Get this if you want Google Analytics
};

// Export config if using modules, otherwise it's global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
