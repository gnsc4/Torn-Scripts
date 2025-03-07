// ==UserScript==
// @name         Torn Race Config GUI PDA NoGMf
// @namespace    torn.raceconfigguipda
// @description  PDA GUI to configure Torn racing parameters, schedule races, set passwords, save presets, create races easily, betting feature, styled toggle button, release storage key, hover button color change, final polish, with update URL, PDA/Mobile Friendly, No GM Functions for wider compatibility.
// @version      2.97 PDA NoGMf
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @author       GNSC4 [268863] (Based on Shlefter's script)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_API_KEY = 'raceConfigAPIKey_release_NoGMf'; //Different storage key for NoGMf version to avoid conflicts

    // Track data
    const tracks = {
        "6": "Uptown", "7": "Withdrawal", "8": "Underdog",
        "9": "Parkland", "10": "Docks", "11": "Commerce",
        "12": "Two Islands", "15": "Industrial", "16": "Vector",
        "17": "Mudpit", "18": "Hammerhead", "19": "Sewage",
        "20": "Meltdown", "21": "Speedway", "23": "Stone Park",
        "24": "Convict"
    };

    // --- GUI Elements ---
    function createGUI() {
        if ($('#raceConfigGUI').length) {
            return;
        }

        const guiHTML = `
            <div id="raceConfigGUI" style="position: fixed; top: 75px; left: 20px; background-color: #333; border: 1px solid #666; padding: 15px; z-index: 1000; border-radius: 5px; color: #eee;">
                <h3 style="margin-top: 0; color: #fff;">Race Configuration</h3>
                <div class="api-key-section">
                    <label for="raceConfigApiKey">API Key:</label>
                    <input type="text" id="raceConfigApiKey" placeholder="Enter Torn API Key" style="margin-left: 5px; color: black;">
                    <button id="saveApiKeyCustom" class="gui-button">Save API Key</button>
                </div>

                <div class="config-section">
                    <h4>Race Settings</h4>
                    <div class="config-params-section">
                        <div><label for="trackID">Track:</label>
                        <select id="trackID">
                            ${Object.entries(tracks).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}
                        </select></div>

                        <div><label for="laps">Laps:</label>
                        <input type="number" id="laps" value="100"></div>

                        <div><label for="minDrivers">Min Drivers:</label>
                        <input type="number" id="minDrivers" value="2"></div>

                        <div><label for="maxDrivers">Max Drivers:</label>
                        <input type="number" id="maxDrivers" value="2"></div>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <label for="raceName">Race Name:</label>
                        <input type="text" id="raceName" style="color: black;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label for="racePassword">Password:</label> <span style="font-size: 0.8em; color: #ccc;"> (optional)</span>
                        <input type="text" id="racePassword" placeholder="Race Password Optional" style="color: black;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label for="betAmount">Bet Amount:</label> <span style="font-size: 0.8em; color: #ccc;">(Max 10M, Optional for Race)</span>
                        <input type="number" id="betAmount" value="0" min="0" max="10000000" style="width: 100px; color: black;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label for="raceStartTime">Race Start Time (TCT):</label> <span style="font-size: 0.8em; color: #ccc;">(Optional, 15 min intervals)</span>
                        <input type="datetime-local" id="raceStartTime" style="width: 170px; color: black;">
                    </div>
                </div>


                <div class="car-select-section">
                    <h4>Car Selection</h4>
                    <label for="carID">Car ID:</label>
                    <select id="carID">
                        <option value="">Loading Cars...</option>
                    </select>
                    <button id="updateCarsButton" class="gui-button">Update Cars</button>
                </div>


                <div class="presets-section">
                    <h4>Presets</h4>
                    <div class="preset-buttons-container" id="presetButtons">
                        </div>
                    <div class="preset-management-section">
                        <button id="savePresetButton" class="gui-button">Save Preset</button>
                    </div>
                </div>

                <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
                    <button id="createRaceButton" class="gui-button" style="width: 90%; max-width: 250px; padding: 10px 15px; font-size: 1.1em;">Create Race</button>
                </div>


                <button id="closeGUIButton" class="close-button">[X]</button>
                <span style="font-size: 0.8em; color: #999; position: absolute; bottom: 5px; right: 5px;">v2.97 PDA NoGMf</span>
            </div>
        `;
        $('body').append(guiHTML);

        const style = document.createElement('style');
        style.textContent = `
            #tcLogo { pointer-events: none; }
            .gui-button {
                color: #ddd;
                background-color: #555;
                border: 1px solid #777;
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
            div.content-title > h4 > #toggleRaceGUIButton:hover {
                background-color: #777; /* Button hover background */
            }


            #raceConfigGUI {
                position: fixed;
                top: 20px;
                left: 20px;
                background-color: #222; /* Darker background */
                color: #ddd;
                border: 1px solid #555;
                padding: 20px;
                z-index: 1000;
                font-family: sans-serif;
                border-radius: 10px;
            }

            #raceConfigGUI h2, #raceConfigGUI h3, #raceConfigGUI h4 {
                color: #eee; /* Lighter heading color */
                margin-top: 0;
                margin-bottom: 15px;
                text-align: center;
            }

            #raceConfigGUI label {
                display: block;
                margin-bottom: 8px;
                color: #ccc;
            }

            #raceConfigGUI input[type="text"],
            #raceConfigGUI select {
                padding: 8px;
                margin-bottom: 15px;
                border: 1px solid #777;
                background-color: #333; /* Input background */
                color: #eee;
                border-radius: 5px;
                width: calc(100% - 22px); /* Adjust width to account for padding and border */
            }

            #raceConfigGUI input[type="text"]:focus,
            #raceConfigGUI select:focus {
                border-color: #aaa; /* Focus border color */
                box-shadow: 0 0 5px rgba(170, 170, 170, 0.5);
            }


            #raceConfigGUI .presets-section,
            #raceConfigGUI .config-section {
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px dashed #666;
            }

            #raceConfigGUI .presets-section:last-child,
            #raceConfigGUI .config-section:last-child {
                border-bottom: none; /* No border for the last section */
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
                background-color: #666; /* Button background */
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-size: 0.9em;
                display: inline-block; /* Ensure button display */
                text-decoration: none; /* Remove any text decoration */
            }


            #raceConfigGUI .preset-buttons-container {
                display: flex;
                flex-wrap: wrap; /* Allow buttons to wrap to the next line */
                gap: 8px; /* Spacing between buttons */
                margin-bottom: 15px;
            }

            #raceConfigGUI .preset-button-container {
                display: inline-flex; /* Use inline-flex to align items horizontally */
                align-items: center; /* Vertically align items in the container */
                margin-bottom: 5px;
            }

            #raceConfigGUI .preset-button {
                margin-right: 5px; /* Spacing between preset button and remove button */
            }


            #raceConfigGUI .remove-preset {
                background-color: #955; /* Reddish for remove button */
                color: #eee;
                padding: 5px 10px;
                border-radius: 50%; /* Make it circular or more rounded */
                font-size: 0.8em;
                line-height: 1; /* Adjust line height for better vertical centering */
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px; /* Fixed width and height for a circular shape */
                height: 20px;
                text-decoration: none; /* Remove underline if it's rendered as a link */
            }

            #raceConfigGUI .remove-preset:hover {
                background-color: #c77; /* Lighter red on hover */
            }


            #raceConfigGUI #closeGUIButton {
                position: absolute;
                top: 10px;
                right: 10px;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                padding: 0; /* Reset padding */
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

            #raceConfigGUI #statusMessageBox.error {
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
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* Responsive grid */
                gap: 15px;
                margin-bottom: 20px;
            }

            #raceConfigGUI .config-params-section label {
                text-align: left; /* Align labels to the left in each grid item */
            }

            #raceConfigGUI .config-params-section input[type="text"],
            #raceConfigGUI .config-params-section select {
                width: 100%; /* Full width within grid item */
            }

            #raceConfigGUI .car-select-section {
                margin-bottom: 20px;
                /* display: flex; Enable flexbox for inline button - REMOVED FLEX */
                /* align-items: center; Vertically align label, dropdown, and button - REMOVED FLEX ALIGN */
            }

            #raceConfigGUI .car-select-section h4 { /* NEW STYLE - Car Selection Section Heading */
                text-align: center;
                margin-bottom: 10px; /* Add some space below the heading */
                color: #eee; /* Match other section heading colors */
            }


            #raceConfigGUI .car-select-section label {
                display: block; /* Ensure label is block to stack above input */
                margin-bottom: 0; /* Remove default bottom margin from label */
                margin-right: 0; /* Reset right margin for PDA */ /* margin-right: 10px; Add some space between label and dropdown - REMOVED IN BLOCK LAYOUT*/
                text-align: left; /* Re-align label text to the left */
            }

            #raceConfigGUI .car-select-section select {
                margin-bottom: 0; /* Remove default bottom margin from select */
                margin-right: 0; /* Reset right margin for PDA */ /* margin-right: 10px; Add some space between dropdown and button - REMOVED IN BLOCK LAYOUT*/
                flex-grow: 1; /* Allow dropdown to grow and take available space - STILL NEEDED */
                width: calc(100% - 22px); /* Adjust width to account for padding and border - BLOCK LAYOUT WIDTH */
                display: block; /* Ensure select is block for stacking */
                margin-left: 0;
                margin-right: 0;
            }

            #raceConfigGUI .car-select-section button#updateCarsButton {
                margin-bottom: 0; /* Remove default bottom margin from button */
                flex-grow: 0; /* Prevent button from growing - STILL NEEDED */
                flex-shrink: 0; /* Prevent button from shrinking - STILL NEEDED */
                display: block; /* Ensure button is block for stacking */
                width: 100%; /* Full width button in block layout */
                margin-top: 10px; /* Add space above the button */
                margin-left: 0;
                margin-right: 0;
            }


            #raceConfigGUI .preset-management-section {
                text-align: center;
            }


            /* --- PDA Specific Styles --- */
            @media (max-width: 768px) {
                #raceConfigGUI {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 95%;
                    max-height: 90%;
                    overflow-y: auto; /* Enable scrolling if content overflows */
                    padding: 15px;
                    margin: 2.5%; /* Center GUI with margin on sides */
                    border-radius: 15px;
                }

                #raceConfigGUI h2 {
                    font-size: 1.8em; /* Adjust heading sizes for PDA */
                }

                #raceConfigGUI h4 {
                    font-size: 1.2em;
                }

                #raceConfigGUI button,
                #raceConfigGUI #toggleRaceGUIButton,
                #raceConfigGUI .preset-button,
                #raceConfigGUI .remove-preset,
                #raceConfigGUI .gui-button,
                #raceConfigGUI .close-button {
                    padding: 12px 20px; /* Larger buttons for touch */
                    font-size: 1.1em;
                    margin: 5px 8px 5px 0; /* Adjust button spacing for PDA */
                }

                #raceConfigGUI input[type="text"],
                #raceConfigGUI select {
                    padding: 12px; /* Larger inputs for touch */
                    font-size: 1.1em;
                }

                #raceConfigGUI .config-params-section {
                    grid-template-columns: 1fr; /* Stack grid items on PDA */
                }

                #raceConfigGUI .car-select-section {
                    flex-direction: column; /* Stack label, dropdown, and button vertically on PDA - STILL NEEDED FOR PDA*/
                    align-items: stretch; /* Stretch items to full width on PDA - STILL NEEDED FOR PDA*/
                }

                #raceConfigGUI .car-select-section label {
                    margin-right: 0; /* Reset right margin for PDA */
                    margin-bottom: 5px; /* Add bottom margin to label on PDA */
                    text-align: center; /* Center label text on PDA */
                }

                #raceConfigGUI .car-select-section select {
                    margin-right: 0; /* Reset right margin for PDA */
                    margin-bottom: 10px; /* Add bottom margin to dropdown on PDA */
                }

                #raceConfigGUI .car-select-section button#updateCarsButton {
                    margin-right: 0; /* Reset right margin for PDA */
                    width: 100%; /* Make button full width on PDA */
                }
            }


            /* --- Dark Mode --- */
            body {
                background-color: #181818; /* Dark body background */
                color: #ddd; /* Default text color for dark mode */
            }

            a {
                color: #8da9c4; /* Example link color for dark mode */
            }

            a:hover {
                color: #b0cddb; /* Link hover color for dark mode */
            }

            div.race-container {
                background-color: #282828 !important; /* Dark race container background */
                color: #ddd !important;
            }

            .race-body, .race-head {
                background-color: #333 !important; /* Darker race body/head */
                color: #eee !important;
            }

            .race-list-row {
                border-bottom: 1px solid #444 !important; /* Darker row separators */
            }

            .race-details-wrap {
                background-color: #3a3a3a !important; /* Darker details wrap */
                color: #ddd !important;
            }

            .race-bet-section {
                background-color: #444 !important; /* Darker bet section */
                color: #ddd !important;
            }

            .race-bet-input {
                background-color: #555 !important; /* Darker bet input */
                color: #eee !important;
                border-color: #666 !important;
            }

            .race-bet-button {
                background-color: #666 !important; /* Darker bet button */
                color: #fff !important;
            }

            .race-bet-button:hover {
                background-color: #777 !important; /* Darker bet button hover */
            }

            .race-content-section {
                background-color: #333 !important; /* Darker content section */
                color: #eee !important;
            }


            /* Add more dark mode styles as needed for other Torn elements */
        `;
        document.head.appendChild(style);

        loadSavedApiKey();
        loadCars();
        loadPresets();
        setupEventListeners();
        applyPresetFromURL();
    }

    // --- Load and Save API Key ---
    function loadSavedApiKey() {
        let apiKey = localStorage.getItem(STORAGE_API_KEY) || ''; // Use localStorage instead of GM_getValue for NoGMf version
        $('#raceConfigApiKey').val(apiKey);
    }

    function saveApiKey() {
        let apiKeyToSave = $('#raceConfigApiKey').val().trim();
        localStorage.setItem(STORAGE_API_KEY, apiKeyToSave); // Use localStorage instead of GM_setValue for NoGMf version
        alert('API Key Saved (It is stored locally in your browser storage).');
        setTimeout(loadCars, 50);
    }


    // --- Car Data Fetching ---
    function loadCars() {
        const apiKey = localStorage.getItem(STORAGE_API_KEY); // Use localStorage for NoGMf version
        const carSelect = $('#carID');

        if (!apiKey) {
            carSelect.html('<option value="">Enter API Key First</option>');
            return;
        }

        carSelect.html('<option value="">Loading Cars...</option>');

        $.ajax({
            url: `https://api.torn.com/v2/user/?selections=enlistedcars&key=${apiKey}`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.error) {
                    console.error("API Error:", data.error.error);
                    carSelect.html(`<option value="">API Error: ${data.error.error} </option>`);
                } else {
                    carSelect.empty();
                    const cars = data.enlistedcars || {};
                    if (Object.keys(cars).length === 0) {
                        carSelect.html('<option value="">No cars enlisted</option>');
                    } else {
                        $.each(cars, function(carId, carDetails) {
                            const carDisplayName = carDetails.name || carDetails.item_name;
                            const carRealID = carDetails.id;
                            carSelect.append(`<option value="${carRealID}">${carDisplayName} (ID: ${carRealID})</option>`);
                        });
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX error:", textStatus, errorThrown);
                carSelect.html('<option value="">Error loading cars</option>');
            }
        });
    }

    // --- RFC Value Fetching ---
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


    // --- Preset Functions ---
    function loadPresets() {
        const presets = JSON.parse(localStorage.getItem('racePresets_NoGMf') || '{}'); // Use localStorage for NoGMf version
        const presetButtonsDiv = $('#presetButtons');
        presetButtonsDiv.empty();

        $.each(presets, function(presetName, presetConfig) {
            presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
        });
    }

    function savePreset() {
        const presetName = prompt("Enter a name for this preset:");
        if (!presetName) return;

        const presets = JSON.parse(localStorage.getItem('racePresets_NoGMf') || '{}'); // Use localStorage for NoGMf version
        presets[presetName] = getCurrentConfig();
        localStorage.setItem('racePresets_NoGMf', JSON.stringify(presets)); // Use localStorage for NoGMf version
        loadPresets();
    }

    function removePreset(presetName, buttonElement) {
        if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            let presets = JSON.parse(localStorage.getItem('racePresets_NoGMf') || '{}'); // Use localStorage for NoGMf version
            delete presets[presetName];
            localStorage.setItem('racePresets_NoGMf', JSON.stringify(presets)); // Use localStorage for NoGMf version
            $(buttonElement).closest('.preset-button-container').remove();
        }
    }

    function applyPreset(presetConfig) {
        $('#trackID').val(presetConfig.trackID);
        $('#raceName').val(presetConfig.raceName);
        $('#laps').val(presetConfig.laps);
        $('#carID').val(presetConfig.carID);
        $('#minDrivers').val(presetConfig.minDrivers);
        $('#maxDrivers').val(presetConfig.maxDrivers);
        $('#racePassword').val(presetConfig.racePassword || '');
        $('#raceStartTime').val(presetConfig.raceStartTime || '');
        $('#betAmount').val(presetConfig.betAmount || '0');
    }

    function createPresetButton(presetName, presetConfig) {
        const container = $('<div class="preset-button-container"></div>'); //Removed inline style for better CSS control
        const button = $(`<button class="preset-button">${presetName}</button>`); //Removed inline style for better CSS control
        const removeButton = $(`<button class="remove-preset">x</button>`); //Removed inline style for better CSS control


        button.on('click', function() {
            applyPreset(presetConfig);
        });
        removeButton.on('click', function() {
            removePreset(presetName, removeButton);
        });

        container.append(button);
        container.append(removeButton);
        return container;
    }


    // --- Race Creation ---
    function createRace() {
        const carID = $('#carID').val();
        const trackID = $('#trackID').val();
        const laps = $('#laps').val();
        const raceName = $('#raceName').val() || `${tracks[trackID]} Race`;
        const minDrivers = $('#minDrivers').val();
        const maxDrivers = $('#maxDrivers').val();
        const racePassword = $('#racePassword').val();
        let raceStartTimeInputValue = $('#raceStartTime').val();
        const betAmount = $('#betAmount').val();


        if (!carID || !trackID || !laps || !minDrivers || !maxDrivers) {
            alert("Please fill in all race details (Car, Track, Laps, Min/Max Drivers).");
            return;
        }

        const rfcValue = getRFC();

        let raceURL = `https://www.torn.com/loader.php?sid=racing&tab=customrace&action=getInRace&step=getInRace&id=&carID=${carID}&createRace=true&title=${encodeURIComponent(raceName)}&minDrivers=${minDrivers}&maxDrivers=${maxDrivers}&trackID=${trackID}&laps=${laps}&minClass=5&carsTypeAllowed=1&carsAllowed=5&betAmount=0`; //Default betAmount=0 - will be updated below

        if (racePassword) {
            raceURL += `&password=${encodeURIComponent(racePassword)}`;
        }

        let waitTimeValue = Math.floor(Date.now()/1000);

        if (raceStartTimeInputValue) {
            const parts = raceStartTimeInputValue.split('T');
            const dateParts = parts[0].split('-');
            const timeParts = parts[1].split(':');

            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const day = parseInt(dateParts[2], 10);
            const hour = parseInt(timeParts[0], 10);
            const minute = parseInt(timeParts[1], 10);

            let startTimeDate = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));

            const minutes = startTimeDate.getUTCMinutes();
            const remainder = minutes % 15;

            if (remainder !== 0) {
                const minutesToAdd = 15 - remainder;
                startTimeDate.setUTCMinutes(minutes + minutesToAdd, 0, 0);
                raceStartTimeInputValue = startTimeDate.toISOString().slice(0, 16);
                $('#raceStartTime').val(raceStartTimeInputValue);
                alert("Start time adjusted to the next 15-minute mark (TCT). Please check the adjusted time in the GUI.");
            }


            waitTimeValue = Math.floor(startTimeDate.getTime() / 1000);

            if (isNaN(waitTimeValue)) {
                alert("Invalid Start Time. Using current time instead.");
                waitTimeValue = Math.floor(Date.now()/1000);
            }
        }
        raceURL += `&waitTime=${waitTimeValue}&rfcv=${rfcValue}`;

        if (betAmount && parseInt(betAmount) > 0) { // Only add betAmount parameter if it's greater than 0 and not empty
            raceURL = raceURL.replace("&betAmount=0", `&betAmount=${parseInt(betAmount)}`); //Replace default 0 with user bet amount
        }


        window.location = raceURL;
        console.log("Initiating race creation via browser redirect to:", raceURL);
        alert("Race created and URL opened! Check the Torn racing page to confirm and manage your race.");
    }


    // --- Preset Configuration Functions ---
    function getCurrentConfig() {
        return {
            trackID: $('#trackID').val(),
            raceName: $('#raceName').val(),
            laps: $('#laps').val(),
            carID: $('#carID').val(),
            minDrivers: $('#minDrivers').val(),
            maxDrivers: $('#maxDrivers').val(),
            racePassword: $('#racePassword').val(),
            //raceStartTime: $('#raceStartTime').val(), // <--- COMMENTED OUT TO AVOID SAVING TIME IN PRESETS
            betAmount: $('#betAmount').val()
        };
    }


    // --- Event Listeners ---
    function setupEventListeners() {
        $('#saveApiKeyCustom').on('click', saveApiKey);
        $('#createRaceButton').on('click', createRace);
        $('#savePresetButton').on('click', savePreset);
        $('#updateCarsButton').on('click', loadCars); // Button to manually update car list
        $('#closeGUIButton').on('click', function() { $('#raceConfigGUI').hide(); });
        $('#presetButtons').on('click', '.remove-preset', function() {
            const presetName = $(this).prev('.preset-button').text();
            removePreset(presetName, this);
        });
    }


    // --- Initialization ---
    $(document).ready(function() {
        if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
            // Simplified inline styles - relying on CSS class for most styling now
            const toggleButton = $(`<button id="toggleRaceGUIButton" class="gui-button" style="text-decoration: none; margin-right: 10px;">Race Config GUI (v2.97 PDA NoGMf)</button>`);

            $('div.content-title > h4').append(toggleButton);

            toggleButton.on('click', function() {
                if ($('#raceConfigGUI').is(':visible')) {
                    $('#raceConfigGUI').hide();
                } else {
                    createGUI();
                    $('#raceConfigGUI').show();
                }
            });
        }
        // Descriptive text is now removed
    });

})();