// ==UserScript==
// @name         Torn Race Config GUI - PDA & Desktop (GMfPDA Direct Assign) - v2.55
// @namespace    torn.raceconfiggui.pdadesktop
// @description  GUI to configure Torn racing, schedule races, set passwords, presets. Works on PDA & Desktop with GMforPDA (Direct Assign) - v2.55 with namespaced storage keys
// @version      2.55-PDA-Desktop-GMfPDA-DirectAssign
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_Desktop_GMfPDA_DirectAssign.user.js  // <-- IMPORTANT: Use REAL URL
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_Desktop_GMfPDA_DirectAssign.user.js // <-- IMPORTANT: Use REAL URL
// @author       GNSC4 [268863] (Based on Shlefter's script, GMforPDA by Kwack, Direct Assign Mod for Desktop)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- GMforPDA Inlined Code (Direct Assignment Modified) ---
    ((e, t, o, r, n, i) => {
        if (typeof GM !== 'undefined') {
            return;
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
            window[o] = r; // <--- DIRECT ASSIGNMENT: window[o] = r;
        });
    })(window, Object, DOMException, AbortController, Promise, localStorage);
    // --- End GMforPDA Inlined Code ---

    const STORAGE_API_KEY = 'torn.raceconfiggui.pdadesktop_raceConfigAPIKey_release'; // <-- NAMESPACED KEY

    // --- Global Styles ---
    const style = document.createElement('style');
    style.textContent = `
        #tcLogo { pointer-events: none; }
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
            <div style="margin-bottom: 10px;">
                <label for="raceConfigApiKey">API Key:</label>
                <input type="text" id="raceConfigApiKey" placeholder="Enter Torn API Key" style="margin-left: 5px; color: black;">
                <button id="saveApiKeyCustom" class="gui-button" style="margin-left: 5px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Save API Key</button>
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
                <label for="racePassword">Password:</label> <span style="font-size: 0.8em; color: #ccc;"> (optional)</span>
                <input type="text" id="racePassword" placeholder="Race Password Optional" style="margin-left: 5px; color: black;">
            </div>
            <div style="margin-bottom: 10px;">
                <label for="betAmount">Bet Amount:</label> <span style="font-size: 0.8em; color: #ccc;">(Max 10M, Optional for Race)</span>
                <input type="number" id="betAmount" value="0" min="0" max="10000000" style="margin-left: 5px; width: 100px; color: black;">
            </div>
            <div style="margin-bottom: 10px;">
                <label for="raceStartTime">Race Start Time (TCT):</label> <span style="font-size: 0.8em; color: #ccc;">(Optional, 15 min intervals)</span>
                <input type="datetime-local" id="raceStartTime" style="margin-left: 5px; color: black; width: 170px;">
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
                <button id="createRaceButton" class="gui-button" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer;">Create Race</button>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 10px;">
                <h4>Presets</h4>
                <div id="presetButtons">
                    </div>
                <div style="margin-top: 10px;">
                    <button id="savePresetButton" class="gui-button" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer;">Save Preset</button>
                </div>
            </div>
            <button id="closeGUIButton" class="close-button" style="position: absolute; top: 5px; right: 5px; cursor: pointer; color: #ddd; background: #555; border: none; border-radius: 3px;">[X]</button>
            <span style="font-size: 0.8em; color: #999; position: absolute; bottom: 5px; right: 5px;">v2.55</span>    </div>
    `;
    $('body').append(guiHTML);

    loadSavedApiKey();
    loadCars();
    loadPresets();
    setupEventListeners();
    }

    // --- Load and Save API Key ---
    function loadSavedApiKey() {
        // Old: let apiKey = GM_getValue(STORAGE_API_KEY, '');
        // New:
        let apiKey = GM_getValue('torn.raceconfiggui.pdadesktop_raceConfigAPIKey_release', '');
        $('#raceConfigApiKey').val(apiKey);
    }

    function saveApiKey() {
        console.log("saveApiKey() function START");
        let apiKeyToSave = $('#raceConfigApiKey').val().trim();
        console.log("saveApiKey() - API Key to save:", apiKeyToSave);
        GM_setValue('torn.raceconfiggui.pdadesktop_raceConfigAPIKey_release', apiKeyToSave); // <-- NAMESPACED KEY
        alert('API Key Saved (It is stored locally in your browser storage).');
        setTimeout(loadCars, 50);
    }


    // --- Car Data Fetching ---
    function loadCars() {
        // Old: const apiKey = GM_getValue(STORAGE_API_KEY);
        // New:
        const apiKey = GM_getValue('torn.raceconfiggui.pdadesktop_raceConfigAPIKey_release'); // <-- NAMESPACED KEY
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
        console.log("loadPresets() function START");
        const presets = GM_getValue('torn.raceconfiggui.pdadesktop_racePresets', {}); // <-- NAMESPACED KEY
        console.log("loadPresets() - After GM_getValue, presets:", presets);
        const presetButtonsDiv = $('#presetButtons');
        console.log("loadPresets() - Before presetButtonsDiv.empty()");
        presetButtonsDiv.empty();
        console.log("loadPresets() - After presetButtonsDiv.empty()");

        console.log("loadPresets() - Starting $.each loop for presets");
        $.each(presets, function(presetName, presetConfig) {
            console.log("loadPresets() - Inside $.each loop, presetName:", presetName, "presetConfig:", presetConfig);
            presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
            console.log("loadPresets() - After append createPresetButton for:", presetName);
        });
        console.log("loadPresets() - Finished $.each loop for presets");
        console.log("loadPresets() function END");
    }

    function savePreset() {
        console.log("savePreset() function START");
        const presetName = prompt("Enter a name for this preset:");
        console.log("savePreset() - After prompt, presetName:", presetName);
        if (!presetName) {
            console.log("savePreset() - presetName was cancelled or empty, returning");
            return;
        }

        // Old: const presets = GM_getValue('racePresets', {});
        // New:
        const presets = GM_getValue('torn.raceconfiggui.pdadesktop_racePresets', {}); // <-- NAMESPACED KEY
        console.log("savePreset() - After GM_getValue, current presets:", presets);
        const currentConfig = getCurrentConfig();
        console.log("savePreset() - getCurrentConfig:", currentConfig);
        presets[presetName] = currentConfig;
        console.log("savePreset() - Before GM_setValue, updated presets:", presets);
        GM_setValue('torn.raceconfiggui.pdadesktop_racePresets', presets); // <-- NAMESPACED KEY
        console.log("savePreset() - After GM_setValue, presetName:", presetName);
        loadPresets();
        console.log("savePreset() - After loadPresets() call");
        console.log("savePreset() function END");
    }

    function removePreset(presetName, buttonElement) {
        console.log("removePreset() function START, presetName:", presetName);
        if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            console.log("removePreset() - User confirmed deletion of preset:", presetName);
            // Old: const presets = GM_getValue('racePresets', {});
            // New:
            const presets = GM_getValue('torn.raceconfiggui.pdadesktop_racePresets', {}); // <-- NAMESPACED KEY
            console.log("removePreset() - After GM_getValue, current presets:", presets);
            delete presets[presetName];
            console.log("removePreset() - After delete presets[presetName], updated presets:", presets);
            GM_setValue('torn.raceconfiggui.pdadesktop_racePresets', presets); // <-- NAMESPACED KEY
            console.log("removePreset() - After GM_setValue, presetName:", presetName);
            $(buttonElement).closest('.preset-button-container').remove();
            console.log("removePreset() - After remove button from GUI");
        } else {
            console.log("removePreset() - User cancelled deletion of preset:", presetName);
        }
        console.log("removePreset() function END, presetName:", presetName);
    }

    function applyPreset(presetConfig) {
        console.log("applyPreset() function START, presetConfig:", presetConfig);
        console.log("applyPreset() - Setting trackID to:", presetConfig.trackID);
        $('#trackID').val(presetConfig.trackID);
        console.log("applyPreset() - Setting raceName to:", presetConfig.raceName);
        $('#raceName').val(presetConfig.raceName);
        console.log("applyPreset() - Setting laps to:", presetConfig.laps);
        $('#laps').val(presetConfig.laps);
        console.log("applyPreset() - Setting carID to:", presetConfig.carID);
        $('#carID').val(presetConfig.carID);
        console.log("applyPreset() - Setting minDrivers to:", presetConfig.minDrivers);
        $('#minDrivers').val(presetConfig.minDrivers);
        console.log("applyPreset() - Setting maxDrivers to:", presetConfig.maxDrivers);
        $('#maxDrivers').val(presetConfig.maxDrivers);
        console.log("applyPreset() - Setting racePassword to:", presetConfig.racePassword);
        $('#racePassword').val(presetConfig.racePassword || '');
        //$('#raceStartTime').val(presetConfig.raceStartTime || '');  // <--- COMMENTED OUT
        console.log("applyPreset() - Setting betAmount to:", presetConfig.betAmount);
        $('#betAmount').val(presetConfig.betAmount || '0');
        console.log("applyPreset() function END, presetConfig:", presetConfig);
    }

    function createPresetButton(presetName, presetConfig) {
        console.log("createPresetButton() function START, presetName:", presetName, "presetConfig:", presetConfig);
        const container = $('<div class="preset-button-container" style="display: inline-block; margin-right: 5px; margin-bottom: 5px;"></div>');
        const button = $(`<button class="preset-button" style="cursor: pointer; margin-right: 2px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px;">${presetName}</button>`);
        const removeButton = $(`<button class="remove-preset" style="cursor: pointer; font-size: 0.8em; color: #ddd; background: #555; border: none; border-radius: 3px;">x</button>`);

        console.log("createPresetButton() - Attaching click handler to preset button:", presetName);
        button.on('click', function() {
            console.log("Preset button clicked, presetName:", presetName);
            applyPreset(presetConfig);
            console.log("After applyPreset() call from button click, presetName:", presetName);
        });
        console.log("createPresetButton() - Attaching click handler to remove button:", presetName);
        removeButton.on('click', function() {
            console.log("Remove preset button clicked, presetName:", presetName);
            removePreset(presetName, removeButton);
            console.log("After removePreset() call from remove button click, presetName:", presetName);
        });

        container.append(button);
        container.append(removeButton);
        console.log("createPresetButton() function END, presetName:", presetName);
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
        console.log("getCurrentConfig() - START"); // ADDED CONSOLE LOG
        const config = {
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
        console.log("getCurrentConfig() - trackID:", config.trackID); // Log trackID
        console.log("getCurrentConfig() - raceName:", config.raceName); // Log raceName
        console.log("getCurrentConfig() - laps:", config.laps);     // Log laps
        console.log("getCurrentConfig() - carID:", config.carID);     // Log carID
        console.log("getCurrentConfig() - minDrivers:", config.minDrivers); // Log minDrivers
        console.log("getCurrentConfig() - maxDrivers:", config.maxDrivers); // Log maxDrivers
        console.log("getCurrentConfig() - racePassword:", config.racePassword); // Log racePassword
        console.log("getCurrentConfig() - betAmount:", config.betAmount); // Log betAmount
        console.log("getCurrentConfig() - END - Returning config:", config); // Log entire config object
        return config;
    }

    function applyPreset(presetConfig) {
        console.log("applyPreset() function START, presetConfig:", presetConfig); // --- ADD THIS LINE ---
        console.log("applyPreset() - Setting trackID to:", presetConfig.trackID); // --- ADD THIS LINE ---
        $('#trackID').val(presetConfig.trackID);
        console.log("applyPreset() - Setting raceName to:", presetConfig.raceName); // --- ADD THIS LINE ---
        $('#raceName').val(presetConfig.raceName);
        console.log("applyPreset() - Setting laps to:", presetConfig.laps); // --- ADD THIS LINE ---
        $('#laps').val(presetConfig.laps);
        console.log("applyPreset() - Setting carID to:", presetConfig.carID); // --- ADD THIS LINE ---
        $('#carID').val(presetConfig.carID);
        console.log("applyPreset() - Setting minDrivers to:", presetConfig.minDrivers); // --- ADD THIS LINE ---
        $('#minDrivers').val(presetConfig.minDrivers);
        console.log("applyPreset() - Setting maxDrivers to:", presetConfig.maxDrivers); // --- ADD THIS LINE ---
        $('#maxDrivers').val(presetConfig.maxDrivers);
        console.log("applyPreset() - Setting racePassword to:", presetConfig.racePassword); // --- ADD THIS LINE ---
        $('#racePassword').val(presetConfig.racePassword || '');
        //$('#raceStartTime').val(presetConfig.raceStartTime || '');  // <--- COMMENTED OUT
        console.log("applyPreset() - Setting betAmount to:", presetConfig.betAmount); // --- ADD THIS LINE ---
        $('#betAmount').val(presetConfig.betAmount || '0');
        console.log("applyPreset() function END, presetConfig:", presetConfig); // --- ADD THIS LINE ---
    }


    // --- Event Listeners ---
    function setupEventListeners() {
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
        if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
            const toggleButton = $(`<button id="toggleRaceGUIButton" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer; text-decoration: none; margin-right: 10px;">Race Config GUI</button>`); // <--- UPDATED STYLE
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
            $('div.content-title > h4').append('<span style="color: blue; margin-left: 10px;">GMforPDA Direct Assign + Headers</span>'); //  Desktop Test Message - Blue
        if (typeof GM_getValue !== 'undefined') {
            $('div.content-title > h4').append('<span style="color: green; margin-left: 10px;">GM_getValue is Defined!</span>'); // Green if defined
        } else {
            $('div.content-title > h4').append('<span style="color: red; margin-left: 10px;">GM_getValue is UNDEFINED!</span>'); // Red if UNDEFINED
        }
    });

})();