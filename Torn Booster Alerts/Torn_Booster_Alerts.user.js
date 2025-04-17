// ==UserScript==
// @name           Torn Booster Alert
// @namespace      Torn_Booster_Alerts_GNSC4
// @version        1.6.11
// @description    Alerts when no booster cooldown is active, adds Quick Use panel with item counts , and allows customization. Includes faction armoury support. Now handles timer cooldown messages correctly.
// @author         GNSC4 [268863]
// @match          https://www.torn.com/*
// @grant          GM_addStyle
// @grant          GM_info
// @require        https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js
// @icon           https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @updateURL      https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Booster%20Alerts/Torn_Booster_Alerts.user.js
// @downloadURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Booster%20Alerts/Torn_Booster_Alerts.user.js
// ==/UserScript==

// VERY EARLY LOG: Check if script file is loaded at all
// console.log('[BoosterAlert Script] File loading...');

(function() {
    'use strict';
    // VERY EARLY LOG INSIDE IIFE: Check if IIFE starts
    // console.log('[BoosterAlert Script] IIFE executing...');


    // Check if we're on an attack page and exit early if true
     // Log URL before checking
     // console.log('[BoosterAlert Script] Current URL:', window.location.href);
     if (window.location.href.includes('sid=getInAttack') || 
     window.location.href.includes('sid=attack') || 
     window.location.href.includes('loader2.php') ||
     window.location.href.includes('sid=travel') ||
     window.location.pathname.includes('loader2.php')) {
          console.log('[BoosterAlert Script] Exiting: Detected Attack/Travel page.');
        return;
    }
     // console.log('[BoosterAlert Script] Passed attack page check.');


    // --- Configuration ---
    // Set true to enable detailed console logs for debugging counts and other actions
    let DEBUG_MODE = false;
    const SCRIPT_VERSION = GM_info.script.version || '1.6.10'; // Get version from metadata
    const SESSION_STORAGE_KEY = 'boosterAlerts_KnownCounts'; // Key for storing counts across tabs
    const TAB_SWITCH_RESCAN_DELAY = 750; // ms delay after tab click before rescanning items
    const CONTAINER_WAIT_TIMEOUT = 20000; // Max time (ms) to wait for main item container structure to appear
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
    let boosterCounts = {}; // Stores { boosterId: count } - Now loaded/merged from sessionStorage
    let panelBuilt = false; // Flag to prevent multiple builds during a single init cycle
    let itemListObserver = null; // Observer for item list population (used for initial load AND tab switches)
    let navigationObserver = null; // Observer for URL/Hash changes
    let isInitialLoad = true; // Flag to differentiate initial load from navigation
    let notificationTimers = {}; // Store interval IDs for notification timers
    let tabScanTimeout = null; // Timeout for the tab switch observer fallback
    let waitForContainerObserver = null; // Observer for the main item container itself
    let waitForContainerTimeout = null; // Timeout for waiting for container
    // --- End Global State ---

    // --- Helper Functions ---
    function debugLog(...args) { if (DEBUG_MODE) { console.log('[BoosterAlerts Debug]', ...args); } }

    function getBoosterCategory(id) {
        id = parseInt(id); // Ensure ID is number
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
            const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
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
        if (!header || !header.appendChild) {
            console.error("BoosterAlerts: Invalid header element provided for positioning.", header);
            header = createFixedHeader(); // Attempt to fallback
        }
        try {
            if (window.location.href.includes('torn.com/forums.php')) {
                debugLog('Positioning alert for forum page');
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
        } catch (e) {
             console.error("BoosterAlerts: Error positioning alert button.", e, "Header:", header, "Alert:", alert);
             // Attempt to append to body as last resort
             if (alert && !alert.parentElement) {
                 document.body.appendChild(alert);
                 alert.style.position = 'fixed';
                 alert.style.top = '60px';
                 alert.style.right = '30px';
                 alert.style.zIndex = '10000';
             }
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
        /* REMOVED .settings-section styles */
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
        .happy-item { border-left: 3px solid #FFEB3B; color: white; /* Ensure contrast */ }
        .stat-item { border-left: 3px solid #2196F3; }
        .booster-item:hover { background-color: #444; }
        .booster-notification { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 15px 20px; border-radius: 5px; color: white; z-index: 999999; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4); opacity: 1; transition: opacity 0.5s, transform 0.3s ease-out; text-align: center; min-width: 250px; max-width: 80%; pointer-events: none; }
        .booster-notification.success { background-color: rgba(76, 175, 80, 0.9); border: 1px solid #4CAF50; }
        .booster-notification.error { background-color: rgba(244, 67, 54, 0.9); border: 1px solid #f44336; }
        .booster-notification.info { background-color: rgba(33, 150, 243, 0.9); border: 1px solid #2196F3; }
        /* Style for the timer span inside notification */
        .booster-notification .counter-wrap { font-weight: bold; /* Example style */ }

        /* --- Quick Use Styles (Booster Specific) --- */
        .booster-quick-use-container { position: fixed; right: 20px; background-color: rgba(34, 34, 34, 0.85); padding: 10px; border-radius: 5px; z-index: 9998; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: top 0.3s ease, padding 0.3s ease; border: 1px solid #555; max-width: 180px; }
        .booster-quick-button {
            /* color set dynamically */
            border: 1px solid #555;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
            margin-bottom: 5px;
            text-align: left; /* Align text left */
            transition: background-color 0.2s, filter 0.2s;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex; /* Use flex for name and count */
            justify-content: space-between; /* Space out name and count */
            align-items: center;
        }
        .booster-quick-button-name { /* NEW: Span for the name */
             overflow: hidden;
             text-overflow: ellipsis;
             white-space: nowrap;
             flex-grow: 1; /* Allow name to take space */
             margin-right: 5px; /* Space before count */
        }
        .booster-quick-button-count { /* NEW: Span for the count */
            font-size: 11px;
            font-weight: normal;
            background-color: rgba(0, 0, 0, 0.2);
            padding: 1px 4px;
            border-radius: 2px;
            margin-left: 5px;
            flex-shrink: 0; /* Prevent count from shrinking */
            min-width: 18px; /* Ensure space for 'x##' */
            text-align: right;
        }
        .booster-quick-button:hover { filter: brightness(1.2); }
        .booster-settings-button { background-color: #555; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: bold; /* Removed margin-top */ text-align: center; font-size: 12px; transition: background-color 0.2s; }
        .booster-settings-button:hover { background-color: #666; }
        .booster-quick-use-toggle-button { position: absolute; top: -8px; right: -8px; background-color: #2196F3; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.5); z-index: 1; }

        /* *** UPDATED: Styles for Faction Toggle SLIDER in Quick Use Panel *** */
        .quick-use-faction-toggle-container { /* Wrapper for slider and label */
            display: flex;
            align-items: center;
            justify-content: space-between; /* Space slider and label */
            padding: 4px 0 8px 0;
            margin-bottom: 5px;
            border-bottom: 1px solid #444;
        }
        .quick-use-faction-slider {
            width: 40px; /* Slider width */
            height: 20px; /* Slider height */
            background-color: #555; /* Default background */
            border-radius: 10px; /* Rounded slider */
            position: relative;
            cursor: pointer;
            transition: background-color 0.3s ease;
            flex-shrink: 0; /* Prevent shrinking */
        }
        .quick-use-faction-slider-handle {
            width: 16px; /* Handle size */
            height: 16px;
            background-color: #ccc;
            border-radius: 50%; /* Circular handle */
            position: absolute;
            top: 2px;
            left: 2px; /* Initial position (Inventory) */
            transition: left 0.3s ease;
        }
        .quick-use-faction-slider.inventory {
            background-color: #4CAF50; /* Green for Inventory */
        }
        .quick-use-faction-slider.faction {
            background-color: #F44336; /* Red for Faction */
        }
        .quick-use-faction-slider.faction .quick-use-faction-slider-handle {
            left: calc(100% - 16px - 2px); /* Move handle to the right */
        }
        .quick-use-faction-toggle-label {
            font-size: 11px;
            color: #ccc;
            margin-left: 8px; /* Space between slider and label */
            flex-grow: 1; /* Allow label to take space */
            text-align: right;
        }
        /* Hide toggle when panel is minimized */
        .booster-quick-use-container[data-minimized="true"] .quick-use-faction-toggle-container {
             display: none;
        }
        /* *** END: Slider Styles *** */

        /* --- Customization UI Styles --- */
        #booster-customization-ui, #add-boosters-ui { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #222; color: white; padding: 20px; border-radius: 8px; z-index: 9999998; width: 90vw; max-width: 400px; max-height: 70vh; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444; box-sizing: border-box; }
        #booster-customization-ui h3, #add-boosters-ui h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
        #booster-customization-ui p { margin-bottom: 15px; font-size: 14px; }
        .booster-selection-area, .add-booster-list-container { margin-bottom: 15px; border: 1px solid #444; border-radius: 5px; padding: 10px; max-height: 250px; overflow-y: auto; background-color: #2a2a2a; }
        .booster-selection-item, .add-booster-item { display: flex; align-items: center; padding: 8px; margin-bottom: 5px; background-color: #333; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; border: 1px solid #444; }
        .booster-selection-item span:first-of-type { margin-right: 10px; cursor: move; user-select: none; color: #888; } /* Drag handle */
        .booster-selection-item input[type="checkbox"], .add-booster-item input[type="checkbox"] { margin-right: 10px; flex-shrink: 0; }
        .booster-selection-item span:nth-of-type(2), .add-booster-item span { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 10px; } /* Name */
        .booster-selection-item input[type="color"] { width: 30px; height: 30px; border: 1px solid #555; background: none; cursor: pointer; vertical-align: middle; margin-left: auto; padding: 0; flex-shrink: 0; border-radius: 3px; } /* Color picker */
        .booster-customization-button { background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex-grow: 1; margin: 0 5px; transition: background-color 0.2s; font-size: 13px; font-weight: bold; }
        .booster-customization-button.cancel { background-color: #f44336; }
        .booster-customization-button.add { width: calc(100% - 10px); margin-bottom: 15px; box-sizing: border-box; background-color: #2196F3; }
        .booster-customization-button:hover { filter: brightness(1.1); }
        .booster-customization-button-container { display: flex; justify-content: space-between; margin-top: 15px; }
        #add-boosters-ui input[type="text"] { width: 100%; padding: 10px; margin-bottom: 15px; background-color: #333; border: 1px solid #444; border-radius: 4px; color: white; box-sizing: border-box; font-size: 14px; }
        .add-booster-item.selected { background-color: #444; border-color: #555; }
        .add-boosters-button-container { display: flex; justify-content: flex-end; margin-top: 15px; }
        .add-boosters-done-button { background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; font-size: 13px; font-weight: bold; }
        .add-boosters-done-button:hover { filter: brightness(1.1); }

        /* SortableJS Helper Classes */
        .sortable-ghost { opacity: 0.4; background: #444; }
        .sortable-chosen, .sortable-drag { opacity: 1 !important; }
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
        // *** UPDATED: Check if on faction page AND hash starts with #/tab=armoury ***
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.hash.startsWith('#/tab=armoury');
        debugLog(`Page check - Items: ${isItemsPage}, Faction Armoury: ${isFactionArmouryPage}`);

        let gui = document.getElementById('boosterGui');
        if (!gui) {
            gui = document.createElement('div'); gui.className = 'booster-gui'; gui.id = 'boosterGui';
             // *** REMOVED settings-section from innerHTML ***
            gui.innerHTML = `<h3>Take Boosters</h3><input type="text" class="booster-search" placeholder="Search boosters..."><div class="category-header energy-header" data-category="energy"><span>Energy Boosters</span><button class="toggle-category">-</button></div><div class="booster-list energy-list"></div><div class="category-header nerve-header" data-category="nerve"><span>Nerve Boosters</span><button class="toggle-category">-</button></div><div class="booster-list nerve-list"></div><div class="category-header happy-header" data-category="happy"><span>Happy Boosters</span><button class="toggle-category">-</button></div><div class="booster-list happy-list"></div><div class="category-header statEnhancers-header" data-category="statEnhancers"><span>Stat Enhancers</span><button class="toggle-category">-</button></div><div class="booster-list statEnhancers-list"></div>`;
            document.body.appendChild(gui);

            // *** REMOVED factionBoostersCheckbox listener setup from here ***

            const searchInput = gui.querySelector('.booster-search'); searchInput.addEventListener('input', function() { const term = this.value.toLowerCase(); gui.querySelectorAll('.booster-item').forEach(item => { const name = item.getAttribute('data-name').toLowerCase(); item.style.display = (term === '' || name.includes(term)) ? 'block' : 'none'; }); Object.keys(BOOSTERS).forEach(cat => { const h = gui.querySelector(`.${cat}-header`); const l = gui.querySelector(`.${cat}-list`); const vis = Array.from(l.querySelectorAll('.booster-item')).filter(i => i.style.display !== 'none').length; h.style.display = vis > 0 ? 'flex' : 'none'; const min = localStorage.getItem(`boosterCategory_${cat}`) === 'minimized'; l.style.display = (vis > 0 && !min) ? 'grid' : 'none'; }); });
            function setupCategoryToggles() { Object.keys(BOOSTERS).forEach(cat => { const h = gui.querySelector(`.${cat}-header`); const l = gui.querySelector(`.${cat}-list`); const btn = h.querySelector('.toggle-category'); const min = localStorage.getItem(`boosterCategory_${cat}`) === 'minimized'; l.style.display = min ? 'none' : 'grid'; btn.textContent = min ? '+' : '-'; h.addEventListener('click', (e) => { if (e.target === h || e.target === btn || e.target === h.querySelector('span')) { toggleCategory(cat, l, btn); } }); }); }
            function toggleCategory(cat, list, btn) { const vis = list.style.display !== 'none'; if (vis) { list.style.display = 'none'; btn.textContent = '+'; localStorage.setItem(`boosterCategory_${cat}`, 'minimized'); } else { list.style.display = 'grid'; btn.textContent = '-'; localStorage.setItem(`boosterCategory_${cat}`, 'expanded'); } }
            populateBoosterList(gui.querySelector('.energy-list'), BOOSTERS.energy, 'energy-item'); populateBoosterList(gui.querySelector('.nerve-list'), BOOSTERS.nerve, 'nerve-item'); populateBoosterList(gui.querySelector('.happy-list'), BOOSTERS.happy, 'happy-item'); populateBoosterList(gui.querySelector('.statEnhancers-list'), BOOSTERS.statEnhancers, 'stat-item'); setupCategoryToggles();
            document.addEventListener('click', function(e) { if (gui && gui.style.display === 'block' && !gui.contains(e.target) && (!alertElements || !alertElements.alert || !alertElements.alert.contains(e.target))) { gui.style.display = 'none'; } });
        }

        alert.onclick = function(event) {
            debugLog(`Alert clicked. Items page: ${isItemsPage}, Faction Armoury page: ${isFactionArmouryPage}, Using faction boosters: ${useFactionBoosters}`);
            event.stopPropagation();
            const currentGui = document.getElementById('boosterGui');
            // *** Use updated isFactionArmouryPage check ***
            if ((isItemsPage && !useFactionBoosters) || (isFactionArmouryPage && useFactionBoosters)) {
                if (currentGui) { currentGui.style.display = currentGui.style.display === 'block' ? 'none' : 'block'; void currentGui.offsetWidth; }
                else { debugLog("GUI not found on alert click, attempting to recreate."); alertElements = createAlert(); if (alertElements && alertElements.gui) alertElements.gui.style.display = 'block'; }
            } else {
                const targetUrl = useFactionBoosters ? 'https://www.torn.com/factions.php?step=your#/tab=armoury' : 'https://www.torn.com/item.php'; // Navigate to base armoury
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

        // Find potential other panels (like TornTools quick items/drugs)
        const allQuickUsePanels = document.querySelectorAll('.quick-use-container, .tt-quick-items-container'); // Include TT class
        let highestBottom = 90; // Default start position below header
        const panelMargin = 10; // Space between panels

        allQuickUsePanels.forEach(panel => {
            // Skip self
            if (panel.classList.contains('booster-quick-use-container')) return;

            try {
                const style = window.getComputedStyle(panel);
                if (style.display !== 'none' && style.visibility !== 'hidden' && panel.offsetHeight > 0) {
                    const rect = panel.getBoundingClientRect();
                    // Ensure rect has valid dimensions before calculating bottom
                    if (rect.height > 0 && rect.bottom > 0) {
                         const panelBottom = rect.bottom + window.scrollY;
                         if (panelBottom > highestBottom) {
                             highestBottom = panelBottom;
                         }
                    } else {
                         debugLog("Skipping panel for position calculation due to invalid rect:", panel, rect);
                    }
                }
            } catch (e) {
                console.warn("BoosterAlerts: Error getting geometry for panel:", panel, e);
            }
        });


        const isBoosterMinimized = localStorage.getItem('boosterAlertMinimized') === 'true';
        let targetTop;

        if (isBoosterMinimized) {
            targetTop = `${highestBottom + (panelMargin / 2)}px`;
        } else {
            targetTop = `${highestBottom + panelMargin}px`;
        }


        if (boosterPanel.style.top !== targetTop) {
            boosterPanel.style.top = targetTop;
            debugLog(`Adjusted Booster Quick Use panel top to: ${targetTop}`);
        }
    }

    // --- NEW: Function to setup cooperative positioning ---
    function setupCooperativePositioning() {
        debugLog("[setupPositioning] Setting up cooperative positioning observer and interval.");
        // Disconnect previous observer/interval if they exist
        if (coopObserver) coopObserver.disconnect();
        if (coopAdjustInterval) clearInterval(coopAdjustInterval);

        // Initial adjustment after a short delay
        setTimeout(adjustBoosterQuickUsePosition, 500);

        // Setup MutationObserver for cooperative positioning
        coopObserver = new MutationObserver((mutations) => {
            const panelChanged = mutations.some(mutation => {
                const checkNode = (node) => node && node.nodeType === 1 && (
                    (node.classList && node.classList.contains('quick-use-container') && !node.classList.contains('booster-quick-use-container')) || // Other quick use panel
                    (node.classList && node.classList.contains('tt-quick-items-container')) || // TornTools quick items
                    node.querySelector('.quick-use-container:not(.booster-quick-use-container), .tt-quick-items-container') // Contains relevant panel
                );
                const targetIsRelevant = checkNode(mutation.target);
                const added = Array.from(mutation.addedNodes).some(checkNode);
                const removed = Array.from(mutation.removedNodes).some(checkNode);
                const attributeChanged = mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class');
                // Trigger if relevant node added/removed OR if style/class changes on potential panel
                return added || removed || (targetIsRelevant && attributeChanged);
            });

            if (panelChanged) {
                debugLog('[setupPositioning] External panel change detected. Re-adjusting booster panel position.');
                 clearTimeout(window.boosterAlertAdjustTimeout); // Debounce
                 window.boosterAlertAdjustTimeout = setTimeout(adjustBoosterQuickUsePosition, 150);
            }
        });

        // Observe body, handle potential errors
        try {
             coopObserver.observe(document.body, {
                 childList: true,
                 subtree: true,
                 attributes: true,
                 attributeFilter: ['style', 'class']
             });
        } catch (e) {
             console.error("BoosterAlerts: Failed to observe body for cooperative positioning:", e);
        }

        // Fallback: Repeatedly check position for a few seconds after load
        let adjustAttempts = 0;
        const maxAdjustAttempts = 15; // Try for 15 seconds
        setTimeout(() => {
            debugLog('[setupPositioning] Starting periodic position adjustment checks...');
            coopAdjustInterval = setInterval(() => {
                adjustBoosterQuickUsePosition();
                adjustAttempts++;
                if (adjustAttempts >= maxAdjustAttempts) {
                    clearInterval(coopAdjustInterval);
                    debugLog('[setupPositioning] Finished periodic position adjustment checks.');
                }
            }, 1000); // Check every second
        }, 3000); // Start checks 3 seconds after initialization

        // Final check on window load
        window.addEventListener('load', () => {
            debugLog('[setupPositioning] Window load event: Running final position adjustment.');
            setTimeout(adjustBoosterQuickUsePosition, 500); // Delay slightly after load
        });
    }
    // --- End Cooperative Positioning ---


    // --- Booster Count Fetching --- UPDATED DOM SCANNING ---
    /**
     * Fetches the current count for boosters from the DOM (item.php or faction armoury).
     * Merges with counts stored in sessionStorage and updates the global `boosterCounts`.
     * @param {boolean} useFaction - Whether to look in the faction armoury.
     * @param {HTMLElement} [container=document] - The container element to search within (should be the item list container).
     */
    function fetchInitialBoosterCounts(useFaction = false, container = document) {
        debugLog(`[fetchCounts] Starting count fetch. Faction mode: ${useFaction}. Container:`, container);

        // --- Load existing counts from sessionStorage ---
        let storedCounts = {};
        try {
            const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (storedData) {
                storedCounts = JSON.parse(storedData);
                if (typeof storedCounts !== 'object' || storedCounts === null) {
                    storedCounts = {}; // Ensure it's an object
                }
                debugLog('[fetchCounts] Loaded counts from sessionStorage:', JSON.stringify(storedCounts));
            }
        } catch (e) {
            console.error("BoosterAlerts: Error parsing stored counts from sessionStorage", e);
            storedCounts = {};
        }
        // Initialize global boosterCounts with stored data
        boosterCounts = { ...storedCounts };
        // --- End loading ---

        // Define selectors based on mode
        // *** Updated Faction Selector ***
        const itemsSelector = useFaction
            ? '#faction-armoury ul.item-list > li, #armoury-boosters ul.item-list > li, #armoury-medical ul.item-list > li, #armoury-drugs ul.item-list > li, #armoury-temporary ul.item-list > li' // More specific faction selectors for list items
            : 'li[data-item]'; // Personal items: Use the broader selector again

        let itemElements = [];
        try {
            // Search within the provided container (or document if none provided)
            itemElements = Array.from(container.querySelectorAll(itemsSelector));
            debugLog(`[fetchCounts] Found ${itemElements.length} potential item elements using selector: "${itemsSelector}" within container.`);
        } catch (e) {
            console.error(`[fetchCounts] Error querying selector "${itemsSelector}":`, e);
            itemElements = []; // Ensure it's an empty array on error
        }

        // Fallback selector for personal items if the primary one fails
        if (!useFaction && itemElements.length === 0) {
            const altSelector = 'li[id^="item"]'; // Try li with id="item..."
            debugLog(`[fetchCounts] Primary selector "${itemsSelector}" failed for personal items, trying alternative: ${altSelector}`);
            try {
                const altItemElements = Array.from(container.querySelectorAll(altSelector));
                if (altItemElements.length > 0) {
                    itemElements = altItemElements; // Use the alternative elements
                    debugLog(`[fetchCounts] Found ${altItemElements.length} elements with alternative selector.`);
                }
            } catch(e) {
                console.error(`[fetchCounts] Error querying alternative selector "${altSelector}":`, e);
            }
        }

        if (itemElements.length === 0) {
            console.warn("[fetchCounts] No item elements found on current tab/view.");
            // Don't return early, still need to save potentially loaded counts
        } else {
             // Process found elements
            itemElements.forEach((itemLi, index) => {
                // Ensure itemLi is a valid element before processing
                if (!(itemLi instanceof HTMLElement)) {
                    return;
                }

                try {
                    let itemId = null;
                    let quantity = null;
                    let itemName = null;

                    if (useFaction) {
                        // --- Faction Armoury Parsing Logic ---
                        const imgWrap = itemLi.querySelector('div.img-wrap[data-itemid]');
                        itemId = imgWrap?.dataset.itemid;
                        const nameDiv = itemLi.querySelector('div.name');
                        const qtySpan = nameDiv?.querySelector('span.qty');

                        if (itemId && nameDiv) {
                            itemName = nameDiv.firstChild?.textContent?.trim().replace(/ x$/, '').trim() || `Faction Item ${itemId}`; // Extract name before " x"
                            if (qtySpan?.textContent) {
                                quantity = parseInt(qtySpan.textContent.replace(/[\D]/g, ''));
                            } else {
                                // If no separate qty span, check if quantity is in the name div itself (e.g., "Item Name x1")
                                const nameMatch = nameDiv.textContent.match(/ x(\d+)$/);
                                if (nameMatch && nameMatch[1]) {
                                    quantity = parseInt(nameMatch[1]);
                                    itemName = nameDiv.textContent.substring(0, nameMatch.index).trim(); // Correct item name
                                } else {
                                    // Assume quantity is 1 if no 'x' or span is found (might happen for single items?)
                                    quantity = 1;
                                     debugLog(`[fetchCounts Faction] No qty span/suffix found for ${itemName} (ID: ${itemId}), assuming quantity is 1.`);
                                }
                            }
                             // debugLog(`[fetchCounts Faction] ID: ${itemId}, Name: ${itemName}, Qty: ${quantity}`); // Reduce log noise
                        } else {
                             debugLog(`[fetchCounts Faction] Skipping item, couldn't find ID or name div:`, itemLi);
                             return; // Skip if essential parts missing
                        }

                    } else {
                        // --- Personal Items Parsing Logic ---
                        // Filter action items first
                        const isActionItem = itemLi.classList.contains('dump') ||
                                             itemLi.classList.contains('send') ||
                                             itemLi.classList.contains('market') ||
                                             itemLi.classList.contains('equip') ||
                                             itemLi.classList.contains('unequip') ||
                                             itemLi.classList.contains('info') ||
                                             !itemLi.querySelector('.title-wrap');

                        if (isActionItem) {
                            return; // Skip action items
                        }

                        // Extract Item ID
                        itemId = itemLi.getAttribute('data-item') || itemLi.getAttribute('data-itemid');
                        if (!itemId && itemLi.id && itemLi.id.startsWith('item')) {
                            itemId = itemLi.id.replace('item', '');
                        }
                        if (!itemId) {
                            const img = itemLi.querySelector('img.torn-item[src*="/items/"]');
                            if (img?.src) {
                                const match = img.src.match(/\/items\/(\d+)\//);
                                if (match && match[1]) itemId = match[1];
                            }
                        }

                        if (!itemId) return; // Skip if no ID

                        // Extract Name
                        const nameElement = itemLi.querySelector('.name, .title .name, .name-wrap .t-overflow');
                        itemName = nameElement ? nameElement.textContent.trim() : `Unknown (ID: ${itemId})`;

                        // Extract Quantity
                        const dataQty = itemLi.getAttribute('data-qty');
                        if (dataQty !== null) {
                            const qtyFromAttr = parseInt(dataQty);
                            if (!isNaN(qtyFromAttr) && qtyFromAttr >= 0) {
                                quantity = qtyFromAttr;
                            }
                        }
                        if (quantity === null) {
                            const qtyElement = itemLi.querySelector('.title-wrap .name-wrap span.qty');
                            if (qtyElement?.textContent) {
                                const qtyText = qtyElement.textContent.replace(/[\D]/g, '');
                                const qtyFromSpan = parseInt(qtyText);
                                if (!isNaN(qtyFromSpan) && qtyFromSpan >= 0) {
                                    quantity = qtyFromSpan;
                                }
                            }
                        }
                         // debugLog(`[fetchCounts Personal] ID: ${itemId}, Name: ${itemName}, Qty: ${quantity}`); // Reduce log noise
                    } // End Personal Items Logic

                    // --- Store Parsed Data ---
                    itemId = parseInt(itemId); // Ensure number
                    if (isNaN(itemId)) return; // Final check

                    if (quantity !== null && !isNaN(quantity) && quantity >= 0) {
                        boosterCounts[itemId] = quantity; // Update with the latest count found
                    } else {
                         if (boosterCounts[itemId] === undefined) { // Avoid overwriting a known count with 0
                             debugLog(`[fetchCounts] Failed to parse valid quantity for ${itemName} (ID: ${itemId}). Storing 0.`, itemLi);
                             boosterCounts[itemId] = 0;
                         }
                    }

                } catch (e) {
                    console.error(`[fetchCounts] Error processing element index ${index}:`, itemLi, e);
                }
            });
        } // End of processing found elements

        // --- Save the potentially updated counts back to sessionStorage ---
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(boosterCounts));
            debugLog("[fetchCounts] Saved updated counts to sessionStorage:", JSON.stringify(boosterCounts));
        } catch (e) {
            console.error("BoosterAlerts: Error saving counts to sessionStorage", e);
        }
        // --- End saving ---
    }


    /**
     * Updates the displayed count on a specific quick use booster button.
     * Also handles creating the button if it doesn't exist and count > 0.
     * Uses the global `boosterCounts` which is now persistent.
     * @param {number | string} boosterId - The ID of the booster to update.
     * @param {number} newCount - The new count to display.
     */
    function updateBoosterCountDisplay(boosterId, newCount) {
        boosterId = parseInt(boosterId); // Ensure ID is number
        newCount = parseInt(newCount); // Ensure count is number
        if (isNaN(boosterId) || isNaN(newCount)) {
            console.error("[updateCount] Invalid ID or count provided:", boosterId, newCount);
            return;
        }

        // Update the global count state FIRST
        boosterCounts[boosterId] = newCount;

        // --- Update sessionStorage as well ---
         try {
             sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(boosterCounts));
             // debugLog(`[updateCount] Updated sessionStorage for booster ${boosterId} to count ${newCount}`); // Reduce noise
         } catch (e) {
             console.error("BoosterAlerts: Error saving updated count to sessionStorage", e);
         }
        // --- End update sessionStorage ---


        // Find the button OR create it if it doesn't exist but should (count > 0)
        let button = document.querySelector(`.booster-quick-button[data-booster-id="${boosterId}"]`);
        const quickUseContainer = document.querySelector('.booster-quick-use-container');

        if (!button && newCount > 0 && quickUseContainer) {
            // Button doesn't exist, but count is positive, try to create it
            debugLog(`[updateCount] Button for ${boosterId} not found, creating as count is ${newCount}`);
            const savedBoosters = JSON.parse(localStorage.getItem('customQuickUseBoosters') || '[]');
            const boosterData = savedBoosters.find(b => parseInt(b.id) === boosterId);
            if (boosterData) {
                 button = createQuickUseButtonElement(boosterData, newCount); // Create the button element
                 // Find the settings button to insert before it
                 const settingsButton = quickUseContainer.querySelector('.booster-settings-button');
                 if (settingsButton) {
                     quickUseContainer.insertBefore(button, settingsButton);
                 } else {
                     quickUseContainer.appendChild(button); // Append if settings button not found
                 }
                 // Re-apply minimized state if needed after adding a button
                 const isMinimized = localStorage.getItem('boosterAlertMinimized') === 'true';
                 if (isMinimized) button.style.display = 'none';

            } else {
                 debugLog(`[updateCount] Could not find booster data for ID ${boosterId} to create button.`);
            }
        } else if (button) {
            // Button exists, update its count and visibility
            const countSpan = button.querySelector('.booster-quick-button-count');
            if (countSpan) {
                countSpan.textContent = `x${newCount}`;
                // Update visibility based on count and minimized state
                const isMinimized = localStorage.getItem('boosterAlertMinimized') === 'true';
                button.style.display = isMinimized ? 'none' : (newCount > 0 ? 'flex' : 'none');
                // debugLog(`[updateCount] Updated display for booster ${boosterId} to count ${newCount}. Button display: ${button.style.display}`);
            } else {
                 debugLog(`[updateCount] Count span not found for booster ${boosterId}`);
            }
        } else {
             // debugLog(`[updateCount] Button not found for booster ${boosterId} and count is 0, doing nothing.`);
        }

        // Global count already updated above
    }
    // --- END Booster Count Fetching ---


    // --- Quick Use Functions --- (Modified for Counts)

    /**
     * Creates a single quick use button element.
     * @param {object} booster - The booster data {id, name, color}.
     * @param {number} count - The current count.
     * @returns {HTMLElement} - The button div element.
     */
     function createQuickUseButtonElement(booster, count) {
         const boosterIdNum = parseInt(booster.id);
         const btn = document.createElement('div');
         btn.className = 'booster-quick-button';
         btn.setAttribute('data-booster-id', boosterIdNum);
         btn.setAttribute('data-booster-name', booster.name);
         // Visibility is set by updateBoosterCountDisplay or applyMinimizedState

         const nameSpan = document.createElement('span');
         nameSpan.className = 'booster-quick-button-name';
         nameSpan.textContent = booster.name;

         const countSpan = document.createElement('span');
         countSpan.className = 'booster-quick-button-count';
         countSpan.textContent = `x${count}`;

         btn.appendChild(nameSpan);
         btn.appendChild(countSpan);

         const bgColor = booster.color || getDefaultBoosterColor(boosterIdNum);
         btn.style.backgroundColor = bgColor;
         btn.style.color = getTextColorForBackground(bgColor);

         btn.addEventListener('click', () => useBooster(boosterIdNum, booster.name));

         return btn;
     }


    /**
     * Adds or rebuilds the quick use panel, using existing counts.
     */
    function buildOrRebuildQuickUsePanel() {
        debugLog("[buildPanel] Starting build/rebuild...");
        // panelBuilt = false; // Flag is reset in initialize, not here

        // Remove existing container
        const existingContainer = document.querySelector('.booster-quick-use-container');
        if (existingContainer) {
            debugLog("[buildPanel] Removing existing container.");
            existingContainer.remove();
        }

        // --- VISIBILITY CHECK (Updated for broader armoury view) ---
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        // *** UPDATED: Check if on faction page AND hash starts with #/tab=armoury ***
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.hash.startsWith('#/tab=armoury');

        const shouldShowQuickUse = (isItemsPage && !useFactionBoosters) || (isFactionArmouryPage && useFactionBoosters);

        // *** ADDED DEBUG LOGGING ***
        debugLog(`[buildPanel] Visibility Check: isItemsPage=${isItemsPage}, isFactionArmouryPage=${isFactionArmouryPage}, useFactionBoosters=${useFactionBoosters}, shouldShowQuickUse=${shouldShowQuickUse}`);


        if (!shouldShowQuickUse) {
            debugLog('[buildPanel] Quick Use UI should not be shown on this page/mode. Aborting panel build.');
            return; // <-- Panel creation is skipped if not on the correct page/mode
        }
        // --- END VISIBILITY CHECK ---

        // --- Build Panel ---
        debugLog('[buildPanel] Creating Quick Use UI container.');
        const quickUseContainer = document.createElement('div');
        quickUseContainer.className = 'booster-quick-use-container';

        const savedQuickUseBoosters = localStorage.getItem('customQuickUseBoosters');
        let quickUseBoosters = [];
        const defaultQuickBoosters = [ { id: 532, name: "Can of Red Cow" }, { id: 533, name: "Can of Taurine Elite" }, { id: 530, name: "Can of Munster" } ];

        if (savedQuickUseBoosters) {
            try {
                quickUseBoosters = JSON.parse(savedQuickUseBoosters);
                quickUseBoosters.forEach(b => {
                    b.id = parseInt(b.id); // Ensure ID is number
                    if (!b.color) b.color = getDefaultBoosterColor(b.id);
                });
            } catch (e) {
                console.error("Booster Alerts: Error parsing saved quick use boosters", e);
                quickUseBoosters = defaultQuickBoosters.map(b => ({ ...b, id: parseInt(b.id), color: getDefaultBoosterColor(b.id) }));
                localStorage.setItem('customQuickUseBoosters', JSON.stringify(quickUseBoosters));
            }
        } else {
            quickUseBoosters = defaultQuickBoosters.map(b => ({ ...b, id: parseInt(b.id), color: getDefaultBoosterColor(b.id) }));
            localStorage.setItem('customQuickUseBoosters', JSON.stringify(quickUseBoosters));
        }
        debugLog("[buildPanel] Loaded quick use boosters config:", quickUseBoosters);

        const boosterButtons = []; // To manage visibility on toggle
        let buttonsAddedCount = 0; // Count how many buttons are actually added with count > 0

        // Use the global boosterCounts which now contains merged data
        quickUseBoosters.forEach(booster => {
            const boosterIdNum = parseInt(booster.id);
            const count = boosterCounts[boosterIdNum] || 0; // Use current count state
            debugLog(`[buildPanel] Processing: ${booster.name} (ID: ${boosterIdNum}), Count from state: ${count}`);

            const btn = createQuickUseButtonElement(booster, count); // Create button using helper
            // Set initial visibility based on count
            btn.style.display = count > 0 ? 'flex' : 'none';
            boosterButtons.push(btn);
            quickUseContainer.appendChild(btn);

            if (count > 0) {
                 buttonsAddedCount++;
            }
        });

        debugLog(`[buildPanel] Created ${boosterButtons.length} buttons structure, ${buttonsAddedCount} initially visible.`);

        // *** MODIFIED: Add Faction Toggle SLIDER ***
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'quick-use-faction-toggle-container'; // Use new wrapper class

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'quick-use-faction-slider'; // Use new slider class
        sliderContainer.classList.add(useFactionBoosters ? 'faction' : 'inventory'); // Set initial state class

        const sliderHandle = document.createElement('div');
        sliderHandle.className = 'quick-use-faction-slider-handle'; // Use new handle class
        sliderContainer.appendChild(sliderHandle);

        const sliderLabel = document.createElement('span');
        sliderLabel.className = 'quick-use-faction-toggle-label'; // Use new label class
        sliderLabel.textContent = useFactionBoosters ? 'Faction' : 'Inventory'; // Set initial text

        toggleContainer.appendChild(sliderContainer); // Add slider to wrapper
        toggleContainer.appendChild(sliderLabel); // Add label to wrapper
        quickUseContainer.appendChild(toggleContainer); // Add wrapper above settings

        // Add click listener to the slider container
        sliderContainer.addEventListener('click', function() {
            // Toggle the state
            useFactionBoosters = !useFactionBoosters;

            // Update slider appearance
            sliderContainer.classList.toggle('faction', useFactionBoosters);
            sliderContainer.classList.toggle('inventory', !useFactionBoosters);

            // Update label text
            sliderLabel.textContent = useFactionBoosters ? 'Faction' : 'Inventory';

            // Save the new state
            localStorage.setItem('useFactionBoosters', useFactionBoosters);

            // Show notification
            showNotification(`${useFactionBoosters ? 'Using faction armoury boosters' : 'Using personal inventory boosters'}`, 'info');

            // Clear counts and re-scan/rebuild (existing logic)
            debugLog('[Faction Toggle Slider] Clearing counts and triggering rescan/rebuild.');
            boosterCounts = {};
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            // Trigger a fetch and rebuild for the current view
            handleDelayedScan(); // Use the delayed scan to allow DOM updates if needed
        });
        // *** END: Add Faction Toggle SLIDER ***


        // Add Settings Button
        const settingsButton = document.createElement('div');
        settingsButton.textContent = '⚙️ Edit Boosters';
        settingsButton.className = 'booster-settings-button';
        settingsButton.addEventListener('click', () => showBoosterCustomizationUI(quickUseBoosters));
        quickUseContainer.appendChild(settingsButton);

        // Add Minimize/Toggle Button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'booster-quick-use-toggle-button';
        let isMinimized = localStorage.getItem('boosterAlertMinimized') === 'true';

        function applyMinimizedState() {
            const currentContainer = document.querySelector('.booster-quick-use-container');
            if (!currentContainer) return;

            // Set data attribute for CSS hiding
            currentContainer.dataset.minimized = isMinimized.toString();

            // Ensure boosterButtons array contains valid elements before iterating
            if (Array.isArray(boosterButtons)) {
                 boosterButtons.forEach(btn => {
                     if (btn instanceof HTMLElement) { // Check if it's a valid element
                         // Only hide/show if count > 0
                         const boosterId = btn.getAttribute('data-booster-id');
                         const currentCount = boosterCounts[boosterId] || 0; // Read from global state
                         // Visibility depends on minimized state AND count
                         btn.style.display = isMinimized ? 'none' : (currentCount > 0 ? 'flex' : 'none');
                     }
                 });
            }
            if (settingsButton) settingsButton.style.display = isMinimized ? 'none' : 'block';
            // Toggle container visibility handled by CSS using data-minimized attribute
            // if (toggleContainer) toggleContainer.style.display = isMinimized ? 'none' : 'flex'; // Now handled by CSS

            currentContainer.style.padding = isMinimized ? '2px' : '10px';
            toggleButton.textContent = isMinimized ? '+' : '–'; // Use en-dash
            adjustBoosterQuickUsePosition(); // Adjust position after state change
        }

        toggleButton.addEventListener('click', () => {
            isMinimized = !isMinimized;
            localStorage.setItem('boosterAlertMinimized', isMinimized.toString());
            applyMinimizedState();
        });

        quickUseContainer.appendChild(toggleButton);
        document.body.appendChild(quickUseContainer);

        // Apply initial state and position
        applyMinimizedState();
        setupCooperativePositioning(); // Call the setup function here
        panelBuilt = true; // Mark panel as built for this cycle
        debugLog("[buildPanel] Panel build complete.");
    }

    // Keep original customization UI functions, they don't need count logic
    function showBoosterCustomizationUI(currentBoosters) {
        let justOpened = true; setTimeout(() => { justOpened = false; }, 300);
        const existingUI = document.getElementById('booster-customization-ui'); if (existingUI) existingUI.remove();
        const customizationUI = document.createElement('div'); customizationUI.id = 'booster-customization-ui';
        customizationUI.innerHTML = `<h3>Customize Quick Use Boosters</h3><p>Select boosters to show. Drag ≡ to reorder. Click color swatch to customize.</p><div class="booster-selection-area"></div><button class="booster-customization-button add">+ Add More Boosters</button><div class="booster-customization-button-container"><button class="booster-customization-button save">Save Changes</button><button class="booster-customization-button cancel">Cancel</button></div>`;
        const boosterSelectionArea = customizationUI.querySelector('.booster-selection-area');
        // Ensure IDs are numbers when loading
        const selectedBoosters = JSON.parse(JSON.stringify(currentBoosters)).map(b => ({ ...b, id: parseInt(b.id), color: b.color || getDefaultBoosterColor(parseInt(b.id)) }));

        function createColorPicker(booster) {
            const c = document.createElement('input'); c.type = 'color'; c.value = booster.color || getDefaultBoosterColor(booster.id);
            c.addEventListener('input', (e) => {
                const itemData = selectedBoosters.find(b => b.id === booster.id);
                if (itemData) itemData.color = e.target.value;
             });
            c.addEventListener('click', (e) => e.stopPropagation()); // Prevent parent click
            return c;
        }

        function renderBoosterItem(booster) {
            const boosterIdNum = parseInt(booster.id); // Ensure ID is number
            const i = document.createElement('div'); i.className = 'booster-selection-item'; i.setAttribute('data-booster-id', boosterIdNum); i.setAttribute('draggable', 'true');
            const h = document.createElement('span'); h.innerHTML = '≡'; i.appendChild(h); // Handle
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; // Checkbox
            cb.addEventListener('change', () => { i.style.opacity = cb.checked ? '1' : '0.5'; i.style.textDecoration = cb.checked ? 'none' : 'line-through'; if (!cb.checked) i.setAttribute('data-remove', 'true'); else i.removeAttribute('data-remove'); }); i.appendChild(cb);
            const n = document.createElement('span'); n.textContent = booster.name; i.appendChild(n); // Name
            const cp = createColorPicker(booster); i.appendChild(cp); // Color Picker
            boosterSelectionArea.appendChild(i);
            // Drag listeners added by SortableJS or manually below
        }

        selectedBoosters.forEach(renderBoosterItem);

        // Drag and Drop Update Function (called by SortableJS onEnd or manual dragend)
        function updateOrderAfterDrag() {
            const items = Array.from(boosterSelectionArea.querySelectorAll('.booster-selection-item'));
            const reordered = [];
            items.forEach(item => {
                const id = parseInt(item.dataset.boosterId);
                // Find existing data in selectedBoosters to preserve color changes etc.
                let data = selectedBoosters.find(b => b.id === id);
                if (data) {
                    const cp = item.querySelector('input[type="color"]');
                    if (cp) data.color = cp.value; // Update color from picker
                    reordered.push(data);
                } else {
                     // Should not happen if rendered correctly, but as a fallback:
                     const originalBooster = allBoostersFlat.find(b => b.id === id);
                     if (originalBooster) {
                         const cp = item.querySelector('input[type="color"]');
                         reordered.push({
                             id: id,
                             name: originalBooster.name,
                             color: cp ? cp.value : getDefaultBoosterColor(id)
                         });
                     }
                }
            });
            selectedBoosters.length = 0;
            selectedBoosters.push(...reordered);
            debugLog("Updated booster order:", selectedBoosters);
        }

        // Initialize SortableJS if available
        if (typeof Sortable !== 'undefined') {
            try {
                Sortable.create(boosterSelectionArea, {
                    animation: 150,
                    handle: '.booster-selection-item span:first-of-type', // Drag handle
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    dragClass: 'sortable-drag',
                    onEnd: updateOrderAfterDrag // Update internal array order on drop
                });
            } catch(e) {
                 console.error("SortableJS initialization failed:", e);
                 // Fallback to manual drag/drop if Sortable fails
                 addManualDragListeners(boosterSelectionArea, updateOrderAfterDrag);
            }
        } else {
            console.warn("BoosterAlerts: SortableJS not found. Using manual drag/drop.");
            addManualDragListeners(boosterSelectionArea, updateOrderAfterDrag);
        }


        customizationUI.querySelector('.booster-customization-button.add').addEventListener('click', () => {
            showAddBoostersUI(selectedBoosters, boosterSelectionArea, renderBoosterItem);
        });

        customizationUI.querySelector('.booster-customization-button.save').addEventListener('click', () => {
            const currentItemsInUI = Array.from(boosterSelectionArea.querySelectorAll('.booster-selection-item'));
            const finalBoostersCorrected = currentItemsInUI
                .filter(item => !item.hasAttribute('data-remove'))
                .map(item => {
                    const boosterId = parseInt(item.dataset.boosterId);
                    // Use the selectedBoosters array which should have the latest color info
                    const boosterData = selectedBoosters.find(b => b.id === boosterId);
                    const colorPicker = item.querySelector('input[type="color"]'); // Get final color just in case
                    return {
                        id: boosterId,
                        name: boosterData ? boosterData.name : allBoostersFlat.find(b => b.id === boosterId)?.name || 'Unknown',
                        color: colorPicker ? colorPicker.value : (boosterData ? boosterData.color : getDefaultBoosterColor(boosterId))
                    };
                });
            localStorage.setItem('customQuickUseBoosters', JSON.stringify(finalBoostersCorrected));
            customizationUI.remove();
            buildOrRebuildQuickUsePanel(); // Use the combined build/rebuild function
            showNotification('Quick use boosters updated!', 'success');
        });

        customizationUI.querySelector('.booster-customization-button.cancel').addEventListener('click', () => {
             customizationUI.remove();
             const addUI = document.getElementById('add-boosters-ui'); if (addUI) addUI.remove();
        });

        document.body.appendChild(customizationUI);

        function closeOnClickOutside(e) {
             if (justOpened) return;
             const isSettings = e.target.closest('.booster-settings-button');
             const isAddUI = e.target.closest('#add-boosters-ui');
             const isCustomizationUI = e.target.closest('#booster-customization-ui');
             if (!isCustomizationUI && !isSettings && !isAddUI) {
                 customizationUI.remove();
                 const addUI = document.getElementById('add-boosters-ui'); if (addUI) addUI.remove();
                 document.removeEventListener('click', closeOnClickOutside, true);
             }
        }
        setTimeout(() => { document.addEventListener('click', closeOnClickOutside, true); }, 100);
    }

    // Manual drag listener fallback
    function addManualDragListeners(area, onEndCallback) {
         let draggedItemElement = null;
         area.addEventListener('dragstart', (e) => {
             draggedItemElement = e.target.closest('.booster-selection-item');
             if (!draggedItemElement) return;
             e.dataTransfer.effectAllowed = 'move';
             e.dataTransfer.setData('text/plain', draggedItemElement.dataset.boosterId);
             setTimeout(() => { if (draggedItemElement) draggedItemElement.style.opacity = '0.4'; }, 0);
         });
         area.addEventListener('dragover', (e) => {
             e.preventDefault();
             e.dataTransfer.dropEffect = 'move';
             const targetElement = e.target.closest('.booster-selection-item');
             if (targetElement && targetElement !== draggedItemElement) {
                 const rect = targetElement.getBoundingClientRect();
                 const midpoint = rect.top + rect.height / 2;
                 if (e.clientY < midpoint) {
                     area.insertBefore(draggedItemElement, targetElement);
                 } else {
                     area.insertBefore(draggedItemElement, targetElement.nextSibling);
                 }
             }
         });
         area.addEventListener('drop', (e) => { e.preventDefault(); });
         area.addEventListener('dragend', (e) => {
             if (draggedItemElement) { draggedItemElement.style.opacity = '1'; }
             draggedItemElement = null;
             if (typeof onEndCallback === 'function') {
                 onEndCallback(); // Call the update function
             }
         });
    }


    function showAddBoostersUI(selectedBoostersRef, parentBoosterSelectionArea, renderBoosterItemFn) {
        const existingAddUI = document.getElementById('add-boosters-ui'); if (existingAddUI) existingAddUI.remove();
        const addUI = document.createElement('div'); addUI.id = 'add-boosters-ui';
        addUI.innerHTML = `<h3>Add Boosters to Quick Use</h3><input type="text" placeholder="Search all boosters..."><div class="add-booster-list-container"></div><div class="add-boosters-button-container"><button class="add-boosters-done-button">Done</button></div>`;
        const searchBox = addUI.querySelector('input[type="text"]'); const listContainer = addUI.querySelector('.add-booster-list-container');

        function refreshList(term = '') {
            listContainer.innerHTML = '';
            const filtered = allBoostersFlat.filter(b => b.name.toLowerCase().includes(term.toLowerCase()));
            if (filtered.length === 0) { listContainer.innerHTML = '<div style="padding: 10px; color: #aaa;">No boosters found</div>'; return; }

            filtered.forEach(b => {
                const boosterIdNum = parseInt(b.id); // Ensure ID is number
                const pItem = parentBoosterSelectionArea.querySelector(`.booster-selection-item[data-booster-id="${boosterIdNum}"]`);
                const isSel = pItem && !pItem.hasAttribute('data-remove');
                const item = document.createElement('div'); item.className = `add-booster-item ${isSel ? 'selected' : ''}`;
                const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = isSel; cb.style.pointerEvents = 'none';
                const name = document.createElement('span'); name.textContent = b.name;
                item.appendChild(cb); item.appendChild(name);

                item.addEventListener('click', () => {
                    const pOnClick = parentBoosterSelectionArea.querySelector(`.booster-selection-item[data-booster-id="${boosterIdNum}"]`);
                    const currentSel = pOnClick && !pOnClick.hasAttribute('data-remove');
                    if (!currentSel) { // Add or un-remove
                        if (pOnClick) { // Un-remove
                            pOnClick.style.opacity = '1'; pOnClick.style.textDecoration = 'none'; pOnClick.removeAttribute('data-remove');
                            const pCb = pOnClick.querySelector('input[type="checkbox"]'); if(pCb) pCb.checked = true;
                            // Ensure it's in the reference array
                            if (!selectedBoostersRef.some(r => r.id === boosterIdNum)) {
                                 // Find the color picker in the parent to preserve color
                                 const colorPicker = pOnClick.querySelector('input[type="color"]');
                                 selectedBoostersRef.push({ ...b, id: boosterIdNum, color: colorPicker ? colorPicker.value : getDefaultBoosterColor(boosterIdNum) });
                            }
                        } else { // Add new
                            const newData = { ...b, id: boosterIdNum, color: getDefaultBoosterColor(boosterIdNum) };
                            renderBoosterItemFn(newData); // Render in parent
                            selectedBoostersRef.push(newData); // Add to reference array
                        }
                        item.classList.add('selected'); cb.checked = true;
                    } else { // Remove
                        if (pOnClick) { // Mark for removal in parent
                            pOnClick.style.opacity = '0.5'; pOnClick.style.textDecoration = 'line-through'; pOnClick.setAttribute('data-remove', 'true');
                            const pCb = pOnClick.querySelector('input[type="checkbox"]'); if(pCb) pCb.checked = false;
                        }
                        item.classList.remove('selected'); cb.checked = false;
                    }
                });
                listContainer.appendChild(item);
            });
        }

        refreshList();
        searchBox.addEventListener('input', () => { refreshList(searchBox.value); });
        addUI.querySelector('.add-boosters-done-button').addEventListener('click', () => { addUI.remove(); });
        document.body.appendChild(addUI);
        addUI.addEventListener('click', e => { e.stopPropagation(); }); // Prevent closing main UI
    }
    // --- End Quick Use Functions ---


    // --- Core Logic (useBooster, XHR requests, cooldown checks, etc.) --- (Modified for Counts)

    function useBooster(id, name) {
        const boosterIdNum = parseInt(id); // Ensure ID is number
        debugLog(`[useBooster] Attempting to use booster: ${name} (ID: ${boosterIdNum}), Using faction boosters: ${useFactionBoosters}`);
        showNotification(`Using ${name}...`, 'info');
        const gui = document.getElementById('boosterGui'); if (gui) gui.style.display = 'none';

        // --- Optimistic Count Decrement ---
        const currentCount = boosterCounts[boosterIdNum] || 0; // Read from global state
        if (currentCount > 0) {
            // Update display AND persistent storage
            updateBoosterCountDisplay(boosterIdNum, currentCount - 1);
        } else {
            console.warn(`[useBooster] Attempting to use ${name} (ID: ${boosterIdNum}) with count ${currentCount}`);
            updateBoosterCountDisplay(boosterIdNum, 0); // Ensure button hides and storage updates if count is 0
        }
        // --- End Decrement ---

        // Proceed with usage attempt, passing original count for potential revert
        if (useFactionBoosters) {
            tryFactionBoosterUseMethod(boosterIdNum, name, currentCount); // Pass the count BEFORE decrement
        } else {
            tryDirectUseMethod(boosterIdNum, name, currentCount); // Pass the count BEFORE decrement
        }
    }

    // Pass originalCount down the chain
    function tryDirectUseMethod(id, name, originalCount) {
        debugLog('[tryDirect] Attempting direct use method');
        sessionStorage.setItem('boosterUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'direct' }));
        useItemDirectly(id, name, originalCount);
    }

    function useItemDirectly(id, name, originalCount) {
        debugLog(`[useDirect] Using item directly: ${name} (ID: ${id})`);
        const token = getNSTStyleToken() || getPageCsrfToken();
        if (token) {
            debugLog(`[useDirect] Using token: ${token.substring(0, 4)}...`);
            submitBoosterUseRequest(id, name, token, originalCount); // Pass count
        } else {
            console.error('BoosterAlerts: Failed to get token');
            showNotification(`Unable to use ${name}: Could not get token`, 'error');
            sessionStorage.removeItem('boosterUseInProgress');
            updateBoosterCountDisplay(id, originalCount); // Revert count on token failure (updates global state + storage)
        }
    }

    // Pass originalCount down the chain
    function tryFactionBoosterUseMethod(id, name, originalCount) {
        debugLog(`[tryFaction] Attempting faction booster use: ${name} (ID: ${id})`);
        sessionStorage.setItem('boosterUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'faction' }));
        // *** UPDATED: Check if on faction page AND hash starts with #/tab=armoury ***
        const isFacArmouryPage = window.location.href.includes('factions.php') && window.location.hash.startsWith('#/tab=armoury');
        if (!isFacArmouryPage) {
            debugLog(`[tryFaction] Not on armoury page. Navigating...`);
            sessionStorage.setItem('pendingFactionBoosterUse', JSON.stringify({ id, name, originalCount })); // Store count too
            window.location.href = 'https://www.torn.com/factions.php?step=your#/tab=armoury'; // Navigate to base armoury
            return;
        }
        const token = getNSTStyleToken() || getPageCsrfToken();
        if (!token) {
            console.error('BoosterAlerts: No CSRF token for faction booster');
            showNotification('Unable to use faction booster: No token', 'error');
            sessionStorage.removeItem('boosterUseInProgress');
            updateBoosterCountDisplay(id, originalCount); // Revert count (updates global state + storage)
            return;
        }
        debugLog(`[tryFaction] Using token for faction booster: ${token.substring(0, 4)}...`);
        tryBothFactionBoosterMethods(id, name, token, originalCount); // Pass count
    }

    function tryBothFactionBoosterMethods(id, name, token, originalCount) {
        debugLog('[tryBothFaction] Trying direct faction method first (item.php?fac=1)');
        useFactionBoosterById(id, name, token, originalCount); // Pass count
        // Set timeout to try traditional method if the first one doesn't resolve quickly
        // Ensure the check uses the correct sessionStorage item
        setTimeout(() => {
            const progress = sessionStorage.getItem('boosterUseInProgress');
            if (progress) {
                 try {
                     const progressData = JSON.parse(progress);
                     // Only try traditional if the item ID matches the one still in progress
                     if (progressData && parseInt(progressData.id) === id) { // Ensure comparison uses same type
                         debugLog('[tryBothFaction] Direct faction method failed/slow, trying traditional');
                         useFactionBoosterDirectly(id, name, originalCount); // Pass count
                     }
                 } catch (e) {
                      console.error("Error parsing boosterUseInProgress:", e);
                      sessionStorage.removeItem('boosterUseInProgress'); // Clear invalid data
                 }
            }
        }, 2500); // Increased timeout slightly
    }

    function useFactionBoosterById(id, name, token, originalCount) {
        debugLog(`[useFacById] Directly using faction booster via item.php?fac=1: ${id}`);
        const params = new URLSearchParams({ step: 'useItem', confirm: 'yes', itemID: id, fac: '1', csrf: token });
        const xhr = new XMLHttpRequest(); xhr.open('POST', 'https://www.torn.com/item.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() { handleBoosterResponse(this, id, name, 'faction_direct', originalCount, true); }; // Pass count, maybeClear=true
        xhr.onerror = function() {
            debugLog('[useFacById] Direct faction (item.php) network error');
            // Don't revert count here, let the traditional method try or timeout handle it
        };
        xhr.send(params.toString());
    }

    function useFactionBoosterDirectly(id, name, originalCount) {
        debugLog(`[useFacDirect] Using traditional faction booster method: ${name} (ID: ${id})`);
        const token = getNSTStyleToken() || getPageCsrfToken();
        if (!token) {
            console.error('BoosterAlerts: No token for traditional faction method');
            showNotification('Unable to use faction booster: No token (retry)', 'error');
            sessionStorage.removeItem('boosterUseInProgress');
            updateBoosterCountDisplay(id, originalCount); // Revert count (updates global state + storage)
            return;
        }
        useFactionBoosterWithToken(id, name, token, originalCount); // Pass count
    }

    function useFactionBoosterWithToken(id, name, token, originalCount) {
        let armouryItemID = findArmouryItemId(id, name); // Function handles lookup
        if (!armouryItemID) {
             debugLog(`[useFacToken] Could not find specific armouryItemID for ${name} (ID: ${id}), using item ID as fallback.`);
             armouryItemID = id; // Use the item ID as fallback
        } else {
             debugLog(`[useFacToken] Found specific armouryItemID: ${armouryItemID}`);
        }
        debugLog(`[useFacToken] Using faction booster (traditional) with armouryItemID: ${armouryItemID} for item ${name} (ID: ${id})`);
        const params = new URLSearchParams({ step: 'armoryItemAction', confirm: 'yes', armoryItemID, action: 'use', csrf: token });
        const xhr = new XMLHttpRequest(); xhr.open('POST', 'https://www.torn.com/factions.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() { handleBoosterResponse(this, id, name, 'faction_traditional', originalCount); }; // Pass count
        xhr.onerror = function() {
            debugLog('[useFacToken] Traditional faction network error');
            showNotification(`Error using ${name}: Network error`, 'error');
            sessionStorage.removeItem('boosterUseInProgress');
            updateBoosterCountDisplay(id, originalCount); // Revert count (updates global state + storage)
        };
        xhr.send(params.toString());
    }

    // Updated findArmouryItemId to be more robust
    function findArmouryItemId(itemId, itemName) {
        itemId = parseInt(itemId); // Ensure number comparison
        const itemTypeSelectors = ['boosters', 'medical', 'drugs', 'temporary']; // Add other types if needed
        for (const itemType of itemTypeSelectors) {
             // Selectors targeting list items with data-itemid (preferred) or data-id
             const selectors = [
                 `#armoury-${itemType} ul.items-list > li[data-itemid="${itemId}"]`, // React armoury?
                 `#faction-armoury .${itemType}-wrap ul.item-list > li[data-id="${itemId}"]`, // Older armoury
                 `div[class*="armory"] div[class*="${itemType}"] div[class*="item"][data-id="${itemId}"]` // Generic fallback
             ];
             for (const selector of selectors) {
                 const itemLi = document.querySelector(selector);
                 if (itemLi) {
                     debugLog(`[findArmouryId] Found potential itemLi for ${itemName} with selector: ${selector}`);
                     // Confirm name match if possible
                     const nameEl = itemLi.querySelector('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"]');
                     if (nameEl && nameEl.textContent.trim().toLowerCase() === itemName.toLowerCase()) {
                         // Find action element within this specific list item
                         const actionLink = itemLi.querySelector('a[href*="armoryItemID="], button[data-id], a[onclick*="armoryItemAction"], div[data-id]');
                         if (actionLink) {
                             let match = null;
                             if (actionLink.href) match = actionLink.href.match(/armoryItemID=(\d+)/);
                             else if (actionLink.dataset && actionLink.dataset.id) match = [null, actionLink.dataset.id]; // Often the armouryItemID is here
                             else if (actionLink.onclick) match = actionLink.onclick.toString().match(/armoryItemAction\((\d+)/);
                             if (match && match[1]) {
                                  debugLog(`[findArmouryId] Extracted armouryItemID ${match[1]} from actionLink`);
                                  return match[1];
                             }
                         }
                         // Fallback check on the li itself (less reliable for armouryItemID)
                         if (itemLi.getAttribute('data-armoryitemid')) {
                              debugLog(`[findArmouryId] Found armouryItemID ${itemLi.getAttribute('data-armoryitemid')} on li attribute`);
                              return itemLi.getAttribute('data-armoryitemid');
                         }
                         // If action link didn't yield ID, maybe data-id on button is it
                         const buttonWithId = itemLi.querySelector('button[data-id]');
                         if (buttonWithId?.dataset?.id) {
                             debugLog(`[findArmouryId] Extracted armouryItemID ${buttonWithId.dataset.id} from button data-id`);
                             return buttonWithId.dataset.id;
                         }

                         debugLog(`[findArmouryId] Found matching item li for ${itemName}, but couldn't extract specific armouryItemID from action elements.`);
                     } else {
                          debugLog(`[findArmouryId] Found itemLi with ID ${itemId}, but name mismatch. Found: "${nameEl?.textContent.trim()}", Expected: "${itemName}"`);
                     }
                 }
             }
        }
        debugLog(`[findArmouryId] Could not find specific armouryItemID for ${itemName} (ID: ${itemId}). Will use item ID as fallback.`);
        return null; // Return null if not found, let caller handle fallback (will use item ID)
    }


    function submitBoosterUseRequest(id, name, token, originalCount) {
        const params = new URLSearchParams({ step: 'useItem', confirm: 'yes', itemID: id, csrf: token });
        const xhr = new XMLHttpRequest(); xhr.open('POST', 'https://www.torn.com/item.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() { handleBoosterResponse(this, id, name, 'personal', originalCount); }; // Pass count
        xhr.onerror = function() {
            debugLog('[submitRequest] Personal booster network error');
            showNotification(`Error using ${name}: Network error`, 'error');
            sessionStorage.removeItem('boosterUseInProgress');
            updateBoosterCountDisplay(id, originalCount); // Revert count (updates global state + storage)
        };
        xhr.send(params.toString());
    }

    // --- *** MODIFIED handleBoosterResponse *** ---
    function handleBoosterResponse(xhr, id, name, method, originalCount, maybeClearProgress = false) {
        id = parseInt(id); // Ensure ID is number for consistency
        let success = false; // Default to failure
        let cooldown = false; // Flag for cooldown state
        let message = `Error using ${name}: Unknown response`; // Default message
        let isJson = false;
        let responseData = null;
        let rawResponseText = xhr.responseText || ''; // Store raw text

        debugLog(`[handleResponse ${method}] Received response for ${name} (ID: ${id}). Original count: ${originalCount}`);

        if (xhr.status === 200) {
            try {
                // Attempt to parse JSON first
                responseData = JSON.parse(rawResponseText);
                isJson = true;
                debugLog(`[handleResponse ${method}] JSON Response:`, responseData);
                const responseTextFromJson = responseData.text || responseData.message || (responseData.error ? JSON.stringify(responseData.error) : '');

                if (responseData.success) {
                    // Explicit success from JSON
                    success = true;
                    message = responseTextFromJson || `Used ${name} successfully!`;
                } else if (responseTextFromJson && responseTextFromJson.includes('<span class="counter-wrap"')) {
                    // *** NEW: Cooldown with timer span (JSON) ***
                    cooldown = true;
                    success = false; // Ensure success is false for cooldown
                    message = responseTextFromJson; // Use the raw HTML message with the span
                    debugLog(`[handleResponse ${method}] Detected cooldown with timer span (JSON).`);
                } else if (responseTextFromJson && (responseTextFromJson.includes('cooldown') || responseTextFromJson.includes('effect of a booster') || responseTextFromJson.includes('wait'))) {
                    // Generic cooldown without timer (JSON)
                    cooldown = true;
                    success = false; // Ensure success is false
                    message = extractCooldownMessage(responseTextFromJson, 'Booster') || 'You are on booster cooldown or effect already active.';
                    debugLog(`[handleResponse ${method}] Detected generic cooldown (JSON).`);
                } else {
                    // Other JSON error
                    success = false;
                    const tempDiv = document.createElement('div'); tempDiv.innerHTML = responseTextFromJson || '';
                    message = `Error: ${(tempDiv.textContent || tempDiv.innerText || responseTextFromJson || 'Unknown error').trim()}`;
                }
            } catch (e) {
                // Response is likely HTML/Text
                isJson = false;
                debugLog(`[handleResponse ${method}] Text Response (first 200 chars):`, rawResponseText.substring(0, 200));

                if (rawResponseText.includes('<span class="counter-wrap"')) {
                     // *** NEW: Cooldown with timer span (HTML/Text) ***
                    cooldown = true;
                    success = false; // Ensure success is false
                    message = rawResponseText; // Use the raw HTML message with the span
                    debugLog(`[handleResponse ${method}] Detected cooldown with timer span (HTML/Text).`);
                } else if (rawResponseText.includes('consumed') || rawResponseText.includes('used')) {
                    // Success based on keywords (HTML/Text) - check this *after* specific cooldown span
                    success = true;
                    const successMatch = rawResponseText.match(/<div[^>]*class=["'][^"']*success[^"']*["'][^>]*>(.*?)<\/div>/i)
                                      || rawResponseText.match(/<p[^>]*class=["'][^"']*msg[^"']*["'][^>]*>(.*?)<\/p>/i);
                    message = successMatch ? (successMatch[1].replace(/<[^>]+>/g, '').trim() || `Used ${name} successfully!`) : `Used ${name} successfully!`;
                } else if (rawResponseText.includes('cooldown') || rawResponseText.includes('effect of a booster') || rawResponseText.includes('wait')) {
                    // Generic cooldown without timer (HTML/Text)
                    cooldown = true;
                    success = false; // Ensure success is false
                    message = extractCooldownMessage(rawResponseText, 'Booster') || 'You are on booster cooldown or effect already active.';
                    debugLog(`[handleResponse ${method}] Detected generic cooldown (HTML/Text).`);
                } else {
                    // Other HTML/Text error
                    success = false;
                    const errorMatch = rawResponseText.match(/<[^>]*class=['"]error['"][^>]*>(.*?)<\/|Validation failed|Error:|not authorized/i);
                    if (errorMatch) { message = `Error: ${(errorMatch[1] || 'Validation failed').replace(/<[^>]+>/g, '').trim()}`; }
                    else { message = `Error using ${name}: Unexpected response`; }
                }
            }
        } else {
            // HTTP error
            success = false;
            message = `Error using ${name}: Request failed (${xhr.status})`;
        }

        // Show the resulting notification
        // Use 'info' type for cooldown messages, 'error' for others failures
        showNotification(message, success ? 'success' : (cooldown ? 'info' : 'error'));

        // --- Revert Count Logic ---
        // This block now correctly handles cooldowns because 'success' will be false
        if (!success) {
            debugLog(`[handleResponse ${method}] Usage failed or cooldown for ${name} (ID: ${id}). Reverting count to ${originalCount}.`);
            updateBoosterCountDisplay(id, originalCount); // Revert count (updates global state + storage)
        } else {
             debugLog(`[handleResponse ${method}] Usage successful for ${name} (ID: ${id}). Count remains decremented.`);
             // Count was already updated optimistically and saved in updateBoosterCountDisplay
        }
        // --- End Revert Logic ---


        // Clear progress state if appropriate
        // Clear if success, cooldown, or if it's the final method attempted (personal or traditional faction)
        if (success || cooldown || method === 'faction_traditional' || method === 'personal') {
             debugLog(`[handleResponse ${method}] Clearing boosterUseInProgress.`);
             sessionStorage.removeItem('boosterUseInProgress');
        } else if (maybeClearProgress && (success || cooldown)) {
             // This case handles clearing if the *first* faction method (direct) succeeds/hits cooldown
             debugLog(`[handleResponse ${method}] Clearing boosterUseInProgress (maybeClear=true).`);
             sessionStorage.removeItem('boosterUseInProgress');
        }

        // Trigger cooldown check if success or cooldown detected
        if (success || cooldown) {
            setTimeout(startCooldownChecks, 500);
        }
    }
    // --- *** END MODIFIED handleBoosterResponse *** ---

    // Helper to extract cleaner cooldown message (if needed, but now we pass raw HTML for timer)
    function extractCooldownMessage(html, type = 'Booster') {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            // Prioritize specific messages
            let msgElement = tempDiv.querySelector('.msg');
            if (msgElement) return msgElement.textContent.trim();
            let errorElement = tempDiv.querySelector('.error');
            if (errorElement) return errorElement.textContent.trim();
            // Fallback to generic text content if specific elements aren't found
            return tempDiv.textContent.trim() || `You are on ${type.toLowerCase()} cooldown.`;
        } catch (e) {
            return `You are on ${type.toLowerCase()} cooldown.`; // Fallback
        }
    }


    // *** MODIFIED showNotification to use innerHTML and add timer ***
    function showNotification(message, type = 'info') {
        // Clear previous notifications and their timers
        document.querySelectorAll('.booster-notification').forEach(note => {
            const timerId = note.dataset.timerId;
            if (timerId) {
                clearInterval(parseInt(timerId));
            }
            note.remove();
        });

        const n = document.createElement('div');
        n.className = `booster-notification ${type}`;
        n.innerHTML = message; // Use raw HTML message

        // Special styling for cooldown messages
        if (typeof message === 'string' && (message.toLowerCase().includes('cooldown') || message.includes('counter-wrap'))) { // Check for span too
             n.style.minWidth = '280px';
             n.style.padding = '15px 25px';
        }

        document.body.appendChild(n);

        // --- Add Timer Logic ---
        let intervalId = null;
        const timerSpan = n.querySelector('.counter-wrap[data-time]');
        if (timerSpan) {
            let remainingSeconds = parseInt(timerSpan.dataset.time);

            const updateTimer = () => {
                if (remainingSeconds <= 0) {
                    timerSpan.textContent = "00:00:00"; // Show 0 time when done
                    if (intervalId) clearInterval(intervalId);
                    return;
                }
                // Calculate HH:MM:SS
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = remainingSeconds % 60;

                // Format with leading zeros
                const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                timerSpan.textContent = formattedTime;
                remainingSeconds--;
            };

            updateTimer(); // Initial display
            intervalId = setInterval(updateTimer, 1000);
            n.dataset.timerId = intervalId.toString(); // Store interval ID on the element
            debugLog(`[showNotification] Started timer ${intervalId} for notification.`);
        }
        // --- End Timer Logic ---


        // Animate in
        n.style.transform = 'translate(-50%, -50%) scale(0.9)';
        n.style.opacity = '0';
        void n.offsetWidth; // Trigger reflow
        requestAnimationFrame(() => {
            n.style.transform = 'translate(-50%, -50%) scale(1)';
            n.style.opacity = '1';
        });

        // Schedule removal
        const dur = (type === 'error' || type === 'info') ? 7000 : 4000;
        const removalTimeoutId = setTimeout(() => {
            requestAnimationFrame(() => {
                n.style.opacity = '0';
                n.style.transform = 'translate(-50%, -50%) scale(0.9)';
            });
            n.addEventListener('transitionend', () => {
                if (intervalId) { // Clear timer when notification is fully removed
                    clearInterval(intervalId);
                    debugLog(`[showNotification] Cleared timer ${intervalId} on notification removal.`);
                }
                n.remove();
            }, { once: true });
        }, dur);

        // Store removal timeout ID to potentially clear it if a new notification appears quickly
        n.dataset.removalTimeoutId = removalTimeoutId.toString();

        // Log the message *content* after potential HTML stripping for cleaner console logs
        const tempDivLog = document.createElement('div');
        tempDivLog.innerHTML = message;
        debugLog(`Notification [${type}]: ${(tempDivLog.textContent || tempDivLog.innerText || message).trim()}`);
    }


    function getNSTStyleToken() { try { const r = getRFC(); if (r) return r; } catch (e) {} return null; }
    function extractTokenFromPage() { try { if (typeof window.csrf !== 'undefined' && window.csrf && /^[a-f0-9]{16,}$/i.test(window.csrf)) return window.csrf; if (typeof window.csrf_token !== 'undefined' && window.csrf_token && /^[a-f0-9]{16,}$/i.test(window.csrf_token)) return window.csrf_token; if (typeof $ !== 'undefined' && typeof $.cookie === 'function') { const c = $.cookie('csrf'); if(c && /^[a-f0-9]{16,}$/i.test(c)) return c; } const inputs = document.querySelectorAll('input[name="csrf"], input[name="csrf_token"], input[id="csrf"], input[name="X-Csrf-Token"], input[data-csrf]'); for (const input of inputs) { const t = input.value || input.dataset?.csrf; if(t && /^[a-f0-9]{16,}$/i.test(t)) return t; } const patterns = [ /["']csrf["']\s*:\s*["']([a-f0-9]{16,})["']/, /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, /value=["']([a-f0-9]{16,})["']\s*name=["']csrf["']/ ]; const scripts = document.querySelectorAll('script:not([src])'); for (const script of scripts) { if (!script.textContent) continue; for (const p of patterns) { const m = script.textContent.match(p); if(m && m[1]) return m[1]; } } const meta = document.querySelector('meta[name="csrf-token"]'); if(meta && meta.content && /^[a-f0-9]{16,}$/i.test(meta.content)) return meta.content; } catch (e) {} debugLog('No CSRF token found in page'); return null; }
    function getPageCsrfToken() { return extractTokenFromPage(); }
    function getRFC() { if (typeof $ !== 'undefined' && typeof $.cookie === 'function') { const c = $.cookie('rfc_v'); if(c) return c; } try { const cs = document.cookie.split('; '); for (const c of cs) { const [n, v] = c.split('='); if(n === 'rfc_v') return v; } } catch (e) {} return null; }

    // Keep original cooldown checks and pending alert/booster use logic
    function hasBoosterCooldown() {
        // debugLog('Checking for booster cooldown...'); // Reduce noise
        const boosterCooldownElements = document.querySelectorAll('a[aria-label="Booster Cooldown"], [aria-label^="Booster Cooldown"]');
        if (boosterCooldownElements.length > 0) { for(const el of boosterCooldownElements) { if (el.offsetParent !== null) { debugLog('Cooldown detected: Visible aria-label'); return true; } } }
        const statusIcons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a, [class*="status-icon"], [class*="user-icon"]');
        for (const icon of statusIcons) { if (icon.offsetParent === null) continue; const ariaLabel = icon.getAttribute('aria-label') || ''; const title = icon.getAttribute('title') || ''; const dataContent = icon.getAttribute('data-content') || ''; const iconText = icon.textContent || ''; if (ariaLabel.includes('Booster Cooldown') || title.includes('Booster Cooldown') || dataContent.includes('Booster Cooldown') || iconText.includes('Booster Cooldown')) { debugLog('Cooldown detected: Text/Attribute phrase match'); return true; } if (icon.className && typeof icon.className === 'string' && icon.className.includes('booster-cooldown')) { debugLog('Cooldown detected: Specific class name'); return true; } }
        return false;
       }
    function checkForPendingAlert() { try { const fromAlert = sessionStorage.getItem('fromBoosterAlert'); if (fromAlert) { sessionStorage.removeItem('fromBoosterAlert'); const isItemsPage = window.location.href.includes('torn.com/item.php'); const isFacArmouryPage = window.location.href.includes('factions.php') && window.location.hash.startsWith('#/tab=armoury'); const onCorrectPage = (isItemsPage && !useFactionBoosters) || (isFacArmouryPage && useFactionBoosters); if (onCorrectPage) { setTimeout(() => { if (!hasBoosterCooldown()) { if (!alertElements) alertElements = createAlert(); if (alertElements && alertElements.gui) alertElements.gui.style.display = 'block'; } }, 1500); } } const boosterProgress = sessionStorage.getItem('boosterUseInProgress'); if (boosterProgress) { try { const d = JSON.parse(boosterProgress); if (Date.now() - d.timestamp > 60000) sessionStorage.removeItem('boosterUseInProgress'); } catch(e) { sessionStorage.removeItem('boosterUseInProgress'); } } } catch (e) { debugLog('Error in checkForPendingAlert:', e); sessionStorage.removeItem('boosterUseInProgress'); sessionStorage.removeItem('fromBoosterAlert'); } }
    function startCooldownChecks() {
        if (cooldownCheckInterval) clearInterval(cooldownCheckInterval); if (cooldownObserver) cooldownObserver.disconnect();
        const checkCooldownLogic = () => {
            const hasCooldown = hasBoosterCooldown();
            // debugLog(`Cooldown check: ${hasCooldown ? 'ON' : 'OFF'}`);
            const currentAlert = document.querySelector('.booster-alert');
            if (!hasCooldown) {
                if (!currentAlert) {
                    alertElements = createAlert();
                    debugLog('Created "No Boosters" alert');
                    checkForPendingAlert();
                }
            } else if (currentAlert) {
                currentAlert.remove();
                const mainGui = document.getElementById('boosterGui'); if (mainGui) mainGui.remove();
                alertElements = null;
                debugLog('Removed "No Boosters" alert/GUI due to cooldown');
            }
        };
        setTimeout(checkCooldownLogic, 1500); // Initial check
        cooldownObserver = new MutationObserver((mutations) => { const relevant = mutations.some(m => { const t = m.target; const nodes = [...Array.from(m.addedNodes), ...Array.from(m.removedNodes)]; const check = n => n.nodeType === 1 && ((n.className && typeof n.className === 'string' && (n.className.includes('status-icon') || n.className.includes('booster-cooldown'))) || (n.id && n.id.startsWith('icon')) || n.querySelector('[aria-label*="Cooldown"]')); return check(t) || nodes.some(check); }); if (relevant) { debugLog('Relevant DOM mutation for cooldown, re-checking.'); checkCooldownLogic(); } });
        const target = document.querySelector('.status-icons__wrap, .user-icons__wrap, body'); if(target) cooldownObserver.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-label', 'title', 'style'] });
        cooldownCheckInterval = setInterval(checkCooldownLogic, 60000); // Periodic check
        console.log('%c Booster Alerts Cooldown Checks Started ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    }
    function setupForumMutationObserver() { if (!window.location.href.includes('torn.com/forums.php')) return; debugLog('Setting up forum mutation observer'); const forumContainer = document.getElementById('mainContainer') || document.body; const observer = new MutationObserver((mutations) => { const titleChanged = mutations.some(m => [...Array.from(m.addedNodes), ...Array.from(m.removedNodes)].some(n => n.nodeType === 1 && n.classList && n.classList.contains('content-title'))); if (titleChanged) { debugLog('Forum content title changed, re-evaluating alert placement'); setTimeout(startCooldownChecks, 750); } }); observer.observe(forumContainer, { childList: true, subtree: true, attributes: false }); debugLog('Forum mutation observer started'); }
    function checkPendingFactionBoosterUse() {
        const pendingUseData = sessionStorage.getItem('pendingFactionBoosterUse');
        if (pendingUseData) {
            try {
                const pendingUse = JSON.parse(pendingUseData);
                // *** UPDATED: Check if on faction page AND hash starts with #/tab=armoury ***
                 const isFacArmouryPage = window.location.href.includes('factions.php') && window.location.hash.startsWith('#/tab=armoury');
                if (isFacArmouryPage && pendingUse.id && pendingUse.name) {
                    debugLog(`Processing pending faction booster use: ${pendingUse.name}`);
                    sessionStorage.removeItem('pendingFactionBoosterUse');
                    // Use the stored original count if available, otherwise assume 1 (it will be reverted if it fails anyway)
                    const originalCount = pendingUse.originalCount !== undefined ? pendingUse.originalCount : 1;
                    setTimeout(() => {
                         // Re-check faction setting just before using
                         useFactionBoosters = localStorage.getItem('useFactionBoosters') === 'true';
                         if (useFactionBoosters) {
                             useBooster(pendingUse.id, pendingUse.name); // useBooster handles count decrement internally now
                         } else {
                              debugLog("Pending faction use detected, but user switched back to personal inventory. Aborting.");
                         }
                    }, 1500);
                } else if (!isFacArmouryPage) {
                    debugLog('Still not on faction armoury page, keeping pending use data');
                } else {
                    debugLog('Clearing invalid pending faction booster use data');
                    sessionStorage.removeItem('pendingFactionBoosterUse');
                }
            } catch (e) {
                debugLog('Error processing pending faction booster use:', e);
                sessionStorage.removeItem('pendingFactionBoosterUse');
            }
        }
    }
    // --- End Core Logic ---

    // --- *** Item List Observer Function (for Initial Load) *** ---
    /**
     * Observes the item list container for initial population.
     * @param {HTMLElement} targetContainer - The DOM element containing the item lists (e.g., #category-wrap).
     * @param {string} itemSelector - The CSS selector for individual items within the container (e.g., li[data-item]).
     */
    function observeItemListContainerOnce(targetContainer, itemSelector) {
        if (itemListObserver) {
            itemListObserver.disconnect();
            debugLog('[observeItemListOnce] Disconnected previous item list observer.');
        }

        const handleMutations = (mutations, observer) => {
            const itemsAdded = mutations.some(mutation =>
                Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === 1 && (node.matches(itemSelector) || node.querySelector(itemSelector))
                )
            );

            if (itemsAdded) {
                debugLog('[observeItemListOnce] Detected initial item nodes added. Fetching counts and building panel.');
                observer.disconnect(); // *** Disconnect after first detection ***
                debugLog('[observeItemListOnce] Disconnected item list observer after initial detection.');
                itemListObserver = null; // Clear reference

                // No debounce needed here as we disconnect immediately
                fetchInitialBoosterCounts(useFactionBoosters, targetContainer);
                buildOrRebuildQuickUsePanel();
                panelBuilt = true; // Mark panel as built for this load cycle
            }
        };

        itemListObserver = new MutationObserver(handleMutations);

        try {
            itemListObserver.observe(targetContainer, {
                childList: true,
                subtree: true
            });
            debugLog('[observeItemListOnce] Initial item list observer attached to:', targetContainer);

            // Initial check in case items loaded *before* observer attached
            setTimeout(() => {
                // Check if panel not built yet AND the container now has items matching the selector
                if (!panelBuilt && targetContainer.querySelector(itemSelector)) {
                    debugLog('[observeItemListOnce] Items already present on initial check. Fetching counts.');
                    if (itemListObserver) itemListObserver.disconnect(); // Disconnect if we handle it here
                    itemListObserver = null; // Clear reference
                    fetchInitialBoosterCounts(useFactionBoosters, targetContainer);
                    buildOrRebuildQuickUsePanel();
                    panelBuilt = true;
                } else if (!panelBuilt) {
                    debugLog('[observeItemListOnce] Items not present on initial check. Waiting for observer...');
                }
            }, 100);

        } catch (e) {
            console.error("BoosterAlerts: Failed to observe item list container:", targetContainer, e);
        }
    }
    // --- *** END: Item List Observer Function *** ---

    // --- *** Function to handle delayed scan after navigation *** ---
    function handleDelayedScan() {
         debugLog(`[handleDelayedScan] Running delayed scan.`); // Generic log message
         const containerSelector = useFactionBoosters
             ? '#faction-armoury .armoury-list-wrap, #armoury-boosters ul.item-list, #armoury-medical ul.item-list, #armoury-drugs ul.item-list, #armoury-temporary ul.item-list' // Include all potential list ULs
             : 'div#category-wrap > ul.ui-tabs-panel:not([aria-hidden="true"])'; // *** Find the VISIBLE item list UL ***
         const targetContainer = document.querySelector(containerSelector); // Find the currently visible container
         fetchInitialBoosterCounts(useFactionBoosters, targetContainer || document); // Scan within that container or fallback to document
         buildOrRebuildQuickUsePanel();
    }
    // --- *** END: Delayed Scan Function *** ---

    // --- *** Click handler for item page tabs *** ---
    function handleItemTabClick(event) {
        // Check if the click originated from a tab link within the item page's tab list
        const tabLink = event.target.closest('div[class*="items-cont"] ul[role="tablist"] a[href^="#"]');
        if (!tabLink) return; // Ignore clicks outside tab links

        // Ignore if not on item.php or if using faction boosters
        if (!window.location.href.includes('item.php') || useFactionBoosters) return;

        debugLog(`[handleItemTabClick] Click detected on item tab link: ${tabLink.href}`);
        const targetHash = tabLink.hash; // Get the hash like #alcohol-items

        // Check hash immediately after event processing (for debugging)
        setTimeout(() => {
            debugLog(`[handleItemTabClick] location.hash after click event: ${location.hash}`);
        }, 0);

        // Directly schedule the delayed scan, as hashchange might not be reliable
        debugLog(`[handleItemTabClick] Scheduling delayed scan with hardcoded delay 750.`); // Added log
        clearTimeout(window.boosterAlertDelayedScanTimeout); // Clear previous if user clicks rapidly
        // *** Use direct value for delay ***
        window.boosterAlertDelayedScanTimeout = setTimeout(handleDelayedScan, 750); // Use direct value, corresponds to TAB_SWITCH_RESCAN_DELAY
    }
    // --- *** END: Click handler *** ---

    // --- *** Simple hashchange logger for debugging *** ---
    function logHashChange() {
        debugLog(`[HashChangeLogger] hashchange event detected! New hash: ${location.hash}`);
        // We still call initialize here to ensure cleanup happens,
        // but the actual scan is triggered by the click handler's delayed scan
        initialize();
    }
    // --- *** END: Hashchange logger *** ---


    // --- Initialization ---
    function initialize() {
        // Announce Version
        console.log(`%c Booster Alerts v${SCRIPT_VERSION} Initializing (isInitialLoad: ${isInitialLoad})`, 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
        if(DEBUG_MODE) debugLog('Using DEBUG_MODE');

        const wasInitialLoad = isInitialLoad; // Store current state
        isInitialLoad = false; // Subsequent runs are not initial load

        useFactionBoosters = localStorage.getItem('useFactionBoosters') === 'true';
        panelBuilt = false; // Reset panel built flag on each initialization

        // --- Cleanup ---
        if (coopObserver) coopObserver.disconnect();
        if (itemListObserver) itemListObserver.disconnect();
        if (navigationObserver) navigationObserver.disconnect();
        if (cooldownObserver) cooldownObserver.disconnect();
        if (waitForContainerObserver) waitForContainerObserver.disconnect(); // Clear container observer

        if (coopAdjustInterval) clearInterval(coopAdjustInterval);
        if (cooldownCheckInterval) clearInterval(cooldownCheckInterval);
        clearTimeout(window.boosterAlertPanelRebuildTimeout);
        clearTimeout(window.boosterAlertDelayedScanTimeout); // Clear delayed scan timer
        clearTimeout(waitForContainerTimeout); // Clear container timeout
        // --- End Cleanup ---


        checkPendingFactionBoosterUse();
        startCooldownChecks();
        setupForumMutationObserver();
        setupCooperativePositioning();

        // --- Wait for Item List / Trigger Scan ---
        const isItemsPage = window.location.href.includes('item.php');
        // *** UPDATED: Check if on faction page AND hash starts with #/tab=armoury ***
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.hash.startsWith('#/tab=armoury');
        const isRelevantPage = (isItemsPage && !useFactionBoosters) || (isFactionArmouryPage && useFactionBoosters);

        // *** ADDED DEBUG LOGGING ***
        debugLog(`[initialize] State Check: isItemsPage=${isItemsPage}, isFactionArmouryPage=${isFactionArmouryPage}, useFactionBoosters=${useFactionBoosters}, isRelevantPage=${isRelevantPage}`);


        if (isRelevantPage) {
            debugLog("[initialize] Relevant page detected. Proceeding with observer logic.");

            // Define selectors
            const containerSelector = useFactionBoosters
                ? '#faction-armoury .armoury-list-wrap, #armoury-boosters ul.item-list, #armoury-medical ul.item-list, #armoury-drugs ul.item-list, #armoury-temporary ul.item-list' // Include specific list ULs for faction
                : '#category-wrap'; // *** Wait for the category wrap div on item page ***
            const itemSelector = useFactionBoosters
                ? '#faction-armoury ul.item-list > li, #armoury-boosters ul.item-list > li, #armoury-medical ul.item-list > li, #armoury-drugs ul.item-list > li, #armoury-temporary ul.item-list > li' // Match list items in those ULs
                : 'li[data-item]';
             // *** Stable parent to observe for container appearance ***
            const parentSelector = 'body'; // Use body as the stable parent

            if (wasInitialLoad) {
                // --- Initial Load Logic: Use Observer to wait for container ---
                debugLog("[initialize] Initial load: Waiting for container via observer.");

                const parentContainer = document.querySelector(parentSelector); // Should always find body
                if (!parentContainer) {
                     // This should realistically never happen
                     console.error(`[initialize] Initial load: Could not find parent container ('${parentSelector}')!`);
                     // Fallback: Try direct build after a longer delay
                     setTimeout(() => {
                         debugLog("[initialize] Initial load: Fallback build after parent container not found.");
                         fetchInitialBoosterCounts(useFactionBoosters, document);
                         buildOrRebuildQuickUsePanel();
                         panelBuilt = true;
                     }, 3000);
                } else {
                    // Check if container already exists
                    let targetContainer = parentContainer.querySelector(containerSelector);
                    if (targetContainer) {
                         debugLog(`[initialize] Initial load: Container '${containerSelector}' already exists. Observing for items.`);
                         observeItemListContainerOnce(targetContainer, itemSelector);
                    } else {
                         // Container doesn't exist yet, observe the parent for it
                         debugLog(`[initialize] Initial load: Container '${containerSelector}' not found. Observing parent '${parentSelector}'.`);
                         clearTimeout(waitForContainerTimeout); // Clear previous timeout just in case

                         waitForContainerObserver = new MutationObserver((mutations, observer) => {
                             let foundContainer = null; // Variable to store the found container
                             for (const mutation of mutations) {
                                  // Log added nodes for debugging
                                  // if (DEBUG_MODE && mutation.addedNodes.length > 0) {
                                  //    debugLog('[waitForContainerObserver] Nodes added:', Array.from(mutation.addedNodes).map(n => n.nodeName + (n.id ? '#'+n.id : '') + (n.className ? '.'+n.className.split(' ').join('.') : '')));
                                  // }

                                  for (const node of mutation.addedNodes) {
                                      if (node.nodeType === 1) {
                                          // Check if the added node *is* the container or *contains* the container
                                          if (node.matches(containerSelector)) {
                                              foundContainer = node;
                                          } else if (typeof node.querySelector === 'function') { // Ensure querySelector exists
                                              foundContainer = node.querySelector(containerSelector);
                                          }

                                          if (foundContainer) {
                                              debugLog(`[initialize] Initial load: Container '${containerSelector}' detected via observer.`);
                                              clearTimeout(waitForContainerTimeout); // Clear timeout
                                              observer.disconnect(); // Stop observing for container
                                              waitForContainerObserver = null;
                                              observeItemListContainerOnce(foundContainer, itemSelector); // Start observing for items
                                              return; // Exit once found
                                          }
                                      }
                                  }
                             }
                         });

                         waitForContainerObserver.observe(parentContainer, { childList: true, subtree: true });

                         // Set a timeout as a fallback
                         waitForContainerTimeout = setTimeout(() => {
                             if (waitForContainerObserver) { // Check if observer is still active
                                 console.warn(`[initialize] Initial load: Timeout (${CONTAINER_WAIT_TIMEOUT}ms) waiting for container '${containerSelector}' via observer. Attempting direct build.`);
                                 waitForContainerObserver.disconnect();
                                 waitForContainerObserver = null;
                                 fetchInitialBoosterCounts(useFactionBoosters, document);
                                 buildOrRebuildQuickUsePanel();
                                 panelBuilt = true;
                             }
                         }, CONTAINER_WAIT_TIMEOUT);
                    }
                }
            } else {
                // --- Navigation/Tab Change Logic: Use Delayed Scan (triggered by click/hashchange) ---
                 debugLog(`[initialize] Navigation/HashChange detected. Scheduling delayed scan.`);
                 clearTimeout(window.boosterAlertDelayedScanTimeout);
                 // *** Use direct value for delay ***
                 window.boosterAlertDelayedScanTimeout = setTimeout(handleDelayedScan, 750); // Corresponds to TAB_SWITCH_RESCAN_DELAY
            }

        } else {
             debugLog("[initialize] Not on relevant item/armoury page or wrong mode. Fetching stored counts and attempting panel build.");
             // Fetch counts anyway to load from sessionStorage, then build panel
             fetchInitialBoosterCounts(useFactionBoosters, document); // Fetch counts from storage
             buildOrRebuildQuickUsePanel(); // Attempt to build (will check relevance again inside)
             panelBuilt = true; // Mark as built (even if panel didn't show)
        }


        // --- Setup Navigation Listeners ---
        // Use MutationObserver for full URL changes
        let lastHref = location.href;
        try {
            navigationObserver = new MutationObserver(() => {
                if (location.href !== lastHref) {
                    lastHref = location.href;
                    debugLog("URL changed (MutationObserver), re-initializing.");
                    isInitialLoad = true; // Treat full navigation like an initial load
                    initialize(); // Re-run the full initialization
                }
            });
            navigationObserver.observe(document.body, { childList: true, subtree: true });
        } catch (e) {
             console.error("BoosterAlerts: Failed to observe body for URL changes:", e);
        }

        // Add hashchange listener (primarily for logging now)
        window.addEventListener('hashchange', logHashChange);
        // Add click listener for item tabs
        document.body.addEventListener('click', handleItemTabClick, true); // Use capture to catch early

        debugLog("[initialize] Added navigation listeners (MutationObserver, hashchange logger, click listener).");
        // --- End Navigation Listeners ---
    }

    // Wrapper function to start initialization
    function runInitialization() {
        console.log('[BoosterAlert Script] DOM ready, running initialization.');
        isInitialLoad = true; // Set flag for the very first run
        initialize();
    }

    // Start the script execution
    try {
        setTimeout(() => { // Delay slightly
             if (document.readyState === 'complete' || document.readyState === 'interactive') {
                 runInitialization();
             } else {
                 window.addEventListener('DOMContentLoaded', runInitialization, { once: true });
             }
        }, 250);
    } catch (e) {
        console.error("BoosterAlerts: Critical error during initial setup:", e);
    }

})();
