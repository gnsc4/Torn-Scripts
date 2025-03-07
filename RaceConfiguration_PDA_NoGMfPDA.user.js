// ==UserScript==
// @name         Torn Race Config GUI - PDA & Desktop - v2.71 - Full GUI - User Enlisted Cars - Official API
// @namespace    torn.raceconfiggui.pdadesktop
// @description  Full Feature Race Config GUI - v2.71 - User Enlisted Cars Endpoint - Official API Domain - FINAL - CORRECTED TYPEERROR SYNTAX
// @version      2.71
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_Desktop_GMfPDA_DirectAssign.user.js  // <-- IMPORTANT: Use REAL URL
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_Desktop_GMfPDA_DirectAssign.user.js // <-- IMPORTANT: Use REAL URL
// @author       GNSC4 [268863] (Based on Shlefter's script)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @license      MIT
// ==/UserScript==

'use strict';

// --- **GMforPDA Inlined Code (Version 2.2) - EARLY INITIALIZATION - WRAPPED IN IIFE** ---
(function() {

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
                confirm(`${title ?? "No title specified"}\n${text}`) && o?.(), r?.();
            }
        }
        function f(e) {
            if (!e) throw new TypeError("No text supplied to GM_setClipboard"); // <--- CORRECTED: throw new TypeError
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
            GM_xmlHttpRequest: function (e) {
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

// --- **END Inlined GMforPDA Code** ---


'use strict';

const STORAGE_API_KEY = 'torn.raceconfiggui.pdadesktop_raceConfigAPIKey_release';
const PRESET_STORAGE_KEY = 'torn.raceconfiggui.pdadesktop_racePresets_v2_71'; // <--- UNIQUE PRESET STORAGE KEY (v2.71)
const TORN_API_BASE_URL = 'https://api.torn.com/';
const FAST_API_VEHICLE_ID_URL = 'api.torn.com/torn/vehicleids'; // <-- Corrected domain, but endpoint might not exist - for reference only
const VEHICLE_ID_CACHE_KEY = 'torn.raceconfiggui.pdadesktop_vehicleIdCache';
const VEHICLE_ID_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// --- Global Styles ---
const style = document.createElement('style');
style.textContent = `
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


    #raceConfigGUI button,
    #raceConfigGUI #toggleRaceGUIButton,
    #raceConfigGUI .preset-button,
    #raceConfigGUI .remove-preset,
    #raceConfigGUI .gui-button,
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
    }


    #raceConfigGUI button:hover,
    #raceConfigGUI #toggleRaceGUIButton:hover,
    #raceConfigGUI .preset-button:hover,
    #raceConfigGUI .remove-preset:hover,
    #raceConfigGUI .gui-button:hover,
    #raceConfigGUI .close-button:hover {
        background-color: #888; /* Button hover background */
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
    }

    #raceConfigGUI .car-select-section label {
        margin-bottom: 10px; /* More space below car select label */
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


// --- Debounce Function (Standard Implementation) ---
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
}


// --- GUI Creation ---
function createGUI() {
    if ($('#raceConfigGUI').length) {
        return;
    }

    const guiHTML = `
        <div id="raceConfigGUI">
            <button id="closeGUIButton" class="close-button">[X]</button>
            <h2>Torn Race Config GUI</h2>
            <h3>Version 2.71 - User Enlisted Cars - Official API</h3>

            <div class="api-key-section config-section">
                <h4>API Key Configuration</h4>
                <label for="raceConfigApiKey">Torn API Key:</label>
                <input type="text" id="raceConfigApiKey" placeholder="Enter your Torn API Key">
                <button id="saveApiKeyCustom" class="gui-button">Save API Key</button>
                <div id="statusMessageBox" style="display: none;"></div>
            </div>


            <div class="car-select-section config-section">
                <h4>Car Selection</h4>
                <label for="carSelect">Select Car:</label>
                <select id="carSelect">
                    <option value="">Loading Cars...</option>
                </select>
            </div>


            <div class="config-params-section config-section">
                <h4>Configuration Parameters</h4>
                <div><label for="topSpeed">Top Speed:</label><input type="text" id="topSpeed" value="100"></div>
                <div><label for="acceleration">Acceleration:</label><input type="text" id="acceleration" value="100"></div>
                <div><label for="braking">Braking:</label><input type="text" id="braking" value="100"></div>
                <div><label for="handling">Handling:</label><input type="text" id="handling" value="100"></div>
                <div><label for="dirt">Dirt Multiplier:</label><input type="text" id="dirt" value="1.00"></div>
                <div><label for="tarmac">Tarmac Multiplier:</label><input type="text" id="tarmac" value="1.00"></div>
                <div><label for="safety">Safety:</label><input type="text" id="safety" value="100"></div>
            </div>


            <div class="presets-section config-section">
                <h4>Preset Management</h4>
                <div class="preset-buttons-container" id="presetButtons">
                    </div>
                <div class="preset-management-section">
                    <button id="savePresetButton" class="gui-button">Save Preset</button>
                    <button id="clearPresetsButton" class="gui-button">Clear All Presets</button>
                </div>
            </div>


            <div style="text-align: center; margin-top: 15px; font-size: 0.8em; color: #888;">
                Version 2.71 - User Enlisted Cars - Official API<br>
                Based on Shlefter's Script | By GNSC4 [268863]
            </div>
        </div>
    `;
    $('body').append(guiHTML);

    loadSavedApiKey();
    loadCars();
    loadPresets();
    setupEventListeners();
}


// --- API Key Handling ---
function loadSavedApiKey() {
    const apiKey = GM_getValue(STORAGE_API_KEY, '');
    $('#raceConfigApiKey').val(apiKey);
}

function saveApiKey() {
    const apiKey = $('#raceConfigApiKey').val().trim();
    GM_setValue(STORAGE_API_KEY, apiKey);
    $('#statusMessageBox').text('API Key Saved. Loading car list...').removeClass('error').addClass('success').show();
    loadCars(); // Load cars immediately after saving API key
    setTimeout(() => $('#statusMessageBox').fadeOut(), 3000); // Fade out message after 3 seconds
}


// --- Car Loading and Caching ---
async function loadCars() {
    const apiKey = GM_getValue(STORAGE_API_KEY);
    if (!apiKey) {
        $('#statusMessageBox').text('API Key Required. Please enter and save your API key.').addClass('error').removeClass('success').show();
        setTimeout(() => $('#statusMessageBox').fadeOut(), 5000);
        return;
    }

    const cachedVehicleIds = await GM_getValue(VEHICLE_ID_CACHE_KEY, null);
    const lastCacheTime = await GM_getValue(VEHICLE_ID_CACHE_KEY + '_timestamp', 0);
    const now = Date.now();

    if (cachedVehicleIds && (now - lastCacheTime < VEHICLE_ID_CACHE_EXPIRY)) {
        console.log('Using cached vehicle IDs.');
        populateCarDropdown(cachedVehicleIds);
        return;
    }

    console.log('Fetching vehicle IDs from API using /user/enlistedcars (official api.torn.com)...'); // <--- Updated log message - Official API
    $('#carSelect').html('<option value="">Loading Cars...</option>'); // Reset dropdown

    try {
        const vehicleData = await fetchVehicleDataFromAPI(apiKey); // <--- fetchVehicleDataFromAPI now returns car data, not just IDs
        if (vehicleData && vehicleData.length > 0) {
            const vehicleIds = vehicleData.map(car => car.ID); // Extract IDs from vehicle data
            await GM_setValue(VEHICLE_ID_CACHE_KEY, vehicleIds);
            await GM_setValue(VEHICLE_ID_CACHE_KEY + '_timestamp', now);
            console.log('Vehicle IDs fetched and cached (from /user/enlistedcars - official api.torn.com).'); // <--- Updated log message - Official API
            populateCarDropdown(vehicleIds, vehicleData); // <--- Pass vehicleData to populateCarDropdown
            $('#statusMessageBox').text('Car list updated (from Enlisted Cars - official api.torn.com).').removeClass('error').addClass('success').show(); // <--- Updated status message - Official API
            setTimeout(() => $('#statusMessageBox').fadeOut(), 3000);
        } else {
            $('#statusMessageBox').text('Error loading car list from API (/user/enlistedcars - No cars received or API error - official api.torn.com).').addClass('error').removeClass('success').show(); // <--- Updated error message - Official API
            setTimeout(() => $('#statusMessageBox').fadeOut(), 5000);
            $('#carSelect').html('<option value="">Error Loading Cars</option>');
        }
    } catch (error) {
        console.error('Error loading vehicle IDs from /user/enlistedcars (official api.torn.com):', error); // <--- Updated error log - Official API
        $('#statusMessageBox').text('Error loading car list. Check console for details.').addClass('error').removeClass('success').show();
        setTimeout(() => $('#statusMessageBox').fadeOut(), 5000);
        $('#carSelect').html('<option value="">Error Loading Cars</option>');
    }
}


// --- Modified fetchVehicleDataFromAPI to use /user/enlistedcars and return car data ---
async function fetchVehicleDataFromAPI(apiKey) { // <--- Renamed and now fetches /user/enlistedcars
    try {
        const apiURL_withKey = `https://api.torn.com/v2/user/?selections=enlistedcars&key=${apiKey}`; // <--- Using /user/enlistedcars endpoint - Official API Domain
        const response = await GM.xmlHttpRequest({
            url: apiURL_withKey,
            method: 'GET',
            timeout: 15000 // 15 seconds timeout
        });

        if (response.status === 200) {
            const userData = JSON.parse(response.responseText);
            const enlistedCars = userData.enlistedcars || []; // Extract enlisted cars array
            return enlistedCars; // Return the array of enlisted cars
        } else {
            console.error('Error fetching user data (/user/enlistedcars - official api.torn.com). API Status:', response.status); // <--- Updated error log - Official API
            return null;
        }
    } catch (error) {
        console.error('Error fetching user data (/user/enlistedcars - official api.torn.com):', error); // <--- Updated error log - Official API
        return null;
    }
}


