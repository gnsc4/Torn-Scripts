// ==UserScript==
// @name         Torn Race Config GUI
// @version      3.1.6
// @description  GUI to configure Torn racing parameters and create races with presets and quick launch buttons
// @author       GNSC4
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/master/RaceConfiguration.raw.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/master/RaceConfiguration.raw.user.js
// @run-at       document-end
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const GM = {
        xmlHttpRequest: (details) => {
            return new Promise((resolve, reject) => {
                fetch(details.url, {
                    method: details.method,
                    headers: details.headers,
                    body: details.method === 'POST' ? details.data : undefined
                })
                .then(response => response.json())
                .then(data => {
                    if (details.onload) {
                        details.onload({ status: 200, responseText: JSON.stringify(data) });
                    }
                    resolve(data);
                })
                .catch(error => {
                    if (details.onerror) {
                        details.onerror(error);
                    }
                    reject(error);
                });
            });
        }
    };

    function init() {
        const pollForElements = () => {
            const titleElement = document.querySelector('div.content-title > h4');
            const carDropdown = document.getElementById('carDropdown');
            const carStatusMessage = document.getElementById('carStatusMessage');

            if (titleElement) {
                createToggleButton();
                loadApiKey();
                loadPresets();
                
                // Wait for car elements to be created
                const waitForCarElements = () => {
                    const carDropdown = document.getElementById('carDropdown');
                    const carStatusMessage = document.getElementById('carStatusMessage');
                    
                    if (carDropdown && carStatusMessage) {
                        updateCarList().then(() => {
                            updateQuickLaunchButtons();
                        });
                        console.log('Race Config GUI initialized');
                    } else if (domCheckAttempts < MAX_DOM_CHECK_ATTEMPTS) {
                        domCheckAttempts++;
                        setTimeout(waitForCarElements, 100);
                    } else {
                        console.error('Failed to find car elements after maximum attempts');
                    }
                };
                
                waitForCarElements();
                
            } else if (domCheckAttempts < MAX_DOM_CHECK_ATTEMPTS) {
                domCheckAttempts++;
                setTimeout(pollForElements, 100);
            } else {
                console.error('Failed to find title element after maximum attempts');
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', pollForElements);
        } else {
            pollForElements();
        }
    }

    function initializeScript() {
        if (window.guiInitialized) {
            console.warn('GUI already initialized');
            return;
        }

        const raceConfigGUI = createRaceConfigGUI();
        document.body.appendChild(raceConfigGUI);
        initializeGUI(raceConfigGUI);
        createToggleButton();
        
        window.guiInitialized = true;
        console.log('Race Config GUI initialized successfully');
    }

    let guiInitialized = false;
    let domCheckAttempts = 0;
    const MAX_DOM_CHECK_ATTEMPTS = 100;

    const style = document.createElement('style');
    style.textContent = `
        #raceConfigGUI {
            position: fixed;
            top: 85px;
            left: 20px;
            background-color: #222;
            color: #ddd;
            border: 1px solid #555;
            padding: 25px;
            z-index: 999999 !important;
            font-family: Arial, sans-serif;
            border-radius: 10px;
            max-width: 500px;  /* Increased from 450px */
            max-height: 90vh;
            overflow-y: auto;
            display: none;
            user-select: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
            scrollbar-width: thin;
            scrollbar-color: #444 #222;
        }

        /* Webkit Scrollbar Styling */
        #raceConfigGUI::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        #raceConfigGUI::-webkit-scrollbar-track {
            background: #222;
            border-radius: 4px;
        }

        #raceConfigGUI::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 4px;
            border: 2px solid #222;
        }

        #raceConfigGUI::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        #raceConfigGUI::-webkit-scrollbar-corner {
            background: #222;
        }

        #raceConfigGUI .api-key-section,
        #raceConfigGUI .config-section,
        #raceConfigGUI .car-select-section,
        #raceConfigGUI .presets-section {
            margin-bottom: 25px;
            padding: 15px;
            background-color: #2a2a2a;
            border-radius: 8px;
            border: 1px solid #444;
            position: relative;
            z-index: 999999 !important;
        }

        #raceConfigGUI h2, 
        #raceConfigGUI h3, 
        #raceConfigGUI h4 {
            color: #fff;
            font-size: 1.2em;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #444;
            text-align: center;
        }

        #raceConfigGUI input[type="text"],
        #raceConfigGUI input[type="number"],
        #raceConfigGUI input[type="password"],
        #raceConfigGUI input[type="date"],
        #raceConfigGUI input[type="time"],
        #raceConfigGUI select {
            padding: 8px 12px;
            margin: 5px 0;
            border: 1px solid #555;
            background-color: #333 !important;
            color: #eee !important;
            border-radius: 5px;
            width: calc(100% - 26px);
            font-size: 14px;
            -webkit-text-fill-color: #eee !important;
            transition: background-color 0.3s ease, border-color 0.3s ease;
            box-shadow: 0 0 0 1000px #333 inset !important;
        }

        #raceConfigGUI input:-webkit-autofill,
        #raceConfigGUI input:-webkit-autofill:hover,
        #raceConfigGUI input:-webkit-autofill:focus,
        #raceConfigGUI input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #333 inset !important;
            -webkit-text-fill-color: #eee !important;
            transition: background-color 0s 50000s;
            caret-color: #eee !important;
        }

        #raceConfigGUI input:focus,
        #raceConfigGUI select:focus {
            border-color: #666;
            outline: none;
            box-shadow: 0 0 5px rgba(85, 85, 85, 0.5);
        }

        #raceConfigGUI label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
            font-size: 14px;
        }

        .gui-button,
        .preset-button,
        #toggleRaceGUIButton,
        #createRaceButton,
        #closeGUIButton,
        #setNowButton {
            color: #ddd;
            background-color: #555;
            border: 1px solid #777;
            border-radius: 3px;
            padding: 8px 15px;
            cursor: pointer;
            margin: 5px;
            transition: background-color 0.3s ease;
            font-size: 0.9em;
            display: inline-block;
            text-decoration: none;
        }

        .gui-button:hover,
        .preset-button:hover,
        .remove-preset:hover,
        #toggleRaceGUIButton:hover,
        #createRaceButton:hover,
        #closeGUIButton:hover,
        #setNowButton:hover {
            background-color: #777;
        }

        #createRaceButton {
            background-color: #2d5a3f !important;
            border-color: #3d7a5f !important;
            font-size: 16px !important;
            padding: 12px 24px !important;
            margin: 15px auto !important;
            display: block !important;
            width: 80% !important;
        }

        #createRaceButton:hover {
            background-color: #3d7a5f !important;
        }

        .preset-buttons-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
            margin-bottom: 15px;
            padding: 5px;
            width: 100%;
            box-sizing: border-box;
        }

        .preset-button-container {
            position: relative;
            display: inline-flex;
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 10px;
            text-align: center;
        }

        .remove-preset {
            background-color: #955;
            color: #eee;
            padding: 0;
            border-radius: 50%;
            font-size: 14px;
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            text-decoration: none;  /* Remove underline */
        }

        .remove-preset:hover {
            background-color: #c77;
            transform: scale(1.1);
            transition: all 0.2s ease;
            text-decoration: none;  /* Keep underline removed on hover */
        }

        #statusMessageBox {
            margin-top: 15px;
            padding: 12px;
            border-radius: 5px;
            font-size: 14px;
            text-align: center;
        }

        #statusMessageBox.success {
            background-color: #1a472a;
            border: 1px solid #2d5a3f;
        }

        #statusMessageBox.error {
            background-color: #5c1e1e;
            border: 1px solid #8b2e2e;
        }

        .driver-inputs-container {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }

        .driver-input-wrapper {
            flex: 1;
            min-width: 0;
            margin-right: 5px;
        }

        .driver-input-wrapper:last-child {
            margin-right: 0;
        }

        .preset-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
        }

        .api-key-wrapper {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 10px;
            margin: 0 auto;
            max-width: 400px;
            position: relative;
        }

        .api-key-wrapper label {
            display: inline;
            margin-bottom: 0;
            white-space: nowrap;
            min-width: 65px;
        }

        #closeGUIButton {
            position: absolute;
            top: -15px;
            right: -15px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: #555;
            color: #ddd;
            border: 1px solid #777;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            z-index: 1000000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        #closeGUIButton:hover {
            background-color: #777;
            transform: scale(1.1);
            transition: all 0.2s ease;
        }

        .banner-container {
            position: relative;
            margin-bottom: 25px; /* Increased from 15px */
            padding-top: 5px;
        }

        #raceBanner {
            width: 100%;
            height: auto;
            border-radius: 5px;
            display: block;
            margin-bottom: 15px; /* Added margin below banner */
        }

        #raceConfigGUI h2 {
            margin-top: 10px; /* Added margin above the heading */
        }

        .show-password-btn {
            background: none;
            border: none;
            color: #777;
            cursor: pointer;
            padding: 5px;
            font-size: 14px;
            position: absolute;
            right: 80px;
            top: 50%;
            transform: translateY(-50%);
            transition: color 0.3s ease;
        }

        .show-password-btn:hover {
            color: #999;
        }

        .quick-launch-container {
            display: none !important;
            position: relative !important;
            flex-direction: column !important;  /* Changed to column */
            gap: 5px !important;
            margin-top: 5px !important;
            margin-bottom: 10px !important;
            width: 100% !important;
            max-width: 800px !important;
            background-color: #2a2a2a !important;
            padding: 5px !important;
            border-radius: 5px !important;
            border: 1px solid #444 !important;
            z-index: 1 !important;
        }

        .quick-launch-container:not(:empty) {
            display: flex !important;
            justify-content: flex-start !important;
        }

        .quick-launch-button {
            color: #fff !important;
            background-color: #555 !important;
            border: 1px solid #777 !important;
            border-radius: 3px !important;
            padding: 5px 10px !important;
            cursor: pointer !important;
            font-size: 0.9em !important;
            white-space: nowrap !important;
            width: auto !important;
            display: inline-block !important;
            transition: all 0.2s ease !important;
            margin: 2px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
            flex-shrink: 0 !important;
        }

        .quick-launch-button:hover {
            background-color: #3d7a5f !important;
            border-color: #777 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
        }

        .car-select-section .car-input-container {
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }

        .car-select-section .car-id-wrapper {
            flex: 0 0 30%;
        }

        .car-select-section .car-dropdown-wrapper {
            flex: 0 0 70%;
        }

        .car-select-section input,
        .car-select-section select {
            width: 100% !important;
            box-sizing: border-box;
        }

        .quick-launch-status {
            position: relative !important;
            margin-top: 5px !important;
            padding: 10px 15px !important;
            border-radius: 5px !important;
            color: #fff !important;
            font-size: 14px !important;
            opacity: 0 !important;
            transition: opacity 0.3s ease !important;
            text-align: center !important;
            width: calc(100% - 30px) !important;
            background-color: transparent !important;
            z-index: 999999 !important;
            margin-left: auto !important;
            margin-right: auto !important;
            display: block !important;
            min-height: 20px !important; /* Added to maintain space */
        }

        .quick-launch-status.success {
            background-color: #1a472a !important;
            border: 1px solid #2d5a3f !important;
            opacity: 1 !important;
        }

        .quick-launch-status.error {
            background-color: #5c1e1e !important;
            border: 1px solid #8b2e2e !important;
            opacity: 1 !important;
        }

        .quick-launch-status.show {
            opacity: 1 !important;
        }

        .quick-launch-container .button-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            width: 100% !important;
        }
    `;

    document.head.appendChild(style);

    function createRaceConfigGUI() {
        let gui = document.createElement('div');
        gui.id = 'raceConfigGUI';
        gui.innerHTML = `
            <div class="banner-container">
                <button type="button" id="closeGUIButton" class="close-button" title="Close GUI">×</button>
                <img id="raceBanner" src="https://www.torn.com/images/v2/racing/header/banners/976_classA.png" alt="Racing Banner">
                <h2>Race Configuration</h2>
            </div>

            <div class="api-key-section">
                <h4>API Key</h4>
                <div class="api-key-wrapper">
                    <label for="apiKeyInput">API Key:</label>
                    <input type="password" 
                           id="apiKeyInput" 
                           placeholder="Enter your API Key" 
                           autocomplete="new-password"
                           autocapitalize="off"
                           autocorrect="off"
                           spellcheck="false"
                           style="flex: 1;">
                    <button type="button" class="show-password-btn" id="showApiKey" title="Show/Hide API Key">👁️</button>
                    <button id="saveApiKeyButton" class="gui-button">Save</button>
                </div>
            </div>

            <div class="config-section">
                <h4>Race Settings</h4>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 2;">
                        <label for="trackSelect">Track:</label>
                        <select id="trackSelect">
                            <option value="6">6 - Uptown</option>
                            <option value="7">7 - Withdrawal</option>
                            <option value="8">8 - Underdog</option>
                            <option value="9">9 - Parkland</option>
                            <option value="10">10 - Docks</option>
                            <option value="11">11 - Commerce</option>
                            <option value="12">12 - Two Islands</option>
                            <option value="15">15 - Industrial</option>
                            <option value="16">16 - Vector</option>
                            <option value="17">17 - Mudpit</option>
                            <option value="18">18 - Hammerhead</option>
                            <option value="19">19 - Sewage</option>
                            <option value="20">20 - Meltdown</option>
                            <option value="21">21 - Speedway</option>
                            <option value="23">23 - Stone Park</option>
                            <option value="24">24 - Convict</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label for="lapsInput">Laps:</label>
                        <input type="number" id="lapsInput" value="100" min="1" max="100">
                    </div>
                </div>

                <div class="config-params-section">
                    <div class="driver-inputs-container">
                        <div class="driver-input-wrapper">
                            <label for="minDriversInput">Min Drivers:</label>
                            <input type="number" id="minDriversInput" value="2" min="2" max="10">
                        </div>
                        <div class="driver-input-wrapper">
                            <label for="maxDriversInput">Max Drivers:</label>
                            <input type="number" id="maxDriversInput" value="2" min="2" max="10">
                        </div>
                        <div class="driver-input-wrapper">
                            <label for="betAmountInput">Bet: <span style="font-size: 0.8em; color: #ccc;">(Max 10M)</span></label>
                            <input type="number" id="betAmountInput" value="0" min="0" max="10000000">
                        </div>
                    </div>
                </div>

                <div><label for="raceNameInput">Race Name: <span style="font-size: 0.8em; color: #ccc;">(Required)</span></label>
                    <input type="text" 
                           id="raceNameInput" 
                           placeholder="Enter Race Name" 
                           pattern="[A-Za-z0-9 ]+"
                           title="Only letters, numbers and spaces allowed"
                           autocomplete="off"
                           oninput="this.value = this.value.replace(/[^A-Za-z0-9 ]/g, '')"></div>

                <div><label for="passwordInput">Password: <span style="font-size: 0.8em; color: #ccc;">(Optional)</span></label>
                    <input type="text" 
                           id="passwordInput" 
                           placeholder="Race Password Optional" 
                           autocomplete="off"
                           autocapitalize="off"
                           autocorrect="off"
                           spellcheck="false"></div>

                <div class="time-config">
                    <label>Race Start Time (TCT 24hr):</label>
                    <div class="time-selector">
                        <select id="hourSelect" style="width: auto; display: inline-block;"></select>
                        <span style="margin: 0 5px;">:</span>
                        <select id="minuteSelect" style="width: auto; display: inline-block;"></select>
                        <button id="setNowButton" class="gui-button" style="padding: 5px 10px; font-size: 0.8em; margin-left: 5px; vertical-align: baseline;">NOW</button>
                    </div>
                </div>
            </div>


            <div class="car-select-section config-section">
                <h4>Car Selection</h4>
                <div class="car-input-container">
                    <div class="car-id-wrapper">
                        <label for="carIdInput">Car ID:</label>
                        <input type="text" 
                               id="carIdInput" 
                               placeholder="Enter Car ID" 
                               style="margin-right: 5px;">
                    </div>
                    <div class="car-dropdown-wrapper">
                        <label for="carDropdown">Car:</label>
                        <select id="carDropdown">
                            <option value="">Select a car...</option>
                        </select>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button id="updateCarsButton" class="gui-button" style="width: 80%; max-width: 200px; display: block; margin: 0 auto;">Update Cars</button>
                    <div id="carStatusMessage" style="font-size: 0.8em; color: #aaa; margin-top: 5px;"></div>
                </div>
            </div>


            <div class="presets-section config-section">
                <h4>Presets</h4>
                <div id="presetButtonsContainer" class="preset-buttons-container">
                </div>
                <div class="preset-actions">
                    <button id="savePresetButton" class="gui-button">Save Preset</button>
                    <button id="clearPresetsButton" class="gui-button">Clear Presets</button>
                </div>
                <div id="statusMessageBox" style="display:none;">Status Message</div>
            </div>

            <div class="action-buttons" style="text-align: center; margin-top: 15px;">
                <button id="createRaceButton" class="gui-button">Create Race</button>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 1.2em;">
                Script created by <a href="https://www.torn.com/profiles.php?XID=268863" target="_blank" style="color: #888; text-decoration: none;">GNSC4 \[268863\]</a><br>
                <a href="https://www.torn.com/forums.php#/p=threads&f=67&t=16454445&b=0&a=0" target="_blank" style="color: #888; text-decoration: none;">v3.1.6 Official Forum Link</a>
            </div>
        `;

        gui.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });

        return gui;
    }

    function initializeGUI(gui) {
        loadApiKey();
        populateTimeDropdowns();
        updateCarDropdown();
        loadPresets();

        const apiKeyInput = document.getElementById('apiKeyInput');
        const saveApiKeyButton = document.getElementById('saveApiKeyButton');
        const trackSelect = document.getElementById('trackSelect');
        const lapsInput = document.getElementById('lapsInput');
        const minDriversInput = document.getElementById('minDriversInput');
        const maxDriversInput = document.getElementById('maxDriversInput');
        const raceNameInput = document.getElementById('raceNameInput');
        const passwordInput = document.getElementById('passwordInput');
        const betAmountInput = document.getElementById('betAmountInput');
        const hourSelect = document.getElementById('hourSelect');
        const minuteSelect = document.getElementById('minuteSelect');
        const setNowButton = document.getElementById('setNowButton');
        const carIdInput = document.getElementById('carIdInput');
        const changeCarButton = document.getElementById('changeCarButton');
        const carDropdown = document.getElementById('carDropdown');
        const updateCarsButton = document.getElementById('updateCarsButton');
        const carStatusMessage = document.getElementById('carStatusMessage');
        const savePresetButton = document.getElementById('savePresetButton');
        const clearPresetsButton = document.getElementById('clearPresetsButton');
        const presetButtonsContainer = document.getElementById('presetButtonsContainer');
        const statusMessageBox = document.getElementById('statusMessageBox');
        const createRaceButton = document.getElementById('createRaceButton');
        const closeGUIButton = document.getElementById('closeGUIButton');

        if (saveApiKeyButton) {
            saveApiKeyButton.addEventListener('click', () => {
                saveApiKey();
            });
        } else {
            console.error("Error: saveApiKeyButton element not found in initializeGUI");
        }

        if (setNowButton) {
            setNowButton.addEventListener('click', () => {
                setTimeToNow();
            });
        } else {
             console.error("Error: setNowButton element not found in initializeGUI");
        }

        if (updateCarsButton) {
            updateCarsButton.addEventListener('click', () => {
                updateCarList();
            });
        } else {
            console.error("Error: updateCarsButton element not found in initializeGUI");
        }

        if (carDropdown) {
            carDropdown.addEventListener('change', () => {
                carIdInput.value = carDropdown.value;
            });
        }  else {
            console.error("Error: carDropdown element not found in initializeGUI");
        }

        if (savePresetButton) {
            savePresetButton.addEventListener('click', () => {
                savePreset();
            });
        } else {
            console.error("Error: savePresetButton element not found in initializeGUI");
        }

        if (clearPresetsButton) {
            clearPresetsButton.addEventListener('click', () => {
                clearPresets();
            });
        } else {
            console.error("Error: clearPresetsButton element not found in initializeGUI");
        }

        if (createRaceButton) {
            createRaceButton.addEventListener('click', () => {
                createRace();
            });
        } else {
            console.error("Error: createRaceButton element not found in initializeGUI");
        }

        if (closeGUIButton) {
            closeGUIButton.addEventListener('click', () => {
                toggleRaceGUI();
            });
        } else {
            console.error("Error: closeGUIButton element not found in initializeGUI");
        }

        if (carDropdown && carIdInput) {
            carDropdown.addEventListener('change', () => {
                carIdInput.value = carDropdown.value;
            });

            carIdInput.addEventListener('input', () => {
                const value = carIdInput.value.trim();
                if (value && carDropdown.querySelector(`option[value="${value}"]`)) {
                    carDropdown.value = value;
                } else {
                    carDropdown.value = '';
                }
            });
        }

        if (document.getElementById('showApiKey')) {
            document.getElementById('showApiKey').addEventListener('click', function() {
                const apiKeyInput = document.getElementById('apiKeyInput');
                const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
                apiKeyInput.setAttribute('type', type);
                this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
            });
        }

        dragElement(gui);

        displayPresets();
        updateQuickPresetsDisplay();
        updateQuickLaunchButtons();

        displayStatusMessage('GUI Loaded', 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function createToggleButton() {
        const existingButton = document.getElementById('toggleRaceGUIButton');
        if (existingButton) {
            console.log('Toggle button already exists');
            return existingButton;
        }

        const titleElement = document.querySelector('div.content-title > h4');
        if (!titleElement) {
            console.error('Title element not found');
            return null;
        }

        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            margin-bottom: 10px !important;
            align-items: flex-start !important;
        `;

        const button = document.createElement('button');
        button.id = 'toggleRaceGUIButton';
        button.className = 'gui-button';
        button.textContent = 'Race Config';
        button.style.position = 'relative';
        button.style.zIndex = '999';

        const quickLaunchContainer = document.createElement('div');
        quickLaunchContainer.id = 'quickLaunchContainer';
        quickLaunchContainer.className = 'quick-launch-container';

        const quickLaunchStatus = document.createElement('div');
        quickLaunchStatus.className = 'quick-launch-status';
        quickLaunchContainer.appendChild(quickLaunchStatus);

        wrapper.appendChild(button);
        wrapper.appendChild(quickLaunchContainer);
        titleElement.parentNode.insertBefore(wrapper, titleElement.nextSibling);

        button.addEventListener('click', () => {
            console.log('Toggle button clicked');
            toggleRaceGUI();
        });

        updateQuickLaunchButtons();

        return button;
    }

    function setBodyScroll(disable) {
        document.body.style.overflow = disable ? 'hidden' : '';
        document.body.style.position = disable ? 'fixed' : '';
        document.body.style.width = disable ? '100%' : '';
    }

    function toggleRaceGUI() {
        let gui = document.getElementById('raceConfigGUI');
        if (gui) {
            const isVisible = gui.style.display === 'none';
            gui.style.display = isVisible ? 'block' : 'none';
            setBodyScroll(isVisible);
            console.log('Toggling existing GUI:', gui.style.display);
        } else {
            console.log('Creating new GUI');
            gui = createRaceConfigGUI();
            document.body.appendChild(gui);
            initializeGUI(gui);
            gui.style.display = 'block';
            setBodyScroll(true);
        }
    }

    function dragElement(elmnt) {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 40px;
            height: 40px;
            cursor: move;
            background: transparent;
            pointer-events: all;
        `;
        elmnt.insertBefore(dragHandle, elmnt.firstChild);

        const style = document.createElement('style');
        style.textContent = `
            #closeGUIButton {
                z-index: 1001;
                pointer-events: all !important;
            }
            .drag-handle {
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Calculate new position
            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;

            // Get window dimensions and element dimensions
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const elmntWidth = elmnt.offsetWidth;
            const elmntHeight = elmnt.offsetHeight;

            // Calculate boundaries with padding
            const padding = 10;
            const minLeft = padding;
            const maxLeft = windowWidth - elmntWidth - padding;
            const minTop = padding;
            const maxTop = windowHeight - elmntHeight - padding;

            // Apply boundaries
            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            // Update position
            elmnt.style.top = newTop + "px";
            elmnt.style.left = newLeft + "px";
        }

        function closeDragElement() {
            // Keep existing code
            document.onmouseup = null;
            document.onmousemove = null;

            // Add boundary check after drag ends
            enforceWindowBoundaries(elmnt);
        }

        function enforceWindowBoundaries(element) {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const elmntWidth = element.offsetWidth;
            const elmntHeight = element.offsetHeight;
            const padding = 10;

            let { top, left } = element.getBoundingClientRect();
            
            // Enforce boundaries
            if (left < padding) element.style.left = padding + "px";
            if (top < padding) element.style.top = padding + "px";
            if (left + elmntWidth > windowWidth - padding) {
                element.style.left = (windowWidth - elmntWidth - padding) + "px";
            }
            if (top + elmntHeight > windowHeight - padding) {
                element.style.top = (windowHeight - elmntHeight - padding) + "px";
            }
        }

        // Add window resize handler
        window.addEventListener('resize', () => enforceWindowBoundaries(elmnt));
    }

    const STORAGE_API_KEY = 'raceConfigAPIKey_release_NoGMf';

    function saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            displayStatusMessage('Please enter a valid API key', 'error');
            return;
        }
    
        try {
            GM_setValue(STORAGE_API_KEY, apiKey);
            displayStatusMessage('API Key Saved', 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            updateCarList();
        } catch (e) {
            console.error('Error saving API key:', e);
            displayStatusMessage('Failed to save API key', 'error');
        }
    }
    
    function loadApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (!apiKeyInput) return;
        
        try {
            const savedKey = GM_getValue(STORAGE_API_KEY, '');
            apiKeyInput.value = savedKey || '';
        } catch (e) {
            console.error('Error loading API key:', e);
        }
    }

    function displayStatusMessage(message, type = '') {
        const statusMessageBox = document.getElementById('statusMessageBox');
        if (!statusMessageBox) return;

        statusMessageBox.textContent = message;
        statusMessageBox.style.display = message ? 'block' : 'none';

        statusMessageBox.className = ' ';
        if (type === 'error' || type === 'success') {
            statusMessageBox.classList.add(type);
        }
    }

    function savePreset() {
        const carDropdown = document.getElementById('carDropdown');
        const carId = document.getElementById('carIdInput').value;
        const raceName = document.getElementById('raceNameInput').value.trim();

        if (!raceName) {
            displayStatusMessage('Please enter a race name before saving preset.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        if (!carId || carDropdown.value === '') {
            displayStatusMessage('Please select a car before creating a preset.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const presetName = prompt("Enter a name for this preset:");
        if (!presetName) {
            displayStatusMessage('Preset name cannot be empty.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const carOption = carDropdown.querySelector(`option[value="${carId}"]`);
        const carName = carOption ? carOption.textContent.split(' (ID:')[0] : null;

        const presetData = {
            track: document.getElementById('trackSelect').value,
            laps: document.getElementById('lapsInput').value,
            minDrivers: document.getElementById('minDriversInput').value,
            maxDrivers: document.getElementById('maxDriversInput').value,
            raceName: document.getElementById('raceNameInput').value,
            password: document.getElementById('passwordInput').value,
            betAmount: document.getElementById('betAmountInput').value,
            hour: document.getElementById('hourSelect').value,
            minute: document.getElementById('minuteSelect').value,
            carId: carId,
            carName: carName,
            selectedCar: carDropdown.value
        };
        let presets = loadPresets();
        presets[presetName] = presetData;
        set_value('race_presets', presets);
        displayPresets();
        updateQuickPresetsDisplay();
        updateQuickLaunchButtons();
        displayStatusMessage(`Preset "${presetName}" saved.`, 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function applyPreset(presetName) {
        const presets = loadPresets();
        const preset = presets[presetName];
        if (preset) {
            const trackSelect = document.getElementById('trackSelect');
            const lapsInput = document.getElementById('lapsInput');
            const minDriversInput = document.getElementById('minDriversInput');
            const maxDriversInput = document.getElementById('maxDriversInput');
            const raceNameInput = document.getElementById('raceNameInput');
            const passwordInput = document.getElementById('passwordInput');
            const betAmountInput = document.getElementById('betAmountInput');
            const hourSelect = document.getElementById('hourSelect');
            const minuteSelect = document.getElementById('minuteSelect');
            const carDropdown = document.getElementById('carDropdown');
            const carIdInput = document.getElementById('carIdInput');

            if (trackSelect) trackSelect.value = preset.track;
            if (lapsInput) lapsInput.value = preset.laps;
            if (minDriversInput) minDriversInput.value = preset.minDrivers;
            if (maxDriversInput) maxDriversInput.value = preset.maxDrivers;
            if (raceNameInput) raceNameInput.value = preset.raceName;
            if (passwordInput) passwordInput.value = preset.password;
            if (betAmountInput) betAmountInput.value = preset.betAmount;
            if (hourSelect) hourSelect.value = preset.hour;
            if (minuteSelect) minuteSelect.value = preset.minute;

            if (carDropdown && preset.selectedCar) {
                carDropdown.value = preset.selectedCar;
            }
            if (carIdInput) {
                carIdInput.value = preset.carId || preset.selectedCar || '';
            }

            displayStatusMessage(`Preset "${presetName}" applied.`, 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } else {
            displayStatusMessage(`Preset "${presetName}" not found.`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    function loadPresets() {
        return get_value('race_presets') || {};
    }

    function loadAllPresets() {
        return loadPresets() || {};
    }

    function displayPresets() {
        const presets = loadPresets();
        const container = document.getElementById('presetButtonsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (Object.keys(presets).length === 0) {
            container.textContent = 'No presets saved yet.';
            return;
        }

        const trackNames = {
            '6': 'Uptown', '7': 'Withdrawal', '8': 'Underdog', '9': 'Parkland',
            '10': 'Docks', '11': 'Commerce', '12': 'Two Islands', '15': 'Industrial',
            '16': 'Vector', '17': 'Mudpit', '18': 'Hammerhead', '19': 'Sewage',
            '20': 'Meltdown', '21': 'Speedway', '23': 'Stone Park', '24': 'Convict'
        };

        Object.keys(presets).forEach(presetName => {
            const preset = presets[presetName];
            const presetButtonContainer = document.createElement('div');
            presetButtonContainer.className = 'preset-button-container';

            const presetButton = document.createElement('button');
            presetButton.className = 'preset-button';

            const carName = preset.carName || 'Unknown Car';

            presetButton.innerHTML = `
                <div class="preset-title">${presetName}</div>
                <div class="preset-info">
                    ${trackNames[preset.track] || 'Unknown Track'}<br>
                    Laps: ${preset.laps}<br>
                    ${carName}
                </div>
            `;

            presetButton.title = `Apply preset: ${presetName}`;
            presetButton.addEventListener('click', () => applyPreset(presetName));
            presetButtonContainer.appendChild(presetButton);

            const removeButton = document.createElement('a');
            removeButton.className = 'remove-preset';
            removeButton.href = '#';
            removeButton.textContent = '×';
            removeButton.title = `Remove preset: ${presetName}`;
            removeButton.addEventListener('click', (event) => {
                event.preventDefault();
                removePreset(presetName);
            });
            presetButtonContainer.appendChild(removeButton);

            container.appendChild(presetButtonContainer);
        });
    }

    function applyPreset(presetName) {
        const presets = loadPresets();
        const preset = presets[presetName];
        if (preset) {
            document.getElementById('trackSelect').value = preset.track;
            document.getElementById('lapsInput').value = preset.laps;
            document.getElementById('minDriversInput').value = preset.minDrivers;
            document.getElementById('maxDriversInput').value = preset.maxDrivers;
            document.getElementById('raceNameInput').value = preset.raceName;
            document.getElementById('passwordInput').value = preset.password;
            document.getElementById('betAmountInput').value = preset.betAmount;
            document.getElementById('hourSelect').value = preset.hour;
            document.getElementById('minuteSelect').value = preset.minute;
            
            const carDropdown = document.getElementById('carDropdown');
            const carIdInput = document.getElementById('carIdInput');
            
            if (preset.selectedCar && carDropdown) {
                carDropdown.value = preset.selectedCar;
            }
            
            if (carIdInput) {
                carIdInput.value = preset.carId || preset.selectedCar || '';
            }

            displayStatusMessage(`Preset "${presetName}" applied.`, 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);

        } else {
            displayStatusMessage(`Preset "${presetName}" not found.`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    function removePreset(presetName) {
        if (!confirm(`Are you sure you want to remove preset "${presetName}"?`)) {
            return;
        }
        let presets = loadPresets();
        delete presets[presetName];
        set_value('race_presets', presets);
        displayPresets();
        updateQuickPresetsDisplay();
        updateQuickLaunchButtons();
        displayStatusMessage(`Preset "${presetName}" removed.`, 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function clearPresets() {
        if (confirm("Are you sure you want to clear ALL saved presets?")) {
            set_value('race_presets', {});
            displayPresets();
            updateQuickPresetsDisplay();
            updateQuickLaunchButtons();
            displayStatusMessage('All presets cleared.', 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    function updateQuickPresetsDisplay() {
        const presets = loadAllPresets();
        const quickPresetsContainer = document.getElementById('quickPresetButtonsContainer');

        if (!quickPresetsContainer) return;

        quickPresetsContainer.innerHTML = '';

        const quickPresets = [
            { name: "Quick Uptown 10 Laps", config: { track: '6', laps: '10' } },
            { name: "Quick Speedway 50 Laps", config: { track: '5', laps: '50' } },
        ];

        if (quickPresets.length > 0) {
            quickPresets.forEach(quickPreset => {
                const button = document.createElement('button');
                button.className = 'gui-button quick-race-button';
                button.textContent = quickPreset.name;
                button.title = `Quick Race: ${quickPreset.name}`;
                button.addEventListener('click', () => applyQuickPreset(quickPreset.config));
                quickPresetsContainer.appendChild(button);
            });
        } else {
            quickPresetsContainer.textContent = 'No quick presets defined.';
        }
    }

    function applyQuickPreset(config) {
        if (config) {
            document.getElementById('trackSelect').value = config.track || document.getElementById('trackSelect').options[0].value;
            document.getElementById('lapsInput').value = config.laps || 100;

            displayStatusMessage('Quick preset applied.', 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } else {
            displayStatusMessage('Quick preset config error.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    function updateQuickLaunchButtons() {
        const container = document.getElementById('quickLaunchContainer');
        if (!container) return;

        container.innerHTML = '';
        const presets = loadPresets();

        if (Object.keys(presets).length === 0) {
            container.style.display = 'none';
            return;
        }

        // Create button container and status div
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        const statusDiv = document.createElement('div');
        statusDiv.className = 'quick-launch-status';

        // Add them to the container in the right order
        container.appendChild(buttonContainer);
        container.appendChild(statusDiv);

        const trackNames = {
            '6': 'Uptown', '7': 'Withdrawal', '8': 'Underdog', '9': 'Parkland',
            '10': 'Docks', '11': 'Commerce', '12': 'Two Islands', '15': 'Industrial',
            '16': 'Vector', '17': 'Mudpit', '18': 'Hammerhead', '19': 'Sewage',
            '20': 'Meltdown', '21': 'Speedway', '23': 'Stone Park', '24': 'Convict'
        };

        container.style.display = 'flex';
        Object.entries(presets).forEach(([name, preset]) => {
            const button = document.createElement('button');
            button.className = 'quick-launch-button';
            button.textContent = name;

            const carName = preset.carName || `Car ID: ${preset.carId}`;

            const tooltipInfo = [
                `${name}`,
                `Track: ${trackNames[preset.track] || 'Unknown Track'}`,
                `Car: ${carName}`,
                `Laps: ${preset.laps}`,
                `Drivers: ${preset.minDrivers}-${preset.maxDrivers}`,
                `Password: ${preset.password ? 'Yes' : 'No'}`,
                preset.betAmount > 0 ? `Bet: $${Number(preset.betAmount).toLocaleString()}` : null
            ].filter(Boolean).join('\n');

            button.title = tooltipInfo;

            button.addEventListener('click', async () => {
                await createRaceFromPreset(preset);
            });
            buttonContainer.appendChild(button); // Append to buttonContainer instead of container
        });
    }

    async function createRaceFromPreset(preset) {
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
        if (!apiKey) {
            displayStatusMessage('API Key is required to create race.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const trackId = preset.track;
        const laps = preset.laps;
        const minDrivers = preset.minDrivers;
        const maxDrivers = preset.maxDrivers;
        const raceName = preset.raceName;
        const password = preset.password;
        const betAmount = preset.betAmount;
        const raceHour = preset.hour;
        const raceMinute = preset.minute;
        const carId = preset.carId;

        let startTime = '';
        if (raceHour && raceMinute) {
            startTime = `${raceHour}:${raceMinute}`;
        }

        const rfcValue = getRFC();

        const params = new URLSearchParams();
        params.append('carID', carId);
        params.append('password', password);
        params.append('createRace', 'true');
        params.append('title', raceName);
        params.append('minDrivers', minDrivers);
        params.append('maxDrivers', maxDrivers);
        params.append('trackID', trackId);
        params.append('laps', laps);
        params.append('minClass', '5');
        params.append('carsTypeAllowed', '1');
        params.append('carsAllowed', '5');
        params.append('betAmount', betAmount);
        params.append('waitTime', Math.floor(Date.now() / 1000));
        params.append('rfcv', rfcValue);

        const raceLink = `https://www.torn.com/loader.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=&${params.toString()}`;

        displayStatusMessage('Creating Race...', 'info');

        try {
            const response = await fetch(raceLink);
            const data = await response.text();
            
            const quickLaunchStatus = document.querySelector('.quick-launch-status');
            if (quickLaunchStatus) {
                if (data.includes('success') || response.ok) {
                    quickLaunchStatus.textContent = 'Race Created Successfully!';
                    quickLaunchStatus.className = 'quick-launch-status success show';
                    // Refresh page after successful race creation
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    quickLaunchStatus.textContent = 'Error creating race. Please try again.';
                    quickLaunchStatus.className = 'quick-launch-status error show';
                }
                // Removed the setTimeout that was hiding the status
            }
            
            // Regular status message for the GUI
            if (data.includes('success') || response.ok) {
                displayStatusMessage('Race Created Successfully!', 'success');
            } else {
                displayStatusMessage('Error creating race. Please try again.', 'error');
            }
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } catch (error) {
            const quickLaunchStatus = document.querySelector('.quick-launch-status');
            if (quickLaunchStatus) {
                quickLaunchStatus.textContent = `Error creating race: ${error.message}`;
                quickLaunchStatus.className = 'quick-launch-status error show';
                // Removed the setTimeout that was hiding the status
            }
            
            displayStatusMessage(`Error creating race: ${error.message}`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 5000);
        }
    }

    function populateTimeDropdowns() {
        const hourSelect = document.getElementById('hourSelect');
        const minuteSelect = document.getElementById('minuteSelect');

        if (!hourSelect || !minuteSelect) return;

        for (let i = 0; i <= 23; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.textContent = String(i).padStart(2, '0');
            hourSelect.appendChild(option);
        }

        const minutes = ['00', '15', '30', '45'];
        minutes.forEach(minute => {
            const option = document.createElement('option');
            option.value = minute;
            option.textContent = minute;
            minuteSelect.appendChild(option);
        });
    }

    function setTimeToNow() {
        const hourSelect = document.getElementById('hourSelect');
        const minuteSelect = document.getElementById('minuteSelect');

        if (!hourSelect || !minuteSelect) return;

        const now = moment.utc();
        
        hourSelect.value = String(now.hour()).padStart(2, '0');
        
        const currentMinute = String(now.minute()).padStart(2, '0');
        
        const tempOption = minuteSelect.querySelector('.temp-minute');
        if (tempOption) {
            tempOption.remove();
        }
        
        if (!['00', '15', '30', '45'].includes(currentMinute)) {
            const option = document.createElement('option');
            option.value = currentMinute;
            option.textContent = currentMinute;
            option.className = 'temp-minute';
            minuteSelect.appendChild(option);
        }
        
        minuteSelect.value = currentMinute;
    }

    async function updateCarList() {
        // Wait for elements to be available
        const waitForElements = () => {
            return new Promise((resolve) => {
                const checkElements = () => {
                    const carDropdown = document.getElementById('carDropdown');
                    const carStatusMessage = document.getElementById('carStatusMessage');
                    const updateCarsButton = document.getElementById('updateCarsButton');

                    if (carDropdown && carStatusMessage && updateCarsButton) {
                        resolve({ carDropdown, carStatusMessage, updateCarsButton });
                    } else if (domCheckAttempts < MAX_DOM_CHECK_ATTEMPTS) {
                        domCheckAttempts++;
                        setTimeout(checkElements, 100);
                    } else {
                        resolve(null);
                    }
                };
                checkElements();
            });
        };

        const elements = await waitForElements();
        if (!elements) {
            console.error('Required elements not found for updateCarList');
            return;
        }

        const { carDropdown, carStatusMessage, updateCarsButton } = elements;
        const apiKey = GM_getValue(STORAGE_API_KEY, '');

        if (!apiKey) {
            carStatusMessage.textContent = 'API Key Required';
            carStatusMessage.style.color = 'red';
            return;
        }

        if (carStatusMessage) {
            carStatusMessage.textContent = 'Updating Cars...';
            carStatusMessage.style.color = '#aaa';
        }
        
        if (carDropdown) {
            carDropdown.disabled = true;
        }
        
        if (updateCarsButton) {
            updateCarsButton.disabled = true;
        }

        try {
            const response = await GM.xmlHttpRequest({
                url: `https://api.torn.com/v2/user/?selections=enlistedcars&key=${apiKey}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            if (data.error) {
                                if (carStatusMessage) {
                                    carStatusMessage.textContent = `API Error: ${data.error.error}`;
                                    carStatusMessage.style.color = 'red';
                                }
                            } else if (data.enlistedcars) {
                                populateCarDropdown(data.enlistedcars);
                                if (carStatusMessage) {
                                    carStatusMessage.textContent = 'Cars Updated';
                                    carStatusMessage.style.color = '#efe';
                                }
                            } else {
                                if (carStatusMessage) {
                                    carStatusMessage.textContent = 'No car data received';
                                    carStatusMessage.style.color = 'orange';
                                }
                            }
                        } else {
                            if (carStatusMessage) {
                                carStatusMessage.textContent = `HTTP Error: ${response.status}`;
                                carStatusMessage.style.color = 'red';
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing response:', e);
                        if (carStatusMessage) {
                            carStatusMessage.textContent = 'Error parsing car data';
                            carStatusMessage.style.color = 'red';
                        }
                    }
                    if (carDropdown) carDropdown.disabled = false;
                    if (updateCarsButton) updateCarsButton.disabled = false;
                    if (carStatusMessage) {
                        setTimeout(() => { 
                            if (carStatusMessage) carStatusMessage.textContent = ''; 
                        }, 3000);
                    }
                },
                onerror: function(error) {
                    console.error('Request failed:', error);
                    if (carStatusMessage) {
                        carStatusMessage.textContent = 'Request failed';
                        carStatusMessage.style.color = 'red';
                    }
                    if (carDropdown) carDropdown.disabled = false;
                    if (updateCarsButton) updateCarsButton.disabled = false;
                    if (carStatusMessage) {
                        setTimeout(() => { 
                            if (carStatusMessage) carStatusMessage.textContent = ''; 
                        }, 5000);
                    }
                }
            });
        } catch (error) {
            console.error('Error updating cars:', error);
            if (carStatusMessage) {
                carStatusMessage.textContent = `Error: ${error.message}`;
                carStatusMessage.style.color = 'red';
            }
            if (carDropdown) carDropdown.disabled = false;
            if (updateCarsButton) updateCarsButton.disabled = false;
            if (carStatusMessage) {
                setTimeout(() => { 
                    if (carStatusMessage) carStatusMessage.textContent = ''; 
                }, 5000);
            }
        }
    }

    function populateCarDropdown(cars) {
        const carDropdown = document.getElementById('carDropdown');
        if (!carDropdown) return;

        carDropdown.innerHTML = '<option value="">Select a car...</option>';
        
        const sortedCars = Object.values(cars)
            .filter(car => car.leased !== '1')
            .sort((a, b) => {
                const nameA = a.name || a.item_name;
                const nameB = b.name || b.item_name;
                return nameA.localeCompare(nameB);
            });

        sortedCars.forEach(car => {
            const carName = car.name || car.item_name;
            const option = document.createElement('option');
            option.value = car.id;
            option.textContent = `${carName} (ID: ${car.id})`;
            carDropdown.appendChild(option);
        });
    }

    function updateCarDropdown() {
        updateCarList();
    }

    function getRFC() {
        if (typeof $.cookie !== 'function') {
            console.error("Error: jQuery Cookie plugin is not loaded correctly!");
            console.log("Attempting fallback cookie parsing for rfc_v...");
            let rfc = null;
            const cookies = document.cookie.split("; ");
            for (let i in cookies) {
                let cookie = cookies[i].split("=");
                if (cookie[0] && cookie[0].trim() === "rfc_v") {
                    rfc = decodeURIComponent(cookie[1]);
                    console.log("Fallback cookie parsing successful. rfc_v value:", rfc);
                    return rfc;
                }
            }
            console.warn("Fallback cookie parsing failed to find rfc_v cookie.");
            return '';
        }

        let rfcValue = $.cookie('rfc_v');
        if (rfcValue) {
            return rfcValue;
        } else {
            console.log("jQuery.cookie failed to get rfc_v, attempting fallback parsing...");
            let rfc = null;
            const cookies = document.cookie.split("; ");
            for (let i in cookies) {
                let cookie = cookies[i].split("=");
                if (cookie[0] && cookie[0].trim() === "rfc_v") {
                    rfc = decodeURIComponent(cookie[1]);
                    console.log("Fallback cookie parsing successful. rfc_v value:", rfc);
                    return rfc;
                }
            }
            console.warn("Fallback cookie parsing failed to find rfc_v cookie.");
            return '';
        }
    }

    async function createRace() {
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
        const raceName = document.getElementById('raceNameInput').value.trim();

        if (!apiKey) {
            displayStatusMessage('API Key is required to create race.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        if (!raceName) {
            displayStatusMessage('Please enter a race name.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const trackId = document.getElementById('trackSelect').value;
        const laps = document.getElementById('lapsInput').value;
        const minDrivers = document.getElementById('minDriversInput').value;
        const maxDrivers = document.getElementById('maxDriversInput').value;
        const password = document.getElementById('passwordInput').value;
        const betAmount = document.getElementById('betAmountInput').value;
        const raceHour = document.getElementById('hourSelect').value;
        const raceMinute = document.getElementById('minuteSelect').value;
        const carId = document.getElementById('carIdInput').value;

        let startTime = '';
        if (raceHour && raceMinute) {
            startTime = `${raceHour}:${raceMinute}`;
        }

        const rfcValue = getRFC();

        const params = new URLSearchParams();
        params.append('carID', carId);
        params.append('password', password);
        params.append('createRace', 'true');
        params.append('title', raceName);
        params.append('minDrivers', minDrivers);
        params.append('maxDrivers', maxDrivers);
        params.append('trackID', trackId);
        params.append('laps', laps);
        params.append('minClass', '5');
        params.append('carsTypeAllowed', '1');
        params.append('carsAllowed', '5');
        params.append('betAmount', betAmount);
        params.append('waitTime', Math.floor(Date.now() / 1000));
        params.append('rfcv', rfcValue);

        const raceLink = `https://www.torn.com/loader.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=&${params.toString()}`;

        displayStatusMessage('Creating Race...', 'info');

        try {
            const response = await fetch(raceLink);
            const data = await response.text();
            
            if (data.includes('success') || response.ok) {
                displayStatusMessage('Race Created Successfully!', 'success');
                // Refresh page after successful race creation
                setTimeout(() => window.location.reload(), 1500);
            } else {
                displayStatusMessage('Error creating race. Please try again.', 'error');
            }
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } catch (error) {
            displayStatusMessage(`Error creating race: ${error.message}`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 5000);
        }
    }

    function set_value(key, value) {
        try {
            if (key === STORAGE_API_KEY) {
                GM_setValue(key, value);
            } else {
                GM_setValue(key, JSON.stringify(value));
            }
        } catch (e) {
            console.error('Error saving value:', e);
        }
    }

    function get_value(key, defaultValue) {
        try {
            if (key === STORAGE_API_KEY) {
                return GM_getValue(key, defaultValue);
            }
            const value = GM_getValue(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Error reading value:', e);
            return defaultValue;
        }
    }

    init();
})();
