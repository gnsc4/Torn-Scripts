// ==UserScript==
// @name         Torn Race Config GUI - PDA & Desktop - v2.93 - Full GUI - User Enlisted Cars - Official API - DATA OPTIMIZATION - PARAMETER CONFIRMATION - ERROR & SYNTAX FIX - GUI Cleanup - RESTORED RACE BUTTON - RACE CREATION LOGIC - VEHICLE ID FALLBACK REMOVED - UNNEEDED COMMENT TAGS REMOVED - OLD CODE COMMENTS REMOVED - GUI CONCISE - GUI REFINEMENTS - **GUI BUTTON FIX**
// @namespace    torn.raceconfiggui.pdadesktop
// @description  Full Feature Race Config GUI - v2.93 - User Enlisted Cars Endpoint - Official API Domain - ROBUST CACHED DATA + "UPDATE CARS" BUTTON - DATA OPTIMIZATION (item_name, id only) - PARAMETER CONFIRMATION (Race Creation Params) - ERROR & SYNTAX FIX - GUI Cleanup - RESTORED RACE BUTTON - RACE CREATION LOGIC - VEHICLE ID FALLBACK REMOVED - UNNEEDED COMMENT TAGS REMOVED - OLD CODE COMMENTS REMOVED - GUI CONCISE - GUI REFINEMENTS - **GUI BUTTON FIX**
// @version      2.93-PDA-Desktop-GMfPDA-FullGUI-UserEnlistedCars-OfficialAPI-ROBUST-CACHED-DATA-UPDATE-CARS-BUTTON-DATA-OPTIMIZED-PARAM-CONFIRM-ERROR-SYNTAX-GUI-CLEANUP-RACE-BUTTON-RACECREATION-NO-VEHICLE-ID-FALLBACK-NO-HTML-COMMENTS-NO-OLD-CODE-COMMENTS-GUI-CONCISE-GUI-REFINEMENTS-GUI-BUTTON-FIX
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/RaceConfiguration_PDA_NoGMfPDA.user.js
// @author       GNSC4 [268863] (Based on Shlefter's script)
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlHttpRequest
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js // <-- ADDED jQuery Cookie REQUIRE
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
            if (!e) throw new TypeError("No key supplied to GM_deleteValue"); // <-- **CORRECTED - `throw new TypeError`**
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
const PRESET_STORAGE_KEY = 'torn.raceconfiggui.pdadesktop_racePresets_v2_93'; // <--- UNIQUE PRESET STORAGE KEY (v2.93) - PARAMETER CONFIRMATION
const TORN_API_BASE_URL = 'https://api.torn.com/';
const FAST_API_VEHICLE_ID_URL = 'api.torn.com/torn/vehicleids'; // <-- Corrected domain, but endpoint might not exist - for reference only
const VEHICLE_ID_CACHE_KEY = 'torn.raceconfiggui.pdadesktop_vehicleIdCache'; // <-- Now Caching OPTIMIZED CAR DATA (item_name, id only)
const VEHICLE_ID_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

    // Track data  <--- **TRACKS OBJECT DECLARATION - ADDED in v2.78**
    const tracks = {
        "6": "Uptown", "7": "Withdrawal", "8": "Underdog",
        "9": "Parkland", "10": "Docks", "11": "Commerce",
        "12": "Two Islands", "15": "Industrial", "16": "Vector",
        "17": "Mudpit", "18": "Hammerhead", "19": "Sewage",
        "20": "Meltdown", "21": "Speedway", "23": "Stone Park",
        "24": "Convict"
    };


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
        display: inline-block; /* Ensure button display */
        text-decoration: none; /* Remove any text decoration */
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

    /* --- NEW CSS for GUI Description Span --- */
    #raceConfigGUI .gui-description {
        color: orange;
        margin-left: 10px; /* Add some left margin for visual separation */
        display: block; /* Ensure it's on a new line */
        font-size: 0.9em; /* Slightly smaller font if desired */
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
                <button id="updateCarsButton" class="gui-button">Update Cars</button>
            </div>


            <div class="config-section">
                <h4>Race Creation Parameters</h4>
                <div class="config-params-section">
                    <div><label for="trackID">Track:</label>
                        <select id="trackID">
                            ${Object.entries(tracks).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}
                        </select></div>
                    <div><label for="raceName">Race Name:</label><input type="text" id="raceName"></div>
                    <div><label for="racePassword">Password:</label><input type="text" id="racePassword" placeholder="Optional"></div>
                    <div><label for="betAmount">Bet Amount (Max 10M):</label><input type="number" id="betAmount" value="0" min="0" max="10000000"></div>
                    <div><label for="raceStartTime">Start Time (TCT):</label><input type="datetime-local" id="raceStartTime"></div>
                    <div><label for="laps">Laps:</label><input type="number" id="laps" value="100"></div>
                    <div><label for="minDrivers">Min Drivers:</label><input type="number" id="minDrivers" value="2"></div>
                    <div><label for="maxDrivers">Max Drivers:</label><input type="number" id="maxDrivers" value="2"></div>
                </div>
                <div class="config-section" style="text-align: center; margin-top: 20px;">
                    <button id="createRaceButton" class="gui-button">Create Race</button>
                </div>
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
                v2.93  <br>Based on Shlefter's Script | By GNSC4 [268863]
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

    // --- CACHING OPTIMIZED CAR DATA (item_name, id only) ---
    const cachedEnlistedCarData = await GM_getValue(VEHICLE_ID_CACHE_KEY, null); // <-- Renamed to cachedEnlistedCarData
    const lastCacheTime = await GM_getValue(VEHICLE_ID_CACHE_KEY + '_timestamp', 0);
    const now = Date.now();

    if (cachedEnlistedCarData && (now - lastCacheTime < VEHICLE_ID_CACHE_EXPIRY)) {
        console.log('Using cached optimized car data (item_name, id only).'); // <-- Updated log
        populateCarDropdown(cachedEnlistedCarData); // <-- Pass cached OPTIMIZED CAR DATA directly
        return;
    }

    console.log('Fetching enlisted car data from API using /user/enlistedcars (official api.torn.com)...'); // <--- Updated log message - Official API
    $('#carSelect').html('<option value="">Loading Cars...</option>'); // Reset dropdown

    try {
        const fullEnlistedCarData = await fetchVehicleDataFromAPI(apiKey); // <-- Get FULL enlisted car data first
        if (fullEnlistedCarData && fullEnlistedCarData.length > 0) {
            // --- OPTIMIZE CAR DATA HERE: Extract only item_name and id ---
            const optimizedCarData = fullEnlistedCarData.map(car => ({ // Create new array with optimized data
                item_name: car.item_name,
                id: car.id
            }));
            await GM_setValue(VEHICLE_ID_CACHE_KEY, optimizedCarData); // <-- Cache OPTIMIZED CAR DATA
            await GM_setValue(VEHICLE_ID_CACHE_KEY + '_timestamp', now);
            console.log('Enlisted car data fetched, optimized (item_name, id only), and cached (from /user/enlistedcars - official api.torn.com).'); // <--- Updated log message - Official API
            populateCarDropdown(optimizedCarData); // <-- Pass OPTIMIZED CAR DATA to populate dropdown
            $('#statusMessageBox').text('Car list updated (from Enlisted Cars - official api.torn.com, data optimized, Vehicle ID Fallback, HTML, Old Code Comments, GUI Verbosity, GUI Refinements & GUI Button Fix Removed).').removeClass('error').addClass('success').show(); // <--- Updated status message - GUI Button Fix Removed
            setTimeout(() => $('#statusMessageBox').fadeOut(), 3000);
        } else {
            $('#statusMessageBox').text('Error loading car list from API (/user/enlistedcars - No cars received or API error - official api.torn.com).').addClass('error').removeClass('success').show(); // <--- Updated error message - Official API
            setTimeout(() => $('#statusMessageBox').fadeOut(), 5000);
            $('#carSelect').html('<option value="">Error Loading Cars</option>');
        }
    } catch (error) {
        console.error('Error loading enlisted car data from /user/enlistedcars (official api.torn.com):', error); // <--- Updated error log - Official API
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
            return enlistedCars; // Return the array of enlisted cars (FULL data - optimization happens in loadCars now)
        } else {
            console.error('Error fetching user data (/user/enlistedcars - official api.torn.com). API Status:', response.status); // <--- Updated error log - Official API
            return null;
        }
    } catch (error) {
        console.error('Error fetching user data (/user/enlistedcars - official api.torn.com):', error); // <--- Updated error log - Official API
        return null;
    }
}


