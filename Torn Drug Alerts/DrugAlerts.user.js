// ==UserScript==
// @name         Torn Drug Alert
// @version      1.1.2
// @description  Alerts when no drug cooldown is active, allows taking drugs from any page, and auto-adjusts quick-use button text color.
// @author       GNSC4 [268863] (Enhanced by Gemini)
// @match        https://www.torn.com/*
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// ==/UserScript==

(function() {
    'use strict';

    // Check if we're on an attack page and exit early if true
    if (window.location.href.includes('sid=getInAttack') ||
        window.location.href.includes('sid=attack') ||
        window.location.href.includes('loader2.php') ||
        window.location.pathname.includes('loader2.php')) {
        console.log('Drug Alerts: Not initializing on attack page');
        return;
    }

    // Default Drug Colors Definition
    const defaultDrugColors = {
        196: '#7CB342', // Cannabis: Green
        197: '#03A9F4', // Ecstasy: Light Blue
        198: '#9C27B0', // Ketamine: Purple
        199: '#FFEB3B', // LSD: Yellow
        200: '#A1887F', // Opium: Light Brown
        201: '#E53935', // PCP: Red
        203: '#5E35B1', // Shrooms: Deep Purple
        204: '#FB8C00', // Speed: Orange
        205: '#546E7A', // Vicodin: Blue Grey
        206: '#43A047', // Xanax: Darker Green
        default: '#9E9E9E' // Fallback Grey
    };

    function getDefaultDrugColor(id) {
        return defaultDrugColors[id] || defaultDrugColors.default;
    }

    // --- NEW HELPER FUNCTIONS for Text Color Adjustment ---

    /**
     * Converts a HEX color value to RGB.
     * @param {string} hex - The hex color string (e.g., "#FF0000" or "#F00").
     * @returns {{r: number, g: number, b: number} | null} An object with r, g, b values (0-255), or null if invalid hex.
     */
    function hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return null;
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Calculates the perceived brightness (luminance) of a HEX color.
     * @param {string} hexColor - The hex color string.
     * @returns {number} A brightness value (0-255), higher is lighter. Returns 0 for invalid input.
     */
    function getBrightness(hexColor) {
        const rgb = hexToRgb(hexColor);
        if (!rgb) return 0; // Return 0 (dark) for invalid colors
        // Formula for perceived brightness (YIQ luminance)
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }

    /**
     * Determines if text should be black or white based on background brightness.
     * @param {string} hexBgColor - The hex background color string.
     * @param {number} [threshold=150] - The brightness threshold (0-255). Backgrounds brighter than this get dark text.
     * @returns {string} '#000000' (black) or '#FFFFFF' (white).
     */
    function getTextColorBasedOnBackground(hexBgColor, threshold = 150) {
        const brightness = getBrightness(hexBgColor);
        return brightness > threshold ? '#000000' : '#FFFFFF'; // Dark text on light bg, White text on dark bg
    }

    // --- END NEW HELPER FUNCTIONS ---


    // Add CSS
    GM_addStyle(`
        /* General Styles */
        .drug-alert {
            background-color: #ff3333; color: white; padding: 5px 10px;
            border-radius: 3px; font-weight: bold; cursor: pointer;
            margin-left: 15px; display: inline-flex; align-items: center;
            font-size: 12px; vertical-align: middle; /* Added for better alignment */
        }
        .drug-gui, #drug-customization-ui, #add-drugs-ui { /* Common modal styles */
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #222; color: white; padding: 20px; border-radius: 8px;
            z-index: 9999998; /* Consistent high z-index */
            width: 350px; max-height: 500px; overflow-y: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444;
            display: none; /* Hidden by default */
        }
        .drug-gui h3, #drug-customization-ui h3, #add-drugs-ui h3 {
             margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px;
        }
        .drug-gui input[type="text"], #add-drugs-ui input[type="text"] { /* Common search/input styles */
            width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #444;
            background-color: #333; color: white; border-radius: 3px; box-sizing: border-box;
        }
        .drug-gui input[type="text"]::placeholder, #add-drugs-ui input[type="text"]::placeholder { color: #aaa; }

        /* Drug Selection/List Styles */
        .drug-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
        .drug-item {
            background-color: #333; padding: 12px; border-radius: 5px; text-align: center;
            cursor: pointer; transition: background-color 0.2s; font-size: 14px; font-weight: bold;
        }
        .drug-item:hover { background-color: #444; }

        /* Notification Styles */
        .drug-notification {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            padding: 15px 20px; border-radius: 5px; color: white; z-index: 99999999; /* Highest z-index */
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4); opacity: 1;
            transition: opacity 0.5s, transform 0.3s ease-out; text-align: center;
            min-width: 250px; max-width: 80%; pointer-events: none;
        }
        .drug-notification.success { background-color: rgba(76, 175, 80, 0.9); border: 1px solid #4CAF50; }
        .drug-notification.error { background-color: rgba(244, 67, 54, 0.9); border: 1px solid #f44336; }
        .drug-notification.info { background-color: rgba(33, 150, 243, 0.9); border: 1px solid #2196F3; }

        /* Settings Section in GUI */
        .settings-section { margin-top: 15px; padding: 10px; background-color: #333; border-radius: 5px; border: 1px solid #444; }
        .settings-toggle { display: flex; align-items: center; margin-bottom: 8px; }
        .settings-toggle label { margin-left: 8px; cursor: pointer; }
        .settings-toggle input[type="checkbox"] { cursor: pointer; }

        /* Quick Use Panel Styles */
        .quick-use-container {
            position: fixed; top: 100px; right: 20px; background-color: rgba(34, 34, 34, 0.8);
            padding: 10px; border-radius: 5px; z-index: 9998; display: flex;
            flex-direction: column; gap: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: top 0.2s ease-in-out, padding 0.2s ease-in-out; /* Smooth transitions */
        }
        .drug-quick-button {
            /* Text color is set dynamically by JS */
            border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;
            font-weight: bold; margin-bottom: 5px; text-align: center; transition: background-color 0.2s, filter 0.2s;
            display: block; /* Ensure it's visible by default */
        }
        .drug-quick-button:hover { filter: brightness(1.2); }
        .drug-settings-button {
            background-color: #555; color: white; border: none; padding: 5px 10px; border-radius: 3px;
            cursor: pointer; font-weight: bold; margin-top: 5px; text-align: center; font-size: 12px;
            transition: background-color 0.2s; display: block; /* Ensure it's visible by default */
        }
        .drug-settings-button:hover { background-color: #666; }
        .quick-use-toggle-button {
            position: absolute; top: -8px; right: -8px; background-color: #f44336; color: white;
            border: none; width: 20px; height: 20px; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; cursor: pointer; font-size: 10px;
            font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        /* Drug Customization UI Styles */
        #drug-customization-ui p { margin-bottom: 15px; font-size: 14px; }
        .drug-selection-area {
            margin-bottom: 15px; border: 1px solid #444; border-radius: 5px; padding: 10px;
            max-height: 250px; overflow-y: auto;
        }
        .drug-selection-item {
            display: flex; align-items: center; padding: 8px; margin-bottom: 5px;
            background-color: #333; border-radius: 4px; cursor: move; /* Cursor indicates draggable */
            transition: opacity 0.2s; /* Smooth fade for drag/remove */
        }
        .drug-selection-item[draggable="true"] { /* Style when dragging */
             opacity: 0.5;
             border: 1px dashed #888;
        }
        .drug-selection-item span:first-of-type { /* Drag handle */
             margin-right: 10px; cursor: move; user-select: none;
        }
        .drug-selection-item input[type="checkbox"] { margin-right: 5px; cursor: pointer; }
        .drug-selection-item span:nth-of-type(2) { flex-grow: 1; } /* Drug name */
        .drug-selection-item input[type="color"] {
            width: 25px; height: 25px; border: 1px solid #555; /* Added border */
            background: none; cursor: pointer;
            vertical-align: middle; margin-left: 10px; padding: 0; /* Reset padding */
            border-radius: 3px; /* Slightly rounded */
        }
        .customization-button {
            background-color: #4CAF50; color: white; border: none; padding: 8px 15px;
            border-radius: 4px; cursor: pointer; flex-grow: 1; margin: 0 5px;
            transition: background-color 0.2s, filter 0.2s;
        }
        .customization-button.cancel { background-color: #777; }
        .customization-button.add { width: 100%; margin-bottom: 15px; box-sizing: border-box; }
        .customization-button:hover { filter: brightness(1.1); }
        .customization-button-container { display: flex; justify-content: space-between; margin-top: 10px; }

        /* Add Drugs UI Styles */
        .add-drug-list-container {
            margin-bottom: 15px; max-height: 300px; overflow-y: auto; border: 1px solid #444;
            border-radius: 4px; padding: 5px;
        }
        .add-drug-item {
            display: flex; align-items: center; padding: 8px; margin-bottom: 5px;
            background-color: #333; border-radius: 4px; cursor: pointer;
            transition: background-color 0.2s;
        }
        .add-drug-item.selected { background-color: #4a4a4a; font-weight: bold; } /* Indicate selected */
        .add-drug-item:hover { background-color: #444; }
        .add-drug-item input[type="checkbox"] { margin-right: 10px; pointer-events: none; /* Checkbox reflects state, click handled by item */ }
        .add-drug-item span { flex-grow: 1; }
        .add-drugs-button-container { display: flex; justify-content: flex-end; }
        .add-drugs-done-button {
            background-color: #4CAF50; color: white; border: none; padding: 8px 15px;
            border-radius: 4px; cursor: pointer; transition: background-color 0.2s, filter 0.2s;
        }
        .add-drugs-done-button:hover { filter: brightness(1.1); }
    `);

    // Fallback drug list in case fetch fails - IDs should be correct
    const fallbackDrugs = [
        { id: 196, name: "Cannabis" }, { id: 197, name: "Ecstasy" },
        { id: 198, name: "Ketamine" }, { id: 199, name: "LSD" },
        { id: 200, name: "Opium" }, { id: 201, name: "PCP" },
        { id: 203, name: "Shrooms" }, { id: 204, name: "Speed" },
        { id: 205, name: "Vicodin" }, { id: 206, name: "Xanax" }
    ];

    let alertElements = null; // { alert: HTMLElement, gui: HTMLElement | null }
    let drugList = []; // Array of { id: number, name: string }
    let useFactionDrugs = false; // Flag for using faction vs personal drugs
    let DEBUG_MODE = false; // Set to true for console logs

    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[DrugAlerts Debug]', ...args);
        }
    }

    function positionDrugAlert(alert, header) {
        // Special handling for forums pages
        if (window.location.href.includes('forums.php')) {
            const linksWrap = document.querySelector('.links-top-wrap');
            if (linksWrap) {
                const firstLink = linksWrap.querySelector('a');
                if (firstLink) linksWrap.insertBefore(alert, firstLink);
                else linksWrap.appendChild(alert);
                // Apply specific styles for forum placement
                alert.style.cssText = `
                    display: inline-flex !important; align-items: center !important;
                    margin-right: 10px !important; margin-left: 10px !important;
                    order: 1 !important; z-index: 99999 !important;
                    pointer-events: auto !important; vertical-align: middle !important;
                    float: right !important; background-color: #ff3333; color: white;
                    padding: 5px 10px; border-radius: 3px; font-weight: bold;
                    cursor: pointer; font-size: 12px;
                `;
                return; // Exit after handling forum placement
            }
        }

        // Default placement logic
        header.appendChild(alert);
        alert.style.cssText = `
            display: inline-flex !important; align-items: center !important;
            margin-left: 10px !important; order: 2 !important; /* Place after title usually */
            z-index: 99999 !important; pointer-events: auto !important;
            background-color: #ff3333; color: white; padding: 5px 10px;
            border-radius: 3px; font-weight: bold; cursor: pointer; font-size: 12px;
            vertical-align: middle; /* Align with text */
        `;

        // Adjust for mobile/PDA view
        const isMobilePDA = navigator.userAgent.includes('PDA') || window.innerWidth < 768 || document.documentElement.classList.contains('tornPDA');
        if (isMobilePDA) {
            alert.style.fontSize = '10px';
            alert.style.padding = '3px 6px';
            alert.style.marginLeft = '5px';
        }

        // Adjust if placed in the fixed header fallback
        if (header.id === 'torn-drug-fixed-header') {
            alert.style.margin = '0';
            alert.style.marginLeft = '5px';
        }
    }

    function findHeader() {
        // Prioritized list of potential header/title elements across Torn pages
        const possibleHeaders = [
            // Common page titles
            '.content-title h4', // Most common title structure
            '.content-title .title', // Alternative within content-title
            '.title-black', // Generic black title class
            '.pageTitle___CaFrO', // React page title
            '.appHeader___gUnYC h4', // React app header title
            '.captionWithActionContainment___nVTbE', // Another common container
            '.topSection___CvKvI', // Section header
            '.mainStatsContainer___TXO7F', // Stats container (e.g., profile)
            'div[role="heading"]', // Accessibility role
            '.titleContainer___QrlWP .title___rhtB4', // Specific title structure
            '.clearfix .t-black', // Older title style
            '.page-head > h4', // Simple page head title
            '.header-title', // Generic header title
            '.mobile-title', // Mobile specific title
            '.app-header', // Generic app header
            '.content-title.m-bottom10', // Title with margin
            // Forum specific headers
            '.forum-thread-wrap header', // Thread header
            '.forum-post-reply', // Reply section header
            '.forums-subcats', // Subcategory list header
            '.forums-threadList', // Thread list header
            // Fallback / Less common
            '.content-wrapper .header',
            '.content-wrapper .title-black',
            '.sortable-list .title',
            '#skip-to-content', // Usually first focusable element
            '.tutorial-cont', // Tutorial container
            '.cont-gray', // Gray container (less likely a main title)
        ].map(selector => document.querySelector(selector)).filter(el => el !== null && el.offsetParent !== null); // Filter out null and hidden elements

        const foundHeader = possibleHeaders[0]; // Get the first valid header found

        // Special handling for forum index/subforum pages if no standard header found
        if (!foundHeader && window.location.href.includes('forums.php')) {
             const linksWrap = document.querySelector('.links-top-wrap');
             if (linksWrap) return linksWrap; // Use the top links bar as anchor
             return createFixedHeader(); // Fallback to fixed if linksWrap not found
        }

        if (!foundHeader) {
            debugLog("No suitable header found, creating fixed header.");
            return createFixedHeader(); // Create fixed header if no suitable element found
        }

        debugLog("Found header element:", foundHeader);
        return foundHeader;
    }

    function createFixedHeader() {
        let fixedHeader = document.getElementById('torn-drug-fixed-header');
        if (!fixedHeader) {
            fixedHeader = document.createElement('div');
            fixedHeader.id = 'torn-drug-fixed-header';
            Object.assign(fixedHeader.style, {
                position: 'fixed',
                top: '50px', // Position below top user bar
                right: '20px',
                zIndex: '9999',
                backgroundColor: 'rgba(34, 34, 34, 0.8)',
                padding: '5px 10px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            });
            document.body.appendChild(fixedHeader);
            debugLog("Created fixed header element.");
        }
        return fixedHeader;
    }

    function createAlert(drugs) {
        let header = findHeader();
        removeExistingAlerts(); // Clear previous alert/GUI first

        const alert = document.createElement('div');
        alert.className = 'drug-alert';
        alert.textContent = 'No Drugs';
        positionDrugAlert(alert, header); // Position the alert element

        // Determine if the current page allows direct drug use via GUI
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
        const canShowGui = (isItemsPage && !useFactionDrugs) || (isFactionArmouryDrugsPage && useFactionDrugs);

        let gui = null;
        if (canShowGui) {
            gui = document.createElement('div');
            gui.className = 'drug-gui';
            gui.id = 'drugGui'; // Assign ID for easy access
            gui.innerHTML = `
                <h3>Take Drugs</h3>
                <div class="settings-section">
                    <div class="settings-toggle">
                        <input type="checkbox" id="useFactionDrugs" ${useFactionDrugs ? 'checked' : ''}>
                        <label for="useFactionDrugs">Use Faction Armoury Drugs</label>
                    </div>
                </div>
                <input type="text" class="drug-search" placeholder="Search drugs...">
                <div class="drug-list"></div>
            `;
            document.body.appendChild(gui);

            // Faction drug toggle logic
            const factionDrugsCheckbox = gui.querySelector('#useFactionDrugs');
            if (factionDrugsCheckbox) {
                factionDrugsCheckbox.addEventListener('change', function() {
                    useFactionDrugs = this.checked;
                    localStorage.setItem('useFactionDrugs', useFactionDrugs);
                    showNotification(`${useFactionDrugs ? 'Using faction armoury drugs' : 'Using personal inventory drugs'}`, 'info');
                    gui.style.display = 'none'; // Hide GUI after changing setting
                    removeExistingAlerts(); // Re-create alert (might change click behavior)
                    alertElements = createAlert(drugList);
                });
            }

            const drugListElement = gui.querySelector('.drug-list');
            const searchInput = gui.querySelector('.drug-search');

            // Function to populate the drug list in the GUI
            function populateDrugList(filter = '') {
                drugListElement.innerHTML = ''; // Clear previous list
                const filteredDrugs = drugs.filter(drug => drug.name.toLowerCase().includes(filter.toLowerCase()));

                if (filteredDrugs.length === 0) {
                    drugListElement.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #aaa;">No drugs found</div>';
                    return;
                }

                filteredDrugs.forEach(drug => {
                    const drugItem = document.createElement('div');
                    drugItem.className = 'drug-item';
                    drugItem.textContent = drug.name;
                    drugItem.onclick = () => {
                        useDrug(drug.id, drug.name); // Attempt to use the drug
                        if(gui) gui.style.display = 'none'; // Hide GUI after selection
                    };
                    drugListElement.appendChild(drugItem);
                });
            }

            populateDrugList(); // Initial population
            searchInput.addEventListener('input', () => { populateDrugList(searchInput.value); }); // Update list on search input

            // Close GUI when clicking outside
            document.addEventListener('click', function closeGuiOnClickOutside(e) {
                if (gui && gui.style.display === 'block' && !gui.contains(e.target) && !alert.contains(e.target)) {
                    gui.style.display = 'none';
                }
            });
        }

        // Click handler for the main "No Drugs" alert button
        alert.onclick = function(event) {
            event.stopPropagation(); // Prevent triggering body click listeners

            if (canShowGui) {
                if (gui) {
                    // Toggle GUI visibility
                    gui.style.display = gui.style.display === 'block' ? 'none' : 'block';
                    if (gui.style.display === 'block') {
                        // Focus search input when opening
                        const searchInput = gui.querySelector('.drug-search');
                        if (searchInput) searchInput.focus();
                    }
                } else {
                    // If GUI doesn't exist for some reason, recreate the alert structure
                    removeExistingAlerts();
                    alertElements = createAlert(drugList);
                    if (alertElements && alertElements.gui) {
                        alertElements.gui.style.display = 'block'; // Show the newly created GUI
                    }
                }
            } else {
                // If GUI cannot be shown on this page, navigate to the appropriate page
                const targetUrl = useFactionDrugs
                    ? 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=drugs'
                    : 'https://www.torn.com/item.php';
                sessionStorage.setItem('fromDrugAlert', 'true'); // Flag to potentially open GUI on arrival
                showNotification(`Navigating to ${useFactionDrugs ? 'faction armoury' : 'items'} page...`, 'info');
                window.location.href = targetUrl;
            }
            return false; // Prevent default link behavior if any
        };

        return { alert, gui }; // Return references to the created elements
    }

    function addQuickUseButtons() {
        // Only add buttons on item or faction armoury pages
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
        if (!isItemsPage && !isFactionArmouryDrugsPage) {
            debugLog("Not on items or faction armoury page, skipping quick use buttons.");
            return;
        }

        // Remove existing container to prevent duplicates on re-renders
        const existingContainer = document.querySelector('.quick-use-container');
        if (existingContainer) existingContainer.remove();

        const quickUseContainer = document.createElement('div');
        quickUseContainer.className = 'quick-use-container';

        // Load saved quick use drugs or use defaults
        const savedQuickUseDrugs = localStorage.getItem('customQuickUseDrugs');
        let quickUseDrugs = [];
        const defaultQuickDrugs = [
            { id: 206, name: "Xanax" },
            { id: 197, name: "Ecstasy" },
            { id: 196, name: "Cannabis" }
        ];

        if (savedQuickUseDrugs) {
            try {
                quickUseDrugs = JSON.parse(savedQuickUseDrugs);
                // Ensure color property exists, assign default if missing
                quickUseDrugs.forEach(drug => {
                    if (!drug.color) drug.color = getDefaultDrugColor(drug.id);
                });
            } catch (e) {
                console.error("Drug Alerts: Error parsing saved quick use drugs, using defaults.", e);
                quickUseDrugs = defaultQuickDrugs.map(drug => ({ ...drug, color: getDefaultDrugColor(drug.id) }));
                localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs)); // Save defaults
            }
        } else {
            // No saved drugs, use defaults and save them
             quickUseDrugs = defaultQuickDrugs.map(drug => ({ ...drug, color: getDefaultDrugColor(drug.id) }));
             localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs));
        }

        const drugButtons = []; // Store button elements for minimize toggle
        quickUseDrugs.forEach(drug => {
            const button = document.createElement('div');
            button.textContent = drug.name;
            button.className = 'drug-quick-button';
            const bgColor = drug.color || getDefaultDrugColor(drug.id); // Ensure valid background
            button.style.backgroundColor = bgColor;
            button.style.color = getTextColorBasedOnBackground(bgColor); // *** SET TEXT COLOR BASED ON BG ***
            button.addEventListener('click', () => useDrug(drug.id, drug.name));
            drugButtons.push(button);
            quickUseContainer.appendChild(button);
        });

        // Settings button to open customization UI
        const settingsButton = document.createElement('div');
        settingsButton.textContent = '⚙️ Edit';
        settingsButton.className = 'drug-settings-button';
        settingsButton.addEventListener('click', () => showDrugCustomizationUI(quickUseDrugs));
        quickUseContainer.appendChild(settingsButton);

        // Minimize/Toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'quick-use-toggle-button';
        let isMinimized = localStorage.getItem('drugAlertMinimized') === 'true';

        function applyMinimizedState() {
            const displayStyle = isMinimized ? 'none' : 'block';
            drugButtons.forEach(btn => { btn.style.display = displayStyle; });
            settingsButton.style.display = displayStyle;
            quickUseContainer.style.padding = isMinimized ? '2px' : '10px';
            quickUseContainer.style.top = isMinimized ? '110px' : '100px'; // Adjust position slightly when minimized
            toggleButton.textContent = isMinimized ? '+' : 'X'; // Use '+' for maximize, 'X' for minimize
        }
        applyMinimizedState(); // Apply initial state

        toggleButton.addEventListener('click', () => {
            isMinimized = !isMinimized;
            applyMinimizedState();
            localStorage.setItem('drugAlertMinimized', isMinimized.toString());
        });

        quickUseContainer.appendChild(toggleButton);
        document.body.appendChild(quickUseContainer);
        debugLog("Quick use buttons added/updated.");
    }

    function showDrugCustomizationUI(currentDrugs) {
        let justOpened = true; // Flag to prevent immediate closing
        setTimeout(() => { justOpened = false; }, 300); // Short delay

        // Remove existing UI if present
        const existingUI = document.getElementById('drug-customization-ui');
        if (existingUI) existingUI.remove();

        const customizationUI = document.createElement('div');
        customizationUI.id = 'drug-customization-ui';
        customizationUI.innerHTML = `
            <h3>Customize Quick Use Drugs</h3>
            <p>Select drugs, reorder by dragging, and customize colors.</p>
            <div class="drug-selection-area"></div>
            <button class="customization-button add">+ Add More Drugs</button>
            <div class="customization-button-container">
                <button class="customization-button save">Save Changes</button>
                <button class="customization-button cancel">Cancel</button>
            </div>
        `;

        const drugSelectionArea = customizationUI.querySelector('.drug-selection-area');
        // Deep copy current drugs to avoid modifying the original array directly
        const selectedDrugs = JSON.parse(JSON.stringify(currentDrugs)).map(drug => ({
            ...drug,
            color: drug.color || getDefaultDrugColor(drug.id) // Ensure color exists
        }));

        // Creates a color picker input for a drug item
        function createColorPicker(drug, drugItemElement) {
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = drug.color; // Set initial value
            colorPicker.addEventListener('input', (e) => {
                drug.color = e.target.value; // Update color in the temporary selectedDrugs array
                // Optional: Update preview background instantly (can be visually noisy)
                // drugItemElement.style.backgroundColor = drug.color;
                // drugItemElement.style.color = getTextColorBasedOnBackground(drug.color);
            });
            return colorPicker;
        }

        // Renders a single drug item in the customization list
        function renderDrugItem(drug) {
            const drugItem = document.createElement('div');
            drugItem.className = 'drug-selection-item';
            drugItem.setAttribute('data-drug-id', drug.id);
            drugItem.setAttribute('draggable', 'true'); // Make it draggable

            // Drag Handle
            const dragHandle = document.createElement('span');
            dragHandle.innerHTML = '≡'; // Unicode drag handle symbol
            dragHandle.style.cursor = 'move'; // Visual cue
            drugItem.appendChild(dragHandle);

            // Remove Checkbox (acts as remove toggle)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // Assume initially included
            checkbox.title = "Uncheck to remove this drug on save";
            checkbox.addEventListener('change', () => {
                if (!checkbox.checked) {
                    drugItem.style.opacity = '0.5';
                    drugItem.style.textDecoration = 'line-through';
                    drugItem.setAttribute('data-remove', 'true'); // Mark for removal on save
                } else {
                    drugItem.style.opacity = '1';
                    drugItem.style.textDecoration = 'none';
                    drugItem.removeAttribute('data-remove'); // Unmark for removal
                }
            });
            drugItem.appendChild(checkbox);

            // Drug Name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = drug.name;
            drugItem.appendChild(nameSpan);

            // Color Picker
            const colorPicker = createColorPicker(drug, drugItem);
            drugItem.appendChild(colorPicker);

            drugSelectionArea.appendChild(drugItem);

            // Add drag-and-drop event listeners
            drugItem.addEventListener('dragstart', handleDragStart);
            drugItem.addEventListener('dragover', handleDragOver);
            drugItem.addEventListener('drop', handleDrop);
            drugItem.addEventListener('dragend', handleDragEnd);
        }

        selectedDrugs.forEach(renderDrugItem); // Render initial list

        // --- Drag and Drop Handlers ---
        let draggedItem = null;

        function handleDragStart(e) {
            draggedItem = e.target.closest('.drug-selection-item');
            if (!draggedItem) return;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedItem.dataset.drugId); // Store ID for reference
            // Use timeout to allow browser to render drag image before changing style
            setTimeout(() => { if (draggedItem) draggedItem.style.opacity = '0.4'; }, 0);
        }

        function handleDragOver(e) {
            e.preventDefault(); // Necessary to allow drop
            e.dataTransfer.dropEffect = 'move';
            const targetItem = e.target.closest('.drug-selection-item');
            if (targetItem && targetItem !== draggedItem) {
                const rect = targetItem.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                // Insert above or below target based on mouse position within the target item
                if (offsetY < rect.height / 2) {
                    drugSelectionArea.insertBefore(draggedItem, targetItem);
                } else {
                    drugSelectionArea.insertBefore(draggedItem, targetItem.nextSibling);
                }
            }
        }

        function handleDrop(e) {
            e.preventDefault(); // Prevent default drop behavior
            // Actual reordering happens in dragover, drop is just finalization
        }

        function handleDragEnd(e) {
            if (draggedItem) {
                draggedItem.style.opacity = '1'; // Restore opacity
            }
            draggedItem = null; // Clear reference

            // Update the selectedDrugs array order based on the new DOM order
            const currentItems = Array.from(drugSelectionArea.querySelectorAll('.drug-selection-item'));
            const reorderedDrugs = [];
            currentItems.forEach(item => {
                const drugId = parseInt(item.dataset.drugId);
                // Find the corresponding drug data (including potentially updated color)
                const drugData = selectedDrugs.find(d => d.id === drugId);
                if (drugData) {
                    // Ensure color is up-to-date from the picker in the item
                    const colorPicker = item.querySelector('input[type="color"]');
                    if (colorPicker) drugData.color = colorPicker.value;
                    reorderedDrugs.push(drugData);
                }
            });
            // Replace the selectedDrugs array content with the reordered items
            selectedDrugs.length = 0;
            selectedDrugs.push(...reorderedDrugs);
            debugLog("Drug order updated in array after drag.");
        }
        // --- End Drag and Drop Handlers ---

        // Button Actions
        customizationUI.querySelector('.customization-button.add').addEventListener('click', () => {
            showAddDrugsUI(selectedDrugs, drugSelectionArea, renderDrugItem); // Open the 'add more' UI
        });

        customizationUI.querySelector('.customization-button.save').addEventListener('click', () => {
            // Filter out drugs marked for removal and map to final format
            const finalDrugs = selectedDrugs.filter(drug => {
                 const itemInUI = drugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                 return itemInUI && !itemInUI.hasAttribute('data-remove'); // Keep if exists and not marked for removal
            }).map(drug => {
                 // Get the final color value from the picker in the UI element
                 const itemInUI = drugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                 const colorPicker = itemInUI ? itemInUI.querySelector('input[type="color"]') : null;
                 return { id: drug.id, name: drug.name, color: colorPicker ? colorPicker.value : drug.color };
            });

            localStorage.setItem('customQuickUseDrugs', JSON.stringify(finalDrugs)); // Save to localStorage
            customizationUI.remove(); // Close UI
            addQuickUseButtons(); // Refresh the quick use buttons with new settings
            showNotification('Quick use drugs updated successfully!', 'success');
        });

        customizationUI.querySelector('.customization-button.cancel').addEventListener('click', () => {
            customizationUI.remove(); // Close UI without saving
        });

        document.body.appendChild(customizationUI);
        customizationUI.style.display = 'block'; // Make sure it's visible

        // Add listener to close the UI when clicking outside of it
        function closeCustomizationOnClickOutside(e) {
            if (justOpened) return; // Ignore clicks right after opening
            const isSettingsButton = e.target.closest('.drug-settings-button');
            const isAddDrugsUI = e.target.closest('#add-drugs-ui'); // Don't close if clicking inside the 'Add Drugs' modal
            const isColorPicker = e.target.matches('input[type="color"]'); // Don't close when interacting with color picker

            if (customizationUI && !customizationUI.contains(e.target) && !isSettingsButton && !isAddDrugsUI && !isColorPicker) {
                customizationUI.remove();
                document.removeEventListener('click', closeCustomizationOnClickOutside, true); // Use capture phase
                debugLog("Closed customization UI via outside click.");
            }
        }
        // Use capture phase to catch clicks before they might be stopped by other elements
        setTimeout(() => { document.addEventListener('click', closeCustomizationOnClickOutside, true); }, 100);
    }

    function showAddDrugsUI(selectedDrugsRef, parentDrugSelectionArea, renderDrugItemFn) {
        // Prevent multiple instances
        const existingAddUI = document.getElementById('add-drugs-ui');
        if (existingAddUI) existingAddUI.remove();

        const addDrugsUI = document.createElement('div');
        addDrugsUI.id = 'add-drugs-ui';
        addDrugsUI.innerHTML = `
            <h3>Add Drugs to Quick Use</h3>
            <input type="text" placeholder="Search available drugs...">
            <div class="add-drug-list-container"></div>
            <div class="add-drugs-button-container">
                <button class="add-drugs-done-button">Done</button>
            </div>
        `;

        const searchBox = addDrugsUI.querySelector('input[type="text"]');
        const drugListContainer = addDrugsUI.querySelector('.add-drug-list-container');
        const availableDrugs = drugList.length > 0 ? drugList : fallbackDrugs; // Use fetched or fallback list

        // Function to refresh the list of addable drugs
        function refreshDrugList(searchTerm = '') {
            drugListContainer.innerHTML = ''; // Clear current list
            const filteredDrugs = availableDrugs.filter(drug =>
                drug.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredDrugs.length === 0) {
                drugListContainer.innerHTML = '<div style="padding: 10px; color: #aaa;">No drugs found</div>';
                return;
            }

            filteredDrugs.forEach(drug => {
                // Check if this drug is already present and not marked for removal in the main customization UI
                const parentItem = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                const isSelectedAndNotRemoved = parentItem && !parentItem.hasAttribute('data-remove');

                const drugItem = document.createElement('div');
                drugItem.className = `add-drug-item ${isSelectedAndNotRemoved ? 'selected' : ''}`;
                drugItem.setAttribute('data-drug-id', drug.id); // Store ID

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isSelectedAndNotRemoved;
                checkbox.style.marginRight = '10px';
                // Checkbox is visual only; click is handled by the item div
                checkbox.style.pointerEvents = 'none';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = drug.name;

                drugItem.appendChild(checkbox);
                drugItem.appendChild(nameSpan);

                // Click handler for adding/removing the drug from the main list
                const handleClick = () => {
                    const parentItemOnClick = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                    const currentlySelectedAndNotRemoved = parentItemOnClick && !parentItemOnClick.hasAttribute('data-remove');

                    if (!currentlySelectedAndNotRemoved) {
                        // --- Add the drug ---
                        if (parentItemOnClick) {
                            // If item exists but was marked for removal, unmark it
                            parentItemOnClick.style.opacity = '1';
                            parentItemOnClick.style.textDecoration = 'none';
                            parentItemOnClick.removeAttribute('data-remove');
                            const parentCheckbox = parentItemOnClick.querySelector('input[type="checkbox"]');
                            if(parentCheckbox) parentCheckbox.checked = true;
                            // Ensure it's back in the selectedDrugsRef array if it was filtered out
                            if (!selectedDrugsRef.some(d => d.id === drug.id)) {
                                const existingColorPicker = parentItemOnClick.querySelector('input[type="color"]');
                                selectedDrugsRef.push({ ...drug, color: existingColorPicker ? existingColorPicker.value : getDefaultDrugColor(drug.id) });
                            }
                        } else {
                            // If item doesn't exist, render it anew in the main list
                            const newDrugData = {...drug, color: getDefaultDrugColor(drug.id)};
                            renderDrugItemFn(newDrugData); // Use the passed render function
                            selectedDrugsRef.push(newDrugData); // Add to the reference array
                        }
                        // Update visual state in the 'Add Drugs' UI
                        drugItem.classList.add('selected');
                        checkbox.checked = true;
                    } else {
                        // --- Remove the drug ---
                        if (parentItemOnClick) {
                            // Mark the item for removal in the main list
                            parentItemOnClick.style.opacity = '0.5';
                            parentItemOnClick.style.textDecoration = 'line-through';
                            parentItemOnClick.setAttribute('data-remove', 'true');
                            const parentCheckbox = parentItemOnClick.querySelector('input[type="checkbox"]');
                            if(parentCheckbox) parentCheckbox.checked = false;
                        }
                        // Update visual state in the 'Add Drugs' UI
                        drugItem.classList.remove('selected');
                        checkbox.checked = false;
                    }
                };
                drugItem.addEventListener('click', handleClick);
                drugListContainer.appendChild(drugItem);
            });
        }

        refreshDrugList(); // Initial population
        searchBox.addEventListener('input', () => { refreshDrugList(searchBox.value); }); // Filter on input

        // Close button
        addDrugsUI.querySelector('.add-drugs-done-button').addEventListener('click', () => {
            addDrugsUI.remove();
        });

        document.body.appendChild(addDrugsUI);
        addDrugsUI.style.display = 'block'; // Show the UI
        addDrugsUI.style.zIndex = '9999999'; // Ensure it's above the customization UI

        // Stop propagation to prevent closing the main customization UI when clicking inside 'Add Drugs'
        addDrugsUI.addEventListener('click', e => { e.stopPropagation(); });
        searchBox.focus(); // Focus search box on open
    }

    function useDrug(id, name) {
        debugLog(`Attempting to use drug: ${name} (ID: ${id}), Using faction drugs: ${useFactionDrugs}`);
        showNotification(`Using ${name}...`, 'info');

        // Hide the main drug selection GUI if it's open
        const gui = document.getElementById('drugGui');
        if (gui) gui.style.display = 'none';

        // Choose the correct use method based on the setting
        if (useFactionDrugs) {
            tryFactionDrugUseMethod(id, name);
        } else {
            tryDirectUseMethod(id, name);
        }
    }

    // --- Drug Use Methods ---

    // Method 1: Use personal inventory drug (item.php)
    function tryDirectUseMethod(id, name) {
        debugLog('Attempting direct use method (personal inventory)');
        // Flag in session storage to track progress (useful if page reloads unexpectedly)
        sessionStorage.setItem('drugUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'direct' }));
        useItemDirectly(id, name);
    }

    function useItemDirectly(id, name) {
        debugLog(`Using item directly via item.php: ${name} (ID: ${id})`);
        const token = getNSTStyleToken() || getPageCsrfToken(); // Get CSRF token
        if (token) {
            debugLog(`Using token: ${token.substring(0, 4)}...`);
            submitDrugUseRequest(id, name, token, false); // false indicates not faction drug
        } else {
            console.error('Drug Alerts: Failed to get authorization token for direct use.');
            showNotification(`Unable to use ${name}: Could not get authorization token`, 'error');
            sessionStorage.removeItem('drugUseInProgress'); // Clear progress flag
        }
    }

    // Method 2: Use faction armoury drug
    function tryFactionDrugUseMethod(id, name) {
        debugLog(`Attempting faction armoury drug use for ${name} (ID: ${id})`);
        sessionStorage.setItem('drugUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'faction' }));

        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');

        // If not on the correct page, navigate first
        if (!isFactionArmouryDrugsPage) {
            sessionStorage.setItem('pendingFactionDrugUse', JSON.stringify({ id, name })); // Store intent
            const targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=drugs';
            showNotification(`Navigating to faction armoury to use ${name}...`, 'info');
            window.location.href = targetUrl;
            return; // Stop execution here, will resume after navigation
        }

        // If already on the correct page, proceed with use attempt
        const token = getNSTStyleToken() || getPageCsrfToken();
        if (!token) {
            console.error('Drug Alerts: No CSRF token found for faction drug use.');
            showNotification('Unable to use faction drug: Authorization token not found', 'error');
            sessionStorage.removeItem('drugUseInProgress');
            return;
        }

        debugLog(`Using token for faction drug: ${token.substring(0, 4)}...`);
        // Attempt 1: Use item.php?fac=1 (often works directly)
        submitDrugUseRequest(id, name, token, true); // true indicates faction drug

        // Attempt 2 (Fallback): Use factions.php with armouryItemID (traditional method)
        // This is a fallback in case the item.php?fac=1 method fails silently or is blocked
        setTimeout(() => {
            if (sessionStorage.getItem('drugUseInProgress')) { // Check if flag is still set (meaning first attempt didn't clear it)
                debugLog('Direct faction method (item.php?fac=1) might have failed or is slow, trying traditional faction method.');
                useFactionDrugViaArmouryID(id, name, token);
            }
        }, 1500); // Wait a bit before trying the fallback
    }

    // Fallback logic for faction drugs: find armouryItemID and use factions.php
    function useFactionDrugViaArmouryID(itemId, itemName, token) {
        debugLog(`Using traditional faction drug method via factions.php: ${itemName} (Item ID: ${itemId})`);
        let armouryItemID = findArmouryItemId(itemId, itemName); // Find the specific ID used in the armoury DOM

        if (!armouryItemID) {
            debugLog('Could not find armouryItemID for traditional faction method. Aborting fallback.');
            // Don't clear drugUseInProgress here, let the timeout handle it or user retry
            showNotification(`Could not find ${itemName} in faction armoury list to use (fallback method).`, 'error');
            // Attempt to clear the flag after a delay, assuming it failed
            setTimeout(() => sessionStorage.removeItem('drugUseInProgress'), 2000);
            return;
        }

        debugLog(`Found armouryItemID: ${armouryItemID}. Submitting request to factions.php`);
        submitFactionArmouryRequest(armouryItemID, itemName, token);
    }

    // Helper to find the specific armoury item ID from the faction armoury page DOM
    function findArmouryItemId(targetItemId, targetItemName) {
       // Selectors covering various Torn UI structures for faction armoury items
       const itemSelectors = [
           '#armoury-drugs ul.item-list li[data-item]', // Older structure
           '#faction-armoury .drugs-wrap .item[data-id]', // Common structure
           'div[class*="armory"] div[class*="drugs"] div[class*="item"][data-id]', // React structure
           'li[data-armoryitemid]', // Another possible structure
           '.item-list-wrap ul li[id*="item"]' // More generic list item
       ];
       const drugItems = document.querySelectorAll(itemSelectors.join(', '));
       debugLog(`Found ${drugItems.length} potential drug items in armoury DOM.`);

       for (const item of drugItems) {
           // Check item ID first if available (more reliable)
           const domItemId = item.dataset.item || item.dataset.id || item.getAttribute('data-armoryitemid') || (item.id.includes('item') ? item.id.split('item')[1] : null);
           if (domItemId && parseInt(domItemId) === targetItemId) {
               debugLog(`Found matching item by ID ${targetItemId}. ArmouryItemID: ${domItemId}`);
               return domItemId; // Return the ID used in the DOM (might be armouryItemID or itemID)
           }

           // Fallback to checking name if ID match failed or wasn't available
           const nameSelectors = [
               '.name', '.title', '.item-name', '.name-wrap .t-overflow', // Common name elements
               '[class*="name"]', '[class*="title"]' // Class-based selectors
           ];
           const nameElements = item.querySelectorAll(nameSelectors.join(', '));
           let foundName = Array.from(nameElements).some(el => el && el.textContent.trim().toLowerCase() === targetItemName.toLowerCase());

           if (foundName) {
               // If name matches, try to extract the specific armouryItemID needed for the factions.php request
               const actionSelectors = [
                   'a[href*="armoryItemID="]', // Link with ID
                   'button[data-id]', // Button with ID
                   'a[onclick*="armoryItemAction"]', // Link with JS action
                   'div[data-id]' // Div with ID (React)
               ];
               const actionLinks = item.querySelectorAll(actionSelectors.join(', '));
               for (const actionLink of actionLinks) {
                   let match = null;
                   if (actionLink.href) match = actionLink.href.match(/armoryItemID=(\d+)/);
                   else if (actionLink.dataset && actionLink.dataset.id) match = [null, actionLink.dataset.id]; // Use data-id directly
                   else if (actionLink.onclick) match = actionLink.onclick.toString().match(/armoryItemAction\((\d+)/);

                   if (match && match[1]) {
                       debugLog(`Found matching item by name '${targetItemName}'. ArmouryItemID from action: ${match[1]}`);
                       return match[1]; // Return the extracted armouryItemID
                   }
               }
               // If no specific action link found, return the general item ID found earlier (less reliable for factions.php)
               if(domItemId) {
                   debugLog(`Found matching item by name '${targetItemName}'. Returning general DOM ID: ${domItemId}`);
                   return domItemId;
               }
           }
       }
       debugLog(`Could not find armouryItemID for ${targetItemName} (ID: ${targetItemId}) in the DOM.`);
       return null; // Not found
    }


    // --- Request Submission Functions ---

    // Submits request to item.php (for personal or faction drugs via fac=1)
    function submitDrugUseRequest(id, name, token, isFaction) {
        const endpoint = 'https://www.torn.com/item.php';
        const params = new URLSearchParams({
            step: 'useItem',
            confirm: 'yes', // Auto-confirm use
            itemID: id,
            csrf: token
        });
        if (isFaction) {
            params.append('fac', '1'); // Add fac=1 parameter for faction drugs
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // Important for Torn API
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            // Only clear the progress flag if this request was successful or resulted in a known state (like cooldown)
            let clearProgressFlag = false;
            if (this.status === 200) {
                try {
                    let response, isJson = false;
                    try { response = JSON.parse(this.responseText); isJson = true; } catch (e) { response = { text: this.responseText }; }
                    debugLog(`${isFaction ? 'Faction (item.php?fac=1)' : 'Direct'} use response:`, response);

                    // Check for success indicators
                    if ((isJson && (response.success || (response.text && (response.text.includes('consumed') || response.text.includes('used'))))) ||
                        (!isJson && (response.text.includes('consumed') || response.text.includes('used'))))
                    {
                        showNotification(`Used ${name}${isFaction ? ' from faction' : ''} successfully!`, 'success');
                        clearProgressFlag = true;
                    }
                    // Check for cooldown indicators
                    else if (response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait')))
                    {
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                        clearProgressFlag = true; // Cooldown is a final state for this attempt
                    }
                    // Handle errors or unexpected responses
                    else {
                        let errorMessage = `Unknown error using ${name}${isFaction ? ' (faction, item.php)' : ''}`;
                         if (isJson && (response.error || response.message || response.text)) {
                             const tempDiv = document.createElement('div');
                             tempDiv.innerHTML = response.error || response.message || response.text;
                             errorMessage = tempDiv.textContent || tempDiv.innerText || errorMessage;
                         } else if (!isJson && response.text) {
                             errorMessage = extractMeaningfulError(response.text) || errorMessage;
                         }
                         showNotification(`Error: ${errorMessage}`, 'error');
                         // Do not clear flag on unknown error, fallback might be needed for faction drugs
                         if (!isFaction) clearProgressFlag = true; // Clear flag for direct use errors
                    }
                } catch (e) {
                    debugLog('Error parsing response or unexpected non-JSON:', this.responseText.substring(0, 150));
                    // Basic text checks as fallback
                    if (this.responseText.includes('consumed') || this.responseText.includes('used')) {
                         showNotification(`Used ${name}${isFaction ? ' from faction' : ''} successfully! (Parsed from text)`, 'success');
                         clearProgressFlag = true;
                    } else if (this.responseText.includes('cooldown') || this.responseText.includes('wait') || this.responseText.includes('effect of a drug')) {
                         let cooldownMessage = extractCooldownMessage(this.responseText) || 'You are on drug cooldown';
                         showNotification(cooldownMessage, 'info');
                         clearProgressFlag = true;
                    } else {
                         showNotification(`Unable to use ${name}: Unexpected response format`, 'error');
                         if (!isFaction) clearProgressFlag = true;
                    }
                }
            } else {
                // Handle HTTP errors
                showNotification(`Unable to use ${name}: Request failed (${this.status})`, 'error');
                if (!isFaction) clearProgressFlag = true; // Clear flag for direct use errors
            }

            // Clear the flag if the request resolved to a known state
            if (clearProgressFlag) {
                sessionStorage.removeItem('drugUseInProgress');
                debugLog("Cleared drugUseInProgress flag after item.php request.");
            } else if (isFaction) {
                debugLog("item.php?fac=1 request didn't resolve clearly, fallback might proceed.");
            }
        };

        xhr.onerror = function() {
            showNotification(`Unable to use ${name}: Network error`, 'error');
            // Clear flag on network error as well, user needs to retry manually
            sessionStorage.removeItem('drugUseInProgress');
            debugLog("Cleared drugUseInProgress flag due to network error.");
        };

        xhr.send(params.toString());
    }

    // Submits request to factions.php (traditional faction armoury use)
    function submitFactionArmouryRequest(armouryItemID, name, token) {
        const endpoint = 'https://www.torn.com/factions.php';
        const params = new URLSearchParams({
            step: 'armoryItemAction',
            confirm: 'yes',
            armoryItemID: armouryItemID,
            action: 'use',
            csrf: token
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            // Always clear the progress flag after this fallback attempt, regardless of outcome
            sessionStorage.removeItem('drugUseInProgress');
            debugLog("Cleared drugUseInProgress flag after factions.php fallback request.");

            if (this.status === 200) {
                try {
                    let response, isJson = false;
                    try { response = JSON.parse(this.responseText); isJson = true; } catch (e) { response = { text: this.responseText }; }
                    debugLog('Faction traditional (factions.php) response:', response);

                    // Check success
                    if ((isJson && (response.success || (response.message && response.message.includes('used')))) ||
                        (!isJson && (response.text.includes('used') || response.text.includes('consumed'))))
                    {
                        showNotification(`Used ${name} from faction armoury successfully! (Fallback)`, 'success');
                    }
                    // Check cooldown
                    else if (response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait')))
                    {
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                    }
                    // Handle errors
                    else {
                        let errorMessage = `Unknown error using ${name} (faction, fallback)`;
                        if (isJson && (response.error || response.message)) {
                             errorMessage = response.error || response.message;
                        } else if (!isJson && response.text) {
                             errorMessage = extractMeaningfulError(response.text) || errorMessage;
                        }
                        showNotification(`Error: ${errorMessage}`, 'error');
                    }
                } catch (e) {
                    showNotification('Error using faction drug: Response processing error (Fallback)', 'error');
                    debugLog("Error processing factions.php response:", e);
                }
            } else {
                showNotification(`Error using faction drug: Request failed (${this.status}) (Fallback)`, 'error');
            }
        };

        xhr.onerror = function() {
            sessionStorage.removeItem('drugUseInProgress'); // Ensure flag is cleared on network error
            showNotification('Error using faction drug: Network error (Fallback)', 'error');
            debugLog("Cleared drugUseInProgress flag due to network error in fallback.");
        };

        xhr.send(params.toString());
    }

    // --- Utility Functions ---

    // Extracts a more user-friendly error message from HTML response text
    function extractMeaningfulError(responseText) {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = responseText;
            // Look for common error message containers
            const errorEl = tempDiv.querySelector('.error, .msg.error, .message.error, .messages .error, div[class*="error"], p[class*="error"]');
            if (errorEl) {
                let message = (errorEl.textContent || errorEl.innerText || '').replace(/\s+/g, ' ').trim();
                if (message) return message;
            }
            // Fallback: Get first significant text block if no specific error element found
            let textContent = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();
            if (textContent.length > 5 && textContent.length < 150) return textContent; // Basic sanity check
        } catch(e) { /* ignore parsing errors */ }
        return null; // Indicate no meaningful message found
    }


    // Extracts cooldown time or message from response text
    function extractCooldownMessage(responseText) {
        if (!responseText) return null;
        try {
            // 1. Check for data-time attribute (most reliable)
            const timeMatch = responseText.match(/data-time=["']?(\d+)["']?/);
            if (timeMatch && timeMatch[1]) {
                const seconds = parseInt(timeMatch[1]);
                if (seconds > 0) {
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = seconds % 60;
                    return `Drug Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
                }
            }

            // 2. Check for specific text patterns (e.g., "wait X m Y s")
            const timeMatch2 = responseText.match(/wait\s+(\d+)\s*m\s+(\d+)\s*s/i);
            if (timeMatch2 && timeMatch2[1] && timeMatch2[2]) {
                const seconds = parseInt(timeMatch2[1]) * 60 + parseInt(timeMatch2[2]);
                if (seconds > 0) return `Drug Cooldown: ${timeMatch2[1]}m ${timeMatch2[2]}s remaining`;
            }
            const timeMatch3 = responseText.match(/wait\s+(\d+)\s+seconds?/i);
            if (timeMatch3 && timeMatch3[1]) {
                 const seconds = parseInt(timeMatch3[1]);
                 if (seconds > 0) return `Drug Cooldown: ${seconds}s remaining`;
            }
             const timeMatch4 = responseText.match(/wait\s+(\d+)\s+minutes?/i);
             if (timeMatch4 && timeMatch4[1]) {
                 const minutes = parseInt(timeMatch4[1]);
                 if (minutes > 0) return `Drug Cooldown: ${minutes}m 0s remaining`;
             }

            // 3. Extract general message from common containers if no time found
            const tempDiv = document.createElement('div'); tempDiv.innerHTML = responseText;
            const messageEl = tempDiv.querySelector('.message, .msg, .cont_gray, div[class*="cooldown"]'); // Look in message containers
            if (messageEl) {
                 let textContent = (messageEl.textContent || messageEl.innerText || '').replace(/\s+/g, ' ').trim();
                 // Only return if it seems like a cooldown message
                 if (textContent.toLowerCase().includes('cooldown') || textContent.toLowerCase().includes('wait') || textContent.toLowerCase().includes('effect of a drug')) {
                     if (textContent.length > 100) textContent = textContent.substring(0, 100) + '...'; // Truncate long messages
                     return textContent;
                 }
            }
        } catch(e) { debugLog("Error extracting cooldown message:", e); }

        // 4. Final fallback if nothing specific found but cooldown is suspected
        if (responseText.toLowerCase().includes('cooldown') || responseText.toLowerCase().includes('wait')) {
            return 'You are on drug cooldown';
        }

        return null; // No cooldown message extracted
    }

    // Displays temporary notifications
    function showNotification(message, type = 'info') {
        // Remove any existing notification first
        document.querySelectorAll('.drug-notification').forEach(note => note.remove());

        const notification = document.createElement('div');
        notification.className = `drug-notification ${type}`;

        // Basic HTML stripping for safety and clarity
        let cleanMessage = message;
        if (message.includes('<') && message.includes('>')) {
            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = message;
                cleanMessage = tempDiv.textContent || tempDiv.innerText || message;
            } catch (e) { /* ignore potential errors */ }
        }
        cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim(); // Normalize whitespace

        // Special formatting for cooldown messages
        if (cleanMessage.toLowerCase().includes('cooldown')) {
             notification.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">Drug Cooldown Active</div><div>${cleanMessage}</div>`;
             notification.style.minWidth = '280px'; notification.style.padding = '15px 25px';
        } else {
             notification.textContent = cleanMessage;
        }

        document.body.appendChild(notification);

        // Animate entrance
        notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
        notification.style.opacity = '0';
        void notification.offsetWidth; // Trigger reflow
        requestAnimationFrame(() => {
            notification.style.transform = 'translate(-50%, -50%) scale(1)';
            notification.style.opacity = '1';
        });

        // Determine duration based on type
        const duration = (type === 'error' || type === 'info') ? 7000 : 4000; // Longer for errors/info

        // Animate exit and remove element
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            // Remove after transition finishes
            notification.addEventListener('transitionend', () => notification.remove(), { once: true });
        }, duration);

        debugLog(`Notification [${type}]: ${cleanMessage}`);
    }

    // --- Token Retrieval ---

    // Tries to get RFC token first (often needed for item use)
    function getNSTStyleToken() {
        try { const rfcCookie = getRFC(); if (rfcCookie) return rfcCookie; } catch (e) {}
        return null; // Fallback handled by getPageCsrfToken if this fails
    }

    // Extracts CSRF token from various potential locations on the page
    function extractTokenFromPage() {
        try {
            // 1. Check window object (common in modern Torn)
            if (typeof window.csrf !== 'undefined' && window.csrf) return window.csrf;

            // 2. Check jQuery cookie (if jQuery is loaded)
            if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
                const c = $.cookie('csrf'); if(c) return c;
            }

            // 3. Check common input fields
            const inputs = document.querySelectorAll('input[name="csrf"], input[name="X-Csrf-Token"], input[data-csrf]');
            for (const input of inputs) { const t = input.value || input.dataset?.csrf; if(t) return t; }

            // 4. Scan inline scripts for token patterns
            const patterns = [
                /["']csrf["']\s*:\s*["']([a-f0-9]{16,})["']/, // JSON-like
                /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, // Variable assignment
                /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, // Window assignment
                /value=["']([a-f0-9]{16,})["']\s*name=["']csrf["']/ // Input value attribute
            ];
            const scripts = document.querySelectorAll('script:not([src])'); // Only inline scripts
            for (const script of scripts) {
                if (!script.textContent) continue;
                for (const p of patterns) {
                    const m = script.textContent.match(p);
                    if(m && m[1]) return m[1];
                }
            }

            // 5. Check meta tag
            const meta = document.querySelector('meta[name="csrf-token"]');
            if(meta && meta.content) return meta.content;

        } catch (e) { console.error("Drug Alerts: Error extracting CSRF token", e); }
        debugLog("Could not find CSRF token on page.");
        return null; // Not found
    }

    // Primary function to get CSRF token, uses extractor
    function getPageCsrfToken() { return extractTokenFromPage(); }

    // Gets RFC value from cookies
    function getRFC() {
        // Prefer jQuery if available
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const c = $.cookie('rfc_v'); if(c) return c;
        }
        // Manual cookie parsing as fallback
        try {
            const cs = document.cookie.split('; ');
            for (const c of cs) {
                const [n, v] = c.split('=');
                if(n === 'rfc_v') return decodeURIComponent(v); // Decode potentially encoded value
            }
        } catch (e) { console.error("Drug Alerts: Error reading RFC cookie", e); }
        return null;
    }

    // --- Cooldown Detection ---

    // Checks if a drug cooldown icon/status is present
    function hasDrugCooldown() {
        // Most reliable check first (specific aria-label)
        if (document.querySelector("[aria-label^='Drug Cooldown:']")) return true;

        // Check various status icon containers and attributes
        const iconSelectors = [
            '.status-icons__wrap a', // Header icons
            '.status-icons li', // Alternative header icons
            '.user-icons__wrap a', // User bar icons
            '[class*="statusIcon"]', // Generic status icon class
            'a[href*="tab=buffs"]', // Link to buffs page (less specific)
            'img[src*="drug"]', // Image source containing 'drug' (less reliable)
        ];
        const icons = document.querySelectorAll(iconSelectors.join(', '));

        for (const icon of icons) {
            const label = (icon.getAttribute('aria-label') || icon.getAttribute('title') || '').toLowerCase();
            const cl = icon.classList.toString().toLowerCase();

            // Check for explicit "Drug Cooldown" text
            if (label.includes('drug') && label.includes('cooldown')) return true;

            // Check for common class names AND confirm text to avoid matching other cooldowns (e.g., booster)
            if ((cl.includes('icon5') || cl.includes('drug') || cl.includes('cooldown')) && label.includes('drug')) {
                 return true;
            }
        }
        return false; // No cooldown detected
    }

    // --- Data Fetching ---

    // Fetches the list of available drugs from the user's item page
    function fetchDrugs() {
        return new Promise((resolve) => {
            debugLog("Fetching drug list from item.php...");
            fetch('https://www.torn.com/item.php')
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const drugItems = [];

                    // Primary selector strategy: Look for items within the "Drugs" category list
                    const drugCategoryList = doc.querySelector('#item-market-main-wrap ul[data-category="Drugs"], ul.items-list[data-category="Drugs"]');
                    let items = [];
                    if (drugCategoryList) {
                        items = drugCategoryList.querySelectorAll('li[data-item]');
                        debugLog(`Found ${items.length} items using primary selector.`);
                    }

                    // Fallback strategy: Look for items with drug category attribute anywhere
                    if (items.length === 0) {
                        items = doc.querySelectorAll('.item-info-wrap[data-category="Drugs"], .item-cont[data-item][data-category="Drugs"], li[data-item][data-category="Drugs"]');
                        debugLog(`Found ${items.length} items using fallback selector.`);
                    }

                    items.forEach(item => {
                        try {
                            const id = item.dataset.item ? parseInt(item.dataset.item) : null;
                            // Find name using multiple potential selectors within the item
                            const nameElem = item.querySelector('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"], [class*="title"]');
                            const name = nameElem ? nameElem.textContent.trim() : null;

                            // Validate against the fallback list to ensure it's a known usable drug
                            if (id && name && fallbackDrugs.some(fb => fb.id === id && fb.name === name)) {
                                // Add only if not already present (handles potential duplicates from selectors)
                                if (!drugItems.some(existing => existing.id === id)) {
                                    drugItems.push({ id, name });
                                }
                            } else if (id && name) {
                                // Log if an item in the category wasn't in the fallback list (might be new/unusable)
                                // debugLog(`Item '${name}' (ID: ${id}) found in Drugs category but not in fallback list.`);
                            }
                        } catch (e) {
                            console.error("Drug Alerts: Error processing an item element:", e, item);
                        }
                    });

                    // Ensure unique entries by ID
                    const uniqueDrugs = Array.from(new Map(drugItems.map(item => [item.id, item])).values());

                    if (uniqueDrugs.length > 0) {
                        debugLog(`Successfully fetched and parsed ${uniqueDrugs.length} unique drugs.`, uniqueDrugs.map(d=>d.name));
                        resolve(uniqueDrugs);
                    } else {
                        console.warn('Drug Alerts: Could not parse any drugs from item page, using fallback list.');
                        resolve([...fallbackDrugs]); // Resolve with fallback if parsing failed
                    }
                })
                .catch(error => {
                    console.error('Drug Alerts: Error fetching or parsing drugs from item.php:', error);
                    resolve([...fallbackDrugs]); // Resolve with fallback on any fetch/parse error
                });
        });
    }

    // --- Initialization and Monitoring ---

    function startCooldownChecks() {
        let lastCooldownStatus = null; // Track previous status
        let checkInterval = 30000; // Default 30s check interval
        let intervalId = null; // Stores timeout ID
        let observer = null; // Stores MutationObserver instance

        const checkCooldown = () => {
            const hasCooldown = hasDrugCooldown(); // Check current status

            if (hasCooldown !== lastCooldownStatus) {
                debugLog(`Cooldown status changed: ${lastCooldownStatus} -> ${hasCooldown}`);
                lastCooldownStatus = hasCooldown;

                if (!hasCooldown) {
                    // Cooldown finished or wasn't active
                    if (!alertElements) { // Only create alert if it doesn't exist
                        alertElements = createAlert(drugList);
                        debugLog("Cooldown ended/inactive, created alert.");
                    }
                    checkInterval = 30000; // Switch to less frequent checks
                } else {
                    // Cooldown started or is still active
                    if (alertElements) { // Remove alert if it exists
                        removeExistingAlerts();
                        debugLog("Cooldown active, removed alert.");
                    }
                    checkInterval = 5000; // Check more frequently when on cooldown
                }

                // Clear existing timeout and set a new one with the updated interval
                clearTimeout(intervalId);
                intervalId = setTimeout(checkCooldown, checkInterval);
                debugLog(`Rescheduled cooldown check in ${checkInterval / 1000}s`);

            } else {
                // Status hasn't changed, just reschedule the check
                 clearTimeout(intervalId);
                 intervalId = setTimeout(checkCooldown, checkInterval);
            }
        };

        // Initial check shortly after page load
        setTimeout(checkCooldown, 1500);

        // Use MutationObserver for faster detection of cooldown icon changes
        try {
            observer = new MutationObserver((mutations) => {
                // Check if any mutation affects relevant elements (status icons, aria-labels)
                const relevantMutation = mutations.some(m => {
                    const target = m.target;
                    // Check if target itself is relevant or if added/removed nodes are
                    if (target && target.nodeType === 1) {
                         if (target.closest('.status-icons__wrap, .user-icons__wrap, #status-icons, #user-icons') || target.matches('[aria-label*="Cooldown"]')) return true;
                    }
                    return Array.from(m.addedNodes).concat(Array.from(m.removedNodes)).some(n =>
                        n.nodeType === 1 && (n.matches('[aria-label*="Cooldown"]') || n.querySelector('[aria-label*="Cooldown"]'))
                    );
                });

                // If a relevant change occurred, check cooldown status immediately
                if (relevantMutation) {
                    debugLog("MutationObserver detected relevant change, checking cooldown status...");
                    clearTimeout(intervalId); // Cancel scheduled check
                    checkCooldown(); // Check now
                }
            });

            // Observe the body for broad changes, filtering relevant ones in the callback
            // This is more robust than observing specific icon containers which might change
            const targetNode = document.body;
            if (targetNode) {
                observer.observe(targetNode, {
                    childList: true, // Watch for added/removed nodes
                    subtree: true, // Watch descendants
                    attributes: true, // Watch attribute changes
                    attributeFilter: ['class', 'aria-label', 'title', 'style'] // Focus on relevant attributes
                });
                debugLog("MutationObserver attached to body.");
            } else {
                 console.error("Drug Alerts: Could not find body element to attach MutationObserver.");
            }
        } catch (e) {
            console.error("Drug Alerts: Failed to set up MutationObserver", e);
            // The interval check will still function as a fallback
        }

        console.log('%c Drug Alerts Initialized %c v1.1.2 ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px 0 0 3px;', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 0 3px 3px 0;');
    }

    // Handles actions needed after page navigation (e.g., opening GUI, using pending drug)
    function checkForPendingDrugUse() {
        try {
            const fromAlert = sessionStorage.getItem('fromDrugAlert');
            const pendingFactionUse = sessionStorage.getItem('pendingFactionDrugUse');
            const drugUseInProgress = sessionStorage.getItem('drugUseInProgress');

            // Clear stale progress flag if it exists (should have been cleared by request handlers)
            if (drugUseInProgress) {
                const progressData = JSON.parse(drugUseInProgress);
                // Clear if older than ~10 seconds to prevent stale flags
                if (Date.now() - (progressData.timestamp || 0) > 10000) {
                    debugLog("Clearing potentially stale drugUseInProgress flag.");
                    sessionStorage.removeItem('drugUseInProgress');
                }
            }

            // Case 1: Navigated from alert click to show GUI
            if (fromAlert) {
                sessionStorage.removeItem('fromDrugAlert'); // Clear flag
                const isItemsPage = window.location.href.includes('torn.com/item.php');
                const isFacDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
                const onCorrectPageForGui = (isItemsPage && !useFactionDrugs) || (isFacDrugsPage && useFactionDrugs);

                if (onCorrectPageForGui) {
                    debugLog("Arrived at target page from alert click, attempting to show GUI.");
                    // Delay showing GUI slightly to allow page elements to render
                    setTimeout(() => {
                        if (drugList && drugList.length > 0 && !hasDrugCooldown()) {
                            removeExistingAlerts(); // Ensure clean state
                            alertElements = createAlert(drugList); // Recreate alert structure
                            if (alertElements && alertElements.gui) {
                                alertElements.gui.style.display = 'block'; // Show the GUI
                                const searchInput = alertElements.gui.querySelector('.drug-search');
                                if (searchInput) searchInput.focus(); // Focus search input
                                debugLog("Drug selection GUI opened automatically.");
                            } else {
                                debugLog("Failed to open GUI automatically (alert/GUI elements not found).");
                            }
                        } else {
                             debugLog("Conditions not met to open GUI automatically (no drugs, on cooldown, or list empty).");
                        }
                    }, 1200); // Adjust delay as needed
                } else {
                     debugLog("Arrived at page from alert click, but not the correct page for GUI based on settings.");
                }
            }
            // Case 2: Navigated to use a pending faction drug
            else if (pendingFactionUse) {
                 const isFacDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
                 if (isFacDrugsPage) {
                     debugLog("Arrived at faction armoury page with pending drug use.");
                     try {
                         const pendingUse = JSON.parse(pendingFactionUse);
                         if (pendingUse.id && pendingUse.name) {
                             sessionStorage.removeItem('pendingFactionDrugUse'); // Clear flag
                             // Delay use slightly to ensure page/scripts are ready
                             setTimeout(() => {
                                 showNotification(`Attempting to use pending drug: ${pendingUse.name}...`, 'info');
                                 useDrug(pendingUse.id, pendingUse.name); // Initiate the use action
                             }, 1000);
                         } else {
                             console.error("Drug Alerts: Invalid pending faction use data.", pendingFactionUse);
                             sessionStorage.removeItem('pendingFactionDrugUse');
                         }
                     } catch (e) {
                         console.error("Drug Alerts: Error parsing pending faction use data.", e);
                         sessionStorage.removeItem('pendingFactionDrugUse');
                     }
                 } else {
                      debugLog("Pending faction drug use exists, but not on the faction armoury drugs page yet.");
                      // Keep the flag, might be navigating still
                 }
            }
        } catch (e) {
            console.error('Drug Alerts: Error checking for pending actions:', e);
            // Clear flags in case of error to prevent loops
            sessionStorage.removeItem('drugUseInProgress');
            sessionStorage.removeItem('fromDrugAlert');
            sessionStorage.removeItem('pendingFactionDrugUse');
        }
    }

    // Removes the main alert button and its associated GUI, plus customization popups
    function removeExistingAlerts() {
        document.querySelectorAll('.drug-alert, .drug-gui, #drug-customization-ui, #add-drugs-ui')
            .forEach(el => el.remove());
        alertElements = null; // Reset the reference
        debugLog("Removed existing alert/GUI elements.");
    }

    // Main initialization function
    function initialize() {
        // Load settings
        useFactionDrugs = localStorage.getItem('useFactionDrugs') === 'true';
        debugLog(`Initializing Drug Alerts. Use Faction Drugs: ${useFactionDrugs}`);

        // Clean up any potentially leftover UI elements from previous loads/errors
        removeExistingAlerts();
        document.querySelectorAll('#drug-customization-ui, #add-drugs-ui').forEach(el => el.remove());

        // Check for actions pending from previous page (navigation)
        checkForPendingDrugUse();

        // Fetch the drug list, then add UI elements and start monitoring
        fetchDrugs().then(fetchedDrugs => {
            drugList = fetchedDrugs; // Store the fetched or fallback list
            addQuickUseButtons(); // Add the quick use panel (if on relevant page)
            startCooldownChecks(); // Start monitoring cooldown status and manage alert display
        }).catch(err => {
             // This catch is unlikely to be hit due to fetchDrugs resolving with fallback
             console.error("Drug Alerts: Critical error during initial drug fetch promise:", err);
             drugList = [...fallbackDrugs]; // Ensure fallback list is set
             addQuickUseButtons();
             startCooldownChecks(); // Start checks even if fetch failed catastrophically
        });
    }

    // --- Script Entry Point ---

    // Ensure DOM is ready before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize(); // DOM is already ready
    }

})();
