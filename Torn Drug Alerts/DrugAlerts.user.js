// ==UserScript==
// @name         Torn Drug Alert
// @version      1.0.15
// @description  Alerts when no drug cooldown is active and allows taking drugs from any page
// @author       GNSC4
// @match        https://www.torn.com/*
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @grant        GM_addStyle
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
            transition: opacity 0.5s;
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
    let useFactionDrugs = false; // New setting for faction drugs

    // Add debug mode toggle and log function
    let DEBUG_MODE = true; // Set to true to see verbose logging in console
    
    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[DrugAlerts Debug]', ...args);
        }
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
        
        // Check if we're on the items page or faction armoury page
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryPage = window.location.href.includes('factions.php') && 
                                     window.location.href.includes('armoury') && 
                                     window.location.href.includes('sub=drugs');
        
        // Create GUI only if on the appropriate page
        let gui = null;
        if (isItemsPage || (isFactionArmouryPage && useFactionDrugs)) {
            // Create the drug GUI
            gui = document.createElement('div');
            gui.className = 'drug-gui';
            gui.id = 'drugGui';
            gui.innerHTML = `
                <h3>Take Drugs</h3>
                <div class="settings-section">
                    <div class="settings-toggle">
                        <input type="checkbox" id="useFactionDrugs" ${useFactionDrugs ? 'checked' : ''}>
                        <label for="useFactionDrugs">Use Faction Armoury Drugs</label>
                    </div>
                </div>
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
            
            // Add event listener for faction drugs checkbox
            const factionDrugsCheckbox = gui.querySelector('#useFactionDrugs');
            if (factionDrugsCheckbox) {
                factionDrugsCheckbox.addEventListener('change', function() {
                    useFactionDrugs = this.checked;
                    localStorage.setItem('useFactionDrugs', useFactionDrugs);
                    debugLog(`Using faction drugs set to: ${useFactionDrugs}`);
                    
                    // Update UI immediately if needed
                    showNotification(`${useFactionDrugs ? 'Using faction armoury drugs' : 'Using personal inventory drugs'}`, 'info');
                });
            }
            
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
            debugLog(`Alert clicked. On items page: ${isItemsPage}, On faction armoury: ${isFactionArmouryPage}, Using faction drugs: ${useFactionDrugs}`);
            event.stopPropagation();
            
            if ((isItemsPage && !useFactionDrugs) || (isFactionArmouryPage && useFactionDrugs)) {
                // If on the correct page, show the GUI
                debugLog('Showing GUI on appropriate page');
                showNotification('Opening drug selection', 'info');
                gui.style.display = 'block';
                void gui.offsetWidth; // Force reflow
            } else {
                // Notify user to navigate manually
                debugLog(`Please navigate to ${useFactionDrugs ? 'faction armoury' : 'items'} page manually`);
                showNotification(`Please navigate to ${useFactionDrugs ? 'faction armoury' : 'items'} page manually`, 'info');
            }
            
            return false;
        };
        
        return { alert, gui };
    }

    function useDrug(id, name) {
        debugLog(`Attempting to use drug: ${name} (ID: ${id}), Using faction drugs: ${useFactionDrugs}`);
        showNotification(`Using ${name}...`, 'info');
        
        // Add test mode to verify gui is properly closing
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
        
        // Store drug use data for tracking
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
        
        
        const token = getNSTStyleToken();
        if (token) {
            debugLog(`Using NST-style token: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
            submitDrugUseRequest(id, name, token);
        } else {
            debugLog('No token found via NST method, trying backup methods');
            
            
            const pageToken = getPageCsrfToken();
            if (pageToken) {
                debugLog(`Using page token: ${pageToken.substring(0, 4)}...${pageToken.substring(pageToken.length - 4)}`);
                submitDrugUseRequest(id, name, pageToken);
                return;
            }
            
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
                        debugLog('Drug used successfully via XHR');
                        showNotification(`Used ${name} successfully!`, 'success');
                        
                        setTimeout(() => {
                            if (hasDrugCooldown()) {
                                debugLog('Drug cooldown confirmed after XHR');
                                if (alertElements) {
                                    alertElements.alert.remove();
                                    if (alertElements.gui) alertElements.gui.remove();
                                    alertElements = null;
                                }
                            }
                        }, 500);
                        
                        sessionStorage.removeItem('drugUseInProgress');
                        return;
                    }
                    
                    if (response && (response.message || response.text)) {
                        if ((response.message && response.message.includes('cooldown')) || 
                            (response.text && response.text.includes('cooldown')) ||
                            (response.text && response.text.includes('effect of a drug'))) {
                            debugLog('Drug is on cooldown');
                            
                            let cooldownMessage = 'You are already on drug cooldown';
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
                                cooldownMessage = `Drug Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
                                debugLog(`Extracted cooldown time: ${minutes}m ${remainingSeconds}s`);
                            } else {
                                if (response.text) {
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = response.text;
                                    const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                    cooldownMessage = textContent.trim() || 'You are on drug cooldown';
                                    debugLog('Using raw message text:', cooldownMessage);
                                }
                            }
                            
                            showNotification(cooldownMessage, 'info');
                            sessionStorage.removeItem('drugUseInProgress');
                            return;
                        }
                        
                        debugLog('XHR method returned error:', response.message || response.text);
                        showNotification(`Error: ${response.message || 'Unknown error'}`, 'error');
                        sessionStorage.removeItem('drugUseInProgress');
                        return;
                    }
                    
                    debugLog('Unexpected XHR response:', this.responseText);
                    
                    let errorMessage = `Unable to use ${name}: Unexpected response`;
                    try {
                        if (response.text) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = response.text;
                            errorMessage = `Error: ${tempDiv.textContent || tempDiv.innerText || 'Unknown error'}`;
                        }
                    } catch (e) {
                        debugLog('Error parsing error message:', e);
                    }
                    
                    showNotification(errorMessage, 'error');
                    sessionStorage.removeItem('drugUseInProgress');
                } catch (e) {
                    debugLog('Error parsing XHR response:', e);
                    showNotification(`Unable to use ${name}: Response parsing error`, 'error');
                    sessionStorage.removeItem('drugUseInProgress');
                }
            } else {
                debugLog('XHR request failed with status:', this.status);
                showNotification(`Unable to use ${name}: Request failed (${this.status})`, 'error');
                sessionStorage.removeItem('drugUseInProgress');
            }
        };
        
        xhr.onerror = function() {
            debugLog('XHR request failed with network error');
            showNotification(`Unable to use ${name}: Network error`, 'error');
            sessionStorage.removeItem('drugUseInProgress');
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
        
        if (!window.location.href.includes('factions.php') || 
            !window.location.href.includes('armoury') || 
            !window.location.href.includes('sub=drugs')) {
            debugLog('Not on faction armoury page, need to navigate manually');
            showNotification(`Please navigate to faction armoury first to use ${name}`, 'info');
            sessionStorage.removeItem('drugUseInProgress');
            return;
        }
        
        useFactionDrugDirectly(id, name);
    }

    function useFactionDrugDirectly(id, name) {
        debugLog(`Using faction drug directly: ${name} (ID: ${id})`);
        
        const token = getNSTStyleToken();
        if (!token) {
            const pageToken = getPageCsrfToken();
            if (!pageToken) {
                debugLog('No CSRF token found for faction drug via any method');
                showNotification('Unable to use faction drug: Authorization token not found', 'error');
                sessionStorage.removeItem('drugUseInProgress');
                return;
            }
            
            debugLog(`Using page token for faction drug: ${pageToken.substring(0, 4)}...${pageToken.substring(pageToken.length - 4)}`);
            useFactionDrugWithToken(id, name, pageToken);
        } else {
            debugLog(`Using NST-style token for faction drug: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
            useFactionDrugWithToken(id, name, token);
        }
    }

    function useFactionDrugWithToken(id, name, token) {
        let armouryItemID = null;
        
        const drugItems = document.querySelectorAll('#armoury-drugs ul.item-list li');
        for (const item of drugItems) {
            const nameElement = item.querySelector('.name, .title, .item-name');
            if (!nameElement) continue;
            
            const itemName = nameElement.textContent.trim();
            if (itemName.includes(name)) {
                const useLink = item.querySelector('div.item-action a');
                if (useLink && useLink.href) {
                    const match = useLink.href.match(/armoryItemID=(\d+)/);
                    if (match && match[1]) {
                        armouryItemID = match[1];
                        break;
                    }
                }
            }
        }
        
        if (!armouryItemID) {
            debugLog('Could not find armouryItemID, cannot proceed');
            showNotification(`Unable to find ${name} in faction armoury`, 'error');
            sessionStorage.removeItem('drugUseInProgress');
            return;
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
                    const response = JSON.parse(this.responseText);
                    
                    if (response && (response.success || response.message && response.message.includes('used'))) {
                        debugLog('Faction drug used successfully via XHR');
                        showNotification(`Used ${name} from faction armoury successfully!`, 'success');
                        
                        setTimeout(() => {
                            if (hasDrugCooldown()) {
                                debugLog('Drug cooldown confirmed after faction XHR');
                                if (alertElements) {
                                    alertElements.alert.remove();
                                    if (alertElements.gui) alertElements.gui.remove();
                                    alertElements = null;
                                }
                            }
                        }, 500);
                        
                        sessionStorage.removeItem('drugUseInProgress');
                        return;
                    }
                    
                    debugLog('Faction XHR method returned error:', response);
                    
                    let errorMessage = `Error using faction drug: ${response.message || 'Unknown error'}`;
                    let seconds = 0;
                    
                    if (response.text) {
                        if (response.text.includes('cooldown') || response.text.includes('effect of a drug')) {
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
                                errorMessage = `Drug Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
                                debugLog(`Extracted faction cooldown time: ${minutes}m ${remainingSeconds}s`);
                            } else {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = response.text;
                                const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                errorMessage = textContent.trim() || 'You are on drug cooldown';
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
                    
                    sessionStorage.removeItem('drugUseInProgress');
                } catch (e) {
                    debugLog('Error parsing faction XHR response:', e);
                    showNotification('Error using faction drug: Response parsing error', 'error');
                    sessionStorage.removeItem('drugUseInProgress');
                }
            } else {
                debugLog('Faction XHR request failed with status:', this.status);
                showNotification(`Error using faction drug: Request failed (${this.status})`, 'error');
                sessionStorage.removeItem('drugUseInProgress');
            }
        };
        
        xhr.onerror = function() {
            debugLog('Faction XHR request failed with network error');
            showNotification('Error using faction drug: Network error', 'error');
            sessionStorage.removeItem('drugUseInProgress');
        };
        
        xhr.send(params.toString());
    }

    function showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.drug-notification');
        existingNotifications.forEach(note => note.remove());
        
        const notification = document.createElement('div');
        notification.className = `drug-notification ${type}`;
        
        let cleanMessage = message;
        if (message.includes('<') && message.includes('>')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = message;
            cleanMessage = tempDiv.textContent || tempDiv.innerText || message;
        }
        
        if (cleanMessage.includes('Cooldown:') || cleanMessage.includes('cooldown')) {
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">Drug Cooldown Active</div>
                <div>${cleanMessage}</div>
            `;
            
            notification.style.minWidth = '280px';
            notification.style.padding = '15px 25px';
        } else {
            notification.textContent = cleanMessage;
        }
        
        document.body.appendChild(notification);
        
        notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
        notification.style.opacity = '0';
        
        void notification.offsetWidth;
        
        notification.style.transform = 'translate(-50%, -50%) scale(1)';
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => notification.remove(), 500);
        }, 7000);
        
        debugLog(`Notification [${type}]: ${cleanMessage}`);
    }

    function getNSTStyleToken() {
        debugLog('Trying NST-style token retrieval with onlinestatus.php');
        
        try {
            const cachedToken = sessionStorage.getItem('drugAlertsOnlineStatusToken');
            const cachedTime = sessionStorage.getItem('drugAlertsOnlineStatusTokenTime');
            
            if (cachedToken && cachedTime && (Date.now() - parseInt(cachedTime)) < 300000) {
                debugLog('Using cached online status token');
                return cachedToken;
            }
            
            const rfcCookie = getRFC();
            if (rfcCookie) {
                debugLog('Using RFC cookie as token');
                sessionStorage.setItem('drugAlertsOnlineStatusToken', rfcCookie);
                sessionStorage.setItem('drugAlertsOnlineStatusTokenTime', Date.now().toString());
                return rfcCookie;
            }
            
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://www.torn.com/onlinestatus.php?online', false);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            
            try {
                xhr.send(null);
                
                if (xhr.status === 200) {
                    const csrfHeader = xhr.getResponseHeader('X-CSRF-Token') || 
                                      xhr.getResponseHeader('csrf-token');
                    
                    if (csrfHeader) {
                        debugLog('Found token in response headers');
                        sessionStorage.setItem('drugAlertsOnlineStatusToken', csrfHeader);
                        sessionStorage.setItem('drugAlertsOnlineStatusTokenTime', Date.now().toString());
                        return csrfHeader;
                    }
                    
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        if (responseData && responseData.csrf) {
                            debugLog('Found token in parsed JSON response');
                            sessionStorage.setItem('drugAlertsOnlineStatusToken', responseData.csrf);
                            sessionStorage.setItem('drugAlertsOnlineStatusTokenTime', Date.now().toString());
                            return responseData.csrf;
                        }
                    } catch (jsonError) {
                        debugLog('Response is not valid JSON, attempting regex extraction');
                        
                        const tokenMatch = xhr.responseText.match(/csrf["']?\s*:\s*["']([a-f0-9]{16,})["']/i);
                        if (tokenMatch && tokenMatch[1]) {
                            debugLog('Extracted token with regex from response text');
                            sessionStorage.setItem('drugAlertsOnlineStatusToken', tokenMatch[1]);
                            sessionStorage.setItem('drugAlertsOnlineStatusTokenTime', Date.now().toString());
                            return tokenMatch[1];
                        }
                    }
                    
                    const responseUrl = xhr.responseURL;
                    if (responseUrl) {
                        const urlMatch = responseUrl.match(/[?&]csrf=([a-f0-9]{16,})/i);
                        if (urlMatch && urlMatch[1]) {
                            debugLog('Found token in response URL');
                            sessionStorage.setItem('drugAlertsOnlineStatusToken', urlMatch[1]);
                            sessionStorage.setItem('drugAlertsOnlineStatusTokenTime', Date.now().toString());
                            return urlMatch[1];
                        }
                    }
                }
            } catch (xhrError) {
                debugLog('XHR request failed:', xhrError);
            }
            
            try {
                const sidebarXhr = new XMLHttpRequest();
                sidebarXhr.open('GET', 'https://www.torn.com/sidebar.php', false);
                sidebarXhr.send(null);
                
                if (sidebarXhr.status === 200) {
                    const html = sidebarXhr.responseText;
                    const csrfMatch = html.match(/name=["']?csrf["']?\s+value=["']([a-f0-9]{16,})["']/i);
                    
                    if (csrfMatch && csrfMatch[1]) {
                        debugLog('Found CSRF token in sidebar HTML');
                        sessionStorage.setItem('drugAlertsOnlineStatusToken', csrfMatch[1]);
                        sessionStorage.setItem('drugAlertsOnlineStatusTokenTime', Date.now().toString());
                        return csrfMatch[1];
                    }
                }
            } catch (sidebarError) {
                debugLog('Sidebar request failed:', sidebarError);
            }
            
            return extractTokenFromPage();
        } catch (e) {
            debugLog('Error in getNSTStyleToken:', e);
            return extractTokenFromPage();
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
        
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const cookieToken = $.cookie('csrf');
            if (cookieToken) {
                debugLog('Found token in $.cookie("csrf")');
                return cookieToken;
            }
        }
        
        debugLog('No token found in page');
        return null;
    }

    function getRFC() {
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const rfcCookie = $.cookie('rfc_v');
            if (rfcCookie) {
                debugLog('Found RFC in jQuery cookie:', rfcCookie);
                return rfcCookie;
            }
        }
        
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
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const rfcParam = urlParams.get('rfcv');
            if (rfcParam) {
                debugLog('Found RFC in URL parameter:', rfcParam);
                return rfcParam;
            }
        } catch (e) {
            debugLog('Error extracting RFC from URL:', e);
        }
        
        try {
            const links = document.querySelectorAll('a[href*="rfcv="]');
            for (const link of links) {
                const href = link.getAttribute('href');
                const match = href.match(/rfcv=([^&]+)/);
                if (match && match[1]) {
                    debugLog('Found RFC in link href:', match[1]);
                    return match[1];
                }
            }
        } catch (e) {
            debugLog('Error extracting RFC from links:', e);
        }
        
        debugLog('No RFC found');
        return null;
    }

    function getPageCsrfToken() {
        debugLog('Searching for token in page');
        
        if (typeof window.csrf !== 'undefined' && window.csrf) {
            debugLog('Found token in window.csrf');
            return window.csrf;
        }
        
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') {
            const cookieToken = $.cookie('csrf');
            if (cookieToken) {
                debugLog('Found token in $.cookie("csrf")');
                return cookieToken;
            }
        }
        
        const inputs = document.querySelectorAll('input[name="csrf"]');
        for (const input of inputs) {
            if (input.value) {
                debugLog('Found token in input field');
                return input.value;
            }
        }
        
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
        
        return null;
    }

    function fetchCsrfToken() {
        debugLog('Fetching token via XHR');
        return new Promise(resolve => {
            fetch('https://www.torn.com/index.php')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const csrfInput = doc.querySelector('input[name="csrf"]');
                    if (csrfInput && csrfInput.value) {
                        debugLog('Found token in fetched page inputs');
                        resolve(csrfInput.value);
                        return;
                    }
                    
                    const scriptPattern = /var\s+csrf\s*=\s*["']([a-f0-9]{16,})["']/;
                    const scripts = doc.querySelectorAll('script:not([src])');
                    for (const script of scripts) {
                        if (!script.textContent) continue;
                        const match = script.textContent.match(scriptPattern);
                        if (match && match[1]) {
                            debugLog('Found token in fetched page scripts');
                            resolve(match[1]);
                            return;
                        }
                    }
                    
                    resolve(null);
                })
                .catch(error => {
                    debugLog('Error fetching token via XHR:', error);
                    resolve(null);
                });
        });
    }

    function hasDrugCooldown() {
        debugLog('Checking for drug cooldown...');
        
        const drugCooldown = document.querySelector("[aria-label^='Drug Cooldown:']");
        if (drugCooldown) {
            debugLog('Found drug cooldown via aria-label');
            return true;
        }
        
        const statusIcons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a');
        for (const icon of statusIcons) {
            const ariaLabel = icon.getAttribute('aria-label') || '';
            const title = icon.getAttribute('title') || '';
            
            if ((ariaLabel.includes('Drug') && ariaLabel.includes('Cooldown')) || 
                (title.includes('Drug') && title.includes('Cooldown'))) {
                debugLog('Found drug cooldown in status icons via tooltip text');
                return true;
            }
            
            if (icon.className && /icon5[0-9]/.test(icon.className)) {
                debugLog('Found drug cooldown icon via class name pattern');
                return true;
            }
        }
        
        debugLog('No drug cooldown detected');
        return false;
    }

    function addQuickUseButtons() {
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

    function startCooldownChecks() {
        const checkCooldownWithRetry = (retryCount = 0) => {
            const maxRetries = 3;
            const hasCooldown = hasDrugCooldown();
            
            debugLog(`Cooldown check (attempt ${retryCount + 1}): ${hasCooldown ? 'ON COOLDOWN' : 'NO COOLDOWN'}`);
            
            if (!hasCooldown) {
                if (!alertElements) {
                    alertElements = createAlert(drugList);
                    debugLog('Created "No Drugs" alert');
                    
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
        
        const isItemsPageWithDrugsHash = window.location.href.includes('torn.com/item.php') && 
                                         window.location.hash.includes('drugs');
        
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
            const fromAlert = sessionStorage.getItem('fromDrugAlert');
            
            if (fromAlert) {
                debugLog('Detected navigation from drug alert');
                sessionStorage.removeItem('fromDrugAlert');
                
                const isItemsPage = window.location.href.includes('torn.com/item.php');
                const isFactionPage = window.location.href.includes('factions.php') && 
                                      window.location.href.includes('armoury') && 
                                      window.location.href.includes('sub=drugs');
                                  
                if ((isItemsPage && !useFactionDrugs) || (isFactionPage && useFactionDrugs)) {
                    debugLog('On appropriate page after navigation from alert');
                    
                    setTimeout(() => {
                        if (drugList && drugList.length > 0) {
                            removeExistingAlerts();
                            alertElements = createAlert(drugList);
                            
                            if (alertElements && alertElements.gui) {
                                debugLog('Showing drug GUI after navigation');
                                alertElements.gui.style.display = 'block';
                            }
                        } else {
                            debugLog('No drug list available yet, will fetch drugs');
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
                } else {
                    debugLog('Not on appropriate page after navigation, canceling GUI display');
                }
            }
            
            sessionStorage.removeItem('drugUseInProgress');
            
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

    function initializeWithPendingCheck() {
        debugLog('Initializing Drug Alerts');
        
        useFactionDrugs = localStorage.getItem('useFactionDrugs') === 'true';
        debugLog(`Initialized with faction drugs setting: ${useFactionDrugs}`);
        
        removeExistingAlerts();
        
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionPage = window.location.href.includes('factions.php') && 
                              window.location.href.includes('armoury') && 
                              window.location.href.includes('sub=drugs');
                              
        if ((isItemsPage && !useFactionDrugs) || (isFactionPage && useFactionDrugs)) {
            if (sessionStorage.getItem('fromDrugAlert') === 'true') {
                debugLog('Detected we arrived from alert - will focus on showing GUI');
            }
        }
        
        fetchDrugs().then(fetchedDrugs => {
            debugLog(`Fetched ${fetchedDrugs.length} drugs`);
            drugList = fetchedDrugs;
            
            if (isItemsPage || (isFactionPage && useFactionDrugs)) {
                debugLog('On appropriate page, adding quick use buttons');
                addQuickUseButtons();
                
                if (sessionStorage.getItem('fromDrugAlert')) {
                    debugLog('Found fromDrugAlert flag, will show GUI');
                    removeExistingAlerts();
                    alertElements = createAlert(drugList);
                    
                    if (alertElements && alertElements.gui) {
                        alertElements.gui.style.display = 'block';
                        sessionStorage.removeItem('fromDrugAlert');
                    }
                }
            }
            
            startCooldownChecks();
        });
    }

    initializeWithPendingCheck();
})();