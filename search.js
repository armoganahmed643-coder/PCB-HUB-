/**
 * PCB HUB - Search Module
 * Vanilla JavaScript implementation for Live Search, backed by Firestore.
 * Modular, event-driven, no framework dependencies.
 */

// ==========================================================================
// STATE MANAGEMENT & DOM ELEMENTS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ---- Data State -------------------------------------------------
    let pcbDatabase = [];       // Loaded from Firestore "pcbs" collection
    let dbLoaded = false;       // True once the initial fetch settles
    let dbLoadError = false;    // True if the fetch itself failed
    let isDatabaseEmpty = false; // True if the collection has zero documents

    // ---- Search / Filter State ---------------------------------------
    let currentCategory = 'All';
    let currentQuery = '';
    let recentSearches = JSON.parse(localStorage.getItem('pcb_recent_searches')) || ['LG AC', 'Whirlpool'];
    let advancedFilters = {
        pcbNumber: '',
        brand: '',
        model: '',
        mcu: '',
        eeprom: '',
        binAvailable: '' // '' | 'yes' | 'no'
    };

    // ---- DOM Elements: Search Bar -------------------------------------
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const categoryFilters = document.getElementById('categoryFilters');
    const qrScannerBtn = document.getElementById('qrScannerBtn');
    const voiceSearchBtn = document.getElementById('voiceSearchBtn');

    // ---- DOM Elements: Advanced Filter Panel --------------------------
    const filterBtn = document.getElementById('filterBtn');
    const filterBadge = document.getElementById('filterBadge');
    const filterOverlay = document.getElementById('filterOverlay');
    const filterPanel = document.getElementById('filterPanel');
    const filterCloseBtn = document.getElementById('filterCloseBtn');
    const filterApplyBtn = document.getElementById('filterApplyBtn');
    const filterResetBtn = document.getElementById('filterResetBtn');
    const filterPcbNumberInput = document.getElementById('filterPcbNumber');
    const filterBrandInput = document.getElementById('filterBrand');
    const filterModelInput = document.getElementById('filterModel');
    const filterDeviceTypeSelect = document.getElementById('filterDeviceType');
    const filterMcuInput = document.getElementById('filterMcu');
    const filterEepromInput = document.getElementById('filterEeprom');
    const filterBinSelect = document.getElementById('filterBin');

    // ---- DOM Elements: State Containers -------------------------------
    const defaultState = document.getElementById('defaultState');
    const loadingState = document.getElementById('loadingState');
    const resultsState = document.getElementById('resultsState');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const noDatabaseState = document.getElementById('noDatabaseState');

    // ---- DOM Elements: Results -----------------------------------------
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');

    // Initialize View
    renderRecentSearches();
    loadPcbDatabase();

    // ==========================================================================
    // FIRESTORE DATA LOADING
    // ==========================================================================
    function loadPcbDatabase() {
        return db.collection('pcbs').get().then((snapshot) => {
            isDatabaseEmpty = snapshot.empty;

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
                    firmwareVersion: data.firmwareVersion || 'N/A',
                    lastUpdated: data.lastUpdated || null, // Firestore Timestamp or null
                    image: data.image || null
                };
            });

            dbLoaded = true;
            dbLoadError = false;

            // If the database is empty and the user hasn't searched for
            // anything yet, replace the default "recent searches" view
            // with a clear "database is empty" message.
            if (isDatabaseEmpty && currentQuery === '' && currentCategory === 'All' && !hasActiveAdvancedFilters()) {
                showState(noDatabaseState);
            }
        }).catch((error) => {
            console.error('Failed to load PCB database:', error);
            dbLoadError = true;
            dbLoaded = true;
        });
    }

    // ==========================================================================
    // EVENT LISTENERS: SEARCH BAR
    // ==========================================================================

    // Live Search with Debounce
    searchInput.addEventListener('input', debounce((e) => {
        currentQuery = e.target.value.trim();
        toggleClearButton();
        executeSearch();
    }, 400)); // 400ms delay

    // Explicit Search Button (bypasses debounce for an instant search)
    searchBtn.addEventListener('click', () => {
        currentQuery = searchInput.value.trim();
        toggleClearButton();
        executeSearch();
    });

    // Also allow pressing Enter to search instantly
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            currentQuery = searchInput.value.trim();
            toggleClearButton();
            executeSearch();
        }
    });

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
        if (e.target.classList.contains('pill')) {
            // Update Active Class
            categoryFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');

            // Update State & Search
            currentCategory = e.target.getAttribute('data-filter');

            // Keep the Advanced Filter panel's Device Type field in sync
            filterDeviceTypeSelect.value = currentCategory === 'All' ? '' : currentCategory;

            executeSearch();
        }
    });

    // Hardware Tool Placeholders (Phase 2) — now use toast, not alert()
    qrScannerBtn.addEventListener('click', () => {
        showToast('QR Scanner module initializing... (Requires Camera API Phase 2)', 'info');
    });
    voiceSearchBtn.addEventListener('click', () => {
        showToast('Voice Recognition initializing... (Requires Web Speech API Phase 2)', 'info');
    });

    // Clear History
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        recentSearches = [];
        localStorage.removeItem('pcb_recent_searches');
        renderRecentSearches();
    });

    // ==========================================================================
    // EVENT LISTENERS: ADVANCED FILTER PANEL
    // ==========================================================================
    filterBtn.addEventListener('click', openFilterPanel);
    filterCloseBtn.addEventListener('click', closeFilterPanel);
    filterOverlay.addEventListener('click', closeFilterPanel);

    filterApplyBtn.addEventListener('click', () => {
        advancedFilters.pcbNumber = filterPcbNumberInput.value.trim();
        advancedFilters.brand = filterBrandInput.value.trim();
        advancedFilters.model = filterModelInput.value.trim();
        advancedFilters.mcu = filterMcuInput.value.trim();
        advancedFilters.eeprom = filterEepromInput.value.trim();
        advancedFilters.binAvailable = filterBinSelect.value;

        // Sync Device Type filter into the category pills
        const deviceType = filterDeviceTypeSelect.value;
        currentCategory = deviceType || 'All';
        categoryFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        const matchingPill = categoryFilters.querySelector(`[data-filter="${currentCategory}"]`);
        if (matchingPill) matchingPill.classList.add('active');

        updateFilterBadge();
        closeFilterPanel();
        executeSearch();
        showToast('Filters applied', 'success');
    });

    filterResetBtn.addEventListener('click', () => {
        resetAdvancedFilters();
        closeFilterPanel();
        executeSearch();
        showToast('Filters reset', 'info');
    });

    // ==========================================================================
    // LOGIC FUNCTIONS: FILTER PANEL
    // ==========================================================================
    function openFilterPanel() {
        // Pre-fill fields from current state so re-opening shows what's active
        filterPcbNumberInput.value = advancedFilters.pcbNumber;
        filterBrandInput.value = advancedFilters.brand;
        filterModelInput.value = advancedFilters.model;
        filterDeviceTypeSelect.value = currentCategory === 'All' ? '' : currentCategory;
        filterMcuInput.value = advancedFilters.mcu;
        filterEepromInput.value = advancedFilters.eeprom;
        filterBinSelect.value = advancedFilters.binAvailable;

        filterOverlay.classList.remove('hidden');
        filterPanel.classList.remove('hidden');

        // Force a reflow so the CSS transition triggers on the next frame
        void filterPanel.offsetWidth;

        filterOverlay.classList.add('visible');
        filterPanel.classList.add('visible');
    }

    function closeFilterPanel() {
        filterOverlay.classList.remove('visible');
        filterPanel.classList.remove('visible');

        setTimeout(() => {
            filterOverlay.classList.add('hidden');
            filterPanel.classList.add('hidden');
        }, 350); // Match CSS transition duration
    }

    function resetAdvancedFilters() {
        advancedFilters = { pcbNumber: '', brand: '', model: '', mcu: '', eeprom: '', binAvailable: '' };
        filterPcbNumberInput.value = '';
        filterBrandInput.value = '';
        filterModelInput.value = '';
        filterDeviceTypeSelect.value = '';
        filterMcuInput.value = '';
        filterEepromInput.value = '';
        filterBinSelect.value = '';
        updateFilterBadge();
    }

    function updateFilterBadge() {
        const count = Object.values(advancedFilters).filter(v => v !== '').length;
        if (count > 0) {
            filterBadge.textContent = count;
            filterBadge.classList.remove('hidden');
        } else {
            filterBadge.classList.add('hidden');
        }
    }

    function hasActiveAdvancedFilters() {
        return Object.values(advancedFilters).some(v => v !== '');
    }

    // ==========================================================================
    // LOGIC FUNCTIONS: SEARCH
    // ==========================================================================

    function toggleClearButton() {
        if (currentQuery.length > 0) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
    }

    function executeSearch() {
        // Nothing to search for yet — show the default (or empty-database) view
        if (currentQuery === '' && currentCategory === 'All' && !hasActiveAdvancedFilters()) {
            showState((dbLoaded && isDatabaseEmpty) ? noDatabaseState : defaultState);
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
                // Connection/config problem — be explicit, don't say "no results"
                if (dbLoadError) {
                    showState(errorState);
                    return;
                }

                // No records exist in the collection at all
                if (isDatabaseEmpty) {
                    showState(noDatabaseState);
                    return;
                }

                try {
                    const results = pcbDatabase.filter(pcb => matchesAllFilters(pcb));

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
            }, 300); // Small delay keeps the loading state feeling smooth
        });
    }

    /**
     * Checks a single PCB record against the free-text query, the
     * Device Type pill, and every Advanced Filter field. All conditions
     * are ANDed together.
     */
    function matchesAllFilters(pcb) {
        const matchCategory = currentCategory === 'All' || pcb.category === currentCategory;

        const queryLower = currentQuery.toLowerCase();
        const matchText = currentQuery === '' ||
            pcb.id.toLowerCase().includes(queryLower) ||
            pcb.brand.toLowerCase().includes(queryLower) ||
            pcb.model.toLowerCase().includes(queryLower);

        const matchPcbNumber = !advancedFilters.pcbNumber ||
            pcb.id.toLowerCase().includes(advancedFilters.pcbNumber.toLowerCase());

        const matchBrand = !advancedFilters.brand ||
            pcb.brand.toLowerCase().includes(advancedFilters.brand.toLowerCase());

        const matchModel = !advancedFilters.model ||
            pcb.model.toLowerCase().includes(advancedFilters.model.toLowerCase());

        const matchMcu = !advancedFilters.mcu ||
            pcb.mcu.toLowerCase().includes(advancedFilters.mcu.toLowerCase());

        const matchEeprom = !advancedFilters.eeprom ||
            pcb.eeprom.toLowerCase().includes(advancedFilters.eeprom.toLowerCase());

        const matchBin = advancedFilters.binAvailable === '' ||
            (advancedFilters.binAvailable === 'yes' && pcb.binAvailable) ||
            (advancedFilters.binAvailable === 'no' && !pcb.binAvailable);

        return matchCategory && matchText && matchPcbNumber && matchBrand &&
               matchModel && matchMcu && matchEeprom && matchBin;
    }

    // ==========================================================================
    // RENDER FUNCTIONS
    // ==========================================================================

    function renderResults(data) {
        resultsCount.innerText = `Found ${data.length} result${data.length > 1 ? 's' : ''}`;
        resultsGrid.innerHTML = '';

        data.forEach((pcb, index) => {
            const card = document.createElement('div');
            card.className = 'pcb-card glass-card';
            card.style.padding = '0'; // Override generic glass-card padding for image spanning
            card.style.animationDelay = `${Math.min(index, 8) * 0.05}s`; // Staggered fade-in

            // Handle Image Fallback
            const imageHtml = pcb.image
                ? `<img src="${pcb.image}" alt="${pcb.model}" loading="lazy">`
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
                            <span class="spec-value">${pcb.category || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">MCU Processor</span>
                            <span class="spec-value">${pcb.mcu || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">EEPROM / Flash</span>
                            <span class="spec-value">${pcb.eeprom || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Firmware Version</span>
                            <span class="spec-value">${pcb.firmwareVersion}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Last Updated</span>
                            <span class="spec-value">${formatLastUpdated(pcb.lastUpdated)}</span>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewPcbDetails('${pcb.id}')">
                            <i class="fa-solid fa-eye"></i> Details
                        </button>
                        <button class="btn btn-primary btn-sm" ${!pcb.binAvailable ? 'disabled' : ''} onclick="downloadPcbBin('${pcb.id}', ${pcb.binAvailable})">
                            <i class="fa-solid fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    }

    /**
     * Formats a Firestore Timestamp (or plain date value) into a short,
     * human-readable date. Falls back to 'N/A' for missing/invalid values.
     */
    function formatLastUpdated(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (error) {
            return 'N/A';
        }
    }

    function renderRecentSearches() {
        const list = document.getElementById('recentSearchesList');
        list.innerHTML = '';

        if (recentSearches.length === 0) {
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
        [defaultState, loadingState, resultsState, emptyState, errorState, noDatabaseState].forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });

        // Show target state
        stateElement.classList.remove('hidden');
        stateElement.classList.add('active');
    }

    function saveRecentSearch(term) {
        if (!term || term.length < 2) return;

        // Remove duplicate if exists, add to front
        recentSearches = recentSearches.filter(t => t.toLowerCase() !== term.toLowerCase());
        recentSearches.unshift(term);

        // Keep max 5 items
        if (recentSearches.length > 5) recentSearches.pop();

        localStorage.setItem('pcb_recent_searches', JSON.stringify(recentSearches));
        renderRecentSearches();
    }

    // ==========================================================================
    // GLOBAL WRAPPERS (Callable from inline HTML onclick attributes)
    // ==========================================================================

    // Triggered by "Clear Filters" button in the Empty State
    window.clearAllFilters = function () {
        searchInput.value = '';
        currentQuery = '';
        toggleClearButton();

        categoryFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        categoryFilters.querySelector('[data-filter="All"]').classList.add('active');
        currentCategory = 'All';

        resetAdvancedFilters();
        executeSearch();
    };

    // Triggered by "Retry" button in the Error State
    window.retrySearch = function () {
        dbLoaded = false;
        dbLoadError = false;
        loadPcbDatabase().then(() => executeSearch());
    };

    // Triggered by suggestion cards / recent search items
    window.triggerSearch = function (term) {
        searchInput.value = term;
        searchInput.dispatchEvent(new Event('input')); // reuse the debounced listener
    };
});

// ==========================================================================
// GLOBAL UTILITIES (Callable from card action buttons)
// ==========================================================================

/**
 * "View Details" button handler — Phase 2 placeholder (full detail view
 * will need its own page/modal; kept as a toast so the UI stays responsive).
 */
window.viewPcbDetails = function (pcbId) {
    showToast(`Viewing specs for ${pcbId} (Phase 2 Component)`, 'info');
};

/**
 * "Download BIN" button handler — Phase 2 placeholder (real downloads
 * will need Firebase Storage wired up to hold the actual .bin files).
 */
window.downloadPcbBin = function (pcbId, available) {
    if (!available) {
        showToast(`No BIN file available for ${pcbId} yet.`, 'error');
        return;
    }
    showToast(`Downloading BIN for ${pcbId}... (Phase 2 Component)`, 'success');
};

/**
 * Debounce Utility for performance
 */
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
