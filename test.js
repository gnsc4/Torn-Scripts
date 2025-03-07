// ==UserScript==
// @name         Torn Race Config GUI
// @version      3.0.26
// @description  PDA GUI to configure Torn racing parameters... - Version 3.0.26 - DOM Readiness Polling Fix
// @author       GNSC4
// @match        https://www.torn.com/loader.php?sid=racing*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/GNSC4/torn-race-config-gui/main/torn-race-config-gui-v3.0.26-DomReadyPollFix.user.js
// @downloadURL  https://raw.githubusercontent.com/GNSC4/torn-race-config-gui/main/torn-race-config-gui-v3.0.26-DomReadyPollFix.user.js
// @run-at       document-end
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// ==/UserScript==

(function() {
    'use strict';

    // --- Make sure GM/GM_xmlhttpRequest is available ---
    const GM = {
        xmlHttpRequest: (details) => {
            return new Promise((resolve, reject) => {
                // Fallback to fetch if GM.xmlHttpRequest is not available
                fetch(details.url, {
                    method: details.method,
                    headers: details.headers,
                    body: details.method === 'POST' ? details.data : undefined
                })
                .then(response => response.json())
                .then(data => {
                    if (details.onload) {
                        details.onload({ status: 200, responseText: JSON.stringify(data) });
                    }
                    resolve(data);
                })
                .catch(error => {
                    if (details.onerror) {
                        details.onerror(error);
                    }
                    reject(error);
                });
            });
        }
    };

    // --- Initialize GUI without waiting for DOMContentLoaded ---
    function init() {
        const pollForTitle = () => {
            const titleElement = document.querySelector('div.content-title > h4');
            if (titleElement) {
                createToggleButton();
                console.log('Race Config GUI initialized');
            } else if (domCheckAttempts < MAX_DOM_CHECK_ATTEMPTS) {
                domCheckAttempts++;
                setTimeout(pollForTitle, 100);
            } else {
                console.error('Failed to find title element after maximum attempts');
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', pollForTitle);
        } else {
            pollForTitle();
        }
    }

    function initializeScript() {
        if (window.guiInitialized) {
            console.warn('GUI already initialized');
            return;
        }

        const raceConfigGUI = createRaceConfigGUI();
        document.body.appendChild(raceConfigGUI);
        initializeGUI(raceConfigGUI);
        createToggleButton();
        
        window.guiInitialized = true;
        console.log('Race Config GUI initialized successfully');
    }

    let guiInitialized = false;
    let domCheckAttempts = 0; // Counter for DOM check attempts - v3.0.26
    const MAX_DOM_CHECK_ATTEMPTS = 100; // Maximum DOM check attempts - v3.0.26

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
            #toggleRaceGUIButton:hover,
            #setNowButton:hover,
            #quickPresetButtonsContainer > .quick-race-button:hover,
            div.content-title > h4 > #toggleRaceGUIButton:hover {
                background-color: #777;
            }

            div.content-title > h4 > #toggleRaceGUIButton {
                background-color: #555;
                border: 1px solid #777;
            }


            #raceConfigGUI {
                position: fixed;
                top: 85px;
                left: 20px;
                background-color: #222;
                color: #ddd;
                border: 1px solid #555;
                padding: 25px; /* Increased padding */
                z-index: 999999 !important;
                font-family: Arial, sans-serif; /* More specific font */
                border-radius: 10px;
                max-width: 450px; /* Slightly wider */
                display: none;
                user-select: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6); /* Enhanced shadow */
            }

            #raceConfigGUI .api-key-section,
            #raceConfigGUI .config-section,
            #raceConfigGUI .car-select-section,
            #raceConfigGUI .presets-section {
                margin-bottom: 25px;
                padding: 15px;
                background-color: #2a2a2a; /* Slightly lighter background */
                border-radius: 8px;
                border: 1px solid #444;
            }

            #raceConfigGUI h4 {
                color: #fff;
                font-size: 1.2em;
                margin: 0 0 15px 0;
                padding-bottom: 10px;
                border-bottom: 1px solid #444;
                text-align: center;
            }

            #raceConfigGUI input[type="text"],
            #raceConfigGUI input[type="number"],
            #raceConfigGUI select {
                padding: 8px 12px;
                margin: 5px 0;
                border: 1px solid #555;
                background-color: #333;
                color: #eee !important;
                border-radius: 5px;
                width: calc(100% - 26px);
                font-size: 14px;
            }

            #raceConfigGUI .gui-button,
            #raceConfigGUI .preset-button {
                background-color: #444;
                color: #fff;
                border: 1px solid #555;
                border-radius: 5px;
                padding: 8px 15px;
                margin: 5px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
            }

            #raceConfigGUI .gui-button:hover,
            #raceConfigGUI .preset-button:hover {
                background-color: #555;
                border-color: #666;
            }

            #raceConfigGUI #statusMessageBox {
                margin-top: 15px;
                padding: 12px;
                border-radius: 5px;
                font-size: 14px;
                text-align: center;
            }

            #raceConfigGUI #statusMessageBox.success {
                background-color: #1a472a;
                border: 1px solid #2d5a3f;
            }

            #raceConfigGUI #statusMessageBox.error {
                background-color: #5c1e1e;
                border: 1px solid #8b2e2e;
            }

            #raceConfigGUI #createRaceButton {
                background-color: #2d5a3f !important;
                border-color: #3d7a5f !important;
                font-size: 16px !important;
                padding: 12px 24px !important;
                margin: 15px auto !important;
                display: block !important;
                width: 80% !important;
            }

            #raceConfigGUI #createRaceButton:hover {
                background-color: #3d7a5f !important;
                border-color: #4d8a6f !important;
            }

            #raceConfigGUI label {
                color: #bbb;
                font-size: 14px;
                margin-bottom: 5px;
                display: block;
            }

            .time-config {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
            }

            .time-selector select {
                width: auto !important;
                min-width: 65px;
            }

            /* Ensure all GUI elements maintain higher z-index */
            #raceConfigGUI * {
                z-index: 999999 !important;
                position: relative;
            }

            /* Additional overlay protection */
            #raceConfigGUI .config-section,
            #raceConfigGUI .car-select-section,
            #raceConfigGUI .presets-section,
            #raceConfigGUI .api-key-section {
                background-color: #222;
                position: relative;
                z-index: 999999 !important;
            }

            #closeGUIButton {
                z-index: 1000000 !important; /* Even higher than the GUI */
                pointer-events: all !important;
            }

            .drag-handle {
                z-index: 999998 !important; /* Just below the GUI elements */
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
            #raceConfigGUI input[type="date"],
            #raceConfigGUI input[type="time"],
            #raceConfigGUI select {
                padding: 9px;
                margin-bottom: 0px;
                border: 1px solid #555;
                background-color: #444;
                color: #eee !important;
                border-radius: 7px;
                width: calc(100% - 24px);
            }

            #raceConfigGUI input:focus,
            #raceConfigGUI select:focus {
                border-color: #888;
                box-shadow: 0 0 6px rgba(136, 136, 136, 0.5);
            }


            #raceConfigGUI .presets-section {
                margin-bottom: 20px;
                padding: 15px;
                position: relative;
            }

            #raceConfigGUI .preset-buttons-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 15px;
                align-items: flex-start;
                width: 100%;
            }

            #raceConfigGUI .preset-button-container {
                display: inline-flex;
                flex-direction: column;
                align-items: stretch;
                margin-bottom: 10px;
                text-align: center;
                position: relative;
                width: 100%;
            }

            #raceConfigGUI .preset-actions {
                display: flex;
                flex-direction: row;  /* Changed from column to row */
                justify-content: center;  /* Center the buttons horizontally */
                gap: 10px;
                width: 100%;
                margin-top: 15px;
            }

            #raceConfigGUI #savePresetButton,
            #raceConfigGUI #clearPresetsButton {
                flex: 0 1 auto;  /* Allow buttons to shrink but not grow */
                min-width: 120px;  /* Minimum width for buttons */
                max-width: 150px;  /* Maximum width for buttons */
                margin: 0;  /* Remove margin since we're using gap */
                padding: 8px 15px;
                text-align: center;
            }


            #raceConfigGUI .config-section:last-child {
                border-bottom: 0px solid #eee;
            }


            #raceConfigGUI .config-section h4,
            #raceConfigGUI .car-select-section h4,
            #raceConfigGUI .presets-section h4 {
                border-top: 1px solid #555;
                padding-top: 12px;
                font-size: 1.4em;
                margin-bottom: 18px;
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

            #raceConfigGUI #createRaceButton:hover,
            #raceConfigGUI #closeGUIButton:hover,
            #raceConfigGUI #setNowButton:hover {
                background-color: #777;
            }

            #raceConfigGUI #setNowButton:hover {
                background-color: #888;
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
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
                overflow-wrap: break-word;
            }


            #raceConfigGUI .preset-buttons-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 15px;
                align-items: flex-start;
                max-width: calc(100% - 20px);
            }

            #raceConfigGUI .preset-button-container {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 20px;
                text-align: center;
                position: relative;
            }

            #raceConfigGUI .presets-section .preset-buttons-container .preset-button:hover {
                background-color: #777;
            }


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
                position: absolute;
                top: 0px;
                right: -5px;
                float: none;
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
            #raceConfigGUI #statusMessageBox.success {
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

            #raceConfigGUI .config-params-section .driver-input-container {
                display: inline-block;
                width: 49%;
                margin-right: 1%;
                margin-bottom: 0px;
            }

            #raceConfigGUI .config-params-section .driver-input-container:nth-child(even) {
                margin-right: 0;
            }


            #raceConfigGUI .config-params-section .driver-input-container:last-child {
                margin-right: 0;
            }

            #raceConfigGUI .config-params-section .driver-input-container input[type="number"] {
                width: calc(100% - 22px);
            }

            #raceConfigGUI .config-section > div {
                margin-bottom: 12px;
                display: flex;
                align-items: center;
            }

            #raceConfigGUI .config-section label {
                margin-bottom: 0;
                margin-right: 10px;
                width: auto;
                flex-shrink: 0;
                text-align: right;
                min-width: 110px;
            }

            #raceConfigGUI input,
            #raceConfigGUI select,
            #raceConfigGUI button {
                user-select: text; /* Allow text selection in inputs */
                pointer-events: auto; /* Ensure inputs are clickable */
            }

            .drag-handle {
                z-index: 1;
            }

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
                    font-size: 1.5em;
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

                #quickPresetButtonsContainer {
                    text-align: center;
                    max-width: 95%;
                }

                .quick-race-button {
                    margin: 5px;
                }

                .preset-button-container {
                    text-align: center;
                }


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
        `;

    style.textContent += `
        #raceConfigGUI #raceBanner {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 15px auto;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        #raceConfigGUI h2 {
            margin-top: 10px;
            margin-bottom: 20px;
            color: #fff;
            font-size: 1.5em;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
    `;

    style.textContent += `
    #raceConfigGUI .track-laps-container {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    #raceConfigGUI .track-laps-container > div {
        display: flex;
        align-items: center;
        flex: 0 0 auto;  /* Prevent flex shrinking */
    }

    /* Override the general select styles specifically for track and laps */
    #raceConfigGUI .track-laps-container #trackSelect {
        width: 220px !important;  /* Add !important */
        min-width: 220px !important;  /* Force minimum width */
        flex: 0 0 220px !important;  /* Prevent flexbox shrinking */
        box-sizing: border-box !important;
    }

    #raceConfigGUI .track-laps-container #lapsInput {
        width: 80px !important;  /* Add !important */
        min-width: 80px !important;  /* Force minimum width */
        flex: 0 0 80px !important;  /* Prevent flexbox shrinking */
        box-sizing: border-box !important;
    }

    #raceConfigGUI .track-laps-container label {
        margin: 0 10px 0 0;
        min-width: auto;
        white-space: nowrap;  /* Prevent label wrapping */
    }
