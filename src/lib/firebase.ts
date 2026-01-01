import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";
import {
    Firestore,
    getFirestore,
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    getCountFromServer,
    updateDoc,
    setDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    DocumentSnapshot,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    onSnapshot
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore with Persistent Cache (IndexedDB)
// We must ensure this runs only once to avoid "Firestore has already been started" errors
let db: Firestore;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
    console.log("🔥 Firestore initialized with persistence");
} catch (e) {
    // If already initialized (e.g. fast refresh), just get the existing instance
    console.log("⚠️ Firestore already initialized, reusing instance");
    db = getFirestore(app);
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
    prompt: 'select_account'
});

// Initialize Firebase Functions
const functions = getFunctions(app);

// Firebase Cloud Messaging (FCM) - initialized lazily on client side only
let messaging: Messaging | null = null;

// Initialize FCM only in browser environment
const initializeMessaging = async (): Promise<Messaging | null> => {
    if (typeof window === 'undefined') return null;

    try {
        const supported = await isSupported();
        if (!supported) {
            console.log("📵 FCM not supported in this browser");
            return null;
        }

        if (!messaging) {
            messaging = getMessaging(app);
            console.log("📱 FCM initialized");
        }
        return messaging;
    } catch (error) {
        console.error("Error initializing FCM:", error);
        return null;
    }
};

// Request notification permission and get FCM token
const requestNotificationPermission = async (): Promise<string | null> => {
    if (typeof window === 'undefined') {
        console.log("🚫 FCM: window is undefined (SSR)");
        return null;
    }

    // Check if Notification API is available
    if (!("Notification" in window)) {
        console.log("🚫 FCM: Notification API not available in this browser");
        return null;
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
        console.log("🚫 FCM: Service Workers not supported in this browser");
        return null;
    }

    console.log("🔔 FCM: Current notification permission:", Notification.permission);

    try {
        // Request permission
        console.log("🔔 FCM: Requesting notification permission...");
        const permission = await Notification.requestPermission();
        console.log("🔔 FCM: Permission result:", permission);

        if (permission !== 'granted') {
            console.log("🔕 Notification permission denied or dismissed");
            return null;
        }

        const fcmMessaging = await initializeMessaging();
        if (!fcmMessaging) {
            console.log("🚫 FCM: Failed to initialize messaging");
            return null;
        }

        // Register service worker
        console.log("📝 FCM: Registering service worker...");
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("📝 Service Worker registered:", registration.scope);

        // Check VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        console.log("🔑 FCM: VAPID key present:", !!vapidKey, vapidKey ? `(${vapidKey.substring(0, 20)}...)` : "");

        if (!vapidKey) {
            console.error("🚫 FCM: VAPID key is missing!");
            return null;
        }

        // Get FCM token with VAPID key
        console.log("🔑 FCM: Getting token...");
        const token = await getToken(fcmMessaging, {
            vapidKey,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log("🔑 FCM Token obtained:", token.substring(0, 20) + "...");
        } else {
            console.log("🚫 FCM: getToken returned null/undefined");
        }
        return token;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        return null;
    }
};

// Listen for foreground messages
const onForegroundMessage = (callback: (payload: any) => void) => {
    if (typeof window === 'undefined') return () => {};

    initializeMessaging().then((fcmMessaging) => {
        if (fcmMessaging) {
            onMessage(fcmMessaging, (payload) => {
                console.log("📬 Foreground message received:", payload);
                callback(payload);
            });
        }
    });

    return () => {}; // Return cleanup function
};

export {
    app,
    functions,
    httpsCallable,
    auth,
    db,
    provider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    getCountFromServer,
    updateDoc,
    setDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    requestNotificationPermission,
    onForegroundMessage
};
export type { User, DocumentSnapshot };
