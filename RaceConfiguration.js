// ==UserScript==
// @name         Torn Race Config GUI
// @namespace    torn.raceconfiggui
// @description  GUI to configure Torn racing parameters and save presets - Customizable Racers - Improved CSS Buttons & Position
// @version      1.3
// @author       GPT-Assistant (Based on Shlefter's script)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

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
                    <label for="apiKey">API Key:</label>
                    <input type="text" id="apiKey" placeholder="Enter your API Key" style="margin-left: 5px; color: black;">
                    <button id="saveApiKey" style="margin-left: 5px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Save API Key</button>
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
            </div>
        `;
        $('body').append(guiHTML);

        loadSavedApiKey();
        loadCars();
        loadPresets();
        setupEventListeners();
        applyPresetFromURL(); // Check for preset in URL on GUI creation
    }

    // --- Load and Save API Key ---
    function loadSavedApiKey() {
        const apiKey = GM_getValue('tornApiKey', '');
        $('#apiKey').val(apiKey);
    }

    function saveApiKey() {
        const apiKey = $('#apiKey').val();
        console.log("Saving API Key:", apiKey); // Added console log before saving
        GM_setValue('tornApiKey', apiKey);
        alert('API Key Saved (It is stored locally in your browser storage).');
        console.log("Calling loadCars() after saving API Key"); // Added console log before calling loadCars
        loadCars();
    }


    // --- Car Data Fetching ---
    function loadCars() {
        console.log("loadCars() function called"); // Added console log at the start of loadCars
        const apiKey = GM_getValue('tornApiKey');
        const carSelect = $('#carID');
    
        if (!apiKey) {
            console.log("No API key found in GM_getValue"); // Added console log if no API key
            carSelect.html('<option value="">Enter API Key First</option>');
            return;
        }
    
        console.log("API Key retrieved from GM_getValue:", apiKey); // Added console log to show retrieved API key
        carSelect.html('<option value="">Loading Cars...</option>'); // Reset and show loading

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
                        $.each(cars, function(carId, carDetails) {
                            carSelect.append(`<option value="${carId}">${carDetails.name} (ID: ${carId})</option>`);
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
        console.log("setupEventListeners() called"); // ADD THIS LINE
        $('#saveApiKey').on('click', saveApiKey);
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