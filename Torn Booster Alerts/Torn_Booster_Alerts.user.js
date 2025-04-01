// ==UserScript==
// @name         Torn Booster Alert
// @version      1.0.26
// @description  Alerts when no booster cooldown is active and allows taking boosters from any page (Responsive UI)
// @author       GNSC4 [268863]
// @match        https://www.torn.com/*
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Booster%20Alerts/Torn_Booster_Alerts.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Booster%20Alerts/Torn_Booster_Alerts.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Check if we're on an attack page and exit early if true
    if (window.location.href.includes('sid=getInAttack') ||
        window.location.href.includes('sid=attack') ||
        window.location.href.includes('loader2.php') ||
        window.location.pathname.includes('loader2.php')) {
        console.log('Booster Alerts: Not initializing on attack page');
        return;
    }

    // Add CSS
    GM_addStyle(`
        .booster-alert {
            background-color: #2196F3;
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

        .settings-section {
            margin-top: 15px;
            margin-bottom: 15px;
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
            color: white;
        }

        .booster-gui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #222;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 99999999;
            /* Use max-width and viewport units for responsiveness */
            width: 90vw; /* Take up 90% of viewport width */
            max-width: 500px; /* But no more than 500px */
            max-height: 80vh; /* Limit height to 80% of viewport height */
            overflow-y: auto; /* Allow scrolling if content exceeds max-height */
            display: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7);
            border: 1px solid #444;
            box-sizing: border-box; /* Include padding and border in width/height */
        }

        .booster-gui h3 {
            margin-top: 0;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }

        .booster-search {
            width: 100%; /* Make search input take full width of the container */
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #444;
            background-color: #333;
            color: white;
            border-radius: 3px;
            box-sizing: border-box; /* Include padding/border in width */
        }

        .booster-search::placeholder {
            color: #aaa;
        }

        .category-header {
            margin-top: 15px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #333;
            font-weight: bold;
            color: #4CAF50;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }

        .toggle-category {
            background-color: #333;
            color: white;
            border: 1px solid #444;
            border-radius: 3px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
        }

        .booster-list {
            display: grid;
            /* Adjust grid columns for smaller screens if needed */
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* Responsive grid */
            gap: 10px;
            margin-top: 5px;
        }

        .booster-item {
            background-color: #333;
            padding: 12px;
            border-radius: 5px;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 13px;
            font-weight: bold;
            word-wrap: break-word; /* Prevent long names from overflowing */
        }

        .energy-item {
            border-left: 3px solid #4CAF50;
        }

        .nerve-item {
            border-left: 3px solid #F44336;
        }

        .happy-item {
            border-left: 3px solid #FFEB3B;
            color: white; /* Ensure text is visible on yellow border */
        }

        .stat-item { /* Original stat-item had duplicate definition, keeping one */
            border-left: 3px solid #2196F3; /* Blue for stats */
        }

        /* Removed duplicate .stat-item definition */

        .booster-item:hover {
            background-color: #444;
        }

        .booster-notification {
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

        .booster-notification.success {
            background-color: rgba(76, 175, 80, 0.9);
            border: 1px solid #4CAF50;
        }

        .booster-notification.error {
            background-color: rgba(244, 67, 54, 0.9);
            border: 1px solid #f44336;
        }

        .booster-notification.info {
            background-color: rgba(33, 150, 243, 0.9);
            border: 1px solid #2196F3;
        }
    `);

    // Define booster categories
    const BOOSTERS = {
        energy: [
            { id: 987, name: "Can of Crocozade" },
            { id: 986, name: "Can of Damp Valley" },
            { id: 985, name: "Can of Goose Juice" },
            { id: 530, name: "Can of Munster" },
            { id: 532, name: "Can of Red Cow" },
            { id: 554, name: "Can of Rockstar Rudolph" },
            { id: 553, name: "Can of Santa Shooters" },
            { id: 533, name: "Can of Taurine Elite" },
            { id: 555, name: "Can of X-MASS" },
            { id: 367, name: "Feathery Hotel Coupon" }
        ],
        nerve: [
            { id: 180, name: "Bottle of Beer" },
            { id: 181, name: "Bottle of Champagne" },
            { id: 638, name: "Bottle of Christmas Cocktail" },
            { id: 924, name: "Bottle of Christmas Spirit" },
            { id: 873, name: "Bottle of Green Stout" },
            { id: 550, name: "Bottle of Kandy Kane" },
            { id: 551, name: "Bottle of Minty Mayhem" },
            { id: 552, name: "Bottle of Mistletoe Madness" },
            { id: 984, name: "Bottle of Moonshine" },
            { id: 531, name: "Bottle of Pumpkin Brew" },
            { id: 294, name: "Bottle Of Sake Brew" },
            { id: 541, name: "Bottle of Stinky Swamp Punch" },
            { id: 426, name: "Bottle of Tequila" },
            { id: 542, name: "Bottle of Wicked Witch" }
        ],
        happy: [
            { id: 634, name: "Bag of Blood Eyeballs" },
            { id: 37, name: "Bag of Bon Bons" },
            { id: 527, name: "Bag of Candy Kisses" },
            { id: 210, name: "Bag of Chocolate Kisses" },
            { id: 529, name: "Bag of Chocolate Truffles" },
            { id: 1039, name: "Bag of Humbugs" },
            { id: 556, name: "Bag of Raindeer Droppings" },
            { id: 587, name: "Bag of Sherbet" },
            { id: 528, name: "Bag of Tootsie Rolls" },
            { id: 36, name: "Big Box of Chocolate Bars" },
            { id: 1028, name: "Birthday Cupcake" },
            { id: 38, name: "Box of Bon Bons" },
            { id: 35, name: "Box of Chocolate Bars" },
            { id: 39, name: "Box of Extra Strong Mints" },
            { id: 209, name: "Box of Sweet Hearts" },
            { id: 1312, name: "Chocolate Egg" },
            { id: 586, name: "Jawbreaker" },
            { id: 310, name: "Lollipop" },
            { id: 151, name: "Pixie Sticks" },
            { id: 366, name: "Erotic DVD" }
        ],
        statEnhancers: [
            { id: 329, name: "Skateboard", effect: "Speed" },
            { id: 331, name: "Dumbbells", effect: "Strength" },
            { id: 106, name: "Parachute", effect: "Dexterity" },
            { id: 330, name: "Boxing Gloves", effect: "Defense" }
        ]
    };

    // Include all booster categories in a flat array for easier lookup
    const allBoosters = [...BOOSTERS.energy, ...BOOSTERS.nerve, ...BOOSTERS.happy, ...BOOSTERS.statEnhancers];

    let alertElements = null;
    let DEBUG_MODE = true; // Keep debug logging enabled
    let useFactionBoosters = localStorage.getItem('useFactionBoosters') === 'true'; // Load setting on init

    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[BoosterAlerts Debug]', ...args);
        }
    }

    function positionBoosterAlert(alert, header) {
        // Special case for forum pages
        if (window.location.href.includes('torn.com/forums.php')) {
            debugLog('Positioning for forum page');

            // If we have a header with links-top-wrap, use special positioning
            const linksTopWrap = header.querySelector('.links-top-wrap');

            if (linksTopWrap) {
                debugLog('Using forum links-top-wrap positioning');

                // Insert before the links-top-wrap to avoid conflicts
                header.insertBefore(alert, linksTopWrap);

                alert.style.cssText = `
                    display: inline-flex !important;
                    align-items: center !important;
                    margin-left: 15px !important;
                    float: right !important;
                    position: relative !important;
                    z-index: 99999 !important;
                    margin-top: 5px !important;
                `;

                return;
            } else {
                debugLog('Using general forum positioning');

                // If there's an h4 header, insert after it
                const h4Header = header.querySelector('h4');
                if (h4Header) {
                    debugLog('Inserting after h4 header');
                    if (h4Header.nextSibling) {
                        header.insertBefore(alert, h4Header.nextSibling);
                    } else {
                        header.appendChild(alert);
                    }

                    alert.style.cssText = `
                        display: inline-flex !important;
                        align-items: center !important;
                        margin-left: 15px !important;
                        position: relative !important;
                        z-index: 99999 !important;
                        float: right !important;
                    `;

                    return;
                }

                // Fallback - just append to header
                header.appendChild(alert);

                alert.style.cssText = `
                    display: inline-flex !important;
                    align-items: center !important;
                    margin-left: 15px !important;
                    float: right !important;
                    position: relative !important;
                    z-index: 99999 !important;
                `;

                return;
            }
        }

        // Default positioning for non-forum pages
        header.appendChild(alert);

        alert.style.cssText = `
            display: inline-flex !important;
            align-items: center !important;
            margin-left: 10px !important;
            order: 2 !important;
            z-index: 99999 !important;
            pointer-events: auto !important;
        `;

        const isMobilePDA = navigator.userAgent.includes('PDA') ||
                              window.innerWidth < 768 ||
                              document.documentElement.classList.contains('tornPDA');

        if (isMobilePDA) {
            alert.style.fontSize = '10px';
            alert.style.padding = '3px 6px';
            alert.style.marginLeft = '5px';
        }

        if (header.id === 'torn-booster-fixed-header') {
            alert.style.margin = '0';
            alert.style.marginLeft = '5px';
        }
    }

    function findHeader() {
        // Special case for forum pages
        if (window.location.href.includes('torn.com/forums.php')) {
            // Try to find the forum header specifically - this should work on all forum pages
            const forumHeader = document.querySelector('div.content-title.m-bottom10');
            if (forumHeader) {
                debugLog('Found forum-specific header');
                return forumHeader;
            }

            // Secondary attempt for forum pages - look for skip-to-content
            const skipToContent = document.getElementById('skip-to-content');
            if (skipToContent) {
                const parentHeader = skipToContent.closest('.content-title, .page-head');
                if (parentHeader) {
                    debugLog('Found forum header via skip-to-content');
                    return parentHeader;
                }
            }
        }

        // Standard header detection for non-forum pages
        const possibleHeaders = [
            document.querySelector('.appHeader___gUnYC'),
            document.querySelector('.content-title'),
            document.querySelector('.tutorial-cont'),
            document.querySelector('.cont-gray'),
            document.querySelector('.content-wrapper .header'),
            document.querySelector('.content-wrapper .title-black'),
            document.querySelector('.captionWithActionContainment___nVTbE'),
            document.querySelector('.pageTitle___CaFrO'),
            document.querySelector('.sortable-list .title'),
            document.querySelector('.topSection___CfKvI'),
            document.querySelector('.mainStatsContainer___TXO7F'),
            document.querySelector('div[role="heading"]'),
            document.querySelector('#mainContainer > div.content-wrapper.winter > div.content-title.m-bottom10 h4'),
            document.querySelector('.titleContainer___QrlWP .title___rhtB4'),
            document.querySelector('div.content-title h4'),
            document.querySelector('.title-black'),
            document.querySelector('.clearfix .t-black'),
            document.querySelector('.page-head > h4'),
            document.querySelector('#react-root > div > div.appHeader___gUnYC.crimes-app-header > h4'),
            document.querySelector('div.appHeader___gUnYC h4'),
            document.querySelector('#skip-to-content'),
            document.querySelector('.header-title'),
            document.querySelector('.mobile-title'),
            document.querySelector('.app-header')
        ];

        return possibleHeaders.find(header => header !== null);
    }

    function createFixedHeader() {
        let fixedHeader = document.getElementById('torn-booster-fixed-header');

        if (!fixedHeader) {
            fixedHeader = document.createElement('div');
            fixedHeader.id = 'torn-booster-fixed-header';
            fixedHeader.style.position = 'fixed';
            fixedHeader.style.top = '50px';
            fixedHeader.style.right = '20px';
            fixedHeader.style.zIndex = '9999';
            fixedHeader.style.backgroundColor = 'rgba(34, 34, 34, 0.8)';
            fixedHeader.style.padding = '5px 10px';
            fixedHeader.style.borderRadius = '5px';
            fixedHeader.style.display = 'flex';
            fixedHeader.style.alignItems = 'center';
            fixedHeader.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            document.body.appendChild(fixedHeader);
        }

        return fixedHeader;
    }

    function createAlert() {
        let header = findHeader();

        if (!header) {
            header = createFixedHeader();
        }

        // Always remove existing alert and GUI
        removeExistingAlerts(); // Use the dedicated function

        // Create alert button
        const alert = document.createElement('div');
        alert.className = 'booster-alert';
        alert.textContent = 'No Boosters';
        alert.style.cursor = 'pointer';
        alert.style.backgroundColor = '#2196F3';

        // Position the alert
        positionBoosterAlert(alert, header);

        // Check if we're on the correct pages
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryBoostersPage = window.location.href.includes('factions.php') &&
                                             window.location.href.includes('armoury') &&
                                            (window.location.href.includes('sub=boosters') ||
                                             window.location.href.includes('tab=armoury'));
        const isOtherFactionPage = window.location.href.includes('factions.php') &&
                                   (!window.location.href.includes('armoury') ||
                                    (!window.location.href.includes('sub=boosters') &&
                                     !window.location.href.includes('tab=armoury')));

        debugLog(`Page check - Items: ${isItemsPage}, Faction Armoury Boosters: ${isFactionArmouryBoostersPage}, Other Faction: ${isOtherFactionPage}`);

        // Create GUI only if on the appropriate page
        let gui = null;
        // Create GUI regardless of page, but only show it when needed
        gui = document.createElement('div');
        gui.className = 'booster-gui';
        gui.id = 'boosterGui';
        gui.innerHTML = `
            <h3>Take Boosters</h3>
            <div class="settings-section">
                <div class="settings-toggle">
                    <input type="checkbox" id="useFactionBoosters" ${useFactionBoosters ? 'checked' : ''}>
                    <label for="useFactionBoosters">Use Faction Armoury Boosters</label>
                </div>
            </div>
            <input type="text" class="booster-search" placeholder="Search boosters...">

            <div class="category-header energy-header" data-category="energy">
                <span>Energy Boosters</span>
                <button class="toggle-category">-</button>
            </div>
            <div class="booster-list energy-list"></div>

            <div class="category-header nerve-header" data-category="nerve">
                <span>Nerve Boosters</span>
                <button class="toggle-category">-</button>
            </div>
            <div class="booster-list nerve-list"></div>

            <div class="category-header happy-header" data-category="happy">
                <span>Happy Boosters</span>
                <button class="toggle-category">-</button>
            </div>
            <div class="booster-list happy-list"></div>

            <div class="category-header statEnhancers-header" data-category="statEnhancers">
                <span>Stat Enhancers</span>
                <button class="toggle-category">-</button>
            </div>
            <div class="booster-list statEnhancers-list"></div>
        `;

        document.body.appendChild(gui);

        // Add event listener for faction boosters checkbox
        const factionBoostersCheckbox = gui.querySelector('#useFactionBoosters');
        if (factionBoostersCheckbox) {
            factionBoostersCheckbox.addEventListener('change', function() {
                useFactionBoosters = this.checked;
                localStorage.setItem('useFactionBoosters', useFactionBoosters);
                debugLog(`Using faction boosters set to: ${useFactionBoosters}`);

                // Update UI immediately if needed
                showNotification(`${useFactionBoosters ? 'Using faction armoury boosters' : 'Using personal inventory boosters'}`, 'info');

                // Close GUI since the booster source changed
                gui.style.display = 'none';

                // Recreate alert with new settings (optional, could just update state)
                // removeExistingAlerts();
                // alertElements = createAlert(); // This might cause flicker, consider just updating state
            });
        }

        // Add search functionality
        const searchInput = gui.querySelector('.booster-search');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const allBoosterItems = gui.querySelectorAll('.booster-item');

            allBoosterItems.forEach(item => {
                const boosterName = item.getAttribute('data-name').toLowerCase();
                if (searchTerm === '' || boosterName.includes(searchTerm)) {
                    item.style.display = 'block'; // Use block or grid depending on list style
                } else {
                    item.style.display = 'none';
                }
            });

            // Show/hide category headers based on visible items
            const categories = ['energy', 'nerve', 'happy', 'statEnhancers'];
            categories.forEach(category => {
                const categoryHeader = gui.querySelector(`.${category}-header`);
                const categoryList = gui.querySelector(`.${category}-list`); // Get the list container
                const categoryItems = categoryList.querySelectorAll('.booster-item');
                const visibleItems = Array.from(categoryItems).filter(item => item.style.display !== 'none');

                if (visibleItems.length === 0) {
                    categoryHeader.style.display = 'none';
                    categoryList.style.display = 'none'; // Hide the list too if empty
                } else {
                    categoryHeader.style.display = 'flex'; // Changed to flex for the new layout
                    // Only show the list if it's not manually collapsed
                    const isMinimized = localStorage.getItem(`boosterCategory_${category}`) === 'minimized';
                    if (!isMinimized) {
                         categoryList.style.display = 'grid'; // Show the list (assuming grid layout)
                    }
                }
            });
        });

        // Add category toggle functionality
        function setupCategoryToggles() {
            const categories = ['energy', 'nerve', 'happy', 'statEnhancers'];

            categories.forEach(category => {
                const header = gui.querySelector(`.${category}-header`);
                const list = gui.querySelector(`.${category}-list`);
                const toggleBtn = header.querySelector('.toggle-category');

                // Load saved state
                const isMinimized = localStorage.getItem(`boosterCategory_${category}`) === 'minimized';
                if (isMinimized) {
                    list.style.display = 'none';
                    toggleBtn.textContent = '+';
                } else {
                    list.style.display = 'grid'; // Ensure expanded by default if not minimized
                    toggleBtn.textContent = '-';
                }

                // Toggle on header click
                header.addEventListener('click', function(e) {
                    // Only toggle if clicking the header itself or the toggle button
                    if (e.target === header || e.target === toggleBtn || e.target === header.querySelector('span')) {
                        toggleCategory(category, list, toggleBtn);
                    }
                });
            });
        }

        function toggleCategory(category, listElement, toggleBtn) {
            const isCurrentlyVisible = listElement.style.display !== 'none';

            if (isCurrentlyVisible) {
                // Minimize
                listElement.style.display = 'none';
                toggleBtn.textContent = '+';
                localStorage.setItem(`boosterCategory_${category}`, 'minimized');
            } else {
                // Expand
                listElement.style.display = 'grid'; // Use grid display when expanding
                toggleBtn.textContent = '-';
                localStorage.setItem(`boosterCategory_${category}`, 'expanded');
            }
        }

        // Populate booster lists by category
        populateBoosterList(gui.querySelector('.energy-list'), BOOSTERS.energy, 'energy-item');
        populateBoosterList(gui.querySelector('.nerve-list'), BOOSTERS.nerve, 'nerve-item');
        populateBoosterList(gui.querySelector('.happy-list'), BOOSTERS.happy, 'happy-item');
        populateBoosterList(gui.querySelector('.statEnhancers-list'), BOOSTERS.statEnhancers, 'stat-item');

        // Setup toggles after populating lists
        setupCategoryToggles(); // Call it directly now

        // Add click outside to close
        document.addEventListener('click', function(e) {
            if (gui.style.display === 'block' && !gui.contains(e.target) && !alert.contains(e.target)) {
                gui.style.display = 'none';
            }
        });


        // Add click handler based on page context
        alert.onclick = function(event) {
            debugLog(`Alert clicked. Items page: ${isItemsPage}, Faction armoury boosters page: ${isFactionArmouryBoostersPage}, Other faction page: ${isOtherFactionPage}, Using faction boosters: ${useFactionBoosters}`);
            event.stopPropagation();

            if ((isItemsPage && !useFactionBoosters) || (isFactionArmouryBoostersPage && useFactionBoosters)) {
                // If on the correct page, show the GUI
                debugLog('Showing GUI on appropriate page');
                // showNotification('Opening booster selection', 'info'); // Optional notification
                gui.style.display = gui.style.display === 'block' ? 'none' : 'block'; // Toggle display
                void gui.offsetWidth; // Force reflow
            } else if (isOtherFactionPage && useFactionBoosters) {
                // If on a faction page but not the armoury boosters page and using faction boosters
                debugLog('Already on faction page but need to navigate to armoury boosters sub-page');
                const targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=boosters';
                sessionStorage.setItem('fromBoosterAlert', 'true');
                showNotification('Navigating to faction armoury boosters page...', 'info');
                window.location.href = targetUrl;
            } else {
                // If not on the correct page, navigate to the appropriate page
                const targetUrl = useFactionBoosters
                    ? 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=boosters'
                    : 'https://www.torn.com/item.php';

                debugLog(`Navigating to ${targetUrl}`);
                // Store a flag so we know to open the GUI when we arrive at the page
                sessionStorage.setItem('fromBoosterAlert', 'true');
                showNotification(`Navigating to ${useFactionBoosters ? 'faction armoury' : 'items'} page...`, 'info');
                window.location.href = targetUrl;
            }

            return false;
        };

        return { alert, gui };
    }

    function populateBoosterList(container, boosters, className) {
        container.innerHTML = ''; // Clear previous items
        boosters.forEach(booster => {
            const boosterItem = document.createElement('div');
            boosterItem.className = `booster-item ${className}`;
            boosterItem.setAttribute('data-name', booster.name);
            boosterItem.setAttribute('data-id', booster.id);

            // Add effect info for other boosters
            if (booster.effect) {
                boosterItem.textContent = `${booster.name} (${booster.effect})`;
            } else {
                boosterItem.textContent = booster.name;
            }

            boosterItem.onclick = () => {
                useBooster(booster.id, booster.name);
                const gui = document.getElementById('boosterGui');
                if (gui) gui.style.display = 'none';
            };

            container.appendChild(boosterItem);
        });
    }

    function useBooster(id, name) {
        debugLog(`Attempting to use booster: ${name} (ID: ${id}), Using faction boosters: ${useFactionBoosters}`);
        showNotification(`Using ${name}...`, 'info');

        // Close GUI if open
        const gui = document.getElementById('boosterGui');
        if (gui) {
            gui.style.display = 'none';
        }

        if (useFactionBoosters) {
            tryFactionBoosterUseMethod(id, name);
        } else {
            tryDirectUseMethod(id, name);
        }
    }

    function tryDirectUseMethod(id, name) {
        debugLog('Attempting direct use method with XMLHttpRequest');

        // Store booster use data for tracking
        sessionStorage.setItem('boosterUseInProgress', JSON.stringify({
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

        const token = getNSTStyleToken();
        if (token) {
            debugLog(`Using NST-style token: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
            submitBoosterUseRequest(id, name, token);
        } else {
            debugLog('No token found via NST method, trying backup methods');

            const pageToken = getPageCsrfToken();
            if (pageToken) {
                debugLog(`Using page token: ${pageToken.substring(0, 4)}...${pageToken.substring(pageToken.length - 4)}`);
                submitBoosterUseRequest(id, name, pageToken);
                return;
            }

            debugLog('Failed to get token from any source');
            showNotification(`Unable to use ${name}: Could not get authorization token`, 'error');
            sessionStorage.removeItem('boosterUseInProgress');
        }
    }

    function tryFactionBoosterUseMethod(id, name) {
        debugLog(`Attempting faction armoury booster use for ${name} (ID: ${id})`);

        sessionStorage.setItem('boosterUseInProgress', JSON.stringify({
            id: id,
            name: name,
            timestamp: Date.now(),
            method: 'faction'
        }));

        if (!window.location.href.includes('factions.php') ||
            !window.location.href.includes('armoury') ||
            (!window.location.href.includes('sub=boosters') && !window.location.href.includes('tab=armoury'))) {
            debugLog('Not on faction armoury page, need to navigate manually');
            showNotification(`Please navigate to faction armoury first to use ${name}`, 'info');

            // Store pending use data for after navigation
            sessionStorage.setItem('pendingFactionBoosterUse', JSON.stringify({
                id: id,
                name: name
            }));

            // Navigate to faction armoury boosters page
            window.location.href = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=boosters';
            return;
        }

        const token = getNSTStyleToken();
        if (!token) {
            const pageToken = getPageCsrfToken();
            if (!pageToken) {
                debugLog('No CSRF token found for faction booster via any method');
                showNotification('Unable to use faction booster: Authorization token not found', 'error');
                sessionStorage.removeItem('boosterUseInProgress');
                return;
            }

            debugLog(`Using page token for faction booster: ${pageToken.substring(0, 4)}...${pageToken.substring(pageToken.length - 4)}`);

            // Try both methods with a small timeout between
            tryBothFactionBoosterMethods(id, name, pageToken);
        } else {
            debugLog(`Using NST-style token for faction booster: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);

            // Try both methods with a small timeout between
            tryBothFactionBoosterMethods(id, name, token);
        }
    }

    function tryBothFactionBoosterMethods(id, name, token) {
        // First, try using the item directly with the simpler API
        debugLog('Trying direct faction booster use method first');
        useFactionBoosterById(id, name, token);

        // As a backup, also try the armoryItemID approach after a short delay
        setTimeout(() => {
            // Only proceed if we're still in a booster use attempt
            if (sessionStorage.getItem('boosterUseInProgress')) {
                debugLog('Direct method may not have succeeded, trying traditional method');
                useFactionBoosterDirectly(id, name); // Note: This will fetch token again, might be redundant but safer
            }
        }, 2000);
    }

    function useFactionBoosterById(id, name, token) {
        debugLog(`Directly using faction booster with ID: ${id}`);

        const params = new URLSearchParams();
        params.append('step', 'useItem');
        params.append('confirm', 'yes');
        params.append('itemID', id);
        params.append('fac', '1'); // Flag to indicate faction item
        params.append('csrf', token);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/item.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            let boosterUsedSuccessfully = false;
            if (this.status === 200) {
                try {
                    // First try parsing as JSON
                    try {
                        const response = JSON.parse(this.responseText);

                        if (response && (response.success || (response.message && response.message.includes('consumed')))) {
                            debugLog('Faction booster used successfully via direct method (JSON)');
                            boosterUsedSuccessfully = true;
                        } else if (response.error || response.message) {
                            const errorMessage = response.error || response.message;
                            debugLog('Direct method returned error (JSON):', errorMessage);
                            showNotification(`Error: ${errorMessage}`, 'error');
                            sessionStorage.removeItem('boosterUseInProgress'); // Clear progress on error
                            return; // Stop processing
                        }
                    } catch (parseError) {
                        // If not JSON, check text response
                        debugLog('Direct method response is not JSON, checking text');
                        const responseText = this.responseText || '';
                        if (responseText.includes('success') || responseText.includes('used') || responseText.includes('consumed')) {
                            debugLog('Found success in text response from direct method');
                            boosterUsedSuccessfully = true;
                        } else if (responseText.includes('cooldown') || responseText.includes('wait') || responseText.includes('effect of a booster')) {
                            const timeMatches = responseText.match(/(\d+)m\s+(\d+)s|(\d+)\s+seconds|(\d+)\s+minutes/);
                            let cooldownMessage = 'You are on booster cooldown';
                            if (timeMatches) {
                                // ... [cooldown message formatting logic] ...
                                if (timeMatches[1] && timeMatches[2]) cooldownMessage = `Booster Cooldown: ${timeMatches[1]}m ${timeMatches[2]}s remaining`;
                                else if (timeMatches[3]) cooldownMessage = `Booster Cooldown: 0m ${timeMatches[3]}s remaining`;
                                else if (timeMatches[4]) cooldownMessage = `Booster Cooldown: ${timeMatches[4]}m 0s remaining`;
                            }
                            showNotification(cooldownMessage, 'info');
                            sessionStorage.removeItem('boosterUseInProgress'); // Clear progress on cooldown
                            return; // Stop processing
                        } else {
                            debugLog('Direct method gave unclear text response:', responseText.substring(0, 100) + '...');
                            // Don't clear progress yet, let the other method try
                        }
                    }
                } catch (e) {
                    debugLog('Error processing direct method response:', e);
                    // Don't clear progress yet, let the other method try
                }
            } else {
                debugLog('Direct method request failed with status:', this.status);
                // Don't clear progress yet, let the other method try
            }

            if (boosterUsedSuccessfully) {
                showNotification(`Used ${name} from faction armoury successfully!`, 'success');
                sessionStorage.removeItem('boosterUseInProgress'); // Clear progress on success
                // Optionally trigger cooldown check immediately
                setTimeout(startCooldownChecks, 500);
            }
        };

        xhr.onerror = function() {
            debugLog('Direct method request failed with network error');
            // Don't clear progress yet, let the other method try
        };

        xhr.send(params.toString());
    }

    function useFactionBoosterDirectly(id, name) {
        debugLog(`Using faction booster via armoury (traditional): ${name} (ID: ${id})`);

        const token = getNSTStyleToken() || getPageCsrfToken(); // Get token again just in case
        if (!token) {
            debugLog('No CSRF token found for traditional faction booster method');
            showNotification('Unable to use faction booster: Authorization token not found', 'error');
            sessionStorage.removeItem('boosterUseInProgress');
            return;
        }
        debugLog(`Using token for traditional method: ${token.substring(0, 4)}...`);
        useFactionBoosterWithToken(id, name, token);
    }


    function useFactionBoosterWithToken(id, name, token) {
        let armouryItemID = null;

        // Try to find the armouryItemID in the page
        const boosterItems = document.querySelectorAll('#armoury-boosters ul.item-list li, #faction-armoury .boosters-wrap .item, div[class*="armory"] div[class*="boosters"] div[class*="item"]');
        debugLog(`Traditional faction armoury search found ${boosterItems.length} potential items`);

        // --- Logic to find armouryItemID based on name and action links ---
        // (This complex DOM searching logic remains the same)
        for (const item of boosterItems) {
            const nameElements = [
                item.querySelector('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"], [class*="title"]'),
                item.querySelector('div[class*="name"], div[class*="title"], span[class*="name"], span[class*="title"]'),
                ...item.querySelectorAll('*') // Wider search within the item
            ];

            for (const nameElement of nameElements) {
                if (!nameElement || !nameElement.textContent) continue;

                const itemName = nameElement.textContent.trim();
                // Use includes for more flexible matching
                if (itemName && (itemName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(itemName.toLowerCase()))) {
                    debugLog(`Found matching booster name: "${itemName}"`);

                    const actionLinks = [
                        item.querySelector('div.item-action a, .actions a, a[class*="action"], button[class*="action"]'),
                        item.querySelector('a[href*="armoryItemID="], a[href*="step=armoryItemAction"]'),
                        item.querySelector('a.t-blue, a.t-blue-cont'),
                        ...item.querySelectorAll('a[class*="use"], button[class*="use"], a.act-use, div.use, span.use, [data-action="use"]') // Added data-action
                    ];

                    for (const actionLink of actionLinks) {
                         if (!actionLink) continue;

                        let match = null;
                        let potentialId = null;

                        // Check href
                        if (actionLink.href) {
                            debugLog(`Checking action link href: ${actionLink.href}`);
                            match = actionLink.href.match(/armoryItemID=(\d+)/) || actionLink.href.match(/itemID=(\d+)/);
                            if (match) potentialId = match[1];
                        }

                        // Check onclick
                        if (!potentialId && actionLink.getAttribute('onclick')) {
                            const onclick = actionLink.getAttribute('onclick');
                            match = onclick.match(/armoryItemAction\((\d+)/) || onclick.match(/useItem\((\d+)/) || onclick.match(/(\d+)/); // Look for function calls or just numbers
                             if (match) potentialId = match[1];
                        }

                        // Check data attributes
                        if (!potentialId && actionLink.dataset) {
                            for (const key in actionLink.dataset) {
                                if (key.toLowerCase().includes('id') || key.toLowerCase().includes('itemid') || key.toLowerCase().includes('armory')) {
                                    debugLog(`Found potential ID in data attribute ${key}: ${actionLink.dataset[key]}`);
                                    const value = actionLink.dataset[key];
                                    if (/^\d+$/.test(value)) {
                                        potentialId = value;
                                        break;
                                    }
                                }
                            }
                        }

                        if (potentialId) {
                            armouryItemID = potentialId;
                            debugLog(`Found armouryItemID: ${armouryItemID}`);
                            break; // Found ID for this item name
                        }
                    }
                    if (armouryItemID) break; // Found ID for this item name
                }
            }
            if (armouryItemID) break; // Found ID, exit outer loop
        }
        // --- End of armouryItemID finding logic ---


        // If we couldn't find a matching item ID, use the provided ID as fallback
        if (!armouryItemID) {
            armouryItemID = id;
            debugLog(`Using provided ID as fallback for traditional method: ${armouryItemID}`);
        }

        const params = new URLSearchParams();
        params.append('step', 'armoryItemAction');
        params.append('confirm', 'yes');
        params.append('armoryItemID', armouryItemID);
        params.append('action', 'use');
        params.append('csrf', token);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/factions.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            let boosterUsedSuccessfully = false;
            if (this.status === 200) {
                try {
                    let response;
                    try {
                        response = JSON.parse(this.responseText);
                        if (response && (response.success || (response.message && response.message.includes('used')))) {
                            debugLog('Faction booster used successfully via traditional XHR (JSON)');
                            boosterUsedSuccessfully = true;
                        } else if (response && (response.text || response.message)) {
                             const messageText = response.text || response.message || '';
                             if (messageText.includes('cooldown') || messageText.includes('effect of a booster') || messageText.includes('wait')) {
                                // ... [cooldown message formatting logic] ...
                                const timeMatch = messageText.match(/data-time=\"(\d+)\"/) || messageText.match(/wait\s+(\d+)m\s+(\d+)s/) || messageText.match(/wait\s+(\d+)\s+seconds/) || messageText.match(/wait\s+(\d+)\s+minutes/);
                                let cooldownMessage = 'You are on booster cooldown';
                                let seconds = 0;
                                if (timeMatch) {
                                    if (timeMatch.length === 2 && /^\d+$/.test(timeMatch[1])) seconds = parseInt(timeMatch[1]); // data-time or seconds/minutes match
                                    else if (timeMatch.length === 3) seconds = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]); // m s match
                                }
                                if (seconds > 0) {
                                    const minutes = Math.floor(seconds / 60);
                                    const remainingSeconds = seconds % 60;
                                    cooldownMessage = `Booster Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
                                } else {
                                    const tempDiv = document.createElement('div'); tempDiv.innerHTML = messageText;
                                    cooldownMessage = (tempDiv.textContent || tempDiv.innerText || '').trim() || 'You are on booster cooldown';
                                }
                                showNotification(cooldownMessage, 'info');
                                sessionStorage.removeItem('boosterUseInProgress'); // Clear on cooldown
                                return;
                             } else {
                                 const tempDiv = document.createElement('div'); tempDiv.innerHTML = messageText;
                                 const errorMessage = (tempDiv.textContent || tempDiv.innerText || '').trim() || 'Unknown error';
                                 debugLog('Traditional XHR method returned error (JSON text):', errorMessage);
                                 showNotification(`Error: ${errorMessage}`, 'error');
                                 sessionStorage.removeItem('boosterUseInProgress'); // Clear on error
                                 return;
                             }
                        } else {
                             debugLog('Traditional XHR method returned unclear JSON:', response);
                             showNotification('Error using faction booster: Unexpected JSON response', 'error');
                             sessionStorage.removeItem('boosterUseInProgress'); // Clear on unclear error
                             return;
                        }

                    } catch (parseError) {
                        debugLog('Traditional response is not valid JSON, handling as HTML/text:', this.responseText.substring(0, 100) + '...');
                        const successPattern = /used|consumed|taken|success/i;
                        const cooldownPattern = /cooldown|wait|effect of a booster/i;

                        if (successPattern.test(this.responseText)) {
                            debugLog('Found success indicator in raw traditional response');
                            boosterUsedSuccessfully = true;
                        } else if (cooldownPattern.test(this.responseText)) {
                            // ... [cooldown message formatting logic for raw text] ...
                            const timeMatches = this.responseText.match(/(\d+)m\s+(\d+)s|(\d+)\s+seconds|(\d+)\s+minutes/);
                            let cooldownMessage = 'You are on booster cooldown';
                            if (timeMatches) {
                                if (timeMatches[1] && timeMatches[2]) cooldownMessage = `Booster Cooldown: ${timeMatches[1]}m ${timeMatches[2]}s remaining`;
                                else if (timeMatches[3]) cooldownMessage = `Booster Cooldown: 0m ${timeMatches[3]}s remaining`;
                                else if (timeMatches[4]) cooldownMessage = `Booster Cooldown: ${timeMatches[4]}m 0s remaining`;
                            }
                            showNotification(cooldownMessage, 'info');
                            sessionStorage.removeItem('boosterUseInProgress'); // Clear on cooldown
                            return;
                        } else {
                            const errorMatch = this.responseText.match(/<[^>]*class=['"]error['"][^>]*>(.*?)<\/|Validation failed|Error:|not authorized/i);
                            let errorMessage = 'Unexpected response format';
                            if (errorMatch) {
                                errorMessage = errorMatch[1] || 'Validation failed - please try again';
                                if (errorMatch[0].includes('not authorized')) errorMessage = 'Not authorized to use faction boosters';
                            }
                            debugLog('Found error message in raw traditional response:', errorMessage);
                            showNotification(`Error: ${errorMessage}`, 'error');
                            sessionStorage.removeItem('boosterUseInProgress'); // Clear on error
                            return;
                        }
                    }
                } catch (e) {
                    debugLog('Error parsing traditional XHR response:', e);
                    showNotification('Error using faction booster: Response parsing error', 'error');
                    sessionStorage.removeItem('boosterUseInProgress'); // Clear on parsing error
                    return;
                }
            } else {
                debugLog('Traditional XHR request failed with status:', this.status);
                showNotification(`Error using faction booster: Request failed (${this.status})`, 'error');
                sessionStorage.removeItem('boosterUseInProgress'); // Clear on request failure
                return;
            }

            // Handle success if flag is set
            if (boosterUsedSuccessfully) {
                showNotification(`Used ${name} from faction armoury successfully!`, 'success');
                sessionStorage.removeItem('boosterUseInProgress'); // Clear progress on success
                // Optionally trigger cooldown check immediately
                setTimeout(startCooldownChecks, 500);
            }
        };

        xhr.onerror = function() {
            debugLog('Traditional XHR request failed with network error');
            showNotification('Error using faction booster: Network error', 'error');
            sessionStorage.removeItem('boosterUseInProgress'); // Clear on network error
        };

        xhr.send(params.toString());
    }


    function submitBoosterUseRequest(id, name, token) {
        const params = new URLSearchParams();
        params.append('step', 'useItem');
        params.append('confirm', 'yes');
        params.append('itemID', id);
        params.append('csrf', token);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/item.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onload = function() {
            let boosterUsedSuccessfully = false;
            if (this.status === 200) {
                try {
                    const response = JSON.parse(this.responseText);

                    if (response && (response.success || (response.message && response.message.includes('consumed')))) {
                        debugLog('Personal booster used successfully via XHR');
                        boosterUsedSuccessfully = true;
                    } else if (response && (response.message || response.text)) {
                        const messageText = response.message || response.text || '';
                        if (messageText.includes('cooldown') || messageText.includes('effect of a booster') || messageText.includes('wait')) {
                            debugLog('Personal booster is on cooldown');
                            // ... [cooldown message formatting logic] ...
                            let cooldownMessage = 'You are already on booster cooldown';
                            let seconds = 0;
                            const timeMatch = messageText.match(/data-time=\"(\d+)\"/) || messageText.match(/wait\s+(\d+)m\s+(\d+)s/) || messageText.match(/wait\s+(\d+)\s+seconds/) || messageText.match(/wait\s+(\d+)\s+minutes/);
                            if (timeMatch) {
                                if (timeMatch.length === 2 && /^\d+$/.test(timeMatch[1])) seconds = parseInt(timeMatch[1]);
                                else if (timeMatch.length === 3) seconds = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
                            }
                            if (seconds > 0) {
                                const minutes = Math.floor(seconds / 60);
                                const remainingSeconds = seconds % 60;
                                cooldownMessage = `Booster Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
                            } else {
                                const tempDiv = document.createElement('div'); tempDiv.innerHTML = messageText;
                                cooldownMessage = (tempDiv.textContent || tempDiv.innerText || '').trim() || 'You are on booster cooldown';
                            }
                            showNotification(cooldownMessage, 'info');
                            sessionStorage.removeItem('boosterUseInProgress'); // Clear on cooldown
                            return;
                        } else {
                            debugLog('Personal XHR method returned error:', messageText);
                            showNotification(`Error: ${messageText || 'Unknown error'}`, 'error');
                            sessionStorage.removeItem('boosterUseInProgress'); // Clear on error
                            return;
                        }
                    } else {
                         debugLog('Unexpected personal XHR response (JSON):', response);
                         showNotification(`Unable to use ${name}: Unexpected response`, 'error');
                         sessionStorage.removeItem('boosterUseInProgress'); // Clear on unexpected response
                         return;
                    }
                } catch (e) {
                    // Check raw text if JSON parsing fails
                    const responseText = this.responseText || '';
                     if (responseText.includes('success') || responseText.includes('used') || responseText.includes('consumed')) {
                            debugLog('Found success in raw personal response text');
                            boosterUsedSuccessfully = true;
                    } else if (responseText.includes('cooldown') || responseText.includes('wait') || responseText.includes('effect of a booster')) {
                            // ... [cooldown message formatting logic for raw text] ...
                            const timeMatches = responseText.match(/(\d+)m\s+(\d+)s|(\d+)\s+seconds|(\d+)\s+minutes/);
                            let cooldownMessage = 'You are on booster cooldown';
                            if (timeMatches) {
                                if (timeMatches[1] && timeMatches[2]) cooldownMessage = `Booster Cooldown: ${timeMatches[1]}m ${timeMatches[2]}s remaining`;
                                else if (timeMatches[3]) cooldownMessage = `Booster Cooldown: 0m ${timeMatches[3]}s remaining`;
                                else if (timeMatches[4]) cooldownMessage = `Booster Cooldown: ${timeMatches[4]}m 0s remaining`;
                            }
                            showNotification(cooldownMessage, 'info');
                            sessionStorage.removeItem('boosterUseInProgress'); // Clear on cooldown
                            return;
                    } else {
                        debugLog('Error parsing personal XHR response and raw text unclear:', e, responseText.substring(0,100));
                        showNotification(`Unable to use ${name}: Response parsing error`, 'error');
                        sessionStorage.removeItem('boosterUseInProgress'); // Clear on parsing error
                        return;
                    }
                }
            } else {
                debugLog('Personal XHR request failed with status:', this.status);
                showNotification(`Unable to use ${name}: Request failed (${this.status})`, 'error');
                sessionStorage.removeItem('boosterUseInProgress'); // Clear on request failure
                return;
            }

            // Handle success if flag is set
            if (boosterUsedSuccessfully) {
                showNotification(`Used ${name} successfully!`, 'success');
                sessionStorage.removeItem('boosterUseInProgress'); // Clear progress on success
                // Optionally trigger cooldown check immediately
                setTimeout(startCooldownChecks, 500);
            }
        };

        xhr.onerror = function() {
            debugLog('Personal XHR request failed with network error');
            showNotification(`Unable to use ${name}: Network error`, 'error');
            sessionStorage.removeItem('boosterUseInProgress'); // Clear on network error
        };

        xhr.send(params.toString());
    }


    function showNotification(message, type = 'info') {
        // Remove existing notifications first
        const existingNotifications = document.querySelectorAll('.booster-notification');
        existingNotifications.forEach(note => note.remove());

        const notification = document.createElement('div');
        notification.className = `booster-notification ${type}`;

        // Sanitize message (basic HTML removal)
        let cleanMessage = message;
        if (typeof message === 'string' && message.includes('<') && message.includes('>')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = message; // Let browser parse HTML
            cleanMessage = tempDiv.textContent || tempDiv.innerText || message; // Extract text content
        }

        // Add specific styling for cooldown messages
        if (cleanMessage.toLowerCase().includes('cooldown')) {
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">Booster Cooldown Active</div>
                <div>${cleanMessage}</div>
            `;
            notification.style.minWidth = '280px';
            notification.style.padding = '15px 25px';
        } else {
            notification.textContent = cleanMessage;
        }

        document.body.appendChild(notification);

        // Animation
        notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
        notification.style.opacity = '0';
        void notification.offsetWidth; // Force reflow

        requestAnimationFrame(() => { // Use requestAnimationFrame for smoother animation start
            notification.style.transform = 'translate(-50%, -50%) scale(1)';
            notification.style.opacity = '1';
        });


        // Auto-hide
        setTimeout(() => {
             requestAnimationFrame(() => { // Use requestAnimationFrame for smoother fade out
                notification.style.opacity = '0';
                notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            });
            setTimeout(() => notification.remove(), 500); // Remove after fade out animation (500ms matches transition duration)
        }, 5000); // Notification duration

        debugLog(`Notification [${type}]: ${cleanMessage}`);
    }

    function getNSTStyleToken() {
        debugLog('Trying NST-style token retrieval');

        try {
            // Check cache first
            const cachedToken = sessionStorage.getItem('boosterAlertsOnlineStatusToken');
            const cachedTime = sessionStorage.getItem('boosterAlertsOnlineStatusTokenTime');

            if (cachedToken && cachedTime && (Date.now() - parseInt(cachedTime)) < 300000) { // 5 min cache
                debugLog('Using cached online status token');
                return cachedToken;
            }

            // Try RFC cookie as a potential token
            const rfcCookie = getRFC();
            if (rfcCookie) {
                debugLog('Using RFC cookie as token');
                sessionStorage.setItem('boosterAlertsOnlineStatusToken', rfcCookie);
                sessionStorage.setItem('boosterAlertsOnlineStatusTokenTime', Date.now().toString());
                return rfcCookie;
            }

            // Make synchronous request (Use with caution - can block UI)
            // Consider making this async if possible in the future
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://www.torn.com/onlinestatus.php?online', false); // SYNCHRONOUS!
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            try {
                xhr.send(null);

                if (xhr.status === 200) {
                    // Check headers first
                    const csrfHeader = xhr.getResponseHeader('X-CSRF-Token') ||
                                       xhr.getResponseHeader('csrf-token');

                    if (csrfHeader) {
                        debugLog('Found token in response headers');
                        sessionStorage.setItem('boosterAlertsOnlineStatusToken', csrfHeader);
                        sessionStorage.setItem('boosterAlertsOnlineStatusTokenTime', Date.now().toString());
                        return csrfHeader;
                    }

                    // Try parsing JSON response
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        if (responseData && responseData.csrf) {
                            debugLog('Found token in parsed JSON response');
                            sessionStorage.setItem('boosterAlertsOnlineStatusToken', responseData.csrf);
                            sessionStorage.setItem('boosterAlertsOnlineStatusTokenTime', Date.now().toString());
                            return responseData.csrf;
                        }
                    } catch (jsonError) {
                        debugLog('Response is not valid JSON, attempting regex extraction');
                        // Try regex on response text
                        const tokenMatch = xhr.responseText.match(/csrf["']?\s*:\s*["']([a-f0-9]{16,})["']/i);
                        if (tokenMatch && tokenMatch[1]) {
                            debugLog('Extracted token with regex from response text');
                            sessionStorage.setItem('boosterAlertsOnlineStatusToken', tokenMatch[1]);
                            sessionStorage.setItem('boosterAlertsOnlineStatusTokenTime', Date.now().toString());
                            return tokenMatch[1];
                        }
                    }
                }
            } catch (xhrError) {
                debugLog('XHR request failed:', xhrError);
            }

            // Final fallback: extract from current page
            return extractTokenFromPage();
        } catch (e) {
            debugLog('Error in getNSTStyleToken:', e);
            return extractTokenFromPage(); // Fallback if anything goes wrong
        }
    }

    function extractTokenFromPage() {
        try {
            // Look for specific script content patterns
            const scripts = document.querySelectorAll('script:not([src])');
            for (const script of scripts) {
                if (!script.textContent) continue;

                const patterns = [
                    /var\s+csrf\s*=\s*["']([a-f0-9]{16,})["']/, // var csrf = '...'
                    /csrf["']?\s*:\s*["']([a-f0-9]{16,})["']/, // { csrf: '...' }
                    /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, // window.csrf = '...'
                    /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, // csrf_token = '...'
                     /name="csrf"\s+value="([a-f0-9]{16,})"/ // Input field in script
                ];

                for (const pattern of patterns) {
                    const match = script.textContent.match(pattern);
                    if (match && match[1]) {
                        debugLog('Found token in page script tag');
                        return match[1];
                    }
                }
            }
        } catch (e) {
            debugLog('Error extracting token from scripts:', e);
        }

        try {
            // Look for input fields
            const csrfInputs = document.querySelectorAll('input[name="csrf"], input[name="csrf_token"], input[id="csrf"]');
            for (const input of csrfInputs) {
                if (input.value && /^[a-f0-9]{16,}$/i.test(input.value)) { // Check format
                    debugLog('Found token in page input field');
                    return input.value;
                }
            }
        } catch (e) {
            debugLog('Error extracting token from inputs:', e);
        }

        // Check global window variables
        if (typeof window.csrf !== 'undefined' && window.csrf && /^[a-f0-9]{16,}$/i.test(window.csrf)) {
            debugLog('Found token in window.csrf');
            return window.csrf;
        }
         if (typeof window.csrf_token !== 'undefined' && window.csrf_token && /^[a-f0-9]{16,}$/i.test(window.csrf_token)) {
            debugLog('Found token in window.csrf_token');
            return window.csrf_token;
        }

        // Check meta tags
         try {
            const metaTags = document.querySelectorAll('meta[name="csrf-token"]');
            for (const meta of metaTags) {
                if (meta.content && /^[a-f0-9]{16,}$/i.test(meta.content)) {
                     debugLog('Found token in meta tag');
                    return meta.content;
                }
            }
        } catch(e) {
             debugLog('Error extracting token from meta tags:', e);
        }


        debugLog('No token found in page');
        return null;
    }

    function getRFC() {
        // Try jQuery cookie if available
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const rfcCookie = $.cookie('rfc_v');
            if (rfcCookie) {
                debugLog('Found RFC in jQuery cookie:', rfcCookie);
                return rfcCookie;
            }
        }

        // Fallback to manual cookie parsing
        try {
            const cookies = document.cookie.split('; ');
            for (const cookie of cookies) {
                const [name, value] = cookie.split('=');
                if (name === 'rfc_v') {
                    debugLog('Found RFC in document.cookie:', value);
                    return value;
                }
            }
        } catch (e) {
            debugLog('Error parsing cookies for RFC:', e);
        }

        // Fallback to searching script tags (less reliable)
        try {
            const scripts = document.querySelectorAll('script:not([src])');
            for (const script of scripts) {
                if (!script.textContent) continue;

                const match = script.textContent.match(/var\s+rfcv\s*=\s*["']([^"']+)["']/);
                if (match && match[1]) {
                    debugLog('Found RFC in script tag:', match[1]);
                    return match[1];
                }
            }
        } catch (e) {
            debugLog('Error extracting RFC from scripts:', e);
        }

        debugLog('No RFC found');
        return null;
    }

    function getPageCsrfToken() {
        debugLog('Searching for token in page (getPageCsrfToken)');
        // Use the more robust extraction method
        return extractTokenFromPage();
    }

    function hasBoosterCooldown() {
        debugLog('Checking for booster cooldown...');

        // Primary check: Look for elements with the specific aria-label for booster cooldown
        const boosterCooldownElements = document.querySelectorAll('a[aria-label="Booster Cooldown"], [aria-label^="Booster Cooldown"]');
        if (boosterCooldownElements.length > 0) {
            for(const el of boosterCooldownElements) {
                // Check if the element is actually visible
                if (el.offsetParent !== null) {
                     debugLog('Found VISIBLE booster cooldown via aria-label');
                     return true;
                }
            }
             debugLog('Found booster cooldown via aria-label, but element might be hidden');
             // Don't return true yet if element is hidden, let other checks run
        }

        // Secondary check: Status icons area with cooldown text (fallback)
        const statusIcons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a, [class*="status-icon"], [class*="user-icon"]');
        for (const icon of statusIcons) {
            // Check visibility first
             if (icon.offsetParent === null) continue;

            const ariaLabel = icon.getAttribute('aria-label') || '';
            const title = icon.getAttribute('title') || '';
            const iconText = icon.textContent || '';
            const dataContent = icon.getAttribute('data-content') || ''; // For tooltips

            if ((ariaLabel.includes('Booster') && ariaLabel.includes('Cooldown')) ||
                (title.includes('Booster') && title.includes('Cooldown')) ||
                (dataContent.includes('Booster') && dataContent.includes('Cooldown')) ||
                (iconText.includes('Booster') && iconText.includes('Cooldown'))) {
                debugLog('Found booster cooldown in status icons via text attributes');
                return true;
            }

            // Check for specific image sources or classes if text fails
            const img = icon.querySelector('img');
            if (img && img.src && (img.src.includes('booster') || img.src.includes('cooldown'))) {
                 debugLog('Found booster cooldown via image source');
                 return true;
            }
            if (icon.className && typeof icon.className === 'string' && icon.className.includes('booster-cooldown')) { // Example class
                 debugLog('Found booster cooldown via specific class name');
                 return true;
            }
        }

        // Tertiary check: Look for specific icon ids (less reliable, last resort)
        const boosterIcons = document.querySelectorAll('#icon39, #icon40, #icon41, #icon42, #icon43'); // Torn's specific cooldown icon IDs
         for(const icon of boosterIcons) {
             if (icon.offsetParent !== null) { // Check visibility
                 debugLog('Found booster cooldown via icon IDs (fallback method)');
                 return true;
             }
         }

        debugLog('No booster cooldown detected');
        return false;
    }

    function checkForPendingAlert() {
        try {
            const fromAlert = sessionStorage.getItem('fromBoosterAlert');

            if (fromAlert) {
                debugLog('Detected navigation from booster alert');
                sessionStorage.removeItem('fromBoosterAlert'); // Clear the flag immediately

                const isItemsPage = window.location.href.includes('torn.com/item.php');
                const isFactionArmouryBoostersPage = window.location.href.includes('factions.php') &&
                                                     window.location.href.includes('armoury') &&
                                                    (window.location.href.includes('sub=boosters') ||
                                                     window.location.href.includes('tab=armoury'));

                // Check if we are now on the correct page based on the setting
                if ((isItemsPage && !useFactionBoosters) || (isFactionArmouryBoostersPage && useFactionBoosters)) {
                    debugLog('On appropriate page after navigation from alert');

                    // Wait a bit for the page and script elements to finish loading/initializing
                    setTimeout(() => {
                        // Ensure alertElements are properly initialized before trying to show GUI
                        if (!alertElements) {
                            removeExistingAlerts(); // Clean up just in case
                            alertElements = createAlert(); // Recreate if missing
                        }

                        if (alertElements && alertElements.gui) {
                            debugLog('Showing booster GUI after navigation');
                            alertElements.gui.style.display = 'block';
                        } else {
                            debugLog('Could not find GUI element to show after navigation');
                        }
                    }, 1500); // Increased delay slightly for potentially slower page loads
                } else {
                     debugLog('Not on the expected page after navigation, GUI not shown.');
                }
            }

            // Clear any potentially stale booster use progress flag on page load
             const boosterProgress = sessionStorage.getItem('boosterUseInProgress');
             if (boosterProgress) {
                 try {
                    const progressData = JSON.parse(boosterProgress);
                    // Clear if older than 1 minute to prevent stale flags
                    if (Date.now() - progressData.timestamp > 60000) {
                         debugLog('Clearing stale booster use progress flag.');
                         sessionStorage.removeItem('boosterUseInProgress');
                    }
                 } catch(e) {
                     debugLog('Error parsing booster progress, clearing flag.');
                     sessionStorage.removeItem('boosterUseInProgress');
                 }
             }

        } catch (e) {
            debugLog('Error in checkForPendingAlert:', e);
            sessionStorage.removeItem('boosterUseInProgress'); // Ensure cleanup on error
            sessionStorage.removeItem('fromBoosterAlert'); // Ensure cleanup on error
        }
    }

    function removeExistingAlerts() {
        const existingAlerts = document.querySelectorAll('.booster-alert');
        const existingGuis = document.querySelectorAll('.booster-gui');
        const existingNotifications = document.querySelectorAll('.booster-notification'); // Also remove notifications

        existingAlerts.forEach(alert => {
            debugLog('Removing existing alert:', alert.id || 'unnamed');
            alert.remove();
        });
        existingGuis.forEach(gui => {
            debugLog('Removing existing GUI:', gui.id || 'unnamed');
            gui.remove();
        });
         existingNotifications.forEach(note => {
            debugLog('Removing existing notification');
            note.remove();
        });


        alertElements = null; // Reset the reference
        debugLog('Removed all existing booster alerts, GUIs, and notifications');
    }

    let cooldownCheckInterval = null; // Store interval ID
    let cooldownObserver = null; // Store observer instance

    function startCooldownChecks() {
         // Clear previous checks if any
        if (cooldownCheckInterval) clearInterval(cooldownCheckInterval);
        if (cooldownObserver) cooldownObserver.disconnect();

        const checkCooldownLogic = () => {
            const hasCooldown = hasBoosterCooldown();
            debugLog(`Cooldown check: ${hasCooldown ? 'ON COOLDOWN' : 'NO COOLDOWN'}`);

            if (!hasCooldown) {
                if (!alertElements || !document.body.contains(alertElements.alert)) { // Only create if it doesn't exist or was removed
                    removeExistingAlerts(); // Clean up potential remnants
                    alertElements = createAlert();
                    debugLog('Created "No Boosters" alert');
                    // Check for pending alert display right after creation
                    checkForPendingAlert();
                }
            } else if (alertElements && document.body.contains(alertElements.alert)) { // If cooldown IS active and alert exists, remove it
                alertElements.alert.remove();
                if (alertElements.gui) alertElements.gui.remove();
                alertElements = null;
                debugLog('Removed "No Boosters" alert due to cooldown');
            }
        };

        // Initial check with a delay
        setTimeout(checkCooldownLogic, 1500); // Slightly increased delay

        // Use MutationObserver for faster updates
        cooldownObserver = new MutationObserver((mutations) => {
            // More targeted check: only run if status icons area or specific attributes changed
             const relevantMutation = mutations.some(mutation => {
                 // Check target or added/removed nodes related to status/icons
                 const targetNode = mutation.target;
                 const addedNodes = Array.from(mutation.addedNodes);
                 const removedNodes = Array.from(mutation.removedNodes);

                 const checkNode = (node) => node.nodeType === 1 && (
                     (node.className && typeof node.className === 'string' && node.className.includes('status-icon')) || // Class check
                     (node.id && node.id.startsWith('icon')) || // ID check
                     node.querySelector('[aria-label*="Cooldown"]') // Content check
                 );

                 return checkNode(targetNode) || addedNodes.some(checkNode) || removedNodes.some(checkNode);
             });

            if (relevantMutation) {
                debugLog('Relevant DOM mutation detected, re-checking cooldown.');
                checkCooldownLogic(); // Re-check immediately
            }
        });

        // Observe a more specific area if possible, fallback to body
        const observeTarget = document.querySelector('.status-icons__wrap') || document.querySelector('.user-icons__wrap') || document.body;
        cooldownObserver.observe(observeTarget, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'aria-label', 'title', 'style'] // Added style for visibility changes
        });

        // Periodic check as a fallback (less frequent)
        cooldownCheckInterval = setInterval(checkCooldownLogic, 60000); // Check every 60 seconds

        console.log('%c Booster Alerts Cooldown Checks Started ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    }


    // --- Initialization ---
    function initialize() {
        debugLog('Initializing Booster Alerts');

        // Load settings
        useFactionBoosters = localStorage.getItem('useFactionBoosters') === 'true';
        debugLog(`Initialized with faction boosters setting: ${useFactionBoosters}`);

        // Clean up any old elements first
        removeExistingAlerts();

        // Check if we need to process a pending faction booster use (e.g., after navigation)
        checkPendingFactionBoosterUse(); // Should run before first cooldown check

        // Check if we navigated from an alert click (will be handled by startCooldownChecks now)
        // checkForPendingAlert(); // Moved logic into startCooldownChecks

        // Start the main cooldown checking loop
        startCooldownChecks();

        // Add mutation observer for forum pages to handle AJAX navigation
        setupForumMutationObserver();
    }

    function setupForumMutationObserver() {
        // Only set this up on forum pages
        if (!window.location.href.includes('torn.com/forums.php')) {
            return;
        }

        debugLog('Setting up forum mutation observer');

        // Target the main container that holds forum content
        const forumContainer = document.getElementById('mainContainer') || document.body;

        const observer = new MutationObserver((mutations) => {
            // Check if the main content title area was potentially replaced
            const titleChanged = mutations.some(mutation =>
                Array.from(mutation.addedNodes).some(node => node.nodeType === 1 && node.classList && node.classList.contains('content-title')) ||
                Array.from(mutation.removedNodes).some(node => node.nodeType === 1 && node.classList && node.classList.contains('content-title'))
            );


            if (titleChanged) {
                debugLog('Forum content title changed, re-evaluating alert placement');
                // Wait a moment for DOM to settle after potential AJAX load
                setTimeout(() => {
                    // Re-run the check/creation logic which includes finding the header
                    startCooldownChecks();
                }, 750); // Slightly longer delay for forum AJAX
            }
        });

        observer.observe(forumContainer, {
            childList: true,
            subtree: true, // Need subtree to detect changes within the container
            attributes: false
        });

        debugLog('Forum mutation observer started');
    }

    function checkPendingFactionBoosterUse() {
        const pendingUseData = sessionStorage.getItem('pendingFactionBoosterUse');

        if (pendingUseData) {
            try {
                const pendingUse = JSON.parse(pendingUseData);
                const isFactionArmouryBoostersPage = window.location.href.includes('factions.php') &&
                                                     window.location.href.includes('armoury') &&
                                                    (window.location.href.includes('sub=boosters') ||
                                                     window.location.href.includes('tab=armoury'));

                // Only proceed if we're now on the faction armoury boosters page
                if (isFactionArmouryBoostersPage && pendingUse.id && pendingUse.name) {
                    debugLog(`Processing pending faction booster use: ${pendingUse.name} (ID: ${pendingUse.id})`);

                    // Clear the pending use data first to prevent loops
                    sessionStorage.removeItem('pendingFactionBoosterUse');

                    // Small delay to ensure page is fully loaded and script initialized
                    setTimeout(() => {
                        useBooster(pendingUse.id, pendingUse.name);
                    }, 1500); // Increased delay
                } else if (!isFactionArmouryBoostersPage) {
                    debugLog('Still not on faction armoury boosters page, keeping pending use data');
                    // Don't remove the item yet, maybe the page hasn't loaded fully or user navigated away
                } else {
                    // If we are on the page but data is invalid, clear it
                    debugLog('Clearing invalid pending faction booster use data');
                    sessionStorage.removeItem('pendingFactionBoosterUse');
                }
            } catch (e) {
                debugLog('Error processing pending faction booster use:', e);
                sessionStorage.removeItem('pendingFactionBoosterUse'); // Clear on error
            }
        }
    }

    // --- Start the script execution ---
    // Use window.onload or DOMContentLoaded to ensure the initial DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize(); // DOM is already ready
    }

})();
