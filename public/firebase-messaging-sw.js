// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications
//
// NOTE: Firebase config values below are PUBLIC configuration keys (not secrets).
// They identify the Firebase project but do not grant access - security is
// enforced by Firestore Security Rules and Firebase Authentication.
// This is Firebase's recommended pattern for web apps.
// See: https://firebase.google.com/docs/projects/api-keys

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values MUST be hardcoded because Service Workers cannot access environment variables
firebase.initializeApp({
    apiKey: "AIzaSyBgXGdLmx8pOHMfCNGKQ46oXzMXVbPKy0s",
    authDomain: "posup-ba5be.firebaseapp.com",
    projectId: "posup-ba5be",
    storageBucket: "posup-ba5be.firebasestorage.app",
    messagingSenderId: "659640233256",
    appId: "1:659640233256:web:6ee1ab489b509b9bc2341d",
    measurementId: "G-6FRTDTPZWP"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'PosUp Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/images/icon-192.png',
        badge: '/images/icon-192.png',
        tag: payload.data?.orderId || 'posup-notification',
        requireInteraction: true,
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    const data = event.notification.data;
    let url = '/';

    // Navigate to the appropriate page based on notification data
    // Prefer slug for cleaner URLs, fall back to merchantUserId
    if (data?.businessSlug) {
        url = `/catalog/${data.businessSlug}`;
    } else if (data?.merchantUserId) {
        url = `/catalog/${data.merchantUserId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open
            for (const client of windowClients) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open a new window if none exists
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
