/**
 * Header Component
 * Generates a reusable top navigation header dynamically.
 */
class HeaderComponent {
    /**
     * @param {Object} config - Configuration object
     * @param {String} config.targetId - ID of the element to append the header to (defaults to document.body)
     * @param {String} config.avatarUrl - URL for the user profile image
     */
    constructor(config = {}) {
        this.targetElement = config.targetId ? document.getElementById(config.targetId) : document.body;
        this.avatarUrl = config.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=F59E0B&color=0A0A0A';
        this.render();
    }

    // Build and attach DOM elements
    render() {
        // Create header container
        this.header = document.createElement('header');
        this.header.className = 'comp-header';

        // Create Brand (Logo + Title)
        const brand = document.createElement('div');
        brand.className = 'comp-header-brand';
        brand.innerHTML = `
            <i class="fa-solid fa-microchip"></i>
            <div>PCB <span>HUB</span></div>
        `;

        // Create Actions Container
        const actions = document.createElement('div');
        actions.className = 'comp-header-actions';

        // Search Icon
        const searchBtn = document.createElement('button');
        searchBtn.className = 'comp-icon-btn';
        searchBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>`;
        searchBtn.addEventListener('click', () => this.onSearchClick());

        // Notification Icon
        const notifyBtn = document.createElement('button');
        notifyBtn.className = 'comp-icon-btn';
        notifyBtn.innerHTML = `<i class="fa-solid fa-bell"></i>`;
        notifyBtn.addEventListener('click', () => this.onNotifyClick());

        // User Avatar
        const avatar = document.createElement('img');
        avatar.className = 'comp-user-avatar';
        avatar.src = this.avatarUrl;
        avatar.alt = 'User Profile';
        avatar.addEventListener('click', () => this.onProfileClick());

        // Append elements
        actions.appendChild(searchBtn);
        actions.appendChild(notifyBtn);
        actions.appendChild(avatar);

        this.header.appendChild(brand);
        this.header.appendChild(actions);

        // Prepend to target (so it stays at top of document)
        this.targetElement.prepend(this.header);
    }

    // Event Handlers (Can be overridden by instances)
    onSearchClick() {
        console.log('Header: Search clicked');
    }

    onNotifyClick() {
        console.log('Header: Notifications clicked');
    }

    onProfileClick() {
        console.log('Header: Profile clicked');
    }
}
