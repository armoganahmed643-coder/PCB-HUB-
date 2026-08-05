/**
 * Modal Popup System
 * Promise-based custom dialog box (replaces window.confirm/alert).
 */
class ModalSystem {
    constructor() {
        this.buildOverlay();
    }

    buildOverlay() {
        if (document.getElementById('comp-modal-overlay')) {
            this.overlay = document.getElementById('comp-modal-overlay');
            return;
        }

        this.overlay = document.createElement('div');
        this.overlay.id = 'comp-modal-overlay';
        this.overlay.className = 'comp-modal-overlay';
        document.body.appendChild(this.overlay);
    }

    /**
     * Triggers a modal popup
     * @param {Object} options
     * @param {String} options.title - Modal Title
     * @param {String} options.message - Modal Message
     * @param {String} options.confirmText - Confirm Button Text
     * @param {String} options.cancelText - Cancel Button Text (If omitted, acts as alert)
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    show({ title = 'Alert', message = '', confirmText = 'Confirm', cancelText = 'Cancel' }) {
        return new Promise((resolve) => {
            // Clear previous modal content
            this.overlay.innerHTML = '';

            // Construct Card
            const card = document.createElement('div');
            card.className = 'comp-modal-card';

            // Construct Content
            card.innerHTML = `
                <h3 class="comp-modal-title">${title}</h3>
                <p class="comp-modal-message">${message}</p>
                <div class="comp-modal-actions" id="comp-modal-actions"></div>
            `;

            this.overlay.appendChild(card);
            const actionsContainer = card.querySelector('#comp-modal-actions');

            // Handle Cancel Button Logic (Skip if strictly an alert mode)
            if (cancelText) {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'comp-modal-btn comp-modal-cancel';
                cancelBtn.innerText = cancelText;
                cancelBtn.onclick = () => {
                    this.close();
                    resolve(false);
                };
                actionsContainer.appendChild(cancelBtn);
            }

            // Handle Confirm Button Logic
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'comp-modal-btn comp-modal-confirm';
            confirmBtn.innerText = confirmText;
            confirmBtn.onclick = () => {
                this.close();
                resolve(true);
            };
            actionsContainer.appendChild(confirmBtn);

            // Animate In
            requestAnimationFrame(() => {
                this.overlay.classList.add('active');
            });
        });
    }

    close() {
        this.overlay.classList.remove('active');
        // Wait for animation to finish before clearing DOM
        setTimeout(() => {
            if (!this.overlay.classList.contains('active')) {
                this.overlay.innerHTML = '';
            }
        }, 300);
    }
}

// Initialize singleton
const Modal = new ModalSystem();
