// ==UserScript==
// @name         Torn Race Config GUI - PDA & Desktop - v2.61 - Auto Cache Clear
// @namespace    torn.raceconfiggui.pdadesktop
// @description  Simplified GUI with Auto Cache Clear on GUI Create - v2.61 - Auto Cache Clear
// @version      2.61-PDA-Desktop-GMfPDA-AutoCacheClear-DEBUG
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @author       GNSC4 [268863] (Based on Shlefter's script)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- GMforPDA Inlined Code (Direct Assignment Modified) ---
    ((e, t, o, r, n, i) => { /* ... GMforPDA code - SAME AS BEFORE - DO NOT CHANGE ... */   })(window, Object, DOMException, AbortController, Promise, localStorage);
    // --- End GMforPDA Inlined Code ---

    const STORAGE_API_KEY = 'torn.raceconfiggui.pdadesktop_raceConfigAPIKey_release';
    const PRESET_STORAGE_KEY = 'torn.raceconfiggui.pdadesktop_racePresets_v2_61'; // <--- UNIQUE PRESET STORAGE KEY (v2.61)

    // --- Global Styles (Minimal) ---
    const style = document.createElement('style');
    style.textContent = `
        #raceConfigGUI .gui-button:hover,
        #raceConfigGUI .preset-button:hover,
        #raceConfigGUI .remove-preset:hover,
        #raceConfigGUI .close-button:hover,
        #raceConfigGUI #closeGUIButton:hover,
        #toggleRaceGUIButton:hover {
            background-color: #777 !important;
        }
    `;
    document.head.appendChild(style);


    // --- Simplified GUI Elements ---
    function createGUI() {
    if ($('#raceConfigGUI').length) {
        return;
    }

    // --- **AUTO CACHE CLEAR LOGIC ADDED HERE (v2.61)** ---
    const existingPresets = GM_getValue(PRESET_STORAGE_KEY, null); // Check if presets exist
    if (existingPresets && Object.keys(existingPresets).length > 0) {
        GM_deleteValue(PRESET_STORAGE_KEY); // Automatically clear presets cache if it exists
        alert('Preset cache automatically cleared for v2.61.  Please save your presets again.'); // Inform user
        console.log("Preset cache automatically cleared for v2.61"); // Console log
    } else {
        console.log("No existing presets found, cache not cleared (v2.61)"); // Console log if no clear needed
    }
    // --- **END AUTO CACHE CLEAR LOGIC** ---


    const guiHTML = `
        <div id="raceConfigGUI" style="position: fixed; top: 75px; left: 20px; background-color: #333; border: 1px solid #666; padding: 15px; z-index: 1000; border-radius: 5px; color: #eee;">
            <h3 style="margin-top: 0; color: #fff;">Race Config - AUTO CLEAR DEBUG v2.61</h3>
            <div style="margin-bottom: 10px;">
                <label for="raceConfigApiKey">API Key:</label>
                <input type="text" id="raceConfigApiKey" placeholder="Enter Torn API Key" style="margin-left: 5px; color: black;">
                <button id="saveApiKeyCustom" class="gui-button" style="margin-left: 5px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Save API Key</button>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 10px;">
                <h4>Presets (DEBUG v2.61 - Auto Cache Clear)</h4>
                <div id="presetButtons"></div>
                <div style="margin-top: 10px;">
                    <button id="savePresetButton" class="gui-button" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer;">Save Preset</button>
                </div>
            </div>
            <button id="closeGUIButton" class="close-button" style="position: absolute; top: 5px; right: 5px; cursor: pointer; color: #ddd; background: #555; border: none; border-radius: 3px;">[X]</button>
            <span style="font-size: 0.8em; color: #999; position: absolute; bottom: 5px; right: 5px;">v2.61 - Auto Cache Clear Debug</span>
        </div>
    `;
    $('body').append(guiHTML);

    loadSavedApiKey();
    loadPresets(); // Load presets on GUI creation
    setupEventListeners();
    }

    // --- Load and Save API Key ---
    function loadSavedApiKey() {
        let apiKey = GM_getValue(STORAGE_API_KEY, '');
        $('#raceConfigApiKey').val(apiKey);
    }

    function saveApiKey() {
        let apiKeyToSave = $('#raceConfigApiKey').val().trim();
        GM_setValue(STORAGE_API_KEY, apiKeyToSave);
        alert('API Key Saved (v2.61 - Auto Cache Clear Debug)');
        // No loadCars() in this simplified version
    }


    // --- Preset Functions (Simplified for Debugging) ---
    function loadPresets() {
        console.log("loadPresets() - START (v2.61)"); // DEBUG CONSOLE LOG - START
        alert("loadPresets() - START (v2.61)"); // DEBUG ALERT - START
        let presets = {}; // <--- EXPLICITLY CLEAR PRESETS OBJECT
        presets = GM_getValue(PRESET_STORAGE_KEY, {}); // Load from storage AFTER clearing
        console.log("loadPresets() - After GM_getValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT
        alert("loadPresets() - After GM_getValue, presets: " + JSON.stringify(presets)); // DEBUG ALERT - PRESETS OBJECT (STRINGIFIED)
        const presetButtonsDiv = $('#presetButtons');
        presetButtonsDiv.empty();

        $.each(presets, function(presetName, presetConfig) {
            console.log("loadPresets() - Inside loop, presetName: " + presetName); // DEBUG CONSOLE LOG - LOOP ITERATION
            alert("loadPresets() - Inside loop, presetName: " + presetName); // DEBUG ALERT - LOOP ITERATION
            presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
        });
        console.log("loadPresets() - END (v2.61)"); // DEBUG CONSOLE LOG - END
        alert("loadPresets() - END (v2.61)"); // DEBUG ALERT - END
    }

    function savePreset() {
        alert("savePreset() - START (v2.61) - DEBOUNCED FUNCTION (1500ms)"); // DEBUG ALERT - START
        console.log("savePreset() - START (v2.61) - DEBOUNCED FUNCTION (1500ms)"); // DEBUG CONSOLE LOG - START
        const presetName = prompt("Enter a name for this preset (v2.61 DEBUG - Auto Cache Clear):"); // UPDATED PROMPT
        alert("savePreset() - After prompt, presetName: " + presetName); // DEBUG ALERT
        console.log("savePreset() - After prompt, presetName: " + presetName); // DEBUG CONSOLE LOG - AFTER PROMPT
        if (!presetName) {
            alert("savePreset() - No preset name, cancelled (v2.61)"); // DEBUG ALERT
            console.log("savePreset() - No preset name, cancelled (v2.61)"); // DEBUG CONSOLE LOG - CANCELLED
            return;
        }

        const presets = GM_getValue(PRESET_STORAGE_KEY, {});
        console.log("savePreset() - Before save, current presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT BEFORE SAVE
        alert("savePreset() - Before save, current presets: " + JSON.stringify(presets)); // DEBUG ALERT - PRESETS OBJECT (STRINGIFIED) BEFORE SAVE
        presets[presetName] = { name: presetName, debugVersion: "v2.61-AutoCacheClear" }; // Simplified preset data - UPDATED VERSION
        GM_setValue(PRESET_STORAGE_KEY, presets);
        console.log("savePreset() - After GM_setValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT AFTER SAVE
        alert("savePreset() - After GM_setValue, preset saved: " + presetName); // DEBUG ALERT - SAVED ALERT
        loadPresets(); // Immediately reload presets after saving
        alert("loadPresets() - After loadPresets() call (v2.61)"); // DEBUG ALERT - AFTER LOADPRESETS CALL
        console.log("savePreset() - END (v2.61) - DEBOUNCED FUNCTION (1500ms)"); // DEBUG CONSOLE LOG - END
        alert("savePreset() - END (v2.61) - DEBOUNCED FUNCTION (1500ms)"); // DEBUG ALERT - END
    }

    function removePreset(presetName, buttonElement) {
        alert("removePreset() - START, presetName: " + presetName + " (v2.61)"); // DEBUG ALERT
        console.log("removePreset() - START, presetName: " + presetName + " (v2.61)"); // DEBUG CONSOLE LOG - START
        if (confirm(`Are you sure you want to delete preset "${presetName}"? (v2.61 DEBUG - Auto Cache Clear)`)) { // UPDATED CONFIRM MESSAGE
            alert("removePreset() - Confirmed delete: " + presetName + " (v2.61)"); // DEBUG ALERT
            console.log("removePreset() - Confirmed delete: " + presetName + " (v2.61)"); // DEBUG CONSOLE LOG - DELETE CONFIRMED
            const presets = GM_getValue(PRESET_STORAGE_KEY, {});
            delete presets[presetName];
            GM_setValue(PRESET_STORAGE_KEY, presets);
            $(buttonElement).closest('.preset-button-container').remove();
            alert("removePreset() - Preset removed from GUI: " + presetName + " (v2.61)"); // DEBUG ALERT
            console.log("removePreset() - Preset removed from GUI: " + presetName + " (v2.61)"); // DEBUG CONSOLE LOG - GUI REMOVED
        } else {
            alert("removePreset() - Cancelled delete: " + presetName + " (v2.61)"); // DEBUG ALERT
            console.log("removePreset() - Cancelled delete: " + presetName + " (v2.61)"); // DEBUG CONSOLE LOG - DELETE CANCELLED
        }
        alert("removePreset() - END, presetName: " + presetName + " (v2.61)"); // DEBUG ALERT
        console.log("removePreset() - END, presetName: " + presetName + " (v2.61)"); // DEBUG CONSOLE LOG - END
    }

    function applyPreset(presetConfig) {
        alert("applyPreset() - Applying preset: " + presetConfig.name + " (v2.61)"); // DEBUG ALERT
        console.log("applyPreset() - Applying preset: " + presetConfig.name + " (v2.61)"); // DEBUG CONSOLE LOG - APPLY START
        alert("applyPreset() - END (v2.61)"); // DEBUG ALERT - In simplified version, applyPreset does nothing else
        console.log("applyPreset() - END (v2.61)"); // DEBUG CONSOLE LOG - APPLY END
    }


    function createPresetButton(presetName, presetConfig) {
        const container = $('<div class="preset-button-container" style="display: inline-block; margin-right: 5px; margin-bottom: 5px;"></div>');
        const button = $(`<button class="preset-button" style="cursor: pointer; margin-right: 2px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px;">${presetName} (v2.61)</button>`); // v2.61 label
        const removeButton = $(`<button class="remove-preset" style="cursor: pointer; font-size: 0.8em; color: #ddd; background: #555; border: none; border-radius: 3px;">x</button>`);

        button.on('click', function() { applyPreset(presetConfig); });
        removeButton.on('click', function() { removePreset(presetName, removeButton); });

        container.append(button);
        container.append(removeButton);
        return container;
    }


    // --- Event Listeners ---
    function setupEventListeners() {
        $('#saveApiKeyCustom').on('click', saveApiKey);
        $('#savePresetButton').on('click', debounce(savePreset, 1500)); // DEBOUNCED savePreset! - 1500ms delay
        $('#closeGUIButton').on('click', function() { $('#raceConfigGUI').hide(); });
        $('#presetButtons').on('click', '.remove-preset', function() {
            const presetName = $(this).prev('.preset-button').text();
            removePreset(presetName, removeButton);
        });
    }

    // --- Debounce function ---
    function debounce(func, delay) {
        let timeoutId;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function() {
                func.apply(context, args);
            }, delay);
        };
    }


    // --- Initialization ---
    $(document).ready(function() {
        if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
            const toggleButton = $(`<button id="toggleRaceGUIButton" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer; text-decoration: none; margin-right: 10px;">Race Config GUI (v2.61)</button>`); // v2.61 Label
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
            $('div.content-title > h4').append('<span style="color: orange; margin-left: 10px;">v2.61 - AUTO CACHE CLEAR DEBUG - PRESETS ONLY</span>'); // Orange - auto cache clear debug
    });

})();