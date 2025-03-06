// ==UserScript==
// @name         Torn Race Config GUI - PDA & Desktop - v2.6 - Syntax Error Fixed
// @namespace    torn.raceconfiggui.pdadesktop
// @description  Simplified GUI with Syntax Error Fixed - v2.67 - Syntax Error Fixed
// @version      2.67-PDA-Desktop-GMfPDA-SyntaxFixed
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

    })();
// --- **END Inlined GMforPDA Code** ---


const STORAGE_API_KEY = 'torn.raceconfiggui.pdadesktop_raceConfigAPIKey_release';
const PRESET_STORAGE_KEY = 'torn.raceconfiggui.pdadesktop_racePresets_v2_66'; // <--- UNIQUE PRESET STORAGE KEY (v2.66)

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
        <h3 style="margin-top: 0; color: #fff;">Race Config - v2.66 - Syntax Error Fixed</h3>
        <div style="margin-bottom: 10px;">
            <label for="raceConfigApiKey">API Key:</label>
            <input type="text" id="raceConfigApiKey" placeholder="Enter Torn API Key" style="margin-left: 5px; color: black;">
            <button id="saveApiKeyCustom" class="gui-button" style="margin-left: 5px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Save API Key</button>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 10px;">
            <h4>Presets (v2.66 - Syntax Error Fixed)</h4>
            <div id="presetButtons"></div>
            <div style="margin-top: 10px;">
                <button id="savePresetButton" class="gui-button" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer;">Save Preset</button>
            </div>
        </div>
        <button id="closeGUIButton" class="close-button" style="position: absolute; top: 5px; right: 5px; cursor: pointer; color: #ddd; background: #555; border: none; border-radius: 3px;">[X]</button>
        <span style="font-size: 0.8em; color: #999; position: absolute; bottom: 5px; right: 5px;">v2.66 - Syntax Error Fixed</span>
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
    alert('API Key Saved (v2.66 - Syntax Error Fixed)');
    // No loadCars() in this simplified version
}


// --- Preset Functions (Simplified for Debugging) ---
function loadPresets() {
    console.log("loadPresets() - START (v2.66)"); // DEBUG CONSOLE LOG - START
    let presets = {}; // <--- EXPLICITLY CLEAR PRESETS OBJECT
    presets = GM_getValue(PRESET_STORAGE_KEY, {}); // Load from storage AFTER clearing
    console.log("loadPresets() - After GM_getValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT
    const presetButtonsDiv = $('#presetButtons');
    presetButtonsDiv.empty();

    $.each(presets, function(presetName, presetConfig) {
        console.log("loadPresets() - Inside loop, presetName: " + presetName); // DEBUG CONSOLE LOG - LOOP ITERATION
        presetButtonsDiv.append(createPresetButton(presetName, presetConfig));
    });
    console.log("loadPresets() - END (v2.66)"); // DEBUG CONSOLE LOG - END
}

function savePreset() {
    console.log("savePreset() - START (v2.66)"); // DEBUG CONSOLE LOG - START
    const presetName = prompt("Enter a name for this preset (v2.66 - Syntax Error Fixed):"); // UPDATED PROMPT
    if (!presetName) {
        console.log("savePreset() - No preset name, cancelled (v2.66)"); // DEBUG CONSOLE LOG - CANCELLED
        return;
    }

    const presets = GM_getValue(PRESET_STORAGE_KEY, {});
    console.log("savePreset() - Before save, current presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT BEFORE SAVE
    presets[presetName] = { name: presetName, debugVersion: "v2.66-SyntaxFixed" }; // Simplified preset data - UPDATED VERSION
    GM_setValue(PRESET_STORAGE_KEY, presets);
    console.log("savePreset() - After GM_setValue, presets object:", presets); // DEBUG CONSOLE LOG - PRESETS OBJECT AFTER SAVE
    loadPresets(); // Immediately reload presets after saving
    console.log("savePreset() - END (v2.66)"); // DEBUG CONSOLE LOG - END
}

function removePreset(presetName, buttonElement) {
    console.log("removePreset() - START, presetName: " + presetName + " (v2.66)"); // DEBUG CONSOLE LOG - START
    if (confirm(`Are you sure you want to delete preset "${presetName}"? (v2.66 - Syntax Error Fixed)`)) { // UPDATED CONFIRM MESSAGE
        console.log("removePreset() - Confirmed delete: " + presetName + " (v2.66)"); // DEBUG CONSOLE LOG - DELETE CONFIRMED
        const presets = GM_getValue(PRESET_STORAGE_KEY, {});
        delete presets[presetName];
        GM_setValue(PRESET_STORAGE_KEY, presets);
        $(buttonElement).closest('.preset-button-container').remove();
        console.log("removePreset() - Preset removed from GUI: " + presetName + " (v2.66)"); // DEBUG CONSOLE LOG - GUI REMOVED
    } else {
        console.log("removePreset() - Cancelled delete: " + presetName + " (v2.66)"); // DEBUG CONSOLE LOG - DELETE CANCELLED
    }
    console.log("removePreset() - END, presetName: " + presetName + " (v2.66)"); // DEBUG CONSOLE LOG - END
}

function applyPreset(presetConfig) {
    console.log("applyPreset() - Applying preset: " + presetConfig.name + " (v2.66)"); // DEBUG CONSOLE LOG - APPLY START
    console.log("applyPreset() - END (v2.66)"); // DEBUG CONSOLE LOG - APPLY END
}


function createPresetButton(presetName, presetConfig) {
    const container = $('<div class="preset-button-container" style="display: inline-block; margin-right: 5px; margin-bottom: 5px;"></div>');
    const button = $(`<button class="preset-button" style="cursor: pointer; margin-right: 2px; color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px;">${presetName} (v2.66)</button>`); // v2.66 label
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
    $('#savePresetButton').on('click', savePreset); // Save Preset - NO DEBOUNCE in v2.66 (for now)
    $('#closeGUIButton').on('click', function() { $('#raceConfigGUI').hide(); });
    $('#presetButtons').on('click', '.remove-preset', function() {
        const presetName = $(this).prev('.preset-button').text();
        removePreset(presetName, removeButton);
    });
}

// --- Initialization ---
$(document).ready(function() {
    if ($('div.content-title > h4').length > 0 && !$('#toggleRaceGUIButton').length) {
        const toggleButton = $(`<button id="toggleRaceGUIButton" style="color: #ddd; background-color: #555; border: 1px solid #777; border-radius: 3px; padding: 8px 15px; cursor: pointer; text-decoration: none; margin-right: 10px;">Race Config GUI (v2.66)</button>`); // v2.66 Label
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
        $('div.content-title > h4').append('<span style="color: orange; margin-left: 10px;">v2.66 - SYNTAX ERROR FIXED - GUI TEST</span>'); // Orange - syntax fixed GUI test
});