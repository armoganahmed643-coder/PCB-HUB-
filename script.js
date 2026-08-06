/**
 * PCB HUB - Phase 1 Architecture Script
 * Architecture: Modular, Event-Driven, UI/UX Focused
 * Authentication is wired to Firebase Auth (see firebase-config.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * Initializes the application routing and event listeners
 */
function initApp() {
    // 1. Splash Screen Logic
    // NOTE: On GitHub Pages a project site is served from a subpath like
    // "/PCB-HUB-/" (not just "/"), and visiting the folder loads index.html
    // WITHOUT the filename appearing in the URL. Checking for a trailing
    // '/' as well as pathname === '/' and 'index.html' covers root sites,
    // project sites, and local files.
    if (
        window.location.pathname.endsWith('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('/')
    ) {
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2500); // 2.5s Splash Delay
    }

    // 2. Form Event Listeners (Real Firebase Authentication)
    attachFormListeners();

    // 3. Protect private pages (dashboard, search) from unauthenticated access
    guardPrivatePages();

    // 4. Wire up logout button (present only on dashboard.html)
    attachLogoutListener();
}

/**
 * Redirects to login.html if no user is signed in.
 * Also personalizes the dashboard welcome message + avatar once we know
 * who is signed in.
 *
 * NOTE: This is a client-side convenience redirect, not a security
 * boundary. Real protection of the PCB data itself comes from the
 * Firestore Security Rules (only signed-in users can read the "pcbs"
 * collection) — see the setup notes shared with this code.
 */
function guardPrivatePages() {
    // Pages that require a signed-in user
    const privatePages = ['dashboard.html', 'search.html'];
    const page = window.location.pathname.split('/').pop();

    if (!privatePages.includes(page)) return;

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Personalize the dashboard header if present on this page
        const welcomeMsg = document.getElementById('welcomeMsg');
        if (welcomeMsg) {
            const name = user.displayName || user.email.split('@')[0];
            welcomeMsg.textContent = `Welcome back, ${name}.`;
        }

        const avatarImg = document.getElementById('userAvatarImg');
        if (avatarImg) {
            const name = encodeURIComponent(user.displayName || user.email);
            avatarImg.src = `https://ui-avatars.com/api/?name=${name}&background=F59E0B&color=0A0A0A`;
        }
    });
}

/**
 * Wires the logout button (id="logoutBtn") to sign the user out.
 */
function attachLogoutListener() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    });
}

/**
 * Attaches submit events to auth forms and wires them to Firebase Auth
 */
function attachFormListeners() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            showLoader();
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    hideLoader();
                    showToast('Authentication Successful. Redirecting...', 'success');
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                })
                .catch((error) => {
                    hideLoader();
                    showToast(friendlyAuthError(error), 'error');
                });
        });
    }

    // Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pwd = document.getElementById('reg-password').value;
            const confirm = document.getElementById('confirm-password').value;

            if (pwd !== confirm) {
                showToast('Passwords do not match. Integrity failure.', 'error');
                return;
            }

            showLoader();
            auth.createUserWithEmailAndPassword(email, pwd)
                .then((credential) => {
                    // Save the display name on the auth profile
                    return credential.user.updateProfile({ displayName: fullname })
                        .then(() => {
                            // Also store a user record in Firestore (handy for admin lookup)
                            return db.collection('users').doc(credential.user.uid).set({
                                fullname: fullname,
                                email: email,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        });
                })
                .then(() => auth.signOut())
                .then(() => {
                    hideLoader();
                    showToast('Profile Initialized. Proceed to login.', 'success');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                })
                .catch((error) => {
                    hideLoader();
                    showToast(friendlyAuthError(error), 'error');
                });
        });
    }

    // Forgot Password Form
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('reset-email').value.trim();

            showLoader();
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    hideLoader();
                    showToast('Override link sent to secure channel.', 'info');
                    setTimeout(() => window.location.href = 'login.html', 2000);
                })
                .catch((error) => {
                    hideLoader();
                    showToast(friendlyAuthError(error), 'error');
                });
        });
    }
}

/**
 * Converts Firebase Auth error codes into readable toast messages
 * @param {Object} error - Firebase error object (has .code and .message)
 */
function friendlyAuthError(error) {
    const map = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account already exists with this email.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    return map[error.code] || error.message || 'Something went wrong. Please try again.';
}

/**
 * Utility to toggle the global CSS loader
 */
function showLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('hidden');
}

/**
 * Triggers a dashboard module (Used in onclick attributes in HTML)
 * @param {String} moduleName - Name of the clicked module
 */
function triggerModule(moduleName) {
    // Prevent default anchor behavior
    event.preventDefault();

    // Simulate loading the module
    showLoader();
    setTimeout(() => {
        hideLoader();
        showToast(`${moduleName} module accessed. (Phase 2 Component)`, 'info');
    }, 600);
}

/**
 * Generates and displays a Toast Notification dynamically
 * @param {String} message - Text to display
 * @param {String} type - 'success', 'error', or 'info'
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Select icon based on type
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';

    // Construct Inner HTML
    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <span>${message}</span>
    `;

    // Append and animate in
    container.appendChild(toast);

    // Trigger reflow to ensure CSS animation applies
    void toast.offsetWidth;
    toast.classList.add('show');

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for CSS exit transition before DOM removal
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 400);
    }, 3000);
}
