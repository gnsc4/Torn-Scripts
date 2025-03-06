// ==UserScript==
// @name         Torn Race Config GUI
// @namespace    torn.raceconfiggui
// @description  GUI to configure Torn racing parameters and save presets - Customizable Racers - Improved CSS Buttons & Position - Logo Overlap & Event Listener Fix - v2.13 Truly Correct Car IDs
// @version      2.13
// @author       GNSC4 (Based on GPT-Assistant & Shlefter's script)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==

(function() {
    'use strict';

    // --- DEBUG STORAGE KEY ---
    const STORAGE_API_KEY = 'raceConfigAPIKey_v2_13_debug'; // <--- NEW STORAGE KEY
    const STORAGE_API_KEY_OLD = 'raceConfigAPIKey_v2_12_debug'; // <--- OLD STORAGE KEY (v2.12)


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
        // Check if GUI already exists to prevent duplicates
        if ($('#raceConfigGUI').length) {
            return;
        }

        const guiHTML = `
            <div id="raceConfigGUI" style="position: fixed; top: 75px; left: 20px; background-color: #333; border: 1px solid #666; padding: 15px; z-index: 1000; border-radius: 5px; color: #eee;">
                <h3 style="margin-top: 0; color: #fff;">Race Configuration</h3>
                <div style="margin-bottom: 10px;">
                    <label for="raceConfigApiKey">API Key:</label> <!-  --- UNIQUE ID ---->
                    <input type="text" id="raceConfigApiKey" placeholder="Enter your API Key" style="margin-left: 5px; color: black;"> <!-  --- UNIQUE ID ---->
                    <button id="saveApiKeyCustom" style="margin-left: 5px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Save API Key</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="trackID">Track:</label>
                    <select id="trackID" style="margin-left: 5px; color: black;">
                        ${Object.entries(tracks).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="raceName">Race Name:</label>
                    <input type="text" id="raceName" style="margin-left: 5px; color: black;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="laps">Laps:</label>
                    <input type="number" id="laps" value="100" style="margin-left: 5px; width: 60px; color: black;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="minDrivers">Min Drivers:</label>
                    <input type="number" id="minDrivers" value="2" style="margin-left: 5px; width: 40px; color: black;">
                    <label for="maxDrivers" style="margin-left: 10px;">Max Drivers:</label>
                    <input type="number" id="maxDrivers" value="2" style="margin-left: 5px; width: 40px; color: black;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="carID">Car ID:</label>
                    <select id="carID" style="margin-left: 5px; color: black;">
                        <option value="">Loading Cars...</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                    <button id="createRaceButton" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer;">Create Race</button>
                </div>

                <div style="border-top: 1px solid #eee; padding-top: 10px;">
                    <h4>Presets</h4>
                    <div id="presetButtons">
                        </div>
                    <div style="margin-top: 10px;">
                        <button id="savePresetButton" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer;">Save Preset</button>
                    </div>
                </div>
                <button id="closeGUIButton" style="position: absolute; top: 5px; right: 5px; cursor: pointer; color: #ddd; background: #555; border: none; border-radius: 3px;">[X]</button>
                <span style="font-size: 0.8em; color: #999; position: absolute; bottom: 5px; right: 5px;">v2.13</span>
            </div>
        `;
        $('body').append(guiHTML);

        // --- CSS for Logo Overlap Fix ---
        const style = document.createElement('style');
        style.textContent = `#tcLogo { pointer-events: none; }`; // Make logo ignore pointer events
        document.head.appendChild(style);

        loadSavedApiKey();
        loadCars();
        loadPresets();
        setupEventListeners(); // Call setupEventListeners AFTER GUI is created and appended
        applyPresetFromURL(); // Check for preset in URL on GUI creation
    }

    // --- Load and Save API Key ---
    function loadSavedApiKey() {
        // --- Prioritize NEW storage key, fallback to OLD if needed ---
        let apiKey = GM_getValue(STORAGE_API_KEY, ''); // <--- NEW STORAGE KEY (v2.13)
        if (!apiKey) { // Fallback to old key if new one is empty
            apiKey = GM_getValue(STORAGE_API_KEY_OLD, ''); // <--- OLD STORAGE KEY (v2.12)
            if (apiKey) {
                GM_setValue(STORAGE_API_KEY, apiKey); // Migrate from old to new key
                GM_deleteValue(STORAGE_API_KEY_OLD); // Remove old key
                console.log("API Key migrated from old storage key to new key.");
            }
        }
        $('#raceConfigApiKey').val(apiKey); // <--- UNIQUE ID
    }

    function saveApiKey() {
        console.log("saveApiKey() function called - v2.13"); // <--- Added log

        console.log("--- saveApiKey() DIRECT INPUT READ ---"); // Log direct input read section start

        let apiKeyInputValue_jQuery = $('#raceConfigApiKey').val(); // Get value directly from input on button click  <--- UNIQUE ID
        let apiKeyToSave = apiKeyInputValue_jQuery.trim(); // Trim the value

        console.log("Reading API Key VALUE directly from input (jQuery):", apiKeyToSave); // Log value being saved

        GM_setValue(STORAGE_API_KEY, apiKeyToSave); // <--- NEW STORAGE KEY

        // --- IMMEDIATE READ BACK AND LOG ---
        const apiKeyReadBack = GM_getValue(STORAGE_API_KEY); // <--- NEW STORAGE KEY
        console.log("API Key Read Back IMMEDIATELY after saving (direct input read):", apiKeyReadBack);

        alert('API Key Saved (It is stored locally in your browser storage).');

        setTimeout(function() { // <--- DELAY BEFORE LOAD CARS
            console.log("Calling loadCars() AFTER 50ms delay");
            loadCars();
        }, 50);
    }


    // --- Car Data Fetching ---
    function loadCars() {
        console.log("loadCars() function called");
        const apiKey = GM_getValue(STORAGE_API_KEY); // <--- NEW STORAGE KEY
        const carSelect = $('#carID');

        if (!apiKey) {
            console.log("No API key found in GM_getValue");
            carSelect.html('<option value="">Enter API Key First</option>');
            return;
        }

        console.log("API Key retrieved from GM_getValue:", apiKey);
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
                    carSelect.empty(); // Clear "Loading..." option
                    const cars = data.enlistedcars || {};
                    if (Object.keys(cars).length === 0) {
                        carSelect.html('<option value="">No cars enlisted</option>');
                    } else {
                        $.each(cars, function(carId, carDetails) { // <--- carId is the KEY, carDetails is the VALUE (object)
                            // --- DEBUG LOGGING INSIDE LOOP ---
                            console.log("Car ID (from loop key):", carId); // Log the key from the loop (should not be used as car ID)
                            console.log("Car Details Object:", carDetails); // Log the entire carDetails object to inspect its properties

                            // --- Use carDetails.item_name if carDetails.name is null --- <---- CAR NAME FIX (already present)
                            const carDisplayName = carDetails.name || carDetails.item_name;
                            // --- Use carDetails.id for Car ID --- <---- CORRECT CAR ID - VERSION 2.13 - USE carDetails.id
                            const carRealID = carDetails.id; // <---- CORRECT CAR ID - VERSION 2.13 - Get car ID from carDetails.id

                            carSelect.append(`<option value="${carRealID}">${carDisplayName} (ID: ${carRealID})</option>`); // <---- CORRECT CAR ID - VERSION 2.13 - Use carRealID in option VALUE and display
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

    // --- Preset Functions ---
    function loadPresets() {
        const presets = GM_getValue('racePresets', {});
        const presetButtonsDiv = $('#presetButtons');
        presetButtonsDiv.empty(); // Clear existing buttons

        $.each(presets, function(presetName, presetConfig) {
            presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
        });
    }

    function savePreset() {
        const presetName = prompt("Enter a name for this preset:");
        if (!presetName) return;

        const presets = GM_getValue('racePresets', {});
        presets[presetName] = getCurrentConfig();
        GM_setValue('racePresets', presets);
        loadPresets(); // Reload buttons to display the new one
    }

    function removePreset(presetName, buttonElement) {
        if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            const presets = GM_getValue('racePresets', {});
            delete presets[presetName];
            GM_setValue('racePresets', presets);
            $(buttonElement).closest('.preset-button-container').remove(); // Remove the button from GUI directly
        }
    }

    function applyPreset(presetConfig) {
        $('#trackID').val(presetConfig.trackID);
        $('#raceName').val(presetConfig.raceName);
        $('#laps').val(presetConfig.laps);
        $('#carID').val(presetConfig.carID);
        $('#minDrivers').val(presetConfig.minDrivers); // Apply minDrivers from preset
        $('#maxDrivers').val(presetConfig.maxDrivers); // Apply maxDrivers from preset
    }

    function createPresetButton(presetName, presetConfig) {
        const container = $('<div class="preset-button-container" style="display: inline-block; margin-right: 5px; margin-bottom: 5px;"></div>');
        const button = $(`<button class="preset-button" style="cursor: pointer; margin-right: 2px; color: black;">${presetName}</button>`);
        const removeButton = $(`<button class="remove-preset" style="cursor: pointer; font-size: 0.8em; color: #ddd; background: #555; border: none; border-radius: 3px;">x</button>`);

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
        const raceName = $('#raceName').val() || `${tracks[trackID]} Race`; // Default race name if empty
        const minDrivers = $('#minDrivers').val(); // Get minDrivers value from input
        const maxDrivers = $('#maxDrivers').val(); // Get maxDrivers value from input

        if (!carID || !trackID || !laps || !minDrivers || !maxDrivers) {
            alert("Please fill in all race details (Car, Track, Laps, Min/Max Drivers).");
            return;
        }

        // Construct the URL to redirect to
        const url = `https://torn.com/loader.php?sid=racing&tab=customrace&action=getInRace&step=getInRace&id=&carID=${carID}&createRace=true&title=${encodeURIComponent(raceName)}&minDrivers=${minDrivers}&maxDrivers=${maxDrivers}&trackID=${trackID}&laps=${laps}&minClass=5&carsTypeAllowed=1&carsAllowed=5&betAmount=0&waitTime=${Math.floor(Date.now()/1000)}&rfcv=${getRFC()}`;

        // Redirect to the constructed URL
        window.location = url;
    }

    // --- Helper Functions ---
    function getCurrentConfig() {
        return {
            trackID: $('#trackID').val(),
            raceName: $('#raceName').val(),
            laps: $('#laps').val(),
            carID: $('#carID').val(),
            minDrivers: $('#minDrivers').val(), // Save minDrivers in config
            maxDrivers: $('#maxDrivers').val()  // Save maxDrivers in config
        };
    }

    function getRFC() { // Placeholder -  You might need to implement the actual RFC fetch if needed
        return ''; // Replace with actual RFC fetch logic if required for Torn
    }

    function applyPresetFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const presetParam = urlParams.get('preset');

        if (presetParam) {
            const presets = GM_getValue('racePresets', {});
            const presetToApply = presets[presetParam];
            if (presetToApply) {
                applyPreset(presetToApply);
                alert(`Preset "${presetParam}" applied from URL.`);
            } else {
                alert(`Preset "${presetParam}" not found.`);
            }
        }
    }


    // --- Event Listeners ---
    function setupEventListeners() {
        console.log("setupEventListeners() called (v2.13)");

        // --- SAVE API KEY BUTTON CLICK EVENT ---
        $('#saveApiKeyCustom').on('click', saveApiKey);

        $('#createRaceButton').on('click', createRace);
        $('#savePresetButton').on('click', savePreset);
        $('#closeGUIButton').on('click', function() { $('#raceConfigGUI').hide(); });
        $('#presetButtons').on('click', '.remove-preset', function() {
            const presetName = $(this).prev('.preset-button').text();
            removePreset(presetName, this);
        });
    }


    // --- Initialization ---
    $(document).ready(function() {
        // Add a button to toggle the GUI - placed next to the page title for example
        if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
            const toggleButton = $(`<button id="toggleRaceGUIButton" style="color: var(--default-blue-color); cursor: pointer; margin-right: 10px;">Race Config GUI</button>`);
            $('div.content-title > h4').append(toggleButton);

            toggleButton.on('click', function() {
                if ($('#raceConfigGUI').is(':visible')) {
                    $('#raceConfigGUI').hide();
                } else {
                    createGUI(); // Create GUI only when first shown
                    $('#raceConfigGUI').show();
                }
            });
        }
    });

})();