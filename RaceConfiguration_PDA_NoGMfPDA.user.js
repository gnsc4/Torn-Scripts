// ==UserScript==
// @name         Torn Race Config GUI - PDA & Desktop - v2.58 - Longer Debounce DEBUG
// @namespace    torn.raceconfiggui.pdadesktop
// @description  Simplified GUI with Debounced Save & Alert Debug - v2.57 - Debounced Save DEBUG
// @version      2.57
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
    const PRESET_STORAGE_KEY = 'torn.raceconfiggui.pdadesktop_racePresets'; // <--- NAMESPACED KEY

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

    const guiHTML = `
        <div id="raceConfigGUI" style="position: fixed; top: 75px; left: 20px; background-color: #333; border: 1px solid #666; padding: 15px; z-index: 1000; border-radius: 5px; color: #eee;">
            <h3 style="margin-top: 0; color: #fff;">Race Config - LONGER DEBOUNCE DEBUG v2.58</h3>
            <div style="margin-bottom: 10px;">
                <label for="raceConfigApiKey">API Key:</label>
                <input type="text" id="raceConfigApiKey" placeholder="Enter Torn API Key" style="margin-left: 5px; color: black;">
                <button id="saveApiKeyCustom" class="gui-button" style="margin-left: 5px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Save API Key</button>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 10px;">
                <h4>Presets (DEBUG v2.58 - Longer Debounce 1500ms)</h4>
                <div id="presetButtons"></div>
                <div style="margin-top: 10px;">
                    <button id="savePresetButton" class="gui-button" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer;">Save Preset</button>
                </div>
            </div>
            <button id="closeGUIButton" class="close-button" style="position: absolute; top: 5px; right: 5px; cursor: pointer; color: #ddd; background: #555; border: none; border-radius: 3px;">[X]</button>
            <span style="font-size: 0.8em; color: #999; position: absolute; bottom: 5px; right: 5px;">v2.58 - Longer Debounce Debug</span>
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
        alert('API Key Saved (v2.58 - Longer Debounce Debug)');
        // No loadCars() in this simplified version
    }


    // --- Preset Functions (Simplified for Debugging) ---
    function loadPresets() {
        alert("loadPresets() - START (v2.58)"); // DEBUG ALERT
        const presets = GM_getValue(PRESET_STORAGE_KEY, {});
        alert("loadPresets() - After GM_getValue, presets: " + JSON.stringify(presets)); // DEBUG ALERT
        const presetButtonsDiv = $('#presetButtons');
        presetButtonsDiv.empty();

        $.each(presets, function(presetName, presetConfig) {
            alert("loadPresets() - Inside loop, presetName: " + presetName); // DEBUG ALERT
            presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
        });
        alert("loadPresets() - END (v2.58)"); // DEBUG ALERT
    }

    function savePreset() {
        alert("savePreset() - START (v2.58) - DEBOUNCED FUNCTION (1500ms)"); // DEBUG ALERT - ALERT AT START OF FUNCTION! - UPDATED MESSAGE
        const presetName = prompt("Enter a name for this preset (v2.58 DEBUG - 1500ms Debounce):"); // UPDATED PROMPT
        alert("savePreset() - After prompt, presetName: " + presetName); // DEBUG ALERT
        if (!presetName) {
            alert("savePreset() - No preset name, cancelled (v2.58)"); // DEBUG ALERT
            return;
        }

        const presets = GM_getValue(PRESET_STORAGE_KEY, {});
        alert("savePreset() - Before save, current presets: " + JSON.stringify(presets)); // DEBUG ALERT
        presets[presetName] = { name: presetName, debugVersion: "v2.58-LongerDebounce" }; // Simplified preset data - UPDATED VERSION
        GM_setValue(PRESET_STORAGE_KEY, presets);
        alert("savePreset() - After GM_setValue, preset saved: " + presetName); // DEBUG ALERT
        loadPresets(); // Immediately reload presets after saving
        alert("savePreset() - After loadPresets() call (v2.58)"); // DEBUG ALERT
        alert("savePreset() - END (v2.58) - DEBOUNCED FUNCTION (1500ms)"); // DEBUG ALERT - UPDATED MESSAGE
    }

    function removePreset(presetName, buttonElement) {
        alert("removePreset() - START, presetName: " + presetName + " (v2.58)"); // DEBUG ALERT
        if (confirm(`Are you sure you want to delete preset "${presetName}"? (v2.58 DEBUG - 1500ms Debounce)`)) { // UPDATED CONFIRM MESSAGE
            alert("removePreset() - Confirmed delete: " + presetName + " (v2.58)"); // DEBUG ALERT
            const presets = GM_getValue(PRESET_STORAGE_KEY, {});
            delete presets[presetName];
            GM_setValue(PRESET_STORAGE_KEY, presets);
            $(buttonElement).closest('.preset-button-container').remove();
            alert("removePreset() - Preset removed from GUI: " + presetName + " (v2.58)"); // DEBUG ALERT
        } else {
            alert("removePreset() - Cancelled delete: " + presetName + " (v2.58)"); // DEBUG ALERT
        }
        alert("removePreset() - END, presetName: " + presetName + " (v2.58)"); // DEBUG ALERT
    }

    function applyPreset(presetConfig) {
        alert("applyPreset() - Applying preset: " + presetConfig.name + " (v2.58)"); // DEBUG ALERT
        alert("applyPreset() - END (v2.58)"); // DEBUG ALERT - In simplified version, applyPreset does nothing else
    }


    function createPresetButton(presetName, presetConfig) {
        const container = $('<div class="preset-button-container" style="display: inline-block; margin-right: 5px; margin-bottom: 5px;"></div>');
        const button = $(`<button class="preset-button" style="cursor: pointer; margin-right: 2px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px;">${presetName} (v2.58)</button>`); // v2.58 label
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
        $('#savePresetButton').on('click', debounce(savePreset, 1500)); // DEBOUNCED savePreset! - DELAY INCREASED TO 1500ms
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
            const toggleButton = $(`<button id="toggleRaceGUIButton" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer; text-decoration: none; margin-right: 10px;">Race Config GUI (v2.58)</button>`); // v2.58 Label
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
            $('div.content-title > h4').append('<span style="color: orange; margin-left: 10px;">v2.58 - LONGER DEBOUNCE DEBUG - PRESETS ONLY</span>'); // Orange - longer debounce debug
    });

})();