`;

/* Remove or override any conflicting width calculations */
style.textContent = style.textContent.replace(/width:\s*calc\(100%\s*-\s*\d+px\)(.*?);/g, '');

    style.textContent += `
    #raceConfigGUI .track-laps-container {
        display: flex;
        gap: 20px;  /* Increased gap between track and laps */
        align-items: flex-start;
        margin-bottom: 12px;
    }

    #raceConfigGUI .track-laps-container > div {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
    }

    #raceConfigGUI .track-laps-container #trackSelect {
        width: 220px !important;
        min-width: 220px !important;
        flex: 0 0 220px !important;
        box-sizing: border-box !important;
    }

    #raceConfigGUI .track-laps-container #lapsInput {
        width: 80px !important;
        min-width: 80px !important;
        flex: 0 0 80px !important;
        box-sizing: border-box !important;
    }

    #raceConfigGUI .config-params-section {
        display: flex;
        gap: 20px;  /* Increased gap between min/max drivers */
        margin-bottom: 20px;
    }

    #raceConfigGUI .config-params-section .driver-input-container {
        flex: 1;
        margin-right: 0;  /* Remove margin-right since we're using gap */
    }
`;

// Then add our new spacing rules immediately after
style.textContent += `
    #raceConfigGUI .track-laps-container {
        display: flex;
        gap: 30px !important;  /* Increased gap between track and laps */
        align-items: center;
        margin-bottom: 12px;
        justify-content: flex-start;
        padding-right: 20px;
    }

    #raceConfigGUI .track-laps-container > div {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
    }

    #raceConfigGUI .config-params-section {
        display: flex;
        gap: 30px !important;  /* Increased gap between min/max drivers */
        margin-bottom: 20px;
        justify-content: space-between;
        padding-right: 20px;
    }

    #raceConfigGUI .config-params-section .driver-input-container {
        flex: 1;
        max-width: calc(50% - 15px);  /* Account for the gap */
    }

    /* Ensure inputs maintain their widths */
    #raceConfigGUI .track-laps-container #trackSelect {
        width: 220px !important;
        min-width: 220px !important;
    }

    #raceConfigGUI .track-laps-container #lapsInput {
        width: 80px !important;
        min-width: 80px !important;
    }
