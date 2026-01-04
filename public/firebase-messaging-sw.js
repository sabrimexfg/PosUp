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
messaging.onBackgroundMessage(async (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    // Check if there's a visible client (page is open and focused)
    // If so, let the foreground handler deal with the notification
    const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    });

    const hasVisibleClient = windowClients.some(client => client.visibilityState === 'visible');

    if (hasVisibleClient) {
        console.log('[firebase-messaging-sw.js] Page is visible, skipping background notification');
        return;
    }

    // Read from payload.data since we're using data-only messages
    // (no "notification" key from backend to prevent FCM auto-display)
    const notificationTitle = payload.data?.title || payload.notification?.title || 'PosUp Notification';
    const notificationOptions = {
        body: payload.data?.body || payload.notification?.body || 'You have a new notification',
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

    // Add action parameter based on notification type
    if (data?.type === 'order_awaiting_approval') {
        url += '?action=approve';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open with the catalog
            for (const client of windowClients) {
                // If catalog page is already open, navigate to the action URL
                if (client.url.includes('/catalog/') && 'focus' in client) {
                    client.navigate(url);
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
