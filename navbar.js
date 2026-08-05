/**
 * Bottom Navigation Component
 * Mobile-first bottom bar with active state tracking and FAB.
 */
class BottomNavComponent {
    /**
     * @param {Object} config 
     * @param {String} config.targetId - ID to append to (defaults to body)
     * @param {String} config.activeItem - Default active item ('home', 'search', 'ai', 'profile')
     */
    constructor(config = {}) {
        this.targetElement = config.targetId ? document.getElementById(config.targetId) : document.body;
        this.activeItem = config.activeItem || 'home';
        
        // Define Nav Items Map
        this.navItems = [
            { id: 'home', icon: 'fa-house', label: 'Home', action: () => this.setActive('home') },
            { id: 'search', icon: 'fa-magnifying-glass', label: 'Search', action: () => this.setActive('search') },
            { id: 'add', isFab: true, icon: 'fa-plus', action: () => console.log('Add PCB Triggered') }, // Central FAB
            { id: 'ai', icon: 'fa-robot', label: 'AI', action: () => this.setActive('ai') },
            { id: 'profile', icon: 'fa-user', label: 'Profile', action: () => this.setActive('profile') }
        ];

        this.nodes = {}; // Store DOM nodes for updates
        this.render();
    }

    render() {
        this.navContainer = document.createElement('nav');
        this.navContainer.className = 'comp-bottom-nav';

        this.navItems.forEach(item => {
            const anchor = document.createElement('a');
            
            if (item.isFab) {
                // Formatting for Center Floating Action Button
                anchor.className = 'comp-nav-item comp-nav-fab';
                anchor.innerHTML = `<div class="fab-inner"><i class="fa-solid ${item.icon}"></i></div>`;
            } else {
                // Formatting for Standard Nav Items
                anchor.className = `comp-nav-item ${this.activeItem === item.id ? 'active' : ''}`;
                anchor.innerHTML = `
                    <i class="fa-solid ${item.icon}"></i>
                    <span>${item.label}</span>
                `;
                this.nodes[item.id] = anchor; // Save reference to update active state
            }

            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                item.action();
            });

            this.navContainer.appendChild(anchor);
        });

        this.targetElement.appendChild(this.navContainer);
    }

    /**
     * Updates UI active state programmatically
     */
    setActive(id) {
        if (!this.nodes[id]) return;
        
        // Remove active class from all
        Object.values(this.nodes).forEach(node => node.classList.remove('active'));
        
        // Add active class to target
        this.nodes[id].classList.add('active');
        this.activeItem = id;
        
        console.log(`Navigated to: ${id}`);
    }
}