// --- Modified populateCarDropdown to be ROBUST against incomplete data ---
function populateCarDropdown(enlistedCarData) { // <--- Now takes OPTIMIZED ENLISTED CAR DATA (item_name, id only)
    const carSelect = $('#carSelect');
    carSelect.empty(); // Clear existing options
    carSelect.append('<option value="">Select a car</option>'); // Default option

    if (enlistedCarData && Array.isArray(enlistedCarData)) {
        // Scenario 1: enlistedCarData is available (fresh from API or cache) - SORT AND USE OPTIMIZED enlistedCarData
        enlistedCarData.sort((a, b) => { // Sort optimized enlistedCarData array by item_name, with robustness
            const nameA = (a && a.item_name) ? a.item_name.toUpperCase() : ''; // Robustly get nameA
            const nameB = (b && b.item_name) ? b.item_name.toUpperCase() : ''; // Robustly get nameB
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        }).forEach(carInfo => { // Loop through OPTIMIZED enlistedCarData (which are now just {item_name, id} objects)
            if (carInfo && carInfo.item_name && carInfo.id) { // <---- ROBUST CHECK: Ensure carInfo, item_name, and id exist (still relevant)
                const vehicleName = carInfo.item_name;
                const enlistedCarId = carInfo.id; // <-- Get enlistedCarId from carInfo.id
                carSelect.append(`<option value="${enlistedCarId}">${vehicleName} (ID: ${enlistedCarId})</option>`); // Display item_name and enlistedCarId
            } else {
                console.warn("populateCarDropdown: Incomplete car data encountered and skipped:", carInfo); // Warn in console about incomplete data
            }
        });
    } else {
        // Fallback: No enlistedCarData - Display error in dropdown
        carSelect.append('<option value="">Error Loading Cars</option>');
        console.error("populateCarDropdown: No enlisted car data available.");
    }
}


