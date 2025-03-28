// ==UserScript==
// @name         Torn Drug Alert
// @namespace    http://tampermonkey.net/
// @version      1.0.6
// @description  Alerts when no drug cooldown is active and allows taking drugs from any page
// @author       GNSC4
// @match        https://www.torn.com/*
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%Alerts/DrugAlerts.js
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%Alerts/DrugAlerts.js
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
            bottom: 80px;
            right: 20px;
            background-color: #222;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
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
            padding: 8px;
            border-radius: 3px;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.2s;
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
    
    // Fallback drug list in case fetch fails
    const fallbackDrugs = [
        { id: 196, name: "Cannabis" },
        { id: 197, name: "Ecstasy" },
        { id: 198, name: "Ketamine" },
        { id: 199, name: "LSD" },
        { id: 200, name: "Opium" },
        { id: 203, name: "Shrooms" },
        { id: 204, name: "Speed" },
        { id: 205, name: "PCP" },
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
    
    // Replace the complex hasDrugCooldown function with a simpler, more reliable version
    function hasDrugCooldown() {
        debugLog('Checking for drug cooldown...');
        
        // Simple direct check for the drug cooldown aria-label
        const drugCooldown = document.querySelector("[aria-label^='Drug Cooldown:']");
        const hasCooldown = drugCooldown !== null;
        
        debugLog('Drug cooldown detected:', hasCooldown);
        return hasCooldown;
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
        
        // Check if alert already exists to prevent duplicates
        const existingAlert = document.querySelector('.drug-alert');
        if (existingAlert) {
            debugLog('Alert already exists, not creating another one');
            return { alert: existingAlert, gui: document.querySelector('.drug-gui') };
        }
        
        const alert = document.createElement('div');
        alert.className = 'drug-alert';
        alert.textContent = 'No Drugs';
        
        positionDrugAlert(alert, header);
        
        const gui = document.createElement('div');
        gui.className = 'drug-gui';
        gui.innerHTML = `
            <h3>Take Drugs</h3>
            <input type="text" class="drug-search" placeholder="Search drugs...">
            <div class="drug-list"></div>
        `;
        document.body.appendChild(gui);
        
        const searchInput = gui.querySelector('.drug-search');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const drugItems = gui.querySelectorAll('.drug-item');
            
            drugItems.forEach(item => {
                const name = item.textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
        const drugListElement = gui.querySelector('.drug-list');
        drugs.forEach(drug => {
            const drugItem = document.createElement('div');
            drugItem.className = 'drug-item';
            drugItem.textContent = drug.name;
            drugItem.dataset.id = drug.id;
            drugListElement.appendChild(drugItem);
            
            drugItem.addEventListener('click', () => {
                useDrug(drug.id, drug.name);
            });
        });
        
        alert.addEventListener('click', () => {
            gui.style.display = gui.style.display === 'none' || gui.style.display === '' ? 'block' : 'none';
        });
        
        document.addEventListener('click', (e) => {
            if (!gui.contains(e.target) && !alert.contains(e.target) && gui.style.display === 'block') {
                gui.style.display = 'none';
            }
        });
        
        return { alert, gui };
    }

    function useDrug(id, name) {
        debugLog(`Attempting to use drug: ${name} (ID: ${id})`);
        showNotification(`Using ${name}...`, 'info');

        tryDirectUseMethod(id, name);
    }

    function fetchDrugs() {
        debugLog('Fetching drugs list');
        return new Promise((resolve, reject) => {
            fetch('https://www.torn.com/item.php')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const drugsTab = doc.querySelector('a.drugs-category-icon, a[data-title="Drugs"], a[href="#drugs-items"]');
                    
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
                        resolve(uniqueDrugs);
                    } else {
                        console.log('No drugs found in page, using fallback drug list');
                        resolve(fallbackDrugs);
                    }
                })
                .catch(error => {
                    console.error('Error fetching drugs:', error);
                    resolve(fallbackDrugs);
                });
        });
    }

    function addQuickUseButtons() {
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
            { id: 204, name: "Cannabis", color: "#8BC34A" }
        ];
        
        quickUseDrugs.forEach(drug => {
            const button = document.createElement('button');
            button.textContent = drug.name;
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
        
        // Get saved minimized state
        let isMinimized = localStorage.getItem('drugAlertMinimized') === 'true';
        
        // Apply initial state
        if (isMinimized) {
            const buttons = quickUseContainer.querySelectorAll('button:not(:last-child)');
            buttons.forEach(btn => btn.style.display = 'none');
            quickUseContainer.style.padding = '2px';
            toggleButton.textContent = '+';
        }
        
        toggleButton.addEventListener('click', () => {
            const buttons = quickUseContainer.querySelectorAll('button:not(:last-child)');
            isMinimized = !isMinimized;
            
            if (isMinimized) {
                buttons.forEach(btn => btn.style.display = 'none');
                quickUseContainer.style.padding = '2px';
                toggleButton.textContent = '+';
            } else {
                buttons.forEach(btn => btn.style.display = 'block');
                quickUseContainer.style.padding = '10px';
                toggleButton.textContent = 'X';
            }
            
            // Save state to localStorage
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

    function initializeWithPendingCheck() {
        debugLog('Initializing Drug Alerts with pending operation check');
        
        // Clear any existing drug alerts first to prevent duplicates
        removeExistingAlerts();
        
        fetchDrugs().then(fetchedDrugs => {
            debugLog(`Fetched ${fetchedDrugs.length} drugs`);
            drugList = fetchedDrugs;
            
            debugLog('Adding quick use buttons');
            addQuickUseButtons();
            
            debugLog('Setting up initial cooldown check');
            setTimeout(() => {
                const hasCooldown = hasDrugCooldown();
                if (!hasCooldown) {
                    alertElements = createAlert(drugList);
                }
            }, 2000);
            
            debugLog('Setting up mutation observer');
            const observer = new MutationObserver(() => {
                const hasCooldown = hasDrugCooldown();
                if (!hasCooldown && !alertElements) {
                    alertElements = createAlert(drugList);
                } else if (hasCooldown && alertElements) {
                    alertElements.alert.remove();
                    alertElements.gui.remove();
                    alertElements = null;
                }
            });
            
            observer.observe(document.body, { 
                childList: true, 
                subtree: true 
            });
            
            debugLog('Setting up periodic check');
            setInterval(() => {
                const hasCooldown = hasDrugCooldown();
                if (!hasCooldown && !alertElements) {
                    alertElements = createAlert(drugList);
                } else if (hasCooldown && alertElements) {
                    alertElements.alert.remove();
                    alertElements.gui.remove();
                    alertElements = null;
                }
            }, 60000);
            
            console.log('%c Drug Alerts Initialized ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
        });
    }

    // Helper function to remove any existing alerts before creating new ones
    function removeExistingAlerts() {
        const existingAlerts = document.querySelectorAll('.drug-alert');
        const existingGuis = document.querySelectorAll('.drug-gui');
        
        existingAlerts.forEach(alert => alert.remove());
        existingGuis.forEach(gui => gui.remove());
        
        alertElements = null;
        debugLog('Removed any existing drug alerts');
    }

    initializeWithPendingCheck();
})();