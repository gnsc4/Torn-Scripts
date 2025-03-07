// ==UserScript==
// @name         Torn Race Config GUI PDA NoGMf
// @namespace    torn.raceconfigguipda
// @description  PDA GUI to configure Torn racing parameters, schedule races, set passwords, save presets, create races easily, betting feature, styled toggle button, release storage key, hover button color change, final polish, with update URL, PDA/Mobile Friendly, No GM Functions for wider compatibility. With Preset Descriptions and Author Credit.
// @version      2.98ai  // Corrected @version for Tampermonkey - "PDA NoGMf" moved to name/description - Toggle Button BG Fix - Revert Create Button Style - Clear Presets Feature - Preset Hover Fix - Input Text Color Fix - Clear Presets Button Style Fix - All Input Text Color Fix - White Text for Dark Mode - Definitive Input Text Color Fix - White Text Everywhere - Forced White Text Color - Definitive Fix with !important - GUI Visual Polish - Compact Driver Inputs - GUI Position Lower & Solid White Section Lines - Refine Section Lines - Create Race Button Fix & Header Lines - Create Race Button Hover Fix & Lower GUI - Close Button Hover Fix - Reduce Race Settings Spacing - Tighter Race Settings Spacing - Quick Preset Race Buttons - Styled Quick Race Buttons - GUI Toggle Race Entry Fix - Quick Button Border & Hover Fix - CSS Specificity Fix for Quick Buttons - Preset Descriptions & Author Credit - Preset Button & Delete Button Alignment Fixes - Preset Button Content Fix - Preset Car Description Fix & Cache Update - Preset Button Info on Button - Preset Delete Button Position Right - Race Settings Layout Fix - Forceful CSS - GUI Width Lock - Preset Overflow Fix - Button Width Control
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @downloadURL  https://github.com/gnsc-scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @author       GNSC4 [268863] (Based on Shlefter's script, GMforPDA by Kwack -  Version 2.49 base + CSS fix + Toggle Button BG Fix + Revert Create Button Style + Clear Presets Feature + Preset Hover Fix - Input Text Color Fix - Clear Presets Button Style Fix - All Input Text Color Fix - White Text for Dark Mode - Definitive Input Text Color Fix - White Text Everywhere - Forced White Text Color - Definitive Fix with !important - GUI Visual Polish - Compact Driver Inputs - GUI Position Lower & Solid White Section Lines - Refine Section Lines - Create Race Button Hover Fix & Lower GUI - Close Button Hover Fix - Reduce Race Settings Spacing - Tighter Race Settings Spacing - Quick Preset Race Buttons - Styled Quick Race Buttons - GUI Toggle Race Entry Fix - Quick Button Border & Hover Fix - CSS Specificity Fix for Quick Buttons - Preset Descriptions & Author Credit - Preset Button & Delete Button Alignment Fixes - Preset Button Content Fix - Preset Car Description Fix & Cache Update - Preset Button Info on Button - Preset Delete Button Position Right - Race Settings Layout Fix - Forceful CSS - GUI Width Lock - Preset Overflow Fix - Button Width Control)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
// @license      MIT
// ==/UserScript==