// --- Modified populateCarDropdown to handle car data ---
function populateCarDropdown(vehicleIds, vehicleData) { // <--- vehicleData is now passed
    const carSelect = $('#carSelect');
    carSelect.empty(); // Clear existing options
    carSelect.append('<option value="">Select a car</option>'); // Default option

    vehicleIds.sort().forEach(vehicleId => {
        // Find car data for this ID in vehicleData (if available)
        const carInfo = vehicleData ? vehicleData.find(car => car.ID === vehicleId) : null;
        const vehicleName = carInfo ? carInfo.name : getVehicleNameFromID(vehicleId); // Use name from API if available, else fallback
        if (vehicleName) {
            carSelect.append(`<option value="${vehicleId}">${vehicleName} (ID: ${vehicleId})</option>`);
        } else {
            carSelect.append(`<option value="${vehicleId}">Vehicle ID: ${vehicleId} (Name N/A)</option>`); // Fallback if name not found
        }
    });
}


function getVehicleNameFromID(vehicleId) {
    const vehicleNames = {
        "2": "Veloria", "3": "Magnum", "4": "Deimos", "5": "Nemesis", "6": "Centurion", "7": "Paladin", "8": "Dominator", "9": "Overlord", "10": "Tyrant", "11": "Inferno", "12": "Apocalypse", "13": "Armageddon", "14": "Behemoth", "15": "Colossus", "16": "Titan", "17": "Vanquisher", "18": "Conqueror", "19": "Obliterator", "20": "Annihilator", "21": "Desolator", "22": "Eradicator", "23": "Terminator", "24": "Exterminator", "25": "Devastator", "26": "Eliminator", "27": "Marauder", "28": "Outlaw", "29": "Raider", "30": "Renegade", "31": "Avenger", "32": "Challenger", "33": "Defender", "34": "Enforcer", "35": "Vindicator", "36": "Crusader", "37": "Liberator", "38": "Redeemer", "39": "Oppressor", "40": "Punisher", "41": "Slayer", "42": "Destroyer", "43": "Executioner", "44": "Judicator", "45": "Persecutor", "46": "Tormentor", "47": "Vandal", "48": "Barbarian", "49": "Berserker", "50": "Warlord",
        "51": "Interceptor", "52": "Pursuit", "53": "Vigilante", "54": "Wrangler", "55": "Cavalier", "56": "Gallant", "57": "Valiant", "58": "Paladin LFA", "59": "Dominator LFA", "60": "Overlord LFA", "61": "Tyrant LFA", "62": "Inferno LFA", "63": "Apocalypse LFA", "64": "Armageddon LFA", "65": "Behemoth LFA", "66": "Colossus LFA", "67": "Titan LFA", "68": "Vanquisher LFA", "69": "Conqueror LFA", "70": "Obliterator LFA", "71": "Annihilator LFA", "72": "Desolator LFA", "73": "Eradicator LFA", "74": "Terminator LFA", "75": "Exterminator LFA", "76": "Devastator LFA", "77": "Eliminator LFA", "78": "Marauder LFA", "79": "Outlaw LFA", "80": "Raider LFA", "81": "Renegade LFA", "82": "Avenger LFA", "83": "Challenger LFA", "84": "Defender LFA", "85": "Enforcer LFA", "86": "Vindicator LFA", "87": "Crusader LFA", "88": "Liberator LFA", "89": "Redeemer LFA", "90": "Oppressor LFA", "91": "Punisher LFA", "92": "Slayer LFA", "93": "Destroyer LFA", "94": "Executioner LFA", "95": "Judicator LFA", "96": "Persecutor LFA", "97": "Tormentor", "98": "Vandal", "99": "Barbarian", "100": "Berserker",
        "101": "Warlord LFA", "102": "Interceptor LFA", "103": "Pursuit LFA", "104": "Vigilante LFA", "105": "Wrangler LFA", "106": "Cavalier LFA", "107": "Gallant LFA", "108": "Valiant LFA", "109": "Veloria LFA", "110": "Magnum LFA", "111": "Deimos LFA", "112": "Nemesis LFA", "113": "Centurion LFA", "114": "Paladin SE", "115": "Dominator SE", "116": "Overlord SE", "117": "Tyrant SE", "118": "Inferno SE", "119": "Apocalypse SE", "120": "Armageddon SE", "121": "Behemoth SE", "122": "Colossus SE", "123": "Titan SE", "124": "Vanquisher SE", "125": "Conqueror SE", "126": "Obliterator SE", "127": "Annihilator SE", "128": "Desolator SE", "129": "Eradicator SE", "130": "Terminator SE", "131": "Exterminator SE", "132": "Devastator SE", "133": "Eliminator SE", "134": "Marauder SE", "135": "Outlaw SE", "136": "Raider SE", "137": "Renegade SE", "138": "Avenger SE", "139": "Challenger SE", "140": "Defender SE", "141": "Enforcer SE", "142": "Vindicator SE", "143": "Crusader SE", "144": "Liberator SE", "145": "Redeemer SE", "146": "Oppressor SE", "147": "Punisher SE", "148": "Slayer SE", "149": "Destroyer SE", "150": "Executioner SE",
        "151": "Judicator SE", "152": "Persecutor SE", "153": "Tormentor SE", "154": "Vandal SE", "155": "Barbarian SE", "156": "Berserker SE", "157": "Warlord SE", "158": "Interceptor SE", "159": "Pursuit SE", "160": "Vigilante SE", "161": "Wrangler SE", "162": "Cavalier SE", "163": "Gallant SE", "164": "Valiant SE", "165": "Monster Truck", "166": "Hearse", "167": "Ice Cream Truck", "168": "Taxi", "169": "Box Truck", "170": "Bus",	"171": "Garbage Truck", "172": "Cement Truck", "173": "Firetruck", "174": "Limousine", "175": "Duke", "176": "Count", "177": "Princess", "178": "Queen", "179": "King", "180": "Emperor"
    };
    return vehicleNames[vehicleId] || null; // Return name or null if not found
}



