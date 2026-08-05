/**
 * PCB HUB - Phase 1 Architecture Script
 * Architecture: Modular, Event-Driven, UI/UX Focused
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
    // WITHOUT the filename appearing in the URL. The old check only matched
    // pathname === '/' or pathname ending in 'index.html', so on GitHub
    // Pages it never matched -> redirect never fired -> page stuck forever
    // on "System Initializing...". Checking for a trailing '/' as well
    // fixes this for root sites, project sites, and local files.
    if (
        window.location.pathname.endsWith('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('/')
    ) {
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2500); // 2.5s Splash Delay
    }

    // 2. Form Event Listeners (Authentication Mocking)
    attachFormListeners();
}

/**
 * Attaches submit events to auth forms to simulate processing
 */
function attachFormListeners() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            simulateNetworkRequest(() => {
                showToast('Authentication Successful. Redirecting...', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            });
        });
    }

    // Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Basic Client-Side Validation
            const pwd = document.getElementById('reg-password').value;
            const confirm = document.getElementById('confirm-password').value;
            
            if (pwd !== confirm) {
                showToast('Passwords do not match. Integrity failure.', 'error');
                return;
            }

            simulateNetworkRequest(() => {
                showToast('Profile Initialized. Proceed to login.', 'success');
                setTimeout(() => window.location.href = 'login.html', 1500);
            });
        });
    }

    // Forgot Password Form
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            simulateNetworkRequest(() => {
                showToast('Override link sent to secure channel.', 'info');
                setTimeout(() => window.location.href = 'login.html', 2000);
            });
        });
    }
}

/**
 * Simulates a backend network request with the global loader
 * @param {Function} callback - Code to run after simulated delay
 */
function simulateNetworkRequest(callback) {
    showLoader();
    setTimeout(() => {
        hideLoader();
        if (callback) callback();
    }, 1200); // 1.2s Artificial Delay
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
