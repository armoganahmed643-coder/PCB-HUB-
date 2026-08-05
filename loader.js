/**
 * Global Loader System
 * Handles full-screen blocking operations visually.
 */
class GlobalLoader {
    constructor() {
        this.buildLoader();
    }

    buildLoader() {
        // Prevent duplicates
        if (document.getElementById('comp-global-loader')) {
            this.overlay = document.getElementById('comp-global-loader');
            return;
        }

        // Build DOM
        this.overlay = document.createElement('div');
        this.overlay.id = 'comp-global-loader';
        this.overlay.className = 'comp-loader-overlay';
        
        this.overlay.innerHTML = `
            <div class="comp-spinner"></div>
        `;

        document.body.appendChild(this.overlay);
    }

    /**
     * Show the loader
     * @param {String} text - Optional text below spinner
     */
    show() {
        this.overlay.classList.add('active');
    }

    /**
     * Hide the loader
     */
    hide() {
        this.overlay.classList.remove('active');
    }

    /**
     * Wraps an async function with the loader automatically
     * @param {Function} asyncCallback - Promise returning function
     */
    async wrap(asyncCallback) {
        this.show();
        try {
            await asyncCallback();
        } finally {
            this.hide();
        }
    }
}

// Initialize singleton
const Loader = new GlobalLoader();