// --- Preset Functions ---
function loadPresets() {
    console.log("loadPresets() - START (v2.71)"); // DEBUG CONSOLE LOG - START
    let presets = {};
    presets = GM_getValue(PRESET_STORAGE_KEY, {});
    console.log("loadPresets() - After GM_getValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT
    const presetButtonsDiv = $('#presetButtons');
    presetButtonsDiv.empty();

    $.each(presets, function(presetName, presetConfig) {
        console.log("loadPresets() - Inside loop, presetName: " + presetName); // DEBUG CONSOLE LOG - LOOP ITERATION
        presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
    });
    console.log("loadPresets() - END (v2.71)"); // DEBUG CONSOLE LOG - END
}


function savePreset_Internal() { // <-- **Internal, non-debounced savePreset function**
    console.log("savePreset_Internal() - START (v2.71)"); // DEBUG CONSOLE LOG - START

    const presetName = prompt("Enter a name for this preset:");
    if (!presetName) {
        console.log("savePreset_Internal() - No preset name, cancelled (v2.71)"); // DEBUG CONSOLE LOG - CANCELLED
        return;
    }

    const presets = GM_getValue(PRESET_STORAGE_KEY, {});
    console.log("savePreset_Internal() - Before save, current presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT BEFORE SAVE

    const selectedCarId = $('#carSelect').val();
    const selectedCarName = $("#carSelect option:selected").text();
    const presetConfig = {
        name: presetName,
        carId: selectedCarId,
        carName: selectedCarName, // Save car name as well for display
        topSpeed: $('#topSpeed').val(),
        acceleration: $('#acceleration').val(),
        braking: $('#braking').val(),
        handling: $('#handling').val(),
        dirt: $('#dirt').val(),
        tarmac: $('#tarmac').val(),
        safety: $('#safety').val()
    };


    presets[presetName] = presetConfig;
    GM_setValue(PRESET_STORAGE_KEY, presets);
    console.log("savePreset_Internal() - After GM_setValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT AFTER SAVE
    loadPresets(); // Update preset buttons after saving
    console.log("savePreset_Internal() - END (v2.71)"); // DEBUG CONSOLE LOG - END
}

// --- Debounced savePreset function ---
const savePreset = debounce(savePreset_Internal, 1000); // <--- **DEBOUNCED savePreset - 1000ms delay**


function applyPreset(presetConfig) {
    console.log("applyPreset() - Applying preset: " + presetConfig.name + " (v2.71)"); // DEBUG CONSOLE LOG - APPLY START

    $('#carSelect').val(presetConfig.carId);
    $('#topSpeed').val(presetConfig.topSpeed);
    $('#acceleration').val(presetConfig.acceleration);
    $('#braking').val(presetConfig.braking);
    $('#handling').val(presetConfig.handling);
    $('#dirt').val(presetConfig.dirt);
    $('#tarmac').val(presetConfig.tarmac);
    $('#safety').val(presetConfig.safety);

    console.log("applyPreset() - Preset applied: " + presetConfig.name + " (v2.71)"); // DEBUG CONSOLE LOG - APPLY END
    $('#statusMessageBox').text(`Preset "${presetConfig.name}" applied.`).removeClass('error').addClass('success').show();
    setTimeout(() => $('#statusMessageBox').fadeOut(), 3000);
}


function removePreset(presetName, buttonElement) {
    console.log("removePreset() - START, presetName: " + presetName + " (v2.71)"); // DEBUG CONSOLE LOG - REMOVE START
    if (confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
        console.log("removePreset() - Confirmed delete: " + presetName + " (v2.71)"); // DEBUG CONSOLE LOG - DELETE CONFIRMED
        const presets = GM_getValue(PRESET_STORAGE_KEY, {});
        delete presets[presetName];
        GM_setValue(PRESET_STORAGE_KEY, presets);
        $(buttonElement).closest('.preset-button-container').remove();
        console.log("removePreset() - Preset removed from GUI: " + presetName + " (v2.71)"); // DEBUG CONSOLE LOG - REMOVE GUI ELEMENT
    } else {
        console.log("removePreset() - Cancelled delete: " + presetName + " (v2.71)"); // DEBUG CONSOLE LOG - DELETE CANCELLED
    }
    console.log("removePreset() - END, presetName: " + presetName + " (v2.71)"); // DEBUG CONSOLE LOG - REMOVE END
}


function clearAllPresets() {
    if (confirm('Are you sure you want to clear ALL saved presets? This action is irreversible.')) {
        GM_deleteValue(PRESET_STORAGE_KEY);
        $('#presetButtons').empty(); // Clear buttons from GUI
        $('#statusMessageBox').text('All presets cleared.').removeClass('error').addClass('success').show();
        setTimeout(() => $('#statusMessageBox').fadeOut(), 3000);
        console.log("clearAllPresets() - All presets cleared (v2.71)"); // DEBUG CONSOLE LOG - CLEAR ALL
    } else {
        console.log("clearAllPresets() - Clear all presets cancelled (v2.71)"); // DEBUG CONSOLE LOG - CLEAR ALL CANCELLED
    }
}



function createPresetButton(presetName, presetConfig) {
    const container = $('<div class="preset-button-container"></div>');
    const button = $(`<button class="preset-button">${presetName}<br><small>Car: ${presetConfig.carName || 'N/A'}</small></button>`); // Display car name in button
    const removeButton = $('<a href="#" class="remove-preset">x</a>');

    button.on('click', function() { applyPreset(presetConfig); });
    removeButton.on('click', function(e) {
        e.preventDefault(); // Prevent default link behavior
        removePreset(presetName, removeButton);
    });

    container.append(button);
    container.append(removeButton);
    return container;
}


// --- Event Listener Setup ---
function setupEventListeners() {
    $('#saveApiKeyCustom').on('click', saveApiKey);
    $('#savePresetButton').on('click', savePreset); // Save Preset - DEBOUNCED in v2.71
    $('#clearPresetsButton').on('click', clearAllPresets);
    $('#closeGUIButton').on('click', function() { $('#raceConfigGUI').hide(); });
    $('#presetButtons').on('click', '.remove-preset', function(event) {
        event.preventDefault(); // Prevent any default action
        const presetName = $(this).prev('.preset-button').text().split('<br>')[0]; // Extract preset name (before <br>)
        removePreset(presetName, this); // 'this' is the remove button element
    });
}


// --- Initialization ---
$(document).ready(function() {
    if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
        const toggleButton = $(`<button id="toggleRaceGUIButton">Race Config GUI (v2.71)</button>`);
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
    $('div.content-title > h4').append('<span style="color: orange; margin-left: 10px;">v2.71 - USER ENLISTED CARS & OFFICIAL API - FINAL</span>'); // Orange - Final Label
});

})();