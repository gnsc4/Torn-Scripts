// ==UserScript==
// @name         Torn Booster Alert
// @version      1.2.0
// @description  Alerts when no booster cooldown is active, adds Quick Use panel (Cooperative Positioning, Auto Text Contrast). Release Version.
// @author       GNSC4 [268863] (Release Version Prep)
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
        // console.log('Booster Alerts: Not initializing on attack page');
        return;
    }

    // --- Configuration ---
    let DEBUG_MODE = false; // Set to true to enable console logs for debugging
    // --- End Configuration ---

    // --- Default Booster Colors (Based on Category) ---
    const defaultBoosterColors = {
        energy: '#4CAF50', nerve: '#F44336', happy: '#FFEB3B', statEnhancers: '#2196F3', default: '#9E9E9E'
    };
    // --- End Booster Colors ---

    // --- Booster Data ---
    const BOOSTERS = {
        energy: [ { id: 987, name: "Can of Crocozade" }, { id: 986, name: "Can of Damp Valley" }, { id: 985, name: "Can of Goose Juice" }, { id: 530, name: "Can of Munster" }, { id: 532, name: "Can of Red Cow" }, { id: 554, name: "Can of Rockstar Rudolph" }, { id: 553, name: "Can of Santa Shooters" }, { id: 533, name: "Can of Taurine Elite" }, { id: 555, name: "Can of X-MASS" }, { id: 367, name: "Feathery Hotel Coupon" } ],
        nerve: [ { id: 180, name: "Bottle of Beer" }, { id: 181, name: "Bottle of Champagne" }, { id: 638, name: "Bottle of Christmas Cocktail" }, { id: 924, name: "Bottle of Christmas Spirit" }, { id: 873, name: "Bottle of Green Stout" }, { id: 550, name: "Bottle of Kandy Kane" }, { id: 551, name: "Bottle of Minty Mayhem" }, { id: 552, name: "Bottle of Mistletoe Madness" }, { id: 984, name: "Bottle of Moonshine" }, { id: 531, name: "Bottle of Pumpkin Brew" }, { id: 294, name: "Bottle Of Sake Brew" }, { id: 541, name: "Bottle of Stinky Swamp Punch" }, { id: 426, name: "Bottle of Tequila" }, { id: 542, name: "Bottle of Wicked Witch" } ],
        happy: [ { id: 634, name: "Bag of Blood Eyeballs" }, { id: 37, name: "Bag of Bon Bons" }, { id: 527, name: "Bag of Candy Kisses" }, { id: 210, name: "Bag of Chocolate Kisses" }, { id: 529, name: "Bag of Chocolate Truffles" }, { id: 1039, name: "Bag of Humbugs" }, { id: 556, name: "Bag of Raindeer Droppings" }, { id: 587, name: "Bag of Sherbet" }, { id: 528, name: "Bag of Tootsie Rolls" }, { id: 36, name: "Big Box of Chocolate Bars" }, { id: 1028, name: "Birthday Cupcake" }, { id: 38, name: "Box of Bon Bons" }, { id: 35, name: "Box of Chocolate Bars" }, { id: 39, name: "Box of Extra Strong Mints" }, { id: 209, name: "Box of Sweet Hearts" }, { id: 1312, name: "Chocolate Egg" }, { id: 586, name: "Jawbreaker" }, { id: 310, name: "Lollipop" }, { id: 151, name: "Pixie Sticks" }, { id: 366, name: "Erotic DVD" } ],
        statEnhancers: [ { id: 329, name: "Skateboard", effect: "Speed" }, { id: 331, name: "Dumbbells", effect: "Strength" }, { id: 106, name: "Parachute", effect: "Dexterity" }, { id: 330, name: "Boxing Gloves", effect: "Defense" } ]
    };
    // Flatten booster list for easier searching in customization UI
    const allBoostersFlat = Object.values(BOOSTERS).flat();
    // --- End Booster Data ---

    // --- Global State Variables ---
    let alertElements = null; // Holds references to the main alert button and GUI
    let useFactionBoosters = localStorage.getItem('useFactionBoosters') === 'true'; // Load setting on init
    let coopObserver = null; // Observer for cooperative positioning
    let coopAdjustInterval = null; // Interval timer for fallback adjustment
    let cooldownCheckInterval = null; // Interval for periodic cooldown checks
    let cooldownObserver = null; // Observer for status icon changes
    // --- End Global State ---

    // --- Helper Functions ---
    function debugLog(...args) { if (DEBUG_MODE) { console.log('[BoosterAlerts Debug]', ...args); } }

    function getBoosterCategory(id) {
        if (typeof BOOSTERS === 'undefined') return 'default';
        for (const category in BOOSTERS) { if (BOOSTERS[category].some(b => b.id === id)) { return category; } }
        return 'default';
     }

    function getDefaultBoosterColor(id) {
        const cat = getBoosterCategory(id); return defaultBoosterColors[cat] || defaultBoosterColors.default;
     }

    // Calculates contrast color (black/white) for a given background hex color
    function getTextColorForBackground(hexColor) {
        try {
            hexColor = hexColor.replace(/^#/, '');
            if (hexColor.length === 3) { hexColor = hexColor[0] + hexColor[0] + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2]; }
            if (hexColor.length !== 6) { return '#FFFFFF'; }
            const r = parseInt(hexColor.substring(0, 2), 16); const g = parseInt(hexColor.substring(2, 4), 16); const b = parseInt(hexColor.substring(4, 6), 16);
            const rNorm = r / 255.0; const gNorm = g / 255.0; const bNorm = b / 255.0;
            const rFinal = rNorm <= 0.03928 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
            const gFinal = gNorm <= 0.03928 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
            const bFinal = bNorm <= 0.03928 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);
            const luminance = 0.2126 * rFinal + 0.7152 * gFinal + 0.0722 * bFinal;
            return luminance > 0.5 ? '#000000' : '#FFFFFF';
        } catch (e) { console.error("Error calculating text color:", hexColor, e); return '#FFFFFF'; }
     }

    // Finds the appropriate header element to attach the alert button to
    function findHeader() {
        if (window.location.href.includes('torn.com/forums.php')) {
            const forumHeader = document.querySelector('div.content-title.m-bottom10'); if (forumHeader) return forumHeader;
            const skipToContent = document.getElementById('skip-to-content'); if (skipToContent) { const p = skipToContent.closest('.content-title, .page-head'); if(p) return p; }
        }
        const selectors = ['.appHeader___gUnYC', '.content-title', '.tutorial-cont', '.cont-gray', '.content-wrapper .header', '.content-wrapper .title-black', '.captionWithActionContainment___nVTbE', '.pageTitle___CaFrO', '.sortable-list .title', '.topSection___CfKvI', '.mainStatsContainer___TXO7F', 'div[role="heading"]', '#mainContainer > div.content-wrapper.winter > div.content-title.m-bottom10 h4', '.titleContainer___QrlWP .title___rhtB4', 'div.content-title h4', '.title-black', '.clearfix .t-black', '.page-head > h4', '#react-root > div > div.appHeader___gUnYC.crimes-app-header > h4', 'div.appHeader___gUnYC h4', '#skip-to-content', '.header-title', '.mobile-title', '.app-header'];
        return selectors.map(s => document.querySelector(s)).find(h => h !== null) || createFixedHeader();
    }

    // Creates a fallback fixed header if no suitable header is found
    function createFixedHeader() {
        let fh = document.getElementById('torn-booster-fixed-header');
        if (!fh) {
            fh = document.createElement('div'); fh.id = 'torn-booster-fixed-header';
            Object.assign(fh.style, { position: 'fixed', top: '50px', right: '20px', zIndex: '9999', backgroundColor: 'rgba(34, 34, 34, 0.8)', padding: '5px 10px', borderRadius: '5px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' });
            document.body.appendChild(fh);
        }
        return fh;
    }

    // Positions the main alert button correctly based on page context
    function positionBoosterAlert(alert, header) {
        if (window.location.href.includes('torn.com/forums.php')) {
            // debugLog('Positioning alert for forum page');
            const l = header.querySelector('.links-top-wrap');
            if (l) { header.insertBefore(alert, l); }
            else { const h4 = header.querySelector('h4'); if (h4) { if (h4.nextSibling) header.insertBefore(alert, h4.nextSibling); else header.appendChild(alert); } else { header.appendChild(alert); } }
            alert.style.cssText = `display: inline-flex !important; align-items: center !important; margin-left: 15px !important; float: right !important; position: relative !important; z-index: 99999 !important; margin-top: 5px !important;`;
        } else {
            header.appendChild(alert);
            alert.style.cssText = `display: inline-flex !important; align-items: center !important; margin-left: 10px !important; order: 2 !important; z-index: 99999 !important; pointer-events: auto !important;`;
            const mob = navigator.userAgent.includes('PDA') || window.innerWidth < 768 || document.documentElement.classList.contains('tornPDA');
            if (mob) { alert.style.fontSize = '10px'; alert.style.padding = '3px 6px'; alert.style.marginLeft = '5px'; }
            if (header.id === 'torn-booster-fixed-header') { alert.style.margin = '0'; alert.style.marginLeft = '5px'; }
        }
    }

    // Removes UI elements managed by this script, EXCEPT the quick use panel
    function removeExistingAlertsAndGui() {
        const alertBtn = document.querySelector('.booster-alert'); if (alertBtn) alertBtn.remove();
        const mainGui = document.getElementById('boosterGui'); if (mainGui) mainGui.remove();
        const custUi = document.getElementById('booster-customization-ui'); if (custUi) custUi.remove();
        const addUi = document.getElementById('add-boosters-ui'); if (addUi) addUi.remove();
        const notifications = document.querySelectorAll('.booster-notification'); notifications.forEach(n => n.remove());
        if (alertElements) alertElements = null; // Reset reference if it pointed to the removed elements
        // debugLog('Removed main booster alert/GUI and customization popups');
    }
    // --- End Helper Functions ---

    // --- Styles ---
    GM_addStyle(`
        /* --- Base Styles --- */
        .booster-alert { background-color: #2196F3; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; margin-left: 15px; display: inline-flex; align-items: center; font-size: 12px; }
        .settings-section { margin-top: 15px; margin-bottom: 15px; padding: 10px; background-color: #333; border-radius: 5px; border: 1px solid #444; }
        .settings-toggle { display: flex; align-items: center; margin-bottom: 8px; }
        .settings-toggle label { margin-left: 8px; cursor: pointer; color: white; }
        .booster-gui { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #222; color: white; padding: 20px; border-radius: 8px; z-index: 99999999; width: 90vw; max-width: 500px; max-height: 80vh; overflow-y: auto; display: none; box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444; box-sizing: border-box; }
        .booster-gui h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .booster-search { width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #444; background-color: #333; color: white; border-radius: 3px; box-sizing: border-box; }
        .booster-search::placeholder { color: #aaa; }
        .category-header { margin-top: 15px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #333; font-weight: bold; color: #4CAF50; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .toggle-category { background-color: #333; color: white; border: 1px solid #444; border-radius: 3px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; font-size: 14px; }
        .booster-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 5px; }
        .booster-item { background-color: #333; padding: 12px; border-radius: 5px; text-align: center; cursor: pointer; transition: background-color 0.2s; font-size: 13px; font-weight: bold; word-wrap: break-word; }
        .energy-item { border-left: 3px solid #4CAF50; }
        .nerve-item { border-left: 3px solid #F44336; }
        .happy-item { border-left: 3px solid #FFEB3B; color: #333; }
        .stat-item { border-left: 3px solid #2196F3; }
        .booster-item:hover { background-color: #444; }
        .booster-notification { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 15px 20px; border-radius: 5px; color: white; z-index: 999999; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4); opacity: 1; transition: opacity 0.5s, transform 0.3s ease-out; text-align: center; min-width: 250px; max-width: 80%; pointer-events: none; }
        .booster-notification.success { background-color: rgba(76, 175, 80, 0.9); border: 1px solid #4CAF50; }
        .booster-notification.error { background-color: rgba(244, 67, 54, 0.9); border: 1px solid #f44336; }
        .booster-notification.info { background-color: rgba(33, 150, 243, 0.9); border: 1px solid #2196F3; }

        /* --- Quick Use Styles (Booster Specific) --- */
        .booster-quick-use-container { position: fixed; right: 20px; background-color: rgba(34, 34, 34, 0.8); padding: 10px; border-radius: 5px; z-index: 9998; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: top 0.3s ease, padding 0.3s ease; }
        .booster-quick-button { /* color set dynamically */ border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: bold; margin-bottom: 5px; text-align: center; transition: background-color 0.2s, filter 0.2s; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .booster-quick-button:hover { filter: brightness(1.2); }
        .booster-settings-button { background-color: #555; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: bold; margin-top: 5px; text-align: center; font-size: 12px; transition: background-color 0.2s; }
        .booster-settings-button:hover { background-color: #666; }
        .booster-quick-use-toggle-button { position: absolute; top: -8px; right: -8px; background-color: #2196F3; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.5); z-index: 1; }
        #booster-customization-ui, #add-boosters-ui { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #222; color: white; padding: 20px; border-radius: 8px; z-index: 9999998; width: 90vw; max-width: 400px; max-height: 70vh; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444; box-sizing: border-box; }
        #booster-customization-ui h3, #add-boosters-ui h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
        #booster-customization-ui p { margin-bottom: 15px; font-size: 14px; }
        .booster-selection-area, .add-booster-list-container { margin-bottom: 15px; border: 1px solid #444; border-radius: 5px; padding: 10px; max-height: 250px; overflow-y: auto; }
        .booster-selection-item, .add-booster-item { display: flex; align-items: center; padding: 8px; margin-bottom: 5px; background-color: #333; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
        .booster-selection-item span:first-of-type { margin-right: 10px; cursor: move; user-select: none; }
        .booster-selection-item input[type="checkbox"], .add-booster-item input[type="checkbox"] { margin-right: 10px; }
        .booster-selection-item span:nth-of-type(2), .add-booster-item span { flex-grow: 1; }
        .booster-selection-item input[type="color"] { width: 25px; height: 25px; border: none; background: none; cursor: pointer; vertical-align: middle; margin-left: 10px; padding: 0; }
        .booster-customization-button { background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex-grow: 1; margin: 0 5px; transition: background-color 0.2s; font-size: 13px; }
        .booster-customization-button.cancel { background-color: #777; }
        .booster-customization-button.add { width: 100%; margin-bottom: 15px; box-sizing: border-box; }
        .booster-customization-button:hover { filter: brightness(1.1); }
        .booster-customization-button-container { display: flex; justify-content: space-between; margin-top: 10px; }
        #add-boosters-ui input[type="text"] { width: 100%; padding: 8px; margin-bottom: 10px; background-color: #333; border: 1px solid #444; border-radius: 4px; color: white; box-sizing: border-box; }
        .add-booster-item.selected { background-color: #444; }
        .add-boosters-button-container { display: flex; justify-content: flex-end; margin-top: 10px; }
        .add-boosters-done-button { background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; font-size: 13px; }
        .add-boosters-done-button:hover { filter: brightness(1.1); }
    `);
    // --- End Styles ---


    // --- Main Alert & GUI Functions ---
    function createAlert() {
        let header = findHeader();
        // Clean up previous alert/GUI elements specifically managed by this function
        const existingAlert = document.querySelector('.booster-alert'); if (existingAlert) existingAlert.remove();
        const existingGui = document.getElementById('boosterGui'); if (existingGui) existingGui.remove();
        alertElements = null; // Reset reference

        const alert = document.createElement('div'); alert.className = 'booster-alert'; alert.textContent = 'No Boosters'; alert.style.cursor = 'pointer'; alert.style.backgroundColor = '#2196F3';
        positionBoosterAlert(alert, header);

        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryBoostersPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && (window.location.href.includes('sub=boosters') || window.location.href.includes('tab=armoury'));
        // debugLog(`Page check - Items: ${isItemsPage}, Faction Armoury Boosters: ${isFactionArmouryBoostersPage}`);

        let gui = document.getElementById('boosterGui');
        if (!gui) {
            gui = document.createElement('div'); gui.className = 'booster-gui'; gui.id = 'boosterGui';
            gui.innerHTML = `<h3>Take Boosters</h3><div class="settings-section"><div class="settings-toggle"><input type="checkbox" id="useFactionBoosters" ${useFactionBoosters ? 'checked' : ''}><label for="useFactionBoosters">Use Faction Armoury Boosters</label></div></div><input type="text" class="booster-search" placeholder="Search boosters..."><div class="category-header energy-header" data-category="energy"><span>Energy Boosters</span><button class="toggle-category">-</button></div><div class="booster-list energy-list"></div><div class="category-header nerve-header" data-category="nerve"><span>Nerve Boosters</span><button class="toggle-category">-</button></div><div class="booster-list nerve-list"></div><div class="category-header happy-header" data-category="happy"><span>Happy Boosters</span><button class="toggle-category">-</button></div><div class="booster-list happy-list"></div><div class="category-header statEnhancers-header" data-category="statEnhancers"><span>Stat Enhancers</span><button class="toggle-category">-</button></div><div class="booster-list statEnhancers-list"></div>`;
            document.body.appendChild(gui);
            // Setup GUI listeners and content
            const factionBoostersCheckbox = gui.querySelector('#useFactionBoosters'); if (factionBoostersCheckbox) { factionBoostersCheckbox.addEventListener('change', function() { useFactionBoosters = this.checked; localStorage.setItem('useFactionBoosters', useFactionBoosters); showNotification(`${useFactionBoosters ? 'Using faction armoury boosters' : 'Using personal inventory boosters'}`, 'info'); gui.style.display = 'none'; }); }
            const searchInput = gui.querySelector('.booster-search'); searchInput.addEventListener('input', function() { const term = this.value.toLowerCase(); gui.querySelectorAll('.booster-item').forEach(item => { const name = item.getAttribute('data-name').toLowerCase(); item.style.display = (term === '' || name.includes(term)) ? 'block' : 'none'; }); Object.keys(BOOSTERS).forEach(cat => { const h = gui.querySelector(`.${cat}-header`); const l = gui.querySelector(`.${cat}-list`); const vis = Array.from(l.querySelectorAll('.booster-item')).filter(i => i.style.display !== 'none').length; h.style.display = vis > 0 ? 'flex' : 'none'; const min = localStorage.getItem(`boosterCategory_${cat}`) === 'minimized'; l.style.display = (vis > 0 && !min) ? 'grid' : 'none'; }); });
            function setupCategoryToggles() { Object.keys(BOOSTERS).forEach(cat => { const h = gui.querySelector(`.${cat}-header`); const l = gui.querySelector(`.${cat}-list`); const btn = h.querySelector('.toggle-category'); const min = localStorage.getItem(`boosterCategory_${cat}`) === 'minimized'; l.style.display = min ? 'none' : 'grid'; btn.textContent = min ? '+' : '-'; h.addEventListener('click', (e) => { if (e.target === h || e.target === btn || e.target === h.querySelector('span')) { toggleCategory(cat, l, btn); } }); }); }
            function toggleCategory(cat, list, btn) { const vis = list.style.display !== 'none'; if (vis) { list.style.display = 'none'; btn.textContent = '+'; localStorage.setItem(`boosterCategory_${cat}`, 'minimized'); } else { list.style.display = 'grid'; btn.textContent = '-'; localStorage.setItem(`boosterCategory_${cat}`, 'expanded'); } }
            populateBoosterList(gui.querySelector('.energy-list'), BOOSTERS.energy, 'energy-item'); populateBoosterList(gui.querySelector('.nerve-list'), BOOSTERS.nerve, 'nerve-item'); populateBoosterList(gui.querySelector('.happy-list'), BOOSTERS.happy, 'happy-item'); populateBoosterList(gui.querySelector('.statEnhancers-list'), BOOSTERS.statEnhancers, 'stat-item'); setupCategoryToggles();
            document.addEventListener('click', function(e) { if (gui && gui.style.display === 'block' && !gui.contains(e.target) && !alert.contains(e.target)) { gui.style.display = 'none'; } });
        }

        alert.onclick = function(event) {
            // debugLog(`Alert clicked. Items page: ${isItemsPage}, Faction armoury boosters page: ${isFactionArmouryBoostersPage}, Using faction boosters: ${useFactionBoosters}`);
            event.stopPropagation();
            const currentGui = document.getElementById('boosterGui');
            if ((isItemsPage && !useFactionBoosters) || (isFactionArmouryBoostersPage && useFactionBoosters)) {
                if (currentGui) { currentGui.style.display = currentGui.style.display === 'block' ? 'none' : 'block'; void currentGui.offsetWidth; }
                else { debugLog("GUI not found on alert click, attempting to recreate."); alertElements = createAlert(); if (alertElements && alertElements.gui) alertElements.gui.style.display = 'block'; }
            } else {
                const targetUrl = useFactionBoosters ? 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=boosters' : 'https://www.torn.com/item.php';
                sessionStorage.setItem('fromBoosterAlert', 'true'); showNotification(`Navigating to ${useFactionBoosters ? 'faction armoury' : 'items'} page...`, 'info'); window.location.href = targetUrl;
            }
            return false;
        };
        return { alert, gui };
     }

    function populateBoosterList(container, boosters, className) {
        container.innerHTML = ''; boosters.forEach(booster => { const item = document.createElement('div'); item.className = `booster-item ${className}`; item.setAttribute('data-name', booster.name); item.setAttribute('data-id', booster.id); item.textContent = booster.effect ? `${booster.name} (${booster.effect})` : booster.name; item.onclick = () => { useBooster(booster.id, booster.name); const g = document.getElementById('boosterGui'); if (g) g.style.display = 'none'; }; container.appendChild(item); });
    }
    // --- End Main Alert & GUI ---


    // --- Cooperative Positioning Function ---
    function adjustBoosterQuickUsePosition() {
        const boosterPanel = document.querySelector('.booster-quick-use-container');
        if (!boosterPanel) { return; }

        // Find potential drug panel (any .quick-use-container that isn't ours)
        const allQuickUsePanels = document.querySelectorAll('.quick-use-container');
        let drugPanel = null;
        for (const panel of allQuickUsePanels) { if (!panel.classList.contains('booster-quick-use-container')) { drugPanel = panel; break; } }

        const isBoosterMinimized = localStorage.getItem('boosterAlertMinimized') === 'true';
        let targetTop = '100px'; // Default expanded top
        let targetMinimizedTop = '110px'; // Default minimized top
        const fixedOffsetTop = '250px'; // Fallback offset
        const fixedOffsetMinimizedTop = '260px';

        if (drugPanel) { // Check if drug panel element exists in the DOM first
            // debugLog('Adjusting position based on detected Drug panel.');
            try {
                // Check computed style first for visibility
                const drugPanelStyle = window.getComputedStyle(drugPanel);
                const isDrugPanelVisible = drugPanelStyle.display !== 'none' && drugPanelStyle.visibility !== 'hidden';

                if (isDrugPanelVisible) {
                    // Attempt to get geometry if visibly styled
                    const drugPanelRect = drugPanel.getBoundingClientRect();
                    // Check if geometry is valid (has height and a valid bottom position)
                    if (drugPanelRect.height > 0 && drugPanelRect.bottom > 0) {
                        targetTop = `${drugPanelRect.bottom + 15}px`; // Position below drug panel + margin
                        targetMinimizedTop = `${drugPanelRect.bottom + 5}px`; // Position slightly below drug panel bottom when booster is minimized
                        // debugLog(`Drug panel rendered (bottom: ${drugPanelRect.bottom}px). New targetTop: ${targetTop}, targetMinimizedTop: ${targetMinimizedTop}`);
                    } else {
                        // If visible styled but rect invalid/zero height, use fixed offset
                        // debugLog('Drug panel visible but rect invalid, using fixed offset.');
                        targetTop = fixedOffsetTop; targetMinimizedTop = fixedOffsetMinimizedTop;
                    }
                } else {
                     // If element exists but is hidden via computed style, use fixed offset
                     // debugLog('Drug panel detected but hidden via style, using fixed offset.');
                     targetTop = fixedOffsetTop; targetMinimizedTop = fixedOffsetMinimizedTop;
                }
            } catch (e) {
                // debugLog('Error getting drug panel dimensions/style, using fixed offset.', e);
                targetTop = fixedOffsetTop; targetMinimizedTop = fixedOffsetMinimizedTop;
            }
        } else {
             // debugLog('Drug panel not detected, using default positions.');
        }

        const finalTop = isBoosterMinimized ? targetMinimizedTop : targetTop;
        if (boosterPanel.style.top !== finalTop) {
             boosterPanel.style.top = finalTop;
             // debugLog(`Applied top: ${boosterPanel.style.top} (Booster minimized: ${isBoosterMinimized})`);
        }
    }
    // --- End Cooperative Positioning ---


    // --- Quick Use Functions ---
    function addBoosterQuickUseButtons() {
        // Only show on relevant pages
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryBoostersPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && (window.location.href.includes('sub=boosters') || window.location.href.includes('tab=armoury'));
        const existingContainer = document.querySelector('.booster-quick-use-container'); if (existingContainer) { existingContainer.remove(); } // Clean up previous instance
        if (!isItemsPage && !isFactionArmouryBoostersPage) { /*debugLog('Not on Items or Faction Boosters page, Quick Use UI will not be shown.');*/ return; }

        // debugLog('On valid page, creating Quick Use UI.');
        const quickUseContainer = document.createElement('div'); quickUseContainer.className = 'booster-quick-use-container';
        const savedQuickUseBoosters = localStorage.getItem('customQuickUseBoosters'); let quickUseBoosters = []; const defaultQuickBoosters = [ { id: 532, name: "Can of Red Cow" }, { id: 533, name: "Can of Taurine Elite" }, { id: 530, name: "Can of Munster" } ];
        if (savedQuickUseBoosters) { try { quickUseBoosters = JSON.parse(savedQuickUseBoosters); quickUseBoosters.forEach(b => { if (!b.color) b.color = getDefaultBoosterColor(b.id); }); } catch (e) { console.error("Booster Alerts: Error parsing saved quick use boosters", e); quickUseBoosters = defaultQuickBoosters.map(b => ({ ...b, color: getDefaultBoosterColor(b.id) })); localStorage.setItem('customQuickUseBoosters', JSON.stringify(quickUseBoosters)); } } else { quickUseBoosters = defaultQuickBoosters.map(b => ({ ...b, color: getDefaultBoosterColor(b.id) })); localStorage.setItem('customQuickUseBoosters', JSON.stringify(quickUseBoosters)); }
        const boosterButtons = []; quickUseBoosters.forEach(booster => { const btn = document.createElement('div'); btn.textContent = booster.name; btn.className = 'booster-quick-button'; const bgColor = booster.color || getDefaultBoosterColor(booster.id); btn.style.backgroundColor = bgColor; btn.style.color = getTextColorForBackground(bgColor); btn.addEventListener('click', () => useBooster(booster.id, booster.name)); boosterButtons.push(btn); quickUseContainer.appendChild(btn); });
        const settingsButton = document.createElement('div'); settingsButton.textContent = '⚙️ Edit'; settingsButton.className = 'booster-settings-button'; settingsButton.addEventListener('click', () => showBoosterCustomizationUI(quickUseBoosters)); quickUseContainer.appendChild(settingsButton);
        const toggleButton = document.createElement('button'); toggleButton.className = 'booster-quick-use-toggle-button'; let isMinimized = localStorage.getItem('boosterAlertMinimized') === 'true';
        function applyMinimizedState() { const currentContainer = document.querySelector('.booster-quick-use-container'); if (!currentContainer) return; boosterButtons.forEach(btn => { btn.style.display = isMinimized ? 'none' : 'block'; }); settingsButton.style.display = isMinimized ? 'none' : 'block'; currentContainer.style.padding = isMinimized ? '2px' : '10px'; toggleButton.textContent = isMinimized ? '+' : 'X'; adjustBoosterQuickUsePosition(); }
        toggleButton.addEventListener('click', () => { isMinimized = !isMinimized; localStorage.setItem('boosterAlertMinimized', isMinimized.toString()); applyMinimizedState(); });
        quickUseContainer.appendChild(toggleButton); document.body.appendChild(quickUseContainer);
        // Set initial visual state, position relies on later adjustment calls
        boosterButtons.forEach(btn => { btn.style.display = isMinimized ? 'none' : 'block'; }); settingsButton.style.display = isMinimized ? 'none' : 'block'; quickUseContainer.style.padding = isMinimized ? '2px' : '10px'; toggleButton.textContent = isMinimized ? '+' : 'X';
     }
    function showBoosterCustomizationUI(currentBoosters) {
        let justOpened = true; setTimeout(() => { justOpened = false; }, 300);
        const existingUI = document.getElementById('booster-customization-ui'); if (existingUI) existingUI.remove();
        const customizationUI = document.createElement('div'); customizationUI.id = 'booster-customization-ui';
        customizationUI.innerHTML = `<h3>Customize Quick Use Boosters</h3><p>Select boosters to show. Drag ≡ to reorder. Click color swatch to customize.</p><div class="booster-selection-area"></div><button class="booster-customization-button add">+ Add More Boosters</button><div class="booster-customization-button-container"><button class="booster-customization-button save">Save Changes</button><button class="booster-customization-button cancel">Cancel</button></div>`;
        const boosterSelectionArea = customizationUI.querySelector('.booster-selection-area');
        const selectedBoosters = JSON.parse(JSON.stringify(currentBoosters)).map(b => ({ ...b, color: b.color || getDefaultBoosterColor(b.id) }));
        function createColorPicker(booster) { const c = document.createElement('input'); c.type = 'color'; c.value = booster.color || getDefaultBoosterColor(booster.id); c.addEventListener('input', (e) => { booster.color = e.target.value; }); return c; }
        function renderBoosterItem(booster) { const i = document.createElement('div'); i.className = 'booster-selection-item'; i.setAttribute('data-booster-id', booster.id); i.setAttribute('draggable', 'true'); const h = document.createElement('span'); h.innerHTML = '≡'; i.appendChild(h); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; cb.addEventListener('change', () => { i.style.opacity = cb.checked ? '1' : '0.5'; i.style.textDecoration = cb.checked ? 'none' : 'line-through'; if (!cb.checked) i.setAttribute('data-remove', 'true'); else i.removeAttribute('data-remove'); }); i.appendChild(cb); const n = document.createElement('span'); n.textContent = booster.name; i.appendChild(n); const cp = createColorPicker(booster); i.appendChild(cp); boosterSelectionArea.appendChild(i); i.addEventListener('dragstart', handleDragStart); i.addEventListener('dragover', handleDragOver); i.addEventListener('drop', handleDrop); i.addEventListener('dragend', handleDragEnd); }
        selectedBoosters.forEach(renderBoosterItem);
        let draggedItem = null; function handleDragStart(e) { draggedItem = e.target.closest('.booster-selection-item'); if (!draggedItem) return; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', draggedItem.dataset.boosterId); setTimeout(() => { if (draggedItem) draggedItem.style.opacity = '0.5'; }, 0); } function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const t = e.target.closest('.booster-selection-item'); if (t && t !== draggedItem) { const r = t.getBoundingClientRect(); const o = e.clientY - r.top; if (o < r.height / 2) boosterSelectionArea.insertBefore(draggedItem, t); else boosterSelectionArea.insertBefore(draggedItem, t.nextSibling); } } function handleDrop(e) { e.preventDefault(); } function handleDragEnd() { if (draggedItem) { draggedItem.style.opacity = '1'; } draggedItem = null; const items = Array.from(boosterSelectionArea.querySelectorAll('.booster-selection-item')); const reordered = []; items.forEach(item => { const id = parseInt(item.dataset.boosterId); const data = selectedBoosters.find(b => b.id === id); if (data) { const cp = item.querySelector('input[type="color"]'); if (cp) data.color = cp.value; reordered.push(data); } }); selectedBoosters.length = 0; selectedBoosters.push(...reordered); }
        customizationUI.querySelector('.booster-customization-button.add').addEventListener('click', () => { showAddBoostersUI(selectedBoosters, boosterSelectionArea, renderBoosterItem); });
        customizationUI.querySelector('.booster-customization-button.save').addEventListener('click', () => { const final = selectedBoosters.filter(b => { const i = boosterSelectionArea.querySelector(`.booster-selection-item[data-booster-id="${b.id}"]`); return i && !i.hasAttribute('data-remove'); }).map(b => { const i = boosterSelectionArea.querySelector(`.booster-selection-item[data-booster-id="${b.id}"]`); const cp = i ? i.querySelector('input[type="color"]') : null; return { id: b.id, name: b.name, color: cp ? cp.value : b.color }; }); localStorage.setItem('customQuickUseBoosters', JSON.stringify(final)); customizationUI.remove(); addBoosterQuickUseButtons(); showNotification('Quick use boosters updated!', 'success'); });
        customizationUI.querySelector('.booster-customization-button.cancel').addEventListener('click', () => { customizationUI.remove(); });
        document.body.appendChild(customizationUI);
        function closeOnClickOutside(e) { if (justOpened) return; const isSettings = e.target.closest('.booster-settings-button'); const isAddUI = e.target.closest('#add-boosters-ui'); if (customizationUI && !customizationUI.contains(e.target) && !isSettings && !isAddUI) { customizationUI.remove(); document.removeEventListener('click', closeOnClickOutside); } }
        setTimeout(() => { document.addEventListener('click', closeOnClickOutside); }, 100);
    }
    function showAddBoostersUI(selectedBoostersRef, parentBoosterSelectionArea, renderBoosterItemFn) {
        const existingAddUI = document.getElementById('add-boosters-ui'); if (existingAddUI) existingAddUI.remove();
        const addUI = document.createElement('div'); addUI.id = 'add-boosters-ui'; addUI.innerHTML = `<h3>Add Boosters to Quick Use</h3><input type="text" placeholder="Search all boosters..."><div class="add-booster-list-container"></div><div class="add-boosters-button-container"><button class="add-boosters-done-button">Done</button></div>`;
        const searchBox = addUI.querySelector('input[type="text"]'); const listContainer = addUI.querySelector('.add-booster-list-container');
        function refreshList(term = '') { listContainer.innerHTML = ''; const filtered = allBoostersFlat.filter(b => b.name.toLowerCase().includes(term.toLowerCase())); if (filtered.length === 0) { listContainer.innerHTML = '<div style="padding: 10px; color: #aaa;">No boosters found</div>'; return; } filtered.forEach(b => { const pItem = parentBoosterSelectionArea.querySelector(`.booster-selection-item[data-booster-id="${b.id}"]`); const isSel = pItem && !pItem.hasAttribute('data-remove'); const item = document.createElement('div'); item.className = `add-booster-item ${isSel ? 'selected' : ''}`; const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = isSel; const name = document.createElement('span'); name.textContent = b.name; item.appendChild(cb); item.appendChild(name); const handleClick = () => { const pOnClick = parentBoosterSelectionArea.querySelector(`.booster-selection-item[data-booster-id="${b.id}"]`); const currentSel = pOnClick && !pOnClick.hasAttribute('data-remove'); cb.checked = !currentSel; if (!currentSel) { if (pOnClick) { pOnClick.style.opacity = '1'; pOnClick.style.textDecoration = 'none'; pOnClick.removeAttribute('data-remove'); const pCb = pOnClick.querySelector('input[type="checkbox"]'); if(pCb) pCb.checked = true; if (!selectedBoostersRef.some(r => r.id === b.id)) { selectedBoostersRef.push({ ...b, color: pOnClick.querySelector('input[type="color"]').value || getDefaultBoosterColor(b.id) }); } } else { const newData = { ...b, color: getDefaultBoosterColor(b.id) }; renderBoosterItemFn(newData); selectedBoostersRef.push(newData); } item.classList.add('selected'); } else { if (pOnClick) { pOnClick.style.opacity = '0.5'; pOnClick.style.textDecoration = 'line-through'; pOnClick.setAttribute('data-remove', 'true'); const pCb = pOnClick.querySelector('input[type="checkbox"]'); if(pCb) pCb.checked = false; } item.classList.remove('selected'); } }; item.addEventListener('click', handleClick); listContainer.appendChild(item); }); }
        refreshList(); searchBox.addEventListener('input', () => { refreshList(searchBox.value); });
        addUI.querySelector('.add-boosters-done-button').addEventListener('click', () => { addUI.remove(); }); document.body.appendChild(addUI); addUI.addEventListener('click', e => { e.stopPropagation(); });
    }
    // --- End Quick Use Functions ---


    // --- Core Logic (useBooster, XHR requests, cooldown checks, etc.) ---
    // ... (Functions remain largely unchanged) ...
    function useBooster(id, name) { /*debugLog(`Attempting to use booster: ${name} (ID: ${id}), Using faction boosters: ${useFactionBoosters}`);*/ showNotification(`Using ${name}...`, 'info'); const gui = document.getElementById('boosterGui'); if (gui) gui.style.display = 'none'; if (useFactionBoosters) tryFactionBoosterUseMethod(id, name); else tryDirectUseMethod(id, name); }
    function tryDirectUseMethod(id, name) { /*debugLog('Attempting direct use method');*/ sessionStorage.setItem('boosterUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'direct' })); useItemDirectly(id, name); }
    function useItemDirectly(id, name) { /*debugLog(`Using item directly: ${name} (ID: ${id})`);*/ const token = getNSTStyleToken() || getPageCsrfToken(); if (token) { /*debugLog(`Using token: ${token.substring(0, 4)}...`);*/ submitBoosterUseRequest(id, name, token); } else { console.error('BoosterAlerts: Failed to get token'); showNotification(`Unable to use ${name}: Could not get token`, 'error'); sessionStorage.removeItem('boosterUseInProgress'); } }
    function tryFactionBoosterUseMethod(id, name) { /*debugLog(`Attempting faction booster use: ${name} (ID: ${id})`);*/ sessionStorage.setItem('boosterUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'faction' })); const isFacBoostersPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && (window.location.href.includes('sub=boosters') || window.location.href.includes('tab=armoury')); if (!isFacBoostersPage) { sessionStorage.setItem('pendingFactionBoosterUse', JSON.stringify({ id, name })); window.location.href = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=boosters'; return; } const token = getNSTStyleToken() || getPageCsrfToken(); if (!token) { console.error('BoosterAlerts: No CSRF token for faction booster'); showNotification('Unable to use faction booster: No token', 'error'); sessionStorage.removeItem('boosterUseInProgress'); return; } /*debugLog(`Using token for faction booster: ${token.substring(0, 4)}...`);*/ tryBothFactionBoosterMethods(id, name, token); }
    function tryBothFactionBoosterMethods(id, name, token) { /*debugLog('Trying direct faction method first (item.php?fac=1)');*/ useFactionBoosterById(id, name, token); setTimeout(() => { if (sessionStorage.getItem('boosterUseInProgress')) { /*debugLog('Direct faction method failed/slow, trying traditional');*/ useFactionBoosterDirectly(id, name); } }, 2000); }
    function useFactionBoosterById(id, name, token) { /*debugLog(`Directly using faction booster via item.php?fac=1: ${id}`);*/ const params = new URLSearchParams({ step: 'useItem', confirm: 'yes', itemID: id, fac: '1', csrf: token }); const xhr = new XMLHttpRequest(); xhr.open('POST', 'https://www.torn.com/item.php', true); xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.onload = function() { handleBoosterResponse(this, name, 'faction_direct', true); }; xhr.onerror = function() { /*debugLog('Direct faction (item.php) network error');*/ }; xhr.send(params.toString()); }
    function useFactionBoosterDirectly(id, name) { /*debugLog(`Using traditional faction booster method: ${name} (ID: ${id})`);*/ const token = getNSTStyleToken() || getPageCsrfToken(); if (!token) { console.error('BoosterAlerts: No token for traditional faction method'); showNotification('Unable to use faction booster: No token (retry)', 'error'); sessionStorage.removeItem('boosterUseInProgress'); return; } useFactionBoosterWithToken(id, name, token); }
    function useFactionBoosterWithToken(id, name, token) { let armouryItemID = findArmouryItemId(id, name, 'boosters'); if (!armouryItemID) { /*debugLog(`Could not find armouryItemID for ${name}, using original ID ${id} as fallback.`);*/ armouryItemID = id; } /*debugLog(`Using faction booster (traditional) with armouryItemID: ${armouryItemID}`);*/ const params = new URLSearchParams({ step: 'armoryItemAction', confirm: 'yes', armoryItemID, action: 'use', csrf: token }); const xhr = new XMLHttpRequest(); xhr.open('POST', 'https://www.torn.com/factions.php', true); xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.onload = function() { handleBoosterResponse(this, name, 'faction_traditional'); }; xhr.onerror = function() { /*debugLog('Traditional faction network error');*/ showNotification(`Error using ${name}: Network error`, 'error'); sessionStorage.removeItem('boosterUseInProgress'); }; xhr.send(params.toString()); }
    function findArmouryItemId(itemId, itemName, itemType = 'boosters') { const selector = `#armoury-${itemType} ul.item-list li, #faction-armoury .${itemType}-wrap .item, div[class*="armory"] div[class*="${itemType}"] div[class*="item"]`; const items = document.querySelectorAll(selector); for (const item of items) { const nameElements = item.querySelectorAll('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"], [class*="title"]'); let foundName = Array.from(nameElements).some(el => el && el.textContent.trim().toLowerCase() === itemName.toLowerCase()); if (foundName) { const actionLinks = item.querySelectorAll('a[href*="armoryItemID="], button[data-id], a[onclick*="armoryItemAction"], div[data-id]'); for (const actionLink of actionLinks) { let match = null; if (actionLink.href) match = actionLink.href.match(/armoryItemID=(\d+)/); else if (actionLink.dataset && actionLink.dataset.id) match = [null, actionLink.dataset.id]; else if (actionLink.onclick) match = actionLink.onclick.toString().match(/armoryItemAction\((\d+)/); if (match && match[1]) return match[1]; } if (item.dataset && item.dataset.id) return item.dataset.id; if (item.getAttribute('data-armoryitemid')) return item.getAttribute('data-armoryitemid'); } } return null; }
    function submitBoosterUseRequest(id, name, token) { const params = new URLSearchParams({ step: 'useItem', confirm: 'yes', itemID: id, csrf: token }); const xhr = new XMLHttpRequest(); xhr.open('POST', 'https://www.torn.com/item.php', true); xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.onload = function() { handleBoosterResponse(this, name, 'personal'); }; xhr.onerror = function() { /*debugLog('Personal booster network error');*/ showNotification(`Error using ${name}: Network error`, 'error'); sessionStorage.removeItem('boosterUseInProgress'); }; xhr.send(params.toString()); }
    function handleBoosterResponse(xhr, name, method, maybeClearProgress = false) { let success = false; let cooldown = false; let message = `Error using ${name}: Unknown response`; let isJson = false; let responseData = null; if (xhr.status === 200) { try { responseData = JSON.parse(xhr.responseText); isJson = true; /*debugLog(`[${method}] JSON Response:`, responseData);*/ const responseText = responseData.text || responseData.message || ''; if (responseData.success || (responseText && (responseText.includes('consumed') || responseText.includes('used')))) { success = true; message = `Used ${name} successfully!`; } else if (responseText && (responseText.includes('cooldown') || responseText.includes('effect of a booster') || responseText.includes('wait'))) { cooldown = true; message = extractCooldownMessage(responseText, 'Booster') || 'You are on booster cooldown'; } else { const tempDiv = document.createElement('div'); tempDiv.innerHTML = responseText || responseData.error || ''; message = `Error: ${(tempDiv.textContent || tempDiv.innerText || 'Unknown error').trim()}`; } } catch (e) { /*debugLog(`[${method}] Text Response:`, xhr.responseText.substring(0, 150));*/ const responseText = xhr.responseText || ''; if (responseText.includes('success') || responseText.includes('consumed') || responseText.includes('used')) { success = true; message = `Used ${name} successfully!`; } else if (responseText.includes('cooldown') || responseText.includes('effect of a booster') || responseText.includes('wait')) { cooldown = true; message = extractCooldownMessage(responseText, 'Booster') || 'You are on booster cooldown'; } else { const errorMatch = responseText.match(/<[^>]*class=['"]error['"][^>]*>(.*?)<\/|Validation failed|Error:|not authorized/i); if (errorMatch) { message = `Error: ${errorMatch[1] || 'Validation failed'}`; } else { message = `Error using ${name}: Unexpected response`; } } } } else { message = `Error using ${name}: Request failed (${xhr.status})`; } showNotification(message, success ? 'success' : (cooldown ? 'info' : 'error')); if (success || cooldown || method === 'faction_traditional' || method === 'personal') { sessionStorage.removeItem('boosterUseInProgress'); } else if (maybeClearProgress && (success || cooldown)) { sessionStorage.removeItem('boosterUseInProgress'); } if (success || cooldown) { setTimeout(startCooldownChecks, 500); } }
    function extractCooldownMessage(responseText, type = 'Booster') { if (!responseText) return null; const timeMatch = responseText.match(/data-time=["']?(\d+)["']?/); const timeMatch2 = responseText.match(/wait\s+(\d+)\s*m\s+(\d+)\s*s/i); const timeMatch3 = responseText.match(/wait\s+(\d+)\s+seconds?/i); const timeMatch4 = responseText.match(/wait\s+(\d+)\s+minutes?/i); let seconds = 0; if (timeMatch && timeMatch[1]) seconds = parseInt(timeMatch[1]); else if (timeMatch2 && timeMatch2[1] && timeMatch2[2]) seconds = parseInt(timeMatch2[1]) * 60 + parseInt(timeMatch2[2]); else if (timeMatch3 && timeMatch3[1]) seconds = parseInt(timeMatch3[1]); else if (timeMatch4 && timeMatch4[1]) seconds = parseInt(timeMatch4[1]) * 60; if (seconds > 0) { const minutes = Math.floor(seconds / 60); const remainingSeconds = seconds % 60; return `${type} Cooldown: ${minutes}m ${remainingSeconds}s remaining`; } else { try { const tempDiv = document.createElement('div'); tempDiv.innerHTML = responseText; const msgEl = tempDiv.querySelector('.message, .msg, .cont_gray'); let txt = (msgEl ? (msgEl.textContent || msgEl.innerText) : (tempDiv.textContent || tempDiv.innerText || '')).trim(); if (txt.length > 100) txt = txt.substring(0, 100) + '...'; if (txt) return txt; } catch(e) {} } return null; }
    function showNotification(message, type = 'info') { document.querySelectorAll('.booster-notification').forEach(note => note.remove()); const n = document.createElement('div'); n.className = `booster-notification ${type}`; let clean = message; if (typeof message === 'string' && message.includes('<') && message.includes('>')) { try { const d = document.createElement('div'); d.innerHTML = message; clean = d.textContent || d.innerText || message; } catch (e) {} } clean = clean.replace(/\s+/g, ' ').trim(); if (clean.toLowerCase().includes('cooldown')) { n.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">${type === 'Booster' ? 'Booster' : 'Drug'} Cooldown Active</div><div>${clean}</div>`; n.style.minWidth = '280px'; n.style.padding = '15px 25px'; } else { n.textContent = clean; } document.body.appendChild(n); n.style.transform = 'translate(-50%, -50%) scale(0.9)'; n.style.opacity = '0'; void n.offsetWidth; requestAnimationFrame(() => { n.style.transform = 'translate(-50%, -50%) scale(1)'; n.style.opacity = '1'; }); const dur = (type === 'error' || type === 'info') ? 7000 : 4000; setTimeout(() => { requestAnimationFrame(() => { n.style.opacity = '0'; n.style.transform = 'translate(-50%, -50%) scale(0.9)'; }); n.addEventListener('transitionend', () => n.remove(), { once: true }); }, dur); /*debugLog(`Notification [${type}]: ${clean}`);*/ }
    function getNSTStyleToken() { try { const r = getRFC(); if (r) return r; } catch (e) {} return null; }
    function extractTokenFromPage() { try { if (typeof window.csrf !== 'undefined' && window.csrf && /^[a-f0-9]{16,}$/i.test(window.csrf)) return window.csrf; if (typeof window.csrf_token !== 'undefined' && window.csrf_token && /^[a-f0-9]{16,}$/i.test(window.csrf_token)) return window.csrf_token; if (typeof $ !== 'undefined' && typeof $.cookie === 'function') { const c = $.cookie('csrf'); if(c && /^[a-f0-9]{16,}$/i.test(c)) return c; } const inputs = document.querySelectorAll('input[name="csrf"], input[name="csrf_token"], input[id="csrf"], input[name="X-Csrf-Token"], input[data-csrf]'); for (const input of inputs) { const t = input.value || input.dataset?.csrf; if(t && /^[a-f0-9]{16,}$/i.test(t)) return t; } const patterns = [ /["']csrf["']\s*:\s*["']([a-f0-9]{16,})["']/, /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, /value=["']([a-f0-9]{16,})["']\s*name=["']csrf["']/ ]; const scripts = document.querySelectorAll('script:not([src])'); for (const script of scripts) { if (!script.textContent) continue; for (const p of patterns) { const m = script.textContent.match(p); if(m && m[1]) return m[1]; } } const meta = document.querySelector('meta[name="csrf-token"]'); if(meta && meta.content && /^[a-f0-9]{16,}$/i.test(meta.content)) return meta.content; } catch (e) {} /*debugLog('No CSRF token found in page');*/ return null; }
    function getPageCsrfToken() { return extractTokenFromPage(); }
    function getRFC() { if (typeof $ !== 'undefined' && typeof $.cookie === 'function') { const c = $.cookie('rfc_v'); if(c) return c; } try { const cs = document.cookie.split('; '); for (const c of cs) { const [n, v] = c.split('='); if(n === 'rfc_v') return v; } } catch (e) {} return null; }
    function hasBoosterCooldown() { /* ... function ... */
        // debugLog('Checking for booster cooldown...'); // Reduce noise
        const boosterCooldownElements = document.querySelectorAll('a[aria-label="Booster Cooldown"], [aria-label^="Booster Cooldown"]');
        if (boosterCooldownElements.length > 0) { for(const el of boosterCooldownElements) { if (el.offsetParent !== null) { /*debugLog('Cooldown detected: Visible aria-label');*/ return true; } } }
        const statusIcons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a, [class*="status-icon"], [class*="user-icon"]');
        for (const icon of statusIcons) { if (icon.offsetParent === null) continue; const ariaLabel = icon.getAttribute('aria-label') || ''; const title = icon.getAttribute('title') || ''; const dataContent = icon.getAttribute('data-content') || ''; const iconText = icon.textContent || ''; if (ariaLabel.includes('Booster Cooldown') || title.includes('Booster Cooldown') || dataContent.includes('Booster Cooldown') || iconText.includes('Booster Cooldown')) { /*debugLog('Cooldown detected: Text/Attribute phrase match');*/ return true; } if (icon.className && typeof icon.className === 'string' && icon.className.includes('booster-cooldown')) { /*debugLog('Cooldown detected: Specific class name');*/ return true; } }
        return false;
     }
    function checkForPendingAlert() { /* ... function ... */ try { const fromAlert = sessionStorage.getItem('fromBoosterAlert'); if (fromAlert) { sessionStorage.removeItem('fromBoosterAlert'); const isItemsPage = window.location.href.includes('torn.com/item.php'); const isFacBoostersPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && (window.location.href.includes('sub=boosters') || window.location.href.includes('tab=armoury')); const onCorrectPage = (isItemsPage && !useFactionBoosters) || (isFacBoostersPage && useFactionBoosters); if (onCorrectPage) { setTimeout(() => { if (!hasBoosterCooldown()) { if (!alertElements) alertElements = createAlert(); if (alertElements && alertElements.gui) alertElements.gui.style.display = 'block'; } }, 1500); } } const boosterProgress = sessionStorage.getItem('boosterUseInProgress'); if (boosterProgress) { try { const d = JSON.parse(boosterProgress); if (Date.now() - d.timestamp > 60000) sessionStorage.removeItem('boosterUseInProgress'); } catch(e) { sessionStorage.removeItem('boosterUseInProgress'); } } } catch (e) { /*debugLog('Error in checkForPendingAlert:', e);*/ sessionStorage.removeItem('boosterUseInProgress'); sessionStorage.removeItem('fromBoosterAlert'); } }
    function removeExistingAlertsAndGui() { // Leaves Quick Use Panel
        const alertBtn = document.querySelector('.booster-alert'); if (alertBtn) alertBtn.remove();
        const mainGui = document.getElementById('boosterGui'); if (mainGui) mainGui.remove();
        const custUi = document.getElementById('booster-customization-ui'); if (custUi) custUi.remove();
        const addUi = document.getElementById('add-boosters-ui'); if (addUi) addUi.remove();
        const notifications = document.querySelectorAll('.booster-notification'); notifications.forEach(n => n.remove());
        if (alertElements) alertElements = null; // Reset reference if it pointed to the removed elements
        // debugLog('Removed main booster alert/GUI and customization popups');
    }
    function startCooldownChecks() { /* ... function ... */
         if (cooldownCheckInterval) clearInterval(cooldownCheckInterval); if (cooldownObserver) cooldownObserver.disconnect();
         const checkCooldownLogic = () => {
            const hasCooldown = hasBoosterCooldown(); // Use refined function
            // debugLog(`Cooldown check: ${hasCooldown ? 'ON' : 'OFF'}`); // Reduce noise
            const currentAlert = document.querySelector('.booster-alert');

            if (!hasCooldown) {
                if (!currentAlert) {
                    // FIX from v1.1.7: Only call createAlert
                    alertElements = createAlert();
                    // debugLog('Created "No Boosters" alert');
                    checkForPendingAlert();
                }
            } else if (currentAlert) {
                 currentAlert.remove();
                 const mainGui = document.getElementById('boosterGui'); if (mainGui) mainGui.remove();
                 alertElements = null;
                 // debugLog('Removed "No Boosters" alert/GUI due to cooldown');
            }
         };
         setTimeout(checkCooldownLogic, 1500);
         cooldownObserver = new MutationObserver((mutations) => { const relevant = mutations.some(m => { const t = m.target; const nodes = [...Array.from(m.addedNodes), ...Array.from(m.removedNodes)]; const check = n => n.nodeType === 1 && ((n.className && typeof n.className === 'string' && n.className.includes('status-icon')) || (n.id && n.id.startsWith('icon')) || n.querySelector('[aria-label*="Cooldown"]')); return check(t) || nodes.some(check); }); if (relevant) { /*debugLog('Relevant DOM mutation, re-checking cooldown.');*/ checkCooldownLogic(); } });
         const target = document.querySelector('.status-icons__wrap, .user-icons__wrap, body'); if(target) cooldownObserver.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-label', 'title', 'style'] });
         cooldownCheckInterval = setInterval(checkCooldownLogic, 60000);
         // console.log('%c Booster Alerts Cooldown Checks Started ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    }
    function setupForumMutationObserver() { /* ... function ... */ if (!window.location.href.includes('torn.com/forums.php')) return; /*debugLog('Setting up forum mutation observer');*/ const forumContainer = document.getElementById('mainContainer') || document.body; const observer = new MutationObserver((mutations) => { const titleChanged = mutations.some(m => [...Array.from(m.addedNodes), ...Array.from(m.removedNodes)].some(n => n.nodeType === 1 && n.classList && n.classList.contains('content-title'))); if (titleChanged) { /*debugLog('Forum content title changed, re-evaluating alert placement');*/ setTimeout(startCooldownChecks, 750); } }); observer.observe(forumContainer, { childList: true, subtree: true, attributes: false }); /*debugLog('Forum mutation observer started');*/ }
    function checkPendingFactionBoosterUse() { /* ... function ... */ const pendingUseData = sessionStorage.getItem('pendingFactionBoosterUse'); if (pendingUseData) { try { const pendingUse = JSON.parse(pendingUseData); const isFacBoostersPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && (window.location.href.includes('sub=boosters') || window.location.href.includes('tab=armoury')); if (isFacBoostersPage && pendingUse.id && pendingUse.name) { /*debugLog(`Processing pending faction booster use: ${pendingUse.name}`);*/ sessionStorage.removeItem('pendingFactionBoosterUse'); setTimeout(() => { useBooster(pendingUse.id, pendingUse.name); }, 1500); } else if (!isFacBoostersPage) { /*debugLog('Still not on faction boosters page, keeping pending use data');*/ } else { /*debugLog('Clearing invalid pending faction booster use data');*/ sessionStorage.removeItem('pendingFactionBoosterUse'); } } catch (e) { /*debugLog('Error processing pending faction booster use:', e);*/ sessionStorage.removeItem('pendingFactionBoosterUse'); } } }
    // --- End Core Logic ---

    // --- Initialization ---
    function initialize() {
        // debugLog('Initializing Booster Alerts with Quick Use & Cooperative Positioning');
        useFactionBoosters = localStorage.getItem('useFactionBoosters') === 'true';
        // Initial cleanup removes main alert/GUI and customization popups, leaves quick use panel if it exists
         document.querySelectorAll('.booster-alert, .booster-gui, #booster-customization-ui, #add-boosters-ui, .booster-notification')
            .forEach(el => el.remove());
        alertElements = null;
        if (coopObserver) coopObserver.disconnect(); // Disconnect previous observer if re-initializing
        if (coopAdjustInterval) clearInterval(coopAdjustInterval); // Clear previous interval

        checkPendingFactionBoosterUse(); // Check before starting cooldown checks
        addBoosterQuickUseButtons(); // Add the quick use panel (includes initial position check)

        // Setup MutationObserver for cooperative positioning
        coopObserver = new MutationObserver((mutations) => {
            // Check if the mutation involves the drug panel class or its direct parent changing
            const drugPanelChanged = mutations.some(mutation => {
                 // More robust check: See if *any* added/removed node *is* or *contains* a potential drug panel
                 const checkNode = (node) => node && node.nodeType === 1 && (
                     (node.classList && node.classList.contains('quick-use-container') && !node.classList.contains('booster-quick-use-container')) || // Node is the drug panel
                     node.querySelector('.quick-use-container:not(.booster-quick-use-container)') // Node contains the drug panel
                 );
                 const targetIsRelevant = checkNode(mutation.target); // Check if the target itself changed relevantly
                 const added = Array.from(mutation.addedNodes).some(checkNode);
                 const removed = Array.from(mutation.removedNodes).some(checkNode);
                 return targetIsRelevant || added || removed;
            });

            if (drugPanelChanged) {
                // debugLog('Drug panel added, removed, or changed. Re-adjusting booster panel position.');
                adjustBoosterQuickUsePosition();
            }
        });
        // Observe body more broadly for additions/removals and attribute changes
        coopObserver.observe(document.body, {
            childList: true,
            subtree: true, // Crucial to catch nested changes or late additions
            attributes: true,
            attributeFilter: ['style', 'class'] // Watch for style changes (like display) or class changes
        });

        startCooldownChecks(); // Start monitoring cooldown status (will create alert if needed)
        setupForumMutationObserver();

        // Fallback: Repeatedly check position for a few seconds after load
        let adjustAttempts = 0;
        const maxAdjustAttempts = 15; // Try for 15 seconds
        setTimeout(() => {
            // debugLog('Starting periodic position adjustment checks...');
            coopAdjustInterval = setInterval(() => {
                adjustBoosterQuickUsePosition();
                adjustAttempts++;
                if (adjustAttempts >= maxAdjustAttempts) {
                    clearInterval(coopAdjustInterval);
                    // debugLog('Finished periodic position adjustment checks.');
                }
            }, 1000); // Check every second
        }, 3000); // Start checks 3 seconds after initialization

        // Final check on window load
        window.addEventListener('load', () => {
             // debugLog('Window load event: Running final position adjustment.');
             setTimeout(adjustBoosterQuickUsePosition, 500); // Delay slightly after load
        });
    }

    // Start the script execution
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize(); // DOM is already ready
    }

})();