// --- **NEW** Function to update cars (clear cache and reload) ---
function updateCars() {
    $('#statusMessageBox').text('Updating car list... Clearing cache and fetching fresh data...').removeClass('error').removeClass('success').show();
    GM_deleteValue(VEHICLE_ID_CACHE_KEY); // Clear cached car data
    GM_deleteValue(VEHICLE_ID_CACHE_KEY + '_timestamp'); // Clear timestamp as well (optional, but good practice)
    loadCars(); // Reload car data from API
    setTimeout(() => $('#statusMessageBox').text('Car list updated! (Cache cleared and reloaded from API, data optimized, Vehicle ID Fallback, HTML, Old Code Comments, GUI Verbosity, GUI Refinements & GUI Button Fix Removed)').removeClass('error').addClass('success').fadeIn(), 1000); // <--- Updated success message - GUI Button Fix Removed
    setTimeout(() => $('#statusMessageBox').fadeOut(), 5000); // Auto-fade success message after 5 seconds
}


// --- Preset Functions ---
function loadPresets() {
    console.log("loadPresets() - START (v2.93)"); // DEBUG CONSOLE LOG - START
    let presets = {};
    presets = GM_getValue(PRESET_STORAGE_KEY, {});
    console.log("loadPresets() - After GM_getValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT
    const presetButtonsDiv = $('#presetButtons');
    presetButtonsDiv.empty();

    $.each(presets, function(presetName, presetConfig) {
        console.log("loadPresets() - Inside loop, presetName: " + presetName); // DEBUG CONSOLE LOG - LOOP ITERATION
        presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
    });
    console.log("loadPresets() - END (v2.93)"); // DEBUG CONSOLE LOG - END
}


function savePreset_Internal() { // <-- **Internal, non-debounced savePreset function**
    console.log("savePreset_Internal() - START (v2.93 - Simplified Presets)"); // DEBUG CONSOLE LOG - START

    const presetName = prompt("Enter a name for this preset:");
    if (!presetName) {
        console.log("savePreset_Internal() - No preset name, cancelled (v2.93 - Simplified Presets)"); // DEBUG CONSOLE LOG - CANCELLED
        return;
    }

    const presets = GM_getValue(PRESET_STORAGE_KEY, {});
    console.log("savePreset_Internal() - Before save, current presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT BEFORE SAVE

    const selectedCarId = $('#carSelect').val();
    const selectedCarName = $("#carSelect option:selected").text();
    const presetConfig = {
        name: presetName,
        carId: selectedCarId, // <-- Now saving enlistedCarId
        carName: selectedCarName, // Save car name as well for display
        trackID: $('#trackID').val(),         // <--- RACE CREATION PARAMETERS SAVED IN PRESET - Track
        raceName: $('#raceName').val(),       // <--- RACE CREATION PARAMETERS SAVED IN PRESET - Race Name
        racePassword: $('#racePassword').val(), // <--- RACE CREATION PARAMETERS SAVED IN PRESET - Race Password
        betAmount: $('#betAmount').val(),       // <--- RACE CREATION PARAMETERS SAVED IN PRESET - Bet Amount
        raceStartTime: $('#raceStartTime').val(),// <--- RACE CREATION PARAMETERS SAVED IN PRESET - Race Start Time
        laps: $('#laps').val(),              // <--- RACE CREATION PARAMETERS SAVED IN PRESET - Laps
        minDrivers: $('#minDrivers').val(),      // <--- RACE CREATION PARAMETERS SAVED IN PRESET - Min Drivers
        maxDrivers: $('#maxDrivers').val()       // <--- RACE CREATION PARAMETERS SAVED IN PRESET - Max Drivers
    };

    presets[presetName] = presetConfig;
    GM_setValue(PRESET_STORAGE_KEY, presets);
    console.log("savePreset_Internal() - After GM_setValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT AFTER SAVE
    loadPresets(); // Update preset buttons after saving
    console.log("savePreset_Internal() - END (v2.93 - Simplified Presets)"); // DEBUG CONSOLE LOG - END
}

// --- Debounced savePreset function ---
const savePreset = debounce(savePreset_Internal, 1000); // <--- **DEBOUNCED savePreset - 1000ms delay**


function applyPreset(presetConfig) {
    console.log("applyPreset() - Applying preset: " + presetConfig.name + " (v2.93 - Simplified Presets)"); // DEBUG CONSOLE LOG - APPLY START

    $('#carSelect').val(presetConfig.carId); // <-- Now setting selected value to enlistedCarId
    $('#trackID').val(presetConfig.trackID);         // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Track
    $('#raceName').val(presetConfig.raceName);       // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Race Name
    $('#racePassword').val(presetConfig.racePassword); // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Race Password
    $('#betAmount').val(presetConfig.betAmount);       // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Bet Amount
    $('#raceStartTime').val(presetConfig.raceStartTime); // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Race Start Time
    $('#laps').val(presetConfig.laps);              // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Laps
    $('#minDrivers').val(presetConfig.minDrivers);      // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Min Drivers
    $('#maxDrivers').val(presetConfig.maxDrivers);       // <--- RACE CREATION PARAMETERS APPLIED FROM PRESET - Max Drivers


    console.log("applyPreset() - Preset applied: " + presetConfig.name + " (v2.93 - Simplified Presets)"); // DEBUG CONSOLE LOG - APPLY END
    $('#statusMessageBox').text(`Preset "${presetConfig.name}" applied (Simplified, Vehicle ID Fallback, HTML, Old Code Comments, GUI Verbosity, GUI Refinements & GUI Button Fix Removed).`).removeClass('error').addClass('success').show(); // <-- Updated status message - GUI Button Fix Removed
    setTimeout(() => $('#statusMessageBox').fadeOut(), 3000);
}


function removePreset(presetName, buttonElement) {
    console.log("removePreset() - START, presetName: " + presetName + " (v2.93)"); // DEBUG CONSOLE LOG - REMOVE START
    if (confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
        console.log("removePreset() - Confirmed delete: " + presetName + " (v2.93)"); // DEBUG CONSOLE LOG - DELETE CONFIRMED
        const presets = GM_getValue(PRESET_STORAGE_KEY, {});
        delete presets[presetName];
        GM_setValue(PRESET_STORAGE_KEY, presets);
        $(buttonElement).closest('.preset-button-container').remove();
        console.log("removePreset() - Preset removed from GUI: " + presetName + " (v2.93)"); // DEBUG CONSOLE LOG - REMOVE GUI ELEMENT
    } else {
        console.log("removePreset() - Cancelled delete: " + presetName + " (v2.93)"); // DEBUG CONSOLE LOG - DELETE CANCELLED
    }
    console.log("removePreset() - END, presetName: " + presetName + " (v2.93)"); // DEBUG CONSOLE LOG - REMOVE END
}


function clearAllPresets() {
    if (confirm('Are you sure you want to clear ALL saved presets? This action is irreversible.')) {
        GM_deleteValue(PRESET_STORAGE_KEY);
        $('#presetButtons').empty(); // Clear buttons from GUI
        $('#statusMessageBox').text('All presets cleared (Vehicle ID Fallback, HTML, Old Code Comments, GUI Verbosity, GUI Refinements & GUI Button Fix Removed).').removeClass('error').addClass('success').show(); // <-- Updated status message - GUI Button Fix Removed
        setTimeout(() => $('#statusMessageBox').fadeOut(), 3000);
        console.log("clearAllPresets() - All presets cleared (v2.93)"); // DEBUG CONSOLE LOG - CLEAR ALL
    } else {
        console.log("clearAllPresets() - Clear all presets cancelled (v2.93)"); // DEBUG CONSOLE LOG - CLEAR ALL CANCELLED
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


// --- **NEW in v2.86** - RFC Value Fetching ---
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


// --- **NEW in v2.86** - Race Creation ---
function createRace() {
    const carID = $('#carSelect').val(); // <-- **CORRECTED SELECTOR to #carSelect (from #carID in reference script)**
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
        carId: $('#carSelect').val(), // <-- **CORRECTED SELECTOR to #carSelect (from #carID in reference script)**
        minDrivers: $('#minDrivers').val(),
        maxDrivers: $('#maxDrivers').val(),
        racePassword: $('#racePassword').val(),
        betAmount: $('#betAmount').val()
    };
}

function applyPreset(presetConfig) {
    $('#trackID').val(presetConfig.trackID);
    $('#raceName').val(presetConfig.raceName);
    $('#laps').val(presetConfig.laps);
    $('#carSelect').val(presetConfig.carId); // <-- **CORRECTED SELECTOR to #carSelect (from #carID in reference script)**
    $('#minDrivers').val(presetConfig.minDrivers);
    $('#maxDrivers').val(presetConfig.maxDrivers);
    $('#racePassword').val(presetConfig.racePassword || '');
    $('#betAmount').val(presetConfig.betAmount || '0');
}


// --- Event Listener Setup ---
function setupEventListeners() {
    $('#saveApiKeyCustom').on('click', saveApiKey);
    $('#createRaceButton').on('click', createRace); // <-- **Now calling createRace() function**
    $('#savePresetButton').on('click', savePreset);
    $('#clearPresetsButton').on('click', clearAllPresets);
    $('#closeGUIButton').on('click', function() { $('#raceConfigGUI').hide(); });
    $('#updateCarsButton').on('click', updateCars);
    $('#presetButtons').on('click', '.remove-preset', function(event) {
        event.preventDefault(); // Prevent any default action
        const presetName = $(this).prev('.preset-button').text().split('<br>')[0]; // Extract preset name (before <br>)
        removePreset(presetName, this); // 'this' is the remove button element
    });
    // createRaceButton event listener is already set up above to call createRace()
}


// --- Initialization ---
$(document).ready(function() {
    if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
        const toggleButton = $(`<button id="toggleRaceGUIButton" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer; text-decoration: none; margin-right: 10px;">Race Config GUI (v2.93)</button>`);
        const descriptionSpan = $(`<span class="gui-description">v2.93 - USER ENLISTED CARS & OFFICIAL API - PARAMETER CONFIRMATION - SYNTAX & ERROR FIX - GUI Cleanup - RACE CREATION LOGIC - VEHICLE ID FALLBACK REMOVED - UNNEEDED COMMENT TAGS REMOVED - OLD CODE COMMENTS REMOVED - GUI CONCISE - GUI REFINEMENTS - **GUI BUTTON FIX**</span>`);

        $('div.content-title > h4').append(toggleButton);
        $('div.content-title > h4').append('<br>'); // Add line break
        $('div.content-title > h4').append(descriptionSpan);


        toggleButton.on('click', function() {
            if ($('#raceConfigGUI').is(':visible')) {
                $('#raceConfigGUI').hide();
            } else {
                createGUI();
                $('#raceConfigGUI').show();
            }
        });
    }
    // Descriptive text is now handled by the descriptionSpan element
});

})(); // <--- **CLOSING IIFE BRACKET - CONFIRMED PRESENT in v2.93**