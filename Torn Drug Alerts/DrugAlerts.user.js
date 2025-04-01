// ==UserScript==
// @name         Torn Drug Alert
// @version      1.1.1
// @description  Alerts when no drug cooldown is active and allows taking drugs from any page
// @author       GNSC4 [268863]
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

    // Add CSS
    GM_addStyle(`
        .drug-alert {
            background-color: #ff3333; color: white; padding: 5px 10px;
            border-radius: 3px; font-weight: bold; cursor: pointer;
            margin-left: 15px; display: inline-flex; align-items: center;
            font-size: 12px;
        }
        .drug-gui {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #222; color: white; padding: 20px; border-radius: 8px;
            z-index: 99999999; width: 350px; max-height: 500px; overflow-y: auto;
            display: none; box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444;
        }
        .drug-gui h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .drug-search {
            width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #444;
            background-color: #333; color: white; border-radius: 3px; box-sizing: border-box;
        }
        .drug-search::placeholder { color: #aaa; }
        .drug-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
        .drug-item {
            background-color: #333; padding: 12px; border-radius: 5px; text-align: center;
            cursor: pointer; transition: background-color 0.2s; font-size: 14px; font-weight: bold;
        }
        .drug-item:hover { background-color: #444; }
        .drug-notification {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            padding: 15px 20px; border-radius: 5px; color: white; z-index: 999999;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4); opacity: 1;
            transition: opacity 0.5s, transform 0.3s ease-out; text-align: center;
            min-width: 250px; max-width: 80%; pointer-events: none;
        }
        .drug-notification.success { background-color: rgba(76, 175, 80, 0.9); border: 1px solid #4CAF50; }
        .drug-notification.error { background-color: rgba(244, 67, 54, 0.9); border: 1px solid #f44336; }
        .drug-notification.info { background-color: rgba(33, 150, 243, 0.9); border: 1px solid #2196F3; }
        .settings-section { margin-top: 15px; padding: 10px; background-color: #333; border-radius: 5px; border: 1px solid #444; }
        .settings-toggle { display: flex; align-items: center; margin-bottom: 8px; }
        .settings-toggle label { margin-left: 8px; cursor: pointer; }
        .settings-toggle input[type="checkbox"] { cursor: pointer; }
        .quick-use-container {
            position: fixed; top: 100px; right: 20px; background-color: rgba(34, 34, 34, 0.8);
            padding: 10px; border-radius: 5px; z-index: 9998; display: flex;
            flex-direction: column; gap: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .drug-quick-button {
            color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;
            font-weight: bold; margin-bottom: 5px; text-align: center; transition: background-color 0.2s;
        }
        .drug-quick-button:hover { filter: brightness(1.2); }
        .drug-settings-button {
            background-color: #555; color: white; border: none; padding: 5px 10px; border-radius: 3px;
            cursor: pointer; font-weight: bold; margin-top: 5px; text-align: center; font-size: 12px;
            transition: background-color 0.2s;
        }
        .drug-settings-button:hover { background-color: #666; }
        .quick-use-toggle-button {
            position: absolute; top: -8px; right: -8px; background-color: #f44336; color: white;
            border: none; width: 20px; height: 20px; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; cursor: pointer; font-size: 10px;
            font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        #drug-customization-ui {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #222; color: white; padding: 20px; border-radius: 8px;
            z-index: 9999998; width: 350px; max-height: 500px; overflow-y: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444;
        }
        #drug-customization-ui h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
        #drug-customization-ui p { margin-bottom: 15px; font-size: 14px; }
        .drug-selection-area {
            margin-bottom: 15px; border: 1px solid #444; border-radius: 5px; padding: 10px;
            max-height: 250px; overflow-y: auto;
        }
        .drug-selection-item {
            display: flex; align-items: center; padding: 8px; margin-bottom: 5px;
            background-color: #333; border-radius: 4px; cursor: move;
        }
        .drug-selection-item span:first-of-type { margin-right: 10px; cursor: move; user-select: none; }
        .drug-selection-item input[type="checkbox"] { margin-right: 5px; }
        .drug-selection-item span:nth-of-type(2) { flex-grow: 1; }
        .drug-selection-item input[type="color"] {
            width: 25px; height: 25px; border: none; background: none; cursor: pointer;
            vertical-align: middle; margin-left: 10px;
        }
        .customization-button {
            background-color: #4CAF50; color: white; border: none; padding: 8px 15px;
            border-radius: 4px; cursor: pointer; flex-grow: 1; margin: 0 5px;
            transition: background-color 0.2s;
        }
        .customization-button.cancel { background-color: #777; }
        .customization-button.add { width: 100%; margin-bottom: 15px; box-sizing: border-box; }
        .customization-button:hover { filter: brightness(1.1); }
        .customization-button-container { display: flex; justify-content: space-between; }
        #add-drugs-ui {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #222; color: white; padding: 20px; border-radius: 8px;
            z-index: 99999999; width: 350px; max-height: 500px; overflow-y: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 1px solid #444;
        }
        #add-drugs-ui h3 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
        #add-drugs-ui input[type="text"] {
            width: 100%; padding: 8px; margin-bottom: 10px; background-color: #333;
            border: 1px solid #444; border-radius: 4px; color: white; box-sizing: border-box;
        }
        .add-drug-list-container {
            margin-bottom: 15px; max-height: 300px; overflow-y: auto; border: 1px solid #444;
            border-radius: 4px; padding: 5px;
        }
        .add-drug-item {
            display: flex; align-items: center; padding: 8px; margin-bottom: 5px;
            background-color: #333; border-radius: 4px; cursor: pointer;
            transition: background-color 0.2s;
        }
        .add-drug-item.selected { background-color: #444; }
        .add-drug-item input[type="checkbox"] { margin-right: 10px; }
        .add-drug-item span { flex-grow: 1; }
        .add-drugs-button-container { display: flex; justify-content: flex-end; }
        .add-drugs-done-button {
            background-color: #4CAF50; color: white; border: none; padding: 8px 15px;
            border-radius: 4px; cursor: pointer; transition: background-color 0.2s;
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

    let alertElements = null;
    let drugList = [];
    let useFactionDrugs = false;

    // Debug mode flag - set to false for release
    let DEBUG_MODE = false;

    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[DrugAlerts Debug]', ...args);
        }
    }

    function positionDrugAlert(alert, header) {
        if (window.location.href.includes('forums.php')) {
            const linksWrap = document.querySelector('.links-top-wrap');
            if (linksWrap) {
                const firstLink = linksWrap.querySelector('a');
                if (firstLink) linksWrap.insertBefore(alert, firstLink);
                else linksWrap.appendChild(alert);
                alert.style.cssText = `
                    display: inline-flex !important; align-items: center !important;
                    margin-right: 10px !important; margin-left: 10px !important;
                    order: 1 !important; z-index: 99999 !important;
                    pointer-events: auto !important; vertical-align: middle !important;
                    float: right !important; background-color: #ff3333; color: white;
                    padding: 5px 10px; border-radius: 3px; font-weight: bold;
                    cursor: pointer; font-size: 12px;
                `;
                return;
            }
        }
        header.appendChild(alert);
        alert.style.cssText = `
            display: inline-flex !important; align-items: center !important;
            margin-left: 10px !important; order: 2 !important;
            z-index: 99999 !important; pointer-events: auto !important;
            background-color: #ff3333; color: white; padding: 5px 10px;
            border-radius: 3px; font-weight: bold; cursor: pointer; font-size: 12px;
        `;
        const isMobilePDA = navigator.userAgent.includes('PDA') || window.innerWidth < 768 || document.documentElement.classList.contains('tornPDA');
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
            '.appHeader___gUnYC', '.content-title', '.tutorial-cont', '.cont-gray',
            '.content-wrapper .header', '.content-wrapper .title-black', '.captionWithActionContainment___nVTbE',
            '.pageTitle___CaFrO', '.sortable-list .title', '.topSection___CvKvI',
            '.mainStatsContainer___TXO7F', 'div[role="heading"]',
            '#mainContainer > div.content-wrapper.winter > div.content-title.m-bottom10 h4',
            '.titleContainer___QrlWP .title___rhtB4', 'div.content-title h4', '.title-black',
            '.clearfix .t-black', '.page-head > h4', '#react-root > div > div.appHeader___gUnYC.crimes-app-header > h4',
            'div.appHeader___gUnYC h4', '#skip-to-content', '.header-title', '.mobile-title', '.app-header',
            '.content-title.m-bottom10', '.forum-thread-wrap header', '.forum-post-reply',
            '.forums-subcats', '.forums-threadList'
        ].map(selector => document.querySelector(selector)).filter(el => el !== null);

        const foundHeader = possibleHeaders[0]; // Get the first valid header found

        if (!foundHeader && window.location.href.includes('forums.php')) {
             const linksWrap = document.querySelector('.links-top-wrap');
             if (linksWrap) return linksWrap;
             return createFixedHeader();
        }
        if (!foundHeader) {
            return createFixedHeader();
        }
        return foundHeader;
    }

    function createFixedHeader() {
        let fixedHeader = document.getElementById('torn-drug-fixed-header');
        if (!fixedHeader) {
            fixedHeader = document.createElement('div');
            fixedHeader.id = 'torn-drug-fixed-header';
            Object.assign(fixedHeader.style, {
                position: 'fixed', top: '50px', right: '20px', zIndex: '9999',
                backgroundColor: 'rgba(34, 34, 34, 0.8)', padding: '5px 10px',
                borderRadius: '5px', display: 'flex', alignItems: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            });
            document.body.appendChild(fixedHeader);
        }
        return fixedHeader;
    }

    function createAlert(drugs) {
        let header = findHeader();
        removeExistingAlerts();

        const alert = document.createElement('div');
        alert.className = 'drug-alert';
        alert.textContent = 'No Drugs';
        positionDrugAlert(alert, header);

        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
        const isOtherFactionPage = window.location.href.includes('factions.php') && (!window.location.href.includes('armoury') || !window.location.href.includes('sub=drugs'));

        let gui = null;
        if ((isItemsPage && !useFactionDrugs) || (isFactionArmouryDrugsPage && useFactionDrugs)) {
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
                <input type="text" class="drug-search" placeholder="Search drugs...">
                <div class="drug-list"></div>
            `;
            document.body.appendChild(gui);

            const factionDrugsCheckbox = gui.querySelector('#useFactionDrugs');
            if (factionDrugsCheckbox) {
                factionDrugsCheckbox.addEventListener('change', function() {
                    useFactionDrugs = this.checked;
                    localStorage.setItem('useFactionDrugs', useFactionDrugs);
                    showNotification(`${useFactionDrugs ? 'Using faction armoury drugs' : 'Using personal inventory drugs'}`, 'info');
                    gui.style.display = 'none';
                    removeExistingAlerts();
                    alertElements = createAlert(drugList);
                });
            }

            const drugListElement = gui.querySelector('.drug-list');
            const searchInput = gui.querySelector('.drug-search');

            function populateDrugList(filter = '') {
                drugListElement.innerHTML = '';
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
                        useDrug(drug.id, drug.name);
                        if(gui) gui.style.display = 'none';
                    };
                    drugListElement.appendChild(drugItem);
                });
            }
            populateDrugList();
            searchInput.addEventListener('input', () => { populateDrugList(searchInput.value); });

            document.addEventListener('click', function(e) {
                if (gui && gui.style.display === 'block' && !gui.contains(e.target) && !alert.contains(e.target)) {
                    gui.style.display = 'none';
                }
            });
        }

        alert.onclick = function(event) {
            event.stopPropagation();
            if ((isItemsPage && !useFactionDrugs) || (isFactionArmouryDrugsPage && useFactionDrugs)) {
                if (gui) {
                    gui.style.display = gui.style.display === 'block' ? 'none' : 'block';
                    if (gui.style.display === 'block') {
                        const searchInput = gui.querySelector('.drug-search');
                        if (searchInput) searchInput.focus();
                    }
                } else {
                    removeExistingAlerts();
                    alertElements = createAlert(drugList);
                    if (alertElements && alertElements.gui) {
                        alertElements.gui.style.display = 'block';
                    }
                }
            } else {
                const targetUrl = useFactionDrugs ? 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=drugs' : 'https://www.torn.com/item.php';
                sessionStorage.setItem('fromDrugAlert', 'true');
                showNotification(`Navigating to ${useFactionDrugs ? 'faction armoury' : 'items'} page...`, 'info');
                window.location.href = targetUrl;
            }
            return false;
        };
        return { alert, gui };
    }

    function addQuickUseButtons() {
        const isItemsPage = window.location.href.includes('torn.com/item.php');
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
        if (!isItemsPage && !isFactionArmouryDrugsPage) return;

        const existingContainer = document.querySelector('.quick-use-container');
        if (existingContainer) existingContainer.remove();

        const quickUseContainer = document.createElement('div');
        quickUseContainer.className = 'quick-use-container';

        const savedQuickUseDrugs = localStorage.getItem('customQuickUseDrugs');
        let quickUseDrugs = [];
        const defaultQuickDrugs = [ { id: 206, name: "Xanax" }, { id: 197, name: "Ecstasy" }, { id: 196, name: "Cannabis" } ];

        if (savedQuickUseDrugs) {
            try {
                quickUseDrugs = JSON.parse(savedQuickUseDrugs);
                quickUseDrugs.forEach(drug => { if (!drug.color) drug.color = getDefaultDrugColor(drug.id); });
            } catch (e) {
                quickUseDrugs = defaultQuickDrugs.map(drug => ({ ...drug, color: getDefaultDrugColor(drug.id) }));
                localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs));
            }
        } else {
             quickUseDrugs = defaultQuickDrugs.map(drug => ({ ...drug, color: getDefaultDrugColor(drug.id) }));
            localStorage.setItem('customQuickUseDrugs', JSON.stringify(quickUseDrugs));
        }

        const drugButtons = [];
        quickUseDrugs.forEach(drug => {
            const button = document.createElement('div');
            button.textContent = drug.name;
            button.className = 'drug-quick-button';
            button.style.backgroundColor = drug.color || getDefaultDrugColor(drug.id);
            button.addEventListener('click', () => useDrug(drug.id, drug.name));
            drugButtons.push(button);
            quickUseContainer.appendChild(button);
        });

        const settingsButton = document.createElement('div');
        settingsButton.textContent = '⚙️ Edit';
        settingsButton.className = 'drug-settings-button';
        settingsButton.addEventListener('click', () => showDrugCustomizationUI(quickUseDrugs));
        quickUseContainer.appendChild(settingsButton);

        const toggleButton = document.createElement('button');
        toggleButton.className = 'quick-use-toggle-button';
        let isMinimized = localStorage.getItem('drugAlertMinimized') === 'true';

        function applyMinimizedState() {
            drugButtons.forEach(btn => { btn.style.display = isMinimized ? 'none' : 'block'; });
            settingsButton.style.display = isMinimized ? 'none' : 'block';
            quickUseContainer.style.padding = isMinimized ? '2px' : '10px';
            quickUseContainer.style.top = isMinimized ? '110px' : '100px';
            // --- START: Use '+' for maximize symbol ---
            toggleButton.textContent = isMinimized ? '+' : 'X';
            // --- END: Use '+' for maximize symbol ---
        }
        applyMinimizedState();

        toggleButton.addEventListener('click', () => {
            isMinimized = !isMinimized;
            applyMinimizedState();
            localStorage.setItem('drugAlertMinimized', isMinimized.toString());
        });

        quickUseContainer.appendChild(toggleButton);
        document.body.appendChild(quickUseContainer);
    }

    function showDrugCustomizationUI(currentDrugs) {
        // Flag to prevent immediate closing on the same click that opened it
        let justOpened = true;
        setTimeout(() => { justOpened = false; }, 500);

        const existingUI = document.getElementById('drug-customization-ui');
        if (existingUI) existingUI.remove();

        const customizationUI = document.createElement('div');
        customizationUI.id = 'drug-customization-ui';
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

        const drugSelectionArea = customizationUI.querySelector('.drug-selection-area');
        const selectedDrugs = currentDrugs.map(drug => ({ ...drug, color: drug.color || getDefaultDrugColor(drug.id) }));

        function createColorPicker(drug, drugItemElement) {
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = drug.color || getDefaultDrugColor(drug.id);
            colorPicker.addEventListener('input', (e) => { drug.color = e.target.value; });
            return colorPicker;
        }

        function renderDrugItem(drug) {
            const drugItem = document.createElement('div');
            drugItem.className = 'drug-selection-item';
            drugItem.setAttribute('data-drug-id', drug.id);
            drugItem.setAttribute('draggable', 'true');
            const dragHandle = document.createElement('span');
            dragHandle.innerHTML = '≡';
            drugItem.appendChild(dragHandle);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.addEventListener('change', () => {
                if (!checkbox.checked) {
                    drugItem.style.opacity = '0.5';
                    drugItem.style.textDecoration = 'line-through';
                    drugItem.setAttribute('data-remove', 'true');
                } else {
                    drugItem.style.opacity = '1';
                    drugItem.style.textDecoration = 'none';
                    drugItem.removeAttribute('data-remove');
                }
            });
            drugItem.appendChild(checkbox);
            const nameSpan = document.createElement('span');
            nameSpan.textContent = drug.name;
            drugItem.appendChild(nameSpan);
            const colorPicker = createColorPicker(drug, drugItem);
            drugItem.appendChild(colorPicker);
            drugSelectionArea.appendChild(drugItem);
            drugItem.addEventListener('dragstart', handleDragStart);
            drugItem.addEventListener('dragover', handleDragOver);
            drugItem.addEventListener('drop', handleDrop);
            drugItem.addEventListener('dragend', handleDragEnd);
        }
        selectedDrugs.forEach(renderDrugItem);

        let draggedItem = null;
        function handleDragStart(e) {
            draggedItem = e.target.closest('.drug-selection-item');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedItem.dataset.drugId);
            setTimeout(() => { if (draggedItem) draggedItem.style.opacity = '0.5'; }, 0);
        }
        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const targetItem = e.target.closest('.drug-selection-item');
            if (targetItem && targetItem !== draggedItem) {
                const rect = targetItem.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                if (offsetY < rect.height / 2) {
                    drugSelectionArea.insertBefore(draggedItem, targetItem);
                } else {
                    drugSelectionArea.insertBefore(draggedItem, targetItem.nextSibling);
                }
            }
        }
        function handleDrop(e) { e.preventDefault(); }
        function handleDragEnd(e) {
            if (draggedItem) { draggedItem.style.opacity = '1'; }
            draggedItem = null;
            const currentItems = Array.from(drugSelectionArea.querySelectorAll('.drug-selection-item'));
            const reorderedDrugs = [];
            currentItems.forEach(item => {
                const drugId = parseInt(item.dataset.drugId);
                const drugData = selectedDrugs.find(d => d.id === drugId);
                if (drugData) {
                    const colorPicker = item.querySelector('input[type="color"]');
                    if (colorPicker) drugData.color = colorPicker.value;
                    reorderedDrugs.push(drugData);
                }
            });
            selectedDrugs.length = 0;
            selectedDrugs.push(...reorderedDrugs);
        }

        customizationUI.querySelector('.customization-button.add').addEventListener('click', () => {
            showAddDrugsUI(selectedDrugs, drugSelectionArea, renderDrugItem);
        });
        customizationUI.querySelector('.customization-button.save').addEventListener('click', () => {
            const finalDrugs = selectedDrugs.filter(drug => {
                 const itemInUI = drugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                 return itemInUI && !itemInUI.hasAttribute('data-remove');
            }).map(drug => {
                 const itemInUI = drugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                 const colorPicker = itemInUI ? itemInUI.querySelector('input[type="color"]') : null;
                 return { id: drug.id, name: drug.name, color: colorPicker ? colorPicker.value : drug.color };
            });
            localStorage.setItem('customQuickUseDrugs', JSON.stringify(finalDrugs));
            customizationUI.remove();
            addQuickUseButtons();
            showNotification('Quick use drugs updated successfully!', 'success');
        });
        customizationUI.querySelector('.customization-button.cancel').addEventListener('click', () => {
            customizationUI.remove();
        });

        document.body.appendChild(customizationUI);

        function closeCustomizationOnClickOutside(e) {
            if (justOpened) return; // Ignore clicks right after opening
            const isSettingsButton = e.target.closest('.drug-settings-button');
            const isAddDrugsUI = e.target.closest('#add-drugs-ui');
            if (customizationUI && !customizationUI.contains(e.target) && !isSettingsButton && !isAddDrugsUI) {
                customizationUI.remove();
                document.removeEventListener('click', closeCustomizationOnClickOutside);
            }
        }
        setTimeout(() => { document.addEventListener('click', closeCustomizationOnClickOutside); }, 100);
    }

    function showAddDrugsUI(selectedDrugsRef, parentDrugSelectionArea, renderDrugItemFn) {
        const existingAddUI = document.getElementById('add-drugs-ui');
        if (existingAddUI) existingAddUI.remove();

        const addDrugsUI = document.createElement('div');
        addDrugsUI.id = 'add-drugs-ui';
        addDrugsUI.innerHTML = `
            <h3>Add Drugs to Quick Use</h3>
            <input type="text" placeholder="Search drugs...">
            <div class="add-drug-list-container"></div>
            <div class="add-drugs-button-container">
                <button class="add-drugs-done-button">Done</button>
            </div>
        `;

        const searchBox = addDrugsUI.querySelector('input[type="text"]');
        const drugListContainer = addDrugsUI.querySelector('.add-drug-list-container');
        const availableDrugs = drugList.length > 0 ? drugList : fallbackDrugs;

        function refreshDrugList(searchTerm = '') {
            drugListContainer.innerHTML = '';
            const filteredDrugs = availableDrugs.filter(drug => drug.name.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filteredDrugs.length === 0) {
                drugListContainer.innerHTML = '<div style="padding: 10px; color: #aaa;">No drugs found</div>';
                return;
            }
            filteredDrugs.forEach(drug => {
                const parentItem = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                const isSelectedAndNotRemoved = parentItem && !parentItem.hasAttribute('data-remove');
                const drugItem = document.createElement('div');
                drugItem.className = `add-drug-item ${isSelectedAndNotRemoved ? 'selected' : ''}`;
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isSelectedAndNotRemoved;
                checkbox.style.marginRight = '10px';
                const nameSpan = document.createElement('span');
                nameSpan.textContent = drug.name;
                drugItem.appendChild(checkbox);
                drugItem.appendChild(nameSpan);

                const handleClick = () => {
                    const parentItemOnClick = parentDrugSelectionArea.querySelector(`.drug-selection-item[data-drug-id="${drug.id}"]`);
                    const currentlySelectedAndNotRemoved = parentItemOnClick && !parentItemOnClick.hasAttribute('data-remove');
                    checkbox.checked = !currentlySelectedAndNotRemoved;

                    if (!currentlySelectedAndNotRemoved) {
                        if (parentItemOnClick) {
                             parentItemOnClick.style.opacity = '1';
                             parentItemOnClick.style.textDecoration = 'none';
                             parentItemOnClick.removeAttribute('data-remove');
                             const parentCheckbox = parentItemOnClick.querySelector('input[type="checkbox"]');
                             if(parentCheckbox) parentCheckbox.checked = true;
                             if (!selectedDrugsRef.some(d => d.id === drug.id)) {
                                 const existingColorPicker = parentItemOnClick.querySelector('input[type="color"]');
                                 selectedDrugsRef.push({ ...drug, color: existingColorPicker ? existingColorPicker.value : getDefaultDrugColor(drug.id) });
                             }
                        } else {
                             const newDrugData = {...drug, color: getDefaultDrugColor(drug.id)};
                             renderDrugItemFn(newDrugData);
                             selectedDrugsRef.push(newDrugData);
                        }
                        drugItem.classList.add('selected');
                        drugItem.style.backgroundColor = '#444';
                    } else {
                        if (parentItemOnClick) {
                            parentItemOnClick.style.opacity = '0.5';
                            parentItemOnClick.style.textDecoration = 'line-through';
                            parentItemOnClick.setAttribute('data-remove', 'true');
                            const parentCheckbox = parentItemOnClick.querySelector('input[type="checkbox"]');
                            if(parentCheckbox) parentCheckbox.checked = false;
                        }
                        drugItem.classList.remove('selected');
                        drugItem.style.backgroundColor = '#333';
                    }
                };
                drugItem.addEventListener('click', handleClick);
                drugListContainer.appendChild(drugItem);
            });
        }
        refreshDrugList();
        searchBox.addEventListener('input', () => { refreshDrugList(searchBox.value); });

        addDrugsUI.querySelector('.add-drugs-done-button').addEventListener('click', () => { addDrugsUI.remove(); });
        document.body.appendChild(addDrugsUI);
        addDrugsUI.addEventListener('click', e => { e.stopPropagation(); });
    }

    function useDrug(id, name) {
        debugLog(`Attempting to use drug: ${name} (ID: ${id}), Using faction drugs: ${useFactionDrugs}`);
        showNotification(`Using ${name}...`, 'info');
        const gui = document.getElementById('drugGui');
        if (gui) gui.style.display = 'none';
        if (useFactionDrugs) tryFactionDrugUseMethod(id, name);
        else tryDirectUseMethod(id, name);
    }

    function tryDirectUseMethod(id, name) {
        debugLog('Attempting direct use method with XMLHttpRequest');
        sessionStorage.setItem('drugUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'direct' }));
        useItemDirectly(id, name);
    }

    function useItemDirectly(id, name) {
        debugLog(`Using item directly: ${name} (ID: ${id})`);
        const token = getNSTStyleToken() || getPageCsrfToken();
        if (token) {
            debugLog(`Using token: ${token.substring(0, 4)}...`);
            submitDrugUseRequest(id, name, token);
        } else {
            console.error('Drug Alerts: Failed to get authorization token');
            showNotification(`Unable to use ${name}: Could not get authorization token`, 'error');
            sessionStorage.removeItem('drugUseInProgress');
        }
    }

    function submitDrugUseRequest(id, name, token) {
        const params = new URLSearchParams({ step: 'useItem', confirm: 'yes', itemID: id, csrf: token });
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/item.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            sessionStorage.removeItem('drugUseInProgress');
            if (this.status === 200) {
                try {
                    const response = JSON.parse(this.responseText);
                    debugLog('Direct use response:', response);
                    if (response && (response.success || (response.text && (response.text.includes('consumed') || response.text.includes('used'))))) {
                        showNotification(`Used ${name} successfully!`, 'success');
                    } else if (response && response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait'))) {
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                    } else {
                        let errorMessage = 'Unknown error';
                        if (response && (response.error || response.message || response.text)) {
                             const tempDiv = document.createElement('div');
                             tempDiv.innerHTML = response.error || response.message || response.text;
                             errorMessage = tempDiv.textContent || tempDiv.innerText || 'Unknown error';
                        }
                        showNotification(`Error: ${errorMessage}`, 'error');
                    }
                } catch (e) {
                    debugLog('Error parsing direct use response or non-JSON:', this.responseText.substring(0, 100));
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
                showNotification(`Unable to use ${name}: Request failed (${this.status})`, 'error');
            }
        };
        xhr.onerror = function() {
            sessionStorage.removeItem('drugUseInProgress');
            showNotification(`Unable to use ${name}: Network error`, 'error');
        };
        xhr.send(params.toString());
    }

    function tryFactionDrugUseMethod(id, name) {
        debugLog(`Attempting faction armoury drug use for ${name} (ID: ${id})`);
        sessionStorage.setItem('drugUseInProgress', JSON.stringify({ id, name, timestamp: Date.now(), method: 'faction' }));
        const isFactionArmouryDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
        if (!isFactionArmouryDrugsPage) {
            sessionStorage.setItem('pendingFactionDrugUse', JSON.stringify({ id, name }));
            const targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=drugs';
            showNotification(`Navigating to faction armoury to use ${name}...`, 'info');
            window.location.href = targetUrl;
            return;
        }
        const token = getNSTStyleToken() || getPageCsrfToken();
        if (!token) {
            console.error('Drug Alerts: No CSRF token found for faction drug');
            showNotification('Unable to use faction drug: Authorization token not found', 'error');
            sessionStorage.removeItem('drugUseInProgress');
            return;
        }
        debugLog(`Using token for faction drug: ${token.substring(0, 4)}...`);
        useFactionDrugById(id, name, token); // Try item.php?fac=1 first
        setTimeout(() => { // Fallback to traditional method if first one doesn't resolve quickly
            if (sessionStorage.getItem('drugUseInProgress')) {
                debugLog('Direct faction method might have failed or is slow, trying traditional method.');
                useFactionDrugDirectly(id, name, token);
            }
        }, 1500);
    }

    function useFactionDrugDirectly(id, name, token) { // Traditional method using factions.php
        debugLog(`Using traditional faction drug method: ${name} (ID: ${id})`);
        let armouryItemID = findArmouryItemId(id, name);
        if (!armouryItemID) {
            debugLog('Could not find armouryItemID for traditional method.');
            return;
        }
        debugLog(`Using faction drug with armouryItemID: ${armouryItemID}`);
        submitFactionDrugUseRequest(armouryItemID, name, token);
    }

    function findArmouryItemId(itemId, itemName) {
         // Finds the specific armoryItemID from the DOM on the faction armoury page
         const drugItems = document.querySelectorAll('#armoury-drugs ul.item-list li, #faction-armoury .drugs-wrap .item, div[class*="armory"] div[class*="drugs"] div[class*="item"]');
         for (const item of drugItems) {
             const nameElements = item.querySelectorAll('.name, .title, .item-name, .name-wrap .t-overflow, [class*="name"], [class*="title"]');
             let foundName = Array.from(nameElements).some(el => el && el.textContent.trim().toLowerCase() === itemName.toLowerCase());
             if (foundName) {
                 const actionLinks = item.querySelectorAll('a[href*="armoryItemID="], button[data-id], a[onclick*="armoryItemAction"], div[data-id]');
                 for (const actionLink of actionLinks) {
                     let match = null;
                     if (actionLink.href) match = actionLink.href.match(/armoryItemID=(\d+)/);
                     else if (actionLink.dataset && actionLink.dataset.id) match = [null, actionLink.dataset.id];
                     else if (actionLink.onclick) match = actionLink.onclick.toString().match(/armoryItemAction\((\d+)/);
                     if (match && match[1]) return match[1];
                 }
                 if (item.dataset && item.dataset.id) return item.dataset.id;
                 if (item.getAttribute('data-armoryitemid')) return item.getAttribute('data-armoryitemid');
             }
         }
         return null;
     }

    function submitFactionDrugUseRequest(armouryItemID, name, token) { // Submits to factions.php
        const params = new URLSearchParams({ step: 'armoryItemAction', confirm: 'yes', armoryItemID, action: 'use', csrf: token });
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/factions.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            sessionStorage.removeItem('drugUseInProgress');
            if (this.status === 200) {
                try {
                    let response, isJson = false;
                    try { response = JSON.parse(this.responseText); isJson = true; } catch (e) { response = { text: this.responseText }; }
                    debugLog('Faction traditional response:', response);
                    if ((isJson && (response.success || (response.message && response.message.includes('used')))) || (!isJson && (response.text.includes('used') || response.text.includes('consumed')))) {
                        showNotification(`Used ${name} from faction armoury successfully!`, 'success');
                    } else if (response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait'))) {
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                    } else {
                        let errorMessage = 'Unknown error';
                         if (isJson && (response.error || response.message)) errorMessage = response.error || response.message;
                         else if (response.text) {
                             const tempDiv = document.createElement('div'); tempDiv.innerHTML = response.text;
                             const errorEl = tempDiv.querySelector('.error, .msg.error, .message.error');
                             errorMessage = (errorEl ? (errorEl.textContent || errorEl.innerText) : (tempDiv.textContent || tempDiv.innerText || 'Unknown error')).replace(/\s+/g, ' ').trim();
                             if (!errorMessage || errorMessage.length < 5) errorMessage = 'Unknown error from faction response';
                         }
                        showNotification(`Error: ${errorMessage}`, 'error');
                    }
                } catch (e) {
                    showNotification('Error using faction drug: Response processing error', 'error');
                }
            } else {
                showNotification(`Error using faction drug: Request failed (${this.status})`, 'error');
            }
        };
        xhr.onerror = function() {
            sessionStorage.removeItem('drugUseInProgress');
            showNotification('Error using faction drug: Network error', 'error');
        };
        xhr.send(params.toString());
    }

    function useFactionDrugById(id, name, token) { // Submits to item.php?fac=1
        debugLog(`Trying direct faction drug use via item.php?fac=1: ${name} (ID: ${id})`);
        const params = new URLSearchParams({ step: 'useItem', confirm: 'yes', itemID: id, fac: '1', csrf: token });
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.torn.com/item.php', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            if (this.status === 200) {
                try {
                    let response, isJson = false;
                    try { response = JSON.parse(this.responseText); isJson = true; } catch (e) { response = { text: this.responseText }; }
                    debugLog('Faction direct (item.php?fac=1) response:', response);
                    if ((isJson && (response.success || (response.text && (response.text.includes('consumed') || response.text.includes('used'))))) || (!isJson && (response.text.includes('consumed') || response.text.includes('used')))) {
                        showNotification(`Used ${name} from faction armoury successfully!`, 'success');
                        sessionStorage.removeItem('drugUseInProgress'); // Success, clear flag for fallback
                    } else if (response.text && (response.text.includes('cooldown') || response.text.includes('effect of a drug') || response.text.includes('wait'))) {
                        let cooldownMessage = extractCooldownMessage(response.text) || 'You are on drug cooldown';
                        showNotification(cooldownMessage, 'info');
                        sessionStorage.removeItem('drugUseInProgress'); // Cooldown, clear flag for fallback
                    } else {
                         let errorMessage = 'Unknown error from item.php?fac=1';
                         if (isJson && (response.error || response.message)) errorMessage = response.error || response.message;
                         else if (response.text) {
                             const tempDiv = document.createElement('div'); tempDiv.innerHTML = response.text;
                             const errorEl = tempDiv.querySelector('.error, .msg.error, .message.error');
                             errorMessage = (errorEl ? (errorEl.textContent || errorEl.innerText) : (tempDiv.textContent || tempDiv.innerText || 'Unknown error')).replace(/\s+/g, ' ').trim();
                             if (!errorMessage || errorMessage.length < 5) errorMessage = 'Unknown error from item.php?fac=1 response';
                         }
                        debugLog('Direct faction (item.php?fac=1) method returned potential error (will try backup):', errorMessage);
                    }
                } catch (e) {
                    debugLog('Error processing direct faction (item.php?fac=1) response:', e);
                }
            } else {
                debugLog('Direct faction (item.php?fac=1) request failed with status:', this.status);
            }
        };
        xhr.onerror = function() {
            debugLog('Direct faction (item.php?fac=1) request failed with network error');
        };
        xhr.send(params.toString());
    }

    function extractCooldownMessage(responseText) {
        // Extracts cooldown time string if available, otherwise returns generic message part
        if (!responseText) return null;
        const timeMatch = responseText.match(/data-time=["']?(\d+)["']?/);
        const timeMatch2 = responseText.match(/wait\s+(\d+)\s*m\s+(\d+)\s*s/i);
        const timeMatch3 = responseText.match(/wait\s+(\d+)\s+seconds?/i);
        const timeMatch4 = responseText.match(/wait\s+(\d+)\s+minutes?/i);
        let seconds = 0;
        if (timeMatch && timeMatch[1]) seconds = parseInt(timeMatch[1]);
        else if (timeMatch2 && timeMatch2[1] && timeMatch2[2]) seconds = parseInt(timeMatch2[1]) * 60 + parseInt(timeMatch2[2]);
        else if (timeMatch3 && timeMatch3[1]) seconds = parseInt(timeMatch3[1]);
        else if (timeMatch4 && timeMatch4[1]) seconds = parseInt(timeMatch4[1]) * 60;
        if (seconds > 0) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `Drug Cooldown: ${minutes}m ${remainingSeconds}s remaining`;
        } else {
            try { // Fallback message extraction
                const tempDiv = document.createElement('div'); tempDiv.innerHTML = responseText;
                const messageEl = tempDiv.querySelector('.message, .msg, .cont_gray');
                let textContent = (messageEl ? (messageEl.textContent || messageEl.innerText) : (tempDiv.textContent || tempDiv.innerText || '')).trim();
                if (textContent.length > 100) textContent = textContent.substring(0, 100) + '...';
                if (textContent) return textContent;
            } catch(e) { /* ignore */ }
        }
        return null;
    }

    function showNotification(message, type = 'info') {
        document.querySelectorAll('.drug-notification').forEach(note => note.remove());
        const notification = document.createElement('div');
        notification.className = `drug-notification ${type}`;
        let cleanMessage = message;
        if (message.includes('<') && message.includes('>')) { // Basic HTML stripping
            try { const tempDiv = document.createElement('div'); tempDiv.innerHTML = message; cleanMessage = tempDiv.textContent || tempDiv.innerText || message; } catch (e) {}
        }
        cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();
        if (cleanMessage.toLowerCase().includes('cooldown')) {
             notification.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px; font-size: 16px;">Drug Cooldown Active</div><div>${cleanMessage}</div>`;
             notification.style.minWidth = '280px'; notification.style.padding = '15px 25px';
        } else {
             notification.textContent = cleanMessage;
        }
        document.body.appendChild(notification);
        notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
        notification.style.opacity = '0';
        void notification.offsetWidth;
        requestAnimationFrame(() => { notification.style.transform = 'translate(-50%, -50%) scale(1)'; notification.style.opacity = '1'; });
        const duration = (type === 'error' || type === 'info') ? 7000 : 4000;
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            notification.addEventListener('transitionend', () => notification.remove(), { once: true });
        }, duration);
        debugLog(`Notification [${type}]: ${cleanMessage}`); // Keep this log
    }

    function getNSTStyleToken() { // Tries RFC cookie first
        try { const rfcCookie = getRFC(); if (rfcCookie) return rfcCookie; } catch (e) {}
        return null;
    }

    function extractTokenFromPage() { // Extracts CSRF token from various page sources
        try {
            if (typeof window.csrf !== 'undefined' && window.csrf) return window.csrf;
            if (typeof $ !== 'undefined' && typeof $.cookie === 'function') { const c = $.cookie('csrf'); if(c) return c; }
            const inputs = document.querySelectorAll('input[name="csrf"], input[name="X-Csrf-Token"], input[data-csrf]');
            for (const input of inputs) { const t = input.value || input.dataset?.csrf; if(t) return t; }
            const patterns = [ /["']csrf["']\s*:\s*["']([a-f0-9]{16,})["']/, /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, /value=["']([a-f0-9]{16,})["']\s*name=["']csrf["']/ ];
            const scripts = document.querySelectorAll('script:not([src])');
            for (const script of scripts) { if (!script.textContent) continue; for (const p of patterns) { const m = script.textContent.match(p); if(m && m[1]) return m[1]; } }
            const meta = document.querySelector('meta[name="csrf-token"]'); if(meta && meta.content) return meta.content;
        } catch (e) {}
        return null;
    }

    function getPageCsrfToken() { return extractTokenFromPage(); }

    function getRFC() { // Gets RFC value, preferring jQuery cookie if available
        if (typeof $ !== 'undefined' && typeof $.cookie === 'function') { const c = $.cookie('rfc_v'); if(c) return c; }
        try { const cs = document.cookie.split('; '); for (const c of cs) { const [n, v] = c.split('='); if(n === 'rfc_v') return v; } } catch (e) {}
        return null;
    }

    function hasDrugCooldown() { // Checks for drug cooldown icon/label
        if (document.querySelector("[aria-label^='Drug Cooldown:']")) return true;
        const icons = document.querySelectorAll('.status-icons__wrap a, .status-icons li, .user-icons__wrap a, [class*="statusIcon"]');
        for (const icon of icons) {
            const label = icon.getAttribute('aria-label') || '';
            const title = icon.getAttribute('title') || '';
            const cl = icon.classList.toString();
            if ((label.includes('Drug') && label.includes('Cooldown')) || (title.includes('Drug') && title.includes('Cooldown'))) return true;
            // Check common cooldown icon classes + confirm text to avoid matching other cooldowns
            if ((cl.includes('icon5') || cl.includes('drug') || cl.includes('cooldown')) && ((label.includes('Drug') && label.includes('Cooldown')) || (title.includes('Drug') && title.includes('Cooldown')))) return true;
        }
        return false;
    }

    function fetchDrugs() { // Fetches available drugs from item page, uses fallback on failure
        return new Promise((resolve) => {
            fetch('https://www.torn.com/item.php')
                .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.text(); })
                .then(html => {
                    const parser = new DOMParser(); const doc = parser.parseFromString(html, 'text/html');
                    const drugItems = [];
                    // Primary selector for items page drug list
                    const items = doc.querySelectorAll('#item-market-main-wrap ul[data-category="Drugs"] li[data-item]');
                    if (items.length > 0) {
                         items.forEach(item => {
                             const id = item.dataset.item ? parseInt(item.dataset.item) : null;
                             const nameElem = item.querySelector('.name, .title, .item-name');
                             const name = nameElem ? nameElem.textContent.trim() : null;
                             // Ensure it's a known drug from the fallback list
                             if (id && name && fallbackDrugs.some(fb => fb.name === name)) drugItems.push({ id, name });
                         });
                    } else { // Fallback selectors if primary fails
                         const fbItems = doc.querySelectorAll('.item-info-wrap[data-category="Drugs"], .item-cont[data-item]');
                         fbItems.forEach(item => {
                              const idAttr = item.dataset.item || item.closest('[data-item]')?.dataset.item;
                              const id = idAttr ? parseInt(idAttr) : null;
                              const nameElem = item.querySelector('.name, .title, .item-name');
                              const name = nameElem ? nameElem.textContent.trim() : null;
                              if (id && name && fallbackDrugs.some(fb => fb.name === name) && !drugItems.some(ex => ex.id === id)) drugItems.push({ id, name });
                         });
                    }
                    const uniqueDrugs = Array.from(new Map(drugItems.map(item => [item.id, item])).values());
                    resolve(uniqueDrugs.length > 0 ? uniqueDrugs : [...fallbackDrugs]); // Resolve with found drugs or fallback
                })
                .catch(error => {
                    console.error('Drug Alerts: Error fetching drugs:', error);
                    resolve([...fallbackDrugs]); // Resolve with fallback on error
                });
        });
    }

    function startCooldownChecks() {
        let lastCooldownStatus = null;
        let checkInterval = 30000; // Default 30s
        let intervalId = null;
        let observer = null;

        const checkCooldown = () => {
            const hasCooldown = hasDrugCooldown();
            if (hasCooldown !== lastCooldownStatus) {
                lastCooldownStatus = hasCooldown;
                if (!hasCooldown) {
                    if (!alertElements) alertElements = createAlert(drugList); // Show alert if needed
                    checkInterval = 30000; // Normal interval
                } else {
                    if (alertElements) removeExistingAlerts(); // Remove alert if cooldown active
                    checkInterval = 5000; // Check more often when on cooldown
                }
                clearTimeout(intervalId);
                intervalId = setTimeout(checkCooldown, checkInterval);
            } else {
                 clearTimeout(intervalId); // Reschedule even if status hasn't changed
                 intervalId = setTimeout(checkCooldown, checkInterval);
            }
        };

        setTimeout(checkCooldown, 1500); // Initial check after delay

        try { // Setup MutationObserver for faster UI updates on cooldown changes
            observer = new MutationObserver((mutations) => {
                const relevantMutation = mutations.some(m => {
                    const t = m.target;
                    if (t && t.nodeType === 1 && (t.closest('.status-icons__wrap, .user-icons__wrap') || t.matches('[aria-label*="Cooldown"]'))) return true;
                    return Array.from(m.addedNodes).concat(Array.from(m.removedNodes)).some(n => n.nodeType === 1 && (n.matches('[aria-label*="Cooldown"]') || n.querySelector('[aria-label*="Cooldown"]')));
                });
                if (relevantMutation) { clearTimeout(intervalId); checkCooldown(); } // Check immediately on relevant changes
            });
            const target = document.querySelector('#user-icons, #status-icons, body'); // Observe status icons or body
            if (target) observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-label', 'title', 'style'] });
        } catch (e) { console.error("Drug Alerts: Failed to set up MutationObserver", e); }

        console.log('%c Drug Alerts Initialized ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    }

    function checkForPendingDrugUse() { // Handles actions after navigation (e.g., showing GUI, using pending faction drug)
        try {
            const fromAlert = sessionStorage.getItem('fromDrugAlert');
            const pendingFactionUse = sessionStorage.getItem('pendingFactionDrugUse');
            if (fromAlert) {
                sessionStorage.removeItem('fromDrugAlert');
                const isItemsPage = window.location.href.includes('torn.com/item.php');
                const isFacDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
                const onCorrectPage = (isItemsPage && !useFactionDrugs) || (isFacDrugsPage && useFactionDrugs);
                if (onCorrectPage) {
                    setTimeout(() => { // Delay showing GUI slightly for page load
                        if (drugList && drugList.length > 0 && !hasDrugCooldown()) {
                            removeExistingAlerts();
                            alertElements = createAlert(drugList);
                            if (alertElements && alertElements.gui) {
                                alertElements.gui.style.display = 'block';
                                const searchInput = alertElements.gui.querySelector('.drug-search');
                                if (searchInput) searchInput.focus();
                            }
                        }
                    }, 1200);
                }
            } else if (pendingFactionUse) {
                 const isFacDrugsPage = window.location.href.includes('factions.php') && window.location.href.includes('armoury') && window.location.href.includes('sub=drugs');
                 if (isFacDrugsPage) {
                      try {
                           const pendingUse = JSON.parse(pendingFactionUse);
                           if (pendingUse.id && pendingUse.name) {
                                sessionStorage.removeItem('pendingFactionDrugUse');
                                setTimeout(() => { useDrug(pendingUse.id, pendingUse.name); }, 1000); // Delay use slightly
                           } else { sessionStorage.removeItem('pendingFactionDrugUse'); }
                      } catch (e) { sessionStorage.removeItem('pendingFactionDrugUse'); }
                 }
            }
            sessionStorage.removeItem('drugUseInProgress'); // Clear any stale progress flag
        } catch (e) {
            console.error('Drug Alerts: Error checking pending use:', e);
            sessionStorage.removeItem('drugUseInProgress');
            sessionStorage.removeItem('fromDrugAlert');
            sessionStorage.removeItem('pendingFactionDrugUse');
        }
    }

    function removeExistingAlerts() { // Only removes main alert/GUI and customization popups
        document.querySelectorAll('.drug-alert, .drug-gui, #drug-customization-ui, #add-drugs-ui')
            .forEach(el => el.remove());
        if (alertElements) alertElements = null;
    }

    function initialize() {
        useFactionDrugs = localStorage.getItem('useFactionDrugs') === 'true';
        removeExistingAlerts(); // Clean up main elements
        document.querySelectorAll('#drug-customization-ui, #add-drugs-ui').forEach(el => el.remove()); // Ensure customization UIs are gone

        checkForPendingDrugUse();

        fetchDrugs().then(fetchedDrugs => {
            drugList = fetchedDrugs;
            addQuickUseButtons(); // Add quick use panel
            startCooldownChecks(); // Start monitoring cooldown status
        }).catch(err => {
             console.error("Drug Alerts: Critical error during drug fetch:", err);
             drugList = [...fallbackDrugs];
             startCooldownChecks(); // Start checks even if fetch failed
        });
    }

    // Start the script after the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
