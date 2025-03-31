// ==UserScript==
// @name         Torn Drug Alert
// @namespace    http://tampermonkey.net/
// @version      1.0.12
// @description  Alerts when no drug cooldown is active and allows taking drugs from any page
// @author       GNSC4
// @match        https://www.torn.com/*
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    
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
            bottom: 70px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            opacity: 1;
            transition: opacity 0.5s;
        }

        .drug-notification.success {
            background-color: #4CAF50;
        }

        .drug-notification.error {
            background-color: #f44336;
        }

        .drug-notification.info {
            background-color: #2196F3;
        }
    `);
    
    // Fallback drug list in case fetch fails - FIX INCORRECT IDS
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

    // Add debug mode toggle and log function
    let DEBUG_MODE = true; // Set to true to see verbose logging in console
    
    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[DrugAlerts Debug]', ...args);
        }
    }
    
    // Replace the hasDrugCooldown function with an improved version
    function hasDrugCooldown() {
        debugLog('Checking for drug cooldown...');
        
        // Look for the drug cooldown aria-label - main detection method
        const drugCooldown = document.querySelector("[aria-label^='Drug Cooldown:']");
        if (drugCooldown) {
            debugLog('Found drug cooldown via aria-label');
            return true;
        }
        
        // Secondary checks for different UI variations
        const statusIcons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a');
        for (const icon of statusIcons) {
            // Check icon tooltip text
            const ariaLabel = icon.getAttribute('aria-label') || '';
            const title = icon.getAttribute('title') || '';
            
            if ((ariaLabel.includes('Drug') && ariaLabel.includes('Cooldown')) || 
                (title.includes('Drug') && title.includes('Cooldown'))) {
                debugLog('Found drug cooldown in status icons via tooltip text');
                return true;
            }
            
            // Check for drug icon class patterns
            if (icon.className && /icon5[0-9]/.test(icon.className)) {
                debugLog('Found drug cooldown icon via class name pattern');
                return true;
            }
        }
        
        // If we haven't found any cooldown, it's not active
        debugLog('No drug cooldown detected');
        return false;
    }

    function positionDrugAlert(alert, header) {
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
        
        if (header.id === 'torn-drug-fixed-header') {
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
        let fixedHeader = document.getElementById('torn-drug-fixed-header');
        
        if (!fixedHeader) {
            fixedHeader = document.createElement('div');
            fixedHeader.id = 'torn-drug-fixed-header';
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

    function createAlert(drugs) {
        let header = findHeader();
        
        if (!header) {
            header = createFixedHeader();
        }
        
        // Always remove existing alert and GUI
        const existingAlert = document.querySelector('.drug-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const existingGui = document.querySelector('.drug-gui');
        if (existingGui) {
            existingGui.remove();
        }
        
        // Create simple alert that uses direct DOM manipulation
        const alert = document.createElement('div');
        alert.className = 'drug-alert';
        alert.textContent = 'No Drugs';
        alert.style.cursor = 'pointer';
        alert.style.backgroundColor = '#ff3333';
        
        // Position the alert
        positionDrugAlert(alert, header);
        
        // Check if we're on the items page
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        
        // Create GUI only if on the items page
        let gui = null;
        if (isItemsPage) {
            // Create the drug GUI
            gui = document.createElement('div');
            gui.className = 'drug-gui';
            gui.id = 'drugGui';
            gui.innerHTML = `
                <h3>Take Drugs</h3>
                <div class="drug-list" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></div>
            `;
            
            // Apply direct styling to center the GUI in the middle of the screen
            gui.style.position = 'fixed';
            gui.style.top = '50%';
            gui.style.left = '50%';
            gui.style.transform = 'translate(-50%, -50%)';
            gui.style.zIndex = '99999999';
            gui.style.backgroundColor = '#222';
            gui.style.color = 'white';
            gui.style.padding = '20px';
            gui.style.borderRadius = '8px';
            gui.style.width = '350px';
            gui.style.maxHeight = '500px';
            gui.style.overflowY = 'auto';
            gui.style.display = 'none';
            gui.style.boxShadow = '0 4px 15px rgba(0,0,0,0.7)';
            gui.style.border = '1px solid #444';
            
            document.body.appendChild(gui);
            
            // Populate drug list
            const drugListElement = gui.querySelector('.drug-list');
            drugs.forEach(drug => {
                const drugItem = document.createElement('div');
                drugItem.style.backgroundColor = '#333';
                drugItem.style.padding = '12px';
                drugItem.style.borderRadius = '5px';
                drugItem.style.textAlign = 'center';
                drugItem.style.cursor = 'pointer';
                drugItem.style.color = 'white';
                drugItem.style.transition = 'background-color 0.2s';
                drugItem.style.fontSize = '14px';
                drugItem.style.fontWeight = 'bold';
                drugItem.textContent = drug.name;
                
                // Add hover effect
                drugItem.onmouseover = () => {
                    drugItem.style.backgroundColor = '#444';
                };
                drugItem.onmouseout = () => {
                    drugItem.style.backgroundColor = '#333';
                };
                
                drugItem.onclick = () => {
                    useDrug(drug.id, drug.name);
                    gui.style.display = 'none';
                };
                
                drugListElement.appendChild(drugItem);
            });
            
            // Add click outside to close
            document.addEventListener('click', function(e) {
                if (gui.style.display === 'block' && !gui.contains(e.target) && !alert.contains(e.target)) {
                    gui.style.display = 'none';
                }
            });
        }
        
        // Add click handler based on page context
        alert.onclick = function(event) {
            debugLog(`Alert clicked. On items page: ${isItemsPage}`);
            event.stopPropagation();
            
            if (isItemsPage && gui) {
                // If on items page and GUI exists, show it
                debugLog('Showing GUI on items page');
                showNotification('Opening drug selection', 'info');
                gui.style.display = 'block';
                void gui.offsetWidth; // Force reflow
            } else {
                // If not on items page, navigate to items page with drugs tab
                debugLog('Navigating to drugs page');
                sessionStorage.setItem('fromDrugAlert', 'true');
                window.location.href = 'https://www.torn.com/item.php#drugs-items';
            }
            
            return false;
        };
        
        return { alert, gui };
    }

    function useDrug(id, name) {
        debugLog(`Attempting to use drug: ${name} (ID: ${id})`);
        showNotification(`Using ${name}...`, 'info');
        
        // Add test mode to verify gui is properly closing
        const gui = document.getElementById('drugGui');
        if (gui) {
            gui.style.display = 'none';
        }

        tryDirectUseMethod(id, name);
    }

    function tryDirectUseMethod(id, name) {
        debugLog('Attempting direct use method based on manual workflow');
        
        // Store drug use data for navigation tracking
        sessionStorage.setItem('drugUseInProgress', JSON.stringify({
            id: id,
            name: name,
            timestamp: Date.now(),
            method: 'direct',
            navigations: 0,
            visitedItemPage: false
        }));
        
        // Handle whether we're on the item page or not
        if (!window.location.href.includes('item.php')) {
            debugLog('Not on item.php, navigating there first');
            window.location.href = `https://www.torn.com/item.php#drugs-items`;
            return; // Navigation will happen, no need to continue
        }
        
        // We're already on the item page, proceed with finding and clicking
        debugLog('Already on item.php, proceeding with drug search and use');
        findAndClickDrug(id, name);
    }

    function findAndClickDrug(id, name) {
        debugLog(`Looking for ${name} (ID: ${id})`);
        
        // Check if we're on the items page
        if (!window.location.href.includes('item.php')) {
            debugLog('Not on item.php, navigating there first');
            window.location.href = `https://www.torn.com/item.php`;
            return; // Navigation will happen, no need to continue
        }
        
        // First, try to find the Drugs category tab
        const drugsTab = document.querySelector('[href="#drugs-items"], [data-category="drugs"], .drugs-category-icon, .category-tabs a[data-type="Drugs"]');
        
        if (drugsTab) {
            // Check if drugs tab is already active
            const isActive = drugsTab.classList.contains('active') || 
                          drugsTab.classList.contains('ui-tabs-active') || 
                          document.querySelector('.items-cont.drugs-items, [data-category="drugs"].active') !== null;
            
            if (!isActive) {
                debugLog('Drugs tab found but not active, clicking it');
                drugsTab.click();
                
                // Wait for tab to activate before continuing
                setTimeout(() => searchAndUseDrug(id, name), 1000);
                return;
            }
        } else {
            debugLog('No drugs tab found, trying a broader search');
        }
        
        // If we're already on drugs tab or can't find any tabs, proceed with searching
        searchAndUseDrug(id, name);
    }

    function searchAndUseDrug(id, name) {
        debugLog(`Searching for drug: ${name} (ID: ${id})`);
        
        // Try to find the drug using multiple possible selectors for drug containers
        const drugContainers = [
            document.querySelector('.items-cont.drugs-items'),
            document.querySelector('.category-content[data-category="drugs"]'),
            document.querySelector('#drugs-items'),
            document.querySelector('.drug-items-wrap'),
            document.querySelector('.items-wrap[data-items-type="Drugs"]')
        ].filter(container => container !== null);
        
        if (drugContainers.length === 0) {
            debugLog('Could not find any drugs container, trying API method');
            tryAPIMethod(id, name);
            return;
        }
        
        // Try to find the drug item in any of the containers
        let drugItem = null;
        let container = null;
        
        for (container of drugContainers) {
            // Try to find by ID first
            drugItem = container.querySelector(`[data-item="${id}"], [data-itemid="${id}"], .item-${id}, [data-item-id="${id}"]`);
            
            // If not found by ID, try to find by name
            if (!drugItem) {
                const allItems = container.querySelectorAll('li, .item, .torn-item');
                for (const item of allItems) {
                    const nameElement = item.querySelector('.name, .title, .item-name, [class*="Name"]');
                    if (nameElement && nameElement.textContent.includes(name)) {
                        drugItem = item;
                        debugLog(`Found drug ${name} by name content`);
                        break;
                    }
                }
            }
            
            if (drugItem) break;
        }
        
        if (!drugItem) {
            debugLog('Could not find drug item, trying API method');
            tryAPIMethod(id, name);
            return;
        }
        
        debugLog('Found drug item:', drugItem);
        
        // Find the use button for this drug
        const useButton = drugItem.querySelector('.use button, button[class*="use"], [rel="use"], a.use, .use-item, [data-action="use"]');
        
        if (!useButton) {
            debugLog('Could not find use button, trying API method');
            tryAPIMethod(id, name);
            return;
        }
        
        debugLog('Found use button, clicking it');
        try {
            useButton.click();
            
            // Wait for the confirmation dialog
            setTimeout(() => {
                clickConfirmButton(id, name);
            }, 1000);
        } catch (error) {
            debugLog('Error clicking use button:', error);
            tryAPIMethod(id, name);
        }
    }

    function clickConfirmButton(id, name) {
        debugLog('Looking for confirmation button');
        
        // Try to find the confirmation button using various selectors
        const confirmSelectors = [
            '.next-act.bold.t-blue',
            'a.next-act',
            '.action-wrap.use-act a',
            '.use-action a',
            '.confirmation a',
            'button.confirm',
            'a.confirm',
            'a.yes'
        ];
        
        let confirmButton = null;
        
        for (const selector of confirmSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
                if (button.textContent.includes('Yes') || 
                    button.textContent.includes('Confirm') || 
                    button.textContent.includes('Use')) {
                    confirmButton = button;
                    break;
                }
            }
            if (confirmButton) break;
        }
        
        if (!confirmButton) {
            // Try a direct, very specific selector from the example
            confirmButton = document.querySelector('#drugs-items > li.act > div.cont-wrap > div.action-wrap.use-act > div > p > a.next-act');
            
            if (!confirmButton) {
                debugLog('Could not find confirmation button, trying API method');
                tryAPIMethod(id, name);
                return;
            }
        }
        
        debugLog('Found confirmation button, clicking it');
        
        try {
            confirmButton.click();
            
            // Check if drug was successfully used
            setTimeout(() => {
                const hasCooldown = hasDrugCooldown();
                
                if (hasCooldown) {
                    debugLog('Drug cooldown detected, use was successful');
                    showNotification(`Used ${name} successfully!`, 'success');
                    sessionStorage.removeItem('drugUseInProgress');
                    
                    // Remove any existing alert since we now have a cooldown
                    if (alertElements) {
                        alertElements.alert.remove();
                        if (alertElements.gui) alertElements.gui.remove();
                        alertElements = null;
                    }
                } else {
                    debugLog('No cooldown detected, drug use may have failed');
                    showNotification(`Failed to use ${name}`, 'error');
                }
            }, 1500);
        } catch (error) {
            debugLog('Error clicking confirm button:', error);
            tryAPIMethod(id, name);
        }
    }

    function tryAPIMethod(id, name) {
        debugLog(`Trying direct API method for ${name} (ID: ${id})`);
        
        // Track attempts
        const attempts = parseInt(sessionStorage.getItem('apiMethodAttempts') || '0');
        if (attempts > 2) {
            debugLog('Too many API method attempts, giving up');
            showNotification(`Failed to use ${name} after multiple attempts`, 'error');
            sessionStorage.removeItem('drugUseInProgress');
            sessionStorage.removeItem('apiMethodAttempts');
            return;
        }
        
        sessionStorage.setItem('apiMethodAttempts', (attempts + 1).toString());
        
        // Store that we're using the API method
        sessionStorage.setItem('drugUseInProgress', JSON.stringify({
            id: id,
            name: name,
            timestamp: Date.now(),
            method: 'api',
            navigations: 0
        }));
        
        // Try to extract CSRF token - this may be null but we'll try anyway
        const csrf = extractCSRFTokenFromPage();
        debugLog('Found CSRF token:', csrf || 'None');
        
        // Try a completely different approach that works more reliably
        const url = `https://www.torn.com/item.php?step=useItem&ID=${id}&itemID=${id}`;
        
        debugLog('Navigating to direct use URL:', url);
        window.location.href = url;
    }

    function extractCSRFTokenFromPage() {
        debugLog('Extracting CSRF token from page content');
        
        const inputs = document.querySelectorAll('input[name="csrf"]');
        for (const input of inputs) {
            if (input.value) {
                return input.value;
            }
        }
        
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (!script.textContent) continue;
            
            const match = script.textContent.match(/csrf['":\s]+(["'])([\w\d]+)\1/);
            if (match && match[2]) {
                return match[2];
            }
        }
        
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const jqueryCookie = $.cookie('csrf');
            if (jqueryCookie) {
                return jqueryCookie;
            }
        }
        
        if (typeof window.csrf !== 'undefined') {
            return window.csrf;
        }
        
        return null;
    }

    function addQuickUseButtons() {
        // Only add quick use buttons on the items page
        if (!window.location.href.includes('torn.com/item.php')) {
            debugLog('Not on items page, skipping quick use buttons');
            return;
        }

        const quickUseContainer = document.createElement('div');
        quickUseContainer.className = 'quick-use-container';
        quickUseContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background-color: rgba(34, 34, 34, 0.8);
            padding: 10px;
            border-radius: 5px;
            z-index: 9998;
            display: flex;
            flex-direction: column;
            gap: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        
        const quickUseDrugs = [
            { id: 206, name: "Xanax", color: "#4CAF50" },
            { id: 197, name: "Ecstasy", color: "#2196F3" },
            { id: 196, name: "Cannabis", color: "#8BC34A" } 
        ];
        
        const drugButtons = [];
        quickUseDrugs.forEach(drug => {
            const button = document.createElement('button');
            button.textContent = drug.name;
            button.className = 'drug-quick-button';
            button.style.cssText = `
                background-color: ${drug.color};
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: bold;
                margin-bottom: 5px;
                text-align: center;
            `;
            button.addEventListener('click', () => useDrug(drug.id, drug.name));
            drugButtons.push(button);
            quickUseContainer.appendChild(button);
        });
        
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'X';
        toggleButton.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #f44336;
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
        `;
        
        let isMinimized = localStorage.getItem('drugAlertMinimized') === 'true';
        
        function applyMinimizedState() {
            drugButtons.forEach(btn => {
                btn.style.display = isMinimized ? 'none' : 'block';
            });
            
            quickUseContainer.style.padding = isMinimized ? '2px' : '10px';
            toggleButton.textContent = isMinimized ? '+' : 'X';
        }
        
        applyMinimizedState();
        
        toggleButton.addEventListener('click', () => {
            isMinimized = !isMinimized;
            applyMinimizedState();
            localStorage.setItem('drugAlertMinimized', isMinimized);
        });
        
        quickUseContainer.appendChild(toggleButton);
        document.body.appendChild(quickUseContainer);
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `drug-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    function fetchDrugs() {
        debugLog('Fetching drugs list');
        return new Promise((resolve, reject) => {
            fetch('https://www.torn.com/item.php')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const drugItems = [];
                    
                    const possibleItemSelectors = [
                        '.drugs-items .item-cont',
                        '#drugs-items .item',
                        '.item-info-wrap[data-category="Drugs"]',
                        '.items-wrap[data-items-type="Drugs"] .item',
                        '.item-cont[data-item]',
                        '.item[data-item]'
                    ];
                    
                    for (const selector of possibleItemSelectors) {
                        const items = doc.querySelectorAll(selector);
                        if (items.length > 0) {
                            items.forEach(item => {
                                let name = '';
                                let id = null;
                                
                                const nameElem = item.querySelector('.name, .title, .item-name, .torn-item-name, [class*="itemName"]');
                                if (nameElem) {
                                    name = nameElem.textContent.trim();
                                }
                                
                                if (item.dataset.item) {
                                    id = parseInt(item.dataset.item);
                                } else if (item.dataset.itemid) {
                                    id = parseInt(item.dataset.itemid);
                                } else {
                                    const clickableElem = item.querySelector('[onclick*="item_"]') || item;
                                    const onclick = clickableElem.getAttribute('onclick');
                                    if (onclick) {
                                        const match = onclick.match(/item_\((\d+),/);
                                        if (match && match[1]) {
                                            id = parseInt(match[1]);
                                        }
                                    }
                                }
                                
                                const isDrug = name && (
                                    name.includes('Xanax') || 
                                    name.includes('Cannabis') || 
                                    name.includes('Ecstasy') || 
                                    name.includes('Ketamine') || 
                                    name.includes('LSD') || 
                                    name.includes('Opium') || 
                                    name.includes('PCP') || 
                                    name.includes('Shrooms') || 
                                    name.includes('Speed') || 
                                    name.includes('Vicodin') ||
                                    item.classList.contains('drug') ||
                                    item.closest('[data-category="Drugs"]') !== null
                                );
                                
                                if (name && id && isDrug) {
                                    drugItems.push({
                                        id: id,
                                        name: name
                                    });
                                }
                            });
                            
                            if (drugItems.length > 0) {
                                break;
                            }
                        }
                    }
                    
                    const uniqueDrugs = Array.from(
                        new Map(drugItems.map(item => [item.id, item])).values()
                    );
                    
                    if (uniqueDrugs.length > 0) {
                        debugLog(`Found ${uniqueDrugs.length} drugs in Torn's item page`);
                        resolve(uniqueDrugs);
                    } else {
                        debugLog('No drugs found in page, using fallback drug list');
                        resolve(fallbackDrugs);
                    }
                })
                .catch(error => {
                    debugLog('Error fetching drugs:', error);
                    resolve(fallbackDrugs);
                });
        });
    }

    function initializeWithPendingCheck() {
        debugLog('Initializing Drug Alerts');
        
        removeExistingAlerts();
        
        // First, check for pending redirections if we're on the items page
        if (window.location.href.includes('torn.com/item.php') && 
            sessionStorage.getItem('fromDrugAlert') === 'true') {
            debugLog('Detected we arrived from alert - will focus on showing GUI');
        }
        
        // Fetch drugs for displaying in the GUI (when on items page) or for the alert
        fetchDrugs().then(fetchedDrugs => {
            debugLog(`Fetched ${fetchedDrugs.length} drugs`);
            drugList = fetchedDrugs;
            
            // Add quick use buttons if on the items page
            if (window.location.href.includes('torn.com/item.php')) {
                debugLog('On items page, adding quick use buttons');
                addQuickUseButtons();
                
                // Process fromDrugAlert flag if it exists
                if (sessionStorage.getItem('fromDrugAlert')) {
                    debugLog('Found fromDrugAlert flag on items page, will show GUI');
                    removeExistingAlerts();
                    alertElements = createAlert(drugList);
                    
                    if (alertElements && alertElements.gui) {
                        alertElements.gui.style.display = 'block';
                        sessionStorage.removeItem('fromDrugAlert');
                    }
                }
            }
            
            // Start cooldown checks which will create the alert if needed
            startCooldownChecks();
        });
    }

    function startCooldownChecks() {
        const checkCooldownWithRetry = (retryCount = 0) => {
            const maxRetries = 3;
            const hasCooldown = hasDrugCooldown();
            
            debugLog(`Cooldown check (attempt ${retryCount + 1}): ${hasCooldown ? 'ON COOLDOWN' : 'NO COOLDOWN'}`);
            
            if (!hasCooldown) {
                if (!alertElements) {
                    alertElements = createAlert(drugList);
                    debugLog('Created "No Drugs" alert');
                    
                    // If we're on the items page with fromDrugAlert, force show GUI
                    if (window.location.href.includes('torn.com/item.php') && 
                        alertElements.gui && 
                        sessionStorage.getItem('fromDrugAlert')) {
                        debugLog('Auto-showing GUI after cooldown check');
                        alertElements.gui.style.display = 'block';
                        sessionStorage.removeItem('fromDrugAlert');
                    }
                }
            } else if (alertElements) {
                alertElements.alert.remove();
                alertElements.gui?.remove();
                alertElements = null;
                debugLog('Removed "No Drugs" alert due to cooldown');
            } else if (retryCount < maxRetries && !hasCooldown && !alertElements) {
                setTimeout(() => checkCooldownWithRetry(retryCount + 1), 1000);
                return;
            }
        };
        
        // Check if we're on the items page with a hash for drugs
        const isItemsPageWithDrugsHash = window.location.href.includes('torn.com/item.php') && 
                                         window.location.hash.includes('drugs');
        
        // Set a shorter initial delay if we're on the items page with the drugs hash
        const initialDelay = isItemsPageWithDrugsHash ? 500 : 2000;
        
        setTimeout(() => checkCooldownWithRetry(), initialDelay);
        
        const observer = new MutationObserver((mutations) => {
            const shouldCheck = mutations.some(mutation => {
                if (mutation.target && mutation.target.className && 
                    typeof mutation.target.className === 'string' && 
                    mutation.target.className.includes('status-icons')) {
                    return true;
                }
                return Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && node.className && (
                        (typeof node.className === 'string' && (
                            node.className.includes('icon') || 
                            node.className.includes('status')
                        ))
                    )
                );
            });
            
            if (shouldCheck) {
                checkCooldownWithRetry();
            }
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'aria-label', 'title'] 
        });
        
        setInterval(checkCooldownWithRetry, 30000);
        
        console.log('%c Drug Alerts Initialized ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    }

    function checkForPendingDrugUse() {
        try {
            // Check if we were redirected from the drug alert
            const fromAlert = sessionStorage.getItem('fromDrugAlert');
            
            if (fromAlert && window.location.href.includes('torn.com/item.php')) {
                debugLog('Detected navigation from drug alert');
                sessionStorage.removeItem('fromDrugAlert');
                
                // Only create and show GUI if we're on the items page
                if (window.location.href.includes('torn.com/item.php')) {
                    debugLog('On items page after navigation from alert');
                    
                    // Give time for the page to fully load
                    setTimeout(() => {
                        // If we have drugs already loaded, create GUI
                        if (drugList && drugList.length > 0) {
                            removeExistingAlerts(); // Clean up first
                            alertElements = createAlert(drugList);
                            
                            if (alertElements && alertElements.gui) {
                                debugLog('Showing drug GUI after navigation');
                                alertElements.gui.style.display = 'block';
                            }
                        } else {
                            debugLog('No drug list available yet, will fetch drugs');
                            // Fetch drugs and then create/show GUI
                            fetchDrugs().then(drugs => {
                                drugList = drugs;
                                removeExistingAlerts();
                                alertElements = createAlert(drugs);
                                
                                if (alertElements && alertElements.gui) {
                                    alertElements.gui.style.display = 'block';
                                }
                            });
                        }
                    }, 1000);
                }
            }
            
            // Check if there's a pending drug use in progress
            const pendingDrugUse = sessionStorage.getItem('drugUseInProgress');
            if (!pendingDrugUse) return;
            
            // ...existing pendingDrugUse handling...
        } catch (e) {
            debugLog('Error in checkForPendingDrugUse:', e);
            sessionStorage.removeItem('drugUseInProgress');
        }
    }

    function removeExistingAlerts() {
        const existingAlerts = document.querySelectorAll('.drug-alert');
        const existingGuis = document.querySelectorAll('.drug-gui');
        
        existingAlerts.forEach(alert => {
            debugLog('Removing existing alert:', alert.id || 'unnamed');
            alert.remove();
        });
        
        existingGuis.forEach(gui => {
            debugLog('Removing existing GUI:', gui.id || 'unnamed');
            gui.remove();
        });
        
        alertElements = null;
        debugLog('Removed all existing drug alerts and GUIs');
    }

    initializeWithPendingCheck();
})();