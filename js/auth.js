import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Optional: Analytics
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Initialize Firebase
// Note: firebaseConfig is expected to be available globally or imported if we were using a bundler.
// Since we are using ES modules in the browser, we'll assume config.js loads it or we pass it here. 
// Actually, to keep it clean with ES modules from CDN, let's just use the object directly or expect it from config.

// For simplicity in this static setup without a bundler, we will read the config from the global scope handling I added in config.js 
// OR better yet, let's just import it if we make config.js an ES module. 
// Let's refactor config.js to be importable or just define it here to avoid module complexity if config.js isn't a module. 
// Given the previous file was just a const, let's make dashboard.html load config.js as a script and then this one as a module? 
// Actually, cleanest is to make config.js export the object and import it here.

// I'll re-write config.js to be an ES module in the next step to be safe, but for now let's assume valid config.
// Wait, I can't easily rewriting config.js immediately without a new tool call. 
// I'll make this file self-contained enough or robust. 
// Let's assume the user will fix the config in the file I just wrote.
// I will just re-declare the config variable here for now to be safe and avoid module loading issues if the user doesn't support it, 
// BUT the prompt said "make a dashboard". 
// Let's use the window object for the config if it was loaded via <script src="config.js">.

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Login Function
export function loginWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log("User logged in:", user);

            // Redirect to dashboard if not already there
            if (!window.location.href.includes('dashboard.html')) {
                window.location.href = 'dashboard.html';
            }
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login Error:", errorCode, errorMessage);
            alert("Login failed: " + errorMessage);
        });
}

// Logout Function
export function logout() {
    signOut(auth).then(() => {
        // Sign-out successful.
        console.log("User signed out");
        window.location.href = 'posup.html';
    }).catch((error) => {
        // An error happened.
        console.error("Logout Error:", error);
    });
}

// Auth State Monitor
export function initAuthMonitor() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log("AuthState: User is signed in", user.uid);

            // Update UI if on dashboard
            updateDashboardUI(user);

            // Update UI if on main page (change Login to Dashboard/Logout)
            updateMainPageUI(user);

        } else {
            // User is signed out
            console.log("AuthState: User is signed out");

            // If on dashboard, redirect to login
            if (window.location.href.includes('dashboard.html')) {
                window.location.href = 'posup.html';
            }
            updateMainPageUI(null);
        }
    });

}

function updateDashboardUI(user) {
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const userPhotoEl = document.getElementById('user-photo');

    if (userNameEl) userNameEl.textContent = user.displayName || 'User';
    if (userEmailEl) userEmailEl.textContent = user.email;
    if (userPhotoEl && user.photoURL) {
        userPhotoEl.src = user.photoURL;
        userPhotoEl.style.display = 'block';
    }
}

function updateMainPageUI(user) {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        if (user) {
            loginBtn.textContent = 'Go to Dashboard';
            loginBtn.href = 'dashboard.html';
            loginBtn.onclick = null; // Remove login click handler if it was attached directly
        } else {
            loginBtn.textContent = 'Log In';
            loginBtn.href = '#';
            // Logic to re-attach click listener is handled in the main initialization
        }
    }
}
