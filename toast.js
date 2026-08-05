/**
 * Toast Notification System
 * Singleton pattern ensuring only one container exists.
 */
class ToastSystem {
    constructor() {
        if (!ToastSystem.instance) {
            this.initContainer();
            ToastSystem.instance = this;
        }
        return ToastSystem.instance;
    }

    // Initialize the fixed container for toasts
    initContainer() {
        this.container = document.getElementById('comp-toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'comp-toast-container';
            this.container.className = 'comp-toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Core trigger method
     * @param {String} message - Text to display
     * @param {String} type - 'success', 'error', 'warning', 'info'
     * @param {Number} duration - MS to show toast
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `comp-toast ${type}`;

        // Map icons based on type
        const iconMap = {
            'success': 'fa-circle-check',
            'error': 'fa-circle-xmark',
            'warning': 'fa-triangle-exclamation',
            'info': 'fa-circle-info'
        };
        const iconClass = iconMap[type] || iconMap['info'];

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} comp-toast-icon"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Force reflow for CSS animation
        void toast.offsetWidth;
        toast.classList.add('show');

        // Cleanup after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (this.container.contains(toast)) {
                    this.container.removeChild(toast);
                }
            }, 400); // Matches CSS transition duration
        }, duration);
    }

    // Convenience Methods
    success(msg, duration) { this.show(msg, 'success', duration); }
    error(msg, duration) { this.show(msg, 'error', duration); }
    warning(msg, duration) { this.show(msg, 'warning', duration); }
    info(msg, duration) { this.show(msg, 'info', duration); }
}

// Export singleton instance for easy usage
const Toast = new ToastSystem();
