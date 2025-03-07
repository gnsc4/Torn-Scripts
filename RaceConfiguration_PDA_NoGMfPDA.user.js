// ==UserScript==
// @name         Torn PDA Race Config GUI - v3.0.17 - GUI Border Expansion
// @version      3.0.17  // GUI Border Expansion - v3.0.17
// @description  PDA GUI to configure Torn racing parameters, schedule races, set passwords, save presets, create races easily, betting feature, styled toggle button, release storage key, hover button color change, final polish, with update URL, PDA/Mobile Friendly, No GM Functions for wider compatibility. With Preset Descriptions and Author Credit. // GUI Border Expansion - v3.0.17
// @author       GNSC4
// @match        https://www.torn.com/racing.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/GNSC4/torn-race-config-gui/main/torn-race-config-gui.user.js
// @downloadURL  https://raw.githubusercontent.com/GNSC4/torn-race-config-gui/main/torn-race-config-gui.user.js
// @run-at       document-end
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CSS for the GUI ---
    const style = document.createElement('style');
    style.textContent = `
            #tcLogo { pointer-events: none; }
            .gui-button {
                color: #ddd;
                background-color: #555; /* Default Background Color! */
                border: 1px solid #777; /* Default Border! */
                border-radius: 3px;
                padding: 8px 15px;
                cursor: pointer;
                margin-top: 5px;
                margin-right: 5px;
                transition: background-color 0.3s ease;
                font-size: 0.9em;
                display: inline-block;
                text-decoration: none;
            }

            .gui-button:hover,
            .preset-button:hover,
            .remove-preset:hover,
            .close-button:hover,
            #closeGUIButton:hover,
            #toggleRaceGUIButton:hover,
            #setNowButton:hover, /* Hover for NOW button - v3.0.7 */
            /* --- More Specific Selector for Quick Race Buttons - v2.98ah --- */
            #quickPresetButtonsContainer > .quick-race-button:hover, /* Hover style with increased specificity - v2.98ah */
            div.content-title > h4 > #toggleRaceGUIButton:hover {
                background-color: #777; /* Button hover background */
            }

            /* --- Explicitly Style the Toggle Race GUI Button in Header --- */
            div.content-title > h4 > #toggleRaceGUIButton { /* SPECIFIC TARGET FOR TOGGLE BUTTON */
                background-color: #555; /* Explicitly set default background for Toggle Button */
                border: 1px solid #777;  /* Explicitly set default border for Toggle Button */
            }


            #raceConfigGUI {
                position: fixed;
                top: 85px;
                left: 20px;
                background-color: #222;
                color: #ddd;
                border: 1px solid #555;
                padding: 20px;
                z-index: 1000;
                font-family: sans-serif;
                border-radius: 10px;
                max-width: 375px; /* Increased max-width for wider GUI - v3.0.17 */
            }

            #raceConfigGUI h2, #raceConfigGUI h3, #raceConfigGUI h4 {
                color: #eee;
                margin-top: 0;
                margin-bottom: 15px;
                text-align: center;
            }

            #raceConfigGUI label {
                display: block;
                margin-bottom: 5px;
                color: #ccc;
            }

            #raceConfigGUI input[type="text"],
            #raceConfigGUI input[type="number"],
            #raceConfigGUI input[type="date"], /* <<--- NEW: Style for date input - v3.0.4 */
            #raceConfigGUI input[type="time"], /* <<--- NEW: Style for time input - v3.0.4 - Although now replaced with dropdowns in v3.0.7, keeping for potential future use or CSS consistency */
            #raceConfigGUI select {
                padding: 9px; /* Slightly increase padding - v3.0.14 - Visual Update */
                margin-bottom: 0px; /* Ensure no bottom margin - v3.0.14 - Visual Update */
                border: 1px solid #555; /* Darker border - v3.0.14 - Visual Update */
                background-color: #444; /* Slightly darker background - v3.0.14 - Visual Update */
                color: #eee !important;
                border-radius: 7px; /* Slightly more rounded corners - v3.0.14 - Visual Update */
                width: calc(100% - 24px); /* Adjust width to account for padding and border - v3.0.14 - Visual Update */
            }

            #raceConfigGUI input:focus,
            #raceConfigGUI select:focus {
                border-color: #888; /* Highlight border on focus - v3.0.14 - Visual Update */
                box-shadow: 0 0 6px rgba(136, 136, 136, 0.5); /* Slightly stronger focus shadow - v3.0.14 - Visual Update */
            }


            #raceConfigGUI .presets-section {
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }

            #raceConfigGUI .presets-section:last-child {
                border-bottom: 0px solid #eee;
            }

            #raceConfigGUI .config-section:last-child {
                border-bottom: 0px solid #eee;
            }


             /* --- ADD LINE ABOVE SECTION HEADERS --- */
            #raceConfigGUI .config-section h4,
            #raceConfigGUI .car-select-section h4,
            #raceConfigGUI .presets-section h4 {
                border-top: 1px solid #555; /* Darker, less harsh section line color - v3.0.14 - Visual Update */
                padding-top: 12px; /* Slightly more padding above line - v3.0.14 - Visual Update */
                font-size: 1.4em; /* Slightly larger heading - v3.0.14 - Visual Update */
                margin-bottom: 18px; /* More space below heading - v3.0.14 - Visual Update */
            }


            #raceConfigGUI #createRaceButton {
                display: inline-block !important;
                text-align: center !important;
                white-space: nowrap !important;
                overflow: visible !important;
                width: 90% !important;
                max-width: 250px !important;
                padding: 10px 15px !important;
                font-size: 1.1em !important;
                color: #eee !important;
                background-color: #555 !important;
                border: 1px solid #777 !important;
            }

            /* --- ENSURE BUTTON HOVER EFFECTS --- */
            #raceConfigGUI #createRaceButton:hover,
            #raceConfigGUI #closeGUIButton:hover,
            #raceConfigGUI #setNowButton:hover { /* Hover style for NOW button - v3.0.7 */
                background-color: #777 !important;
            }

            #raceConfigGUI #setNowButton:hover {
                background-color: #888; /* Lighter hover background for NOW button - v3.0.14 - Visual Update */
            }


            #raceConfigGUI .preset-button,
            #raceConfigGUI .remove-preset,
            #raceConfigGUI .close-button {
                padding: 10px 15px;
                margin-top: 5px;
                margin-right: 5px;
                border: none;
                border-radius: 5px;
                color: #fff;
                background-color: #666;
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-size: 0.9em;
                display: inline-block;
                text-decoration: none;
                width: 100%;          /* <<--- NEW: Force button width to 100% of container - v2.98ai */
                max-width: 100%;      /* <<--- NEW: Max width 100% - v2.98ai - redundant but for extra force */
                box-sizing: border-box; /* <<--- NEW: Include padding/border in width - v2.98ai */
                overflow-wrap: break-word; /* <<--- NEW: Break long words - v2.98ai */
            }


            #raceConfigGUI .preset-buttons-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 15px;
                align-items: flex-start; /* <<--- NEW: Align items to start in wrapped container - v2.98ah - for vertical stacking */
                max-width: calc(100% - 20px); /* <<--- NEW: Limit Preset Button Container Width - v2.98aj */
            }

            #raceConfigGUI .preset-button-container {
                display: inline-flex;
                flex-direction: column; /* Stack button and description vertically */
                align-items: center; /* Center items horizontally within container */
                margin-bottom: 20px; /* Increased spacing between preset containers */
                text-align: center; /* Center text in description - although description is gone from HTML now */
                position: relative; /* For positioning remove button */
            }

            /* --- ENSURE PRESET BUTTON HOVER WORKS --- */
            #raceConfigGUI .presets-section .preset-buttons-container .preset-button:hover {
                background-color: #777;
            }

            /* --- REMOVED PRESET DESCRIPTION CSS - v2.98ah --- */
            /* #raceConfigGUI .preset-description { ... } */


            #raceConfigGUI .remove-preset {
                background-color: #955;
                color: #eee;
                padding: 5px 10px;
                border-radius: 50%;
                font-size: 0.8em;
                line-height: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                text-decoration: none;
                position: absolute; /* Changed to absolute positioning */
                top: 0px;        /* Align to the top of the container */
                right: -5px;        /* ADJUSTED RIGHT VALUE to move button further right - v2.98ah */
                float: none;      /* Remove float */
                /*transform: translate(10%, -10%);  Experimenting with translate */
            }

            #raceConfigGUI .remove-preset:hover {
                background-color: #c77;
            }


            #raceConfigGUI #closeGUIButton {
                position: absolute;
                top: 10px;
                right: 10px;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                padding: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 1em;
                line-height: 1;
            }

            #raceConfigGUI #statusMessageBox {
                margin-top: 15px;
                padding: 10px;
                border: 1px solid #777;
                border-radius: 5px;
                background-color: #333;
                color: #ddd;
                text-align: center;
                font-size: 0.9em;
            }

            #raceConfigGUI #statusMessageBox.error,
            #raceConfigGUI #statusMessageBox.success { /* Corrected selector for status message boxes - v2.98ah */
                background-color: #522;
                border-color: #944;
                color: #eee;
            }

            #raceConfigGUI #statusMessageBox.success {
                background-color: #252;
                border-color: #494;
                color: #efe;
            }

            #raceConfigGUI .api-key-section {
                margin-bottom: 20px;
                text-align: center;
            }

            #raceConfigGUI .config-params-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            #raceConfigGUI .config-params-section label {
                text-align: left;
            }

            #raceConfigGUI .config-params-section input[type="text"],
            #raceConfigGUI .config-params-section select,
            #raceConfigGUI .config-params-section input[type="number"] {
                width: 100%;
            }

            /* --- Forceful Style for Driver Input Containers - v2.98ah - !important REMOVED - Reverted to original width/margin --- */
            #raceConfigGUI .config-params-section .driver-input-container {
                display: inline-block; /* <<--- Reverted to inline-block - v2.98ah - !important removed */
                width: 49%;        /* <<--- Reverted to 49% width - v2.98ah - !important removed */
                margin-right: 1%;    /* <<--- Reverted to 1% margin - v2.98ah - !important removed */
                margin-bottom: 0px; /* Even tighter for driver inputs - v2.98ah - !important removed */
            }

            #raceConfigGUI .config-params-section .driver-input-container:nth-child(even) { /* <<--- NEW nth-child selector - v2.98ah */
                margin-right: 0;    /* <<---  No right margin for even-numbered containers (Max Drivers) - v2.98ah - !important removed */
            }


            #raceConfigGUI .config-params-section .driver-input-container:last-child {
                margin-right: 0; /* Redundant but keeping for clarity - v2.98ah - !important removed */
            }

            #raceConfigGUI .config-params-section .driver-input-container input[type="number"] {
                width: calc(100% - 22px); /* Reverted to original width - v2.98ah - !important removed */
            }

            /* --- TIGHTER SPACING for DIVs in config-params-section --- */
            #raceConfigGUI .config-section > div {
                margin-bottom: 12px; /* Adjusted tighter div spacing - v3.0.14 - Visual Update */
                display: flex; /* Enable flexbox layout - v3.0.14 - Visual Update */
                align-items: center; /* Vertically center items in each row - v3.0.14 - Visual Update */
            }

            #raceConfigGUI .config-section label {
                margin-bottom: 0; /* Remove bottom margin from labels now using flexbox for spacing - v3.0.14 - Visual Update */
                margin-right: 10px; /* Add right margin to labels to space from inputs - v3.0.14 - Visual Update */
                width: auto; /* Allow label width to adjust to content - v3.0.14 - Visual Update */
                flex-shrink: 0; /* Prevent labels from shrinking - v3.0.14 - Visual Update */
                text-align: right; /* Right-align labels for cleaner look - v3.0.14 - Visual Update */
                min-width: 120px; /* Example: Set a minimum width for labels, adjust as needed - v3.0.14 - Visual Update */
            }


            #raceConfigGUI .car-select-section {
                margin-bottom: 20px;
            }

            #raceConfigGUI .car-select-section h4 {
                text-align: center;
                margin-bottom: 10px;
                color: #eee;
            }


            #raceConfigGUI .car-select-section label {
                display: block;
                margin-bottom: 0;
                margin-right: 0;
                text-align: left;
            }

            #raceConfigGUI .car-select-section select {
                margin-bottom: 0;
                margin-right: 0;
                flex-grow: 1;
                width: calc(100% - 22px);
                display: block;
                margin-left: 0;
                margin-right: 0;
            }

            #raceConfigGUI .car-select-section button#updateCarsButton {
                margin-bottom: 0;
                flex-grow: 0;
                flex-shrink: 0;
                display: block;
                width: 100%;
                margin-top: 10px;
                margin-left: 0;
                margin-right: 0;
            }


            #raceConfigGUI .preset-management-section {
                text-align: center;
            }


            /* --- Quick Preset Buttons Container Style --- v2.98ah - UPDATED in v2.98aj to add max-width to container --- */
            #quickPresetButtonsContainer {
                margin-top: 15px; /* Space above the buttons */
                text-align: left; /* Align buttons to the left */
                max-width: calc(100% - 20px); /* <<--- NEW: Limit container width - v2.98aj */
            }

            /* --- Style for Quick Race Buttons - v2.98ah --- */
            .quick-race-button {
                margin-right: 5px; /* Spacing between buttons */
                margin-bottom: 5px; /* Spacing below buttons if they wrap */
                border: 1px solid #777 !important; /* ADDED Border to Quick Race Buttons - v2.98ah - AND !important */
                background-color: #555 !important; /* ADDED Background Color - v2.98ah - AND !important */
                color: #ddd !important; /* ADDED Text Color - v2.98ah - AND !important */
            }

            /* --- More Specific Hover Style for Quick Race Buttons - v2.98ah --- */
            #quickPresetButtonsContainer > .quick-race-button:hover {
                background-color: #777 !important; /* Ensure Hover effect is applied - v2.98ah - AND !important */
            }


            /* --- PDA Specific Styles --- */
            @media (max-width: 768px) {
                #raceConfigGUI {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 98%; /* Slightly wider GUI on PDA - v3.0.17 */
                    max-height: 90%;
                    overflow-y: auto;
                    padding: 15px;
                    margin: 1%; /* Reduce margin to match width increase - v3.0.17 */
                    border-radius: 15px;
                }

                #raceConfigGUI h2, #raceConfigGUI h4 {
                    font-size: 1.5em; /* Slightly smaller headings on PDA */
                }


                #raceConfigGUI button,
                #raceConfigGUI #toggleRaceGUIButton,
                #raceConfigGUI .preset-button,
                #raceConfigGUI .remove-preset,
                #raceConfigGUI .gui-button,
                #raceConfigGUI .close-button {
                    padding: 12px 20px;
                    font-size: 1.1em;
                    margin: 5px 8px 5px 0;
                }

                #raceConfigGUI input[type="text"],
                #raceConfigGUI select {
                    padding: 12px;
                    font-size: 1.1em;
                }

                #raceConfigGUI .config-params-section {
                    grid-template-columns: 1fr;
                }

                #raceConfigGUI .config-params-section .driver-input-container {
                    display: block;
                    width: 100%;
                    margin-right: 0;
                }


                #raceConfigGUI .car-select-section {
                    flex-direction: column;
                    align-items: stretch;
                }

                #raceConfigGUI .car-select-section label {
                    margin-right: 0;
                    margin-bottom: 5px;
                    text-align: center;
                }

                #raceConfigGUI .car-select-section select {
                    margin-right: 0;
                    margin-bottom: 10px;
                }

                #raceConfigGUI .car-select-section button#updateCarsButton {
                    margin-right: 0;
                    width: 100%;
                }

                #quickPresetButtonsContainer { /* Center align quick preset buttons on PDA - v2.98ah */
                    text-align: center;
                    max-width: 95%; /* Limit container width on PDA as well - v2.98aj - matching GUI width */
                }

                .quick-race-button { /* Adjust quick race button margin for PDA - v2.98ah */
                    margin: 5px; /* More margin all around for PDA buttons */
                }

                .preset-button-container { /* Center align Preset Buttons on PDA - v2.98ah */
                    text-align: center;
                }


                .remove-preset { /* Adjust Remove Preset Button position for PDA - v2.98ah */
                    position: absolute;
                    top: 0px;        /* Shift up less for PDA layout */
                    right: -5px;      /* ADJUSTED right shift for PDA layout - v2.98ah */
                    float: none;
                }
            }


            /* --- Dark Mode --- */
            body {
                background-color: #181818;
                color: #ddd;
            }

            a {
                color: #8da9c4;
            }

            a:hover {
                color: #b0cddb;
            }

            div.race-container {
                background-color: #282828 !important;
                color: #ddd !important;
            }

            .race-body, .race-head {
                background-color: #333 !important;
                color: #eee !important;
            }

            .race-list-row {
                border-bottom: 1px solid #444 !important;
            }

            .race-details-wrap {
                background-color: #3a3a3a !important;
                color: #ddd !important;
            }

            .race-bet-section {
                background-color: #444 !important;
                color: #ddd !important;
            }

            .race-bet-input {
                background-color: #555 !important;
                color: #eee !important;
                border-color: #666 !important;
            }

            .race-bet-button {
                background-color: #666 !important;
                color: #fff !important;
            }

            .race-bet-button:hover {
                background-color: #777 !important;
            }

            .race-content-section {
                background-color: #333 !important;
                color: #eee !important;
            }


            /* Add more dark mode styles as needed for other Torn elements */
        `;
    document.head.appendChild(style);

    // --- GUI HTML Structure ---
    function createRaceConfigGUI() {
        const gui = document.createElement('div');
        gui.id = 'raceConfigGUI';
        gui.innerHTML = `
            <button id="closeGUIButton" class="close-button">×</button>
            <div class="gui-header">
                <img id="tcLogo" src="https://www.torn.com/images/v2/layout/header/logo-tc.svg" alt="Torn City Logo" style="width: 150px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;">
                <h2>Race Configuration</h2>
                <div class="api-key-section">
                    <label for="apiKey">API Key:</label>
                    <input type="text" id="apiKey" placeholder="Enter your API Key">
                    <button class="gui-button" id="saveApiKeyButton">Save API Key</button>
                </div>
            </div>

            <div class="presets-section">
                <h4>Quick Race Presets</h4>
                <div id="quickPresetButtonsContainer" class="preset-buttons-container">
                    </div>
            </div>

            <div class="presets-section">
                <h4>Race Presets</h4>
                <div id="presetButtonsContainer" class="preset-buttons-container">
                    </div>
                <div class="preset-management-section">
                    <input type="text" id="presetNameInput" placeholder="Preset Name">
                    <button class="gui-button" id="savePresetButton">Save Preset</button>
                    <button class="gui-button" id="clearPresetsButton">Clear Presets</button>
                </div>
            </div>


            <div class="config-section">
                <h4>Race Settings</h4>
                <div><label for="trackSelect">Track:</label>
                    <select id="trackSelect">
                        <option value="6-Uptown">6- Uptown</option>
                        <option value="7-Dudley">7- Dudley</option>
                        <option value="8-Industrial">8- Industrial</option>
                        <option value="9-Parkway">9- Parkway</option>
                        <option value="10-Countryside">10- Countryside</option>
                        <option value="11-Woodlands">11- Woodlands</option>
                        <option value="12-Highway">12- Highway</option>
                        <option value="13-Beachside">13- Beachside</option>
                    </select></div>
                <div><label for="lapsInput">Laps:</label><input type="number" id="lapsInput" value="100" min="1" max="999"></div>
                <div><label for="minDriversInput">Min Drivers:</label><input type="number" id="minDriversInput" value="2" min="2" max="8"></div>
                <div><label for="maxDriversInput">Max Drivers:</label><input type="number" id="maxDriversInput" value="8" min="2" max="8"></div>
                <div><label for="raceNameInput">Race Name:</label><input type="text" id="raceNameInput" value="Custom Race"></div>
                <div><label for="passwordInput">Password (optional):</label><input type="text" id="passwordInput" placeholder="Race Password Optional"></div>
                <div><label for="betAmountInput">Bet Amount for Race (Max 10M, Optional):</label><input type="number" id="betAmountInput" value="0" min="0" max="10000000"></div>

                 <div>
                    <label>Race Start Time (TCT 24hr):</label>
                </div>
                <div>
                     <label for="raceStartHour">Hours (TCT):</label>
                     <select id="raceStartHour">
                        </select>
                </div>
                <div>
                    <label for="raceStartMinute">Minutes (TCT):</label>
                    <select id="raceStartMinute">
                        </select>
                </div>
                <div>
                    <button class="gui-button" id="setNowButton">NOW</button>  <span>(TCT, 1 min interval)</span> </div>
                 </div>

            <div class="car-select-section">
                <h4>Car Selection</h4>
                <div><label for="carIdInput">Car ID:</label><input type="number" id="carIdInput" placeholder="Enter Car ID"></div>
                <div>
                    <label for="carSelectDropdown">Select Car:</label>
                    <select id="carSelectDropdown">
                        </select>
                </div>
                <button class="gui-button" id="updateCarsButton">Update Cars</button>
                <div id="carInfoMessage"></div>
            </div>


            <div class="config-section">
                <h4>Change Car</h4>
                 <div class="config-params-section">
                    <div class="driver-input-container">
                        <label for="driverSkillInput">Driver Skill:</label>
                        <input type="number" id="driverSkillInput" value="1000" min="0" max="2000">
                    </div>
                    <div class="driver-input-container">
                        <label for="driverNerveInput">Driver Nerve:</label>
                        <input type="number" id="driverNerveInput" value="1000" min="0" max="2000">
                    </div>
                    <div class="driver-input-container">
                        <label for="carAccelerationInput">Car Acceleration:</label>
                        <input type="number" id="carAccelerationInput" value="1000" min="0" max="2000">
                    </div>
                    <div class="driver-input-container">
                        <label for="carHandlingInput">Car Handling:</label>
                        <input type="number" id="carHandlingInput" value="1000" min="0" max="2000">
                    </div>
                    <div class="driver-input-container">
                        <label for="carTopSpeedInput">Car Top Speed:</label>
                        <input type="number" id="carTopSpeedInput" value="1000" min="0" max="2000">
                    </div>
                 </div>
            </div>


            <div id="statusMessageBox"></div>
            <button class="gui-button" id="createRaceButton">Create Race</button>


            <div class="gui-footer">
                <p style="font-size: 0.8em; text-align: center; margin-top: 10px; color: #888;">Script created by GNSC4 (2688631)</p>
                <p style="font-size: 0.7em; text-align: center; color: #666;">Version 3.0.17 - GUI Border Expansion</p>
            </div>
        `;
        document.body.appendChild(gui);
        return gui;
    }

    let raceConfigGUI = document.querySelector('#raceConfigGUI');
    if (!raceConfigGUI) {
        raceConfigGUI = createRaceConfigGUI();
        initializeGUI(raceConfigGUI);
    }

    function initializeGUI(gui) {
        loadApiKey();
        loadPresets();
        populateTimeDropdowns(); // v3.0.7 - Populate time dropdowns on GUI load
        updateQuickPresetsDisplay(); // Initial quick presets load - v2.98ah
        displayPresets(); // Initial display of saved presets

        // --- Button Event Listeners ---
        document.getElementById('saveApiKeyButton').addEventListener('click', saveApiKey);
        document.getElementById('savePresetButton').addEventListener('click', savePreset);
        document.getElementById('clearPresetsButton').addEventListener('click', clearPresets);
        document.getElementById('createRaceButton').addEventListener('click', createRace);
        document.getElementById('updateCarsButton').addEventListener('click', updateCarList); // Car Update Button
        document.getElementById('closeGUIButton').addEventListener('click', toggleRaceGUI);
        document.getElementById('toggleRaceGUIButton').addEventListener('click', toggleRaceGUI); // Toggle Button in Race Header - v2.98ah
        document.getElementById('setNowButton').addEventListener('click', setTimeToNow); // NOW Button Event Listener - v3.0.7

         // --- Quick Preset Buttons - Event Delegation --- v2.98ah
         const quickPresetButtonsContainer = document.getElementById('quickPresetButtonsContainer');
         quickPresetButtonsContainer.addEventListener('click', function(event) {
             if (event.target.classList.contains('quick-race-button')) {
                 applyQuickPreset(event.target.textContent);
             }
         });

        // --- Preset Buttons - Event Delegation for Apply and Remove --- v2.98ah
        const presetButtonsContainer = document.getElementById('presetButtonsContainer');
        presetButtonsContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('preset-button')) {
                applyPreset(event.target.textContent);
            } else if (event.target.classList.contains('remove-preset')) {
                removePreset(event.target.dataset.presetName);
            }
        });


        // --- Initially populate car dropdown on GUI load ---
        updateCarDropdown();


        // --- Make GUI Draggable ---
        dragElement(gui);

         // --- Set initial GUI state based on storage ---
         const guiVisible = GM_getValue('raceConfigGUIVisible', false); // Default to hidden if not set
         raceConfigGUI.style.display = guiVisible ? 'block' : 'none';

    }


    // --- GUI Toggle Button in Race Header --- v2.98ah
    function createToggleButton() {
        const toggleButton = document.createElement('a');
        toggleButton.id = 'toggleRaceGUIButton';
        toggleButton.className = 'gui-button'; //Use existing style
        toggleButton.textContent = 'Toggle Race Config GUI';
        toggleButton.style.marginLeft = '10px'; //Some spacing

        const headerTitle = document.querySelector('div.content-title > h4'); //Target Race header
        if (headerTitle) {
            headerTitle.appendChild(toggleButton);
        }
    }

    createToggleButton(); //Create toggle button on script load - v2.98ah


    function toggleRaceGUI() {
        const gui = document.getElementById('raceConfigGUI');
        const currentDisplay = gui.style.display;
        gui.style.display = currentDisplay === 'none' ? 'block' : 'none';

        // --- Store GUI visibility state ---
        GM_setValue('raceConfigGUIVisible', gui.style.display === 'block');
    }


    function dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(elmnt.id + "header")) {
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
        } else {
            elmnt.onmousedown = dragMouseDown;
        }

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
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }


    function loadApiKey() {
        const apiKey = GM_getValue('tornApiKey', '');
        document.getElementById('apiKey').value = apiKey;
    }

    function saveApiKey() {
        const apiKey = document.getElementById('apiKey').value;
        GM_setValue('tornApiKey', apiKey);
        displayStatusMessage('API Key Saved!', 'success');
    }


    // --- Status Message ---
    function displayStatusMessage(message, type = 'info', duration = 3000) {
        const statusMessageBox = document.getElementById('statusMessageBox');
        statusMessageBox.textContent = message;
        statusMessageBox.className = type; // Use class for color styling
         statusMessageBox.style.display = 'block'; // Make sure it's visible

        if (type === 'error') {
            statusMessageBox.classList.add('error'); // Add error class for error styling - v2.98ah
        } else if (type === 'success') {
             statusMessageBox.classList.add('success'); // Add success class for success styling - v2.98ah
        }


        setTimeout(() => {
            statusMessageBox.style.display = 'none';
            statusMessageBox.className = ''; // Clear type class after hiding - v2.98ah
        }, duration);
    }



    // --- Preset Functions ---
    function savePreset() {
        const presetName = document.getElementById('presetNameInput').value.trim();
        if (!presetName) {
            displayStatusMessage('Preset name cannot be empty.', 'error');
            return;
        }

        const presetData = {
            track: document.getElementById('trackSelect').value,
            laps: document.getElementById('lapsInput').value,
            minDrivers: document.getElementById('minDriversInput').value,
            maxDrivers: document.getElementById('maxDriversInput').value,
            raceName: document.getElementById('raceNameInput').value,
            password: document.getElementById('passwordInput').value,
            betAmount: document.getElementById('betAmountInput').value,
            raceStartHour: document.getElementById('raceStartHour').value, //v3.0.7
            raceStartMinute: document.getElementById('raceStartMinute').value, //v3.0.7
            driverSkill: document.getElementById('driverSkillInput').value,
            driverNerve: document.getElementById('driverNerveInput').value,
            carAcceleration: document.getElementById('carAccelerationInput').value,
            carHandling: document.getElementById('carHandlingInput').value,
            carTopSpeed: document.getElementById('carTopSpeedInput').value
        };

        let presets = loadAllPresets();
        presets[presetName] = presetData;
        GM_setValue('racePresets', JSON.stringify(presets));
        displayPresets();
        displayStatusMessage(`Preset "${presetName}" saved!`, 'success');
    }


    function loadPresets() {
        displayPresets();
        updateQuickPresetsDisplay(); // Update quick presets on load - v2.98ah
    }


    function loadAllPresets() {
        const presetsJSON = GM_getValue('racePresets', '{}');
        return JSON.parse(presetsJSON);
    }


    function displayPresets() {
        const presets = loadAllPresets();
        const container = document.getElementById('presetButtonsContainer');
        container.innerHTML = ''; // Clear existing buttons

        Object.keys(presets).forEach(presetName => {
            const presetButtonContainer = document.createElement('div'); // Container for button and description - v2.98ah
            presetButtonContainer.className = 'preset-button-container'; // Container class - v2.98ah

            const button = document.createElement('button');
            button.className = 'preset-button';
            button.textContent = presetName;

            const removeButton = document.createElement('a');
            removeButton.className = 'remove-preset';
            removeButton.href = '#';
            removeButton.textContent = '×';
            removeButton.dataset.presetName = presetName; // Store preset name for removal


            presetButtonContainer.appendChild(button); // Add button to container - v2.98ah
            presetButtonContainer.appendChild(removeButton); // Add remove button to container - v2.98ah
            container.appendChild(presetButtonContainer); // Add container to main container - v2.98ah
        });
    }


    function applyPreset(presetName) {
        const presets = loadAllPresets();
        const preset = presets[presetName];
        if (preset) {
            document.getElementById('trackSelect').value = preset.track;
            document.getElementById('lapsInput').value = preset.laps;
            document.getElementById('minDriversInput').value = preset.minDrivers;
            document.getElementById('maxDriversInput').value = preset.maxDrivers;
            document.getElementById('raceNameInput').value = preset.raceName;
            document.getElementById('passwordInput').value = preset.password;
            document.getElementById('betAmountInput').value = preset.betAmount;
            document.getElementById('raceStartHour').value = preset.raceStartHour; //v3.0.7
            document.getElementById('raceStartMinute').value = preset.raceStartMinute; //v3.0.7
            document.getElementById('driverSkillInput').value = preset.driverSkill;
            document.getElementById('driverNerveInput').value = preset.driverNerve;
            document.getElementById('carAccelerationInput').value = preset.carAcceleration;
            document.getElementById('carHandlingInput').value = preset.carHandling;
            document.getElementById('carTopSpeedInput').value = preset.carTopSpeed;
            displayStatusMessage(`Preset "${presetName}" applied.`, 'success');
        } else {
            displayStatusMessage(`Preset "${presetName}" not found.`, 'error');
        }
    }


    function removePreset(presetName) {
        let presets = loadAllPresets();
        if (presets[presetName]) {
            delete presets[presetName];
            GM_setValue('racePresets', JSON.stringify(presets));
            displayPresets();
            updateQuickPresetsDisplay(); // Update quick presets after removal - v2.98ah
            displayStatusMessage(`Preset "${presetName}" removed.`, 'success');
        } else {
            displayStatusMessage(`Preset "${presetName}" not found.`, 'error');
        }
    }


    function clearPresets() {
        if (confirm('Are you sure you want to clear all saved presets?')) {
            GM_setValue('racePresets', '{}');
            displayPresets();
            updateQuickPresetsDisplay(); // Clear quick presets as well - v2.98ah
            displayStatusMessage('All presets cleared.', 'success');
        }
    }


    // --- Quick Presets Functionality --- v2.98ah
    function updateQuickPresetsDisplay() {
        const container = document.getElementById('quickPresetButtonsContainer');
        container.innerHTML = ''; // Clear existing buttons

        const quickPresets = ["Track Withdrawal", "Laps: 10"]; // Define quick presets here

        quickPresets.forEach(presetName => {
            const button = document.createElement('button');
            button.className = 'quick-race-button gui-button'; //added gui-button class for styling - v2.98ah
            button.textContent = presetName;
            container.appendChild(button);
        });
    }


    function applyQuickPreset(presetName) {
        if (presetName === "Track Withdrawal") {
            applyPreset("Track Withdrawal"); //Re-use existing preset function - v2.98ah
        } else if (presetName === "Laps: 10") {
            document.getElementById('lapsInput').value = 10; // Directly set laps - example - v2.98ah
            displayStatusMessage('Quick Preset "Laps: 10" applied.', 'success');
        }
         // --- Add more quick presets here as needed --- v2.98ah
    }



    // --- Time Functions v3.0.7 ---
    function populateTimeDropdowns() {
        const hourDropdown = document.getElementById('raceStartHour');
        const minuteDropdown = document.getElementById('raceStartMinute');

        for (let i = 0; i <= 23; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.text = String(i).padStart(2, '0');
            hourDropdown.appendChild(option);
        }

        for (let i = 0; i <= 59; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.text = String(i).padStart(2, '0');
            minuteDropdown.appendChild(option);
        }
    }


    function setTimeToNow() {
        const now = moment.utc(); // Get current time in UTC/TCT
        const currentHour = now.format('HH'); // HH for 24-hour format
        const currentMinute = now.add(1, 'minute').startOf('minute').format('mm'); //add 1 min, start of min, format minutes

        document.getElementById('raceStartHour').value = currentHour;
        document.getElementById('raceStartMinute').value = currentMinute;

        displayStatusMessage('Time set to NOW (TCT 1 min interval).', 'success');
    }



    // --- Car Selection Functions ---
    async function updateCarList() {
        const apiKey = GM_getValue('tornApiKey');
        if (!apiKey) {
            displayStatusMessage('API Key is required to update car list.', 'error');
            return;
        }

        const carInfoMessage = document.getElementById('carInfoMessage');
        carInfoMessage.textContent = 'Updating car list...';
        carInfoMessage.style.display = 'block'; // Show message


        try {
            const response = await fetch(`https://api.torn.com/user/?step=cars&key=${apiKey}&selections=cars`, {
                headers: {
                    'User-Agent': 'Torn Race Config GUI Script'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                carInfoMessage.textContent = `API Error: ${data.error.error}`; // Display API error
                carInfoMessage.className = 'error'; //Optionally, add error class for styling
                console.error('API error:', data.error);
            } else if (data.cars) {
                GM_setValue('playerCars', JSON.stringify(data.cars));
                updateCarDropdown();
                carInfoMessage.textContent = 'Car list updated successfully!';
                carInfoMessage.className = 'success'; // Optionally, add success class
            } else {
                carInfoMessage.textContent = 'No car data received.';
                carInfoMessage.className = 'info'; // Default class
            }


        } catch (error) {
            carInfoMessage.textContent = 'Failed to update car list.';
            carInfoMessage.className = 'error'; // Add error class for styling
            console.error('Fetch error:', error);
        } finally {
             setTimeout(() => {
                carInfoMessage.style.display = 'none'; // Hide message after 3 seconds
                carInfoMessage.className = ''; // Clear classes
            }, 3000); // Keep message for 3 seconds
        }
    }


    function updateCarDropdown() {
        const carDropdown = document.getElementById('carSelectDropdown');
        carDropdown.innerHTML = ''; // Clear existing options

        const playerCarsJSON = GM_getValue('playerCars', '{}'); // Default to empty object if no data
        const playerCars = JSON.parse(playerCarsJSON);


        // Convert cars object to array for sorting
        const carsArray = Object.entries(playerCars).map(([carId, carDetails]) => ({
            carId: carId,
            ...carDetails
        }));


        // Sort cars array alphabetically by name
        carsArray.sort((a, b) => a.name.localeCompare(b.name));


        carsArray.forEach(car => {
            const option = document.createElement('option');
            option.value = car.carId;
            option.text = `${car.name} (ID: ${car.carId})`;
            carDropdown.appendChild(option);
        });
    }



    // --- Race Creation Function ---
    async function createRace() {
        const apiKey = GM_getValue('tornApiKey');
        if (!apiKey) {
            displayStatusMessage('API Key is required to create a race.', 'error');
            return;
        }


        const selectedCarId = document.getElementById('carSelectDropdown').value; // Get from dropdown
        if (!selectedCarId) {
            displayStatusMessage('Please select a car to create a race.', 'error');
            return;
        }


        const track = document.getElementById('trackSelect').value;
        const laps = document.getElementById('lapsInput').value;
        const minDrivers = document.getElementById('minDriversInput').value;
        const maxDrivers = document.getElementById('maxDriversInput').value;
        const raceName = document.getElementById('raceNameInput').value;
        const password = document.getElementById('passwordInput').value;
        const betAmount = document.getElementById('betAmountInput').value;
        const raceStartHour = document.getElementById('raceStartHour').value; // v3.0.7
        const raceStartMinute = document.getElementById('raceStartMinute').value; // v3.0.7


        // --- Parameters for car stats ---
        const driverSkill = document.getElementById('driverSkillInput').value;
        const driverNerve = document.getElementById('driverNerveInput').value;
        const carAcceleration = document.getElementById('carAccelerationInput').value;
        const carHandling = document.getElementById('carHandlingInput').value;
        const carTopSpeed = document.getElementById('carTopSpeedInput').value;


        const startTimeUTC = moment.utc().hour(raceStartHour).minute(raceStartMinute).second(0).format('HH:mm:00'); // v3.0.7 - Get time from dropdowns, format as HH:mm:00


        const params = new URLSearchParams({
            step: 'create',
            track: track.split('-')[0], // Extract track ID
            laps: laps,
            minracer: minDrivers,
            maxracer: maxDrivers,
            rname: raceName,
            password: password,
            bet: betAmount,
            carid: selectedCarId, // Use selected car ID from dropdown
            scheduled_time: startTimeUTC, // v3.0.7 - Use formatted UTC start time
            driver_skill: driverSkill,
            driver_nerve: driverNerve,
            car_acceleration: carAcceleration,
            car_handling: carHandling,
            car_topspeed: carTopSpeed,
            key: apiKey,
            selections: 'cars'
        });


        try {
            const response = await fetch(`https://api.torn.com/racing/?${params.toString()}`, {
                headers: {
                    'User-Agent': 'Torn Race Config GUI Script'
                }
            });


            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.error) {
                displayStatusMessage(`API Error: ${data.error.error}`, 'error');
                console.error('API error:', data.error);
            } else if (data && data.race_id) {
                displayStatusMessage(`Race created successfully! Race ID: ${data.race_id}`, 'success');
                // Optionally redirect to race page - consider if desirable
                 window.location.href = `racing.php#/races/view/${data.race_id}`;
            } else {
                displayStatusMessage('Race creation failed. Unknown error.', 'error');
                console.error('Race creation failed:', data); //Log full response for debugging
            }


        } catch (error) {
            displayStatusMessage('Error creating race.', 'error');
            console.error('Fetch error:', error);
        }
    }

})();