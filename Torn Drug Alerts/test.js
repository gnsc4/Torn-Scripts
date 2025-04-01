// ==UserScript==
// @name         Torn Drug Alert
// @version      1.0.20 // Updated version number
// @description  Alerts when no drug cooldown is active and allows taking drugs from any page
// @author       GNSC4 [268863] (Corrections by Gemini)
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

    // Add CSS
    GM_addStyle(`
        .drug-alert {
            background-color: #ff3333;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            cursor: pointer;
            margin-left: 15px;
            display: inline-flex;
            align-items: center;
            font-size: 12px;
        }

        .drug-gui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #222;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 99999999;
            width: 350px;
            max-height: 500px;
            overflow-y: auto;
            display: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7);
            border: 1px solid #444;
        }

        .drug-gui h3 {
            margin-top: 0;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }

        .drug-search {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #444;
            background-color: #333;
            color: white;
            border-radius: 3px;
        }

        .drug-search::placeholder {
            color: #aaa;
        }

        .drug-list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
        }

        .drug-item {
            background-color: #333;
            padding: 12px;
            border-radius: 5px;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 14px;
            font-weight: bold;
        }

        .drug-item:hover {
            background-color: #444;
        }

        .drug-notification {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 999999;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
            opacity: 1;
            transition: opacity 0.5s, transform 0.3s ease-out; /* Added transform transition */
            text-align: center;
            min-width: 250px;
            max-width: 80%;
            pointer-events: none;
        }

        .drug-notification.success {
            background-color: rgba(76, 175, 80, 0.9);
            border: 1px solid #4CAF50;
        }

        .drug-notification.error {
            background-color: rgba(244, 67, 54, 0.9);
            border: 1px solid #f44336;
        }

        .drug-notification.info {
            background-color: rgba(33, 150, 243, 0.9);
            border: 1px solid #2196F3;
        }

        .settings-section {
            margin-top: 15px;
            padding: 10px;
            background-color: #333;
            border-radius: 5px;
            border: 1px solid #444;
        }

        .settings-toggle {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .settings-toggle label {
            margin-left: 8px;
            cursor: pointer;
        }

        .settings-toggle input[type="checkbox"] {
            cursor: pointer;
        }
        /* Quick Use Styles */
        .quick-use-container {
            position: fixed;
            top: 100px; /* Adjust as needed */
            right: 20px;
            background-color: rgba(34, 34, 34, 0.8);
            padding: 10px;
            border-radius: 5px;
            z-index: 9998; /* Below main GUI */
            display: flex;
            flex-direction: column;
            gap: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .drug-quick-button {
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
            margin-bottom: 5px; /* Spacing */
            text-align: center;
            transition: background-color 0.2s;
        }
        .drug-quick-button:hover {
            filter: brightness(1.2);
        }
        .drug-settings-button {
            background-color: #555;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 5px;
            text-align: center;
            font-size: 12px;
            transition: background-color 0.2s;
        }
        .drug-settings-button:hover {
            background-color: #666;
        }
        .quick-use-toggle-button {
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #f44336; /* Red */
            color: white;
            border: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        /* Customization UI Styles */
        #drug-customization-ui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #222;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999998;
            width: 350px;
            max-height: 500px;
            overflow-y: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7);
            border: 1px solid #444;
        }
        #drug-customization-ui h3 {
            margin-top: 0;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }
        #drug-customization-ui p {
            margin-bottom: 15px;
            font-size: 14px;
        }
        .drug-selection-area {
            margin-bottom: 15px;
            border: 1px solid #444;
            border-radius: 5px;
            padding: 10px;
            max-height: 250px; /* Limit height */
            overflow-y: auto; /* Enable scrolling */
        }
        .drug-selection-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            background-color: #333;
            border-radius: 4px;
            cursor: move;
        }
        .drug-selection-item span:first-of-type { /* Drag handle */
            margin-right: 10px;
            cursor: move;
            user-select: none;
        }
        .drug-selection-item input[type="checkbox"] {
            margin-right: 5px;
        }
        .drug-selection-item span:nth-of-type(2) { /* Name */
            flex-grow: 1;
        }
        .drug-selection-item input[type="color"] {
            width: 25px;
            height: 25px;
            border: none;
            background: none;
            cursor: pointer;
            vertical-align: middle;
            margin-left: 10px;
        }
        .customization-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            flex-grow: 1;
            margin: 0 5px;
            transition: background-color 0.2s;
        }
        .customization-button.cancel {
            background-color: #777;
        }
        .customization-button.add {
            width: 100%;
            margin-bottom: 15px;
        }
        .customization-button:hover {
            filter: brightness(1.1);
        }
        .customization-button-container {
            display: flex;
            justify-content: space-between;
        }
        /* Add Drugs UI Styles */
        #add-drugs-ui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #222;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 99999999; /* Higher z-index */
            width: 350px;
            max-height: 500px;
            overflow-y: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7);
            border: 1px solid #444;
        }
        #add-drugs-ui h3 {
            margin-top: 0;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }
        #add-drugs-ui input[type="text"] {
            width: calc(100% - 16px);
            padding: 8px;
            margin-bottom: 10px;
            background-color: #333;
            border: 1px solid #444;
            border-radius: 4px;
            color: white;
        }
        .add-drug-list-container {
            margin-bottom: 15px;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 5px;
        }
        .add-drug-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            background-color: #333;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .add-drug-item.selected {
            background-color: #444;
        }
        .add-drug-item input[type="checkbox"] {
            margin-right: 10px;
        }
        .add-drug-item span {
            flex-grow: 1;
        }
        .add-drugs-button-container {
            display: flex;
            justify-content: flex-end; /* Align button to the right */
        }
        .add-drugs-done-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .add-drugs-done-button:hover {
            filter: brightness(1.1);
        }
    `);
    // Fallback drug list in case fetch fails - IDs should be correct
    const fallbackDrugs = [
        { id: 196, name: "Cannabis" },
        { id: 197, name: "Ecstasy" },
        { id: 198, name: "Ketamine" },
        { id: 199, name: "LSD" },
        { id: 200, name: "Opium" },
        { id: 201, name: "PCP" },
        { id: 203, name: "Shrooms" },
        { id: 204, name: "Speed" },
        { id: 205, name: "Vicodin" },
        { id: 206, name: "Xanax" }
    ];

    let alertElements = null;
    let drugList = []; // Will hold our drugs
    let useFactionDrugs = false; // New setting for faction drugs

    // Add debug mode toggle and log function
    let DEBUG_MODE = true; // Set to true to see verbose logging in console

    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[DrugAlerts Debug]', ...args);
        }
    }

    function positionDrugAlert(alert, header) {
        // Special handling for ALL forum pages
        if (window.location.href.includes('forums.php')) {
            // Find the links-top-wrap element in various forum page layouts
            const linksWrap = document.querySelector('.links-top-wrap');

            if (linksWrap) {
                // For forum pages, add the alert before the first navigation item
                const firstLink = linksWrap.querySelector('a');

                if (firstLink) {
                    // Insert before the first link for better spacing
                    linksWrap.insertBefore(alert, firstLink);
                } else {
                    // Fallback: append to the links-top-wrap
                    linksWrap.appendChild(alert);
                }

                alert.style.cssText = `
                    display: inline-flex !important;
                    align-items: center !important;
                    margin-right: 10px !important;
                    margin-left: 10px !important;
                    order: 1 !important; /* Adjust order if needed */
                    z-index: 99999 !important;
                    pointer-events: auto !important;
                    vertical-align: middle !important;
                    float: right !important; /* Position to the right */
                    /* Inherit styles from GM_addStyle */
                    background-color: #ff3333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 12px;
                `;
                return;
            }
        }

        // Original code for non-forum pages
        header.appendChild(alert);

        alert.style.cssText = `
            display: inline-flex !important;
            align-items: center !important;
            margin-left: 10px !important;
            order: 2 !important; /* Adjust order if needed */
            z-index: 99999 !important;
            pointer-events: auto !important;
            /* Inherit styles from GM_addStyle */
            background-color: #ff3333;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
        `;

        const isMobilePDA = navigator.userAgent.includes('PDA') ||
                              window.innerWidth < 768 ||
                              document.documentElement.classList.contains('tornPDA');

        if (isMobilePDA) {
            alert.style.fontSize = '10px';
            alert.style.padding = '3px 6px';
            alert.style.marginLeft = '5px';
        }

        if (header.id === 'torn-drug-fixed-header') {
            alert.style.margin = '0';
            alert.style.marginLeft = '5px';
        }
    }


    function findHeader() {
        const possibleHeaders = [
            document.querySelector('.appHeader___gUnYC'), // Modern Torn UI
            document.querySelector('.content-title'), // Common title container
            document.querySelector('.tutorial-cont'), // Tutorial pages
            document.querySelector('.cont-gray'), // Some older pages
            document.querySelector('.content-wrapper .header'), // Wrapper headers
            document.querySelector('.content-wrapper .title-black'), // Wrapper titles
            document.querySelector('.captionWithActionContainment___nVTbE'), // React component
            document.querySelector('.pageTitle___CaFrO'), // React component
            document.querySelector('.sortable-list .title'), // List titles
            document.querySelector('.topSection___CvKvI'), // React component
            document.querySelector('.mainStatsContainer___TXO7F'), // Stats container
            document.querySelector('div[role="heading"]'), // Generic heading role
            document.querySelector('#mainContainer > div.content-wrapper.winter > div.content-title.m-bottom10 h4'), // Specific winter theme
            document.querySelector('.titleContainer___QrlWP .title___rhtB4'), // React component
            document.querySelector('div.content-title h4'), // Common title h4
            document.querySelector('.title-black'), // Another common title class
            document.querySelector('.clearfix .t-black'), // Clearfix titles
            document.querySelector('.page-head > h4'), // Page head h4
            document.querySelector('#react-root > div > div.appHeader___gUnYC.crimes-app-header > h4'), // Crimes page header
            document.querySelector('div.appHeader___gUnYC h4'), // Generic app header h4
            document.querySelector('#skip-to-content'), // Accessibility link (sometimes used as anchor)
            document.querySelector('.header-title'), // Generic header title
            document.querySelector('.mobile-title'), // Mobile specific title
            document.querySelector('.app-header'), // Generic app header
            // Enhanced forum page selectors
            document.querySelector('.content-title.m-bottom10'), // Forum list title
            document.querySelector('.forum-thread-wrap header'), // Thread page header
            document.querySelector('.forum-post-reply'),  // Reply area on thread pages
            document.querySelector('.forums-subcats'), // Forum subcategories container
            document.querySelector('.forums-threadList') // Thread list container
        ];

        // First try to find any of the standard headers
        const foundHeader = possibleHeaders.find(header => header !== null);

        // If we're on a forum page, make sure we properly handle it
        if (!foundHeader && window.location.href.includes('forums.php')) {
             // Try the specific forum links wrapper first
             const linksWrap = document.querySelector('.links-top-wrap');
             if (linksWrap) {
                 debugLog('Found forum links-top-wrap as header');
                 return linksWrap; // Use this for positioning on forums
             }
             // If linksWrap not found, create a fixed header as fallback on forums
             debugLog('No standard header found on forum page, creating fixed header');
             return createFixedHeader();
        }

        if (!foundHeader) {
            debugLog('No suitable header found on page, creating fixed header');
            return createFixedHeader();
        }

        debugLog('Found header element:', foundHeader);
        return foundHeader;
    }

    function createFixedHeader() {
        let fixedHeader = document.getElementById('torn-drug-fixed-header');

        if (!fixedHeader) {
            fixedHeader = document.createElement('div');
            fixedHeader.id = 'torn-drug-fixed-header';
            fixedHeader.style.position = 'fixed';
            fixedHeader.style.top = '50px'; // Adjust as needed
            fixedHeader.style.right = '20px';
            fixedHeader.style.zIndex = '9999';
            fixedHeader.style.backgroundColor = 'rgba(34, 34, 34, 0.8)';
            fixedHeader.style.padding = '5px 10px';
            fixedHeader.style.borderRadius = '5px';
            fixedHeader.style.display = 'flex';
            fixedHeader.style.alignItems = 'center';
            fixedHeader.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            document.body.appendChild(fixedHeader);
            debugLog('Created fixed header element');
        }

        return fixedHeader;
    }

    function createAlert(drugs) {
        let header = findHeader(); // Find or create the header first

        // Always remove existing alert and GUI to prevent duplicates
        removeExistingAlerts();

        // Create simple alert that uses direct DOM manipulation
        const alert = document.createElement('div');
        alert.className = 'drug-alert'; // Use class for styling from GM_addStyle
        alert.textContent = 'No Drugs';
        // Styles like cursor, background-color are handled by CSS

        // Position the alert using the found or created header
        positionDrugAlert(alert, header);

        // Check if we're on the correct pages
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') &&
                                          window.location.href.includes('armoury') &&
                                          window.location.href.includes('sub=drugs');
        const isOtherFactionPage = window.location.href.includes('factions.php') &&
                                   (!window.location.href.includes('armoury') ||
                                    !window.location.href.includes('sub=drugs'));

        debugLog(`Page check - Items: ${isItemsPage}, Faction Armoury Drugs: ${isFactionArmouryDrugsPage}, Other Faction: ${isOtherFactionPage}`);

        // Create GUI only if on the appropriate page
        let gui = null;
        if ((isItemsPage && !useFactionDrugs) || (isFactionArmouryDrugsPage && useFactionDrugs)) {
            // Create the drug GUI
            gui = document.createElement('div');
            gui.className = 'drug-gui'; // Use class for styling
            gui.id = 'drugGui';
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
            // Styles are handled by CSS

            document.body.appendChild(gui);

            // Add event listener for faction drugs checkbox
            const factionDrugsCheckbox = gui.querySelector('#useFactionDrugs');
            if (factionDrugsCheckbox) {
                factionDrugsCheckbox.addEventListener('change', function() {
                    useFactionDrugs = this.checked;
                    localStorage.setItem('useFactionDrugs', useFactionDrugs);
                    debugLog(`Using faction drugs set to: ${useFactionDrugs}`);

                    // Update UI immediately if needed
                    showNotification(`${useFactionDrugs ? 'Using faction armoury drugs' : 'Using personal inventory drugs'}`, 'info');

                    // Close GUI since the drug source changed
                    gui.style.display = 'none';

                    // Recreate alert with new settings
                    removeExistingAlerts();
                    alertElements = createAlert(drugList); // Recreate alert/GUI based on new setting
                });
            }

            // Populate drug list and add search functionality
            const drugListElement = gui.querySelector('.drug-list');
            const searchInput = gui.querySelector('.drug-search');

            function populateDrugList(filter = '') {
                drugListElement.innerHTML = ''; // Clear previous items
                const filteredDrugs = drugs.filter(drug =>
                    drug.name.toLowerCase().includes(filter.toLowerCase())
                );

                if (filteredDrugs.length === 0) {
                    drugListElement.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #aaa;">No drugs found</div>';
                    return;
                }

                filteredDrugs.forEach(drug => {
                    const drugItem = document.createElement('div');
                    drugItem.className = 'drug-item'; // Use class for styling
                    drugItem.textContent = drug.name;
                    // Hover effects handled by CSS

                    drugItem.onclick = () => {
                        useDrug(drug.id, drug.name);
                        gui.style.display = 'none';
                    };

                    drugListElement.appendChild(drugItem);
                });
            }

            // Initial population
            populateDrugList();

            // Add search listener
            searchInput.addEventListener('input', () => {
                populateDrugList(searchInput.value);
            });


            // Add click outside to close
            document.addEventListener('click', function(e) {
                // Check if GUI is visible and the click was outside both the GUI and the alert button
                if (gui && gui.style.display === 'block' && !gui.contains(e.target) && !alert.contains(e.target)) {
                    gui.style.display = 'none';
                }
            });
        }

        // Add click handler based on page context
        alert.onclick = function(event) {
            debugLog(`Alert clicked. Items page: ${isItemsPage}, Faction armoury drugs page: ${isFactionArmouryDrugsPage}, Other faction page: ${isOtherFactionPage}, Using faction drugs: ${useFactionDrugs}`);
            event.stopPropagation(); // Prevent triggering click outside listener

            if ((isItemsPage && !useFactionDrugs) || (isFactionArmouryDrugsPage && useFactionDrugs)) {
                // If on the correct page, show the GUI
                if (gui) {
                    debugLog('Showing GUI on appropriate page');
                    gui.style.display = gui.style.display === 'block' ? 'none' : 'block'; // Toggle display
                    if (gui.style.display === 'block') {
                        // Focus search input when opening
                        const searchInput = gui.querySelector('.drug-search');
                        if (searchInput) searchInput.focus();
                    }
                } else {
                    debugLog('Error: GUI element not found when trying to show.');
                    // Attempt to recreate alert/GUI as a fallback
                    removeExistingAlerts();
                    alertElements = createAlert(drugList);
                    if (alertElements && alertElements.gui) {
                        alertElements.gui.style.display = 'block';
                    }
                }
            } else if (isOtherFactionPage && useFactionDrugs) {
                // If on a faction page but not the armoury drugs page and using faction drugs
                debugLog('Already on faction page but need to navigate to armoury drugs sub-page');
                const targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=drugs';
                sessionStorage.setItem('fromDrugAlert', 'true'); // Flag to open GUI on arrival
                showNotification('Navigating to faction armoury drugs page...', 'info');
                window.location.href = targetUrl;
            } else {
                // If not on the correct page, navigate to the appropriate page
                const targetUrl = useFactionDrugs
                    ? 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=drugs'
                    : 'https://www.torn.com/item.php';

                debugLog(`Navigating to ${targetUrl}`);
                // Store a flag so we know to open the GUI when we arrive at the page
                sessionStorage.setItem('fromDrugAlert', 'true');
                showNotification(`Navigating to ${useFactionDrugs ? 'faction armoury' : 'items'} page...`, 'info');
                window.location.href = targetUrl;
            }

            return false; // Prevent default link behavior if any
        };

        return { alert, gui }; // Return references to the created elements
    }

    // Function to add customizable quick use buttons
    function addQuickUseButtons() {
        // Only add buttons on item or faction armoury page for now
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') &&
                                          window.location.href.includes('armoury') &&
                                          window.location.href.includes('sub=drugs');

        if (!isItemsPage && !isFactionArmouryDrugsPage) {
             debugLog('Not on items or faction armoury page, skipping quick use buttons');
             return;
        }

        // Remove existing container if present
        const existingContainer = document.querySelector('.quick-use-container');
        if (existingContainer) existingContainer.remove();

        // Create container
        const quickUseContainer = document.createElement('div');
        quickUseContainer.className = 'quick-use-container'; // Use class for styling

        // Load saved custom drugs or use defaults
        const savedQuickUseDrugs = localStorage.getItem('customQuickUseDrugs');
        let quickUseDrugs = [];

        if (savedQuickUseDrugs) {
            try {
                quickUseDrugs = JSON.parse(savedQuickUseDrugs);
                debugLog('Loaded custom quick use drugs:', quickUseDrugs);
            } catch (e) {
                debugLog('Error loading custom drugs, using defaults:', e);
                // Default drugs if saved data is invalid
                quickUseDrugs = [
                    { id: 206, name: "Xanax", color: "#4CAF50" }, // Green
                    { id: 197, name: "Ecstasy", color: "#2196F3" }, // Blue
                    { id: 196, name: "Cannabis", color: "#8BC34A" } // Light Green
                ];
                localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs)); // Save defaults
            }
        } else {
            // Default drugs if nothing saved
            quickUseDrugs = [
                { id: 206, name: "Xanax", color: "#4CAF50" }, // Green
                { id: 197, name: "Ecstasy", color: "#2196F3" }, // Blue
                { id: 196, name: "Cannabis", color: "#8BC34A" } // Light Green
            ];
            localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs)); // Save defaults
        }

        // Create drug buttons
        const drugButtons = [];
        quickUseDrugs.forEach(drug => {
            const button = document.createElement('div');
            button.textContent = drug.name;
            button.className = 'drug-quick-button'; // Use class for styling
            button.style.backgroundColor = drug.color || '#333'; // Apply specific color
            button.addEventListener('click', () => useDrug(drug.id, drug.name));
            drugButtons.push(button); // Store button reference
            quickUseContainer.appendChild(button);
        });

        // Add settings button
        const settingsButton = document.createElement('div');
        settingsButton.textContent = '⚙️ Edit';
        settingsButton.className = 'drug-settings-button'; // Use class for styling
        settingsButton.addEventListener('click', () => showDrugCustomizationUI(quickUseDrugs));
        quickUseContainer.appendChild(settingsButton);

        // Add minimize/maximize toggle
        const toggleButton = document.createElement('button');
        toggleButton.className = 'quick-use-toggle-button'; // Use class for styling

        let isMinimized = localStorage.getItem('drugAlertMinimized') === 'true';

        function applyMinimizedState() {
            drugButtons.forEach(btn => {
                btn.style.display = isMinimized ? 'none' : 'block';
            });
            settingsButton.style.display = isMinimized ? 'none' : 'block';
            // Adjust container padding when minimized
            quickUseContainer.style.padding = isMinimized ? '2px' : '10px';
            // Adjust size and position slightly when minimized
            quickUseContainer.style.top = isMinimized ? '110px' : '100px'; // Example adjustment
            toggleButton.textContent = isMinimized ? '💊' : 'X'; // Use drug emoji when minimized
        }

        applyMinimizedState(); // Set initial state

        toggleButton.addEventListener('click', () => {
            isMinimized = !isMinimized;
            applyMinimizedState();
            localStorage.setItem('drugAlertMinimized', isMinimized.toString()); // Save state as string
        });

        quickUseContainer.appendChild(toggleButton);
        document.body.appendChild(quickUseContainer);
    }

    // Function to show drug customization UI
    function showDrugCustomizationUI(currentDrugs) {
        // Remove any existing customization UI
        const existingUI = document.getElementById('drug-customization-ui');
        if (existingUI) existingUI.remove();

        // Create customization UI
        const customizationUI = document.createElement('div');
        customizationUI.id = 'drug-customization-ui'; // Use ID for styling and removal
        customizationUI.innerHTML = `
            <h3>Customize Quick Use Drugs</h3>
            <p>Select drugs to show in the quick use panel. You can reorder by dragging.</p>
            <div class="drug-selection-area"></div>
            <button class="customization-button add">+ Add More Drugs</button>
            <div class="customization-button-container">
                <button class="customization-button save">Save Changes</button>
                <button class="customization-button cancel">Cancel</button>
            </div>
        `;
        // Styles handled by CSS

        const drugSelectionArea = customizationUI.querySelector('.drug-selection-area');
        const selectedDrugs = [...currentDrugs]; // Clone the current drugs to allow cancellation

        // Color picker function (remains the same)
        function createColorPicker(drug, drugItemElement) {
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = drug.color || '#4CAF50'; // Default color
            // Style handled by CSS
            colorPicker.addEventListener('input', (e) => { // Use 'input' for live updates
                drug.color = e.target.value;
                // Optionally update the background of the item in the list live
                // drugItemElement.style.backgroundColor = e.target.value; // Example
            });
            return colorPicker;
        }

        // Function to render a single drug item in the customization list
        function renderDrugItem(drug) {
            const drugItem = document.createElement('div');
            drugItem.className = 'drug-selection-item'; // Use class for styling
            drugItem.setAttribute('data-drug-id', drug.id);
            drugItem.setAttribute('draggable', 'true'); // Make it draggable

            // Drag handle
            const dragHandle = document.createElement('span');
            dragHandle.innerHTML = '≡';
            drugItem.appendChild(dragHandle);

            // Checkbox (to remove)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // Initially checked
            checkbox.addEventListener('change', () => {
                if (!checkbox.checked) {
                    // Mark for removal on save, visually indicate
                    drugItem.style.opacity = '0.5';
                    drugItem.style.textDecoration = 'line-through';
                    drugItem.setAttribute('data-remove', 'true');
                } else {
                    // Unmark for removal
                    drugItem.style.opacity = '1';
                    drugItem.style.textDecoration = 'none';
                    drugItem.removeAttribute('data-remove');
                }
            });
            drugItem.appendChild(checkbox);

            // Drug name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = drug.name;
            drugItem.appendChild(nameSpan);

            // Color picker
            const colorPicker = createColorPicker(drug, drugItem);
            drugItem.appendChild(colorPicker);

            drugSelectionArea.appendChild(drugItem);

            // Add drag listeners (simplified)
            drugItem.addEventListener('dragstart', handleDragStart);
            drugItem.addEventListener('dragover', handleDragOver);
            drugItem.addEventListener('drop', handleDrop);
            drugItem.addEventListener('dragend', handleDragEnd);
        }

        // Populate initial list
        selectedDrugs.forEach(renderDrugItem);

        // Drag and Drop Handlers
        let draggedItem = null;

        function handleDragStart(e) {
            draggedItem = e.target.closest('.drug-selection-item');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedItem.dataset.drugId);
            setTimeout(() => {
                if (draggedItem) draggedItem.style.opacity = '0.5';
            }, 0);
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const targetItem = e.target.closest('.drug-selection-item');
            if (targetItem && targetItem !== draggedItem) {
                const rect = targetItem.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                // Determine if dragging above or below the midpoint
                if (offsetY < rect.height / 2) {
                    drugSelectionArea.insertBefore(draggedItem, targetItem);
                } else {
                    drugSelectionArea.insertBefore(draggedItem, targetItem.nextSibling);
                }
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            // Style handled in dragend
        }

        function handleDragEnd(e) {
            if (draggedItem) {
                draggedItem.style.opacity = '1';
            }
            draggedItem = null;
            // Re-sync the selectedDrugs array based on DOM order after drop
            const currentItems = Array.from(drugSelectionArea.querySelectorAll('.drug-selection-item'));
            selectedDrugs.length = 0; // Clear the array
            currentItems.forEach(item => {
                const drugId = parseInt(item.dataset.drugId);
                // Find the original drug data (important to keep color etc.)
                const originalDrug = currentDrugs.find(d => d.id === drugId) || fallbackDrugs.find(d => d.id === drugId);
                if (originalDrug && !item.hasAttribute('data-remove')) { // Only add if not marked for removal
                     // Find the potentially updated color from the picker
                    const colorPicker = item.querySelector('input[type="color"]');
                    if (colorPicker) originalDrug.color = colorPicker.value;
                    selectedDrugs.push(originalDrug);
                }
            });
            debugLog('Updated order:', selectedDrugs.map(d => d.name));
        }

        // Add More Drugs button
        customizationUI.querySelector('.customization-button.add').addEventListener('click', () => {
            showAddDrugsUI(selectedDrugs, drugSelectionArea, renderDrugItem); // Pass render function
        });

        // Save button
        customizationUI.querySelector('.customization-button.save').addEventListener('click', () => {
            // Filter out drugs marked for removal
            const finalDrugs = [];
            const itemsInUI = Array.from(drugSelectionArea.querySelectorAll('.drug-selection-item'));

            itemsInUI.forEach(item => {
                if (!item.hasAttribute('data-remove')) {
                    const drugId = parseInt(item.dataset.drugId);
                    // Find the drug in the potentially reordered selectedDrugs array or fallback
                    let drugData = selectedDrugs.find(d => d.id === drugId);
                    if (!drugData) { // If added via "Add More", find in fallback
                        drugData = fallbackDrugs.find(d => d.id === drugId);
                    }

                    if (drugData) {
                        // Get the latest color from the picker
                        const colorPicker = item.querySelector('input[type="color"]');
                        if (colorPicker) drugData.color = colorPicker.value;
                        finalDrugs.push(drugData);
                    }
                }
            });


            localStorage.setItem('customQuickUseDrugs', JSON.stringify(finalDrugs));
            debugLog('Saved custom drugs:', finalDrugs);

            customizationUI.remove();
            addQuickUseButtons(); // Refresh the quick use buttons immediately
            showNotification('Quick use drugs updated successfully!', 'success');
        });

        // Cancel button
        customizationUI.querySelector('.customization-button.cancel').addEventListener('click', () => {
            customizationUI.remove();
        });

        // Add to document
        document.body.appendChild(customizationUI);

        // Add click outside to close (ensure it doesn't close when clicking "Edit")
        setTimeout(() => { // Delay listener attachment slightly
             document.addEventListener('click', closeCustomizationOnClickOutside);
        }, 100);

        function closeCustomizationOnClickOutside(e) {
            const isSettingsButton = e.target.closest('.drug-settings-button');
            const isAddDrugsUI = e.target.closest('#add-drugs-ui'); // Don't close if clicking inside Add Drugs UI

            if (!customizationUI.contains(e.target) && !isSettingsButton && !isAddDrugsUI) {
                customizationUI.remove();
                document.removeEventListener('click', closeCustomizationOnClickOutside); // Clean up listener
            }
        }
    }


    // Modified showAddDrugsUI function with real-time updates
    function showAddDrugsUI(selectedDrugsRef, parentDrugSelectionArea, renderDrugItemFn) {
        // Remove existing Add Drugs UI if present
        const existingAddUI = document.getElementById('add-drugs-ui');
        if (existingAddUI) existingAddUI.remove();

        // Create a container for the add drugs UI
        const addDrugsUI = document.createElement('div');
        addDrugsUI.id = 'add-drugs-ui'; // Use ID for styling and removal
        addDrugsUI.innerHTML = `
            <h3>Add Drugs to Quick Use</h3>
            <input type="text" placeholder="Search drugs...">
            <div class="add-drug-list-container"></div>
            <div class="add-drugs-button-container">
                <button class="add-drugs-done-button">Done</button>
            </div>
        `;
        // Styles handled by CSS

        const searchBox = addDrugsUI.querySelector('input[type="text"]');
        const drugListContainer = addDrugsUI.querySelector('.add-drug-list-container');

        // Use the complete drug list (fallback or fetched)
        const availableDrugs = drugList.length > 0 ? drugList : fallbackDrugs;

        // Function to refresh the drug list based on search
        function refreshDrugList(searchTerm = '') {
            drugListContainer.innerHTML = ''; // Clear the container

            // Filter drugs
            const filteredDrugs = availableDrugs.filter(drug =>
                drug.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredDrugs.length === 0) {
                drugListContainer.innerHTML = '<div style="padding: 10px; color: #aaa;">No drugs found</div>';
                return;
            }

            // Add each drug
            filteredDrugs.forEach(drug => {
                // Check if already selected IN THE PARENT UI
                const isSelected = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`) !== null;

                const drugItem = document.createElement('div');
                drugItem.className = `add-drug-item ${isSelected ? 'selected' : ''}`; // Use class for styling
                // Styles handled by CSS

                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isSelected;
                checkbox.style.marginRight = '10px'; // Simple styling

                // Drug name
                const nameSpan = document.createElement('span');
                nameSpan.textContent = drug.name;

                drugItem.appendChild(checkbox);
                drugItem.appendChild(nameSpan);

                // Click handler for the item/checkbox
                const handleClick = () => {
                    const currentlySelected = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`) !== null;
                    checkbox.checked = !currentlySelected; // Toggle checkbox state visually

                    if (!currentlySelected) {
                        // Add to parent UI if not already there
                        const newDrugData = {...drug, color: '#4CAF50'}; // Add default color
                        renderDrugItemFn(newDrugData); // Use the passed render function
                        selectedDrugsRef.push(newDrugData); // Add to the reference array
                        drugItem.classList.add('selected');
                        drugItem.style.backgroundColor = '#444'; // Visual feedback
                    } else {
                        // Remove from parent UI
                        const itemToRemove = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                        if (itemToRemove) {
                            // Instead of removing, mark for removal visually in parent UI
                            itemToRemove.style.opacity = '0.5';
                            itemToRemove.style.textDecoration = 'line-through';
                            itemToRemove.setAttribute('data-remove', 'true');
                            const parentCheckbox = itemToRemove.querySelector('input[type="checkbox"]');
                            if(parentCheckbox) parentCheckbox.checked = false;

                            // Update the reference array (remove based on ID)
                            const indexToRemove = selectedDrugsRef.findIndex(d => d.id === drug.id);
                            if (indexToRemove > -1) {
                                // We don't actually remove here, the save button handles filtering based on data-remove
                                // selectedDrugsRef.splice(indexToRemove, 1);
                            }
                        }
                        drugItem.classList.remove('selected');
                        drugItem.style.backgroundColor = '#333'; // Visual feedback
                    }
                };

                drugItem.addEventListener('click', handleClick);

                drugListContainer.appendChild(drugItem);
            });
        }

        // Initial load
        refreshDrugList();

        // Add search functionality
        searchBox.addEventListener('input', () => {
            refreshDrugList(searchBox.value);
        });

        // Done button
        addDrugsUI.querySelector('.add-drugs-done-button').addEventListener('click', () => {
            addDrugsUI.remove();
        });

        // Add to document
        document.body.appendChild(addDrugsUI);

        // Prevent clicks inside this UI from closing the parent customization UI
        addDrugsUI.addEventListener('click', e => {
            e.stopPropagation();
        });
    }


    // --- Drug Usage Logic ---

    function useDrug(id, name) {
        debugLog(`Attempting to use drug: ${name} (ID: ${id}), Using faction drugs: ${useFactionDrugs}`);
        showNotification(`Using ${name}...`, 'info');

        // Close the main GUI if it's open
        const gui = document.getElementById('drugGui');
        if (gui) {
            gui.style.display = 'none';
        }

        if (useFactionDrugs) {
            tryFactionDrugUseMethod(id, name);
        } else {
            tryDirectUseMethod(id, name);
        }
    }

    function tryDirectUseMethod(id, name) {
        debugLog('Attempting direct use method with XMLHttpRequest');

        // Store drug use data for tracking (optional, can be removed if not needed)
        sessionStorage.setItem('drugUseInProgress', JSON.stringify({
            id: id,
            name: name,
            timestamp: Date.now(),
            method: 'direct'
        }));

        // Use the item directly via XHR
        useItemDirectly(id, name);
    }

    function useItemDirectly(id, name) {
        debugLog(`Using item directly: ${name} (ID: ${id})`);

        const token = getNSTStyleToken() || getPageCsrfToken(); // Try both methods

        if (token) {
            debugLog(`Using token: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
            submitDrugUseRequest(id, name, token);
        } else {
            debugLog('Failed to get token from any source');
            showNotification(`Unable to use ${name}: Could not get authorization token`, 'error');
            sessionStorage.removeItem('drugUseInProgress');
        }
    }

    function submitDrugUseRequest(id, name, token) {
        const params = new URLSearchParams();
        params.append('step', 'useItem');
        params.append('confirm', 'yes');
        params.append('itemID', id);
        params.append('csrf', token); // Use the correct parameter name 'csrf'

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/item.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            sessionStorage.removeItem('drugUseInProgress'); // Clear flag regardless of outcome
            if (this.status === 200) {
                try {
                    const response = JSON.parse(this.responseText);
                    debugLog('Direct use response:', response);

                    // Check for success indicators
                    if (response && (response.success || (response.text && (response.text.includes('consumed') || response.text.includes('used'))))) {
                        debugLog('Drug used successfully via XHR');
                        showNotification(`Used ${name} successfully!`, 'success');
                        // Cooldown check will automatically remove the alert later
                        return;
                    }

                    // Check for cooldown indicators
                    if (response && response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait'))) {
                        debugLog('Drug is on cooldown (detected in response)');
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                        return;
                    }

                    // Handle other errors
                    let errorMessage = 'Unknown error';
                    if (response && (response.error || response.message || response.text)) {
                         const tempDiv = document.createElement('div');
                         tempDiv.innerHTML = response.error || response.message || response.text;
                         errorMessage = tempDiv.textContent || tempDiv.innerText || 'Unknown error';
                    }
                    debugLog('XHR method returned error:', errorMessage);
                    showNotification(`Error: ${errorMessage}`, 'error');

                } catch (e) {
                    // Handle non-JSON responses or parsing errors
                    debugLog('Error parsing XHR response or non-JSON response:', this.responseText.substring(0, 200) + '...');
                    // Check raw text for success/cooldown/error
                    if (this.responseText.includes('consumed') || this.responseText.includes('used')) {
                         showNotification(`Used ${name} successfully! (Parsed from text)`, 'success');
                    } else if (this.responseText.includes('cooldown') || this.responseText.includes('wait') || this.responseText.includes('effect of a drug')) {
                         let cooldownMessage = extractCooldownMessage(this.responseText) || 'You are on drug cooldown';
                         showNotification(cooldownMessage, 'info');
                    } else {
                         showNotification(`Unable to use ${name}: Unexpected response`, 'error');
                    }
                }
            } else {
                debugLog('XHR request failed with status:', this.status);
                showNotification(`Unable to use ${name}: Request failed (${this.status})`, 'error');
            }
        };
        xhr.onerror = function() {
            sessionStorage.removeItem('drugUseInProgress');
            debugLog('XHR request failed with network error');
            showNotification(`Unable to use ${name}: Network error`, 'error');
        };

        xhr.send(params.toString());
    }

    function tryFactionDrugUseMethod(id, name) {
        debugLog(`Attempting faction armoury drug use for ${name} (ID: ${id})`);

        sessionStorage.setItem('drugUseInProgress', JSON.stringify({
            id: id,
            name: name,
            timestamp: Date.now(),
            method: 'faction'
        }));

        // Check if currently on the correct faction armoury page
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') &&
                                          window.location.href.includes('armoury') &&
                                          window.location.href.includes('sub=drugs');

        if (!isFactionArmouryDrugsPage) {
            debugLog('Not on faction armoury drugs page, navigating first.');
            // Store pending use data and navigate
            sessionStorage.setItem('pendingFactionDrugUse', JSON.stringify({ id, name }));
            const targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=drugs';
            showNotification(`Navigating to faction armoury to use ${name}...`, 'info');
            window.location.href = targetUrl;
            return; // Stop execution here, will resume after navigation
        }

        // If already on the page, proceed with use
        const token = getNSTStyleToken() || getPageCsrfToken();

        if (!token) {
            debugLog('No CSRF token found for faction drug via any method');
            showNotification('Unable to use faction drug: Authorization token not found', 'error');
            sessionStorage.removeItem('drugUseInProgress');
            return;
        }

        debugLog(`Using token for faction drug: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);

        // Try the simpler direct method first (using item.php?fac=1)
        useFactionDrugById(id, name, token);

        // Set a timeout to try the traditional method if the first one doesn't clear the 'inProgress' flag quickly
        setTimeout(() => {
            if (sessionStorage.getItem('drugUseInProgress')) {
                debugLog('Direct faction method might have failed or is slow, trying traditional armoryItemAction method.');
                useFactionDrugDirectly(id, name, token); // Pass the token
            }
        }, 1500); // Wait 1.5 seconds before trying the backup
    }


    // Renamed function to avoid conflict, added token parameter
    function useFactionDrugDirectly(id, name, token) {
        debugLog(`Using traditional faction drug method: ${name} (ID: ${id})`);

        let armouryItemID = findArmouryItemId(id, name); // Find the specific armoury ID

        if (!armouryItemID) {
            debugLog('Could not find armouryItemID for traditional method, cannot proceed');
            // Don't show error here if the first method might still be running
            // showNotification(`Unable to find ${name} in faction armoury.`, 'error');
            // sessionStorage.removeItem('drugUseInProgress'); // Don't remove if first method might succeed
            return;
        }

        debugLog(`Using faction drug with armouryItemID: ${armouryItemID}`);
        submitFactionDrugUseRequest(armouryItemID, name, token); // Use the found armouryItemID
    }

    // Helper to find the specific armoury item ID from the page
    function findArmouryItemId(itemId, itemName) {
         debugLog(`Searching for armouryItemID for ${itemName} (expected itemID: ${itemId})`);
         const drugItems = document.querySelectorAll('#armoury-drugs ul.item-list li, #faction-armoury .drugs-wrap .item, div[class*="armory"] div[class*="drugs"] div[class*="item"]');
         debugLog(`Faction armoury search found ${drugItems.length} potential items`);

         for (const item of drugItems) {
             const nameElements = item.querySelectorAll('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"], [class*="title"]');
             let foundName = false;
             for(const nameElement of nameElements) {
                 if (nameElement && nameElement.textContent.trim().toLowerCase() === itemName.toLowerCase()) {
                     foundName = true;
                     break;
                 }
             }

             if (foundName) {
                 debugLog(`Found item matching name: "${itemName}"`);
                 // Now find the armoryItemID associated with this specific item element
                 const actionLinks = item.querySelectorAll('a[href*="armoryItemID="], button[data-id], a[onclick*="armoryItemAction"], div[data-id]');
                 for (const actionLink of actionLinks) {
                     let match = null;
                     if (actionLink.href) {
                         match = actionLink.href.match(/armoryItemID=(\d+)/);
                     } else if (actionLink.dataset && actionLink.dataset.id) {
                         match = [null, actionLink.dataset.id]; // Simulate match array
                     } else if (actionLink.onclick) {
                         const onclickStr = actionLink.onclick.toString();
                         match = onclickStr.match(/armoryItemAction\((\d+)/);
                     }

                     if (match && match[1]) {
                         debugLog(`Found armouryItemID: ${match[1]} for ${itemName}`);
                         return match[1]; // Return the found ID
                     }
                 }
                 // If name matched but couldn't find ID in actions, try data attributes on the item itself
                 if (item.dataset && item.dataset.id) {
                      debugLog(`Found armouryItemID in item data-id: ${item.dataset.id}`);
                      return item.dataset.id;
                 }
                 if (item.getAttribute('data-armoryitemid')) {
                      debugLog(`Found armouryItemID in item data-armoryitemid: ${item.getAttribute('data-armoryitemid')}`);
                      return item.getAttribute('data-armoryitemid');
                 }


                 debugLog(`Could not find specific armoryItemID for matched item ${itemName}`);
             }
         }

         debugLog(`Failed to find specific armoryItemID for ${itemName} on the page.`);
         return null; // Not found
     }


    // Renamed function
    function submitFactionDrugUseRequest(armouryItemID, name, token) {
        const params = new URLSearchParams();
        params.append('step', 'armoryItemAction');
        params.append('confirm', 'yes');
        params.append('armoryItemID', armouryItemID);
        params.append('action', 'use');
        params.append('csrf', token); // Use correct parameter name 'csrf'

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/factions.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            sessionStorage.removeItem('drugUseInProgress'); // Clear flag
            if (this.status === 200) {
                try {
                    let response;
                    let isJson = false;
                    try {
                        response = JSON.parse(this.responseText);
                        isJson = true;
                        debugLog('Faction traditional response (JSON):', response);
                    } catch (parseError) {
                        debugLog('Faction traditional response (non-JSON):', this.responseText.substring(0, 200) + '...');
                        response = { text: this.responseText }; // Treat as text object
                    }

                    // Check for success
                    if ((isJson && (response.success || (response.message && response.message.includes('used')))) ||
                        (!isJson && (response.text.includes('used') || response.text.includes('consumed'))))
                    {
                        debugLog('Faction drug used successfully via traditional XHR');
                        showNotification(`Used ${name} from faction armoury successfully!`, 'success');
                        // Cooldown check will handle alert removal
                        return;
                    }

                    // Check for cooldown
                    if (response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait'))) {
                        debugLog('Faction drug is on cooldown (detected in traditional response)');
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                        return;
                    }

                    // Handle other errors
                    let errorMessage = 'Unknown error';
                     if (isJson && (response.error || response.message)) {
                         errorMessage = response.error || response.message;
                     } else if (response.text) {
                         const tempDiv = document.createElement('div');
                         tempDiv.innerHTML = response.text;
                         // Look for common error elements/text
                         const errorEl = tempDiv.querySelector('.error, .msg.error, .message.error');
                         errorMessage = errorEl ? (errorEl.textContent || errorEl.innerText) : (tempDiv.textContent || tempDiv.innerText || 'Unknown error');
                         // Strip excessive whitespace
                         errorMessage = errorMessage.replace(/\s+/g, ' ').trim();
                         if (!errorMessage || errorMessage.length < 5) errorMessage = 'Unknown error from faction response';
                     }
                    debugLog('Faction traditional XHR method returned error:', errorMessage);
                    showNotification(`Error: ${errorMessage}`, 'error');

                } catch (e) {
                    debugLog('Error parsing faction traditional XHR response:', e);
                    showNotification('Error using faction drug: Response processing error', 'error');
                }
            } else {
                debugLog('Faction traditional XHR request failed with status:', this.status);
                showNotification(`Error using faction drug: Request failed (${this.status})`, 'error');
            }
        };
        xhr.onerror = function() {
            sessionStorage.removeItem('drugUseInProgress');
            debugLog('Faction traditional XHR request failed with network error');
            showNotification('Error using faction drug: Network error', 'error');
        };

        xhr.send(params.toString());
    }


    // This function tries the item.php?fac=1 endpoint
    function useFactionDrugById(id, name, token) {
        debugLog(`Trying direct faction drug use via item.php?fac=1: ${name} (ID: ${id})`);

        const params = new URLSearchParams();
        params.append('step', 'useItem');
        params.append('confirm', 'yes');
        params.append('itemID', id);
        params.append('fac', '1'); // Flag to indicate faction item
        params.append('csrf', token); // Use correct parameter name 'csrf'

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/item.php', true); // Target item.php
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            // Don't remove 'drugUseInProgress' here yet, let the backup method check first
            if (this.status === 200) {
                try {
                    let response;
                    let isJson = false;
                    try {
                        response = JSON.parse(this.responseText);
                        isJson = true;
                        debugLog('Faction direct (item.php?fac=1) response (JSON):', response);
                    } catch (parseError) {
                        debugLog('Faction direct (item.php?fac=1) response (non-JSON):', this.responseText.substring(0, 200) + '...');
                        response = { text: this.responseText };
                    }

                    // Check for success - if successful, clear the 'inProgress' flag
                    if ((isJson && (response.success || (response.text && (response.text.includes('consumed') || response.text.includes('used'))))) ||
                        (!isJson && (response.text.includes('consumed') || response.text.includes('used'))))
                    {
                        debugLog('Faction drug used successfully via direct (item.php?fac=1) method');
                        showNotification(`Used ${name} from faction armoury successfully!`, 'success');
                        sessionStorage.removeItem('drugUseInProgress'); // Success, clear flag
                        // Cooldown check handles alert removal
                        return;
                    }

                    // Check for cooldown - if cooldown, clear the 'inProgress' flag
                    if (response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait'))) {
                        debugLog('Faction drug is on cooldown (detected in direct response)');
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                        sessionStorage.removeItem('drugUseInProgress'); // Cooldown, clear flag
                        return;
                    }

                    // If it wasn't success or cooldown, don't clear the flag yet, maybe the backup method will work.
                    // Log the potential error from this attempt.
                    let errorMessage = 'Unknown error from item.php?fac=1';
                     if (isJson && (response.error || response.message)) {
                         errorMessage = response.error || response.message;
                     } else if (response.text) {
                         const tempDiv = document.createElement('div');
                         tempDiv.innerHTML = response.text;
                         const errorEl = tempDiv.querySelector('.error, .msg.error, .message.error');
                         errorMessage = errorEl ? (errorEl.textContent || errorEl.innerText) : (tempDiv.textContent || tempDiv.innerText || 'Unknown error');
                         errorMessage = errorMessage.replace(/\s+/g, ' ').trim();
                         if (!errorMessage || errorMessage.length < 5) errorMessage = 'Unknown error from item.php?fac=1 response';
                     }
                    debugLog('Direct faction (item.php?fac=1) method returned potential error (will try backup):', errorMessage);
                    // Do not show notification or clear flag here

                } catch (e) {
                    debugLog('Error processing direct faction (item.php?fac=1) response:', e);
                    // Don't clear flag, let backup try
                }
            } else {
                debugLog('Direct faction (item.php?fac=1) request failed with status:', this.status);
                // Don't clear flag, let backup try
            }
        };

        xhr.onerror = function() {
            debugLog('Direct faction (item.php?fac=1) request failed with network error');
            // Don't clear flag, let backup try
        };

        xhr.send(params.toString());
    }

    // Helper function to extract cooldown message with time
    function extractCooldownMessage(responseText) {
        if (!responseText) return null;

        const timeMatch = responseText.match(/data-time=["']?(\d+)["']?/); // data-time attribute
        const timeMatch2 = responseText.match(/wait\s+(\d+)\s*m\s+(\d+)\s*s/i); // Xm Ys format
        const timeMatch3 = responseText.match(/wait\s+(\d+)\s+seconds?/i); // X seconds format
        const timeMatch4 = responseText.match(/wait\s+(\d+)\s+minutes?/i); // X minutes format

        let seconds = 0;

        if (timeMatch && timeMatch[1]) {
            seconds = parseInt(timeMatch[1]);
        } else if (timeMatch2 && timeMatch2[1] && timeMatch2[2]) {
            seconds = parseInt(timeMatch2[1]) * 60 + parseInt(timeMatch2[2]);
        } else if (timeMatch3 && timeMatch3[1]) {
            seconds = parseInt(timeMatch3[1]);
        } else if (timeMatch4 && timeMatch4[1]) {
            seconds = parseInt(timeMatch4[1]) * 60;
        }

        if (seconds > 0) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const message = `Drug Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
            debugLog(`Extracted cooldown time: ${message}`);
            return message;
        } else {
            // Fallback to extracting the main message text if time parsing fails
            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = responseText;
                const messageEl = tempDiv.querySelector('.message, .msg, .cont_gray'); // Common message containers
                let textContent = (messageEl ? (messageEl.textContent || messageEl.innerText) : (tempDiv.textContent || tempDiv.innerText || '')).trim();
                if (textContent.length > 100) textContent = textContent.substring(0, 100) + '...'; // Truncate long messages
                if (textContent) {
                     debugLog('Using extracted raw message for cooldown:', textContent);
                     return textContent;
                }
            } catch(e) {
                 debugLog("Error extracting raw cooldown message", e);
            }
        }

        return null; // Could not extract a specific message
    }


    function showNotification(message, type = 'info') {
        // Remove any existing notifications first
        const existingNotifications = document.querySelectorAll('.drug-notification');
        existingNotifications.forEach(note => note.remove());

        const notification = document.createElement('div');
        notification.className = `drug-notification ${type}`; // Use class for styling

        let cleanMessage = message;
        // Basic HTML stripping for safety and clarity
        if (message.includes('<') && message.includes('>')) {
            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = message;
                cleanMessage = tempDiv.textContent || tempDiv.innerText || message;
            } catch (e) { /* ignore stripping error */ }
        }
        // Trim whitespace
        cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();


        // Special formatting for cooldown messages
        if (cleanMessage.toLowerCase().includes('cooldown')) {
             notification.innerHTML = `
                 <div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">Drug Cooldown Active</div>
                 <div>${cleanMessage}</div>
             `;
             notification.style.minWidth = '280px'; // Make cooldown popups slightly wider
             notification.style.padding = '15px 25px';
        } else {
             notification.textContent = cleanMessage;
        }

        document.body.appendChild(notification);

        // Animation: Fade in and scale up slightly
        notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
        notification.style.opacity = '0';
        void notification.offsetWidth; // Force reflow to apply initial state

        requestAnimationFrame(() => { // Use requestAnimationFrame for smoother transition
             notification.style.transform = 'translate(-50%, -50%) scale(1)';
             notification.style.opacity = '1';
        });


        // Auto-hide after a delay
        const duration = (type === 'error' || type === 'info') ? 7000 : 4000; // Longer for errors/info
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            // Remove from DOM after transition ends
            notification.addEventListener('transitionend', () => notification.remove(), { once: true });
        }, duration);

        debugLog(`Notification [${type}]: ${cleanMessage}`);
    }


    function getNSTStyleToken() {
        debugLog('Trying NST-style token retrieval (RFC cookie)');
        try {
            // Try RFC cookie as a potential token (often works)
            const rfcCookie = getRFC();
            if (rfcCookie) {
                debugLog('Using RFC cookie as token');
                // No need to cache this short-lived token here
                return rfcCookie;
            }
        } catch (e) {
            debugLog('Error retrieving RFC cookie:', e);
        }
        debugLog('NST-style token (RFC cookie) not found.');
        return null;
    }

    function extractTokenFromPage() {
        debugLog('Extracting token from current page content');
        try {
            // 1. Check global variable
            if (typeof window.csrf !== 'undefined' && window.csrf) {
                debugLog('Found token in window.csrf');
                return window.csrf;
            }

            // 2. Check jQuery cookie if available
            if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
                const cookieToken = $.cookie('csrf');
                if (cookieToken) {
                    debugLog('Found token in $.cookie("csrf")');
                    return cookieToken;
                }
            }

            // 3. Check input fields
            const inputs = document.querySelectorAll('input[name="csrf"], input[name="X-Csrf-Token"], input[data-csrf]');
            for (const input of inputs) {
                const token = input.value || input.dataset?.csrf;
                if (token) {
                    debugLog('Found token in page input field');
                    return token;
                }
            }

            // 4. Check inline scripts (more robust patterns)
            const scriptPatterns = [
                /["']csrf["']\s*:\s*["']([a-f0-9]{16,})["']/, // JSON-like: "csrf": "..."
                /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, // var csrf_token = "..."
                /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, // window.csrf = "..."
                /value=["']([a-f0-9]{16,})["']\s*name=["']csrf["']/ // Input value in HTML string
            ];
            const scripts = document.querySelectorAll('script:not([src])');
            for (const script of scripts) {
                if (!script.textContent) continue;
                for (const pattern of scriptPatterns) {
                    const match = script.textContent.match(pattern);
                    if (match && match[1]) {
                        debugLog('Found token in page script tag');
                        return match[1];
                    }
                }
            }

             // 5. Check meta tags
             const metaTag = document.querySelector('meta[name="csrf-token"]');
             if (metaTag && metaTag.content) {
                 debugLog('Found token in meta tag');
                 return metaTag.content;
             }


        } catch (e) {
            debugLog('Error extracting token from page:', e);
        }

        debugLog('No token found directly on page');
        return null;
    }


    function getPageCsrfToken() {
        // This function now primarily relies on extractTokenFromPage
        return extractTokenFromPage();
    }

    // Removed fetchCsrfToken as it's less reliable and synchronous XHR is generally discouraged.
    // The combination of getNSTStyleToken and getPageCsrfToken should be sufficient.

    function getRFC() {
        // Try jQuery cookie first if available
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const rfcCookie = $.cookie('rfc_v');
            if (rfcCookie) {
                // debugLog('Found RFC in jQuery cookie:', rfcCookie);
                return rfcCookie;
            }
        }

        // Fallback to manual cookie parsing
        try {
            const cookies = document.cookie.split('; ');
            for (const cookie of cookies) {
                const [name, value] = cookie.split('=');
                if (name === 'rfc_v') {
                    // debugLog('Found RFC in document.cookie:', value);
                    return value;
                }
            }
        } catch (e) {
            debugLog('Error parsing cookies for RFC:', e);
        }

        // Other fallback methods (scripts, URL) are less common for RFC and can be omitted for simplicity
        // debugLog('No RFC found');
        return null;
    }


    function hasDrugCooldown() {
        // debugLog('Checking for drug cooldown...'); // Reduce log noise

        // Primary check: Specific aria-label (most reliable)
        const drugCooldown = document.querySelector("[aria-label^='Drug Cooldown:']");
        if (drugCooldown) {
            // debugLog('Found drug cooldown via aria-label');
            return true;
        }

        // Secondary check: Status icons area (more robust selectors)
        const statusIcons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a, [class*="statusIcon"]');
        for (const icon of statusIcons) {
            const ariaLabel = icon.getAttribute('aria-label') || '';
            const title = icon.getAttribute('title') || '';
            const classList = icon.classList.toString();

            // Check tooltips/labels
            if ((ariaLabel.includes('Drug') && ariaLabel.includes('Cooldown')) ||
                (title.includes('Drug') && title.includes('Cooldown'))) {
                // debugLog('Found drug cooldown in status icons via tooltip/label');
                return true;
            }
            // Check for specific class patterns often used for cooldown icons (adjust if needed)
             if (classList.includes('icon50') || classList.includes('icon51') || classList.includes('icon52') || classList.includes('icon53') || classList.includes('icon54') || classList.includes('icon55') || classList.includes('icon56') || classList.includes('icon57') || classList.includes('icon58') || classList.includes('icon59') || classList.includes('drug') || classList.includes('cooldown')) {
                 // Check tooltip again to be sure it's the *drug* cooldown
                 if ((ariaLabel.includes('Drug') && ariaLabel.includes('Cooldown')) || (title.includes('Drug') && title.includes('Cooldown'))) {
                    // debugLog('Found drug cooldown icon via class name and tooltip confirmation');
                    return true;
                 }
            }
        }

        // debugLog('No drug cooldown detected');
        return false;
    }


    function fetchDrugs() {
        debugLog('Fetching drugs list from item page');
        return new Promise((resolve) => { // No reject needed, always resolve with fallback
            fetch('https://www.torn.com/item.php') // Fetch the items page
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const drugItems = [];

                    // Selector targeting the drugs category specifically and its items
                    const items = doc.querySelectorAll('#item-market-main-wrap ul[data-category="Drugs"] li[data-item]');

                    if (items.length > 0) {
                         debugLog(`Found ${items.length} potential drug items using primary selector.`);
                         items.forEach(item => {
                             const id = item.dataset.item ? parseInt(item.dataset.item) : null;
                             const nameElem = item.querySelector('.name, .title, .item-name'); // Common name elements within the item
                             const name = nameElem ? nameElem.textContent.trim() : null;

                             if (id && name) {
                                 // Double check against fallback list names to be sure
                                 if (fallbackDrugs.some(fbDrug => fbDrug.name === name)) {
                                      drugItems.push({ id, name });
                                 }
                             }
                         });
                    } else {
                         debugLog('Primary drug selector failed, trying broader selectors...');
                         // Fallback selectors if the main one fails (less reliable)
                         const fallbackItems = doc.querySelectorAll('.item-info-wrap[data-category="Drugs"], .item-cont[data-item]');
                         fallbackItems.forEach(item => {
                              const idAttr = item.dataset.item || item.closest('[data-item]')?.dataset.item;
                              const id = idAttr ? parseInt(idAttr) : null;
                              const nameElem = item.querySelector('.name, .title, .item-name');
                              const name = nameElem ? nameElem.textContent.trim() : null;

                              if (id && name && fallbackDrugs.some(fbDrug => fbDrug.name === name)) {
                                   if (!drugItems.some(existing => existing.id === id)) { // Avoid duplicates
                                        drugItems.push({ id, name });
                                   }
                              }
                         });
                         debugLog(`Found ${drugItems.length} drugs using fallback selectors.`);
                    }


                    // Remove duplicates just in case
                    const uniqueDrugs = Array.from(new Map(drugItems.map(item => [item.id, item])).values());

                    if (uniqueDrugs.length > 0) {
                        debugLog(`Successfully parsed ${uniqueDrugs.length} unique drugs from item page.`);
                        resolve(uniqueDrugs);
                    } else {
                        debugLog('Failed to parse drugs from item page, using fallback list.');
                        resolve([...fallbackDrugs]); // Use a copy of fallback
                    }
                })
                .catch(error => {
                    debugLog('Error fetching or parsing item page:', error);
                    resolve([...fallbackDrugs]); // Use fallback on any error
                });
        });
    }


    function startCooldownChecks() {
        let lastCooldownStatus = null; // Track last known status
        let checkInterval = 30000; // Default check interval (30s)
        let intervalId = null;

        const checkCooldown = () => {
            const hasCooldown = hasDrugCooldown();

            if (hasCooldown !== lastCooldownStatus) {
                debugLog(`Cooldown status changed: ${lastCooldownStatus === null ? 'Initial' : lastCooldownStatus} -> ${hasCooldown}`);
                lastCooldownStatus = hasCooldown;

                if (!hasCooldown) {
                    // Cooldown finished or wasn't active
                    if (!alertElements) { // Only create if it doesn't exist
                        alertElements = createAlert(drugList);
                        debugLog('Created "No Drugs" alert');
                        // Auto-show GUI handling is now within checkForPendingDrugUse/initialize
                    }
                    checkInterval = 30000; // Reset to normal interval when cooldown ends
                } else {
                    // Cooldown started or is still active
                    if (alertElements) { // If alert exists, remove it
                        removeExistingAlerts();
                        debugLog('Removed "No Drugs" alert due to cooldown');
                    }
                    checkInterval = 5000; // Check more frequently when on cooldown
                }
                // Reschedule with potentially updated interval
                clearTimeout(intervalId);
                intervalId = setTimeout(checkCooldown, checkInterval);
            } else {
                 // Status unchanged, schedule next check
                 intervalId = setTimeout(checkCooldown, checkInterval);
            }
        };

        // Initial check with a delay
        const initialDelay = 1500; // Slightly longer delay for initial load
        debugLog(`Performing initial cooldown check in ${initialDelay}ms`);
        setTimeout(checkCooldown, initialDelay);

        // Use MutationObserver for faster updates (optional but good)
        try {
            const observer = new MutationObserver((mutations) => {
                // Check if relevant parts of the DOM changed (e.g., status icons area)
                const relevantMutation = mutations.some(mutation => {
                    const target = mutation.target;
                    // Check if the target itself is the status icons container or a child
                    if (target && target.nodeType === 1 && (target.closest('.status-icons__wrap, .user-icons__wrap') || target.matches('[aria-label*="Cooldown"]'))) {
                        return true;
                    }
                    // Check if added/removed nodes are relevant
                    return Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes)).some(node =>
                        node.nodeType === 1 && (node.matches('[aria-label*="Cooldown"]') || node.querySelector('[aria-label*="Cooldown"]'))
                    );
                });

                if (relevantMutation) {
                    // debugLog('Mutation observer detected relevant change, re-checking cooldown.');
                    clearTimeout(intervalId); // Clear scheduled check
                    checkCooldown(); // Check immediately
                }
            });

            const observerTarget = document.querySelector('#user-icons, #status-icons, body'); // Observe specific areas or body as fallback
            if (observerTarget) {
                 observer.observe(observerTarget, {
                     childList: true,
                     subtree: true,
                     attributes: true,
                     attributeFilter: ['class', 'aria-label', 'title', 'style'] // Observe relevant attributes
                 });
                 debugLog('MutationObserver attached for cooldown status.');
            } else {
                 debugLog('Could not find target for MutationObserver.');
            }
        } catch (e) {
             debugLog("Failed to set up MutationObserver", e);
        }


        console.log('%c Drug Alerts Initialized ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    }


    function checkForPendingDrugUse() {
        try {
            const fromAlert = sessionStorage.getItem('fromDrugAlert');
            const pendingFactionUse = sessionStorage.getItem('pendingFactionDrugUse');

            if (fromAlert) {
                debugLog('Detected navigation from drug alert click');
                sessionStorage.removeItem('fromDrugAlert'); // Clear the flag

                const isItemsPage = window.location.href.includes('torn.com/item.php');
                const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') &&
                                                  window.location.href.includes('armoury') &&
                                                  window.location.href.includes('sub=drugs');

                // Check if we are now on the correct page based on the setting
                const onCorrectPage = (isItemsPage && !useFactionDrugs) || (isFactionArmouryDrugsPage && useFactionDrugs);

                if (onCorrectPage) {
                    debugLog('On appropriate page after navigation from alert.');
                    // Wait a bit for the page and script elements to potentially finish loading/rendering
                    setTimeout(() => {
                        if (drugList && drugList.length > 0 && !hasDrugCooldown()) {
                            // Recreate alert/GUI if needed and show GUI
                            removeExistingAlerts();
                            alertElements = createAlert(drugList);
                            if (alertElements && alertElements.gui) {
                                debugLog('Auto-showing drug GUI after navigation.');
                                alertElements.gui.style.display = 'block';
                                const searchInput = alertElements.gui.querySelector('.drug-search');
                                if (searchInput) searchInput.focus();
                            } else {
                                 debugLog('Failed to get GUI element to auto-show.');
                            }
                        } else if (!hasDrugCooldown()){
                            debugLog('Drug list not ready for auto-show, will rely on standard initialization.');
                            // The standard init path will handle creating the alert when drugs are fetched
                        } else {
                             debugLog('On cooldown after navigation, not showing GUI.');
                        }
                    }, 1200); // Delay opening GUI slightly more
                } else {
                    debugLog('Not on appropriate page after navigation, canceling auto GUI display.');
                }
            } else if (pendingFactionUse) {
                 debugLog('Detected pending faction drug use request.');
                 const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') &&
                                                   window.location.href.includes('armoury') &&
                                                   window.location.href.includes('sub=drugs');

                 if (isFactionArmouryDrugsPage) {
                      try {
                           const pendingUse = JSON.parse(pendingFactionUse);
                           if (pendingUse.id && pendingUse.name) {
                                debugLog(`On faction armoury page, processing pending use: ${pendingUse.name}`);
                                sessionStorage.removeItem('pendingFactionDrugUse'); // Clear before attempting use

                                // Delay slightly to ensure page elements (like CSRF tokens) are ready
                                setTimeout(() => {
                                     useDrug(pendingUse.id, pendingUse.name);
                                }, 1000);
                           } else {
                                debugLog('Invalid pending faction use data, clearing.');
                                sessionStorage.removeItem('pendingFactionDrugUse');
                           }
                      } catch (e) {
                           debugLog('Error parsing pending faction use data:', e);
                           sessionStorage.removeItem('pendingFactionDrugUse');
                      }
                 } else {
                      debugLog('Not on faction armoury page yet for pending use.');
                      // Keep the pending flag until the correct page is reached
                 }
            }

            // Clear any potentially stale drug use progress flag from previous attempts
            sessionStorage.removeItem('drugUseInProgress');

        } catch (e) {
            debugLog('Error in checkForPendingDrugUse:', e);
            sessionStorage.removeItem('drugUseInProgress'); // Ensure cleanup on error
            sessionStorage.removeItem('fromDrugAlert');
            sessionStorage.removeItem('pendingFactionDrugUse');
        }
    }


    function removeExistingAlerts() {
        const existingAlerts = document.querySelectorAll('.drug-alert');
        const existingGuis = document.querySelectorAll('.drug-gui');
        const existingQuickUse = document.querySelectorAll('.quick-use-container');
        const existingCustomization = document.querySelectorAll('#drug-customization-ui, #add-drugs-ui');


        existingAlerts.forEach(alert => alert.remove());
        existingGuis.forEach(gui => gui.remove());
        existingQuickUse.forEach(el => el.remove());
        existingCustomization.forEach(el => el.remove());


        if (alertElements) {
             // Remove potential event listeners if necessary, although direct removal usually suffices
             alertElements = null; // Reset the reference
        }
        // debugLog('Removed existing drug alerts, GUIs, and related elements.');
    }

    // --- Initialization ---
    function initialize() {
        debugLog('Initializing Drug Alerts Script');

        // Load settings
        useFactionDrugs = localStorage.getItem('useFactionDrugs') === 'true';
        debugLog(`Initialized with faction drugs setting: ${useFactionDrugs}`);

        // Clean up any old elements first
        removeExistingAlerts();

        // Check for pending actions from previous page loads/navigations
        checkForPendingDrugUse();

        // Fetch the drug list needed for the GUI
        fetchDrugs().then(fetchedDrugs => {
            debugLog(`Fetched ${fetchedDrugs.length} drugs. Using: ${fetchedDrugs.length > 0 ? 'Fetched List' : 'Fallback List'}`);
            drugList = fetchedDrugs; // Store globally

            // Add quick use buttons (only runs if on relevant pages)
            addQuickUseButtons();

            // Start the main cooldown checking loop AFTER drugs are fetched
            // This ensures the alert/GUI has the correct drug list if created
            startCooldownChecks();

        }).catch(err => {
             // Should not happen as fetchDrugs always resolves, but good practice
             debugLog("Critical error during drug fetch promise:", err);
             drugList = [...fallbackDrugs]; // Ensure fallback on unexpected error
             startCooldownChecks(); // Start checks even if fetch failed critically
        });
    }

    // --- Start the script ---
    // Use a DOMContentLoaded or window.onload listener for better reliability,
    // especially if relying on page elements like CSRF tokens early.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // The DOM is already ready
        initialize();
    }

})();
