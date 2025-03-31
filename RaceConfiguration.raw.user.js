// ==UserScript==
// @name         Torn Race Manager
// @version      3.7.6
// @description  GUI to configure Torn racing parameters and create races with presets and quick launch buttons
// @author       GNSC4 [268863]
// @match        https://www.torn.com/loader.php?sid=racing*
// @match        https://www.torn.com/*
// @match        https://api.torn.com/*
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
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @license      MIT
// @namespace    torn.raceconfigguipda
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

    if (typeof document === 'undefined') {
        console.error('Document object not available yet. Script may not run correctly.');
        return;
    }

    const trackNames = {
        '6': 'Uptown',
        '7': 'Withdrawal',
        '8': 'Underdog',
        '9': 'Parkland',
        '10': 'Docks',
        '11': 'Commerce',
        '12': 'Two Islands',
        '15': 'Industrial',
        '16': 'Vector',
        '17': 'Mudpit',
        '18': 'Hammerhead',
        '19': 'Sewage',
        '20': 'Meltdown',
        '21': 'Speedway',
        '23': 'Stone Park',
        '24': 'Convict'
    };

    let guiInitialized = false;
    let domCheckAttempts = 0;
    const MAX_DOM_CHECK_ATTEMPTS = 100;
    const STORAGE_API_KEY = 'raceConfigAPIKey_release_NoGMf';

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
            max-width: 500px;
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
            text-decoration: none;
        }

        .remove-preset:hover {
            background-color: #c77;
            transform: scale(1.1);
            transition: all 0.2s ease;
            text-decoration: none;
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
            margin-bottom: 25px;
            padding-top: 5px;
        }

        #raceBanner {
            width: 100%;
            height: auto;
            border-radius: 5px;
            display: block;
            margin-bottom: 15px;
        }

        #raceConfigGUI h2 {
            margin-top: 10px;
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
    `;

    style.textContent += `
        .quick-launch-container {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            max-width: 800px !important;
            gap: 5px !important;
            margin-top: 5px !important;
            margin-bottom: 10px !important;
            background-color: #2a2a2a !important;
            padding: 10px !important;
            border-radius: 5px !important;
            border: 1px solid #444 !important;
            z-index: 1 !important;
        }

        .quick-launch-container:not(:empty) {
            justify-content: flex-start !important;
        }

        .quick-launch-container .button-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            width: 100% !important;
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
            min-height: 20px !important;
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
        
        .quick-launch-status.info {
            background-color: #2a2a2a !important;
            border: 1px solid #444 !important;
            opacity: 1 !important;
        }

        .quick-launch-status.show {
            opacity: 1 !important;
        }
    `;

    style.textContent += `
        .race-alert {
            position: relative !important;
            display: inline-flex !important;
            align-items: center !important;
            margin-left: 10px !important;
            background-color: rgba(255, 68, 68, 0.8) !important;
            color: white !important;
            text-align: center !important;
            padding: 5px 10px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            user-select: none !important;
            vertical-align: middle !important;
            order: 2 !important;
        }
    `;

    style.textContent += `
        #raceToggleRow {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            width: 100% !important;
            flex-direction: row !important;
            position: relative !important;
            z-index: 100 !important;
            margin-bottom: 5px !important;
        }

        .button-container-wrapper {
            display: inline-flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin-right: auto !important;
        }
    `;

    document.head.appendChild(style);

    function init() {
        const isRacingPage = window.location.href.includes('sid=racing');

        initializeRaceAlerts();

        initializeAutoJoinSection();

        if (isRacingPage) {
            initializeRacingFeatures();
            initializeRaceFiltering(); 
            resumeAutoJoin();

            setTimeout(() => {
                initializeOfficialRacesSection();
            }, 1500);
        }
    }

    function initializeRaceAlerts() {
        const raceAlertEnabled = GM_getValue('raceAlertEnabled', false);

        const checkbox = document.getElementById('raceAlertEnabled');
        if (checkbox) {
            checkbox.checked = raceAlertEnabled;
        }

        if (raceAlertEnabled) {
            updateRaceAlert();
            if (!window.raceAlertInterval) {
                window.raceAlertInterval = setInterval(updateRaceAlert, 5000);
            }
        } else {
            removeRaceAlert();
        }

        if (!window.alertListenerAdded) {
            document.addEventListener('change', function(e) {
                if (e.target && e.target.id === 'raceAlertEnabled') {
                    const isEnabled = e.target.checked;
                    GM_setValue('raceAlertEnabled', isEnabled);
                    
                    if (isEnabled) {
                        updateRaceAlert();
                        if (!window.raceAlertInterval) {
                            window.raceAlertInterval = setInterval(updateRaceAlert, 5000);
                        }
                    } else {
                        removeRaceAlert();
                        if (window.raceAlertInterval) {
                            clearInterval(window.raceAlertInterval);
                            window.raceAlertInterval = null;
                        }
                    }
                }
            });
            window.alertListenerAdded = true;
        }
    }

    function initializeRacingFeatures() {
        const pollForElements = () => {
            const titleElement = document.querySelector('div.content-title > h4');
            if (titleElement) {
                createToggleButton();
                loadApiKey();
                loadPresets();

                initializeAutoJoinSection();

                setTimeout(() => {
                    updateCarList().then(() => {
                        updateQuickLaunchButtons();
                        console.log('Race Config GUI car list updated');
                    }).catch(err => {
                        console.warn('Failed to update car list, but continuing:', err);
                    });
                }, 1500);
                
                console.log('Race Config GUI initialized');
            } else if (domCheckAttempts < MAX_DOM_CHECK_ATTEMPTS) {
                domCheckAttempts++;
                setTimeout(pollForElements, 100);
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

    function createRaceConfigGUI() {
        let gui = document.createElement('div');
        gui.id = 'raceConfigGUI';
        gui.innerHTML = `
            <div class="banner-container">
                <button type="button" id="closeGUIButton" class="close-button" title="Close GUI">×</button>
                <button type="button" id="minimizeGUIButton" title="Minimize/Maximize GUI">_</button>
                <img id="raceBanner" src="https://www.torn.com/images/v2/racing/header/banners/976_classA.png" alt="Racing Banner">
                <h2>Race Configuration</h2>
            </div>

            <div class="api-key-section">
                <h4>Settings & API Key</h4>
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
                <div class="settings-toggle" style="margin-top: 10px;">
                    <input type="checkbox" id="raceAlertEnabled" />
                    <label for="raceAlertEnabled">Enable Race Status Alerts</label>
                </div>
            </div>

            <!-- New Official Races Section -->
            <div class="official-races-section config-section">
                <h4>Join Official Races</h4>
                <div class="car-input-container">
                    <div class="car-id-wrapper">
                        <label for="officialCarId">Car ID:</label>
                        <input type="text" id="officialCarId" placeholder="Enter Car ID">
                    </div>
                    <div class="car-dropdown-wrapper">
                        <label for="officialCarDropdown">Car:</label>
                        <select id="officialCarDropdown">
                            <option value="">Select a car...</option>
                        </select>
                    </div>
                </div>
                
                <div class="official-track-buttons" id="officialTrackButtons">
                    <!-- Will be populated with track buttons -->
                </div>
                
                <div id="officialRaceStatus"></div>
                
                <div class="preset-actions">
                    <button id="saveOfficialPresetButton" class="gui-button">Save As Quick Launch</button>
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
                    <div class="time-save-option">
                        <input type="checkbox" id="saveTimeToPreset">
                        <label for="saveTimeToPreset">Save time to preset</label>
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

            <div class="auto-join-section config-section">
                <h4>Auto Join Settings</h4>
                <div class="auto-join-config">
                    <div class="track-filter">
                        <label for="autoJoinTrack">Track:</label>
                        <select id="autoJoinTrack" multiple>
                            <option value="all" selected>All Tracks</option>
                            <option value="6">Uptown</option>
                            <option value="7">Withdrawal</option>
                            <option value="8">Underdog</option>
                            <option value="9">Parkland</option>
                            <option value="10">Docks</option>
                            <option value="11">Commerce</option>
                            <option value="12">Two Islands</option>
                            <option value="15">Industrial</option>
                            <option value="16">Vector</option>
                            <option value="17">Mudpit</option>
                            <option value="18">Hammerhead</option>
                            <option value="19">Sewage</option>
                            <option value="20">Meltdown</option>
                            <option value="21">Speedway</option>
                            <option value="23">Stone Park</option>
                            <option value="24">Convict</option>
                        </select>
                    </div>
                    <div class="laps-filter">
                        <label>Laps Range:</label>
                        <input type="number" id="minLaps" placeholder="Min" min="1" max="100">
                        <span>-</span>
                        <input type="number" id="maxLaps" placeholder="Max" min="1" max="100">
                    </div>
                    <div class="drivers-filter">
                        <label>Drivers Range:</label>
                        <input type="number" id="autoJoinMinDrivers" placeholder="Min" min="2" max="10">
                        <span>-</span>
                        <input type="number" id="autoJoinMaxDrivers" placeholder="Max" min="2" max="10">
                    </div>
                    <div class="car-filter">
                        <label for="autoJoinCar">Car to Use:</label>
                        <select id="autoJoinCar">
                            <option value="">Select a car...</option>
                        </select>
                    </div>
                    <div class="filters">
                        <label><input type="checkbox" id="hidePassworded"> Hide Passworded Races</label>
                        <label><input type="checkbox" id="hideBets"> Hide Races with Bets</label>
                        <label><input type="checkbox" id="hideFullRacesAutoJoin"> Hide Full Races</label>
                    </div>
                    <div class="auto-join-buttons">
                        <button id="startAutoJoin" class="gui-button">Start Auto-Join</button>
                        <button id="stopAutoJoin" class="gui-button" style="display: none;">Stop Auto-Join</button>
                        <button id="refreshCustomEvents" class="gui-button">Refresh Custom Events</button>
                    </div>
                </div>
            </div>

            <div class="action-buttons" style="text-align: center; margin-top: 15px;">
                <button id="createRaceButton" class="gui-button">Create Race</button>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 1.2em;">
                Script created by <a href="https://www.torn.com/profiles.php?XID=268863" target="_blank" style="color: #888; text-decoration: none;">GNSC4 [268863]</a><br>
                <a href="https://www.torn.com/forums.php#/p=threads&f=67&t=16454445&b=0&a=0" target="_blank" style="color: #888; text-decoration: none;">v3.7.6 Official Forum Link</a>
            </div>
        `;

        gui.addEventListener('touchstart', function(e) {

            if (e.target.closest('.drag-handle') || e.target.closest('button')) {
                e.stopPropagation();
            }
        }, { passive: true });

        gui.addEventListener('touchmove', function(e) {
        }, { passive: true });

        const isMinimized = GM_getValue('raceConfigGUIMinimized', false);
        if (isMinimized) {
            gui.classList.add('minimized');
        }

        return gui;
    }

    function initializeGUI(gui) {
        loadApiKey();
        populateTimeDropdowns();
        updateCarDropdown();
        loadPresets();

        initializeOfficialRacesSection();

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
        const minimizeGUIButton = document.getElementById('minimizeGUIButton');

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

        if (minimizeGUIButton) {
            minimizeGUIButton.parentNode.removeChild(minimizeGUIButton);
            console.log("Removed minimizeGUIButton as requested");
        } else {
            console.error("Error: minimizeGUIButton element not found in initializeGUI");
        }

        const titleElement = gui.querySelector('h2');
        if (titleElement) {
            titleElement.addEventListener('click', () => {
                if (gui.classList.contains('minimized')) {
                    toggleMinimizeGUI();
                }
            });
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

        const raceAlertCheckbox = document.getElementById('raceAlertEnabled');
        if (raceAlertCheckbox) {
            raceAlertCheckbox.checked = GM_getValue('raceAlertEnabled', false);
        }

        const mainCarDropdown = document.getElementById('carDropdown');
        const autoJoinCarDropdown = document.getElementById('autoJoinCar');
        const officialCarDropdown = document.getElementById('officialCarDropdown');
        
        if (mainCarDropdown) {
            mainCarDropdown.addEventListener('change', () => {
                if (autoJoinCarDropdown) autoJoinCarDropdown.innerHTML = mainCarDropdown.innerHTML;
                if (officialCarDropdown) officialCarDropdown.innerHTML = mainCarDropdown.innerHTML;
                
                if (autoJoinCarDropdown) autoJoinCarDropdown.value = mainCarDropdown.value;
                if (officialCarDropdown) officialCarDropdown.value = mainCarDropdown.value;
            });
        }

        if (officialCarDropdown) {
            officialCarDropdown.addEventListener('change', () => {
                document.getElementById('officialCarId').value = officialCarDropdown.value;
            });

            document.getElementById('officialCarId').addEventListener('input', () => {
                const value = document.getElementById('officialCarId').value.trim();
                if (value && officialCarDropdown.querySelector(`option[value="${value}"]`)) {
                    officialCarDropdown.value = value;
                } else {
                    officialCarDropdown.value = '';
                }
            });
        }

        const saveOfficialPresetButton = document.getElementById('saveOfficialPresetButton');
        if (saveOfficialPresetButton) {
            saveOfficialPresetButton.addEventListener('click', saveOfficialRacePreset);
        }

        const originalUpdateCarList = updateCarList;
        updateCarList = async function() {
            await originalUpdateCarList();
            if (autoJoinCarDropdown && mainCarDropdown) {
                autoJoinCarDropdown.innerHTML = mainCarDropdown.innerHTML;
            }
        };

        const startAutoJoinButton = document.getElementById('startAutoJoin');
        const stopAutoJoinButton = document.getElementById('stopAutoJoin');
        const refreshCustomEventsButton = document.getElementById('refreshCustomEvents');
        
        if (startAutoJoinButton && stopAutoJoinButton && refreshCustomEventsButton) {
            startAutoJoinButton.addEventListener('click', startAutoJoin);
            stopAutoJoinButton.addEventListener('click', stopAutoJoin);
            refreshCustomEventsButton.addEventListener('click', refreshCustomEventsList);

            const isAutoJoinActive = GM_getValue('autoJoinState', null) !== null;
            startAutoJoinButton.style.display = isAutoJoinActive ? 'none' : 'block';
            stopAutoJoinButton.style.display = isAutoJoinActive ? 'block' : 'none';
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
        `;

        const topRow = document.createElement('div');
        topRow.id = 'raceToggleRow';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container-wrapper';

        const button = document.createElement('button');
        button.id = 'toggleRaceGUIButton';
        button.className = 'gui-button';
        button.textContent = 'Race Config';

        const quickLaunchContainer = document.createElement('div');
        quickLaunchContainer.id = 'quickLaunchContainer';
        quickLaunchContainer.className = 'quick-launch-container';

        buttonContainer.appendChild(button);
        topRow.appendChild(buttonContainer);
        wrapper.appendChild(topRow);
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
            z-index: 1000; /* Ensure it's above content but below close button */
        `;
        elmnt.insertBefore(dragHandle, elmnt.firstChild);

        // Add mobile-friendly scroll styles to the element
        elmnt.style.overscrollBehavior = 'contain';
        elmnt.style.webkitOverflowScrolling = 'touch';
        elmnt.style.touchAction = 'pan-y';

        const style = document.createElement('style');
        style.textContent = `
            #closeGUIButton {
                z-index: 1001;
                pointer-events: all !important;
            }
            .drag-handle {
                z-index: 1000;
            }
            /* Mobile-specific improvements */
            @media (max-width: 767px) {
                #raceConfigGUI {
                    -webkit-overflow-scrolling: touch !important;
                    overflow-y: auto !important;
                    touch-action: pan-y !important;
                    overscroll-behavior-y: contain !important;
                }
                /* Make scrollbar more visible on mobile */
                #raceConfigGUI::-webkit-scrollbar {
                    width: 10px !important;
                }
                #raceConfigGUI::-webkit-scrollbar-thumb {
                    background: #666 !important;
                    border-radius: 5px !important;
                    border: 2px solid #222 !important;
                }
            }
        `;
        document.head.appendChild(style);

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            if (e.type === 'touchstart') return;
            
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        dragHandle.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            pos3 = touch.clientX;
            pos4 = touch.clientY;

            dragHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
            dragHandle.addEventListener('touchend', handleTouchEnd, { passive: true });

            e.preventDefault();
        }, { passive: false });

        function handleTouchMove(e) {
            const touch = e.touches[0];

            pos1 = pos3 - touch.clientX;
            pos2 = pos4 - touch.clientY;
            pos3 = touch.clientX;
            pos4 = touch.clientY;

            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

            e.preventDefault();
        }

        function handleTouchEnd() {
            dragHandle.removeEventListener('touchmove', handleTouchMove);
            dragHandle.removeEventListener('touchend', handleTouchEnd);

            enforceWindowBoundaries(elmnt);
        }
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const elmntWidth = elmnt.offsetWidth;
            const elmntHeight = elmnt.offsetHeight;

            const padding = 10;
            const minLeft = padding;
            const maxLeft = windowWidth - elmntWidth - padding;
            const minTop = padding;
            const maxTop = windowHeight - elmntHeight - padding;

            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            elmnt.style.top = newTop + "px";
            elmnt.style.left = newLeft + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;

            enforceWindowBoundaries(elmnt);
        }

        function enforceWindowBoundaries(element) {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const elmntWidth = element.offsetWidth;
            const elmntHeight = element.offsetHeight;
            const padding = 10;

            let { top, left } = element.getBoundingClientRect();

            if (left < padding) element.style.left = padding + "px";
            if (top < padding) element.style.top = padding + "px";
            if (left + elmntWidth > windowWidth - padding) {
                element.style.left = (windowWidth - elmntWidth - padding) + "px";
            }
            if (top + elmntHeight > windowHeight - padding) {
                element.style.top = (windowHeight - elmntHeight - padding) + "px";
            }
        }

        window.addEventListener('resize', () => enforceWindowBoundaries(elmnt));
    }

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

    function displayStatusMessage(message, type = '', elementId = 'statusMessageBox') {
        const statusElement = document.getElementById(elementId);
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = '';

        if (type) {
            statusElement.classList.add(type);
        }

        statusElement.style.display = message ? 'block' : 'none';
        console.log(`[Status - ${type}]: ${message}`);
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
            setTimeout(() => displayStatusMessage('', ''), 3000);return;
        }

        const presetName = prompt("Enter a name for this preset:");
        if (!presetName) {
            displayStatusMessage('Preset name cannot be empty.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const carOption = carDropdown.querySelector(`option[value="${carId}"]`);
        const carName = carOption ? carOption.textContent.split(' (ID:')[0] : null;

        const saveTime = document.getElementById('saveTimeToPreset').checked;
        const presetData = {
            track: document.getElementById('trackSelect').value,
            laps: document.getElementById('lapsInput').value,
            minDrivers: document.getElementById('minDriversInput').value,
            maxDrivers: document.getElementById('maxDriversInput').value,
            raceName: document.getElementById('raceNameInput').value,
            password: document.getElementById('passwordInput').value,
            betAmount: document.getElementById('betAmountInput').value,
            hour: saveTime ? document.getElementById('hourSelect').value : null,
            minute: saveTime ? document.getElementById('minuteSelect').value : null,
            carId: carId,
            carName: carName,
            selectedCar: carDropdown.value,
            saveTime: saveTime
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

    function getNextAvailableTime(hour, minute) {
        if (!hour || !minute) return null;
        
        const now = moment.utc();
        let targetTime = moment.utc().set({
            hour: parseInt(hour),
            minute: parseInt(minute),
            second: 0,
            millisecond: 0
        });

        if (targetTime.isSameOrBefore(now)) {
            targetTime = targetTime.add(1, 'day');
        }
        
        return targetTime;
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

            if (preset.saveTime && preset.hour && preset.minute) {
                const nextTime = getNextAvailableTime(preset.hour, preset.minute);
                if (nextTime) {
                    if (hourSelect) hourSelect.value = preset.hour;
                    if (minuteSelect) minuteSelect.value = preset.minute;
                }
            } else {
                if (hourSelect) hourSelect.value = '00';
                if (minuteSelect) minuteSelect.value = '00';
            }

            document.getElementById('saveTimeToPreset').checked = preset.saveTime || false;

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
        const autoJoinPresets = loadAutoJoinPresets();
        const officialPresets = loadOfficialRacePresets();

        if (Object.keys(presets).length === 0 && 
            Object.keys(autoJoinPresets).length === 0 &&
            Object.keys(officialPresets).length === 0) {
            container.style.display = 'none';
            return;
        }

        console.log('Creating minimize button');

        // Create a wrapper div for the minimize button to improve click target
        const minimizeButtonWrapper = document.createElement('div');
        minimizeButtonWrapper.id = 'minimizeQuickLaunchButtonWrapper';
        minimizeButtonWrapper.style.cssText = `
            position: absolute !important;
            top: 2px !important;
            right: 2px !important;
            width: 30px !important;
            height: 30px !important;
            z-index: 1000001 !important;
            cursor: pointer !important;
            pointer-events: auto !important;
        `;

        const minimizeButton = document.createElement('button');
        minimizeButton.id = 'minimizeQuickLaunchButton';
        minimizeButton.type = 'button';
        minimizeButton.title = 'Minimize Quick Launch Area';
        minimizeButton.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            background-color: #444 !important;
            color: white !important;
            border: 1px solid #666 !important;
            border-radius: 4px !important;
            font-size: 16px !important;
            cursor: pointer !important;
            z-index: 1000000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
            pointer-events: auto !important;
        `;

        const innerContent = document.createElement('div');
        innerContent.id = 'minimizeQuickLaunchButtonContent';
        innerContent.textContent = '_';
        innerContent.style.cssText = `
            pointer-events: none !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;
        
        minimizeButton.appendChild(innerContent);
        minimizeButtonWrapper.appendChild(minimizeButton);
        container.appendChild(minimizeButtonWrapper);
        console.log('Minimize button added to container');

        // Rest of container creation
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        const statusDiv = document.createElement('div');
        statusDiv.className = 'quick-launch-status';

        const quickLaunchHeader = document.createElement('div');
        quickLaunchHeader.className = 'preset-section-header';
        quickLaunchHeader.textContent = 'Quick Launch Presets';

        const autoJoinHeader = document.createElement('div');
        autoJoinHeader.className = 'preset-section-header';
        autoJoinHeader.textContent = 'Auto Join Presets';

        const officialRaceHeader = document.createElement('div');
        officialRaceHeader.className = 'preset-section-header';
        officialRaceHeader.textContent = 'Official Race Presets';

        const autoJoinContainer = document.createElement('div');
        autoJoinContainer.className = 'button-container';
        
        const officialRaceContainer = document.createElement('div');
        officialRaceContainer.className = 'button-container';

        container.appendChild(quickLaunchHeader);
        container.appendChild(buttonContainer);
        container.appendChild(autoJoinHeader);
        container.appendChild(autoJoinContainer);
        container.appendChild(officialRaceHeader);
        container.appendChild(officialRaceContainer);
        container.appendChild(statusDiv);

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
            buttonContainer.appendChild(button);
        });

        Object.entries(autoJoinPresets).forEach(([name, preset]) => {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'preset-button-container';
            
            const button = document.createElement('button');
            button.className = 'quick-launch-button';
            button.textContent = name;
            button.style.width = 'auto';
            
            const carInfo = preset.carName ? 
                `${preset.carName} (ID: ${preset.selectedCarId})` : 
                `${preset.selectedCarId}`;
                
            button.title = `Auto-join preset: ${name}\nTrack: ${preset.track}\nLaps: ${preset.minLaps}-${preset.maxLaps}\nCar: ${carInfo}`;
            
            button.addEventListener('click', () => {
                applyAutoJoinPreset(preset);
            });

            const removeButton = document.createElement('a');
            removeButton.className = 'remove-preset';
            removeButton.href = '#';
            removeButton.textContent = '×';
            removeButton.title = `Remove auto-join preset: ${name}`;
            removeButton.style.cssText = `
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                background-color: #955 !important;
                color: #eee !important;
                width: 20px !important;
                height: 20px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-decoration: none !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                transition: all 0.2s ease !important;
                z-index: 100 !important;
            `;
            
            removeButton.addEventListener('click', (event) => {
                event.preventDefault();
                removeAutoJoinPreset(name);
            });
            
            buttonWrapper.appendChild(button);
            buttonWrapper.appendChild(removeButton);
            autoJoinContainer.appendChild(buttonWrapper);
        });

        Object.entries(officialPresets).forEach(([name, preset]) => {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'preset-button-container';
            
            const button = document.createElement('button');
            button.className = 'quick-launch-button official';
            button.textContent = name;
            button.style.width = 'auto';
            
            const carInfo = preset.carName ? 
                `${preset.carName} (ID: ${preset.carId})` : 
                `Car ID: ${preset.carId}`;

            let trackNames = "Auto-assigned";
            if (preset.tracks && Array.isArray(preset.tracks)) {
                trackNames = preset.tracks.map(t => t.name).join(', ');
            }
            
            button.title = `Official race preset: ${name}\nTracks: ${trackNames}\nCar: ${carInfo}`;
            
            // Use executeOfficialRacePreset directly to avoid GUI dependencies
            button.addEventListener('click', function() {
                // Show feedback directly without going through showOfficialRaceTrackSelector
                displayQuickLaunchStatus(`Joining official race with ${carInfo}...`, 'info');
                executeOfficialRacePreset(preset);
            });

            const removeButton = document.createElement('a');
            removeButton.className = 'remove-preset';
            removeButton.textContent = '×';
            removeButton.style.cssText = `
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                background-color: #955 !important;
                color: #eee !important;
                width: 20px !important;
                height: 20px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-decoration: none !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                transition: all 0.2s ease !important;
                z-index: 100 !important;
            `;
            
            removeButton.addEventListener('click', function(event) {
                event.preventDefault();
                removeOfficialRacePreset(name);
            });
            
            buttonWrapper.appendChild(button);
            buttonWrapper.appendChild(removeButton);
            officialRaceContainer.appendChild(buttonWrapper);
        });

        container.style.display = 'flex';

        // Replace the button click event handler with a more robust version
        const addButtonListeners = () => {
            const btnWrapper = document.getElementById('minimizeQuickLaunchButtonWrapper');
            const btn = document.getElementById('minimizeQuickLaunchButton');
            if (!btnWrapper || !btn) {
                console.error('Could not find minimize button or wrapper');
                return;
            }

            // Remove existing listeners to prevent duplication
            const newWrapper = btnWrapper.cloneNode(true);
            if (btnWrapper.parentNode) {
                btnWrapper.parentNode.replaceChild(newWrapper, btnWrapper);
            }

            // Add event listeners to the wrapper instead of the button
            newWrapper.addEventListener('click', function(e) {
                console.log('Minimize button wrapper clicked');
                e.preventDefault();
                e.stopPropagation();
                toggleQuickLaunchMinimize();
            });

            newWrapper.addEventListener('touchstart', function(e) {
                console.log('Minimize button wrapper touched');
                e.preventDefault();
                e.stopPropagation(); 
                toggleQuickLaunchMinimize();
            }, { passive: false });

            // Also add to button as a fallback
            const newBtn = newWrapper.querySelector('#minimizeQuickLaunchButton');
            if (newBtn) {
                newBtn.addEventListener('click', function(e) {
                    console.log('Minimize button clicked directly');
                    e.preventDefault();
                    e.stopPropagation();
                    toggleQuickLaunchMinimize();
                });

                newBtn.addEventListener('touchstart', function(e) {
                    console.log('Minimize button touched directly');
                    e.preventDefault();
                    e.stopPropagation();
                    toggleQuickLaunchMinimize();
                }, { passive: false });
            }
        };

        addButtonListeners();
        setTimeout(addButtonListeners, 100); // Double check after a short delay

        // Apply minimized state if needed
        const minimizedState = GM_getValue('quickLaunchMinimized', false);
        if (minimizedState === true) {
            container.classList.add('minimized');
            const btnContent = document.getElementById('minimizeQuickLaunchButtonContent');
            if (btnContent) btnContent.textContent = '□';
            const minimizeBtn = document.getElementById('minimizeQuickLaunchButton');
            if (minimizeBtn) minimizeBtn.title = 'Expand Quick Launch Area';

            // Force container height and styling
            container.style.cssText += "max-height: 35px !important; overflow: hidden !important;";
            
            // Hide these elements specifically when minimized
            const buttonContainer = container.querySelector('.button-container');
            const autoJoinContainer = container.querySelector('.auto-join-preset-container');
            const otherHeaders = container.querySelectorAll('.preset-section-header:not(:first-child)');
            
            if (buttonContainer) buttonContainer.style.display = 'none';
            if (autoJoinContainer) autoJoinContainer.style.display = 'none';
            otherHeaders.forEach(header => header.style.display = 'none');
        }
    }

    function toggleQuickLaunchMinimize() {
        console.log('toggleQuickLaunchMinimize called');
        const container = document.getElementById('quickLaunchContainer');
        const minimizeButton = document.getElementById('minimizeQuickLaunchButton');
        const buttonContent = document.getElementById('minimizeQuickLaunchButtonContent');
        
        if (!container) {
            console.error('Container not found');
            return;
        }
        
        const isCurrentlyMinimized = container.classList.contains('minimized');
        console.log('Current state:', isCurrentlyMinimized ? 'minimized' : 'maximized');
        
        if (isCurrentlyMinimized) {
            container.classList.remove('minimized');
            if (buttonContent) buttonContent.textContent = '_';
            if (minimizeButton) minimizeButton.title = 'Minimize Quick Launch Area';
            GM_setValue('quickLaunchMinimized', false);

            // Show these elements when maximized
            const buttonContainer = container.querySelector('.button-container');
            const autoJoinContainer = container.querySelector('.auto-join-preset-container');
            const otherHeaders = container.querySelectorAll('.preset-section-header:not(:first-child)');
            
            if (buttonContainer) buttonContainer.style.display = 'flex';
            if (autoJoinContainer) autoJoinContainer.style.display = 'grid';
            otherHeaders.forEach(header => header.style.display = 'block');
            
            // Reset height constraints
            container.style.maxHeight = 'none';
            container.style.padding = '10px';
            container.style.overflow = 'visible';
            
            console.log('Container maximized');
        } else {
            container.classList.add('minimized');
            if (buttonContent) buttonContent.textContent = '□';
            if (minimizeButton) minimizeButton.title = 'Expand Quick Launch Area';
            GM_setValue('quickLaunchMinimized', true);

            // Hide these elements when minimized
            const buttonContainer = container.querySelector('.button-container');
            const autoJoinContainer = container.querySelector('.auto-join-preset-container');
            const otherHeaders = container.querySelectorAll('.preset-section-header:not(:first-child)');
            
            if (buttonContainer) buttonContainer.style.display = 'none';
            if (autoJoinContainer) autoJoinContainer.style.display = 'none';
            otherHeaders.forEach(header => header.style.display = 'none');
            
            // Force minimized height
            container.style.maxHeight = '35px';
            container.style.padding = '5px';
            container.style.overflow = 'hidden';
            
            console.log('Container minimized');
        }

        // Additional force override for minimize state
        if (!isCurrentlyMinimized) {
            container.style.cssText += "max-height: 35px !important; overflow: hidden !important;";
        } else {
            container.style.cssText += "max-height: none !important; overflow: visible !important;";
        }
    }

    function saveAutoJoinPreset() {
        const presetName = prompt("Enter a name for this auto-join preset:");
        if (!presetName) return;

        const selectedCarId = document.getElementById('autoJoinCar').value;
        const selectedCarDropdown = document.getElementById('autoJoinCar');
        let carName = "Unknown Car";

        if (selectedCarDropdown && selectedCarId) {
            const selectedOption = selectedCarDropdown.querySelector(`option[value="${selectedCarId}"]`);
            if (selectedOption) {
                carName = selectedOption.textContent.split(' (ID:')[0];
            }
        }
    
        const preset = {
            track: document.getElementById('autoJoinTrack').value,
            minLaps: document.getElementById('minLaps').value,
            maxLaps: document.getElementById('maxLaps').value,
            minDrivers: document.getElementById('autoJoinMinDrivers')?.value || '',
            maxDrivers: document.getElementById('autoJoinMaxDrivers')?.value || '',
            selectedCarId: selectedCarId,
            carName: carName,
            hidePassworded: document.getElementById('hidePassworded').checked,
            hideBets: document.getElementById('hideBets').checked,
            hideFullRaces: document.getElementById('hideFullRacesAutoJoin')?.checked || false
        };

        console.log('[DEBUG] Saving auto-join preset with car:', { id: selectedCarId, name: carName });
    
        const presets = loadAutoJoinPresets();
        presets[presetName] = preset;
        GM_setValue('autoJoinPresets', JSON.stringify(presets));
        updateQuickLaunchButtons();
        displayStatusMessage('Auto-join preset saved', 'success');
    }

    function loadAutoJoinPresets() {
        try {
            return JSON.parse(GM_getValue('autoJoinPresets', '{}'));
        } catch (e) {
            console.error('Error loading auto-join presets:', e);
            return {};
        }
    }

    function waitForElements(elementIds, timeout = 5000) {
        return new Promise((resolve) => {
            const elements = {};
            let checkCount = 0;
            const maxChecks = 50;
            const checkInterval = timeout / maxChecks;

            const checkElements = () => {
                let allFound = true;
                elementIds.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        elements[id] = element;
                    } else {
                        allFound = false;
                    }
                });

                if (allFound) {
                    resolve(elements);
                } else if (checkCount < maxChecks) {
                    checkCount++;
                    setTimeout(checkElements, checkInterval);
                } else {
                    resolve(null);
                }
            };

            checkElements();
        });
    }

    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver((mutations, obs) => {
                if (document.querySelector(selector)) {
                    obs.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }, timeout);
        });
    }

    async function applyAutoJoinPreset(preset) {
        try {
            console.log('[DEBUG] Switching to Custom Events tab');
            const tabSwitched = await ensureCustomEventsTab();
            if (!tabSwitched) {
                console.log('[DEBUG] Failed to switch to Custom Events tab');
                displayStatusMessage('Failed to load Custom Events tab', 'error');
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            const findOrCreateAutoJoinInterface = () => {
                console.log('[DEBUG] Looking for or creating auto-join interface');

                let autoJoinTrack = document.getElementById('autoJoinTrack');
                let minLaps = document.getElementById('minLaps');
                let maxLaps = document.getElementById('maxLaps');
                let autoJoinCar = document.getElementById('autoJoinCar');
                let hidePassworded = document.getElementById('hidePassworded');
                let hideBets = document.getElementById('hideBets');
                let autoJoinMinDrivers = document.getElementById('autoJoinMinDrivers');
                let autoJoinMaxDrivers = document.getElementById('autoJoinMaxDrivers');
                let hideFullRaces = document.getElementById('hideFullRacesAutoJoin');

                if (!autoJoinTrack || !minLaps || !maxLaps || !autoJoinCar || !hidePassworded || !hideBets || !autoJoinMinDrivers || !autoJoinMaxDrivers || !hideFullRaces) {
                    console.log('[DEBUG] Creating auto-join interface elements');

                    const racesList = document.querySelector('.custom_events, .events-list, .races-list');
                    const filtersSection = document.querySelector('.race-filter-section');
                    
                    if (!racesList && !filtersSection) {
                        console.error('[DEBUG] Cannot find suitable container for auto-join interface');
                        return null;
                    }
                    
                    const container = document.createElement('div');
                    container.className = 'auto-join-interface race-filter-controls';
                    container.style.cssText = `
                        margin-top: 10px !important;
                        padding: 10px !important;
                        background-color: #2a2a2a !important;
                        border: 1px solid #444 !important;
                        border-radius: 8px !important;
                    `;
                    
                    container.innerHTML = `
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="autoJoinTrack">Track:</label>
                                <select id="autoJoinTrack">
                                    <option value="all" selected>All Tracks</option>
                                    <option value="6">Uptown</option>
                                    <option value="7">Withdrawal</option>
                                    <option value="8">Underdog</option>
                                    <option value="9">Parkland</option>
                                    <option value="10">Docks</option>
                                    <option value="11">Commerce</option>
                                    <option value="12">Two Islands</option>
                                    <option value="15">Industrial</option>
                                    <option value="16">Vector</option>
                                    <option value="17">Mudpit</option>
                                    <option value="18">Hammerhead</option>
                                    <option value="19">Sewage</option>
                                    <option value="20">Meltdown</option>
                                    <option value="21">Speedway</option>
                                    <option value="23">Stone Park</option>
                                    <option value="24">Convict</option>
                                </select>
                            </div>
                            <div class="filter-group laps-filter">
                                <label>Laps Range:</label>
                                <input type="number" id="minLaps" placeholder="Min" min="1" max="100">
                                <span>-</span>
                                <input type="number" id="maxLaps" placeholder="Max" min="1" max="100">
                            </div>
                            <div class="filter-group drivers-filter">
                                <label>Drivers Range:</label>
                                <input type="number" id="autoJoinMinDrivers" placeholder="Min" min="2" max="10">
                                <span>-</span>
                                <input type="number" id="autoJoinMaxDrivers" placeholder="Max" min="2" max="10">
                            </div>
                        </div>
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="autoJoinCar">Car to Use:</label>
                                <select id="autoJoinCar">
                                    <option value="">Select a car...</option>
                                    ${document.getElementById('carDropdown')?.innerHTML || ''}
                                </select>
                            </div>
                            <div class="filter-group checkboxes">
                                <div class="checkbox-option">
                                    <label><input type="checkbox" id="hidePassworded"> Hide Passworded Races</label>
                                </div>
                                <div class="checkbox-option">
                                    <label><input type="checkbox" id="hideBets"> Hide Races with Bets</label>
                                </div>
                                <div class="checkbox-option">
                                    <label><input type="checkbox" id="hideFullRacesAutoJoin"> Hide Full Races</label>
                                </div>
                            </div>
                        </div>
                        <div class="filter-buttons">
                            <button id="autoJoinNowButton" class="gui-button">Join Now</button>
                        </div>
                    `;

                    if (filtersSection) {
                        filtersSection.insertAdjacentElement('afterend', container);
                    } else if (racesList) {
                        racesList.insertAdjacentElement('beforebegin', container);
                    }

                    autoJoinTrack = document.getElementById('autoJoinTrack');
                    minLaps = document.getElementById('minLaps');
                    maxLaps = document.getElementById('maxLaps');
                    autoJoinCar = document.getElementById('autoJoinCar');
                    hidePassworded = document.getElementById('hidePassworded');
                    hideBets = document.getElementById('hideBets');
                    autoJoinMinDrivers = document.getElementById('autoJoinMinDrivers');
                    autoJoinMaxDrivers = document.getElementById('autoJoinMaxDrivers');
                    hideFullRaces = document.getElementById('hideFullRacesAutoJoin');

                    const joinButton = document.getElementById('autoJoinNowButton');
                    if (joinButton) {
                        joinButton.addEventListener('click', startAutoJoin);
                    }
                } else {
                    console.log('[DEBUG] All auto-join elements already exist');
                }

                return {
                    autoJoinTrack,
                    minLaps,
                    maxLaps,
                    autoJoinCar,
                    hidePassworded,
                    hideBets,
                    autoJoinMinDrivers,
                    autoJoinMaxDrivers,
                    hideFullRaces
                };
            };

            const elements = findOrCreateAutoJoinInterface();
            
            if (!elements) {
                console.error('[DEBUG] Failed to create auto-join interface');
                displayStatusMessage('Unable to create auto-join interface', 'error');
                return;
            }

            console.log('[DEBUG] Auto-join preset car information:', { 
                selectedCarId: preset.selectedCarId,
                carName: preset.carName || 'Unknown Car'
            });

            console.log('[DEBUG] Setting auto-join values');
            if (elements.autoJoinTrack) elements.autoJoinTrack.value = preset.track;
            if (elements.minLaps) elements.minLaps.value = preset.minLaps;
            if (elements.maxLaps) elements.maxLaps.value = preset.maxLaps;
            if (elements.hidePassworded) elements.hidePassworded.checked = preset.hidePassworded;
            if (elements.hideBets) elements.hideBets.checked = preset.hideBets;
            if (elements.autoJoinMinDrivers) elements.autoJoinMinDrivers.value = preset.minDrivers;
            if (elements.autoJoinMaxDrivers) elements.autoJoinMaxDrivers.value = preset.maxDrivers;
            if (elements.hideFullRaces) elements.hideFullRaces.checked = preset.hideFullRaces;

            if (elements.autoJoinCar && preset.selectedCarId) {
                const existingOption = elements.autoJoinCar.querySelector(`option[value="${preset.selectedCarId}"]`);
                
                if (existingOption) {
                    elements.autoJoinCar.value = preset.selectedCarId;
                    console.log('[DEBUG] Found car in dropdown, setting value:', preset.selectedCarId);
                } else {
                    console.log('[DEBUG] Car not found in dropdown, creating option for:', preset.selectedCarId);
                    
                    const newOption = document.createElement('option');
                    newOption.value = preset.selectedCarId;
                    newOption.textContent = preset.carName ? 
                        `${preset.carName} (ID: ${preset.selectedCarId})` : 
                        `Car ID: ${preset.selectedCarId}`;

                    if (elements.autoJoinCar.options.length > 0) {
                        elements.autoJoinCar.insertBefore(newOption, elements.autoJoinCar.options[1]);
                    } else {
                        elements.autoJoinCar.appendChild(newOption);
                    }

                    elements.autoJoinCar.value = preset.selectedCarId;
                }
            } else {
                console.log('[DEBUG] No car ID in preset or car dropdown not found');
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('[DEBUG] Starting auto-join');
            startAutoJoin();
        } catch (error) {
            console.error('[DEBUG] Error in applyAutoJoinPreset:', error);
            displayStatusMessage('Error applying auto-join preset', 'error');
        }
    }

    async function ensureCustomEventsTab() {
        return new Promise((resolve) => {
            const customEventsTab = document.querySelector('a[href*="tab=customrace"]');
            const isCustomEventsActive = document.querySelector('li.active .icon.custom-events');
            
            if (!isCustomEventsActive && customEventsTab) {
                console.log('[DEBUG] Custom Events tab not active, switching...');

                const observer = new MutationObserver((mutations, obs) => {
                    const racesList = document.querySelector('.custom_events, .events-list, .races-list');
                    if (racesList) {
                        console.log('[DEBUG] Race list loaded after tab switch');
                        obs.disconnect();

                        setTimeout(() => {
                            const tabIcon = customEventsTab.querySelector('.icons, .icon');
                            if (tabIcon) {
                                tabIcon.click();
                                console.log('[DEBUG] Clicked custom events tab icon');
                            }
                            setTimeout(() => resolve(true), 1000);
                        }, 1000);
                    }
                });

                observer.observe(document.getElementById('racingMainContainer') || document.body, {
                    childList: true,
                    subtree: true
                });

                customEventsTab.click();
                const tabIcon = customEventsTab.querySelector('.icons, .icon');
                if (tabIcon) {
                    setTimeout(() => tabIcon.click(), 100);
                }

                setTimeout(() => {
                    observer.disconnect();
                    resolve(false);
                }, 10000);
            } else {
                resolve(true);
            }
        });
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
        const currentHour = now.hour();
        const currentMinute = now.minute();

        hourSelect.value = String(currentHour).padStart(2, '0');

        let roundedMinute = Math.round(currentMinute / 15) * 15;
        if (roundedMinute === 60) {
            roundedMinute = 0;
        }

        const tempOption = minuteSelect.querySelector('.temp-minute');
        if (tempOption) {
            tempOption.remove();
        }

        if (![0, 15, 30, 45].includes(currentMinute)) {
            const option = document.createElement('option');
            option.value = String(currentMinute).padStart(2, '0');
            option.textContent = String(currentMinute).padStart(2, '0');
            option.className = 'temp-minute';
            minuteSelect.appendChild(option);
            minuteSelect.value = String(currentMinute).padStart(2, '0');
        } else {
            minuteSelect.value = String(roundedMinute).padStart(2, '0');
        }
    }

    async function updateCarList() {
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
                        console.log('[DEBUG] Required elements not found for updateCarList, providing fallback objects');
                        resolve({
                            carDropdown: {
                                disabled: false,
                                querySelector: () => null,
                                value: '',
                                innerHTML: ''
                            },
                            carStatusMessage: {
                                textContent: '',
                                style: { color: '' }
                            },
                            updateCarsButton: {
                                disabled: false
                            }
                        });
                    }
                };
                checkElements();
            });
        };
    
        const elements = await waitForElements();
        const { carDropdown, carStatusMessage, updateCarsButton } = elements;
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
    
        if (!apiKey) {
            if (carStatusMessage) {
                carStatusMessage.textContent = 'API Key Required';
                carStatusMessage.style.color = 'red';
            }
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
            if (!carDropdown || typeof carDropdown.innerHTML !== 'string') {
                console.log('[DEBUG] Skipping API call since carDropdown is not valid');
                return;
            }
            
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

                                setTimeout(() => {
                                    syncCarDropdowns();
                                    if (carStatusMessage) {
                                        carStatusMessage.textContent = 'Cars Updated & Synchronized';
                                        carStatusMessage.style.color = '#efe';
                                    }
                                }, 500);
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
        console.log('[DEBUG] Populating car dropdowns with', Object.keys(cars).length, 'cars');
        
        try {
            const dropdowns = [
                document.getElementById('carDropdown'),
                document.getElementById('autoJoinCar'),
                document.getElementById('officialCarDropdown')
            ];

            const sortedCars = Object.values(cars)
                .filter(car => car.leased !== '1')
                .sort((a, b) => {
                    const nameA = a.name || a.item_name;
                    const nameB = b.name || b.item_name;
                    return nameA.localeCompare(nameB);
                });

            dropdowns.forEach(dropdown => {
                if (!dropdown) {
                    console.log('[DEBUG] Dropdown not found in populateCarDropdown');
                    return;
                }

                dropdown.innerHTML = '<option value="">Select a car...</option>';

                sortedCars.forEach(car => {
                    const carName = car.name || car.item_name;

                    let partInfo = generateCarPartInfo(car.parts || []);
                    
                    const option = document.createElement('option');
                    option.value = car.id;
                    option.textContent = partInfo ? `${carName} (${partInfo}) [ID: ${car.id}]` : `${carName} [ID: ${car.id}]`;
                    dropdown.appendChild(option);
                });
                
                console.log('[DEBUG] Added', sortedCars.length, 'cars to dropdown', dropdown.id);
            });
            
            console.log('[DEBUG] Car dropdowns populated successfully');
        } catch (error) {
            console.error('[DEBUG] Error in populateCarDropdown:', error);
        }
    }

    function generateCarPartInfo(parts) {
        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return '';
        }

        const categories = {
            transmission: [],
            power: []
        };

        const partShortNames = {
            84: "TL",
            85: "TS",
            86: "DL",
            87: "DS",

            81: "T2",
            99: "T3"
        };

        parts.forEach(partId => {
            const partId_num = Number(partId);
            const shortName = partShortNames[partId_num];
            if (!shortName) return;

            if ([84, 85, 86, 87].includes(partId_num)) {
                categories.transmission.push(shortName);
            } else if ([81, 99].includes(partId_num)) {
                categories.power.push(shortName);
            }
        });

        const partDescriptions = [];
        
        if (categories.transmission.length > 0) {
            partDescriptions.push(categories.transmission[0]);
        }
        
        if (categories.power.length > 0) {
            partDescriptions.push(categories.power.join('/'));
        }
        
        return partDescriptions.join('-');
    }

    function updateCarDropdown() {
        updateCarList();
    }

    function getRFC() {
        // Try getting RFC from page
        const rfcFromPage = getRFCFromPage();
        if (rfcFromPage) {
            console.log('[RFC] Found from page:', rfcFromPage);
            return rfcFromPage;
        }

        // Try getting RFC from jQuery cookie
        if (typeof $.cookie === 'function') {
            const rfcValue = $.cookie('rfc_v');
            if (rfcValue) {
                console.log('[RFC] Found from jQuery cookie:', rfcValue);
                return rfcValue;
            }
        }

        // Fallback to cookie parsing
        const cookies = document.cookie.split("; ");
        for (let i in cookies) {
            const cookie = cookies[i].split("=");
            if (cookie[0] && cookie[0].trim() === "rfc_v") {
                console.log('[RFC] Found from document.cookie:', cookie[1]);
                return cookie[1];
            }
        }

        console.warn("[RFC] Failed to find rfc_v cookie or value.");
        return '';
    }

    function getRFCFromPage() {
        // Get RFC from script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (!script.textContent) continue;
            
            const rfcMatch = script.textContent.match(/var\s+rfcv\s*=\s*['"]([^'"]+)['"]/);
            if (rfcMatch && rfcMatch[1]) {
                console.log('[RFC Detection] Found RFC in script tag:', rfcMatch[1]);
                return rfcMatch[1];
            }
        }

        // Get RFC from input fields
        const rfcInputs = document.querySelectorAll('input[name="rfcv"]');
        for (const input of rfcInputs) {
            if (input.value) {
                console.log('[RFC Detection] Found RFC in input field:', input.value);
                return input.value;
            }
        }

        // Get RFC from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const rfcValue = urlParams.get('rfcv');
        if (rfcValue) {
            console.log('[RFC Detection] Found RFC in URL parameters:', rfcValue);
            return rfcValue;
        }

        // Get RFC from forms
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const rfcInput = form.querySelector('input[name="rfcv"]');
            if (rfcInput && rfcInput.value) {
                console.log('[RFC Detection] Found RFC in form:', rfcInput.value);
                return rfcInput.value;
            }
        }
        
        // Get RFC from data attributes
        const elementsWithData = document.querySelectorAll('[data-rfcv]');
        for (const el of elementsWithData) {
            if (el.dataset.rfcv) {
                console.log('[RFC Detection] Found RFC in data attribute:', el.dataset.rfcv);
                return el.dataset.rfcv;
            }
        }
        
        return null;
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
        const carId = document.getElementById('carIdInput').value;

        const waitTime = Math.floor(Date.now() / 1000);
        
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
        params.append('waitTime', waitTime);
        params.append('rfcv', rfcValue);

        const raceLink = `https://www.torn.com/loader.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=&${params.toString()}`;
        console.log('[Race URL]:', raceLink);

        displayStatusMessage('Creating Race...', 'info');

        try {
            const response = await fetch(raceLink);
            const data = await response.text();

            if (data.includes('success') || response.ok) {
                displayStatusMessage('Race Created Successfully!', 'success');
                setTimeout(() => window.location.href = 'https://www.torn.com/loader.php?sid=racing', 1500);
            } else {
                displayStatusMessage('Error creating race. Please try again.', 'error');
            }
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } catch (error) {
            displayStatusMessage(`Error creating race: ${error.message}`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 5000);
        }
    }

    async function createRaceFromPreset(preset) {
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
        if (!apiKey) {
            displayQuickLaunchStatus('API Key is required to create race.', 'error');
            return;
        }

        const trackId = preset.track;
        const laps = preset.laps;
        const minDrivers = preset.minDrivers;
        const maxDrivers = preset.maxDrivers;
        const raceName = preset.raceName;
        const password = preset.password;
        const betAmount = preset.betAmount;
        const carId = preset.carId;

        const waitTime = Math.floor(Date.now() / 1000);
        
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
        params.append('waitTime', waitTime);
        params.append('rfcv', rfcValue);

        const raceLink = `https://www.torn.com/loader.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=&${params.toString()}`;
        console.log('[Race URL from preset]:', raceLink);
        displayQuickLaunchStatus('Creating Race...', 'info');

        try {

            const response = await fetch(raceLink);
            const data = await response.text();
            
            if (data.includes('success') || response.ok) {
                displayQuickLaunchStatus('Race Created Successfully!', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                displayQuickLaunchStatus('Error creating race. Please try again.', 'error');
            }
        } catch (error) {
            displayQuickLaunchStatus(`Error creating race: ${error.message}`, 'error');
        }
    }

    function displayQuickLaunchStatus(message, type = '') {
        const statusElement = document.querySelector('.quick-launch-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = 'quick-launch-status';
        
        if (type) {
            statusElement.classList.add(type);
            statusElement.classList.add('show');
        }

        displayStatusMessage(message, type);
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

    function checkRaceStatus() {
        const activeRaceIcon = document.querySelector('li.icon17___eXCy4');
        if (activeRaceIcon) {
            console.log("[Race Detection] Found active race icon (icon17___eXCy4)");
            return true;
        }
        
        const completedRaceIcon = document.querySelector('li.icon18___iPKVP');
        if (completedRaceIcon) {
            console.log("[Race Detection] Found completed race icon (icon18___iPKVP)");
            return false;
        }

        console.log("[Race Detection] Neither race icon found - assuming not racing");
        return false;

    }

    function updateRaceAlert() {
        const alertEnabled = GM_getValue('raceAlertEnabled', false);
        if (!alertEnabled) {
            removeRaceAlert();
            return;
        }

        const isMobilePDA = navigator.userAgent.includes('PDA') || 
                            window.innerWidth < 768 || 
                            document.documentElement.classList.contains('tornPDA');

        const delay = isMobilePDA ? 2000 : 500;
        
        console.log(`[Race Detection] Using ${isMobilePDA ? 'mobile' : 'desktop'} delay: ${delay}ms`);

        setTimeout(() => {
            const isInRace = checkRaceStatus();
            console.log("[Race Detection] Race status:", isInRace ? "IN RACE" : "NOT RACING");
            
            const existingAlert = document.getElementById('raceAlert');

            if (!isInRace) {
                if (!existingAlert || !document.body.contains(existingAlert)) {
                    showRaceAlert();
                }
            } else {
                removeRaceAlert();
            }
        }, delay);
    }

    function showRaceAlert() {
        let alert = document.getElementById('raceAlert');
        
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'raceAlert';
            alert.className = 'race-alert';
            alert.textContent = 'Not Racing';
            alert.style.cssText = `
                display: inline-flex !important;
                align-items: center !important;
                margin-left: 10px !important;
                order: 2 !important;
                z-index: 99999 !important;
                pointer-events: auto !important;
                cursor: pointer !important;
            `;
            
            // Simple click handler to navigate to racing page
            alert.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'https://www.torn.com/loader.php?sid=racing';
            });

            const isMobilePDA = navigator.userAgent.includes('PDA') || 
                               window.innerWidth < 768 || 
                               document.documentElement.classList.contains('tornPDA');

            if (window.location.href.includes('sid=racing')) {
                const raceToggleRow = document.getElementById('raceToggleRow');
                if (raceToggleRow) {
                    raceToggleRow.appendChild(alert);
                    return;
                }
            }

            if (isMobilePDA) {
                const pdaContainers = [
                    '.navigationWrapper',
                    '.status-icons-mobile',
                    '.tornPDA-header',
                    '.headerWrapper___f5LgD',
                    '.headerTopContainer___CfrOY'
                ];
                
                for (const selector of pdaContainers) {
                    const container = document.querySelector(selector);
                    if (container) {
                        container.appendChild(alert);

                        alert.style.position = 'absolute';
                        alert.style.top = '10px';
                        alert.style.right = '10px';
                        alert.style.margin = '0';
                        alert.style.zIndex = '999999';
                        
                        console.log(`[Race Alert] Attached to mobile container: ${selector}`);
                        return;
                    }
                }
            }

            const titleSelectors = [
                '#mainContainer > div.content-wrapper.winter > div.content-title.m-bottom10 h4',
                '.titleContainer___QrlWP .title___rhtB4',
                'div.content-title h4',
                '.title-black',
                '.clearfix .t-black',
                '.page-head > h4',
                '#react-root > div > div.appHeader___gUnYC.crimes-app-header > h4',
                'div.appHeader___gUnYC h4',
                '#skip-to-content',
                '.header-title',
                '.mobile-title',
                '.app-header'
            ];
            
            for (const selector of titleSelectors) {
                const titleElement = document.querySelector(selector);
                if (titleElement) {
                    if (titleElement.parentNode.style.position !== 'relative') {
                        titleElement.parentNode.style.position = 'relative';
                    }
                    titleElement.insertAdjacentElement('beforeend', alert);
                    console.log(`[Race Alert] Attached to title element: ${selector}`);
                    return;
                }
            }

            if (!alert.parentNode) {
                alert.style.position = 'fixed';
                alert.style.top = '10px';
                alert.style.right = '10px';
                alert.style.zIndex = '999999';
                document.body.appendChild(alert);
                console.log(`[Race Alert] Attached directly to body as fixed element`);
            }
        }
    }

    function removeRaceAlert() {
        const alert = document.getElementById('raceAlert');
        if (alert) {
            alert.remove();
        }
    }

    function initializeAll() {
        if (typeof document !== 'undefined' && document.readyState !== 'loading') {
            init();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                init();
            });
        }
    }

    if (document.readyState !== 'loading') {
        initializeAll();
    } else {
        document.addEventListener('DOMContentLoaded', initializeAll);
    }

})();
