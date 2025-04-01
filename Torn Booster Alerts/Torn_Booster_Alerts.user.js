// ==UserScript==
// @name          Torn Booster Alert
// @version       1.0.24
// @description   Alerts when no booster cooldown is active and allows taking boosters from any page
// @author        GNSC4 [268863]
// @match         https://www.torn.com/*
// @grant         GM_addStyle
// @icon          https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @updateURL     https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Booster%20Alerts/Torn_Booster_Alerts.user.js
// @downloadURL   https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Booster%20Alerts/Torn_Booster_Alerts.user.js
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
            width: 500px;
            max-height: 600px;
            overflow-y: auto;
            display: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7);
            border: 1px solid #444;
        }

        .booster-gui h3 {
            margin-top: 0;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }

        .booster-search {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #444;
            background-color: #333;
            color: white;
            border-radius: 3px;
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
            grid-template-columns: repeat(3, 1fr);
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
        }

        .energy-item {
            border-left: 3px solid #4CAF50;
        }

        .nerve-item {
            border-left: 3px solid #F44336;
        }

        .happy-item {
            border-left: 3px solid #FFEB3B;
            color: white;
        }

        .stat-item {
            border-left: 3px solid #2196F3;
        }

        .stat-item {
            border-left: 3px solid #9C27B0;
        }

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
            transition: opacity 0.5s;
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
    let DEBUG_MODE = true;
    let useFactionBoosters = false; // Setting for faction boosters vs personal inventory

    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[BoosterAlerts Debug]', ...args);
        }
    }

    function positionBoosterAlert(alert, header) {
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
        const existingAlert = document.querySelector('.booster-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const existingGui = document.querySelector('.booster-gui');
        if (existingGui) {
            existingGui.remove();
        }

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
        if ((isItemsPage && !useFactionBoosters) || (isFactionArmouryBoostersPage && useFactionBoosters)) {
            // Create the booster GUI
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

                    // Recreate alert with new settings
                    removeExistingAlerts();
                    alertElements = createAlert();
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
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Show/hide category headers based on visible items
                const categories = ['energy', 'nerve', 'happy', 'statEnhancers'];
                categories.forEach(category => {
                    const categoryHeader = gui.querySelector(`.${category}-header`);
                    const categoryItems = gui.querySelectorAll(`.${category}-list .booster-item`);
                    const visibleItems = Array.from(categoryItems).filter(item => item.style.display !== 'none');
                    
                    if (visibleItems.length === 0) {
                        categoryHeader.style.display = 'none';
                    } else {
                        categoryHeader.style.display = 'flex'; // Changed to flex for the new layout
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
                    listElement.style.display = 'grid';
                    toggleBtn.textContent = '-';
                    localStorage.setItem(`boosterCategory_${category}`, 'expanded');
                }
            }
            
            // Setup toggles after populating lists
            setTimeout(setupCategoryToggles, 100);

            // Populate booster lists by category
            populateBoosterList(gui.querySelector('.energy-list'), BOOSTERS.energy, 'energy-item');
            populateBoosterList(gui.querySelector('.nerve-list'), BOOSTERS.nerve, 'nerve-item');
            populateBoosterList(gui.querySelector('.happy-list'), BOOSTERS.happy, 'happy-item');
            populateBoosterList(gui.querySelector('.statEnhancers-list'), BOOSTERS.statEnhancers, 'stat-item');

            // Add click outside to close
            document.addEventListener('click', function(e) {
                if (gui.style.display === 'block' && !gui.contains(e.target) && !alert.contains(e.target)) {
                    gui.style.display = 'none';
                }
            });
        }

        // Add click handler based on page context
        alert.onclick = function(event) {
            debugLog(`Alert clicked. Items page: ${isItemsPage}, Faction armoury boosters page: ${isFactionArmouryBoostersPage}, Other faction page: ${isOtherFactionPage}, Using faction boosters: ${useFactionBoosters}`);
            event.stopPropagation();

            if ((isItemsPage && !useFactionBoosters) || (isFactionArmouryBoostersPage && useFactionBoosters)) {
                // If on the correct page, show the GUI
                debugLog('Showing GUI on appropriate page');
                showNotification('Opening booster selection', 'info');
                gui.style.display = 'block';
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
                useFactionBoosterDirectly(id, name);
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
            if (this.status === 200) {
                try {
                    // First try parsing as JSON
                    try {
                        const response = JSON.parse(this.responseText);

                        if (response && (response.success || (response.message && response.message.includes('consumed')))) {
                            debugLog('Faction booster used successfully via direct method');
                            showNotification(`Used ${name} from faction armoury successfully!`, 'success');

                            setTimeout(() => {
                                if (hasBoosterCooldown()) {
                                    debugLog('Booster cooldown confirmed after direct method');
                                    if (alertElements) {
                                        alertElements.alert.remove();
                                        if (alertElements.gui) alertElements.gui.remove();
                                        alertElements = null;
                                    }
                                }
                            }, 500);

                            sessionStorage.removeItem('boosterUseInProgress');
                            return;
                        }

                        // Handle error messages
                        if (response.error || response.message) {
                            const errorMessage = response.error || response.message;
                            debugLog('Direct method returned error:', errorMessage);
                            showNotification(`Error: ${errorMessage}`, 'error');
                            sessionStorage.removeItem('boosterUseInProgress');
                            return;
                        }
                    } catch (parseError) {
                        // If not JSON, check text response
                        debugLog('Direct method response is not JSON, checking text');

                        const responseText = this.responseText || '';
                        if (responseText.includes('success') || responseText.includes('used') || responseText.includes('consumed')) {
                            debugLog('Found success in text response from direct method');
                            showNotification(`Used ${name} from faction armoury successfully!`, 'success');

                            setTimeout(() => {
                                if (hasBoosterCooldown()) {
                                    if (alertElements) {
                                        alertElements.alert.remove();
                                        if (alertElements.gui) alertElements.gui.remove();
                                        alertElements = null;
                                    }
                                }
                            }, 500);

                            sessionStorage.removeItem('boosterUseInProgress');
                            return;
                        }

                        // Check for cooldown
                        if (responseText.includes('cooldown') || responseText.includes('wait') || responseText.includes('effect of a booster')) {
                            const timeMatches = responseText.match(/(\d+)m\s+(\d+)s|(\d+)\s+seconds|(\d+)\s+minutes/);
                            let cooldownMessage = 'You are on booster cooldown';

                            if (timeMatches) {
                                if (timeMatches[1] && timeMatches[2]) {
                                    cooldownMessage = `Booster Cooldown: ${timeMatches[1]}m ${timeMatches[2]}s remaining`;
                                } else if (timeMatches[3]) {
                                    cooldownMessage = `Booster Cooldown: 0m ${timeMatches[3]}s remaining`;
                                } else if (timeMatches[4]) {
                                    cooldownMessage = `Booster Cooldown: ${timeMatches[4]}m 0s remaining`;
                                }
                            }

                            showNotification(cooldownMessage, 'info');
                            sessionStorage.removeItem('boosterUseInProgress');
                            return;
                        }
                    }

                    // If we got here, we couldn't determine the exact result
                    debugLog('Direct method gave unclear response:', this.responseText.substring(0, 100) + '...');
                    // Don't remove boosterUseInProgress yet, let the traditional method try
                    
                } catch (e) {
                    debugLog('Error processing direct method response:', e);
                    // Don't remove boosterUseInProgress yet, let the traditional method try
                }
            } else {
                debugLog('Direct method request failed with status:', this.status);
                // Don't remove boosterUseInProgress yet, let the traditional method try
            }
        };

        xhr.onerror = function() {
            debugLog('Direct method request failed with network error');
            // Don't remove boosterUseInProgress yet, let the traditional method try
        };

        xhr.send(params.toString());
    }

    function useFactionBoosterDirectly(id, name) {
        debugLog(`Using faction booster via armoury: ${name} (ID: ${id})`);

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
            useFactionBoosterWithToken(id, name, pageToken);
        } else {
            debugLog(`Using NST-style token for faction booster: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
            useFactionBoosterWithToken(id, name, token);
        }
    }

    function useFactionBoosterWithToken(id, name, token) {
        let armouryItemID = null;

        // Try to find the armouryItemID in the page
        const boosterItems = document.querySelectorAll('#armoury-boosters ul.item-list li, #faction-armoury .boosters-wrap .item, div[class*="armory"] div[class*="boosters"] div[class*="item"]');
        debugLog(`Faction armoury search found ${boosterItems.length} potential items`);

        for (const item of boosterItems) {
            const nameElements = [
                item.querySelector('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"], [class*="title"]'),
                item.querySelector('div[class*="name"], div[class*="title"], span[class*="name"], span[class*="title"]'),
                ...item.querySelectorAll('*')
            ];

            for (const nameElement of nameElements) {
                if (!nameElement) continue;

                const itemName = nameElement.textContent.trim();
                if (itemName && (itemName.includes(name) || name.includes(itemName))) {
                    debugLog(`Found matching booster name: "${itemName}"`);

                    const actionLinks = [
                        item.querySelector('div.item-action a, .actions a, a[class*="action"], button[class*="action"]'),
                        item.querySelector('a[href*="armoryItemID="], a[href*="step=armoryItemAction"]'),
                        item.querySelector('a.t-blue, a.t-blue-cont'),
                        ...item.querySelectorAll('a[class*="use"], button[class*="use"], a.act-use, div.use, span.use')
                    ];

                    for (const actionLink of actionLinks) {
                        if (!actionLink) continue;

                        let match = null;

                        if (actionLink.href) {
                            debugLog(`Checking action link href: ${actionLink.href}`);
                            match = actionLink.href.match(/armoryItemID=(\d+)/);

                            if (!match) {
                                match = actionLink.href.match(/itemID=(\d+)/);
                            }

                            if (!match && actionLink.getAttribute('onclick')) {
                                const onclick = actionLink.getAttribute('onclick');
                                match = onclick.match(/(\d+)/);
                            }
                        }

                        if (!match && actionLink.dataset) {
                            for (const key in actionLink.dataset) {
                                if (key.includes('id') || key.includes('itemId') || key.includes('armory')) {
                                    debugLog(`Found potential ID in data attribute ${key}: ${actionLink.dataset[key]}`);
                                    const value = actionLink.dataset[key];
                                    if (/^\d+$/.test(value)) {
                                        armouryItemID = value;
                                        break;
                                    }
                                }
                            }
                        }

                        if (match && match[1]) {
                            armouryItemID = match[1];
                            debugLog(`Found armouryItemID: ${armouryItemID}`);
                            break;
                        }
                    }

                    if (armouryItemID) break;
                }
            }

            if (armouryItemID) break;
        }

        // If we couldn't find a matching item ID, use the provided ID as fallback
        if (!armouryItemID) {
            armouryItemID = id;
            debugLog(`Using provided ID as fallback: ${armouryItemID}`);
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
            if (this.status === 200) {
                try {
                    let response;

                    // Enhanced error handling - safely try to parse the response
                    try {
                        response = JSON.parse(this.responseText);
                    } catch (parseError) {
                        debugLog('Response is not valid JSON, handling as HTML/text:', this.responseText.substring(0, 100) + '...');

                        // If we can't parse as JSON, check if it's a success message in HTML form
                        const successPattern = /used|consumed|taken|success/i;
                        const cooldownPattern = /cooldown|wait|effect of a booster/i;

                        if (successPattern.test(this.responseText)) {
                            debugLog('Found success indicator in raw response');
                            showNotification(`Used ${name} from faction armoury successfully!`, 'success');

                            setTimeout(() => {
                                if (hasBoosterCooldown()) {
                                    debugLog('Booster cooldown confirmed after faction response');
                                    if (alertElements) {
                                        alertElements.alert.remove();
                                        if (alertElements.gui) alertElements.gui.remove();
                                        alertElements = null;
                                    }
                                }
                            }, 500);

                            sessionStorage.removeItem('boosterUseInProgress');
                            return;
                        } else if (cooldownPattern.test(this.responseText)) {
                            debugLog('Found cooldown indicator in raw response');
                            const timeMatches = this.responseText.match(/(\d+)m\s+(\d+)s|(\d+)\s+seconds|(\d+)\s+minutes/);
                            let cooldownMessage = 'You are on booster cooldown';

                            if (timeMatches) {
                                if (timeMatches[1] && timeMatches[2]) {
                                    cooldownMessage = `Booster Cooldown: ${timeMatches[1]}m ${timeMatches[2]}s remaining`;
                                } else if (timeMatches[3]) {
                                    cooldownMessage = `Booster Cooldown: 0m ${timeMatches[3]}s remaining`;
                                } else if (timeMatches[4]) {
                                    cooldownMessage = `Booster Cooldown: ${timeMatches[4]}m 0s remaining`;
                                }
                            }

                            showNotification(cooldownMessage, 'info');
                            sessionStorage.removeItem('boosterUseInProgress');
                            return;
                        }

                        // For error messages we can try to extract them from HTML
                        const errorMatch = this.responseText.match(/<[^>]*class=['"]error['"][^>]*>(.*?)<\/|Validation failed|Error:|not authorized/i);
                        if (errorMatch) {
                            let errorMessage = errorMatch[1] || 'Validation failed - please try again';
                            if (errorMatch[0].includes('not authorized')) {
                                errorMessage = 'Not authorized to use faction boosters';
                            }
                            debugLog('Found error message in raw response:', errorMessage);
                            showNotification(`Error: ${errorMessage}`, 'error');
                            sessionStorage.removeItem('boosterUseInProgress');
                            return;
                        }

                        // If we get here, we couldn't find a specific message
                        showNotification('Error using faction booster: Unexpected response format', 'error');
                        sessionStorage.removeItem('boosterUseInProgress');
                        return;
                    }

                    // Continue with the JSON parsed response handling
                    if (response && (response.success || response.message && response.message.includes('used'))) {
                        debugLog('Faction booster used successfully via XHR');
                        showNotification(`Used ${name} from faction armoury successfully!`, 'success');

                        setTimeout(() => {
                            if (hasBoosterCooldown()) {
                                debugLog('Booster cooldown confirmed after faction XHR');
                                if (alertElements) {
                                    alertElements.alert.remove();
                                    if (alertElements.gui) alertElements.gui.remove();
                                    alertElements = null;
                                }
                            }
                        }, 500);

                        sessionStorage.removeItem('boosterUseInProgress');
                        return;
                    }

                    debugLog('Faction XHR method returned error:', response);

                    let errorMessage = `Error using faction booster: ${response.message || 'Unknown error'}`;
                    let seconds = 0;

                    if (response.text) {
                        if (response.text.includes('cooldown') || response.text.includes('effect of a booster')) {
                            const timeMatch = response.text.match(/data-time=\"(\d+)\"/);
                            const timeMatch2 = response.text.match(/wait\s+(\d+)m\s+(\d+)s/);
                            const timeMatch3 = response.text.match(/wait\s+(\d+)\s+seconds/);
                            const timeMatch4 = response.text.match(/wait\s+(\d+)\s+minutes/);

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
                                errorMessage = `Booster Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
                                debugLog(`Extracted faction cooldown time: ${minutes}m ${remainingSeconds}s`);
                            } else {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = response.text;
                                const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                errorMessage = textContent.trim() || 'You are on booster cooldown';
                                debugLog('Using raw faction message text:', errorMessage);
                            }

                            showNotification(errorMessage, 'info');
                        } else {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = response.text;
                            errorMessage = `Error: ${tempDiv.textContent || tempDiv.innerText || 'Unknown error'}`;
                            showNotification(errorMessage, 'error');
                        }
                    } else {
                        showNotification(errorMessage, 'error');
                    }

                    sessionStorage.removeItem('boosterUseInProgress');
                } catch (e) {
                    debugLog('Error parsing faction XHR response:', e);
                    showNotification('Error using faction booster: Response parsing error', 'error');
                    sessionStorage.removeItem('boosterUseInProgress');
                }
            } else {
                debugLog('Faction XHR request failed with status:', this.status);
                showNotification(`Error using faction booster: Request failed (${this.status})`, 'error');
                sessionStorage.removeItem('boosterUseInProgress');
            }
        };

        xhr.onerror = function() {
            debugLog('Faction XHR request failed with network error');
            showNotification('Error using faction booster: Network error', 'error');
            sessionStorage.removeItem('boosterUseInProgress');
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
            if (this.status === 200) {
                try {
                    const response = JSON.parse(this.responseText);

                    if (response && (response.success || response.message && response.message.includes('consumed'))) {
                        debugLog('Booster used successfully via XHR');
                        showNotification(`Used ${name} successfully!`, 'success');

                        setTimeout(() => {
                            if (hasBoosterCooldown()) {
                                debugLog('Booster cooldown confirmed after XHR');
                                if (alertElements) {
                                    alertElements.alert.remove();
                                    if (alertElements.gui) alertElements.gui.remove();
                                    alertElements = null;
                                }
                            }
                        }, 500);
                        return;
                    }

                    if (response && (response.message || response.text)) {
                        if ((response.message && response.message.includes('cooldown')) ||
                            (response.text && response.text.includes('cooldown')) ||
                            (response.text && response.text.includes('effect of a booster'))) {
                            debugLog('Booster is on cooldown');

                            let cooldownMessage = 'You are already on booster cooldown';
                            let seconds = 0;

                            const timeMatch = response.text ? response.text.match(/data-time=\"(\d+)\"/) : null;
                            const timeMatch2 = response.text ? response.text.match(/wait\s+(\d+)m\s+(\d+)s/) : null;
                            const timeMatch3 = response.text ? response.text.match(/wait\s+(\d+)\s+seconds/) : null;
                            const timeMatch4 = response.text ? response.text.match(/wait\s+(\d+)\s+minutes/) : null;

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
                                cooldownMessage = `Booster Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
                                debugLog(`Extracted cooldown time: ${minutes}m ${remainingSeconds}s`);
                            } else {
                                if (response.text) {
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = response.text;
                                    const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                    cooldownMessage = textContent.trim() || 'You are on booster cooldown';
                                    debugLog('Using raw message text:', cooldownMessage);
                                }
                            }

                            showNotification(cooldownMessage, 'info');
                            return;
                        }

                        debugLog('XHR method returned error:', response.message || response.text);
                        showNotification(`Error: ${response.message || 'Unknown error'}`, 'error');
                        return;
                    }

                    debugLog('Unexpected XHR response:', this.responseText);
                    showNotification(`Unable to use ${name}: Unexpected response`, 'error');
                } catch (e) {
                    debugLog('Error parsing XHR response:', e);
                    showNotification(`Unable to use ${name}: Response parsing error`, 'error');
                }
            } else {
                debugLog('XHR request failed with status:', this.status);
                showNotification(`Unable to use ${name}: Request failed (${this.status})`, 'error');
            }
        };

        xhr.onerror = function() {
            debugLog('XHR request failed with network error');
            showNotification(`Unable to use ${name}: Network error`, 'error');
        };

        xhr.send(params.toString());
    }

    function showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.booster-notification');
        existingNotifications.forEach(note => note.remove());

        const notification = document.createElement('div');
        notification.className = `booster-notification ${type}`;

        let cleanMessage = message;
        if (message.includes('<') && message.includes('>')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = message;
            cleanMessage = tempDiv.textContent || tempDiv.innerText || message;
        }

        if (cleanMessage.includes('Cooldown:') || cleanMessage.includes('cooldown')) {
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

        notification.style.transform = 'translate(-50%, -50%) scale(1)';
        notification.style.opacity = '1';

        // Auto-hide
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => notification.remove(), 500); // Remove after fade out
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

            // Make synchronous request
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
            const scripts = document.querySelectorAll('script:not([src])');
            for (const script of scripts) {
                if (!script.textContent) continue;

                const patterns = [
                    /var\s+csrf\s*=\s*["']([a-f0-9]{16,})["']/,
                    /csrf["']?\s*:\s*["']([a-f0-9]{16,})["']/,
                    /\{[^}]*["']?csrf["']?\s*:\s*["']([a-f0-9]{16,})["'][^}]*\}/
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
            const csrfInputs = document.querySelectorAll('input[name="csrf"]');
            for (const input of csrfInputs) {
                if (input.value) {
                    debugLog('Found token in page input field');
                    return input.value;
                }
            }
        } catch (e) {
            debugLog('Error extracting token from inputs:', e);
        }

        if (typeof window.csrf !== 'undefined' && window.csrf) {
            debugLog('Found token in window.csrf');
            return window.csrf;
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

        // Fallback to searching script tags
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
        debugLog('Searching for token in page');

        // Check global variable first
        if (typeof window.csrf !== 'undefined' && window.csrf) {
            debugLog('Found token in window.csrf');
            return window.csrf;
        }

        // Check jQuery cookie if available
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const cookieToken = $.cookie('csrf');
            if (cookieToken) {
                debugLog('Found token in $.cookie("csrf")');
                return cookieToken;
            }
        }

        // Check input fields
        const inputs = document.querySelectorAll('input[name="csrf"]');
        for (const input of inputs) {
            if (input.value) {
                debugLog('Found token in input field');
                return input.value;
            }
        }

        // Check inline scripts
        const scriptPattern = /var\s+csrf\s*=\s*["']([a-f0-9]{16,})["']/;
        const scripts = document.querySelectorAll('script:not([src])');
        for (const script of scripts) {
            if (!script.textContent) continue;
            const match = script.textContent.match(scriptPattern);
            if (match && match[1]) {
                debugLog('Found token in inline script');
                return match[1];
            }
        }

        // If not found by common methods, return null
        return null;
    }

    function hasBoosterCooldown() {
        debugLog('Checking for booster cooldown...');

        // Primary check: Look for elements with the specific aria-label for booster cooldown
        const boosterCooldownElements = document.querySelectorAll('a[aria-label="Booster Cooldown"], [aria-label^="Booster Cooldown"]');
        if (boosterCooldownElements.length > 0) {
            debugLog('Found booster cooldown via aria-label');
            return true;
        }

        // Secondary check: Status icons area with cooldown text (fallback)
        const statusIcons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a');
        for (const icon of statusIcons) {
            const ariaLabel = icon.getAttribute('aria-label') || '';
            const title = icon.getAttribute('title') || '';
            const iconText = icon.textContent || '';
            const dataContent = icon.getAttribute('data-content') || '';

            if ((ariaLabel.includes('Booster') && ariaLabel.includes('Cooldown')) ||
                (title.includes('Booster') && title.includes('Cooldown')) ||
                (dataContent.includes('Booster') && dataContent.includes('Cooldown')) ||
                (iconText.includes('Booster') && iconText.includes('Cooldown'))) {
                debugLog('Found booster cooldown in status icons via text attributes');
                return true;
            }
            
            // Also check for the data-i attribute that might indicate a booster cooldown
            const iData = icon.getAttribute('i-data');
            if (iData && iData.includes('i_64_')) {
                debugLog('Found potential booster cooldown via i-data attribute');
                return true;
            }
        }

        // Tertiary check: Look for specific icon ids as an absolute fallback
        const boosterIcons = document.querySelectorAll('#icon39, #icon40, #icon41, #icon42, #icon43');
        if (boosterIcons.length > 0) {
            debugLog('Found booster cooldown via icon IDs (fallback method)');
            return true;
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

                    // Wait a bit for the page to finish loading
                    setTimeout(() => {
                        // Recreate alert/GUI and show GUI
                        removeExistingAlerts();
                        alertElements = createAlert();
                        if (alertElements && alertElements.gui) {
                            debugLog('Showing booster GUI after navigation');
                            alertElements.gui.style.display = 'block';
                        }
                    }, 1000); // Delay opening GUI slightly
                }
            }
            
            // Clear any potentially stale booster use progress flag
            sessionStorage.removeItem('boosterUseInProgress');
            
        } catch (e) {
            debugLog('Error in checkForPendingAlert:', e);
            sessionStorage.removeItem('boosterUseInProgress'); // Ensure cleanup on error
        }
    }

    function removeExistingAlerts() {
        const existingAlerts = document.querySelectorAll('.booster-alert');
        const existingGuis = document.querySelectorAll('.booster-gui');

        existingAlerts.forEach(alert => {
            debugLog('Removing existing alert:', alert.id || 'unnamed');
            alert.remove();
        });
        existingGuis.forEach(gui => {
            debugLog('Removing existing GUI:', gui.id || 'unnamed');
            gui.remove();
        });

        alertElements = null; // Reset the reference
        debugLog('Removed all existing booster alerts and GUIs');
    }

    function startCooldownChecks() {
        const checkCooldownWithRetry = (retryCount = 0) => {
            const maxRetries = 3; // Retry a few times if cooldown status isn't immediately clear
            const hasCooldown = hasBoosterCooldown();

            debugLog(`Cooldown check (attempt ${retryCount + 1}): ${hasCooldown ? 'ON COOLDOWN' : 'NO COOLDOWN'}`);

            if (!hasCooldown) {
                if (!alertElements) { // Only create if it doesn't exist
                    alertElements = createAlert();
                    debugLog('Created "No Boosters" alert');

                    // Check if we should auto-show the GUI (e.g., after navigation)
                    if (window.location.href.includes('torn.com/item.php') &&
                        alertElements.gui &&
                        sessionStorage.getItem('fromBoosterAlert')) {
                        debugLog('Auto-showing GUI after cooldown check');
                        alertElements.gui.style.display = 'block';
                        sessionStorage.removeItem('fromBoosterAlert'); // Clear the flag
                    }
                }
            } else if (alertElements) { // If cooldown IS active and alert exists, remove it
                alertElements.alert.remove();
                alertElements.gui?.remove(); // Safely remove GUI if it exists
                alertElements = null;
                debugLog('Removed "No Boosters" alert due to cooldown');
            // Retry logic if cooldown isn't detected initially but alert isn't created yet
            } else if (retryCount < maxRetries && !hasCooldown && !alertElements) {
                setTimeout(() => checkCooldownWithRetry(retryCount + 1), 1000); // Wait 1s and retry
                return; // Don't proceed to interval setup yet
            }
        };

        // Initial check with a delay to allow page elements to load
        setTimeout(() => checkCooldownWithRetry(), 2000);

        // Use MutationObserver for faster updates when status icons change
        const observer = new MutationObserver((mutations) => {
            // Check if relevant parts of the DOM changed (e.g., status icons area)
            const shouldCheck = mutations.some(mutation => {
                // Check if the target itself is the status icons container
                if (mutation.target && mutation.target.className &&
                    typeof mutation.target.className === 'string' && // Ensure className is string
                    mutation.target.className.includes('status-icons')) {
                    return true;
                }
                // Check if added nodes are relevant (icons, status elements)
                return Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === 1 && node.className && ( // Check if it's an element with a class
                        (typeof node.className === 'string' && ( // Ensure className is string
                            node.className.includes('icon') ||
                            node.className.includes('status')
                        ))
                    )
                );
            });

            if (shouldCheck) {
                checkCooldownWithRetry(); // Re-check immediately on relevant changes
            }
        });

        observer.observe(document.body, {
            childList: true, // Watch for added/removed nodes
            subtree: true,   // Watch descendants
            attributes: true, // Watch attribute changes (like aria-label on icons)
            attributeFilter: ['class', 'aria-label', 'title'] // Only observe relevant attributes
        });

        // Periodic check as a fallback
        setInterval(checkCooldownWithRetry, 30000); // Check every 30 seconds

        console.log('%c Booster Alerts Initialized ', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
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
        checkPendingFactionBoosterUse();

        // Check if we navigated from an alert click
        checkForPendingAlert();

        // Start the main cooldown checking loop
        startCooldownChecks();
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

                    // Small delay to ensure page is fully loaded
                    setTimeout(() => {
                        useBooster(pendingUse.id, pendingUse.name);
                    }, 1000);
                } else if (!isFactionArmouryBoostersPage) {
                    debugLog('Still not on faction armoury boosters page, keeping pending use data');
                    // Don't remove the item yet, maybe the page hasn't loaded fully
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

    // Start the script execution
    initialize();
})();