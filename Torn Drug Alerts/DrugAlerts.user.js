// ==UserScript==
// @name         Torn Drug Alert
// @version      1.2.6
// @description  Alerts when no drug cooldown is active, shows counts, Faster panel loading on tab switch.
// @author       GNSC4 [268863]
// @match        https://www.torn.com/*
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.user.js
// @grant        GM_addStyle
// @grant        GM_info
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// ==/UserScript==

(function() {
    'use strict';

    // Check if we're on an attack page and exit early if true
    if (window.location.href.includes('sid=getInAttack') || 
    window.location.href.includes('sid=attack') || 
    window.location.href.includes('loader2.php') ||
    window.location.href.includes('sid=travel') ||
    window.location.pathname.includes('loader2.php')) {
    console.log('Drug Alerts: Not initializing on Attack page or Travel page.');
    return;
    }

    // --- Configuration ---
    let DEBUG_MODE = false; // Set true for console logs
    const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '1.2.5'; // Updated version
    const SESSION_STORAGE_KEY = 'drugAlerts_KnownCounts';
    const INITIAL_SCAN_DELAY = 1000; // Slightly reduced initial delay
    const TAB_SCAN_DELAY = 300; // Delay after tab click before scanning (reduced from observer timeout)
    const FACTION_FALLBACK_TIMEOUT = 2000;
    // --- End Configuration ---


    // Default Drug Colors Definition
    const defaultDrugColors = { 196: '#7CB342', 197: '#03A9F4', 198: '#9C27B0', 199: '#FFEB3B', 200: '#A1887F', 201: '#E53935', 203: '#5E35B1', 204: '#FB8C00', 205: '#546E7A', 206: '#43A047', default: '#9E9E9E' };
    function getDefaultDrugColor(id) { return defaultDrugColors[parseInt(id)] || defaultDrugColors.default; }

    // --- Text Color Adjustment Helpers ---
    function hexToRgb(hex) { if (!hex || typeof hex !== 'string') return null; let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i; hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b); let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null; }
    function getBrightness(hexColor) { const rgb = hexToRgb(hexColor); if (!rgb) return 0; return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000; }
    function getTextColorBasedOnBackground(hexBgColor, threshold = 150) { return getBrightness(hexBgColor) > threshold ? '#000000' : '#FFFFFF'; }
    // --- END Text Color Helpers ---

    // --- Global State ---
    let alertElements = null;
    let drugList = [];
    let useFactionDrugs = localStorage.getItem('useFactionDrugs') === 'true';
    let drugCounts = {};
    let cooldownCheckInterval = null;
    let cooldownObserver = null;
    let isInitialLoad = true;
    let tabScanTimeout = null; // Timeout for delayed scan after tab click
    let currentPanelInstance = null; // Reference to the currently attached panel
    // --- End Global State ---

    function debugLog(...args) { if (DEBUG_MODE) { console.log('[DrugAlerts Debug]', ...args); } }

    // Add CSS (Added margin-top/bottom to maximized state, removed from minimized state)
    GM_addStyle(`
        .drug-alert { background-color: #ff3333; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; margin-left: 15px; display: inline-flex; align-items: center; font-size: 12px; vertical-align: middle; }
        .drug-gui, #drug-customization-ui, #add-drugs-ui { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #222; color: white; padding: 20px; border-radius: 8px; z-index: 9999998; width: 90vw; max-width: 350px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444; display: none; box-sizing: border-box; }
        .drug-gui h3, #drug-customization-ui h3, #add-drugs-ui h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .drug-gui input[type="text"], #add-drugs-ui input[type="text"] { width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #444; background-color: #333; color: white; border-radius: 3px; box-sizing: border-box; }
        .drug-gui input[type="text"]::placeholder, #add-drugs-ui input[type="text"]::placeholder { color: #aaa; }
        .drug-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 10px; margin-top: 10px; }
        .drug-item { background-color: #333; padding: 12px; border-radius: 5px; text-align: center; cursor: pointer; transition: background-color 0.2s; font-size: 13px; font-weight: bold; word-wrap: break-word; }
        .drug-item:hover { background-color: #444; }
        .drug-notification { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 15px 20px; border-radius: 5px; color: white; z-index: 99999999; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4); opacity: 1; transition: opacity 0.5s, transform 0.3s ease-out; text-align: center; min-width: 250px; max-width: 80%; pointer-events: none; }
        .drug-notification.success { background-color: rgba(76, 175, 80, 0.9); border: 1px solid #4CAF50; }
        .drug-notification.error { background-color: rgba(244, 67, 54, 0.9); border: 1px solid #f44336; }
        .drug-notification.info { background-color: rgba(33, 150, 243, 0.9); border: 1px solid #2196F3; }
        .drug-notification .counter-wrap { font-weight: bold; }
        /* --- START: Updated Spacing --- */
        .drug-quick-use-container {
            position: fixed;
            top: 150px;
            right: 20px;
            background-color: rgba(34, 34, 34, 0.85);
            padding: 10px;
            border-radius: 5px;
            z-index: 9998;
            display: flex;
            flex-direction: column;
            gap: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: top 0.3s ease, padding 0.3s ease;
            border: 1px solid #555;
            max-width: 180px;
            margin-top: 15px;    /* Add 15px space above when maximized */
            margin-bottom: 15px; /* Add 15px space below when maximized */
        }
        .drug-quick-use-container[data-minimized="true"] {
            margin-top: 15;
            margin-bottom: 15;
        }
        /* --- END: Updated Spacing --- */
        .drug-quick-button { border: 1px solid #555; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: bold; margin-bottom: 5px; text-align: left; transition: background-color 0.2s, filter 0.2s; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; justify-content: space-between; align-items: center; }
        .drug-quick-button-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1; margin-right: 5px; }
        .drug-quick-button-count { font-size: 11px; font-weight: normal; background-color: rgba(0, 0, 0, 0.2); padding: 1px 4px; border-radius: 2px; margin-left: 5px; flex-shrink: 0; min-width: 18px; text-align: right; }
        .drug-quick-button:hover { filter: brightness(1.2); }
        .drug-settings-button { background-color: #555; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: bold; text-align: center; font-size: 12px; transition: background-color 0.2s; display: block; margin-top: 5px; }
        .drug-settings-button:hover { background-color: #666; }
        .drug-quick-use-toggle-button { position: absolute; top: -8px; right: -8px; background-color: #f44336; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.5); z-index: 1; }
        .quick-use-slider-toggle-container { display: flex; align-items: center; padding: 6px 0 10px 0; margin-bottom: 5px; border-bottom: 1px solid #444; cursor: pointer; }
        .quick-use-slider-toggle-label { font-size: 11px; color: #ccc; flex-grow: 1; margin-right: 8px; text-align: left; }
        .quick-use-slider { width: 40px; height: 20px; background-color: #ccc; border-radius: 10px; position: relative; transition: background-color 0.3s ease; flex-shrink: 0; border: 1px solid #555; }
        .quick-use-slider::after { content: ''; position: absolute; width: 16px; height: 16px; background-color: white; border-radius: 50%; top: 1px; left: 1px; transition: left 0.3s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.3); }
        .quick-use-slider.inventory-mode { background-color: #4CAF50; }
        .quick-use-slider.faction-mode { background-color: #f44336; }
        .quick-use-slider.faction-mode::after { left: calc(100% - 17px); }
        .drug-quick-use-container[data-minimized="true"] .drug-quick-button,
        .drug-quick-use-container[data-minimized="true"] .drug-settings-button,
        .drug-quick-use-container[data-minimized="true"] .quick-use-slider-toggle-container {
            display: none;
        }
        #drug-customization-ui p { margin-bottom: 15px; font-size: 14px; }
        .drug-selection-area { margin-bottom: 15px; border: 1px solid #444; border-radius: 5px; padding: 10px; max-height: 250px; overflow-y: auto; background-color: #2a2a2a; }
        .drug-selection-item { display: flex; align-items: center; padding: 8px; margin-bottom: 5px; background-color: #333; border-radius: 4px; cursor: pointer; transition: opacity 0.2s; border: 1px solid #444; }
        .drug-selection-item[draggable="true"] { opacity: 0.5; border: 1px dashed #888; }
        .drug-selection-item span:first-of-type { margin-right: 10px; cursor: move; user-select: none; color: #888; }
        .drug-selection-item input[type="checkbox"] { margin-right: 10px; cursor: pointer; flex-shrink: 0; }
        .drug-selection-item span:nth-of-type(2) { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 10px;}
        .drug-selection-item input[type="color"] { width: 30px; height: 30px; border: 1px solid #555; background: none; cursor: pointer; vertical-align: middle; margin-left: auto; padding: 0; border-radius: 3px; flex-shrink: 0; }
        .customization-button { background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex-grow: 1; margin: 0 5px; transition: background-color 0.2s, filter 0.2s; font-size: 13px; font-weight: bold; }
        .customization-button.cancel { background-color: #f44336; }
        .customization-button.add { width: calc(100% - 10px); margin-bottom: 15px; box-sizing: border-box; background-color: #2196F3; }
        .customization-button:hover { filter: brightness(1.1); }
        .customization-button-container { display: flex; justify-content: space-between; margin-top: 15px; }
        #add-drugs-ui input[type="text"] { width: 100%; padding: 10px; margin-bottom: 15px; background-color: #333; border: 1px solid #444; border-radius: 4px; color: white; box-sizing: border-box; font-size: 14px; }
        .add-drug-list-container { margin-bottom: 15px; max-height: 300px; overflow-y: auto; border: 1px solid #444; border-radius: 4px; padding: 5px; background-color: #2a2a2a; }
        .add-drug-item { display: flex; align-items: center; padding: 8px; margin-bottom: 5px; background-color: #333; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; border: 1px solid #444; }
        .add-drug-item.selected { background-color: #444; border-color: #555; font-weight: bold; }
        .add-drug-item:hover { background-color: #4a4a4a; }
        .add-drug-item input[type="checkbox"] { margin-right: 10px; pointer-events: none; flex-shrink: 0; }
        .add-drug-item span { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .add-drugs-button-container { display: flex; justify-content: flex-end; margin-top: 15px;}
        .add-drugs-done-button { background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s, filter 0.2s; font-size: 13px; font-weight: bold; }
        .add-drugs-done-button:hover { filter: brightness(1.1); }
    `);

    // Fallback drug list
    const fallbackDrugs = [ { id: 196, name: "Cannabis" }, { id: 197, name: "Ecstasy" }, { id: 198, name: "Ketamine" }, { id: 199, name: "LSD" }, { id: 200, name: "Opium" }, { id: 201, name: "PCP" }, { id: 203, name: "Shrooms" }, { id: 204, name: "Speed" }, { id: 205, name: "Vicodin" }, { id: 206, name: "Xanax" } ];

    // --- Drug Count Fetching (Unchanged from v1.5.5) ---
    function fetchInitialDrugCounts(useFaction = false, container = document) { debugLog(`[fetchCounts] Starting drug count fetch. Faction mode: ${useFaction}. Container:`, container); let storedCounts = {}; try { const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY); if (storedData) { storedCounts = JSON.parse(storedData); if (typeof storedCounts !== 'object' || storedCounts === null) storedCounts = {}; } } catch (e) { console.error("DrugAlerts: Error parsing stored drug counts", e); storedCounts = {}; } drugCounts = { ...storedCounts }; const factionItemsSelector = 'ul.item-list > li'; const personalItemsSelector = 'div#category-wrap > ul.ui-tabs-panel:not([aria-hidden="true"]) li[data-item], ul#item-list-wrap > li[data-item]'; const itemsSelector = useFaction ? factionItemsSelector : personalItemsSelector; const isKnownDrug = (id) => fallbackDrugs.some(drug => drug.id === parseInt(id)); let itemElements = []; try { if (!container || typeof container.querySelectorAll !== 'function') { container = document; } itemElements = Array.from(container.querySelectorAll(itemsSelector)); debugLog(`[fetchCounts] Found ${itemElements.length} potential item elements using selector: "${itemsSelector}" within container.`); } catch (e) { console.error(`[fetchCounts] Error querying selector "${itemsSelector}":`, e); itemElements = []; } if (!useFaction && itemElements.length === 0) { const altSelector = 'li[id^="item"]'; try { const altItemElements = Array.from(container.querySelectorAll(altSelector)); if (altItemElements.length > 0) { itemElements = altItemElements; } } catch(e) {} } if (itemElements.length === 0) { console.warn("[fetchCounts] No item elements found on current tab/view."); } else { itemElements.forEach((itemLi, index) => { if (!(itemLi instanceof HTMLElement)) return; try { let itemId = null, quantity = null, itemName = null; if (useFaction) { itemId = itemLi.getAttribute('data-itemid') || itemLi.getAttribute('data-id'); if (!itemId) { const imgWrap = itemLi.querySelector('div.img-wrap[data-itemid]'); itemId = imgWrap?.dataset.itemid; } if (!itemId || !isKnownDrug(itemId)) return; const nameDiv = itemLi.querySelector('div.name'); const qtySpan = nameDiv?.querySelector('span.qty'); if (nameDiv) { itemName = nameDiv.firstChild?.textContent?.trim().replace(/ x$/, '').trim() || `Faction Drug ${itemId}`; if (qtySpan?.textContent) { quantity = parseInt(qtySpan.textContent.replace(/[\D]/g, '')); } else { const nameMatch = nameDiv.textContent.match(/ x([\d,]+)$/); if (nameMatch && nameMatch[1]) { quantity = parseInt(nameMatch[1].replace(/,/g, '')); itemName = nameDiv.textContent.substring(0, nameMatch.index).trim(); } else { quantity = 1; } } } else { return; } } else { if (itemLi.classList.contains('clear') || itemLi.classList.contains('select-all') || itemLi.classList.contains('deselect-all') || !itemLi.querySelector('.name, .title-wrap')) return; itemId = itemLi.getAttribute('data-item') || itemLi.getAttribute('data-itemid'); if (!itemId && itemLi.id && itemLi.id.startsWith('item')) itemId = itemLi.id.replace('item', ''); if (!itemId || !isKnownDrug(itemId)) return; const nameElement = itemLi.querySelector('.name, .title .name, .name-wrap .t-overflow, .item-name'); itemName = nameElement ? nameElement.textContent.trim() : `Drug (ID: ${itemId})`; const dataQty = itemLi.getAttribute('data-qty'); if (dataQty !== null) quantity = parseInt(dataQty); if (quantity === null) { const qtyElement = itemLi.querySelector('.qty, .quantity, .amount'); if (qtyElement?.textContent) { const qtyText = qtyElement.textContent.replace(/[\D]/g, ''); quantity = parseInt(qtyText); } } if (quantity === null) quantity = 1; } itemId = parseInt(itemId); if (isNaN(itemId)) return; if (quantity !== null && !isNaN(quantity) && quantity >= 0) { if (isKnownDrug(itemId)) { drugCounts[itemId] = quantity; } } else { if (drugCounts[itemId] === undefined && isKnownDrug(itemId)) { drugCounts[itemId] = 0; } } } catch (e) { console.error(`[fetchCounts] Error processing drug element index ${index}:`, itemLi, e); } }); } try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(drugCounts)); } catch (e) { console.error("DrugAlerts: Error saving drug counts to sessionStorage", e); } }
    function updateDrugCountDisplay(drugId, newCount) { drugId = parseInt(drugId); newCount = parseInt(newCount); if (isNaN(drugId) || isNaN(newCount)) { return; } drugCounts[drugId] = newCount; try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(drugCounts)); } catch (e) {} let button = document.querySelector(`.drug-quick-button[data-drug-id="${drugId}"]`); const quickUseContainer = document.querySelector('.drug-quick-use-container'); if (button) { const countSpan = button.querySelector('.drug-quick-button-count'); if (countSpan) { countSpan.textContent = `x${newCount}`; const isMinimized = quickUseContainer?.dataset.minimized === 'true'; button.style.display = isMinimized ? 'none' : (newCount > 0 ? 'flex' : 'none'); } } else if (newCount > 0 && quickUseContainer) { const savedDrugs = JSON.parse(localStorage.getItem('customQuickUseDrugs') || '[]'); const drugData = savedDrugs.find(d => parseInt(d.id) === drugId); if (drugData) { const newButton = createQuickUseButtonElement(drugData, newCount); const settingsButton = quickUseContainer.querySelector('.drug-settings-button'); if (settingsButton) { quickUseContainer.insertBefore(newButton, settingsButton); } else { quickUseContainer.appendChild(newButton); } const isMinimized = localStorage.getItem('drugAlertMinimized') === 'true'; if (isMinimized) newButton.style.display = 'none'; } } }
    // --- END Drug Count Fetching ---

    // --- Helper Functions (Unchanged from v1.5.5) ---
    function positionDrugAlert(alert, header) { if (!header || !header.appendChild) { header = createFixedHeader(); } try { if (window.location.href.includes('forums.php')) { const linksWrap = document.querySelector('.links-top-wrap'); if (linksWrap) { linksWrap.appendChild(alert); alert.style.cssText = `display: inline-flex !important; align-items: center !important; margin-left: 15px !important; float: right !important; position: relative !important; z-index: 99999 !important; margin-top: 5px !important; background-color: #ff3333; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; font-size: 12px;`; } else { header.appendChild(alert); } } else { header.appendChild(alert); alert.style.cssText = `display: inline-flex !important; align-items: center !important; margin-left: 10px !important; order: 2 !important; z-index: 99999 !important; pointer-events: auto !important; background-color: #ff3333; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; font-size: 12px; vertical-align: middle;`; } const isMobilePDA = navigator.userAgent.includes('PDA') || window.innerWidth < 768 || document.documentElement.classList.contains('tornPDA'); if (isMobilePDA) { alert.style.fontSize = '10px'; alert.style.padding = '3px 6px'; alert.style.marginLeft = '5px'; } if (header.id === 'torn-drug-fixed-header') { alert.style.margin = '0'; alert.style.marginLeft = '5px'; } } catch (e) { if (alert && !alert.parentElement) { document.body.appendChild(alert); alert.style.position = 'fixed'; alert.style.top = '60px'; alert.style.right = '30px'; alert.style.zIndex = '10000'; } } }
    function findHeader() { const selectors = [ '.content-title h4', '.content-title .title', '.title-black', '.pageTitle___CaFrO', '.appHeader___gUnYC h4', '.captionWithActionContainment___nVTbE', '.topSection___CvKvI', '.mainStatsContainer___TXO7F', 'div[role="heading"]', '.titleContainer___QrlWP .title___rhtB4', '.clearfix .t-black', '.page-head > h4', '.header-title', '.mobile-title', '.app-header', '.content-title.m-bottom10', '.forum-thread-wrap header', '.forum-post-reply', '.forums-subcats', '.forums-threadList', '.content-title.m-bottom10', '.content-wrapper .header', '.content-wrapper .title-black', '.sortable-list .title', '#skip-to-content', '.tutorial-cont', '.cont-gray' ]; const found = selectors.map(s => document.querySelector(s)).find(el => el !== null && el.offsetParent !== null); if (found) return found; if (window.location.href.includes('forums.php')) { const lw = document.querySelector('.links-top-wrap'); if (lw) return lw; } return createFixedHeader(); }
    function createFixedHeader() { let fh = document.getElementById('torn-drug-fixed-header'); if (!fh) { fh = document.createElement('div'); fh.id = 'torn-drug-fixed-header'; Object.assign(fh.style, { position: 'fixed', top: '50px', right: '20px', zIndex: '9999', backgroundColor: 'rgba(34, 34, 34, 0.8)', padding: '5px 10px', borderRadius: '5px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }); document.body.appendChild(fh); } return fh; }
    // --- END Helper Functions ---

    // --- Main Alert & GUI Functions (FIXED to prevent closing) ---
    function createAlert(drugs) {
        let header = findHeader();
        removeExistingAlerts();
        const alert = document.createElement('div');
        alert.className = 'drug-alert';
        alert.textContent = 'No Drugs';
        positionDrugAlert(alert, header);
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');
        const canShowGui = (isItemsPage && !useFactionDrugs) || (isFactionArmouryPage && useFactionDrugs);
        let gui = null;

        if (canShowGui) {
            gui = document.getElementById('drugGui');
            if (!gui) {
                gui = document.createElement('div');
                gui.className = 'drug-gui';
                gui.id = 'drugGui';
                gui.innerHTML = `<h3>Take Drugs</h3><input type="text" class="drug-search" placeholder="Search drugs..."><div class="drug-list"></div>`;
                document.body.appendChild(gui);

                // Modified event listener to check if the click is on any UI elements
                document.addEventListener('click', function closeGui(e) {
                    const cg = document.getElementById('drugGui');
                    const ca = document.querySelector('.drug-alert');

                    // Check if click is on main drug GUI or any of its child elements
                    const isClickOnGui = cg && (cg.contains(e.target) || e.target === cg);

                    // Check if click is on drug alert button
                    const isClickOnAlert = ca && (ca.contains(e.target) || e.target === ca);

                    // Check if click is on any drug-related UI element (customization, add drugs, etc.)
                    const isClickOnCustomUI = e.target.closest('#drug-customization-ui, #add-drugs-ui, .drug-quick-use-container');

                    // Check if click is within notification
                    const isClickOnNotification = e.target.closest('.drug-notification');

                    // Only close if click is outside any drug-related UI elements
                    if (cg && cg.style.display === 'block' && !isClickOnGui && !isClickOnAlert && !isClickOnCustomUI && !isClickOnNotification) {
                        cg.style.display = 'none';
                    }
                });
            }

            const drugListElement = gui.querySelector('.drug-list');
            const searchInput = gui.querySelector('.drug-search');

            function populateDrugList(filter = '') {
                const currentDrugList = drugList || fallbackDrugs;
                drugListElement.innerHTML = '';
                const filtered = currentDrugList.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()));

                if (filtered.length === 0) {
                    drugListElement.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #aaa;">No drugs found</div>';
                    return;
                }

                filtered.forEach(drug => {
                    const item = document.createElement('div');
                    item.className = 'drug-item';
                    item.textContent = drug.name;

                    // Modified to stop event propagation and prevent GUI from closing
                    item.onclick = (e) => {
                        e.stopPropagation(); // Prevent click from bubbling up
                        useDrug(drug.id, drug.name);
                        // Don't hide the GUI, allow user to make multiple selections
                    };

                    drugListElement.appendChild(item);
                });
            }

            populateDrugList();

            if (searchInput && !searchInput.listenerAttached) {
                searchInput.addEventListener('input', (e) => {
                    e.stopPropagation(); // Stop propagation for input events
                    populateDrugList(searchInput.value);
                });
                searchInput.listenerAttached = true;
            }

            gui.style.display = 'none';
        }

        alert.onclick = function(event) {
            event.stopPropagation();
            const currentGui = document.getElementById('drugGui');
            if (canShowGui && currentGui) {
                currentGui.style.display = currentGui.style.display === 'block' ? 'none' : 'block';
                if (currentGui.style.display === 'block') {
                    const si = currentGui.querySelector('.drug-search');
                    if (si) si.focus();
                }
            } else if (canShowGui && !currentGui) {
                removeExistingAlerts();
                alertElements = createAlert(drugList);
                if (alertElements && alertElements.gui) alertElements.gui.style.display = 'block';
            } else {
                const targetUrl = useFactionDrugs ? 'https://www.torn.com/factions.php?step=your#/tab=armoury' : 'https://www.torn.com/item.php';
                sessionStorage.setItem('fromDrugAlert', 'true');
                showNotification(`Navigating to ${useFactionDrugs ? 'faction armoury' : 'items'} page...`, 'info');
                window.location.href = targetUrl;
            }
            return false;
        };

        return { alert, gui };
    }
    // --- END Main Alert & GUI ---

    // --- Quick Use Panel & Customization (FIXED with stopPropagation & positioning) ---
    function createQuickUseButtonElement(drug, count) {
        const drugIdNum = parseInt(drug.id);
        const btn = document.createElement('div');
        btn.className = 'drug-quick-button';
        btn.setAttribute('data-drug-id', drugIdNum);
        btn.setAttribute('data-drug-name', drug.name);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'drug-quick-button-name';
        nameSpan.textContent = drug.name;

        const countSpan = document.createElement('span');
        countSpan.className = 'drug-quick-button-count';
        countSpan.textContent = `x${count}`;

        btn.appendChild(nameSpan);
        btn.appendChild(countSpan);

        const bgColor = drug.color || getDefaultDrugColor(drugIdNum);
        btn.style.backgroundColor = bgColor;
        btn.style.color = getTextColorBasedOnBackground(bgColor);

        // Add stopPropagation to prevent click events from closing panels
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            useDrug(drugIdNum, drug.name);
        });

        return btn;
    }

    function buildOrRebuildQuickUsePanel() {
        debugLog("[buildPanel Drugs] Starting build/rebuild...");

        const existingContainer = document.querySelector('.drug-quick-use-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        currentPanelInstance = null;

        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionPage = window.location.href.includes('factions.php'); // Broader check for faction page

        // *** Determine if we're on the armoury tab specifically ***
        const isArmouryTabActive = isFactionPage && window.location.href.includes('#/tab=armoury');
        const shouldShowQuickUse = (isItemsPage && !useFactionDrugs) || (isArmouryTabActive && useFactionDrugs);

        if (!shouldShowQuickUse) {
            debugLog(`[buildPanel Drugs] Quick Use UI should not be shown. isItemsPage: ${isItemsPage}, useFactionDrugs: ${useFactionDrugs}, isArmouryTabActive: ${isArmouryTabActive}`);
            return;
        }

        debugLog('[buildPanel Drugs] Conditions met, creating Quick Use UI container.');

        const quickUseContainer = document.createElement('div');
        quickUseContainer.className = 'drug-quick-use-container';
        currentPanelInstance = quickUseContainer;

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
                quickUseDrugs.forEach(d => {
                    d.id = parseInt(d.id);
                    if (!d.color) d.color = getDefaultDrugColor(d.id);
                });
            } catch (e) {
                quickUseDrugs = defaultQuickDrugs.map(d => ({ ...d, id: parseInt(d.id), color: getDefaultDrugColor(d.id) }));
                localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs));
            }
        } else {
            quickUseDrugs = defaultQuickDrugs.map(d => ({ ...d, id: parseInt(d.id), color: getDefaultDrugColor(d.id) }));
            localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs));
        }

        quickUseDrugs.forEach(drug => {
            const drugIdNum = parseInt(drug.id);
            const count = drugCounts[drugIdNum] || 0;
            const btn = createQuickUseButtonElement(drug, count);
            quickUseContainer.appendChild(btn);
        });

        // Ensure the slider container has stop propagation
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'quick-use-slider-toggle-container';
        // Add stopPropagation
        sliderContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const sliderLabel = document.createElement('span');
        sliderLabel.className = 'quick-use-slider-toggle-label';
        sliderLabel.textContent = useFactionDrugs ? 'Faction' : 'Inventory';

        const sliderElement = document.createElement('div');
        sliderElement.className = 'quick-use-slider';
        sliderElement.classList.toggle('faction-mode', useFactionDrugs);
        sliderElement.classList.toggle('inventory-mode', !useFactionDrugs);

        sliderContainer.appendChild(sliderLabel);
        sliderContainer.appendChild(sliderElement);
        quickUseContainer.appendChild(sliderContainer);

        // Add stopPropagation to sliderContainer click event
        sliderContainer.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent click from closing other panels
            useFactionDrugs = !useFactionDrugs;
            localStorage.setItem('useFactionDrugs', useFactionDrugs);
            sliderElement.classList.toggle('faction-mode', useFactionDrugs);
            sliderElement.classList.toggle('inventory-mode', !useFactionDrugs);
            sliderLabel.textContent = useFactionDrugs ? 'Source: Faction' : 'Source: Inventory';
            showNotification(`${useFactionDrugs ? 'Using faction armoury drugs' : 'Using personal inventory drugs'}`, 'info');
            drugCounts = {};
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            initialize();
        });

        const settingsButton = document.createElement('div');
        settingsButton.textContent = '⚙️ Edit Drugs';
        settingsButton.className = 'drug-settings-button';

        // Add stopPropagation to settings button
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from propagating to close other panels
            showDrugCustomizationUI(quickUseDrugs);
        });

        quickUseContainer.appendChild(settingsButton);

        const toggleButton = document.createElement('button');
        toggleButton.className = 'drug-quick-use-toggle-button';

        function applyMinimizedState() {
            if (!currentPanelInstance || !document.body.contains(currentPanelInstance)) {
                return;
            }

            let isMinimized = localStorage.getItem('drugAlertMinimized') === 'true';

            // Set the data attribute for CSS
            currentPanelInstance.dataset.minimized = isMinimized.toString();

            // Apply padding
            currentPanelInstance.style.padding = isMinimized ? '2px' : '10px';

            // Update minimize button text
            toggleButton.textContent = isMinimized ? '+' : '–';

            // Show/hide all drug buttons based on minimized state
            currentPanelInstance.querySelectorAll('.drug-quick-button').forEach(btn => {
                // When minimized, hide ALL buttons regardless of count
                // When maximized, only show buttons with count > 0
                const drugId = btn.getAttribute('data-drug-id');
                const currentCount = drugCounts[drugId] || 0;

                btn.style.display = isMinimized ? 'none' : (currentCount > 0 ? 'flex' : 'none');
            });

            // Show/hide settings button based on minimized state
            const settingsButton = currentPanelInstance.querySelector('.drug-settings-button');
            if (settingsButton) {
                settingsButton.style.display = isMinimized ? 'none' : 'block';
            }

            // Show/hide slider toggle container based on minimized state
            const sliderContainer = currentPanelInstance.querySelector('.quick-use-slider-toggle-container');
            if (sliderContainer) {
                sliderContainer.style.display = isMinimized ? 'none' : 'flex';
            }

            adjustQuickUsePosition();
            debugLog(`[applyMinimizedState] Applied state: ${isMinimized ? 'minimized' : 'maximized'}`);
        }

        // Add stopPropagation to toggle button
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from propagating
            let isMinimized = localStorage.getItem('drugAlertMinimized') === 'true';
            isMinimized = !isMinimized;
            localStorage.setItem('drugAlertMinimized', isMinimized.toString());
            applyMinimizedState();
        });

        quickUseContainer.appendChild(toggleButton);
        document.body.appendChild(quickUseContainer);

        applyMinimizedState();
        adjustQuickUsePosition();

        debugLog("[buildPanel Drugs] Panel build complete.");
    }

    // Modified to prevent UI closures due to click propagation
    function showDrugCustomizationUI(currentDrugs) {
        let justOpened = true;
        setTimeout(() => {
            justOpened = false;
        }, 300);

        const existingUI = document.getElementById('drug-customization-ui');
        if (existingUI) existingUI.remove();

        const customizationUI = document.createElement('div');
        customizationUI.id = 'drug-customization-ui';
        customizationUI.innerHTML = `<h3>Customize Quick Use Drugs</h3><p>Select drugs. Drag ≡ to reorder. Click color swatch.</p><div class="drug-selection-area"></div><button class="customization-button add">+ Add More Drugs</button><div class="customization-button-container"><button class="customization-button save">Save Changes</button><button class="customization-button cancel">Cancel</button></div>`;

        // Add stopPropagation to prevent closing other UIs
        customizationUI.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const drugSelectionArea = customizationUI.querySelector('.drug-selection-area');
        const selectedDrugs = JSON.parse(JSON.stringify(currentDrugs)).map(d => ({ ...d, id: parseInt(d.id), color: d.color || getDefaultDrugColor(d.id) }));

        function createColorPicker(drug) {
            const c = document.createElement('input');
            c.type = 'color';
            c.value = drug.color || getDefaultDrugColor(drug.id);

            // Add stopPropagation
            c.addEventListener('input', (e) => {
                e.stopPropagation();
                const item = selectedDrugs.find(d => d.id === drug.id);
                if(item) item.color = e.target.value;
            });

            c.addEventListener('click', (e) => e.stopPropagation());
            return c;
        }

        function renderDrugItem(drug) {
            const id = parseInt(drug.id);
            const i = document.createElement('div');
            i.className = 'drug-selection-item';
            i.setAttribute('data-drug-id', id);
            i.setAttribute('draggable', 'true');

            const h = document.createElement('span');
            h.innerHTML = '≡';
            i.appendChild(h);

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = true;

            // Add stopPropagation
            cb.addEventListener('change', (e) => {
                e.stopPropagation();
                i.style.opacity = cb.checked ? '1' : '0.5';
                i.style.textDecoration = cb.checked ? 'none' : 'line-through';
                if (!cb.checked) i.setAttribute('data-remove', 'true');
                else i.removeAttribute('data-remove');
            });

            i.appendChild(cb);

            const n = document.createElement('span');
            n.textContent = drug.name;
            i.appendChild(n);

            const cp = createColorPicker(drug);
            i.appendChild(cp);

            // Add stopPropagation to entire item
            i.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            drugSelectionArea.appendChild(i);
        }

        selectedDrugs.forEach(renderDrugItem);

        let draggedItemElement = null;

        // Add stopPropagation to drag events
        drugSelectionArea.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            draggedItemElement = e.target.closest('.drug-selection-item');
            if (!draggedItemElement) return;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedItemElement.dataset.drugId);
            setTimeout(() => {
                if (draggedItemElement) draggedItemElement.style.opacity = '0.4';
            }, 0);
        });

        drugSelectionArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target.closest('.drug-selection-item');
            if (target && target !== draggedItemElement) {
                const rect = target.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (e.clientY < mid) drugSelectionArea.insertBefore(draggedItemElement, target);
                else drugSelectionArea.insertBefore(draggedItemElement, target.nextSibling);
            }
        });

        drugSelectionArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        drugSelectionArea.addEventListener('dragend', (e) => {
            e.stopPropagation();
            if (draggedItemElement) draggedItemElement.style.opacity = '1';
            draggedItemElement = null;
            updateOrderAfterDrag();
        });

        function updateOrderAfterDrag() {
            const items = Array.from(drugSelectionArea.querySelectorAll('.drug-selection-item'));
            const reordered = [];
            items.forEach(item => {
                const id = parseInt(item.dataset.drugId);
                let data = selectedDrugs.find(d => d.id === id);
                if (data) {
                    const cp = item.querySelector('input[type="color"]');
                    if (cp) data.color = cp.value;
                    reordered.push(data);
                } else {
                    const orig = fallbackDrugs.find(fb => fb.id === id);
                    if (orig) {
                        const cp = item.querySelector('input[type="color"]');
                        reordered.push({ id: id, name: orig.name, color: cp ? cp.value : getDefaultDrugColor(id) });
                    }
                }
            });
            selectedDrugs.length = 0;
            selectedDrugs.push(...reordered);
        }

        // Add stopPropagation to buttons
        const addButton = customizationUI.querySelector('.customization-button.add');
        addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showAddDrugsUI(selectedDrugs, drugSelectionArea, renderDrugItem);
        });

        const saveButton = customizationUI.querySelector('.customization-button.save');
        saveButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const items = Array.from(drugSelectionArea.querySelectorAll('.drug-selection-item'));
            const final = items.filter(i => !i.hasAttribute('data-remove')).map(i => {
                const id = parseInt(i.dataset.drugId);
                const data = selectedDrugs.find(d => d.id === id);
                const cp = i.querySelector('input[type="color"]');
                return {
                    id: id,
                    name: data ? data.name : fallbackDrugs.find(fb => fb.id === id)?.name || 'Unknown',
                    color: cp ? cp.value : (data ? data.color : getDefaultDrugColor(id))
                };
            });
            localStorage.setItem('customQuickUseDrugs', JSON.stringify(final));
            customizationUI.remove();
            buildOrRebuildQuickUsePanel();
            showNotification('Quick use drugs updated!', 'success');
        });

        const cancelButton = customizationUI.querySelector('.customization-button.cancel');
        cancelButton.addEventListener('click', (e) => {
            e.stopPropagation();
            customizationUI.remove();
            const addUI = document.getElementById('add-drugs-ui');
            if (addUI) addUI.remove();
        });

        document.body.appendChild(customizationUI);
        customizationUI.style.display = 'block';

        // Simplified click outside handler that respects stopPropagation
        function closeOnClickOutside(e) {
            if (justOpened) return;

            // Check if click is on any drug UI element or quick use panel
            const isInDrugUI = e.target.closest('#drug-customization-ui, #add-drugs-ui, .drug-settings-button, .drug-quick-use-container, .drug-gui, .booster-quick-use-container');

            if (!isInDrugUI) {
                const cui = document.getElementById('drug-customization-ui');
                if (cui) cui.remove();
                const aui = document.getElementById('add-drugs-ui');
                if (aui) aui.remove();
                document.removeEventListener('click', closeOnClickOutside, true);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', closeOnClickOutside, true);
        }, 100);
    }

    // Modified showAddDrugsUI to prevent UI closures
    function showAddDrugsUI(selectedDrugsRef, parentDrugSelectionArea, renderDrugItemFn) {
        const existingAddUI = document.getElementById('add-drugs-ui');
        if (existingAddUI) existingAddUI.remove();

        const addDrugsUI = document.createElement('div');
        addDrugsUI.id = 'add-drugs-ui';
        addDrugsUI.innerHTML = `<h3>Add Drugs to Quick Use</h3><input type="text" placeholder="Search available drugs..."><div class="add-drug-list-container"></div><div class="add-drugs-button-container"><button class="add-drugs-done-button">Done</button></div>`;

        // Add stopPropagation to prevent closing other UIs
        addDrugsUI.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const searchBox = addDrugsUI.querySelector('input[type="text"]');
        const listContainer = addDrugsUI.querySelector('.add-drug-list-container');
        const availableDrugs = drugList.length > 0 ? drugList : fallbackDrugs;

        function refreshDrugList(searchTerm = '') {
            listContainer.innerHTML = '';
            const filtered = availableDrugs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

            if (filtered.length === 0) {
                listContainer.innerHTML = '<div style="padding: 10px; color: #aaa;">No drugs found</div>';
                return;
            }

            filtered.forEach(drug => {
                const id = parseInt(drug.id);
                const pItem = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${id}"]`);
                const isSel = pItem && !pItem.hasAttribute('data-remove');
                const item = document.createElement('div');
                item.className = `add-drug-item ${isSel ? 'selected' : ''}`;
                item.setAttribute('data-drug-id', id);

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = isSel;
                cb.style.pointerEvents = 'none';

                const name = document.createElement('span');
                name.textContent = drug.name;

                item.appendChild(cb);
                item.appendChild(name);

                // Add stopPropagation to handleClick
                const handleClick = (e) => {
                    e.stopPropagation();
                    const pOnClick = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${id}"]`);
                    const currentSel = pOnClick && !pOnClick.hasAttribute('data-remove');

                    if (!currentSel) {
                        if (pOnClick) {
                            pOnClick.style.opacity = '1';
                            pOnClick.style.textDecoration = 'none';
                            pOnClick.removeAttribute('data-remove');
                            const pCb = pOnClick.querySelector('input[type="checkbox"]');
                            if(pCb) pCb.checked = true;

                            if (!selectedDrugsRef.some(r => r.id === id)) {
                                const cp = pOnClick.querySelector('input[type="color"]');
                                selectedDrugsRef.push({ ...drug, id: id, color: cp ? cp.value : getDefaultDrugColor(id) });
                            }
                        } else {
                            const newData = { ...drug, id: id, color: getDefaultDrugColor(id) };
                            renderDrugItemFn(newData);
                            selectedDrugsRef.push(newData);
                        }

                        item.classList.add('selected');
                        cb.checked = true;
                    } else {
                        if (pOnClick) {
                            pOnClick.style.opacity = '0.5';
                            pOnClick.style.textDecoration = 'line-through';
                            pOnClick.setAttribute('data-remove', 'true');
                            const pCb = pOnClick.querySelector('input[type="checkbox"]');
                            if(pCb) pCb.checked = false;
                        }

                        item.classList.remove('selected');
                        cb.checked = false;
                    }
                };

                item.addEventListener('click', handleClick);
                listContainer.appendChild(item);
            });
        }

        refreshDrugList();

        // Add stopPropagation to search input
        searchBox.addEventListener('input', (e) => {
            e.stopPropagation();
            refreshDrugList(searchBox.value);
        });

        // Add stopPropagation to done button
        const doneButton = addDrugsUI.querySelector('.add-drugs-done-button');
        doneButton.addEventListener('click', (e) => {
            e.stopPropagation();
            addDrugsUI.remove();
        });

        document.body.appendChild(addDrugsUI);
        addDrugsUI.style.display = 'block';
        addDrugsUI.style.zIndex = '9999999';

        // Prevent clicks inside from closing anything
        addDrugsUI.addEventListener('click', e => {
            e.stopPropagation();
        });

        searchBox.focus();
    }
    // --- END Quick Use Panel & Customization ---

    // --- Core Logic (Unchanged from v1.5.5) ---
    function useDrug(id, name) { const drugIdNum = parseInt(id); debugLog(`[useDrug] Attempting: ${name} (ID: ${drugIdNum}), Faction: ${useFactionDrugs}`); showNotification(`Using ${name}...`, 'info'); const gui = document.getElementById('drugGui'); if (gui) gui.style.display = 'none'; const currentCount = drugCounts[drugIdNum] || 0; if (currentCount > 0) { updateDrugCountDisplay(drugIdNum, currentCount - 1); } else { updateDrugCountDisplay(drugIdNum, 0); } if (useFactionDrugs) { tryFactionDrugUseMethod(drugIdNum, name, currentCount); } else { tryDirectUseMethod(drugIdNum, name, currentCount); } }
    function tryDirectUseMethod(id, name, originalCount) { debugLog(`[tryDirect] Direct use: ${name} (ID: ${id})`); sessionStorage.setItem('drugUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'direct' })); useItemDirectly(id, name, originalCount); }
    function useItemDirectly(id, name, originalCount) { debugLog(`[useDirect] via item.php: ${name} (ID: ${id})`); const token = getNSTStyleToken() || getPageCsrfToken(); if (token) { submitDrugUseRequest(id, name, token, false, originalCount); } else { showNotification(`Unable to use ${name}: No token`, 'error'); sessionStorage.removeItem('drugUseInProgress'); updateDrugCountDisplay(id, originalCount); } }
    function tryFactionDrugUseMethod(id, name, originalCount) { debugLog(`[tryFaction] Faction use: ${name} (ID: ${id}), Original count: ${originalCount}`); sessionStorage.setItem('drugUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'faction_direct' })); const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury'); if (!isFactionArmouryPage) { sessionStorage.setItem('pendingFactionDrugUse', JSON.stringify({ id, name, originalCount })); const targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury'; showNotification(`Navigating to faction armoury for ${name}...`, 'info'); window.location.href = targetUrl; return; } const token = getNSTStyleToken() || getPageCsrfToken(); if (!token) { showNotification('Unable to use faction drug: No token', 'error'); sessionStorage.removeItem('drugUseInProgress'); updateDrugCountDisplay(id, originalCount); return; } debugLog(`[tryFaction] Token: ${token.substring(0, 4)}... Trying item.php?fac=1 first.`); submitDrugUseRequest(id, name, token, true, originalCount); const fallbackTimer = setTimeout(() => { const progress = sessionStorage.getItem('drugUseInProgress'); if (progress) { try { const progressData = JSON.parse(progress); if (progressData && parseInt(progressData.id) === id && progressData.method === 'faction_direct') { sessionStorage.setItem('drugUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'faction_traditional' })); useFactionDrugViaArmouryID(id, name, token, originalCount); } } catch (e) { sessionStorage.removeItem('drugUseInProgress'); } } }, FACTION_FALLBACK_TIMEOUT); try {const progressData = JSON.parse(sessionStorage.getItem('drugUseInProgress') || '{}'); progressData.fallbackTimerId = fallbackTimer; sessionStorage.setItem('drugUseInProgress', JSON.stringify(progressData));} catch(e){} }
    function useFactionDrugViaArmouryID(itemId, itemName, token, originalCount) {
        debugLog(`[useFacArmouryID] Using traditional faction method: ${itemName} (ID: ${itemId})`);
        let armouryItemID = findArmouryItemId(itemId, itemName);
        if (!armouryItemID) {
            showNotification(`Cannot find ${itemName} in faction armoury (Fallback Failed).`, 'error');
            const p = sessionStorage.getItem('drugUseInProgress');
            if (p) {
                try {
                    const pd = JSON.parse(p);
                    if (pd && parseInt(pd.id) === itemId && pd.method === 'faction_traditional') {
                        sessionStorage.removeItem('drugUseInProgress');
                        updateDrugCountDisplay(itemId, originalCount);
                    }
                } catch(e){}
            }
            return;
        }
        submitFactionArmouryRequest(armouryItemID, itemId, itemName, token, originalCount);
    }

    function findArmouryItemId(targetItemId, targetItemName) {
        targetItemId = parseInt(targetItemId);
        debugLog(`[findArmouryId] Searching for Drug: ${targetItemName} (ID: ${targetItemId})`);
        const specificSelectors = [
            `#armoury-drugs ul.item-list li[data-itemid="${targetItemId}"]`,
            `#faction-armoury .drugs-wrap ul.item-list > li[data-id="${targetItemId}"]`
        ];
        const generalSelectors = [
            `#faction-armoury ul.item-list > li[data-id="${targetItemId}"]`,
            `#faction-armoury ul.item-list > li[data-itemid="${targetItemId}"]`,
            `li[data-armoryitemid]`
        ];
        const allSelectors = [...specificSelectors, ...generalSelectors];
        for (const selector of allSelectors) {
            try {
                const itemLi = document.querySelector(selector);
                if (itemLi) {
                    const nameEl = itemLi.querySelector('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"]');
                    const actionLink = itemLi.querySelector('a[href*="armoryItemID="], button[data-id][onclick*="armoryItemAction"], a[onclick*="armoryItemAction"], div[data-id][onclick*="armoryItemAction"]');
                    if (actionLink) {
                        let match = null;
                        if (actionLink.href) match = actionLink.href.match(/armoryItemID=(\d+)/);
                        else if (actionLink.dataset && actionLink.dataset.id && actionLink.onclick && actionLink.onclick.toString().includes('armoryItemAction')) match = [null, actionLink.dataset.id];
                        else if (actionLink.onclick) match = actionLink.onclick.toString().match(/armoryItemAction\((\d+)/);
                        if (match && match[1]) {
                            return match[1];
                        }
                    }
                    const liArmouryId = itemLi.getAttribute('data-armoryitemid');
                    if (liArmouryId) {
                        return liArmouryId;
                    }
                    const liDataId = itemLi.getAttribute('data-id') || itemLi.getAttribute('data-itemid');
                    if (liDataId) {
                        return liDataId;
                    }
                }
            } catch (e) {}
        }
        debugLog(`[findArmouryId] Could not find specific armouryItemID for ${targetItemName} (ID: ${targetItemId}) using any selector.`);
        return null;
    }

    function submitDrugUseRequest(id, name, token, isFaction, originalCount) {
        const endpoint = 'https://www.torn.com/item.php';
        const params = new URLSearchParams({ step: 'useItem', confirm: 'yes', itemID: id, csrf: token });
        if (isFaction) params.append('fac', '1');
        const methodType = isFaction ? 'faction_direct' : 'personal';
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            handleDrugResponse(this, id, name, methodType, originalCount, isFaction);
        };
        xhr.onerror = function() {
            debugLog(`[submitDrugRequest] Network error (${methodType}).`);
            showNotification(`Error using ${name}: Network error`, 'error');
            if (!isFaction) {
                sessionStorage.removeItem('drugUseInProgress');
                updateDrugCountDisplay(id, originalCount);
            }
        };
        xhr.send(params.toString());
    }

    function submitFactionArmouryRequest(armouryItemID, originalItemId, name, token, originalCount) {
        const endpoint = 'https://www.torn.com/factions.php';
        const params = new URLSearchParams({ step: 'armoryItemAction', confirm: 'yes', armoryItemID: armouryItemID, action: 'use', csrf: token });
        const methodType = 'faction_traditional';
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            handleDrugResponse(this, originalItemId, name, methodType, originalCount, false);
        };
        xhr.onerror = function() {
            debugLog('[submitFactionRequest] Traditional faction network error.');
            showNotification(`Error using ${name}: Network error (Fallback)`, 'error');
            sessionStorage.removeItem('drugUseInProgress');
            updateDrugCountDisplay(originalItemId, originalCount);
        };
        xhr.send(params.toString());
    }

    function handleDrugResponse(xhr, id, name, method, originalCount, maybeClearProgress = false) {
        id = parseInt(id);
        let success = false;
        let cooldown = false;
        let message = `Error using ${name}: Unknown response`;
        let isJson = false;
        let responseData = null;
        debugLog(`[handleDrugResponse ${method}] Received response for ${name} (ID: ${id}). Original count: ${originalCount}`);

        if (method === 'faction_direct') {
            try {
                const progressData = JSON.parse(sessionStorage.getItem('drugUseInProgress') || '{}');
                if (progressData.fallbackTimerId) {
                    clearTimeout(progressData.fallbackTimerId);
                    delete progressData.fallbackTimerId;
                    sessionStorage.setItem('drugUseInProgress', JSON.stringify(progressData));
                }
            } catch (e) {}
        }

        if (xhr.status === 200) {
            try {
                responseData = JSON.parse(xhr.responseText);
                isJson = true;
                const responseText = responseData.text || responseData.message || (responseData.error ? JSON.stringify(responseData.error) : '');
                if (responseData.success || (responseText && (responseText.includes('consumed') || responseText.includes('used')))) {
                    success = true;
                    message = responseData.text || `Used ${name} successfully!`;
                } else if (responseText && (responseText.includes('cooldown') || responseText.includes('effect of a drug') || responseText.includes('wait'))) {
                    cooldown = true;
                    message = extractCooldownMessage(responseText, 'Drug') || 'On drug cooldown or effect already active.';
                } else {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = responseText || '';
                    message = `Error: ${(tempDiv.textContent || tempDiv.innerText || responseText || 'Unknown error').trim()}`;
                }
            } catch (e) {
                const responseText = xhr.responseText || '';
                if (responseText.includes('success') || responseText.includes('consumed') || responseText.includes('used')) {
                    success = true;
                    const successMatch = responseText.match(/<div[^>]*class=["'][^"']*success[^"']*["'][^>]*>(.*?)<\/div>/i) || responseText.match(/<p[^>]*class=["'][^"']*msg[^"']*["'][^>]*>(.*?)<\/p>/i);
                    message = successMatch ? (successMatch[1].replace(/<[^>]+>/g, '').trim() || `Used ${name} successfully!`) : `Used ${name} successfully!`;
                } else if (responseText.includes('cooldown') || responseText.includes('effect of a drug') || responseText.includes('wait')) {
                    cooldown = true;
                    message = extractCooldownMessage(responseText, 'Drug') || 'You are on drug cooldown or effect already active.';
                } else {
                    const errorMatch = responseText.match(/<[^>]*class=['"]error['"][^>]*>(.*?)<\/|Validation failed|Error:|not authorized/i);
                    if (errorMatch) {
                        message = `Error: ${(errorMatch[1] || 'Validation failed').replace(/<[^>]+>/g, '').trim()}`;
                    } else {
                        message = `Error using ${name}: Unexpected response`;
                    }
                }
            }
        } else {
            message = `Error using ${name}: Request failed (${xhr.status})`;
        }

        showNotification(message, success ? 'success' : (cooldown ? 'info' : 'error'));

        if (!success) {
            if (method === 'personal' || method === 'faction_traditional') {
                updateDrugCountDisplay(id, originalCount);
            }
        } else {}

        if (success || cooldown || method === 'faction_traditional' || method === 'personal') {
            const currentProgress = sessionStorage.getItem('drugUseInProgress');
            if(currentProgress) {
                try {
                    const progressData = JSON.parse(currentProgress);
                    if (progressData && parseInt(progressData.id) === id) {
                        sessionStorage.removeItem('drugUseInProgress');
                    }
                } catch(e){
                    sessionStorage.removeItem('drugUseInProgress');
                }
            }
        }

        if (success || cooldown) {
            setTimeout(startCooldownChecks, 500);
        }
    }

    function extractCooldownMessage(responseText, type = 'Drug') {
        if (!responseText) return null;
        try {
            const timerSpanMatch = responseText.match(/<span[^>]*class=["']counter-wrap["'][^>]*data-time=["'](\d+)["'][^>]*>/i);
            if (timerSpanMatch && timerSpanMatch[1]) {
                const seconds = parseInt(timerSpanMatch[1]);
                if (seconds > 0) return `${type} Cooldown Active: ${timerSpanMatch[0]}</span>`;
            }
            const timeMatch = responseText.match(/(\d+)\s*hours?,\s*(\d+)\s*minutes?,\s*(\d+)\s*seconds?/i) || responseText.match(/(\d+)\s*minutes?,\s*(\d+)\s*seconds?/i) || responseText.match(/wait\s+(\d+)\s*m\s+(\d+)\s*s/i) || responseText.match(/(\d+)\s*seconds?/i) ;
            if (timeMatch) {
                let m = 0, s = 0;
                if (timeMatch.length === 4) {
                    m = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
                    s = parseInt(timeMatch[3]);
                } else if (timeMatch.length === 3 && responseText.includes('minute')) {
                    m = parseInt(timeMatch[1]);
                    s = parseInt(timeMatch[2]);
                } else if (timeMatch.length === 3 && responseText.includes('m') && responseText.includes('s')) {
                    m = parseInt(timeMatch[1]);
                    s = parseInt(timeMatch[2]);
                } else if (timeMatch.length === 2 && responseText.includes('second')) {
                    s = parseInt(timeMatch[1]);
                    m = Math.floor(s / 60);
                    s %= 60;
                }
                if(m > 0 || s > 0) return `${type} Cooldown: ${m}m ${s}s remaining`;
            }
            const div = document.createElement('div');
            div.innerHTML = responseText;
            const msgEl = div.querySelector('.message, .msg, .cont_gray, div[class*="cooldown"], div[class*="note"]');
            if (msgEl) {
                let txt = (msgEl.textContent || msgEl.innerText || '').replace(/\s+/g, ' ').trim();
                if (txt.toLowerCase().includes('cooldown') || txt.toLowerCase().includes('wait') || txt.toLowerCase().includes('effect')) {
                    if (txt.length > 150) txt = txt.substring(0, 150) + '...';
                    return txt;
                }
            }
        } catch(e) {}

        if (responseText.toLowerCase().includes('cooldown') || responseText.toLowerCase().includes('wait'))
            return `On ${type.toLowerCase()} cooldown`;

        return null;
    }

    function showNotification(message, type = 'info') {
        document.querySelectorAll('.drug-notification').forEach(n => n.remove());
        const n = document.createElement('div');
        n.className = `drug-notification ${type}`;
        n.innerHTML = message;

        if (typeof message === 'string' && message.toLowerCase().includes('cooldown')) {
            n.style.minWidth = '280px';
            n.style.padding = '15px 25px';
        }

        document.body.appendChild(n);

        let timerId = null;
        const timerSpan = n.querySelector('.counter-wrap[data-time]');
        if (timerSpan) {
            let secs = parseInt(timerSpan.dataset.time);
            const update = () => {
                if (secs <= 0) {
                    timerSpan.textContent = "00:00:00";
                    if (timerId) clearInterval(timerId);
                    return;
                }
                const h = Math.floor(secs / 3600).toString().padStart(2, '0');
                const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
                const s = (secs % 60).toString().padStart(2, '0');
                timerSpan.textContent = `${h}:${m}:${s}`;
                secs--;
            };
            update();
            timerId = setInterval(update, 1000);
        }

        n.style.transform = 'translate(-50%, -50%) scale(0.9)';
        n.style.opacity = '0';
        void n.offsetWidth;
        requestAnimationFrame(() => {
            n.style.transform = 'translate(-50%, -50%) scale(1)';
            n.style.opacity = '1';
        });

        const dur = (type === 'error' || type === 'info') ? 7000 : 4000;

        setTimeout(() => {
            requestAnimationFrame(() => {
                n.style.opacity = '0';
                n.style.transform = 'translate(-50%, -50%) scale(0.9)';
            });
            n.addEventListener('transitionend', () => {
                if (timerId) clearInterval(timerId);
                n.remove();
            }, { once: true });
        }, dur);
    }

    function getNSTStyleToken() { try { const r = getRFC(); if (r) return r; } catch (e) {} return null; }
    function extractTokenFromPage() { try { if (typeof window.csrf === 'string' && /^[a-f0-9]{16,}$/i.test(window.csrf)) return window.csrf; if (typeof window.csrf_token === 'string' && /^[a-f0-9]{16,}$/i.test(window.csrf_token)) return window.csrf_token; if (typeof $ === 'function' && typeof $.cookie === 'function') { const c = $.cookie('csrf'); if(c && /^[a-f0-9]{16,}$/i.test(c)) return c; } const inputs = document.querySelectorAll('input[name="csrf"], input[name="csrf_token"], input[id="csrf"], input[name="X-Csrf-Token"], input[data-csrf]'); for (const input of inputs) { const t = input.value || input.dataset?.csrf; if(t && /^[a-f0-9]{16,}$/i.test(t)) return t; } const patterns = [ /["']csrf["']\s*:\s*["']([a-f0-9]{16,})["']/, /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, /value=["']([a-f0-9]{16,})["']\s*name=["']csrf["']/ ]; const scripts = document.querySelectorAll('script:not([src])'); for (const script of scripts) { if (!script.textContent) continue; for (const p of patterns) { const m = script.textContent.match(p); if(m && m[1]) return m[1]; } } const meta = document.querySelector('meta[name="csrf-token"]'); if(meta && meta.content && /^[a-f0-9]{16,}$/i.test(meta.content)) return meta.content; } catch (e) {} return null; }
    function getPageCsrfToken() { return extractTokenFromPage(); }
    function getRFC() { if (typeof $ === 'function' && typeof $.cookie === 'function') { const c = $.cookie('rfc_v'); if(c) return c; } try { const cs = document.cookie.split('; '); for (const c of cs) { const [n, v] = c.split('='); if(n === 'rfc_v') return decodeURIComponent(v); } } catch (e) {} return null; }

    function hasDrugCooldown() {
        if (document.querySelector("[aria-label^='Drug Cooldown:']")) return true;
        const selectors = [
            '.status-icons__wrap a',
            '.status-icons li',
            '.user-icons__wrap a',
            '[class*="statusIcon"]',
            '[class*="status-icon"]',
            '#user-icons li'
        ];
        const icons = document.querySelectorAll(selectors.join(', '));
        for (const icon of icons) {
            if (icon.offsetParent === null) continue;
            const label = (icon.getAttribute('aria-label') || '').toLowerCase();
            const title = (icon.getAttribute('title') || '').toLowerCase();
            if ((label.includes('drug') && label.includes('cooldown')) ||
                (title.includes('drug') && title.includes('cooldown')))
                return true;
        }
        return false;
    }
    // --- END Core Logic ---

    // --- fetchDrugs (Unchanged from v1.5.5) ---
    function fetchDrugs() { return new Promise((resolve) => { fetch('https://www.torn.com/item.php').then(r => r.text()).then(html => { const doc = new DOMParser().parseFromString(html, 'text/html'); const items = []; const knownDrugIds = new Set(fallbackDrugs.map(d => d.id)); const itemSelectors = [ '#drugs li[data-item]', 'ul[data-category="Drugs"] li[data-item]', '#item-market-main-wrap li[data-item]', '.items-list-wrap li[data-item]', '#itemlist li[data-item]', '.items-list li[data-item]' ]; const foundElements = new Map(); doc.querySelectorAll(itemSelectors.join(', ')).forEach(item => { try { const id = parseInt(item.dataset.item); if (!id || !knownDrugIds.has(id) || foundElements.has(id)) return; const nameEl = item.querySelector('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"]'); let itemName = fallbackDrugs.find(d => d.id === id)?.name || `Drug ${id}`; if (nameEl) { const nameElClone = nameEl.cloneNode(true); const qtySpanClone = nameElClone.querySelector('span.qty, span.amount'); if (qtySpanClone) qtySpanClone.remove(); let cleanedName = nameElClone.textContent.trim().replace(/\s*x[\d,]*$/, '').trim(); if (cleanedName) itemName = cleanedName; } foundElements.set(id, { id, name: itemName }); } catch (e) {} }); const uniqueDrugs = Array.from(foundElements.values()); resolve(uniqueDrugs.length > 0 ? uniqueDrugs : [...fallbackDrugs]); }).catch(err => { resolve([...fallbackDrugs]); }); }); }
    // --- END fetchDrugs ---

    // --- Cooldown Checks & Positioning (Improved Cooperation) ---
    function startCooldownChecks() {
        if (cooldownCheckInterval) clearInterval(cooldownCheckInterval);
        if (cooldownObserver) cooldownObserver.disconnect();

        const checkLogic = () => {
            const hasCD = hasDrugCooldown();
            const alert = document.querySelector('.drug-alert');
            if (!hasCD && !alert) {
                alertElements = createAlert(drugList);
                checkForPendingDrugUse();
            } else if (hasCD && alert) {
                removeExistingAlerts();
            }
        };

        setTimeout(checkLogic, 1500);

        try {
            cooldownObserver = new MutationObserver((muts) => {
                const rel = muts.some(m => {
                    const t = m.target;
                    if (t && t.nodeType === 1) {
                        if (t.closest('.status-icons__wrap, .user-icons__wrap, #status-icons, #user-icons') ||
                            t.matches('[aria-label*="Cooldown"]'))
                            return true;
                    }
                    return [...m.addedNodes, ...m.removedNodes].some(n =>
                        n.nodeType === 1 &&
                        (n.matches('[aria-label*="Cooldown"]') ||
                         n.querySelector('[aria-label*="Cooldown"]')));
                });

                if (rel) {
                    checkLogic();
                }
            });

            const target = document.body;
            if (target) cooldownObserver.observe(target, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'aria-label', 'title', 'style']
            });
        } catch (e) {}

        cooldownCheckInterval = setInterval(checkLogic, 30000);
    }

    // IMPROVED: Better cooperative positioning with the Booster panel
    function adjustQuickUsePosition() {
        const panel = document.querySelector('.drug-quick-use-container');
        if (!panel) return;

        // Find other panels (especially Booster panel)
        const boosterPanel = document.querySelector('.booster-quick-use-container');
        const otherPanels = document.querySelectorAll('.tt-quick-items-container, .quick-items-react-root');

        let top = 90; // Default starting position
        const margin = 10; // Space between panels

        // Check booster panel first (if it exists)
        if (boosterPanel) {
            try {
                const style = window.getComputedStyle(boosterPanel);
                if (style.display !== 'none' && style.visibility !== 'hidden' && boosterPanel.offsetHeight > 0) {
                    const rect = boosterPanel.getBoundingClientRect();
                    if (rect.height > 0) {
                        const bottom = rect.bottom + window.scrollY;
                        if (bottom > top) top = bottom + margin;
                    }
                }
            } catch (e) {}
        }

        // Then check any other panels
        otherPanels.forEach(p => {
            try {
                const style = window.getComputedStyle(p);
                if (style.display !== 'none' && style.visibility !== 'hidden' && p.offsetHeight > 0) {
                    const rect = p.getBoundingClientRect();
                    if (rect.height > 0 && rect.bottom > 0) {
                        const bottom = rect.bottom + window.scrollY;
                        if (bottom > top) top = bottom + margin;
                    }
                }
            } catch (e) {}
        });

        // Apply position
        if (panel.style.top !== `${top}px`) {
            panel.style.top = `${top}px`;
            debugLog(`[adjustPosition] Positioned Drug Panel at top: ${top}px`);
        }
    }

    function setupCooperativePositioning() {
        // Initial adjustment
        setTimeout(adjustQuickUsePosition, 500);

        // Watch for changes in ALL quick use panels
        const observer = new MutationObserver((mutations) => {
            let shouldAdjust = false;

            for (const mutation of mutations) {
                // Check if mutation is relevant to panel display/positioning
                const isRelevantTarget = mutation.target.classList &&
                    (mutation.target.classList.contains('booster-quick-use-container') ||
                     mutation.target.classList.contains('drug-quick-use-container') ||
                     mutation.target.classList.contains('tt-quick-items-container') ||
                     mutation.target.classList.contains('quick-items-react-root'));

                const hasStyleChange = mutation.type === 'attributes' &&
                    (mutation.attributeName === 'style' ||
                     mutation.attributeName === 'class' ||
                     mutation.attributeName === 'data-minimized');

                if (isRelevantTarget && hasStyleChange) {
                    shouldAdjust = true;
                    break;
                }

                // Also check for added/removed panels
                if (mutation.type === 'childList') {
                    const relevantNodeAdded = Array.from(mutation.addedNodes).some(node =>
                        node.nodeType === 1 && node.classList &&
                        (node.classList.contains('booster-quick-use-container') ||
                         node.classList.contains('drug-quick-use-container') ||
                         node.classList.contains('tt-quick-items-container') ||
                         node.classList.contains('quick-items-react-root')));

                    const relevantNodeRemoved = Array.from(mutation.removedNodes).some(node =>
                        node.nodeType === 1 && node.classList &&
                        (node.classList.contains('booster-quick-use-container') ||
                         node.classList.contains('drug-quick-use-container') ||
                         node.classList.contains('tt-quick-items-container') ||
                         node.classList.contains('quick-items-react-root')));

                    if (relevantNodeAdded || relevantNodeRemoved) {
                        shouldAdjust = true;
                        break;
                    }
                }
            }

            if (shouldAdjust) {
                // Use debounce to avoid too many recalculations
                clearTimeout(window.drugAlertPositionTimeout);
                window.drugAlertPositionTimeout = setTimeout(adjustQuickUsePosition, 100);
            }
        });

        try {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'data-minimized']
            });
        } catch (e) {
            console.error("DrugAlerts: Failed to set up observer for cooperative positioning:", e);
        }

        // Periodic adjustment as a fallback
        setInterval(adjustQuickUsePosition, 3000);

        // Adjust on window resize
        window.addEventListener('resize', () => {
            clearTimeout(window.drugAlertPositionTimeout);
            window.drugAlertPositionTimeout = setTimeout(adjustQuickUsePosition, 100);
        });

        // Final adjustment after full page load
        window.addEventListener('load', () => {
            setTimeout(adjustQuickUsePosition, 500);
        });
    }
    // --- END Cooldown Checks & Positioning ---

    // --- **UPDATED Tab Switch Handling (v1.5.6 - Reverted to Delayed Scan)** ---
    function runDelayedScanAndBuild() {
        debugLog(`[runDelayedScanAndBuild] Running scan after delay...`);

        // Determine container based on current mode
        const isItemsPage = window.location.href.includes('item.php');
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');
        const shouldBeVisible = (isItemsPage && !useFactionDrugs) || (isFactionArmouryPage && useFactionDrugs);

        if (shouldBeVisible) {
             const container = useFactionDrugs
                 ? document.querySelector('#faction-armoury') // Scan whole armoury container
                 : document.querySelector('div#category-wrap > ul.ui-tabs-panel:not([aria-hidden="true"])'); // Scan visible item tab

             fetchInitialDrugCounts(useFactionDrugs, container || document); // Scan appropriate container or fallback
             buildOrRebuildQuickUsePanel(); // Build or rebuild panel
        } else {
             // If not relevant, ensure panel is removed
             const existingPanel = document.querySelector('.drug-quick-use-container');
             if (existingPanel) {
                  debugLog(`[runDelayedScanAndBuild] Page no longer relevant, removing panel.`);
                  existingPanel.remove();
                  currentPanelInstance = null;
             }
        }
    }

    function handleTabClick(event) {
        // First check if the click is on the quick use panel itself - if so, ignore it completely
        if (event.target.closest('.drug-quick-use-container')) {
            // Click is within our own Quick Use UI, so do nothing
            return;
        }

        // Check if click is on a tab or related UI element
        const itemTabLink = event.target.closest('div[class*="items-cont"] ul[role="tablist"] a[href^="#"]');
        const factionArmourySubTabLink = event.target.closest('#faction-armoury-tabs a[href^="#armoury-"]');
        const mainFactionArmoryTabLink = event.target.closest('.ui-tabs-nav a[href="#faction-armoury"]');

        let isRelevantClick = false;

        if (itemTabLink && !useFactionDrugs) {
            isRelevantClick = true;
            debugLog(`[handleTabClick Drugs] Item tab clicked: ${itemTabLink.hash}`);
        } else if ((factionArmourySubTabLink || mainFactionArmoryTabLink) && useFactionDrugs) {
            isRelevantClick = true;
            const targetHash = factionArmourySubTabLink?.hash || mainFactionArmoryTabLink?.hash;
            debugLog(`[handleTabClick Drugs] Faction Armory tab/sub-tab clicked: ${targetHash}`);
        }

        // Clear previous timeout
        clearTimeout(tabScanTimeout);

        if (isRelevantClick) {
            // Schedule the scan and build after a short delay
            debugLog(`[handleTabClick Drugs] Scheduling scan/build in ${TAB_SCAN_DELAY}ms.`);
            tabScanTimeout = setTimeout(runDelayedScanAndBuild, TAB_SCAN_DELAY);
        } else {
            // MODIFIED: Check if this is a click on UI elements we want to preserve
            const isOnDrugUI = event.target.closest('.drug-gui, .drug-alert, #drug-customization-ui, #add-drugs-ui, .drug-notification');
            const isOnBoosterUI = event.target.closest('.booster-quick-use-container, .booster-gui, .booster-alert');

            // Only remove if not clicking on any Drug or Booster UI elements
            if (!isOnDrugUI && !isOnBoosterUI) {
                const existingPanel = document.querySelector('.drug-quick-use-container');
                if (existingPanel) {
                    // We're only removing the panel on genuine navigation, not when interacting with UI
                    if (event.target.closest('a[href], button[type="submit"]')) {
                        debugLog(`[handleTabClick Drugs] Navigation detected, removing panel.`);
                        existingPanel.remove();
                        currentPanelInstance = null;
                    }
                }
            }
        }
    }
    // --- **END UPDATED Tab Switch Handling** ---


    // --- Pending Action Checks & Cleanup ---
    function checkForPendingDrugUse() {
        try {
            const fromAlert = sessionStorage.getItem('fromDrugAlert');
            const pendingFacUse = sessionStorage.getItem('pendingFactionDrugUse');
            const inProg = sessionStorage.getItem('drugUseInProgress');

            if (inProg) {
                const d = JSON.parse(inProg);
                if (Date.now() - (d.timestamp || 0) > 15000) {
                    sessionStorage.removeItem('drugUseInProgress');
                }
            }

            if (fromAlert) {
                sessionStorage.removeItem('fromDrugAlert');
                const isItems = window.location.href.includes('item.php');
                const isFacArmoury = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');
                const correctPage = (isItems && !useFactionDrugs) || (isFacArmoury && useFactionDrugs);

                if (correctPage) {
                    setTimeout(() => {
                        if (drugList && drugList.length > 0 && !hasDrugCooldown()) {
                            if (!document.querySelector('.drug-alert')) alertElements = createAlert(drugList);
                            const gui = document.getElementById('drugGui');
                            if (gui) {
                                gui.style.display = 'block';
                                const si = gui.querySelector('.drug-search');
                                if (si) si.focus();
                            }
                        }
                    }, 1200);
                }
            } else if (pendingFacUse) {
                const isFacArmoury = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');

                if (isFacArmoury) {
                    try {
                        const p = JSON.parse(pendingFacUse);
                        if (p.id && p.name) {
                            sessionStorage.removeItem('pendingFactionDrugUse');
                            const origCount = p.originalCount !== undefined ? p.originalCount : 1;

                            setTimeout(() => {
                                useFactionDrugs = localStorage.getItem('useFactionDrugs') === 'true';
                                if (useFactionDrugs) {
                                    showNotification(`Using pending drug: ${p.name}...`, 'info');
                                    useDrug(p.id, p.name);
                                }
                            }, 1500);
                        } else sessionStorage.removeItem('pendingFactionDrugUse');
                    } catch (e) {
                        sessionStorage.removeItem('pendingFactionDrugUse');
                    }
                }
            }
        } catch (e) {
            sessionStorage.removeItem('drugUseInProgress');
            sessionStorage.removeItem('fromDrugAlert');
            sessionStorage.removeItem('pendingFactionDrugUse');
        }
    }

    function removeExistingAlerts() {
        document.querySelectorAll('.drug-alert').forEach(el => el.remove());
        alertElements = null;
    }
    // --- END Pending Action Checks & Cleanup ---


    // --- **UPDATED Initialization** ---
    function initialize() {
        console.log(`%c Drug Alerts v${SCRIPT_VERSION} Initializing (isInitialLoad: ${isInitialLoad}) `, 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;');
        if(DEBUG_MODE) debugLog('Using DEBUG_MODE');
        const wasInitialLoad = isInitialLoad; isInitialLoad = false;

        // Cleanup previous listeners/observers
        if (cooldownObserver) cooldownObserver.disconnect();
        if (cooldownCheckInterval) clearInterval(cooldownCheckInterval);
        clearTimeout(tabScanTimeout); // Clear tab scan timeout
        document.body.removeEventListener('click', handleTabClick, true); // Remove previous listener

        useFactionDrugs = localStorage.getItem('useFactionDrugs') === 'true';
        removeExistingAlerts(); // Remove alert/GUI popups

        checkForPendingDrugUse(); // Check for navigation-related actions

        fetchDrugs().then(fetchedDrugs => {
            drugList = fetchedDrugs; // Store the potentially improved list global
            const isItemsPage = window.location.href.includes('item.php');
            const isFactionPage = window.location.href.includes('factions.php'); // Broader check for faction page

            // *** Determine initial panel visibility ***
            const isArmouryTabActive = isFactionPage && window.location.href.includes('#/tab=armoury');
            const isRelevantPageForPanel = (isItemsPage && !useFactionDrugs) || (isArmouryTabActive && useFactionDrugs);

            // Fetch counts on every init
            fetchInitialDrugCounts(useFactionDrugs, document);

            // *** Only rebuild the quick use panel if needed ***
            const quickUsePanel = document.querySelector('.drug-quick-use-container');

            if (isRelevantPageForPanel) {
                // Only build if we're on relevant page AND panel doesn't exist yet
                if (!quickUsePanel) {
                    debugLog("[initialize Drugs] Relevant page/mode detected. Building panel.");
                    buildOrRebuildQuickUsePanel();
                } else {
                    debugLog("[initialize Drugs] Panel already exists, just updating position.");
                    adjustQuickUsePosition();
                }
            } else if (quickUsePanel) {
                // Remove panel if it exists but shouldn't be shown
                debugLog("[initialize Drugs] Not on relevant page/mode, removing existing panel.");
                quickUsePanel.remove();
                currentPanelInstance = null;
            }

            // Secondary scan only needed on initial load for potentially dynamic item lists
            if (wasInitialLoad) {
                setTimeout(() => {
                    debugLog(`[initialize Drugs] Running delayed secondary scan after ${INITIAL_SCAN_DELAY}ms.`);
                    fetchInitialDrugCounts(useFactionDrugs, document); // Re-scan counts
                    // Re-evaluate panel visibility and rebuild/remove if necessary
                    const isArmouryTabNow = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');
                    const shouldBeVisibleNow = (window.location.href.includes('item.php') && !useFactionDrugs) || (isArmouryTabNow && useFactionDrugs);
                     if (shouldBeVisibleNow) {
                         // Build/Rebuild only if needed (e.g., if not already built by initial check)
                         if (!document.querySelector('.drug-quick-use-container')) {
                             debugLog("[initialize Drugs][Timeout] Building panel as it's relevant and not present.");
                             buildOrRebuildQuickUsePanel();
                         } else {
                              debugLog("[initialize Drugs][Timeout] Panel already exists, just adjusting position.");
                              adjustQuickUsePosition();
                         }
                     } else {
                         // If it shouldn't be visible now, ensure it's removed
                         const existingPanelNow = document.querySelector('.drug-quick-use-container');
                         if (existingPanelNow) {
                              debugLog("[initialize Drugs][Timeout] Page no longer relevant, removing panel.");
                              existingPanelNow.remove();
                              currentPanelInstance = null;
                         }
                     }
                }, INITIAL_SCAN_DELAY);
            }

            // Always add the tab click listener if on items or faction page
            if (isItemsPage || isFactionPage) {
                 debugLog("[initialize Drugs] Adding tab click listener.");
                 document.body.addEventListener('click', handleTabClick, true);
            }

            // Start common functions AFTER fetchDrugs promise resolves
            startCooldownChecks();
            setupCooperativePositioning();

        }).catch(err => {
             // Handle failure to fetch drug list
             console.error("Drug Alerts: Critical error fetching drug list during initialization:", err);
             drugList = [...fallbackDrugs]; // Use fallback
             // Still try to initialize other parts
             fetchInitialDrugCounts(useFactionDrugs, document);
             buildOrRebuildQuickUsePanel(); // Attempt build with potentially stored counts
             startCooldownChecks();
             setupCooperativePositioning();
        });
    }
    // --- **END UPDATED Initialization** ---

    // --- Script Entry Point ---
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initialize); }
    else { initialize(); }

})();