`;

// Add these specific styles after all other style definitions
style.textContent += `
    /* Reset and base styles for containers */
    #raceConfigGUI .track-laps-container,
    #raceConfigGUI .config-params-section {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        width: 100%;
        box-sizing: border-box;
    }

    /* Track and Laps container specific styles */
    #raceConfigGUI .track-laps-container {
        gap: 30px;
        justify-content: flex-start;
    }

    #raceConfigGUI .track-laps-container > div {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    /* Min/Max Drivers container specific styles */
    #raceConfigGUI .config-params-section {
        gap: 30px;
        justify-content: space-between;
    }

    #raceConfigGUI .config-params-section .driver-input-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        max-width: calc(50% - 15px);
    }

    /* Ensure inputs maintain specific widths */
    #raceConfigGUI #trackSelect {
        width: 220px !important;
        min-width: 220px !important;
    }

    #raceConfigGUI #lapsInput {
        width: 80px !important;
        min-width: 80px !important;
    }

    #raceConfigGUI .driver-input-container input {
        width: 100% !important;
    }
`;

    document.head.appendChild(style);


    function createRaceConfigGUI() {
        let gui = document.createElement('div');
        gui.id = 'raceConfigGUI';
        gui.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <img id="raceBanner" src="https://www.torn.com/images/v2/racing/header/banners/976_classA.png" alt="Racing Banner" style="width: 100%; height: auto; margin-bottom: 15px; border-radius: 5px;">
                <h2>Race Configuration</h2>
            </div>

            <div class="api-key-section">
                <h4>API Key</h4>
                <input type="text" id="apiKeyInput" placeholder="Enter your API Key">
                <button id="saveApiKeyButton" class="gui-button">Save API Key</button>
            </div>

            <div class="config-section">
                <h4>Race Settings</h4>

                <div class="track-laps-container">
                    <div>
                        <label for="trackSelect">Track</label>
                        <select id="trackSelect">
                            <option value="6">6 - Uptown</option>
                            <option value="7">7 - Withdrawal</option>
                            <option value="8">8 - Underdog</option>
                            <option value="9">9 - Parkland</option>
                            <option value="10">10 - Docks</option>
                            <option value="11">11 - Commerce</option>
                            <option value="12">12 - Two Islands</option>
                            <option value="15">15 - Industrial</option>
                            <option value="16">16 - Vector</option>
                            <option value="17">17 - Mudpit</option>
                            <option value="18">18 - Hammerhead</option>
                            <option value="19">19 - Sewage</option>
                            <option value="20">20 - Meltdown</option>
                            <option value="21">21 - Speedway</option>
                            <option value="23">23 - Stone Park</option>
                            <option value="24">24 - Convict</option>
                        </select>
                    </div>
                    <div>
                        <label for="lapsInput">Laps:</label>
                        <input type="number" id="lapsInput" value="100" min="1" max="100">
                    </div>
                </div>

                <div class="config-params-section">
                    <div class="driver-input-container"><label for="minDriversInput">Min Drivers:</label>
                        <input type="number" id="minDriversInput" value="2" min="2" max="10"></div>
                    <div class="driver-input-container"><label for="maxDriversInput">Max Drivers</label>
                        <input type="number" id="maxDriversInput" value="2" min="2" max="10"></div>
                </div>

                <div><label for="raceNameInput">Race Name:</label>
                    <input type="text" id="raceNameInput" placeholder="Race Name Optional"></div>

                <div><label for="passwordInput">Password (optional)</label>
                    <input type="text" id="passwordInput" placeholder="Race Password Optional"></div>

                <div><label for="betAmountInput">(Max 10M, Optional<br>Bet Amount for Race)</label>
                    <input type="number" id="betAmountInput" value="0" min="0" max="10000000"></div>

                <div class="time-config">
                    <label>Race Start Time (TCT 24hr):</label>
                    <div class="time-selector">
                        <select id="hourSelect" style="width: auto; display: inline-block;"></select>
                        <span style="margin: 0 5px;">:</span>
                        <select id="minuteSelect" style="width: auto; display: inline-block;"></select>
                        <button id="setNowButton" class="gui-button" style="padding: 5px 10px; font-size: 0.8em; margin-left: 5px; vertical-align: baseline;">NOW</button>
                        <span style="font-size: 0.8em; color: #ccc; margin-left: 5px;">(TCT)</span>
                    </div>
                </div>
            </div>


            <div class="car-select-section config-section">
                <h4>Car Selection</h4>
                <div>
                    <label for="carIdInput">Car ID:</label>
                    <div style="display: flex; align-items: center;">
                        <input type="text" id="carIdInput" placeholder="Enter Car ID or use dropdown below" style="margin-right: 5px;">
                        <button id="changeCarButton" class="gui-button" style="padding: 8px 10px; font-size: 0.8em; margin-top: 0px; margin-right: 0px; vertical-align: baseline; display: none;">Change Car</button> </div>
                </div>

                <div>
                    <label for="carDropdown">Car:</label>
                    <select id="carDropdown">
                        <option value="">Select a car...</option>
                    </select>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button id="updateCarsButton" class="gui-button" style="width: 80%; max-width: 200px; display: block; margin: 0 auto;">Update Cars</button>
                    <div id="carStatusMessage" style="font-size: 0.8em; color: #aaa; margin-top: 5px;"></div>
                </div>
            </div>


            <div class="presets-section config-section">
                <h4>Presets</h4>
                <div id="presetButtonsContainer" class="preset-buttons-container">
                </div>
                <div class="preset-actions">
                    <button id="savePresetButton" class="gui-button">Save Preset</button>
                    <button id="clearPresetsButton" class="gui-button">Clear Presets</button>
                </div>
                <div id="statusMessageBox" style="display:none;">Status Message</div>
            </div>

            <div class="action-buttons" style="text-align: center; margin-top: 15px;">
                <button id="createRaceButton" class="gui-button">Create Race</button>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
                Script created by GNSC4 (<a href="https://www.torn.com/profiles.php?XID=268863" target="_blank" style="color: #888; text-decoration: none;">268863</a>)-v3.0.13<br>
                <a href="https://github.com/GNSC4/torn-race-config-gui" target="_blank" style="color: #888; text-decoration: none;">v3.0.16 - No GM Functions</a>
            </div>
            <button type="button" id="closeGUIButton" class="close-button" title="Close GUI">×</button>
        `;
        return gui;
    }


    function initializeGUI(gui) {
        loadApiKey();
        populateTimeDropdowns();
        updateCarDropdown();
        loadPresets();

        // --- Initialize GUI Elements AFTER GUI is in DOM and perform null checks - v3.0.24 ---
        const apiKeyInput = document.getElementById('apiKeyInput');
        const saveApiKeyButton = document.getElementById('saveApiKeyButton');
        const trackSelect = document.getElementById('trackSelect');
        const lapsInput = document.getElementById('lapsInput');
        const minDriversInput = document.getElementById('minDriversInput');
        const maxDriversInput = document.getElementById('maxDriversInput');
        const raceNameInput = document.getElementById('raceNameInput');
        const passwordInput = document.getElementById('passwordInput');
        const betAmountInput = document.getElementById('betAmountInput');
        const hourSelect = document.getElementById('hourSelect');
        const minuteSelect = document.getElementById('minuteSelect');
        const setNowButton = document.getElementById('setNowButton');
        const carIdInput = document.getElementById('carIdInput');
        const changeCarButton = document.getElementById('changeCarButton');
        const carDropdown = document.getElementById('carDropdown');
        const updateCarsButton = document.getElementById('updateCarsButton');
        const carStatusMessage = document.getElementById('carStatusMessage');
        const savePresetButton = document.getElementById('savePresetButton');
        const clearPresetsButton = document.getElementById('clearPresetsButton');
        const presetButtonsContainer = document.getElementById('presetButtonsContainer');
        const statusMessageBox = document.getElementById('statusMessageBox');
        const createRaceButton = document.getElementById('createRaceButton');
        const closeGUIButton = document.getElementById('closeGUIButton');
        // --- End of GUI Element Initialization ---


        if (saveApiKeyButton) { // --- Null check before adding listener - v3.0.24 ---
            saveApiKeyButton.addEventListener('click', () => {
                saveApiKey();
            });
        } else {
            console.error("Error: saveApiKeyButton element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        if (setNowButton) { // --- Null check before adding listener - v3.0.24 ---
            setNowButton.addEventListener('click', () => {
                setTimeToNow();
            });
        } else {
             console.error("Error: setNowButton element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        if (updateCarsButton) { // --- Null check before adding listener - v3.0.24 ---
            updateCarsButton.addEventListener('click', () => {
                updateCarList();
            });
        } else {
            console.error("Error: updateCarsButton element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        if (carDropdown) { // --- Null check before adding listener - v3.0.24 ---
            carDropdown.addEventListener('change', () => {
                carIdInput.value = carDropdown.value;
            });
        }  else {
            console.error("Error: carDropdown element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        if (savePresetButton) { // --- Null check before adding listener - v3.0.24 ---
            savePresetButton.addEventListener('click', () => {
                savePreset();
            });
        } else {
            console.error("Error: savePresetButton element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        if (clearPresetsButton) { // --- Null check before adding listener - v3.0.24 ---
            clearPresetsButton.addEventListener('click', () => {
                clearPresets();
            });
        } else {
            console.error("Error: clearPresetsButton element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        if (createRaceButton) { // --- Null check before adding listener - v3.0.24 ---
            createRaceButton.addEventListener('click', () => {
                createRace();
            });
        } else {
            console.error("Error: createRaceButton element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        if (closeGUIButton) { // --- Null check before adding listener - v3.0.24 ---
            closeGUIButton.addEventListener('click', () => {
                toggleRaceGUI();
            });
        } else {
            console.error("Error: closeGUIButton element not found in initializeGUI"); // --- Error Log - v3.0.24 ---
        }


        dragElement(gui);

        displayPresets();
        updateQuickPresetsDisplay();

        displayStatusMessage('GUI Loaded', 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);

    }

    function createToggleButton() {
        const existingButton = document.getElementById('toggleRaceGUIButton');
        if (existingButton) {
            console.log('Toggle button already exists');
            return existingButton;
        }

        const button = document.createElement('button');
        button.id = 'toggleRaceGUIButton';
        button.className = 'gui-button';
        button.textContent = 'Race Config PDA';
        button.style.position = 'relative';
        button.style.zIndex = '999';

        button.addEventListener('click', () => {
            console.log('Toggle button clicked');
            toggleRaceGUI();
        });

        const titleElement = document.querySelector('div.content-title > h4');
        if (titleElement) {
            titleElement.appendChild(button);
            console.log('Toggle button added to title');
        } else {
            document.body.appendChild(button);
            console.log('Toggle button added to body');
        }

        return button;
    }

    function toggleRaceGUI() {
        let gui = document.getElementById('raceConfigGUI');
        if (gui) {
            gui.style.display = gui.style.display === 'none' ? 'block' : 'none';
            console.log('Toggling existing GUI:', gui.style.display);
        } else {
            console.log('Creating new GUI');
            gui = createRaceConfigGUI();
            document.body.appendChild(gui);
            initializeGUI(gui);
            gui.style.display = 'block';
        }
    }

    function dragElement(elmnt) {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 40px; /* Make space for close button */
            height: 40px;
            cursor: move;
            background: transparent;
            pointer-events: all;
        `;
        elmnt.insertBefore(dragHandle, elmnt.firstChild);

        // Add this style to ensure close button is clickable
        const style = document.createElement('style');
        style.textContent = `
            #closeGUIButton {
                z-index: 1001; /* Higher than drag handle */
                pointer-events: all !important;
            }
            .drag-handle {
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    const STORAGE_API_KEY = 'raceConfigAPIKey_release_NoGMf'; // Add constant for storage key name

    function saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            displayStatusMessage('Please enter a valid API key', 'error');
            return;
        }
    
        try {
            GM_setValue(STORAGE_API_KEY, apiKey); // Use GM_setValue instead of localStorage
            displayStatusMessage('API Key Saved', 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            updateCarList(); // Refresh car list after saving key
        } catch (e) {
            console.error('Error saving API key:', e);
            displayStatusMessage('Failed to save API key', 'error');
        }
    }
    
    function loadApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (!apiKeyInput) return;
        
        try {
            const savedKey = GM_getValue(STORAGE_API_KEY, ''); // Use GM_getValue instead of localStorage
            apiKeyInput.value = savedKey || '';
        } catch (e) {
            console.error('Error loading API key:', e);
        }
    }

    function displayStatusMessage(message, type = '') {
        const statusMessageBox = document.getElementById('statusMessageBox');
        if (!statusMessageBox) return;

        statusMessageBox.textContent = message;
        statusMessageBox.style.display = message ? 'block' : 'none';

        statusMessageBox.className = ' ';
        if (type === 'error' || type === 'success') {
            statusMessageBox.classList.add(type);
        }
    }

    function savePreset() {
        const presetName = prompt("Enter a name for this preset:");
        if (!presetName) {
            displayStatusMessage('Preset name cannot be empty.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const presetData = {
            track: document.getElementById('trackSelect').value,
            laps: document.getElementById('lapsInput').value,
            minDrivers: document.getElementById('minDriversInput').value,
            maxDrivers: document.getElementById('maxDriversInput').value,
            raceName: document.getElementById('raceNameInput').value,
            password: document.getElementById('passwordInput').value,
            betAmount: document.getElementById('betAmountInput').value,
            hour: document.getElementById('hourSelect').value,
            minute: document.getElementById('minuteSelect').value,
            carId: document.getElementById('carIdInput').value
        };
        let presets = loadPresets();
        presets[presetName] = presetData;
        set_value('race_presets', presets);
        displayPresets();
        updateQuickPresetsDisplay();
        displayStatusMessage(`Preset "${presetName}" saved.`, 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function loadPresets() {
        return get_value('race_presets') || {};
    }

    function loadAllPresets() {
        return loadPresets() || {};
    }

    function displayPresets() {
        const presets = loadPresets();
        const container = document.getElementById('presetButtonsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (Object.keys(presets).length === 0) {
            container.textContent = 'No presets saved yet.';
            return;
        }

        Object.keys(presets).forEach(presetName => {
            const presetButtonContainer = document.createElement('div');
            presetButtonContainer.className = 'preset-button-container';
            container.appendChild(presetButtonContainer);

            const presetButton = document.createElement('button');
            presetButton.className = 'preset-button';
            presetButton.textContent = presetName;
            presetButton.title = `Apply preset: ${presetName}`;
            presetButton.addEventListener('click', () => applyPreset(presetName));
            presetButtonContainer.appendChild(presetButton);

            const removeButton = document.createElement('a');
            removeButton.className = 'remove-preset';
            removeButton.href = '#';
            removeButton.textContent = '×';
            removeButton.title = `Remove preset: ${presetName}`;
            removeButton.addEventListener('click', (event) => {
                event.preventDefault();
                removePreset(presetName);
            });
            presetButtonContainer.appendChild(removeButton);

        });
    }

    function applyPreset(presetName) {
        const presets = loadPresets();
        const preset = presets[presetName];
        if (preset) {
            document.getElementById('trackSelect').value = preset.track;
            document.getElementById('lapsInput').value = preset.laps;
            document.getElementById('minDriversInput').value = preset.minDrivers;
            document.getElementById('maxDriversInput').value = preset.maxDrivers;
            document.getElementById('raceNameInput').value = preset.raceName;
            document.getElementById('passwordInput').value = preset.password;
            document.getElementById('betAmountInput').value = preset.betAmount;
            document.getElementById('hourSelect').value = preset.hour;
            document.getElementById('minuteSelect').value = preset.minute;
            document.getElementById('carIdInput').value = preset.carId;

            displayStatusMessage(`Preset "${presetName}" applied.`, 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);

        } else {
            displayStatusMessage(`Preset "${presetName}" not found.`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    function removePreset(presetName) {
        if (!confirm(`Are you sure you want to remove preset "${presetName}"?`)) {
            return;
        }
        let presets = loadPresets();
        delete presets[presetName];
        set_value('race_presets', presets);
        displayPresets();
        updateQuickPresetsDisplay();
        displayStatusMessage(`Preset "${presetName}" removed.`, 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function clearPresets() {
        if (confirm("Are you sure you want to clear ALL saved presets?")) {
            set_value('race_presets', {});
            displayPresets();
            updateQuickPresetsDisplay();
            displayStatusMessage('All presets cleared.', 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    function updateQuickPresetsDisplay() {
        const presets = loadAllPresets();
        const quickPresetsContainer = document.getElementById('quickPresetButtonsContainer');

        if (!quickPresetsContainer) return;

        quickPresetsContainer.innerHTML = '';

        const quickPresets = [
            { name: "Quick Uptown 10 Laps", config: { track: '6', laps: '10' } },
            { name: "Quick Speedway 50 Laps", config: { track: '5', laps: '50' } },
        ];

        if (quickPresets.length > 0) {
            quickPresets.forEach(quickPreset => {
                const button = document.createElement('button');
                button.className = 'gui-button quick-race-button';
                button.textContent = quickPreset.name;
                button.title = `Quick Race: ${quickPreset.name}`;
                button.addEventListener('click', () => applyQuickPreset(quickPreset.config));
                quickPresetsContainer.appendChild(button);
            });
        } else {
            quickPresetsContainer.textContent = 'No quick presets defined.';
        }
    }

    function applyQuickPreset(config) {
        if (config) {
            document.getElementById('trackSelect').value = config.track || document.getElementById('trackSelect').options[0].value;
            document.getElementById('lapsInput').value = config.laps || 100;

            displayStatusMessage('Quick preset applied.', 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } else {
            displayStatusMessage('Quick preset config error.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    function populateTimeDropdowns() {
        const hourSelect = document.getElementById('hourSelect');
        const minuteSelect = document.getElementById('minuteSelect');

        if (!hourSelect || !minuteSelect) return;

        // Populate hours (0-23)
        for (let i = 0; i <= 23; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.textContent = String(i).padStart(2, '0');
            hourSelect.appendChild(option);
        }

        // Populate minutes (00, 15, 30, 45)
        const minutes = ['00', '15', '30', '45'];
        minutes.forEach(minute => {
            const option = document.createElement('option');
            option.value = minute;
            option.textContent = minute;
            minuteSelect.appendChild(option);
        });
    }

    function setTimeToNow() {
        const hourSelect = document.getElementById('hourSelect');
        const minuteSelect = document.getElementById('minuteSelect');

        if (!hourSelect || !minuteSelect) return;

        const now = moment.utc();
        
        // Set exact current time
        hourSelect.value = String(now.hour()).padStart(2, '0');
        
        // For minutes, we need to create a temporary option for the exact current minute
        const currentMinute = String(now.minute()).padStart(2, '0');
        
        // Remove any previous temporary minute option
        const tempOption = minuteSelect.querySelector('.temp-minute');
        if (tempOption) {
            tempOption.remove();
        }
        
        // Add current minute as a temporary option if it's not one of the standard intervals
        if (!['00', '15', '30', '45'].includes(currentMinute)) {
            const option = document.createElement('option');
            option.value = currentMinute;
            option.textContent = currentMinute;
            option.className = 'temp-minute';
            minuteSelect.appendChild(option);
        }
        
        minuteSelect.value = currentMinute;
    }

    async function updateCarList() {
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
        const carDropdown = document.getElementById('carDropdown');
        const carStatusMessage = document.getElementById('carStatusMessage');
        const updateCarsButton = document.getElementById('updateCarsButton');

        if (!apiKey) {
            carStatusMessage.textContent = 'API Key Required';
            carStatusMessage.style.color = 'red';
            return;
        }

        carStatusMessage.textContent = 'Updating Cars...';
        carStatusMessage.style.color = '#aaa';
        carDropdown.disabled = true;
        updateCarsButton.disabled = true;

        try {
            const response = await GM.xmlHttpRequest({
                url: `https://api.torn.com/v2/user/?selections=enlistedcars&key=${apiKey}`, // Changed to v2 API and enlistedcars
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            if (data.error) {
                                carStatusMessage.textContent = `API Error: ${data.error.error}`;
                                carStatusMessage.style.color = 'red';
                            } else if (data.enlistedcars) { // Changed to check for enlistedcars
                                populateCarDropdown(data.enlistedcars);
                                carStatusMessage.textContent = 'Cars Updated';
                                carStatusMessage.style.color = '#efe';
                            } else {
                                carStatusMessage.textContent = 'No car data received';
                                carStatusMessage.style.color = 'orange';
                            }
                        } else {
                            carStatusMessage.textContent = `HTTP Error: ${response.status}`;
                            carStatusMessage.style.color = 'red';
                        }
                    } catch (e) {
                        console.error('Error parsing response:', e);
                        carStatusMessage.textContent = 'Error parsing car data';
                        carStatusMessage.style.color = 'red';
                    }
                    carDropdown.disabled = false;
                    updateCarsButton.disabled = false;
                    setTimeout(() => { carStatusMessage.textContent = ''; }, 3000);
                },
                onerror: function(error) {
                    console.error('Request failed:', error);
                    carStatusMessage.textContent = 'Request failed';
                    carStatusMessage.style.color = 'red';
                    carDropdown.disabled = false;
                    updateCarsButton.disabled = false;
                    setTimeout(() => { carStatusMessage.textContent = ''; }, 5000);
                }
            });
        } catch (error) {
            console.error('Error updating cars:', error);
            carStatusMessage.textContent = `Error: ${error.message}`;
            carStatusMessage.style.color = 'red';
            carDropdown.disabled = false;
            updateCarsButton.disabled = false;
            setTimeout(() => { carStatusMessage.textContent = ''; }, 5000);
        }
    }

    function populateCarDropdown(cars) {
        const carDropdown = document.getElementById('carDropdown');
        if (!carDropdown) return;

        carDropdown.innerHTML = '<option value="">Select a car...</option>';
        
        // Convert cars object to array and sort by name
        const sortedCars = Object.values(cars)
            .filter(car => car.leased !== '1')
            .sort((a, b) => {
                const nameA = a.name || a.item_name;
                const nameB = b.name || b.item_name;
                return nameA.localeCompare(nameB);
            });

        sortedCars.forEach(car => {
            const carName = car.name || car.item_name;
            const option = document.createElement('option');
            option.value = car.id;
            option.textContent = `${carName} (ID: ${car.id})`;
            carDropdown.appendChild(option);
        });
    }

    function updateCarDropdown() {
        updateCarList();
    }


    async function createRace() {
        const apiKey = GM_getValue(STORAGE_API_KEY, ''); // Use GM_getValue with the constant
        if (!apiKey) {
            displayStatusMessage('API Key is required to create race.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const trackId = document.getElementById('trackSelect').value;
        const laps = document.getElementById('lapsInput').value;
        const minDrivers = document.getElementById('minDriversInput').value;
        const maxDrivers = document.getElementById('maxDriversInput').value;
        const raceName = document.getElementById('raceNameInput').value;
        const password = document.getElementById('passwordInput').value;
        const betAmount = document.getElementById('betAmountInput').value;
        const raceHour = document.getElementById('hourSelect').value;
        const raceMinute = document.getElementById('minuteSelect').value;
        const carId = document.getElementById('carIdInput').value;

        let startTime = '';
        if (raceHour && raceMinute) {
            startTime = `${raceHour}:${raceMinute}`;
        }

        const params = new URLSearchParams();
        params.append('trackID', trackId);
        params.append('laps', laps);
        params.append('min_driver', minDrivers);
        params.append('max_driver', maxDrivers);
        if (raceName) params.append('name', raceName);
        if (password) params.append('password', password);
        if (betAmount > 0) params.append('bet_amount', betAmount);
        if (startTime) params.append('start_time', startTime);
        if (carId) params.append('vehicleID', carId);
        params.append('key', apiKey);
        params.append('v', 5);

        displayStatusMessage('Creating Race...', 'info');

        try {
            const response = await GM.xmlHttpRequest({
                url: 'https://api.torn.com/torn/racing/races',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: params.toString(),
                onload: function (response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if (data.error) {
                            displayStatusMessage(`API Error: ${data.error.error}`, 'error');
                        } else if (data.race_id) {
                            const raceLink = `https://www.torn.com/racing.php#/view/${data.race_id}`;
                            displayStatusMessage(`Race Created! <a href="${raceLink}" target="_blank">View Race</a>`, 'success');
                        } else {
                            displayStatusMessage('Race creation response error.', 'error');
                        }
                    } else {
                        displayStatusMessage(`HTTP Error: ${response.status}`, 'error');
                    }
                    setTimeout(() => displayStatusMessage('', ''), 5000);
                },
                onerror: function (error) {
                    displayStatusMessage(`Request failed: ${error.statusText}`, 'error');
                    setTimeout(() => displayStatusMessage('', ''), 5000);
                }
            });


        } catch (error) {
            displayStatusMessage(`Error creating race: ${error.message}`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 5000);
        }
    }

    function set_value(key, value) {
        try {
            if (key === STORAGE_API_KEY) {
                GM_setValue(key, value);
            } else {
                GM_setValue(key, JSON.stringify(value));
            }
        } catch (e) {
            console.error('Error saving value:', e);
        }
    }

    function get_value(key, defaultValue) {
        try {
            if (key === STORAGE_API_KEY) {
                return GM_getValue(key, defaultValue);
            }
            const value = GM_getValue(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Error reading value:', e);
            return defaultValue;
        }
    }

    // --- Start initialization ---
    init();
})();