// --- GMforPDA Inlined Code ---
((e, t, o, r, n, i) => {
    if (typeof GM !== 'undefined') { // Enhanced check: if GM object exists, ABORT
        return; // Exit the GMforPDA inlined code immediately
    }
    const s = {
        script: {},
        scriptHandler: "GMforPDA version 2.2",
        version: 2.2,
    };
    function a(e, t) {
        if (!e) throw new TypeError("No key supplied to GM_getValue");
        const o = i.getItem(e);
        return "string" != typeof o
            ? t
            : o.startsWith("GMV2_")
                ? JSON.parse(o.slice(5)) ?? t
                : o ?? t;
    }
    function l(e, t) {
        if (!e) throw new TypeError("No key supplied to GM_setValue");
        i.setItem(e, "GMV2_" + JSON.stringify(t));
    }
    function u(e) {
        if (!e) throw new TypeError("No key supplied to GM_deleteValue");
        i.removeItem(e);
    }
    function c() {
        return t.keys(i);
    }
    function d(e) {
        if (!e || "string" != typeof e) return;
        const t = document.createElement("style");
        (t.type = "text/css"), (t.innerHTML = e), document.head.appendChild(t);
    }
    function p(...e) {
        if ("object" == typeof e[0]) {
            const { text: o, title: r, onclick: n, ondone: i } = e[0];
            t(o, r, n, i);
        } else if ("string" == typeof e[0]) {
            const [o, r, , n] = e;
            t(o, r, n);
        }
        return { remove: () => {} };
        function t(e, t, o, r) {
            if (!e)
                throw new TypeError(
                    "No notification text supplied to GM_notification"
                );
            confirm(`${t ?? "No title specified"}\n${e}`) && o?.(), r?.();
        }
    }
    function f(e) {
        if (!e) throw new TypeError("No text supplied to GM_setClipboard");
        navigator.clipboard.writeText(e);
    }
    const w = {
        version: 2.2,
        info: s,
        addStyle: d,
        deleteValue: async (e) => u(e),
        getValue: async (e, t) => a(e, t),
        listValues: async () => c(),
        notification: p,
        setClipboard: f,
        setValue: async (e, t) => l(e, t),
        xmlHttpRequest: async (e) => {
            if (!e || "object" != typeof e)
                throw new TypeError(
                    "Invalid details passed to GM.xmlHttpRequest"
                );
            const { abortController: t, prom: o } = y(e);
            return (o.abort = () => t.abort()), o;
        },
    };
    function y(e) {
        const t = new r(),
            i = t.signal,
            s = new r(),
            a = s.signal,
            {
                url: l,
                method: u,
                headers: c,
                timeout: d,
                data: p,
                onabort: f,
                onerror: w,
                onload: y,
                onloadend: h,
                onprogress: b,
                onreadystatechange: m,
                ontimeout: M,
            } = e;
        setTimeout(() => s.abort(), d ?? 3e4);
        return {
            abortController: t,
            prom: new n(async (e, t) => {
                try {
                    l || t("No URL supplied"),
                        i.addEventListener("abort", () => t("Request aborted")),
                        a.addEventListener("abort", () =>
                            t("Request timed out")
                        ),
                        u && "post" === u.toLowerCase()
                            ? (PDA_httpPost(l, c ?? {}, p ?? "")
                                .then(e)
                                .catch(t),
                              b?.())
                            : (PDA_httpGet(l).then(e).catch(t), b?.());
                } catch (e) {
                    t(e);
                }
            })
                .then((e) => (y?.(e), h?.(e), m?.(e), e))
                .catch((e) => {
                    switch (!0) {
                        case "Request aborted" === e:
                            if (
                                ((e = new o("Request aborted", "AbortError")),
                                f)
                            )
                                return f(e);
                            if (w) return w(e);
                            throw e;
                        case "Request timed out" === e:
                            if (
                                ((e = new o(
                                    "Request timed out",
                                    "TimeoutError"
                                )),
                                M)
                            )
                                return M(e);
                            if (w) return w(e);
                            throw e;
                        case "No URL supplied" === e:
                            if (
                                ((e = new TypeError(
                                    "Failed to fetch: No URL supplied"
                                )),
                                w)
                            )
                                return w(e);
                            throw e;
                        default:
                            if (
                                ((e && e instanceof Error) ||
                                    (e = new Error(e ?? "Unknown Error")),
                                w)
                            )
                                return w(e);
                            throw e;
                    }
                }),
        };
    }
    t.entries({
        GM: t.freeze(w),
        GM_info: t.freeze(s),
        GM_getValue: a,
        GM_setValue: l,
        GM_deleteValue: u,
        GM_listValues: c,
        GM_addStyle: d,
        GM_notification: p,
        GM_setClipboard: f,
        GM_xmlhttpRequest: function (e) {
            const { abortController: t } = y(e);
            if (!e || "object" != typeof e)
                throw new TypeError(
                    "Invalid details passed to GM_xmlHttpRequest"
                );
            return { abort: () => t.abort() };
        },
        unsafeWindow: e,
    }).forEach(([o, r]) => {
        t.defineProperty(e, o, {
            value: r,
            writable: !1,
            enumerable: !0,
            configurable: !1,
        });
    });
})(window, Object, DOMException, AbortController, Promise, localStorage);

