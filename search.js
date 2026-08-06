/**
 * PCB HUB - Search Logic
 * Vanilla JavaScript implementation for Live Search, backed by Firestore.
 */

// ==========================================================================
// PCB DATABASE (loaded from the Firestore "pcbs" collection)
// ==========================================================================
let pcbDatabase = [];
let dbLoaded = false;

function loadPcbDatabase() {
    return db.collection('pcbs').get().then((snapshot) => {
        pcbDatabase = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                brand: data.brand || '',
                model: data.model || '',
                category: data.category || '',
                mcu: data.mcu || '',
                eeprom: data.eeprom || '',
                binAvailable: !!data.binAvailable,
                image: data.image || null
            };
        });
        dbLoaded = true;
    }).catch((error) => {
        console.error('Failed to load PCB database:', error);
        dbLoaded = true; // stop waiting; errorState will show on next search
    });
}

// ==========================================================================
// STATE MANAGEMENT & DOM ELEMENTS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // Kick off the Firestore fetch immediately
    loadPcbDatabase();

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const categoryFilters = document.getElementById('categoryFilters');
    const qrScannerBtn = document.getElementById('qrScannerBtn');
    const voiceSearchBtn = document.getElementById('voiceSearchBtn');
    
    // State Containers
    const defaultState = document.getElementById('defaultState');
    const loadingState = document.getElementById('loadingState');
    const resultsState = document.getElementById('resultsState');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    
    // Results Elements
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    
    // Local State
    let currentCategory = 'All';
    let currentQuery = '';
    let recentSearches = JSON.parse(localStorage.getItem('pcb_recent_searches')) || ['LG AC', 'Whirlpool'];

    // Initialize View
    renderRecentSearches();

    // ==========================================================================
    // EVENT LISTENERS
    // ==========================================================================
    
    // Live Search with Debounce
    searchInput.addEventListener('input', debounce((e) => {
        currentQuery = e.target.value.trim();
        toggleClearButton();
        executeSearch();
    }, 400)); // 400ms delay

    // Clear Button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentQuery = '';
        toggleClearButton();
        executeSearch();
        searchInput.focus();
    });

    // Category Filter Pills
    categoryFilters.addEventListener('click', (e) => {
        if(e.target.classList.contains('pill')) {
            // Update Active Class
            categoryFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update State & Search
            currentCategory = e.target.getAttribute('data-filter');
            executeSearch();
        }
    });

    // Hardware Tool Placeholders
    qrScannerBtn.addEventListener('click', () => alert('QR Scanner module initializing... (Requires Camera API Phase 2)'));
    voiceSearchBtn.addEventListener('click', () => alert('Voice Recognition initializing... (Requires Web Speech API Phase 2)'));

    // Clear History
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        recentSearches = [];
        localStorage.removeItem('pcb_recent_searches');
        renderRecentSearches();
    });

    // ==========================================================================
    // LOGIC FUNCTIONS
    // ==========================================================================
    
    function toggleClearButton() {
        if(currentQuery.length > 0) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
    }

    function executeSearch() {
        // If empty query and 'All' category, show default state
        if (currentQuery === '' && currentCategory === 'All') {
            showState(defaultState);
            return;
        }

        // Show Loader
        showState(loadingState);

        // Wait for the Firestore fetch to finish (usually instant after
        // the first search, since the data is cached in pcbDatabase)
        const waitForDb = dbLoaded ? Promise.resolve() : new Promise((resolve) => {
            const check = setInterval(() => {
                if (dbLoaded) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });

        waitForDb.then(() => {
            setTimeout(() => {
                try {
                    // Filter Logic
                    const results = pcbDatabase.filter(pcb => {
                        // Match Category
                        const matchCategory = currentCategory === 'All' || pcb.category === currentCategory;

                        // Match Text (ID, Brand, or Model)
                        const queryLower = currentQuery.toLowerCase();
                        const matchText = pcb.id.toLowerCase().includes(queryLower) ||
                                          pcb.brand.toLowerCase().includes(queryLower) ||
                                          pcb.model.toLowerCase().includes(queryLower);

                        return matchCategory && matchText;
                    });

                    // Update UI based on results
                    if (results.length > 0) {
                        renderResults(results);
                        showState(resultsState);
                        saveRecentSearch(currentQuery);
                    } else {
                        showState(emptyState);
                    }
                } catch (error) {
                    console.error("Search failed:", error);
                    showState(errorState);
                }
            }, 300); // Small delay to keep the loading state feeling smooth
        });
    }

    // ==========================================================================
    // RENDER FUNCTIONS
    // ==========================================================================
    
    function renderResults(data) {
        resultsCount.innerText = `Found ${data.length} result${data.length > 1 ? 's' : ''}`;
        resultsGrid.innerHTML = '';

        data.forEach(pcb => {
            const card = document.createElement('div');
            card.className = 'pcb-card glass-card';
            card.style.padding = '0'; // Override generic glass-card padding for image spanning
            
            // Handle Image Fallback
            const imageHtml = pcb.image 
                ? `<img src="${pcb.image}" alt="${pcb.model}">` 
                : `<i class="fa-solid fa-microchip placeholder-icon"></i>`;

            // Handle BIN Badge Status
            const binBadge = pcb.binAvailable
                ? `<div class="bin-badge available"><i class="fa-solid fa-check"></i> BIN Verified</div>`
                : `<div class="bin-badge unavailable"><i class="fa-solid fa-xmark"></i> No BIN</div>`;

            card.innerHTML = `
                <div class="card-image-wrapper">
                    ${imageHtml}
                    ${binBadge}
                </div>
                <div class="card-content">
                    <div class="pcb-title">
                        <span>${pcb.id}</span>
                    </div>
                    <div class="pcb-subtitle">${pcb.brand} - ${pcb.model}</div>
                    
                    <div class="pcb-specs">
                        <div class="spec-item">
                            <span class="spec-label">Device Type</span>
                            <span class="spec-value">${pcb.category}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">MCU Processor</span>
                            <span class="spec-value">${pcb.mcu}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">EEPROM / Flash</span>
                            <span class="spec-value">${pcb.eeprom}</span>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button class="btn btn-outline btn-sm" onclick="alert('Viewing specs for ${pcb.id}')">
                            <i class="fa-solid fa-eye"></i> Details
                        </button>
                        <button class="btn btn-primary btn-sm" ${!pcb.binAvailable ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="alert('Downloading BIN for ${pcb.id}')">
                            <i class="fa-solid fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    }

    function renderRecentSearches() {
        const list = document.getElementById('recentSearchesList');
        list.innerHTML = '';
        
        if(recentSearches.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No recent searches.</p>';
            return;
        }

        recentSearches.forEach(term => {
            const item = document.createElement('div');
            item.className = 'recent-search-item';
            item.innerHTML = `
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>${term}</span>
            `;
            item.onclick = () => triggerSearch(term);
            list.appendChild(item);
        });
    }

    function showState(stateElement) {
        // Hide all states
        [defaultState, loadingState, resultsState, emptyState, errorState].forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        
        // Show target state
        stateElement.classList.remove('hidden');
        stateElement.classList.add('active');
    }

    function saveRecentSearch(term) {
        if(!term || term.length < 2) return;
        
        // Remove duplicate if exists, add to front
        recentSearches = recentSearches.filter(t => t.toLowerCase() !== term.toLowerCase());
        recentSearches.unshift(term);
        
        // Keep max 5 items
        if(recentSearches.length > 5) recentSearches.pop();
        
        localStorage.setItem('pcb_recent_searches', JSON.stringify(recentSearches));
        renderRecentSearches();
    }
});

// ==========================================================================
// GLOBAL UTILITIES (Callable from HTML inline events)
// ==========================================================================

// Global wrapper to trigger search from suggest clicks
window.triggerSearch = function(term) {
    const input = document.getElementById('searchInput');
    input.value = term;
    input.dispatchEvent(new Event('input')); // trigger the event listener
};

// Debounce Utility for performance
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