(function() {
    'use strict';

    const STORAGE_API_KEY = 'raceConfigAPIKey_release_NoGMf'; //Different storage key for NoGMf version to avoid conflicts
    const QUICK_PRESET_BUTTONS_CONTAINER_ID = 'quickPresetButtonsContainer'; // ID for the container div

    // Track data
    const tracks = {
        "6": "Uptown", "7": "Withdrawal", "8": "Underdog",
        "9": "Parkland", "10": "Docks", "11": "Commerce",
        "12": "Two Islands", "15": "Industrial", "16": "Vector",
        "17": "Mudpit", "18": "Hammerhead", "19": "Sewage",
        "20": "Meltdown", "21": "Speedway", "23": "Stone Park",
        "24": "Convict"
    };

    let carNameCache = {}; // Cache for car names


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

                        <div class="driver-input-container"> <label for="laps">Laps:</label>
                        <input type="number" id="laps" value="100"></div>

                        <div class="driver-input-container"><label for="minDrivers">Min Drivers:</label>
                        <input type="number" id="minDrivers" value="2"></div>

                        <div class="driver-input-container"><label for="maxDrivers">Max Drivers:</label>
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
                        <button id="clearPresetsButton" class="gui-button">Clear Presets</button>  </div>
                </div>

                <div style="margin-top: 15px; padding-top: 10px; text-align: center;">
                    <button id="createRaceButton" class="gui-button" style="width: 90%; max-width: 250px; padding: 10px 15px; font-size: 1.1em;">Create Race</button>
                </div>


                <button id="closeGUIButton" class="close-button">[X]</button>
                <span style="font-size: 0.8em; color: #999; position: absolute; bottom: 5px; right: 5px;">Script created by <a href="https://www.torn.com/profiles.php?XID=268863" target="_blank" style="color: #999; text-decoration: underline;">GNSC4 [268863]</a> - v2.98ai PDA NoGMf</span>
            </div>
        `;
        $('body').append(guiHTML);

        loadSavedApiKey();
        loadPresets();
        setupEventListeners();
        ensureQuickPresetButtonsContainer(); // Ensure the container exists on GUI creation
        loadQuickRaceButtons(); // Load and create quick race buttons on GUI creation
    }


    // --- Preset Functions ---
    function loadPresets() {
        const presets = GM_getValue('racePresets', {});
        const presetButtonsDiv = $('#presetButtons');
        presetButtonsDiv.empty();

        loadCars().then(() => { // loadCars() now returns a Promise
            $.each(presets, function(presetName, presetConfig) {
                presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
            });
        }).catch(error => {
            console.error("Error loading cars before presets:", error);
            presetButtonsDiv.html("Error loading presets - car data failed to load."); // Indicate error in GUI
        });
    }


    // --- Car Data Fetching - NOW RETURNS A PROMISE ---
    function loadCars() {
        return new Promise((resolve, reject) => { // Return a Promise
            const apiKey = GM_getValue(STORAGE_API_KEY);
            const carSelect = $('#carID');

            if (!apiKey) {
                carSelect.html('<option value="">Enter API Key First</option>');
                reject("No API Key"); // Reject promise if no API key
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
                        reject(`API Error: ${data.error.error}`); // Reject promise on API error
                    } else {
                        carSelect.empty();
                        const cars = data.enlistedcars || {};
                        if (Object.keys(cars).length === 0) {
                            carSelect.html('<option value="">No cars enlisted</option>');
                        } else {
                            $.each(cars, function(carId, carDetails) {
                                const carDisplayName = carDetails.name || carDetails.item_name;
                                const carRealID = carDetails.id;
                                carNameCache[carRealID] = carDisplayName; // Store car name in cache
                                carSelect.append(`<option value="${carRealID}">${carDisplayName} (ID: ${carRealID})</option>`);
                            });
                        }
                        resolve(); // Resolve promise on success - car data loaded and cache populated
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("AJAX error:", textStatus, errorThrown);
                    carSelect.html('<option value="">Error loading cars</option>');
                    reject(`AJAX error: ${textStatus} ${errorThrown}`); // Reject promise on AJAX error
                }
            });
        });
    }


    // --- Ensure Quick Preset Buttons Container Exists ---
    function ensureQuickPresetButtonsContainer() {
        if (!$('#' + QUICK_PRESET_BUTTONS_CONTAINER_ID).length) {
            const container = $('<div id="' + QUICK_PRESET_BUTTONS_CONTAINER_ID + '" style="margin-top: 10px; text-align: left;"></div>');
            $('#toggleRaceGUIButton').after(container); // Insert after the toggle button
        }
    }


    // --- Load and Save API Key ---
    function loadSavedApiKey() {
        let apiKey = GM_getValue(STORAGE_API_KEY, '');
        $('#raceConfigApiKey').val(apiKey);
    }

    function saveApiKey() {
        let apiKeyToSave = $('#raceConfigApiKey').val().trim();
        GM_setValue(STORAGE_API_KEY, apiKeyToSave);
        alert('API Key Saved (It is stored locally in your browser storage).');
        setTimeout(loadCars, 50);
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



    function savePreset() {
        const presetName = prompt("Enter a name for this preset:");
        if (!presetName) return;

        const presets = GM_getValue('racePresets', {});
        presets[presetName] = getCurrentConfig();
        GM_setValue('racePresets', presets);
        loadPresets(); // Reload presets to update the display with new preset
        createQuickRaceButton(presetName, getCurrentConfig()); // Create quick race button on preset save
    }

    function removePreset(presetName, buttonElement) {
        if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            const presets = GM_getValue('racePresets', {});
            delete presets[presetName];
            GM_setValue('racePresets', presets);
            $(buttonElement).closest('.preset-button-container').remove();
            removeQuickRaceButton(presetName); // Remove quick race button on preset delete
        }
    }

    function clearPresets() {
        if (confirm("Are you sure you want to delete ALL saved presets? This action cannot be undone.")) {
            GM_deleteValue('racePresets');
            loadPresets(); // Reload presets (should be empty now)
            alert("All presets cleared.");
            removeAllQuickRaceButtons(); // Remove all quick race buttons on clear presets
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
        const container = $('<div class="preset-button-container" style="display: inline-block; margin-right: 5px; margin-bottom: 20px; text-align: center; position: relative;"></div>'); // Added position: relative; to container

        const trackName = tracks[presetConfig.trackID] || "Unknown Track";
        const carName = carNameCache[presetConfig.carID] || "Unknown Car"; // Get car name from cache

        // --- Button now includes ALL preset info as multi-line text ---
        const buttonText = `${presetName}<br>Track: ${trackName}<br>Laps: ${presetConfig.laps}<br>Car: ${carName}`;
        const button = $(`<button class="preset-button gui-button" style="width: 100%; display: block; margin-bottom: 5px; text-align: left; padding: 10px; line-height: 1.2em;">${buttonText}</button>`); // Added line-height and padding, removed fixed text-align:center; to allow left align for multi-line text

        const removeButton = $(`<button class="remove-preset">x</button>`);


        button.on('click', function() {
            applyPreset(presetConfig);
        });
        removeButton.on('click', function() {
            removePreset(presetName, removeButton);
        });

        container.append(button);
        // --- NO DESCRIPTION APPENDED ANYMORE ---
        container.append(removeButton); // Keep remove button

        return container;
    }


    // --- Quick Race Buttons Functions ---
    function createQuickRaceButton(presetName, presetConfig) {
        const buttonId = `quickRaceButton-${presetName.replace(/\s+/g, '_')}`; // Create button ID from preset name
        if ($('#' + buttonId).length) {
            return; // Button already exists, prevent duplicates (e.g., on script reload)
        }

        const quickRaceButton = $(`<button id="${buttonId}" class="quick-race-button gui-button">${presetName}</button>`); // Swapped class order, but should not matter
        quickRaceButton.on('click', function() {
            createRaceFromPreset(presetConfig);
        });
        $('#' + QUICK_PRESET_BUTTONS_CONTAINER_ID).append(quickRaceButton);
    }

    function loadQuickRaceButtons() {
        ensureQuickPresetButtonsContainer(); // Ensure container exists before loading buttons
        const presets = GM_getValue('racePresets', {});
        $.each(presets, function(presetName, presetConfig) {
            createQuickRaceButton(presetName, presetConfig);
        });
    }

    function removeQuickRaceButton(presetName) {
        const buttonId = `quickRaceButton-${presetName.replace(/\s+/g, '_')}`;
        $('#' + buttonId).remove();
    }

    function removeAllQuickRaceButtons() {
        $('#' + QUICK_PRESET_BUTTONS_CONTAINER_ID).empty(); // Empty the container to remove all buttons
    }


    // --- Race Creation from Preset ---
    function createRaceFromPreset(presetConfig) {
        const carID = presetConfig.carID;
        const trackID = presetConfig.trackID;
        const laps = presetConfig.laps;
        const raceName = presetConfig.raceName || `${tracks[trackID]} Race`;
        const minDrivers = presetConfig.minDrivers;
        const maxDrivers = presetConfig.maxDrivers;
        const racePassword = presetConfig.racePassword;
        const betAmount = presetConfig.betAmount;
        let raceStartTimeInputValue = presetConfig.raceStartTime; //Keep saved start time if any

        if (!carID || !trackID || !laps || !minDrivers || !maxDrivers) {
            alert("Preset is incomplete. Please check all race details in the GUI.");
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
                // NO GUI UPDATE HERE as this is background process - $('#raceStartTime').val(raceStartTimeInputValue);
                alert("Start time adjusted to the next 15-minute mark (TCT)."); // Inform user, but don't change GUI field
            }


            waitTimeValue = Math.floor(startTimeDate.getTime() / 1000);

            if (isNaN(waitTimeValue)) {
                alert("Invalid Start Time in Preset. Using current time instead.");
                waitTimeValue = Math.floor(Date.now()/1000);
            }
        }
        raceURL += `&waitTime=${waitTimeValue}&rfcv=${rfcValue}`;

        if (betAmount && parseInt(betAmount) > 0) { // Only add betAmount parameter if it's greater than 0 and not empty
            raceURL = raceURL.replace("&betAmount=0", `&betAmount=${parseInt(betAmount)}`); //Replace default 0 with user bet amount
        }


        window.location = raceURL;
        console.log("Initiating race creation via browser redirect to:", raceURL);
        alert("Race created and URL opened from preset! Check the Torn racing page to confirm and manage your race.");
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
            //raceStartTime: $('#raceStartTime').val(), // <--- COMMENTED OUT TO AVOID SAVING TIME IN PRESETS - Now we want to save time in Presets!
            raceStartTime: $('#raceStartTime').val(), // <--- RE-ENABLED Race Start Time in Presets - v2.98v - to save time in presets
            betAmount: $('#betAmount').val()
        };
    }

    function applyPreset(presetConfig) {
        $('#trackID').val(presetConfig.trackID);
        $('#raceName').val(presetConfig.raceName);
        $('#laps').val(presetConfig.laps);
        $('#carID').val(presetConfig.carID);
        $('#minDrivers').val(presetConfig.minDrivers);
        $('#maxDrivers').val(presetConfig.maxDrivers);
        $('#racePassword').val(presetConfig.racePassword || '');
        $('#raceStartTime').val(presetConfig.raceStartTime || ''); 	// <--- RE-ENABLED Race Start Time in Apply Presets - v2.98v - to apply time from presets
        $('#betAmount').val(presetConfig.betAmount || '0');
    }


    // --- Event Listeners ---
    function setupEventListeners() {
        $('#saveApiKeyCustom').on('click', saveApiKey);
        $('#createRaceButton').on('click', createRace);
        $('#savePresetButton').on('click', savePreset);
        $('#clearPresetsButton').on('click', clearPresets);
        $('#closeGUIButton').on('click', function() { $('#raceConfigGUI').hide(); });
        $('#presetButtons').on('click', '.remove-preset', function() {
            const presetName = $(this).prev('.preset-button').text();
            removePreset(presetName, this);
        });
    }


    // --- Initialization ---
    $(document).ready(function() {
        // --- Inject CSS Styles IMMEDIATELY in $(document).ready - Version 2.98ai ---
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
                max-width: 450px; /* <<---  NEW:  Locked GUI Width to max 450px - v2.98ah */
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
            #raceConfigGUI input[type="datetime-local"],
            #raceConfigGUI select {
                padding: 8px;
                margin-bottom: 8px;
                border: 1px solid #777;
                background-color: #333;
                color: #eee !important;
                border-radius: 5px;
                width: calc(100% - 22px);
            }

            #raceConfigGUI input:focus,
            #raceConfigGUI select:focus {
                border-color: #aaa;
                box-shadow: 0 0 5px rgba(170, 170, 170, 0.5);
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
                border-top: 1px solid #eee;
                padding-top: 10px;
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
            #raceConfigGUI #closeGUIButton:hover {
                background-color: #777 !important;
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
            #raceConfigGUI .config-params-section > div {
                margin-bottom: 7px; /* Adjusted tighter div spacing */
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


            /* --- Quick Preset Buttons Container Style --- v2.98ah --- */
            #quickPresetButtonsContainer {
                margin-top: 15px; /* Space above the buttons */
                text-align: left; /* Align buttons to the left */
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
                    width: 95%;
                    max-height: 90%;
                    overflow-y: auto;
                    padding: 15px;
                    margin: 2.5%;
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
        // --- CSS Injection DONE ---


        if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
            // Simplified inline styles - relying on CSS class for most styling now
            const toggleButton = $(`<button id="toggleRaceGUIButton" class="gui-button" style="text-decoration: none; margin-right: 10px;">Race Config GUI (v2.98ai PDA NoGMf)</button>`); // v2.98 Version Bump - Corrected to v2.98ai PDA NoGMf in button

            $('div.content-title > h4').append(toggleButton);

            toggleButton.on('click', function() {
                if ($('#raceConfigGUI').is(':visible')) {
                    $('#raceConfigGUI').hide();
                } else {
                    createGUI();
                    $('#raceConfigGUI').show();
                }
            });
            ensureQuickPresetButtonsContainer(); // Ensure container is created when toggle button is created on page load
            loadQuickRaceButtons(); // Load quick race buttons on page load after toggle is created

        }
        // Descriptive text is now removed
    });

})();