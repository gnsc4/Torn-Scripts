// ==UserScript==
// @name         Torn Race Manager
// @version      3.7.12
// @description  GUI to configure Torn racing parameters and create races with presets and quick launch buttons
// @author       GNSC4 [268863]
// @match        https://www.torn.com/loader.php?sid=racing*
// @match        https://www.torn.com/*
// @match        https://api.torn.com/*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/master/RaceConfiguration.raw.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/master/RaceConfiguration.raw.user.js
// @run-at       document-end
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @license      MIT
// @namespace    torn.raceconfigguipda
// ==/UserScript==

(function() {
    'use strict';

        // Check if we're on an attack page and exit early if true
        if (window.location.href.includes('sid=getInAttack') || 
        window.location.href.includes('sid=attack') || 
        window.location.href.includes('loader2.php') ||
        window.location.href.includes('sid=travel') ||
        window.location.pathname.includes('loader2.php')) {
        console.log('Drug Alerts: Not initializing on Attack page or Travel page.');
        return;
    }

    if (typeof document === 'undefined') {
        console.error('Document object not available yet. Script may not run correctly.');
        return;
    }

    const trackNames = {
        '6': 'Uptown',
        '7': 'Withdrawal',
        '8': 'Underdog',
        '9': 'Parkland',
        '10': 'Docks',
        '11': 'Commerce',
        '12': 'Two Islands',
        '15': 'Industrial',
        '16': 'Vector',
        '17': 'Mudpit',
        '18': 'Hammerhead',
        '19': 'Sewage',
        '20': 'Meltdown',
        '21': 'Speedway',
        '23': 'Stone Park',
        '24': 'Convict'
    };

    let guiInitialized = false;
    let domCheckAttempts = 0;
    const MAX_DOM_CHECK_ATTEMPTS = 100;
    const STORAGE_API_KEY = 'raceConfigAPIKey_release_NoGMf';

    const style = document.createElement('style');
    style.textContent = `
        #raceConfigGUI {
            position: fixed;
            top: 85px;
            left: 20px;
            background-color: #222;
            color: #ddd;
            border: 1px solid #555;
            padding: 25px;
            z-index: 999999 !important;
            font-family: Arial, sans-serif;
            border-radius: 10px;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            display: none;
            user-select: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
            scrollbar-width: thin;
            scrollbar-color: #444 #222;
        }

        /* Webkit Scrollbar Styling */
        #raceConfigGUI::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        #raceConfigGUI::-webkit-scrollbar-track {
            background: #222;
            border-radius: 4px;
        }

        #raceConfigGUI::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 4px;
            border: 2px solid #222;
        }

        #raceConfigGUI::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        #raceConfigGUI::-webkit-scrollbar-corner {
            background: #222;
        }

        #raceConfigGUI .api-key-section,
        #raceConfigGUI .config-section,
        #raceConfigGUI .car-select-section,
        #raceConfigGUI .presets-section {
            margin-bottom: 25px;
            padding: 15px;
            background-color: #2a2a2a;
            border-radius: 8px;
            border: 1px solid #444;
            position: relative;
            z-index: 999999 !important;
        }

        #raceConfigGUI h2,
        #raceConfigGUI h3,
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
        #raceConfigGUI input[type="password"],
        #raceConfigGUI input[type="date"],
        #raceConfigGUI input[type="time"],
        #raceConfigGUI select {
            padding: 8px 12px;
            margin: 5px 0;
            border: 1px solid #555;
            background-color: #333 !important;
            color: #eee !important;
            border-radius: 5px;
            width: calc(100% - 26px);
            font-size: 14px;
            -webkit-text-fill-color: #eee !important;
            transition: background-color 0.3s ease, border-color 0.3s ease;
            box-shadow: 0 0 0 1000px #333 inset !important;
        }

        #raceConfigGUI input:-webkit-autofill,
        #raceConfigGUI input:-webkit-autofill:hover,
        #raceConfigGUI input:-webkit-autofill:focus,
        #raceConfigGUI input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #333 inset !important;
            -webkit-text-fill-color: #eee !important;
            transition: background-color 0s 50000s;
            caret-color: #eee !important;
        }

        #raceConfigGUI input:focus,
        #raceConfigGUI select:focus {
            border-color: #666;
            outline: none;
            box-shadow: 0 0 5px rgba(85, 85, 85, 0.5);
        }

        #raceConfigGUI label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
            font-size: 14px;
        }

        .gui-button,
        .preset-button,
        #toggleRaceGUIButton,
        #createRaceButton,
        #closeGUIButton,
        #setNowButton {
            color: #ddd;
            background-color: #555;
            border: 1px solid #777;
            border-radius: 3px;
            padding: 8px 15px;
            cursor: pointer;
            margin: 5px;
            transition: background-color 0.3s ease;
            font-size: 0.9em;
            display: inline-block;
            text-decoration: none;
        }

        .gui-button:hover,
        .preset-button:hover,
        .remove-preset:hover,
        #toggleRaceGUIButton:hover,
        #createRaceButton:hover,
        #closeGUIButton:hover,
        #setNowButton:hover {
            background-color: #777;
        }

        #createRaceButton {
            background-color: #2d5a3f !important;
            border-color: #3d7a5f !important;
            font-size: 14px !important;
            padding: 12px 24px !important;
            margin: 15px auto !important;
            display: block !important;
            width: 80% !important;
        }

        #createRaceButton:hover {
            background-color: #3d7a5f !important;
        }

        .preset-buttons-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
            margin-bottom: 15px;
            padding: 5px;
            width: 100%;
            box-sizing: border-box;
        }

        .preset-button-container {
            position: relative;
            display: inline-flex;
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 10px;
            text-align: center;
        }

        .remove-preset {
            background-color: #955;
            color: #eee;
            padding: 0;
            border-radius: 50%;
            font-size: 14px;
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            text-decoration: none;
        }

        .remove-preset:hover {
            background-color: #c77;
            transform: scale(1.1);
            transition: all 0.2s ease;
            text-decoration: none;
        }

        #statusMessageBox {
            margin-top: 15px;
            padding: 12px;
            border-radius: 5px;
            font-size: 14px;
            text-align: center;
        }

        #statusMessageBox.success {
            background-color: #1a472a;
            border: 1px solid #2d5a3f;
        }

        #statusMessageBox.error {
            background-color: #5c1e1e;
            border: 1px solid #8b2e2e;
        }

        .driver-inputs-container {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }

        .driver-input-wrapper {
            flex: 1;
            min-width: 0;
            margin-right: 5px;
        }

        .driver-input-wrapper:last-child {
            margin-right: 0;
        }

        .preset-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
        }

        .api-key-wrapper {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 10px;
            margin: 0 auto;
            max-width: 400px;
            position: relative;
        }

        .api-key-wrapper label {
            display: inline;
            margin-bottom: 0;
            white-space: nowrap;
            min-width: 65px;
        }

        #closeGUIButton {
            position: absolute;
            top: -15px;
            right: -15px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: #555;
            color: #ddd;
            border: 1px solid #777;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            z-index: 1000000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        #closeGUIButton:hover {
            background-color: #777;
            transform: scale(1.1);
            transition: all 0.2s ease;
        }

        .banner-container {
            position: relative;
            margin-bottom: 25px;
            padding-top: 5px;
        }

        #raceBanner {
            width: 100%;
            height: auto;
            border-radius: 5px;
            display: block;
            margin-bottom: 15px;
        }

        #raceConfigGUI h2 {
            margin-top: 10px;
        }

        .show-password-btn {
            background: none;
            border: none;
            color: #777;
            cursor: pointer;
            padding: 5px;
            font-size: 14px;
            position: absolute;
            right: 80px;
            top: 50%;
            transform: translateY(-50%);
            transition: color 0.3s ease;
        }

        .show-password-btn:hover {
            color: #999;
        }
    `;

    style.textContent += `
        .quick-launch-container {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            max-width: 800px !important;
            gap: 5px !important;
            margin-top: 5px !important;
            margin-bottom: 10px !important;
            background-color: #2a2a2a !important;
            padding: 10px !important;
            border-radius: 5px !important;
            border: 1px solid #444 !important;
            z-index: 1 !important;
        }

        .quick-launch-container:not(:empty) {
            justify-content: flex-start !important;
        }

        .quick-launch-container .button-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            width: 100% !important;
        }

        .quick-launch-button {
            color: #fff !important;
            background-color: #555 !important;
            border: 1px solid #777 !important;
            border-radius: 3px !important;
            padding: 5px 10px !important;
            cursor: pointer !important;
            font-size: 0.9em !important;
            white-space: nowrap !important;
            width: auto !important;
            display: inline-block !important;
            transition: all 0.2s ease !important;
            margin: 2px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
            flex-shrink: 0 !important;
        }

        .quick-launch-button:hover {
            background-color: #3d7a5f !important;
            border-color: #777 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
        }

        .quick-launch-status {
            position: relative !important;
            margin-top: 5px !important;
            padding: 10px 15px !important;
            border-radius: 5px !important;
            color: #fff !important;
            font-size: 14px !important;
            opacity: 0 !important;
            transition: opacity 0.3s ease !important;
            text-align: center !important;
            width: calc(100% - 30px) !important;
            background-color: transparent !important;
            z-index: 999999 !important;
            margin-left: auto !important;
            margin-right: auto !important;
            display: block !important;
            min-height: 20px !important;
        }

        .quick-launch-status.success {
            background-color: #1a472a !important;
            border: 1px solid #2d5a3f !important;
            opacity: 1 !important;
        }

        .quick-launch-status.error {
            background-color: #5c1e1e !important;
            border: 1px solid #8b2e2e !important;
            opacity: 1 !important;
        }
        
        .quick-launch-status.info {
            background-color: #2a2a2a !important;
            border: 1px solid #444 !important;
            opacity: 1 !important;
        }

        .quick-launch-status.show {
            opacity: 1 !important;
        }
    `;

    style.textContent += `
        .race-alert {
            position: relative !important;
            display: inline-flex !important;
            align-items: center !important;
            margin-left: 10px !important;
            background-color: rgba(255, 68, 68, 0.8) !important;
            color: white !important;
            text-align: center !important;
            padding: 5px 10px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            user-select: none !important;
            vertical-align: middle !important;
            order: 2 !important;
        }

        .quick-launch-popup {
            position: absolute;
            top: 100%;
            right: 0;
            background-color: #222;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 10px;
            margin-top: 5px;
            z-index: 999999;
            min-width: 200px;
            max-width: 80vw;
            display: none;
            max-height: 60vh;
            overflow-y: auto;
        }

        .quick-launch-popup.left-aligned {
            right: auto;
            left: 0;
        }

        .quick-launch-popup.show {
            display: block;
        }
    `;

    style.textContent += `
        #raceToggleRow {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            width: 100% !important;
            flex-direction: row !important;
            position: relative !important;
            z-index: 100 !important;
            margin-bottom: 5px !important;
        }

        .button-container-wrapper {
            display: inline-flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin-right: auto !important;
        }
    `;

    style.textContent += `
        .time-config {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .time-selector {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .time-save-option {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 5px;
            padding: 5px;
            background: #333;
            border-radius: 4px;
        }

        .time-save-option input[type="checkbox"] {
            margin: 0;
        }
        
        .auto-join-section {
            margin-top: 15px;
        }

        .car-select-section .car-input-container {
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }

        .car-select-section .car-id-wrapper {
            flex: 0 0 30%;
        }

        .car-select-section .car-dropdown-wrapper {
            flex: 0 0 70%;
        }

        .car-select-section input,
        .car-select-section select {
            width: 100% !important;
            box-sizing: border-box;
        }
    `;

    style.textContent += `
        .filter-options {
            margin-bottom: 10px;
        }

        .filter-row {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin-bottom: 10px !important;
            padding: 10px;
            background: #2a2a2a;
            border-radius: 5px;
        }

        .filter-buttons {
            margin-left: auto;
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .filter-row select {
            min-width: 150px;
        }

        .filter-row .gui-button {
            padding: 5px 10px;
            height: 30px;
            margin-left: auto;
        }

        .gui-button.active {
            background-color: #2d5a3f !important;
            border-color: #3d7a5f !important;
        }

        .races-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .race-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #444;
        }

        .race-info {
            display: flex;
            gap: 15px;
        }

        .join-race-btn {
            padding: 4px 8px;
            background: #2d5a3f;
            border: 1px solid #3d7a5f;
            color: white;
            cursor: pointer;
            border-radius: 3px;
        }

        .join-race-btn:hover {
            background: #3d7a5f;
        }
    `;

    style.textContent += `
        .race-filter-controls {
            background-color: #2a2a2a !important;
            border: 1px solid #444 !important;
            border-radius: 8px !important;
            padding: 10px !important;
            margin-bottom: 15px !important;
        }
        
        .race-filter-controls .filter-row {
            background-color: transparent !important;
            padding: 0 !important;
            gap: 10px !important;
            flex-wrap: wrap !important;
            margin-bottom: 5px !important;
        }

        .race-filter-controls .filter-group {
            flex: 1 !important;
            min-width: 200px !important;
            margin-bottom: 5px !important;
        }
        
        .race-filter-controls .filter-group.laps-filter {
            min-width: 140px !important;
            display: flex !important;
            gap: 5px !important;
            align-items: center !important;
        }
        
        .race-filter-controls .filter-group.laps-filter input[type="number"] {
            width: 50px !important;
            padding: 8px 5px !important;
            text-align: center !important;
        }

        .race-filter-controls .filter-buttons {
            flex: 0 0 100% !important;
            display: flex !important;
            justify-content: flex-end !important;
            gap: 5px !important;
            margin-top: 5px !important;
        }

        .race-filter-controls .checkboxes {
            display: flex !important;
            flex-direction: row !important;
            gap: 15px !important;
            margin-bottom: 0 !important;
        }

        .race-filter-controls select,
        .race-filter-controls input[type="number"] {
            background-color: #333 !important;
            color: #eee !important;
            border: 1px solid #555 !important;
            border-radius: 4px !important;
            padding: 5px !important;
        }

        .race-filter-controls select:focus,
        .race-filter-controls input[type="number"]:focus {
            border-color: #666 !important;
            outline: none !important;
            box-shadow: 0 0 5px rgba(85, 85, 85, 0.5) !important;
        }

        .race-filter-controls label {
            color: #ccc !important;
            font-size: 0.9em !important;
        }

        .race-filter-controls .checkbox-option {
            color: #ccc !important;
        }

        .race-filter-controls .gui-button {
            background-color: #444 !important;
            color: #eee !important;
            border: 1px solid #555 !important;
        }

        .race-filter-controls .gui-button:hover {
            background-color: #555 !important;
        }

        .race-filter-controls .gui-button.active {
            background-color: #2d5a3f !important;
            border-color: #3d7a5f !important;
        }
    `;

    style.textContent += `
        .auto-join-buttons {
            display: flex !important;
            gap: 10px !important;
            margin-top: 10px !important;
            justify-content: center !important;
            position: relative !important;
            z-index: 999999 !important;
        }

        .auto-join-buttons button {
            flex: 1 !important;
            max-width: 200px !important;
            position: relative !important;
            z-index: 999999 !important;
        }

        #saveAutoJoinPreset {
            background-color: #2d5a3f !important;
            border-color: #3d7a5f !important;
            color: #fff !important;
            padding: 8px 15px !important;
            cursor: pointer !important;
            font-size: 0.9em !important;
            border-radius: 3px !important;
            transition: all 0.2s ease !important;
            display: block !important;
            position: relative !important;
            z-index: 999999 !important;
        }

        #saveAutoJoinPreset:hover {
            background-color: #3d7a5f !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
        }

        .preset-section-header {
            color: #fff !important;
            font-size: 14px !important;
            margin: 15px 0 5px 0 !important;
            padding: 5px 10px !important;
            background-color: #2a2a2a !important;
            border-radius: 3px !important;
            border: 1px solid #444 !important;
        }

        .auto-join-preset-container {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
            gap: 8px !important;
            margin: 10px 0 !important;
            padding: 5px !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .auto-join-preset-button {
            color: #ddd !important;
            background-color: #555 !important;
            border: 1px solid #777 !important;
            border-radius: 3px !important;
            padding: 8px 15px !important;
            cursor: pointer !important;
            font-size: 0.9em !important;
            transition: all 0.2s ease !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
            min-height: 32px !important;
            width: 100% !important;
        }

        .auto-join-preset-button:hover,
        .quick-launch-button:hover {
            background-color: #3d7a5f !important;
            border-color: #2d5a3f !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
        }
    `;

    style.textContent += `
        /* Enhanced button styles for full clickability and hover effects */
        #minimizeQuickLaunchButton {
            position: absolute !important;
            top: 2px !important;
            right: 2px !important;
            width: 30px !important;
            height: 30px !important;
            background-color: #444 !important;
            color: white !important;
            border: 1px solid #666 !important;
            border-radius: 4px !important;
            font-size: 16px !important;
            text-align: center !important;
            line-height: 30px !important;
            cursor: pointer !important;
            z-index: 1000000 !important; /* Increased z-index */
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
            user-select: none !important;
            pointer-events: auto !important; /* Ensure button is clickable */
        }

        #minimizeQuickLaunchButton:hover {
            background-color: #555 !important;
            border-color: #888 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.4) !important;
        }

        #minimizeQuickLaunchButton:active {
            transform: translateY(0px) !important;
            background-color: #333 !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.4) !important;
        }

        #minimizeQuickLaunchButtonContent {
            pointer-events: none !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        /* Minimized container overrides */
        .quick-launch-container.minimized {
            padding: 5px !important;
            max-height: 35px !important;
            overflow: hidden !important;
            position: relative !important;
        }

        .quick-launch-container.minimized .button-container,
        .quick-launch-container.minimized .auto-join-preset-container,
        .quick-launch-container.minimized .preset-section-header:not(:first-child) {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
        }

        /* Ensure first header stays visible */
        .quick-launch-container.minimized .preset-section-header:first-child {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            margin: 0 !important;
        }

        /* Make sure the section header doesn't interfere with the button */
        .quick-launch-container .preset-section-header:first-child {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding-right: 40px !important;
            z-index: 1 !important;
            pointer-events: none !important;
        }

        /* Add clickable areas for section headers */
        .quick-launch-container .preset-section-header:first-child > span {
            pointer-events: auto !important;
            display: inline-block !important;
        }
    `;

    style.textContent += `
        /* Additional force-override styles for minimized state */
        .quick-launch-container.minimized .button-container,
        .quick-launch-container.minimized .auto-join-preset-container,
        .quick-launch-container.minimized .preset-section-header:not(:first-child) {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
        }

        .quick-launch-container.minimized {
            padding: 5px !important;
            max-height: 35px !important;
            overflow: hidden !important;
            position: relative !important;
        }

        /* Ensure first header stays visible */
        .quick-launch-container.minimized .preset-section-header:first-child {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            margin: 0 !important;
        }

        /* Make sure minimize button is always visible */
        #minimizeQuickLaunchButton {
            display: block !important;
            z-index: 1000000 !important; /* Increased z-index */
            position: absolute !important;
            pointer-events: auto !important; /* Ensure button is clickable */
        }

        /* Ensure the container is always above the button */
        .quick-launch-container {
            z-index: 1 !important;
        }
    `;

    style.textContent += `
        .quick-launch-popup {
            position: absolute;
            top: 100%;
            right: 0;
            background-color: #222;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 10px;
            margin-top: 5px;
            z-index: 999999;
            min-width: 200px;
            max-width: 80vw;
            display: none;
            max-height: 60vh;
            overflow-y: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .quick-launch-popup.left-aligned {
            right: auto;
            left: 0;
        }

        .quick-launch-popup.top-aligned {
            top: auto;
            bottom: 100%;
            margin-top: 0;
            margin-bottom: 5px;
        }

        .quick-launch-popup.center-aligned {
            left: 50%;
            transform: translateX(-50%);
            right: auto;
        }
        
        /* Added styles for small screens */
        .quick-launch-popup.small-screen {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            max-width: 90vw !important;
            max-height: 70vh !important;
            width: auto !important;
            right: auto !important;
            bottom: auto !important;
            margin: 0 !important;
        }

        .quick-launch-popup.show {
            display: block;
        }
    `;

    style.textContent += `
        .official-races-section {
            margin-bottom: 25px;
            padding: 15px;
            background-color: #2a2a2a;
            border-radius: 8px;
            border: 1px solid #444;
            position: relative;
            z-index: 999999 !important;
        }

        .official-track-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
            margin: 10px 0;
        }

        .official-track-button {
            color: #ddd;
            background-color: #555;
            border: 1px solid #777;
            border-radius: 3px;
            padding: 8px 15px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.2s ease;
            text-align: center;
        }

        .official-track-button:hover {
            background-color: #3d7a5f;
            border-color: #2d5a3f;
        }

        .official-join-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 10px;
        }
        
        #officialRaceStatus {
            margin-top: 10px;
            padding: 8px;
            border-radius: 4px;
            text-align: center;
            display: none;
        }
        
        #officialRaceStatus.success {
            background-color: #1a472a;
            border: 1px solid #2d5a3f;
            display: block;
        }
        
        #officialRaceStatus.error {
            background-color: #5c1e1e;
            border: 1px solid #8b2e2e;
            display: block;
        }
        
        #officialRaceStatus.info {
            background-color: #2a2a2a;
            border: 1px solid #444;
            display: block;
        }
        
        .quick-launch-button.official {
            background-color: #444 !important;
            border-color: #666 !important;
        }
        
        .quick-launch-button.official:hover {
            background-color: #3d7a5f !important;
        }

        /* New styles for official race buttons */
        .official-race-button-container {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-top: 15px;
            margin-bottom: 15px;
            width: 100%;
        }

        .join-official-race-button {
            flex: 1;
            background-color: #2d5a3f !important;
            border: 1px solid #3d7a5f !important;
            color: #fff !important;
            border-radius: 4px !important;
            padding: 10px 15px !important;
            font-size: 14px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            text-align: center !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
            width: 100%;
        }

        .join-official-race-button:hover {
            background-color: #3d7a5f !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3) !important;
        }

        .save-official-preset-button {
            flex: 1;
            background-color: #555 !important;
            border: 1px solid #777 !important;
            color: #fff !important;
            border-radius: 4px !important;
            padding: 10px 15px !important;
            font-size: 14px !important;
            cursor: pointer !important;
            text-align: center !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
            width: 100%;
        }

        .save-official-preset-button:hover {
            background-color: #777 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3) !important;
        }

        .official-races-description {
            padding: 10px 15px;
            background-color: #333;
            border-radius: 5px;
            margin-bottom: 15px;
            text-align: center;
            color: #ddd;
            font-size: 14px;
            border: 1px solid #444;
        }
    `;

    style.textContent += `
        /* Unified button styles for all preset types */
        .quick-launch-button, 
        .auto-join-preset-button {
            color: #fff !important;
            background-color: #555 !important;
            border: 1px solid #777 !important;
            border-radius: 3px !important;
            padding: 5px 10px !important;
            cursor: pointer !important;
            font-size: 0.9em !important;
            white-space: nowrap !important;
            width: auto !important;
            display: inline-block !important;
            transition: all 0.2s ease !important;
            margin: 2px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
            flex-shrink: 0 !important;
            height: 32px !important; /* Fixed height for consistency */
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            min-height: auto !important;
            min-width: 0 !important; /* Allow button to shrink */
            max-width: none !important; /* Remove any max-width constraints */
            flex: 0 0 auto !important; /* Don't grow or shrink, size to content */
        }

        /* Container styling for all preset types */
        .button-container,
        .auto-join-preset-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            width: 100% !important;
            margin: 10px 0 !important;
            padding: 5px !important;
            box-sizing: border-box !important;
        }

        /* Preset button container consistent sizing */
        .preset-button-container {
            position: relative !important;
            display: inline-flex !important;
            flex-direction: column !important;
            align-items: flex-start !important; /* Align to start instead of stretch */
            margin-bottom: 10px !important;
            text-align: center !important;
            width: auto !important; /* Auto width based on content */
            flex: 0 0 auto !important; /* Don't grow or shrink */
        }

        /* Ensure official race buttons match styling */
        .auto-join-preset-button.official {
            background-color: #444 !important;
            border-color: #666 !important;
            color: #fff !important;
        }

        /* Hover effects consistent across all button types */
        .quick-launch-button:hover,
        .auto-join-preset-button:hover,
        .auto-join-preset-button.official:hover {
            background-color: #3d7a5f !important;
            border-color: #2d5a3f !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
        }
    `;

    document.head.appendChild(style);

    function init() {
        const isRacingPage = window.location.href.includes('sid=racing');

        initializeRaceAlerts();

        initializeAutoJoinSection();

        if (isRacingPage) {
            initializeRacingFeatures();
            initializeRaceFiltering(); 
            resumeAutoJoin();

            setTimeout(() => {
                initializeOfficialRacesSection();
            }, 1500);
        }
    }

    function initializeRaceAlerts() {
        const raceAlertEnabled = GM_getValue('raceAlertEnabled', false);

        const checkbox = document.getElementById('raceAlertEnabled');
        if (checkbox) {
            checkbox.checked = raceAlertEnabled;
        }

        if (raceAlertEnabled) {
            updateRaceAlert();
            if (!window.raceAlertInterval) {
                window.raceAlertInterval = setInterval(updateRaceAlert, 5000);
            }
        } else {
            removeRaceAlert();
        }

        if (!window.alertListenerAdded) {
            document.addEventListener('change', function(e) {
                if (e.target && e.target.id === 'raceAlertEnabled') {
                    const isEnabled = e.target.checked;
                    GM_setValue('raceAlertEnabled', isEnabled);
                    
                    if (isEnabled) {
                        updateRaceAlert();
                        if (!window.raceAlertInterval) {
                            window.raceAlertInterval = setInterval(updateRaceAlert, 5000);
                        }
                    } else {
                        removeRaceAlert();
                        if (window.raceAlertInterval) {
                            clearInterval(window.raceAlertInterval);
                            window.raceAlertInterval = null;
                        }
                    }
                }
            });
            window.alertListenerAdded = true;
        }
    }

    function initializeRacingFeatures() {
        const pollForElements = () => {
            const titleElement = document.querySelector('div.content-title > h4');
            if (titleElement) {
                createToggleButton();
                loadApiKey();
                loadPresets();

                initializeAutoJoinSection();

                setTimeout(() => {
                    updateCarList().then(() => {
                        updateQuickLaunchButtons();
                        console.log('Race Config GUI car list updated');
                    }).catch(err => {
                        console.warn('Failed to update car list, but continuing:', err);
                    });
                }, 1500);
                
                console.log('Race Config GUI initialized');
            } else if (domCheckAttempts < MAX_DOM_CHECK_ATTEMPTS) {
                domCheckAttempts++;
                setTimeout(pollForElements, 100);
            }
        };
    
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', pollForElements);
        } else {
            pollForElements();
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

    function createRaceConfigGUI() {
        let gui = document.createElement('div');
        gui.id = 'raceConfigGUI';
        gui.innerHTML = `
            <div class="banner-container">
                <button type="button" id="closeGUIButton" class="close-button" title="Close GUI">×</button>
                <button type="button" id="minimizeGUIButton" title="Minimize/Maximize GUI">_</button>
                <img id="raceBanner" src="https://www.torn.com/images/v2/racing/header/banners/976_classA.png" alt="Racing Banner">
                <h2>Race Configuration</h2>
            </div>

            <div class="api-key-section">
                <h4>Settings & API Key</h4>
                <div class="api-key-wrapper">
                    <label for="apiKeyInput">API Key:</label>
                    <input type="password"
                           id="apiKeyInput"
                           placeholder="Enter your API Key"
                           autocomplete="new-password"
                           autocapitalize="off"
                           autocorrect="off"
                           spellcheck="false"
                           style="flex: 1;">
                    <button type="button" class="show-password-btn" id="showApiKey" title="Show/Hide API Key">👁️</button>
                    <button id="saveApiKeyButton" class="gui-button">Save</button>
                </div>
                <div class="settings-toggle" style="margin-top: 10px;">
                    <input type="checkbox" id="raceAlertEnabled" />
                    <label for="raceAlertEnabled">Enable Race Status Alerts</label>
                </div>
            </div>

            <!-- New Official Races Section -->
            <div class="official-races-section config-section">
                <h4>Join Official Races</h4>
                <div class="car-input-container">
                    <div class="car-id-wrapper">
                        <label for="officialCarId">Car ID:</label>
                        <input type="text" id="officialCarId" placeholder="Enter Car ID">
                    </div>
                    <div class="car-dropdown-wrapper">
                        <label for="officialCarDropdown">Car:</label>
                        <select id="officialCarDropdown">
                            <option value="">Select a car...</option>
                        </select>
                    </div>
                </div>
                
                <div class="official-track-buttons" id="officialTrackButtons">
                    <!-- Will be populated with track buttons -->
                </div>
                
                <div id="officialRaceStatus"></div>
            </div>

            <div class="config-section">
                <h4>Race Settings</h4>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 2;">
                        <label for="trackSelect">Track:</label>
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
                    <div style="flex: 1;">
                        <label for="lapsInput">Laps:</label>
                        <input type="number" id="lapsInput" value="100" min="1" max="100">
                    </div>
                </div>

                <div class="config-params-section">
                    <div class="driver-inputs-container">
                        <div class="driver-input-wrapper">
                            <label for="minDriversInput">Min Drivers:</label>
                            <input type="number" id="minDriversInput" value="2" min="2" max="10">
                        </div>
                        <div class="driver-input-wrapper">
                            <label for="maxDriversInput">Max Drivers:</label>
                            <input type="number" id="maxDriversInput" value="2" min="2" max="10">
                        </div>
                        <div class="driver-input-wrapper">
                            <label for="betAmountInput">Bet: <span style="font-size: 0.8em; color: #ccc;">(Max 10M)</span></label>
                            <input type="number" id="betAmountInput" value="0" min="0" max="10000000">
                        </div>
                    </div>
                </div>

                <div><label for="raceNameInput">Race Name: <span style="font-size: 0.8em; color: #ccc;">(Required)</span></label>
                    <input type="text"
                           id="raceNameInput"
                           placeholder="Enter Race Name"
                           pattern="[A-Za-z0-9 ]+"
                           title="Only letters, numbers and spaces allowed"
                           autocomplete="off"
                           oninput="this.value = this.value.replace(/[^A-Za-z0-9 ]/g, '')"></div>

                <div><label for="passwordInput">Password: <span style="font-size: 0.8em; color: #ccc;">(Optional)</span></label>
                    <input type="text"
                           id="passwordInput"
                           placeholder="Race Password Optional"
                           autocomplete="off"
                           autocapitalize="off"
                           autocorrect="off"
                           spellcheck="false"></div>

                <div class="time-config">
                    <label>Race Start Time (TCT 24hr):</label>
                    <div class="time-selector">
                        <select id="hourSelect" style="width: auto; display: inline-block;"></select>
                        <span style="margin: 0 5px;">:</span>
                        <select id="minuteSelect" style="width: auto; display: inline-block;"></select>
                        <button id="setNowButton" class="gui-button" style="padding: 5px 10px; font-size: 0.8em; margin-left: 5px; vertical-align: baseline;">NOW</button>
                    </div>
                    <div class="time-save-option">
                        <input type="checkbox" id="saveTimeToPreset">
                        <label for="saveTimeToPreset">Save time to preset</label>
                    </div>
                </div>
            </div>


            <div class="car-select-section config-section">
                <h4>Car Selection</h4>
                <div class="car-input-container">
                    <div class="car-id-wrapper">
                        <label for="carIdInput">Car ID:</label>
                        <input type="text"
                               id="carIdInput"
                               placeholder="Enter Car ID"
                               style="margin-right: 5px;">
                    </div>
                    <div class="car-dropdown-wrapper">
                        <label for="carDropdown">Car:</label>
                        <select id="carDropdown">
                            <option value="">Select a car...</option>
                        </select>
                    </div>
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

            <div class="auto-join-section config-section">
                <h4>Auto Join Settings</h4>
                <div class="auto-join-config">
                    <div class="track-filter">
                        <label for="autoJoinTrack">Track:</label>
                        <select id="autoJoinTrack" multiple>
                            <option value="all" selected>All Tracks</option>
                            <option value="6">Uptown</option>
                            <option value="7">Withdrawal</option>
                            <option value="8">Underdog</option>
                            <option value="9">Parkland</option>
                            <option value="10">Docks</option>
                            <option value="11">Commerce</option>
                            <option value="12">Two Islands</option>
                            <option value="15">Industrial</option>
                            <option value="16">Vector</option>
                            <option value="17">Mudpit</option>
                            <option value="18">Hammerhead</option>
                            <option value="19">Sewage</option>
                            <option value="20">Meltdown</option>
                            <option value="21">Speedway</option>
                            <option value="23">Stone Park</option>
                            <option value="24">Convict</option>
                        </select>
                    </div>
                    <div class="laps-filter">
                        <label>Laps Range:</label>
                        <input type="number" id="minLaps" placeholder="Min" min="1" max="100">
                        <span>-</span>
                        <input type="number" id="maxLaps" placeholder="Max" min="1" max="100">
                    </div>
                    <div class="drivers-filter">
                        <label>Drivers Range:</label>
                        <input type="number" id="autoJoinMinDrivers" placeholder="Min" min="2" max="10">
                        <span>-</span>
                        <input type="number" id="autoJoinMaxDrivers" placeholder="Max" min="2" max="10">
                    </div>
                    <div class="car-filter">
                        <label for="autoJoinCar">Car to Use:</label>
                        <select id="autoJoinCar">
                            <option value="">Select a car...</option>
                        </select>
                    </div>
                    <div class="filters">
                        <label><input type="checkbox" id="hidePassworded"> Hide Passworded Races</label>
                        <label><input type="checkbox" id="hideBets"> Hide Races with Bets</label>
                        <label><input type="checkbox" id="hideFullRacesAutoJoin"> Hide Full Races</label>
                    </div>
                    <div class="auto-join-buttons">
                        <button id="startAutoJoin" class="gui-button">Start Auto-Join</button>
                        <button id="stopAutoJoin" class="gui-button" style="display: none;">Stop Auto-Join</button>
                        <button id="refreshCustomEvents" class="gui-button">Refresh Custom Events</button>
                    </div>
                </div>
            </div>

            <div class="action-buttons" style="text-align: center; margin-top: 15px;">
                <button id="createRaceButton" class="gui-button">Create Race</button>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 1.2em;">
                Script created by <a href="https://www.torn.com/profiles.php?XID=268863" target="_blank" style="color: #888; text-decoration: none;">GNSC4 [268863]</a><br>
                <a href="https://www.torn.com/forums.php#/p=threads&f=67&t=16454445&b=0&a=0" target="_blank" style="color: #888; text-decoration: none;">v3.7.12 Official Forum Link</a>
            </div>
        `;

        gui.addEventListener('touchstart', function(e) {

            if (e.target.closest('.drag-handle') || e.target.closest('button')) {
                e.stopPropagation();
            }
        }, { passive: true });

        gui.addEventListener('touchmove', function(e) {
        }, { passive: true });

        const isMinimized = GM_getValue('raceConfigGUIMinimized', false);
        if (isMinimized) {
            gui.classList.add('minimized');
        }

        return gui;
    }

    function initializeGUI(gui) {
        loadApiKey();
        populateTimeDropdowns();
        updateCarDropdown();
        loadPresets();

        initializeOfficialRacesSection();

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
        const minimizeGUIButton = document.getElementById('minimizeGUIButton');

        if (saveApiKeyButton) {
            saveApiKeyButton.addEventListener('click', () => {
                saveApiKey();
            });
        } else {
            console.error("Error: saveApiKeyButton element not found in initializeGUI");
        }

        if (setNowButton) {
            setNowButton.addEventListener('click', () => {
                setTimeToNow();
            });
        } else {
             console.error("Error: setNowButton element not found in initializeGUI");
        }

        if (updateCarsButton) {
            updateCarsButton.addEventListener('click', () => {
                updateCarList();
            });
        } else {
            console.error("Error: updateCarsButton element not found in initializeGUI");
        }

        if (carDropdown) {
            carDropdown.addEventListener('change', () => {
                carIdInput.value = carDropdown.value;
            });
        }  else {
            console.error("Error: carDropdown element not found in initializeGUI");
        }

        if (savePresetButton) {
            savePresetButton.addEventListener('click', () => {
                savePreset();
            });
        } else {
            console.error("Error: savePresetButton element not found in initializeGUI");
        }

        if (clearPresetsButton) {
            clearPresetsButton.addEventListener('click', () => {
                clearPresets();
            });
        } else {
            console.error("Error: clearPresetsButton element not found in initializeGUI");
        }

        if (createRaceButton) {
            createRaceButton.addEventListener('click', () => {
                createRace();
            });
        } else {
            console.error("Error: createRaceButton element not found in initializeGUI");
        }

        if (closeGUIButton) {
            closeGUIButton.addEventListener('click', () => {
                toggleRaceGUI();
            });
        } else {
            console.error("Error: closeGUIButton element not found in initializeGUI");
        }

        if (minimizeGUIButton) {
            minimizeGUIButton.parentNode.removeChild(minimizeGUIButton);
            console.log("Removed minimizeGUIButton as requested");
        } else {
            console.error("Error: minimizeGUIButton element not found in initializeGUI");
        }

        const titleElement = gui.querySelector('h2');
        if (titleElement) {
            titleElement.addEventListener('click', () => {
                if (gui.classList.contains('minimized')) {
                    toggleMinimizeGUI();
                }
            });
        }

        if (carDropdown && carIdInput) {
            carDropdown.addEventListener('change', () => {
                const value = carDropdown.value.trim();
                if (value && carDropdown.querySelector(`option[value="${value}"]`)) {
                    carDropdown.value = value;
                } else {
                    carDropdown.value = '';
                }
            });

            carIdInput.addEventListener('input', () => {
                const value = carIdInput.value.trim();
                if (value && carDropdown.querySelector(`option[value="${value}"]`)) {
                    carDropdown.value = value;
                } else {
                    carDropdown.value = '';
                }
            });
        }

        if (document.getElementById('showApiKey')) {
            document.getElementById('showApiKey').addEventListener('click', function() {
                const apiKeyInput = document.getElementById('apiKeyInput');
                const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
                apiKeyInput.setAttribute('type', type);
                this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
            });
        }

        const raceAlertCheckbox = document.getElementById('raceAlertEnabled');
        if (raceAlertCheckbox) {
            raceAlertCheckbox.checked = GM_getValue('raceAlertEnabled', false);
        }

        const mainCarDropdown = document.getElementById('carDropdown');
        const autoJoinCarDropdown = document.getElementById('autoJoinCar');
        const officialCarDropdown = document.getElementById('officialCarDropdown');
        
        if (mainCarDropdown) {
            mainCarDropdown.addEventListener('change', () => {
                if (autoJoinCarDropdown) autoJoinCarDropdown.innerHTML = mainCarDropdown.innerHTML;
                if (officialCarDropdown) officialCarDropdown.innerHTML = mainCarDropdown.innerHTML;
                
                if (autoJoinCarDropdown) autoJoinCarDropdown.value = mainCarDropdown.value;
                if (officialCarDropdown) officialCarDropdown.value = mainCarDropdown.value;
            });
        }

        if (officialCarDropdown) {
            officialCarDropdown.addEventListener('change', () => {
                document.getElementById('officialCarId').value = officialCarDropdown.value;
            });

            document.getElementById('officialCarId').addEventListener('input', () => {
                const value = document.getElementById('officialCarId').value.trim();
                if (value && officialCarDropdown.querySelector(`option[value="${value}"]`)) {
                    officialCarDropdown.value = value;
                } else {
                    officialCarDropdown.value = '';
                }
            });
        }

        const saveOfficialPresetButton = document.getElementById('saveOfficialPresetButton');
        if (saveOfficialPresetButton) {
            saveOfficialPresetButton.addEventListener('click', saveOfficialRacePreset);
        }

        const originalUpdateCarList = updateCarList;
        updateCarList = async function() {
            await originalUpdateCarList();
            if (autoJoinCarDropdown && mainCarDropdown) {
                autoJoinCarDropdown.innerHTML = mainCarDropdown.innerHTML;
            }
        };

        const startAutoJoinButton = document.getElementById('startAutoJoin');
        const stopAutoJoinButton = document.getElementById('stopAutoJoin');
        const refreshCustomEventsButton = document.getElementById('refreshCustomEvents');
        
        if (startAutoJoinButton && stopAutoJoinButton && refreshCustomEventsButton) {
            startAutoJoinButton.addEventListener('click', startAutoJoin);
            stopAutoJoinButton.addEventListener('click', stopAutoJoin);
            refreshCustomEventsButton.addEventListener('click', refreshCustomEventsList);

            const isAutoJoinActive = GM_getValue('autoJoinState', null) !== null;
            startAutoJoinButton.style.display = isAutoJoinActive ? 'none' : 'block';
            stopAutoJoinButton.style.display = isAutoJoinActive ? 'block' : 'none';
        }

        dragElement(gui);

        displayPresets();
        updateQuickPresetsDisplay();
        updateQuickLaunchButtons();

        displayStatusMessage('GUI Loaded', 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function createToggleButton() {
        const existingButton = document.getElementById('toggleRaceGUIButton');
        if (existingButton) {
            console.log('Toggle button already exists');
            return existingButton;
        }

        const titleElement = document.querySelector('div.content-title > h4');
        if (!titleElement) {
            console.error('Title element not found');
            return null;
        }

        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            margin-bottom: 10px !important;
        `;

        const topRow = document.createElement('div');
        topRow.id = 'raceToggleRow';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container-wrapper';

        const button = document.createElement('button');
        button.id = 'toggleRaceGUIButton';
        button.className = 'gui-button';
        button.textContent = 'Race Config';

        const quickLaunchContainer = document.createElement('div');
        quickLaunchContainer.id = 'quickLaunchContainer';
        quickLaunchContainer.className = 'quick-launch-container';

        buttonContainer.appendChild(button);
        topRow.appendChild(buttonContainer);
        wrapper.appendChild(topRow);
        wrapper.appendChild(quickLaunchContainer);
        
        titleElement.parentNode.insertBefore(wrapper, titleElement.nextSibling);

        button.addEventListener('click', () => {
            console.log('Toggle button clicked');
            toggleRaceGUI();
        });

        updateQuickLaunchButtons();
        return button;
    }

    function setBodyScroll(disable) {
        document.body.style.overflow = disable ? 'hidden' : '';
        document.body.style.position = disable ? 'fixed' : '';
        document.body.style.width = disable ? '100%' : '';
    }

    function toggleRaceGUI() {
        let gui = document.getElementById('raceConfigGUI');
        if (gui) {
            const isVisible = gui.style.display === 'none';
            gui.style.display = isVisible ? 'block' : 'none';
            setBodyScroll(isVisible);
            console.log('Toggling existing GUI:', gui.style.display);
        } else {
            console.log('Creating new GUI');
            gui = createRaceConfigGUI();
            document.body.appendChild(gui);
            initializeGUI(gui);
            gui.style.display = 'block';
            setBodyScroll(true);
        }
    }

    function dragElement(elmnt) {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 40px;
            height: 40px;
            cursor: move;
            background: transparent;
            pointer-events: all;
            z-index: 1000; /* Ensure it's above content but below close button */
        `;
        elmnt.insertBefore(dragHandle, elmnt.firstChild);

        // Add mobile-friendly scroll styles to the element
        elmnt.style.overscrollBehavior = 'contain';
        elmnt.style.webkitOverflowScrolling = 'touch';
        elmnt.style.touchAction = 'pan-y';

        const style = document.createElement('style');
        style.textContent = `
            #closeGUIButton {
                z-index: 1001;
                pointer-events: all !important;
            }
            .drag-handle {
                z-index: 1000;
            }
            /* Mobile-specific improvements */
            @media (max-width: 767px) {
                #raceConfigGUI {
                    -webkit-overflow-scrolling: touch !important;
                    overflow-y: auto !important;
                    touch-action: pan-y !important;
                    overscroll-behavior-y: contain !important;
                }
                /* Make scrollbar more visible on mobile */
                #raceConfigGUI::-webkit-scrollbar {
                    width: 10px !important;
                }
                #raceConfigGUI::-webkit-scrollbar-thumb {
                    background: #666 !important;
                    border-radius: 5px !important;
                    border: 2px solid #222 !important;
                }
            }
        `;
        document.head.appendChild(style);

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            if (e.type === 'touchstart') return;
            
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        dragHandle.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            pos3 = touch.clientX;
            pos4 = touch.clientY;

            dragHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
            dragHandle.addEventListener('touchend', handleTouchEnd, { passive: true });

            e.preventDefault();
        }, { passive: false });

        function handleTouchMove(e) {
            const touch = e.touches[0];

            pos1 = pos3 - touch.clientX;
            pos2 = pos4 - touch.clientY;
            pos3 = touch.clientX;
            pos4 = touch.clientY;

            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

            e.preventDefault();
        }

        function handleTouchEnd() {
            dragHandle.removeEventListener('touchmove', handleTouchMove);
            dragHandle.removeEventListener('touchend', handleTouchEnd);

            enforceWindowBoundaries(elmnt);
        }
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const elmntWidth = elmnt.offsetWidth;
            const elmntHeight = elmnt.offsetHeight;

            const padding = 10;
            const minLeft = padding;
            const maxLeft = windowWidth - elmntWidth - padding;
            const minTop = padding;
            const maxTop = windowHeight - elmntHeight - padding;

            newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            elmnt.style.top = newTop + "px";
            elmnt.style.left = newLeft + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;

            enforceWindowBoundaries(elmnt);
        }

        function enforceWindowBoundaries(element) {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const elmntWidth = element.offsetWidth;
            const elmntHeight = element.offsetHeight;
            const padding = 10;

            let { top, left } = element.getBoundingClientRect();

            if (left < padding) element.style.left = padding + "px";
            if (top < padding) element.style.top = padding + "px";
            if (left + elmntWidth > windowWidth - padding) {
                element.style.left = (windowWidth - elmntWidth - padding) + "px";
            }
            if (top + elmntHeight > windowHeight - padding) {
                element.style.top = (windowHeight - elmntHeight - padding) + "px";
            }
        }

        window.addEventListener('resize', () => enforceWindowBoundaries(elmnt));
    }

    function saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (!apiKeyInput) return;

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            displayStatusMessage('Please enter a valid API key', 'error');
            return;
        }

        try {
            GM_setValue(STORAGE_API_KEY, apiKey);
            displayStatusMessage('API Key Saved', 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            updateCarList();
        } catch (e) {
            console.error('Error saving API key:', e);
            displayStatusMessage('Failed to save API key', 'error');
        }
    }

    function loadApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (!apiKeyInput) return;

        try {
            const savedKey = GM_getValue(STORAGE_API_KEY, '');
            apiKeyInput.value = savedKey || '';
        } catch (e) {
            console.error('Error loading API key:', e);
        }
    }

    function displayStatusMessage(message, type = '', elementId = 'statusMessageBox') {
        const statusElement = document.getElementById(elementId);
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = '';

        if (type) {
            statusElement.classList.add(type);
        }

        statusElement.style.display = message ? 'block' : 'none';
        console.log(`[Status - ${type}]: ${message}`);
    }

    function savePreset() {
        const carDropdown = document.getElementById('carDropdown');
        const carId = document.getElementById('carIdInput').value;
        const raceName = document.getElementById('raceNameInput').value.trim();

        if (!raceName) {
            displayStatusMessage('Please enter a race name before saving preset.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        if (!carId || carDropdown.value === '') {
            displayStatusMessage('Please select a car before creating a preset.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);return;
        }

        const presetName = prompt("Enter a name for this preset:");
        if (!presetName) {
            displayStatusMessage('Preset name cannot be empty.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const carOption = carDropdown.querySelector(`option[value="${carId}"]`);
        const carName = carOption ? carOption.textContent.split(' (ID:')[0] : null;

        const saveTime = document.getElementById('saveTimeToPreset').checked;
        const presetData = {
            track: document.getElementById('trackSelect').value,
            laps: document.getElementById('lapsInput').value,
            minDrivers: document.getElementById('minDriversInput').value,
            maxDrivers: document.getElementById('maxDriversInput').value,
            raceName: document.getElementById('raceNameInput').value,
            password: document.getElementById('passwordInput').value,
            betAmount: document.getElementById('betAmountInput').value,
            hour: saveTime ? document.getElementById('hourSelect').value : null,
            minute: saveTime ? document.getElementById('minuteSelect').value : null,
            carId: carId,
            carName: carName,
            selectedCar: carDropdown.value,
            saveTime: saveTime
        };
        let presets = loadPresets();
        presets[presetName] = presetData;
        set_value('race_presets', presets);
        displayPresets();
        updateQuickPresetsDisplay();
        updateQuickLaunchButtons();
        displayStatusMessage(`Preset "${presetName}" saved.`, 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function getNextAvailableTime(hour, minute) {
        if (!hour || !minute) return null;
        
        const now = moment.utc();
        let targetTime = moment.utc().set({
            hour: parseInt(hour),
            minute: parseInt(minute),
            second: 0,
            millisecond: 0
        });

        if (targetTime.isSameOrBefore(now)) {
            targetTime = targetTime.add(1, 'day');
        }
        
        return targetTime;
    }

    function applyPreset(presetName) {
        const presets = loadPresets();
        const preset = presets[presetName];
        if (preset) {
            const trackSelect = document.getElementById('trackSelect');
            const lapsInput = document.getElementById('lapsInput');
            const minDriversInput = document.getElementById('minDriversInput');
            const maxDriversInput = document.getElementById('maxDriversInput');
            const raceNameInput = document.getElementById('raceNameInput');
            const passwordInput = document.getElementById('passwordInput');
            const betAmountInput = document.getElementById('betAmountInput');
            const hourSelect = document.getElementById('hourSelect');
            const minuteSelect = document.getElementById('minuteSelect');
            const carDropdown = document.getElementById('carDropdown');
            const carIdInput = document.getElementById('carIdInput');

            if (trackSelect) trackSelect.value = preset.track;
            if (lapsInput) lapsInput.value = preset.laps;
            if (minDriversInput) minDriversInput.value = preset.minDrivers;
            if (maxDriversInput) maxDriversInput.value = preset.maxDrivers;
            if (raceNameInput) raceNameInput.value = preset.raceName;
            if (passwordInput) passwordInput.value = preset.password;
            if (betAmountInput) betAmountInput.value = preset.betAmount;

            if (preset.saveTime && preset.hour && preset.minute) {
                const nextTime = getNextAvailableTime(preset.hour, preset.minute);
                if (nextTime) {
                    if (hourSelect) hourSelect.value = preset.hour;
                    if (minuteSelect) minuteSelect.value = preset.minute;
                }
            } else {
                if (hourSelect) hourSelect.value = '00';
                if (minuteSelect) minuteSelect.value = '00';
            }

            document.getElementById('saveTimeToPreset').checked = preset.saveTime || false;

            if (carDropdown && preset.selectedCar) {
                carDropdown.value = preset.selectedCar;
            }
            if (carIdInput) {
                carIdInput.value = preset.carId || preset.selectedCar || '';
            }

            displayStatusMessage(`Preset "${presetName}" applied.`, 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } else {
            displayStatusMessage(`Preset "${presetName}" not found.`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
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
            const preset = presets[presetName];
            const presetButtonContainer = document.createElement('div');
            presetButtonContainer.className = 'preset-button-container';

            const presetButton = document.createElement('button');
            presetButton.className = 'preset-button';

            const carName = preset.carName || 'Unknown Car';

            presetButton.innerHTML = `
                <div class="preset-title">${presetName}</div>
                <div class="preset-info">
                    ${trackNames[preset.track] || 'Unknown Track'}<br>
                    Laps: ${preset.laps}<br>
                    ${carName}
                </div>
            `;

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

            container.appendChild(presetButtonContainer);
        });
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
        updateQuickLaunchButtons();
        displayStatusMessage(`Preset "${presetName}" removed.`, 'success');
        setTimeout(() => displayStatusMessage('', ''), 3000);
    }

    function clearPresets() {
        if (confirm("Are you sure you want to clear ALL saved presets?")) {
            set_value('race_presets', {});
            displayPresets();
            updateQuickPresetsDisplay();
            updateQuickLaunchButtons();
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

    function updateQuickLaunchButtons() {
        const container = document.getElementById('quickLaunchContainer');
        if (!container) return;

        container.innerHTML = '';
        const presets = loadPresets();
        const autoJoinPresets = loadAutoJoinPresets();
        const officialPresets = loadOfficialRacePresets();

        if (Object.keys(presets).length === 0 && 
            Object.keys(autoJoinPresets).length === 0 &&
            Object.keys(officialPresets).length === 0) {
            container.style.display = 'none';
            return;
        }

        console.log('Creating minimize button');

        // Create a wrapper div for the minimize button to improve click target
        const minimizeButtonWrapper = document.createElement('div');
        minimizeButtonWrapper.id = 'minimizeQuickLaunchButtonWrapper';
        minimizeButtonWrapper.style.cssText = `
            position: absolute !important;
            top: 2px !important;
            right: 2px !important;
            width: 30px !important;
            height: 30px !important;
            z-index: 1000001 !important;
            cursor: pointer !important;
            pointer-events: auto !important;
        `;

        const minimizeButton = document.createElement('button');
        minimizeButton.id = 'minimizeQuickLaunchButton';
        minimizeButton.type = 'button';
        minimizeButton.title = 'Minimize Quick Launch Area';
        minimizeButton.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            background-color: #444 !important;
            color: white !important;
            border: 1px solid #666 !important;
            border-radius: 4px !important;
            font-size: 16px !important;
            cursor: pointer !important;
            z-index: 1000000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
            pointer-events: auto !important;
        `;

        const innerContent = document.createElement('div');
        innerContent.id = 'minimizeQuickLaunchButtonContent';
        innerContent.textContent = '_';
        innerContent.style.cssText = `
            pointer-events: none !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;
        
        minimizeButton.appendChild(innerContent);
        minimizeButtonWrapper.appendChild(minimizeButton);
        container.appendChild(minimizeButtonWrapper);
        console.log('Minimize button added to container');

        // Rest of container creation
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        const statusDiv = document.createElement('div');
        statusDiv.className = 'quick-launch-status';

        const quickLaunchHeader = document.createElement('div');
        quickLaunchHeader.className = 'preset-section-header';
        quickLaunchHeader.textContent = 'Quick Launch Presets';

        const autoJoinHeader = document.createElement('div');
        autoJoinHeader.className = 'preset-section-header';
        autoJoinHeader.textContent = 'Auto Join Presets';

        const officialRaceHeader = document.createElement('div');
        officialRaceHeader.className = 'preset-section-header';
        officialRaceHeader.textContent = 'Official Race Presets';

        const autoJoinContainer = document.createElement('div');
        autoJoinContainer.className = 'button-container';
        
        const officialRaceContainer = document.createElement('div');
        officialRaceContainer.className = 'button-container';

        container.appendChild(quickLaunchHeader);
        container.appendChild(buttonContainer);
        container.appendChild(autoJoinHeader);
        container.appendChild(autoJoinContainer);
        container.appendChild(officialRaceHeader);
        container.appendChild(officialRaceContainer);
        container.appendChild(statusDiv);

        Object.entries(presets).forEach(([name, preset]) => {
            const button = document.createElement('button');
            button.className = 'quick-launch-button';
            button.textContent = name;

            const carName = preset.carName || `Car ID: ${preset.carId}`;

            const tooltipInfo = [
                `${name}`,
                `Track: ${trackNames[preset.track] || 'Unknown Track'}`,
                `Car: ${carName}`,
                `Laps: ${preset.laps}`,
                `Drivers: ${preset.minDrivers}-${preset.maxDrivers}`,
                `Password: ${preset.password ? 'Yes' : 'No'}`,
                preset.betAmount > 0 ? `Bet: $${Number(preset.betAmount).toLocaleString()}` : null
            ].filter(Boolean).join('\n');

            button.title = tooltipInfo;

            button.addEventListener('click', async () => {
                await createRaceFromPreset(preset);
            });
            buttonContainer.appendChild(button);
        });

        Object.entries(autoJoinPresets).forEach(([name, preset]) => {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'preset-button-container';
            
            const button = document.createElement('button');
            button.className = 'quick-launch-button';
            button.textContent = name;
            button.style.width = 'auto';
            
            const carInfo = preset.carName ? 
                `${preset.carName} (ID: ${preset.selectedCarId})` : 
                `${preset.selectedCarId}`;
                
            button.title = `Auto-join preset: ${name}\nTrack: ${preset.track}\nLaps: ${preset.minLaps}-${preset.maxLaps}\nCar: ${carInfo}`;
            
            button.addEventListener('click', () => {
                applyAutoJoinPreset(preset);
            });

            const removeButton = document.createElement('a');
            removeButton.className = 'remove-preset';
            removeButton.href = '#';
            removeButton.textContent = '×';
            removeButton.title = `Remove auto-join preset: ${name}`;
            removeButton.style.cssText = `
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                background-color: #955 !important;
                color: #eee !important;
                width: 20px !important;
                height: 20px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-decoration: none !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                transition: all 0.2s ease !important;
                z-index: 100 !important;
            `;
            
            removeButton.addEventListener('click', (event) => {
                event.preventDefault();
                removeAutoJoinPreset(name);
            });
            
            buttonWrapper.appendChild(button);
            buttonWrapper.appendChild(removeButton);
            autoJoinContainer.appendChild(buttonWrapper);
        });

        Object.entries(officialPresets).forEach(([name, preset]) => {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'preset-button-container';
            
            const button = document.createElement('button');
            button.className = 'quick-launch-button official';
            button.textContent = name;
            button.style.width = 'auto';
            
            const carInfo = preset.carName ? 
                `${preset.carName} (ID: ${preset.carId})` : 
                `Car ID: ${preset.carId}`;

            let trackNames = "Auto-assigned";
            if (preset.tracks && Array.isArray(preset.tracks)) {
                trackNames = preset.tracks.map(t => t.name).join(', ');
            }
            
            button.title = `Official race preset: ${name}\nTracks: ${trackNames}\nCar: ${carInfo}`;
            
            // Use executeOfficialRacePreset directly to avoid GUI dependencies
            button.addEventListener('click', function() {
                // Show feedback directly without going through showOfficialRaceTrackSelector
                displayQuickLaunchStatus(`Joining official race with ${carInfo}...`, 'info');
                executeOfficialRacePreset(preset);
            });

            const removeButton = document.createElement('a');
            removeButton.className = 'remove-preset';
            removeButton.textContent = '×';
            removeButton.style.cssText = `
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                background-color: #955 !important;
                color: #eee !important;
                width: 20px !important;
                height: 20px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-decoration: none !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
                transition: all 0.2s ease !important;
                z-index: 100 !important;
            `;
            
            removeButton.addEventListener('click', function(event) {
                event.preventDefault();
                removeOfficialRacePreset(name);
            });
            
            buttonWrapper.appendChild(button);
            buttonWrapper.appendChild(removeButton);
            officialRaceContainer.appendChild(buttonWrapper);
        });

        container.style.display = 'flex';

        // Replace the button click event handler with a more robust version
        const addButtonListeners = () => {
            const btnWrapper = document.getElementById('minimizeQuickLaunchButtonWrapper');
            const btn = document.getElementById('minimizeQuickLaunchButton');
            if (!btnWrapper || !btn) {
                console.error('Could not find minimize button or wrapper');
                return;
            }

            // Remove existing listeners to prevent duplication
            const newWrapper = btnWrapper.cloneNode(true);
            if (btnWrapper.parentNode) {
                btnWrapper.parentNode.replaceChild(newWrapper, btnWrapper);
            }

            // Add event listeners to the wrapper instead of the button
            newWrapper.addEventListener('click', function(e) {
                console.log('Minimize button wrapper clicked');
                e.preventDefault();
                e.stopPropagation();
                toggleQuickLaunchMinimize();
            });

            newWrapper.addEventListener('touchstart', function(e) {
                console.log('Minimize button wrapper touched');
                e.preventDefault();
                e.stopPropagation(); 
                toggleQuickLaunchMinimize();
            }, { passive: false });

            // Also add to button as a fallback
            const newBtn = newWrapper.querySelector('#minimizeQuickLaunchButton');
            if (newBtn) {
                newBtn.addEventListener('click', function(e) {
                    console.log('Minimize button clicked directly');
                    e.preventDefault();
                    e.stopPropagation();
                    toggleQuickLaunchMinimize();
                });

                newBtn.addEventListener('touchstart', function(e) {
                    console.log('Minimize button touched directly');
                    e.preventDefault();
                    e.stopPropagation();
                    toggleQuickLaunchMinimize();
                }, { passive: false });
            }
        };

        addButtonListeners();
        setTimeout(addButtonListeners, 100); // Double check after a short delay

        // Apply minimized state if needed
        const minimizedState = GM_getValue('quickLaunchMinimized', false);
        if (minimizedState === true) {
            container.classList.add('minimized');
            const btnContent = document.getElementById('minimizeQuickLaunchButtonContent');
            if (btnContent) btnContent.textContent = '□';
            const minimizeBtn = document.getElementById('minimizeQuickLaunchButton');
            if (minimizeBtn) minimizeBtn.title = 'Expand Quick Launch Area';

            // Force container height and styling
            container.style.cssText += "max-height: 35px !important; overflow: hidden !important;";
            
            // Hide these elements specifically when minimized
            const buttonContainer = container.querySelector('.button-container');
            const autoJoinContainer = container.querySelector('.auto-join-preset-container');
            const otherHeaders = container.querySelectorAll('.preset-section-header:not(:first-child)');
            
            if (buttonContainer) buttonContainer.style.display = 'none';
            if (autoJoinContainer) autoJoinContainer.style.display = 'none';
            otherHeaders.forEach(header => header.style.display = 'none');
        }
    }

    function toggleQuickLaunchMinimize() {
        console.log('toggleQuickLaunchMinimize called');
        const container = document.getElementById('quickLaunchContainer');
        const minimizeButton = document.getElementById('minimizeQuickLaunchButton');
        const buttonContent = document.getElementById('minimizeQuickLaunchButtonContent');
        
        if (!container) {
            console.error('Container not found');
            return;
        }
        
        const isCurrentlyMinimized = container.classList.contains('minimized');
        console.log('Current state:', isCurrentlyMinimized ? 'minimized' : 'maximized');
        
        if (isCurrentlyMinimized) {
            container.classList.remove('minimized');
            if (buttonContent) buttonContent.textContent = '_';
            if (minimizeButton) minimizeButton.title = 'Minimize Quick Launch Area';
            GM_setValue('quickLaunchMinimized', false);

            // Show these elements when maximized
            const buttonContainer = container.querySelector('.button-container');
            const autoJoinContainer = container.querySelector('.auto-join-preset-container');
            const otherHeaders = container.querySelectorAll('.preset-section-header:not(:first-child)');
            
            if (buttonContainer) buttonContainer.style.display = 'flex';
            if (autoJoinContainer) autoJoinContainer.style.display = 'grid';
            otherHeaders.forEach(header => header.style.display = 'block');
            
            // Reset height constraints
            container.style.maxHeight = 'none';
            container.style.padding = '10px';
            container.style.overflow = 'visible';
            
            console.log('Container maximized');
        } else {
            container.classList.add('minimized');
            if (buttonContent) buttonContent.textContent = '□';
            if (minimizeButton) minimizeButton.title = 'Expand Quick Launch Area';
            GM_setValue('quickLaunchMinimized', true);

            // Hide these elements when minimized
            const buttonContainer = container.querySelector('.button-container');
            const autoJoinContainer = container.querySelector('.auto-join-preset-container');
            const otherHeaders = container.querySelectorAll('.preset-section-header:not(:first-child)');
            
            if (buttonContainer) buttonContainer.style.display = 'none';
            if (autoJoinContainer) autoJoinContainer.style.display = 'none';
            otherHeaders.forEach(header => header.style.display = 'none');
            
            // Force minimized height
            container.style.maxHeight = '35px';
            container.style.padding = '5px';
            container.style.overflow = 'hidden';
            
            console.log('Container minimized');
        }

        // Additional force override for minimize state
        if (!isCurrentlyMinimized) {
            container.style.cssText += "max-height: 35px !important; overflow: hidden !important;";
        } else {
            container.style.cssText += "max-height: none !important; overflow: visible !important;";
        }
    }


    function displayQuickLaunchStatus(message, type = '') {
        const statusElement = document.querySelector('.quick-launch-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = 'quick-launch-status';
        
        if (type) {
            statusElement.classList.add(type);
            statusElement.classList.add('show');
        }
        
        // If container is minimized, make sure status is still visible
        if (message && message.trim() !== '') {
            const container = document.getElementById('quickLaunchContainer');
            if (container && container.classList.contains('minimized')) {
                statusElement.style.display = 'block';
                
                // Adjust container height to fit status message
                setTimeout(() => {
                    const statusHeight = statusElement.scrollHeight || 20;
                    container.style.maxHeight = `${Math.max(35, statusHeight + 40)}px`;
                    container.style.height = `${Math.max(35, statusHeight + 40)}px`;
                }, 10);
            }
        }

        displayStatusMessage(message, type);
    }

    function saveAutoJoinPreset() {
        const presetName = prompt("Enter a name for this auto-join preset:");
        if (!presetName) return;

        const selectedCarId = document.getElementById('autoJoinCar').value;
        const selectedCarDropdown = document.getElementById('autoJoinCar');
        let carName = "Unknown Car";

        if (selectedCarDropdown && selectedCarId) {
            const selectedOption = selectedCarDropdown.querySelector(`option[value="${selectedCarId}"]`);
            if (selectedOption) {
                carName = selectedOption.textContent.split(' (ID:')[0];
            }
        }
    
        const preset = {
            track: document.getElementById('autoJoinTrack').value,
            minLaps: document.getElementById('minLaps').value,
            maxLaps: document.getElementById('maxLaps').value,
            minDrivers: document.getElementById('autoJoinMinDrivers')?.value || '',
            maxDrivers: document.getElementById('autoJoinMaxDrivers')?.value || '',
            selectedCarId: selectedCarId,
            carName: carName,
            hidePassworded: document.getElementById('hidePassworded').checked,
            hideBets: document.getElementById('hideBets').checked,
            hideFullRaces: document.getElementById('hideFullRacesAutoJoin')?.checked || false
        };

        console.log('[DEBUG] Saving auto-join preset with car:', { id: selectedCarId, name: carName });
    
        const presets = loadAutoJoinPresets();
        presets[presetName] = preset;
        GM_setValue('autoJoinPresets', JSON.stringify(presets));
        updateQuickLaunchButtons();
        displayStatusMessage('Auto-join preset saved', 'success');
    }

    function loadAutoJoinPresets() {
        try {
            return JSON.parse(GM_getValue('autoJoinPresets', '{}'));
        } catch (e) {
            console.error('Error loading auto-join presets:', e);
            return {};
        }
    }

    function waitForElements(elementIds, timeout = 5000) {
        return new Promise((resolve) => {
            const elements = {};
            let checkCount = 0;
            const maxChecks = 50;
            const checkInterval = timeout / maxChecks;

            const checkElements = () => {
                let allFound = true;
                elementIds.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        elements[id] = element;
                    } else {
                        allFound = false;
                    }
                });

                if (allFound) {
                    resolve(elements);
                } else if (checkCount < maxChecks) {
                    checkCount++;
                    setTimeout(checkElements, checkInterval);
                } else {
                    resolve(null);
                }
            };

            checkElements();
        });
    }

    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver((mutations, obs) => {
                if (document.querySelector(selector)) {
                    obs.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }, timeout);
        });
    }

    async function applyAutoJoinPreset(preset) {
        try {
            console.log('[DEBUG] Switching to Custom Events tab');
            const tabSwitched = await ensureCustomEventsTab();
            if (!tabSwitched) {
                console.log('[DEBUG] Failed to switch to Custom Events tab');
                displayStatusMessage('Failed to load Custom Events tab', 'error');
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            const findOrCreateAutoJoinInterface = () => {
                console.log('[DEBUG] Looking for or creating auto-join interface');

                let autoJoinTrack = document.getElementById('autoJoinTrack');
                let minLaps = document.getElementById('minLaps');
                let maxLaps = document.getElementById('maxLaps');
                let autoJoinCar = document.getElementById('autoJoinCar');
                let hidePassworded = document.getElementById('hidePassworded');
                let hideBets = document.getElementById('hideBets');
                let autoJoinMinDrivers = document.getElementById('autoJoinMinDrivers');
                let autoJoinMaxDrivers = document.getElementById('autoJoinMaxDrivers');
                let hideFullRaces = document.getElementById('hideFullRacesAutoJoin');

                if (!autoJoinTrack || !minLaps || !maxLaps || !autoJoinCar || !hidePassworded || !hideBets || !autoJoinMinDrivers || !autoJoinMaxDrivers || !hideFullRaces) {
                    console.log('[DEBUG] Creating auto-join interface elements');

                    const racesList = document.querySelector('.custom_events, .events-list, .races-list');
                    const filtersSection = document.querySelector('.race-filter-section');
                    
                    if (!racesList && !filtersSection) {
                        console.error('[DEBUG] Cannot find suitable container for auto-join interface');
                        return null;
                    }
                    
                    const container = document.createElement('div');
                    container.className = 'auto-join-interface race-filter-controls';
                    container.style.cssText = `
                        margin-top: 10px !important;
                        padding: 10px !important;
                        background-color: #2a2a2a !important;
                        border: 1px solid #444 !important;
                        border-radius: 8px !important;
                    `;
                    
                    container.innerHTML = `
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="autoJoinTrack">Track:</label>
                                <select id="autoJoinTrack">
                                    <option value="all" selected>All Tracks</option>
                                    <option value="6">Uptown</option>
                                    <option value="7">Withdrawal</option>
                                    <option value="8">Underdog</option>
                                    <option value="9">Parkland</option>
                                    <option value="10">Docks</option>
                                    <option value="11">Commerce</option>
                                    <option value="12">Two Islands</option>
                                    <option value="15">Industrial</option>
                                    <option value="16">Vector</option>
                                    <option value="17">Mudpit</option>
                                    <option value="18">Hammerhead</option>
                                    <option value="19">Sewage</option>
                                    <option value="20">Meltdown</option>
                                    <option value="21">Speedway</option>
                                    <option value="23">Stone Park</option>
                                    <option value="24">Convict</option>
                                </select>
                            </div>
                            <div class="filter-group laps-filter">
                                <label>Laps Range:</label>
                                <input type="number" id="minLaps" placeholder="Min" min="1" max="100">
                                <span>-</span>
                                <input type="number" id="maxLaps" placeholder="Max" min="1" max="100">
                            </div>
                            <div class="filter-group drivers-filter">
                                <label>Drivers Range:</label>
                                <input type="number" id="autoJoinMinDrivers" placeholder="Min" min="2" max="10">
                                <span>-</span>
                                <input type="number" id="autoJoinMaxDrivers" placeholder="Max" min="2" max="10">
                            </div>
                        </div>
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="autoJoinCar">Car to Use:</label>
                                <select id="autoJoinCar">
                                    <option value="">Select a car...</option>
                                    ${document.getElementById('carDropdown')?.innerHTML || ''}
                                </select>
                            </div>
                            <div class="filter-group checkboxes">
                                <div class="checkbox-option">
                                    <label><input type="checkbox" id="hidePassworded"> Hide Passworded Races</label>
                                </div>
                                <div class="checkbox-option">
                                    <label><input type="checkbox" id="hideBets"> Hide Races with Bets</label>
                                </div>
                                <div class="checkbox-option">
                                    <label><input type="checkbox" id="hideFullRacesAutoJoin"> Hide Full Races</label>
                                </div>
                            </div>
                        </div>
                        <div class="filter-buttons">
                            <button id="autoJoinNowButton" class="gui-button">Join Now</button>
                        </div>
                    `;

                    if (filtersSection) {
                        filtersSection.insertAdjacentElement('afterend', container);
                    } else if (racesList) {
                        racesList.insertAdjacentElement('beforebegin', container);
                    }

                    autoJoinTrack = document.getElementById('autoJoinTrack');
                    minLaps = document.getElementById('minLaps');
                    maxLaps = document.getElementById('maxLaps');
                    autoJoinCar = document.getElementById('autoJoinCar');
                    hidePassworded = document.getElementById('hidePassworded');
                    hideBets = document.getElementById('hideBets');
                    autoJoinMinDrivers = document.getElementById('autoJoinMinDrivers');
                    autoJoinMaxDrivers = document.getElementById('autoJoinMaxDrivers');
                    hideFullRaces = document.getElementById('hideFullRacesAutoJoin');

                    const joinButton = document.getElementById('autoJoinNowButton');
                    if (joinButton) {
                        joinButton.addEventListener('click', startAutoJoin);
                    }
                } else {
                    console.log('[DEBUG] All auto-join elements already exist');
                }

                return {
                    autoJoinTrack,
                    minLaps,
                    maxLaps,
                    autoJoinCar,
                    hidePassworded,
                    hideBets,
                    autoJoinMinDrivers,
                    autoJoinMaxDrivers,
                    hideFullRaces
                };
            };

            const elements = findOrCreateAutoJoinInterface();
            
            if (!elements) {
                console.error('[DEBUG] Failed to create auto-join interface');
                displayStatusMessage('Unable to create auto-join interface', 'error');
                return;
            }

            console.log('[DEBUG] Auto-join preset car information:', { 
                selectedCarId: preset.selectedCarId,
                carName: preset.carName || 'Unknown Car'
            });

            console.log('[DEBUG] Setting auto-join values');
            if (elements.autoJoinTrack) elements.autoJoinTrack.value = preset.track;
            if (elements.minLaps) elements.minLaps.value = preset.minLaps;
            if (elements.maxLaps) elements.maxLaps.value = preset.maxLaps;
            if (elements.hidePassworded) elements.hidePassworded.checked = preset.hidePassworded;
            if (elements.hideBets) elements.hideBets.checked = preset.hideBets;
            if (elements.autoJoinMinDrivers) elements.autoJoinMinDrivers.value = preset.minDrivers;
            if (elements.autoJoinMaxDrivers) elements.autoJoinMaxDrivers.value = preset.maxDrivers;
            if (elements.hideFullRaces) elements.hideFullRaces.checked = preset.hideFullRaces;

            if (elements.autoJoinCar && preset.selectedCarId) {
                const existingOption = elements.autoJoinCar.querySelector(`option[value="${preset.selectedCarId}"]`);
                
                if (existingOption) {
                    elements.autoJoinCar.value = preset.selectedCarId;
                    console.log('[DEBUG] Found car in dropdown, setting value:', preset.selectedCarId);
                } else {
                    console.log('[DEBUG] Car not found in dropdown, creating option for:', preset.selectedCarId);
                    
                    const newOption = document.createElement('option');
                    newOption.value = preset.selectedCarId;
                    newOption.textContent = preset.carName ? 
                        `${preset.carName} (ID: ${preset.selectedCarId})` : 
                        `Car ID: ${preset.selectedCarId}`;

                    if (elements.autoJoinCar.options.length > 0) {
                        elements.autoJoinCar.insertBefore(newOption, elements.autoJoinCar.options[1]);
                    } else {
                        elements.autoJoinCar.appendChild(newOption);
                    }

                    elements.autoJoinCar.value = preset.selectedCarId;
                }
            } else {
                console.log('[DEBUG] No car ID in preset or car dropdown not found');
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('[DEBUG] Starting auto-join');
            startAutoJoin();
        } catch (error) {
            console.error('[DEBUG] Error in applyAutoJoinPreset:', error);
            displayStatusMessage('Error applying auto-join preset', 'error');
        }
    }

    async function ensureCustomEventsTab() {
        return new Promise((resolve) => {
            const customEventsTab = document.querySelector('a[href*="tab=customrace"]');
            const isCustomEventsActive = document.querySelector('li.active .icon.custom-events');
            
            if (!isCustomEventsActive && customEventsTab) {
                console.log('[DEBUG] Custom Events tab not active, switching...');

                const observer = new MutationObserver((mutations, obs) => {
                    const racesList = document.querySelector('.custom_events, .events-list, .races-list');
                    if (racesList) {
                        console.log('[DEBUG] Race list loaded after tab switch');
                        obs.disconnect();

                        setTimeout(() => {
                            const tabIcon = customEventsTab.querySelector('.icons, .icon');
                            if (tabIcon) {
                                tabIcon.click();
                                console.log('[DEBUG] Clicked custom events tab icon');
                            }
                            setTimeout(() => resolve(true), 1000);
                        }, 1000);
                    }
                });

                observer.observe(document.getElementById('racingMainContainer') || document.body, {
                    childList: true,
                    subtree: true
                });

                customEventsTab.click();
                const tabIcon = customEventsTab.querySelector('.icons, .icon');
                if (tabIcon) {
                    setTimeout(() => tabIcon.click(), 100);
                }

                setTimeout(() => {
                    observer.disconnect();
                    resolve(false);
                }, 10000);
            } else {
                resolve(true);
            }
        });
    }

    function populateTimeDropdowns() {
        const hourSelect = document.getElementById('hourSelect');
        const minuteSelect = document.getElementById('minuteSelect');

        if (!hourSelect || !minuteSelect) return;

        for (let i = 0; i <= 23; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.textContent = String(i).padStart(2, '0');
            hourSelect.appendChild(option);
        }

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
        const currentHour = now.hour();
        const currentMinute = now.minute();

        hourSelect.value = String(currentHour).padStart(2, '0');

        let roundedMinute = Math.round(currentMinute / 15) * 15;
        if (roundedMinute === 60) {
            roundedMinute = 0;
        }

        const tempOption = minuteSelect.querySelector('.temp-minute');
        if (tempOption) {
            tempOption.remove();
        }

        if (![0, 15, 30, 45].includes(currentMinute)) {
            const option = document.createElement('option');
            option.value = String(currentMinute).padStart(2, '0');
            option.textContent = String(currentMinute).padStart(2, '0');
            option.className = 'temp-minute';
            minuteSelect.appendChild(option);
            minuteSelect.value = String(currentMinute).padStart(2, '0');
        } else {
            minuteSelect.value = String(roundedMinute).padStart(2, '0');
        }
    }

    async function updateCarList() {
        const waitForElements = () => {
            return new Promise((resolve) => {
                const checkElements = () => {
                    const carDropdown = document.getElementById('carDropdown');
                    const carStatusMessage = document.getElementById('carStatusMessage');
                    const updateCarsButton = document.getElementById('updateCarsButton');
    
                    if (carDropdown && carStatusMessage && updateCarsButton) {
                        resolve({ carDropdown, carStatusMessage, updateCarsButton });
                    } else if (domCheckAttempts < MAX_DOM_CHECK_ATTEMPTS) {
                        domCheckAttempts++;
                        setTimeout(checkElements, 100);
                    } else {
                        console.log('[DEBUG] Required elements not found for updateCarList, providing fallback objects');
                        resolve({
                            carDropdown: {
                                disabled: false,
                                querySelector: () => null,
                                value: '',
                                innerHTML: ''
                            },
                            carStatusMessage: {
                                textContent: '',
                                style: { color: '' }
                            },
                            updateCarsButton: {
                                disabled: false
                            }
                        });
                    }
                };
                checkElements();
            });
        };
    
        const elements = await waitForElements();
        const { carDropdown, carStatusMessage, updateCarsButton } = elements;
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
    
        if (!apiKey) {
            if (carStatusMessage) {
                carStatusMessage.textContent = 'API Key Required';
                carStatusMessage.style.color = 'red';
            }
            return;
        }
    
        if (carStatusMessage) {
            carStatusMessage.textContent = 'Updating Cars...';
            carStatusMessage.style.color = '#aaa';
        }
    
        if (carDropdown) {
            carDropdown.disabled = true;
        }
    
        if (updateCarsButton) {
            updateCarsButton.disabled = true;
        }
    
        try {
            if (!carDropdown || typeof carDropdown.innerHTML !== 'string') {
                console.log('[DEBUG] Skipping API call since carDropdown is not valid');
                return;
            }
            
            const response = await GM.xmlHttpRequest({
                url: `https://api.torn.com/v2/user/?selections=enlistedcars&key=${apiKey}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            if (data.error) {
                                if (carStatusMessage) {
                                    carStatusMessage.textContent = `API Error: ${data.error.error}`;
                                    carStatusMessage.style.color = 'red';
                                }
                            } else if (data.enlistedcars) {
                                populateCarDropdown(data.enlistedcars);

                                setTimeout(() => {
                                    syncCarDropdowns();
                                    if (carStatusMessage) {
                                        carStatusMessage.textContent = 'Cars Updated & Synchronized';
                                        carStatusMessage.style.color = '#efe';
                                    }
                                }, 500);
                            } else {
                                if (carStatusMessage) {
                                    carStatusMessage.textContent = 'No car data received';
                                    carStatusMessage.style.color = 'orange';
                                }
                            }
                        } else {
                            if (carStatusMessage) {
                                carStatusMessage.textContent = `HTTP Error: ${response.status}`;
                                carStatusMessage.style.color = 'red';
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing response:', e);
                        if (carStatusMessage) {
                            carStatusMessage.textContent = 'Error parsing car data';
                            carStatusMessage.style.color = 'red';
                        }
                    }
                    if (carDropdown) carDropdown.disabled = false;
                    if (updateCarsButton) updateCarsButton.disabled = false;
                    if (carStatusMessage) {
                        setTimeout(() => {
                            if (carStatusMessage) carStatusMessage.textContent = '';
                        }, 3000);
                    }
                },
                onerror: function(error) {
                    console.error('Request failed:', error);
                    if (carStatusMessage) {
                        carStatusMessage.textContent = 'Request failed';
                        carStatusMessage.style.color = 'red';
                    }
                    if (carDropdown) carDropdown.disabled = false;
                    if (updateCarsButton) updateCarsButton.disabled = false;
                    if (carStatusMessage) {
                        setTimeout(() => {
                            if (carStatusMessage) carStatusMessage.textContent = '';
                        }, 5000);
                    }
                }
            });
        } catch (error) {
            console.error('Error updating cars:', error);
            if (carStatusMessage) {
                carStatusMessage.textContent = `Error: ${error.message}`;
                carStatusMessage.style.color = 'red';
            }
            if (carDropdown) carDropdown.disabled = false;
            if (updateCarsButton) updateCarsButton.disabled = false;
            if (carStatusMessage) {
                setTimeout(() => {
                    if (carStatusMessage) carStatusMessage.textContent = '';
                }, 5000);
            }
        }
    }

    function populateCarDropdown(cars) {
        console.log('[DEBUG] Populating car dropdowns with', Object.keys(cars).length, 'cars');
        
        try {
            const dropdowns = [
                document.getElementById('carDropdown'),
                document.getElementById('autoJoinCar'),
                document.getElementById('officialCarDropdown')
            ];

            const sortedCars = Object.values(cars)
                .filter(car => car.leased !== '1')
                .sort((a, b) => {
                    const nameA = a.name || a.item_name;
                    const nameB = b.name || b.item_name;
                    return nameA.localeCompare(nameB);
                });

            dropdowns.forEach(dropdown => {
                if (!dropdown) {
                    console.log('[DEBUG] Dropdown not found in populateCarDropdown');
                    return;
                }

                dropdown.innerHTML = '<option value="">Select a car...</option>';

                sortedCars.forEach(car => {
                    const carName = car.name || car.item_name;

                    let partInfo = generateCarPartInfo(car.parts || []);
                    
                    const option = document.createElement('option');
                    option.value = car.id;
                    option.textContent = partInfo ? `${carName} (${partInfo}) [ID: ${car.id}]` : `${carName} [ID: ${car.id}]`;
                    dropdown.appendChild(option);
                });
                
                console.log('[DEBUG] Added', sortedCars.length, 'cars to dropdown', dropdown.id);
            });
            
            console.log('[DEBUG] Car dropdowns populated successfully');
        } catch (error) {
            console.error('[DEBUG] Error in populateCarDropdown:', error);
        }
    }

    function generateCarPartInfo(parts) {
        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return '';
        }

        const categories = {
            transmission: [],
            power: []
        };

        const partShortNames = {
            84: "TL",
            85: "TS",
            86: "DL",
            87: "DS",

            81: "T2",
            99: "T3"
        };

        parts.forEach(partId => {
            const partId_num = Number(partId);
            const shortName = partShortNames[partId_num];
            if (!shortName) return;

            if ([84, 85, 86, 87].includes(partId_num)) {
                categories.transmission.push(shortName);
            } else if ([81, 99].includes(partId_num)) {
                categories.power.push(shortName);
            }
        });

        const partDescriptions = [];
        
        if (categories.transmission.length > 0) {
            partDescriptions.push(categories.transmission[0]);
        }
        
        if (categories.power.length > 0) {
            partDescriptions.push(categories.power.join('/'));
        }
        
        return partDescriptions.join('-');
    }

    function updateCarDropdown() {
        updateCarList();
    }

    function getRFC() {
        // Try getting RFC from page
        const rfcFromPage = getRFCFromPage();
        if (rfcFromPage) {
            console.log('[RFC] Found from page:', rfcFromPage);
            return rfcFromPage;
        }

        // Try getting RFC from jQuery cookie
        if (typeof $.cookie === 'function') {
            const rfcValue = $.cookie('rfc_v');
            if (rfcValue) {
                console.log('[RFC] Found from jQuery cookie:', rfcValue);
                return rfcValue;
            }
        }

        // Fallback to cookie parsing
        const cookies = document.cookie.split("; ");
        for (let i in cookies) {
            const cookie = cookies[i].split("=");
            if (cookie[0] && cookie[0].trim() === "rfc_v") {
                console.log('[RFC] Found from document.cookie:', cookie[1]);
                return cookie[1];
            }
        }

        console.warn("[RFC] Failed to find rfc_v cookie or value.");
        return '';
    }

    function getRFCFromPage() {
        // Get RFC from script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (!script.textContent) continue;
            
            const rfcMatch = script.textContent.match(/var\s+rfcv\s*=\s*['"]([^'"]+)['"]/);
            if (rfcMatch && rfcMatch[1]) {
                console.log('[RFC Detection] Found RFC in script tag:', rfcMatch[1]);
                return rfcMatch[1];
            }
        }

        // Get RFC from input fields
        const rfcInputs = document.querySelectorAll('input[name="rfcv"]');
        for (const input of rfcInputs) {
            if (input.value) {
                console.log('[RFC Detection] Found RFC in input field:', input.value);
                return input.value;
            }
        }

        // Get RFC from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const rfcValue = urlParams.get('rfcv');
        if (rfcValue) {
            console.log('[RFC Detection] Found RFC in URL parameters:', rfcValue);
            return rfcValue;
        }

        // Get RFC from forms
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const rfcInput = form.querySelector('input[name="rfcv"]');
            if (rfcInput && rfcInput.value) {
                console.log('[RFC Detection] Found RFC in form:', rfcInput.value);
                return rfcInput.value;
            }
        }
        
        // Get RFC from data attributes
        const elementsWithData = document.querySelectorAll('[data-rfcv]');
        for (const el of elementsWithData) {
            if (el.dataset.rfcv) {
                console.log('[RFC Detection] Found RFC in data attribute:', el.dataset.rfcv);
                return el.dataset.rfcv;
            }
        }
        
        return null;
    }

    async function createRace() {
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
        const raceName = document.getElementById('raceNameInput').value.trim();

        if (!apiKey) {
            displayStatusMessage('API Key is required to create race.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        if (!raceName) {
            displayStatusMessage('Please enter a race name.', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
            return;
        }

        const trackId = document.getElementById('trackSelect').value;
        const laps = document.getElementById('lapsInput').value;
        const minDrivers = document.getElementById('minDriversInput').value;
        const maxDrivers = document.getElementById('maxDriversInput').value;
        const password = document.getElementById('passwordInput').value;
        const betAmount = document.getElementById('betAmountInput').value;
        const carId = document.getElementById('carIdInput').value;

        const waitTime = Math.floor(Date.now() / 1000);
        
        const rfcValue = getRFC();

        const params = new URLSearchParams();
        params.append('carID', carId);
        params.append('password', password);
        params.append('createRace', 'true');
        params.append('title', raceName);
        params.append('minDrivers', minDrivers);
        params.append('maxDrivers', maxDrivers);
        params.append('trackID', trackId);
        params.append('laps', laps);
        params.append('minClass', '5');
        params.append('carsTypeAllowed', '1');
        params.append('carsAllowed', '5');
        params.append('betAmount', betAmount);
        params.append('waitTime', waitTime);
        params.append('rfcv', rfcValue);

        const raceLink = `https://www.torn.com/loader.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=&${params.toString()}`;
        console.log('[Race URL]:', raceLink);

        displayStatusMessage('Creating Race...', 'info');

        try {
            const response = await fetch(raceLink);
            const data = await response.text();

            if (data.includes('success') || response.ok) {
                displayStatusMessage('Race Created Successfully!', 'success');
                setTimeout(() => window.location.href = 'https://www.torn.com/loader.php?sid=racing', 1500);
            } else {
                displayStatusMessage('Error creating race. Please try again.', 'error');
            }
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } catch (error) {
            displayStatusMessage(`Error creating race: ${error.message}`, 'error');
            setTimeout(() => displayStatusMessage('', ''), 5000);
        }
    }

    async function createRaceFromPreset(preset) {
        const apiKey = GM_getValue(STORAGE_API_KEY, '');
        if (!apiKey) {
            displayQuickLaunchStatus('API Key is required to create race.', 'error');
            return;
        }

        const trackId = preset.track;
        const laps = preset.laps;
        const minDrivers = preset.minDrivers;
        const maxDrivers = preset.maxDrivers;
        const raceName = preset.raceName;
        const password = preset.password;
        const betAmount = preset.betAmount;
        const carId = preset.carId;

        const waitTime = Math.floor(Date.now() / 1000);
        
        const rfcValue = getRFC();

        const params = new URLSearchParams();
        params.append('carID', carId);
        params.append('password', password);
        params.append('createRace', 'true');
        params.append('title', raceName);
        params.append('minDrivers', minDrivers);
        params.append('maxDrivers', maxDrivers);
        params.append('trackID', trackId);
        params.append('laps', laps);
        params.append('minClass', '5');
        params.append('carsTypeAllowed', '1');
        params.append('carsAllowed', '5');
        params.append('betAmount', betAmount);
        params.append('waitTime', waitTime);
        params.append('rfcv', rfcValue);

        const raceLink = `https://www.torn.com/loader.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=&${params.toString()}`;
        console.log('[Race URL from preset]:', raceLink);
        displayQuickLaunchStatus('Creating Race...', 'info');

        try {

            const response = await fetch(raceLink);
            const data = await response.text();
            
            if (data.includes('success') || response.ok) {
                displayQuickLaunchStatus('Race Created Successfully!', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                displayQuickLaunchStatus('Error creating race. Please try again.', 'error');
            }
        } catch (error) {
            displayQuickLaunchStatus(`Error creating race: ${error.message}`, 'error');
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

    function checkRaceStatus() {
        const activeRaceIcon = document.querySelector('li.icon17___eXCy4');
        if (activeRaceIcon) {
            console.log("[Race Detection] Found active race icon (icon17___eXCy4)");
            return true;
        }
        
        const completedRaceIcon = document.querySelector('li.icon18___iPKVP');
        if (completedRaceIcon) {
            console.log("[Race Detection] Found completed race icon (icon18___iPKVP)");
            return false;
        }

        console.log("[Race Detection] Neither race icon found - assuming not racing");
        return false;

    }

    function updateRaceAlert() {
        const alertEnabled = GM_getValue('raceAlertEnabled', false);
        if (!alertEnabled) {
            removeRaceAlert();
            return;
        }

        const isMobilePDA = navigator.userAgent.includes('PDA') || 
                            window.innerWidth < 768 || 
                            document.documentElement.classList.contains('tornPDA');

        const delay = isMobilePDA ? 2000 : 500;
        
        console.log(`[Race Detection] Using ${isMobilePDA ? 'mobile' : 'desktop'} delay: ${delay}ms`);

        setTimeout(() => {
            const isInRace = checkRaceStatus();
            console.log("[Race Detection] Race status:", isInRace ? "IN RACE" : "NOT RACING");
            
            const existingAlert = document.getElementById('raceAlert');

            if (!isInRace) {
                if (!existingAlert || !document.body.contains(existingAlert)) {
                    showRaceAlert();
                }
            } else {
                removeRaceAlert();
            }
        }, delay);
    }

    function showRaceAlert() {
        let alert = document.getElementById('raceAlert');
        
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'raceAlert';
            alert.className = 'race-alert';
            alert.textContent = 'Not Racing';
            alert.style.cssText = `
                display: inline-flex !important;
                align-items: center !important;
                margin-left: 10px !important;
                order: 2 !important;
                z-index: 99999 !important;
                pointer-events: auto !important;
                cursor: pointer !important;
            `;
            
            // Simple click handler to navigate directly to racing page
            alert.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'https://www.torn.com/loader.php?sid=racing';
            });

            const isMobilePDA = navigator.userAgent.includes('PDA') || 
                              window.innerWidth < 768 || 
                              document.documentElement.classList.contains('tornPDA');

            if (window.location.href.includes('sid=racing')) {
                const raceToggleRow = document.getElementById('raceToggleRow');
                if (raceToggleRow) {
                    raceToggleRow.appendChild(alert);
                    return;
                }
            }

            if (isMobilePDA) {
                const pdaContainers = [
                    '.navigationWrapper',
                    '.status-icons-mobile',
                    '.tornPDA-header',
                    '.headerWrapper___f5LgD',
                    '.headerTopContainer___CfrOY'
                ];
                
                for (const selector of pdaContainers) {
                    const container = document.querySelector(selector);
                    if (container) {
                        container.appendChild(alert);

                        alert.style.position = 'absolute';
                        alert.style.top = '10px';
                        alert.style.right = '10px';
                        alert.style.margin = '0';
                        alert.style.zIndex = '999999';
                        
                        console.log(`[Race Alert] Attached to mobile container: ${selector}`);
                        return;
                    }
                }
            }

            const titleSelectors = [
                '#mainContainer > div.content-wrapper.winter > div.content-title.m-bottom10 h4',
                '.titleContainer___QrlWP .title___rhtB4',
                'div.content-title h4',
                '.title-black',
                '.clearfix .t-black',
                '.page-head > h4',
                '#react-root > div > div.appHeader___gUnYC.crimes-app-header > h4',
                'div.appHeader___gUnYC h4',
                '#skip-to-content',
                '.header-title',
                '.mobile-title',
                '.app-header'
            ];
            
            for (const selector of titleSelectors) {
                const titleElement = document.querySelector(selector);
                if (titleElement) {
                    if (titleElement.parentNode.style.position !== 'relative') {
                        titleElement.parentNode.style.position = 'relative';
                    }
                    titleElement.insertAdjacentElement('beforeend', alert);
                    console.log(`[Race Alert] Attached to title element: ${selector}`);
                    return;
                }
            }

            if (!alert.parentNode) {
                alert.style.position = 'fixed';
                alert.style.top = '10px';
                alert.style.right = '10px';
                alert.style.zIndex = '999999';
                document.body.appendChild(alert);
                console.log(`[Race Alert] Attached directly to body as fixed element`);
            }
        }
    }

    function removeRaceAlert() {
        const alert = document.getElementById('raceAlert');
        if (alert) {
            alert.remove();
        }
    }

    function initializeRaceFiltering() {
        console.log('[DEBUG] Starting race filtering initialization');
        
        if (window.raceFilteringInitialized) {
            console.log('[DEBUG] Race filtering already initialized');
            return;
        }

        window.RaceFiltering = window.RaceFiltering || {
            filterRacesList() {
                console.log('[DEBUG] Applying filters to race list');
                const filters = {
                    track: document.getElementById('filterTrack')?.value || '',
                    laps: {
                        min: parseInt(document.getElementById('filterMinLaps')?.value) || null,
                        max: parseInt(document.getElementById('filterMaxLaps')?.value) || null
                    },
                    drivers: {
                        min: parseInt(document.getElementById('filterMinDrivers')?.value) || null,
                        max: parseInt(document.getElementById('filterMaxDrivers')?.value) || null
                    },
                    sortBy: document.getElementById('filterSort')?.value || 'time',
                    hidePassworded: document.getElementById('hidePassworded')?.checked || false,
                    showSuitableCarsOnly: document.getElementById('showSuitableCarsOnly')?.checked || false,
                    hideFullRaces: document.getElementById('hideFullRaces')?.checked || false
                };

                const racesList = document.querySelector('.custom_events, .events-list, .races-list');
                if (!racesList) return;

                const races = Array.from(racesList.children);
                races.forEach(race => {
                    let shouldShow = true;

                    if (filters.track && !this.matchesTrackFilter(race, filters.track)) {
                        shouldShow = false;
                    }
                    if (shouldShow && filters.showSuitableCarsOnly && !this.hasSuitableCar(race)) {
                        shouldShow = false;
                    }
                    if (shouldShow && filters.laps.min && !this.matchesMinLapsFilter(race, filters.laps.min)) {
                        shouldShow = false;
                    }
                    if (shouldShow && filters.laps.max && !this.matchesMaxLapsFilter(race, filters.laps.max)) {
                        shouldShow = false;
                    }
                    if (shouldShow && filters.drivers.min && !this.matchesMinDriversFilter(race, filters.drivers.min)) {
                        shouldShow = false;
                    }
                    if (shouldShow && filters.drivers.max && !this.matchesMaxDriversFilter(race, filters.drivers.max)) {
                        shouldShow = false;
                    }
                    if (shouldShow && filters.hidePassworded && this.isPasswordProtected(race)) {
                        shouldShow = false;
                    }
                    if (shouldShow && filters.hideFullRaces && this.isRaceFull(race)) {
                        shouldShow = false;
                    }

                    race.style.display = shouldShow ? '' : 'none';
                });

                const visibleRaces = races.filter(race => race.style.display !== 'none');
                visibleRaces.sort((a, b) => {
                    switch(filters.sortBy) {
                        case 'time': return this.compareTime(a, b);
                        case 'track': return this.compareTrack(a, b);
                        case 'laps': return this.compareLaps(a, b);
                        case 'bets': return this.compareBets(a, b);
                        case 'drivers': return this.compareDrivers(a, b);
                        default: return 0;
                    }
                });

                visibleRaces.forEach(race => racesList.appendChild(race));
            },

            matchesTrackFilter(race, trackName) {
                if (!trackName) return true;
                const trackElement = race.querySelector('li.track');
                if (!trackElement) return true;

                const trackText = trackElement.textContent.replace(/\(\d+\s*laps?\)/i, '').trim();
                return trackText.toLowerCase() === trackName.toLowerCase();
            },

            hasSuitableCar(race) {
                const notSuitableText = "You do not have a suitable car enlisted for this race.";
                return !race.textContent.includes(notSuitableText);
            },

            matchesMinLapsFilter(race, minLaps) {
                if (!minLaps) return true;
                const lapsElement = race.querySelector('li.track span.laps');
                if (!lapsElement) return true;
                
                const lapsMatch = lapsElement.textContent.match(/(\d+)\s*laps?/i);
                const raceLaps = lapsMatch ? parseInt(lapsMatch[1]) : 0;
                console.log('[DEBUG] Min laps check:', { raceLaps, minLaps });
                return raceLaps >= minLaps;
            },

            matchesMaxLapsFilter(race, maxLaps) {
                if (!maxLaps) return true;
                const lapsElement = race.querySelector('li.track span.laps');
                if (!lapsElement) return true;
                
                const lapsMatch = lapsElement.textContent.match(/(\d+)\s*laps?/i);
                const raceLaps = lapsMatch ? parseInt(lapsMatch[1]) : 0;
                console.log('[DEBUG] Max laps check:', { raceLaps, maxLaps });
                return raceLaps <= maxLaps;
            },

            matchesMinDriversFilter(race, minDrivers) {
                if (!minDrivers) return true;
                const driversElement = race.querySelector('li.drivers');
                if (!driversElement) return true;
                
                const driversMatch = driversElement.textContent.match(/(\d+)\s*\/\s*(\d+)/);
                if (!driversMatch) return true;
                
                const maxRaceDrivers = parseInt(driversMatch[2]);
                console.log('[DEBUG] Min drivers check:', { maxRaceDrivers, minDrivers });
                return maxRaceDrivers >= minDrivers;
            },

            matchesMaxDriversFilter(race, maxDrivers) {
                if (!maxDrivers) return true;
                const driversElement = race.querySelector('li.drivers');
                if (!driversElement) return true;
                
                const driversMatch = driversElement.textContent.match(/(\d+)\s*\/\s*(\d+)/);
                if (!driversMatch) return true;
                
                const maxRaceDrivers = parseInt(driversMatch[2]);
                console.log('[DEBUG] Max drivers check:', { maxRaceDrivers, maxDrivers });
                return maxRaceDrivers <= maxDrivers;
            },

            isPasswordProtected(race) {
                const raceText = race.textContent.toLowerCase();
                return raceText.includes('password') || race.querySelector('[id^="joinPasswordForm"]') !== null;
            },

            isRaceFull(race) {
                const driversElement = race.querySelector('li.drivers');
                if (!driversElement) return false;
                
                const driversMatch = driversElement.textContent.match(/(\d+)\s*\/\s*(\d+)/);
                if (!driversMatch) return false;
                
                const currentDrivers = parseInt(driversMatch[1]);
                const maxDrivers = parseInt(driversMatch[2]);
                
                console.log('[DEBUG] Race full check:', { currentDrivers, maxDrivers });
                return currentDrivers >= maxDrivers;
            },

            compareTime(a, b) {
                const getTimeInMinutes = el => {
                    const timeText = (el.textContent || '').toLowerCase();

                    if (timeText.includes('waiting')) {
                        return -1;
                    }

                    let totalMinutes = 0;
                    
                    const fullMatch = timeText.match(/(\d+)\s*h(?:our)?s?\s*(?:and)?\s*(\d+)\s*(?:min(?:ute)?s?|m)/);
                    if (fullMatch) {
                        return (parseInt(fullMatch[1]) * 60) + parseInt(fullMatch[2]);
                    }

                    const hoursOnlyMatch = timeText.match(/(\d+)\s*h(?:our)?s?/);
                    if (hoursOnlyMatch) {
                        return parseInt(hoursOnlyMatch[1]) * 60;
                    }

                    const minutesOnlyMatch = timeText.match(/(\d+)\s*(?:min(?:ute)?s?|m)/);
                    if (minutesOnlyMatch) {
                        return parseInt(minutesOnlyMatch[1]);
                    }

                    const timeMatch = timeText.match(/(\d+):(\d+)/);
                    if (timeMatch) {
                        return (parseInt(timeMatch[1]) * 60) + parseInt(timeMatch[2]);
                    }

                    return Infinity;
                };
                
                const timeA = getTimeInMinutes(a);
                const timeB = getTimeInMinutes(b);
                return timeA - timeB;
            },

            compareTrack(a, b) {
                const getTrackName = el => {
                    const trackElement = el.querySelector('li.track');
                    if (!trackElement) return '';
                    return trackElement.textContent.replace(/\(\d+\s*laps?\)/i, '').trim();
                };
                
                const trackA = getTrackName(a).toLowerCase();
                const trackB = getTrackName(b).toLowerCase();
                return trackA.localeCompare(trackB);
            },

            compareLaps(a, b) {
                const getLaps = el => {
                    const lapsMatch = el.textContent.match(/(\d+)\s*laps?/i);
                    return parseInt(lapsMatch?.[1]) || 0;
                };
                return getLaps(a) - getLaps(b);
            },

            compareBets(a, b) {
                const getBet = el => {
                    const betMatch = el.textContent.match(/\$([0-9,]+)/);
                    return parseInt(betMatch?.[1]?.replace(/,/g, '')) || 0;
                };
                return getBet(b) - getBet(a);
            },

            compareDrivers(a, b) {
                const getMaxDrivers = el => {
                    const driversElement = el.querySelector('li.drivers');
                    if (!driversElement) return 0;
                    
                    const driversMatch = driversElement.textContent.match(/(\d+)\s*\/\s*(\d+)/);
                    if (!driversMatch) return 0;
                    
                    return parseInt(driversMatch[2]) || 0;
                };
                return getMaxDrivers(a) - getMaxDrivers(b);
            }
        };

        if (!window.location.href.includes('sid=racing')) {
            return;
        }

        window.raceFilteringInitialized = true;

        if (window.raceFilterObserver) {
            window.raceFilterObserver.disconnect();
        }

        let debounceTimer;
        window.raceFilterObserver = new MutationObserver((mutations) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const raceList = document.querySelector('.custom_events, .events-list, .races-list');
                const filterSection = document.querySelector('.race-filter-section');
                
                if (raceList && !filterSection) {
                    console.log('[DEBUG] Race list found, setting up filters');
                    setupFilterControls();
                    window.RaceFiltering.filterRacesList();
                }
            }, 100);
        });

        const observerConfig = {
            childList: true,
            subtree: true
        };

        const container = document.getElementById('racingMainContainer') || document.body;
        window.raceFilterObserver.observe(container, observerConfig);

        const raceList = document.querySelector('.custom_events, .events-list, .races-list');
        if (raceList && !raceList.querySelector('.race-filter-section')) {
            setupFilterControls();
            window.RaceFiltering.filterRacesList();
        }

        window.addEventListener('unload', () => {
            if (window.raceFilterObserver) {
                window.raceFilterObserver.disconnect();
            }
            window.raceFilteringInitialized = false;
        });
    }

    function refreshRacesList() {
        console.log('[DEBUG] Refreshing race list');
        const customEventsTab = document.querySelector('a[href*="tab=customrace"]');
        
        if (customEventsTab) {
            const observer = new MutationObserver((mutations, obs) => {
                const racesList = document.querySelector('.custom_events, .events-list, .races-list');
                if (racesList) {
                    console.log('[DEBUG] Race list detected after refresh');
                    setTimeout(() => {
                        console.console.log('[DEBUG] Restoring filters and reapplying');
                        const filtersEnabled = restoreFilterState();
                        if (filtersEnabled && document.getElementById('toggleFilters')?.classList.contains('active')) {
                            window.RaceFiltering?.filterRacesList();
                        }
                        obs.disconnect();
                    }, 500);
                }
            });

            const container = document.getElementById('racingMainContainer') || document.body;
            observer.observe(container, {
                childList: true,
                subtree: true
            });

            customEventsTab.click();
            
            setTimeout(() => {
                observer.disconnect();
                console.log('[DEBUG] Observer timed out - no race list found');
            }, 10000);
        }
    }

    function clearFilters() {
        const filterTrack = document.getElementById('filterTrack');
        const filterMinLaps = document.getElementById('filterMinLaps');
        const filterMaxLaps = document.getElementById('filterMaxLaps');
        const filterMinDrivers = document.getElementById('filterMinDrivers');
        const filterMaxDrivers = document.getElementById('filterMaxDrivers');
        const filterSort = document.getElementById('filterSort');
        const hidePassworded = document.getElementById('hidePassworded');
        const showSuitableCarsOnly = document.getElementById('showSuitableCarsOnly');
        const hideFullRaces = document.getElementById('hideFullRaces');

        if (filterTrack) filterTrack.value = '';
        if (filterMinLaps) filterMinLaps.value = '';
        if (filterMaxLaps) filterMaxLaps.value = '';
        if (filterMinDrivers) filterMinDrivers.value = '';
        if (filterMaxDrivers) filterMaxDrivers.value = '';
        if (filterSort) filterSort.value = 'time';
        if (hidePassworded) hidePassworded.checked = false;
        if (showSuitableCarsOnly) showSuitableCarsOnly.checked = false;
        if (hideFullRaces) hideFullRaces.checked = false;

        const racesList = document.querySelector('.custom_events, .events-list, .races-list');
        if (racesList) {
            Array.from(racesList.children).forEach(race => {
                race.style.display = '';
            });
        }
    }

    function saveFilterState() {
        const state = {
            track: document.getElementById('filterTrack')?.value || '',
            minLaps: document.getElementById('filterMinLaps')?.value || '',
            maxLaps: document.getElementById('filterMaxLaps')?.value || '',
            minDrivers: document.getElementById('filterMinDrivers')?.value || '',
            maxDrivers: document.getElementById('filterMaxDrivers')?.value || '',
            sortBy: document.getElementById('filterSort')?.value || 'time',
            hidePassworded: document.getElementById('hidePassworded')?.checked || false,
            showSuitableCarsOnly: document.getElementById('showSuitableCarsOnly')?.checked || false,
            hideFullRaces: document.getElementById('hideFullRaces')?.checked || false,
            filtersEnabled: document.getElementById('toggleFilters')?.classList.contains('active') || false
        };
        GM_setValue('raceFilterState', JSON.stringify(state));
    }

    function restoreFilterState() {
        try {
            const savedState = JSON.parse(GM_getValue('raceFilterState', '{}'));
            
            const filterTrack = document.getElementById('filterTrack');
            const filterMinLaps = document.getElementById('filterMinLaps');
            const filterMaxLaps = document.getElementById('filterMaxLaps');
            const filterMinDrivers = document.getElementById('filterMinDrivers');
            const filterMaxDrivers = document.getElementById('filterMaxDrivers');
            const filterSort = document.getElementById('filterSort');
            const hidePassworded = document.getElementById('hidePassworded');
            const showSuitableCarsOnly = document.getElementById('showSuitableCarsOnly');
            const hideFullRaces = document.getElementById('hideFullRaces');
            const toggleFilters = document.getElementById('toggleFilters');

            if (filterTrack) filterTrack.value = savedState.track || '';
            if (filterMinLaps) filterMinLaps.value = savedState.minLaps || '';
            if (filterMaxLaps) filterMaxLaps.value = savedState.maxLaps || '';
            if (filterMinDrivers) filterMinDrivers.value = savedState.minDrivers || '';
            if (filterMaxDrivers) filterMaxDrivers.value = savedState.maxDrivers || '';
            if (filterSort) filterSort.value = savedState.sortBy || 'time';
            if (hidePassworded) hidePassworded.checked = savedState.hidePassworded || false;
            if (showSuitableCarsOnly) showSuitableCarsOnly.checked = savedState.showSuitableCarsOnly || false;
            if (hideFullRaces) hideFullRaces.checked = savedState.hideFullRaces || false;
            
            if (toggleFilters) {
                if (savedState.filtersEnabled) {
                    toggleFilters.classList.add('active');
                    toggleFilters.textContent = 'Disable Filters';
                } else {
                    toggleFilters.classList.remove('active');
                    toggleFilters.textContent = 'Enable Filters';
                }
            }

            return savedState.filtersEnabled;
        } catch (e) {
            console.error('Error restoring filter state:', e);
            return false;
        }
    }

    function setupFilterControls() {
        const raceList = document.querySelector('.custom_events, .events-list, .races-list');
        if (!raceList || raceList.querySelector('.race-filter-section')) {
            return;
        }

        const existingFilters = document.querySelectorAll('.race-filter-section');
        existingFilters.forEach(el => el.remove());

        console.log('[DEBUG] Creating filter controls');
        
        const filterContainer = document.createElement('div');
        filterContainer.className = 'race-filter-section';
        filterContainer.innerHTML = `
            <div class="race-filter-controls">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Track:</label>
                        <select id="filterTrack">
                            <option value="">All Tracks</option>
                            <option value="Uptown">Uptown</option>
                            <option value="Withdrawal">Withdrawal</option>
                            <option value="Underdog">Underdog</option>
                            <option value="Parkland">Parkland</option>
                            <option value="Docks">Docks</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Two Islands">Two Islands</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Vector">Vector</option>
                            <option value="Mudpit">Mudpit</option>
                            <option value="Hammerhead">Hammerhead</option>
                            <option value="Sewage">Sewage</option>
                            <option value="Meltdown">Meltdown</option>
                            <option value="Speedway">Speedway</option>
                            <option value="Stone Park">Stone Park</option>
                            <option value="Convict">Convict</option>
                        </select>
                    </div>
                    <div class="filter-group laps-filter">
                        <label>Laps:</label>
                        <input type="number" id="filterMinLaps" placeholder="Min" min="1" max="100">
                        <span>-</span>
                        <input type="number" id="filterMaxLaps" placeholder="Max" min="1" max="100">
                    </div>
                </div>
                <div class="filter-row">
                    <div class="filter-group laps-filter">
                        <label>Drivers:</label>
                        <input type="number" id="filterMinDrivers" placeholder="Min" min="2" max="10">
                        <span>-</span>
                        <input type="number" id="filterMaxDrivers" placeholder="Max" min="2" max="10">
                    </div>
                    <div class="filter-group" style="margin-left: 15px;">
                        <label>Sort By:</label>
                        <select id="filterSort">
                            <option value="time">Start Time</option>
                            <option value="track">Track</option>
                            <option value="laps">Laps</option>
                            <option value="bets">Bet Amount</option>
                            <option value="drivers">Drivers</option>
                        </select>
                    </div>
                </div>
                <div class="filter-row">
                    <div class="filter-group checkboxes">
                        <div class="checkbox-option">
                            <label><input type="checkbox" id="hidePassworded"> Hide Passworded</label>
                        </div>
                        <div class="checkbox-option">
                            <label><input type="checkbox" id="showSuitableCarsOnly"> Show Suitable Cars Only</label>
                        </div>
                        <div class="checkbox-option">
                            <label><input type="checkbox" id="hideFullRaces"> Hide Full Races</label>
                        </div>
                    </div>
                    <div class="filter-buttons">
                        <button id="refreshRaces" class="gui-button">Refresh List</button>
                        <button id="toggleFilters" class="gui-button active">Disable Filters</button>
                    </div>
                </div>
            </div>
        `;

        raceList.parentNode.insertBefore(filterContainer, raceList);

        const filterElements = [
            'filterTrack',
            'filterMinLaps', 
            'filterMaxLaps',
            'filterMinDrivers',
            'filterMaxDrivers',
            'filterSort',
            'hidePassworded',
            'showSuitableCarsOnly',
            'hideFullRaces'
        ];

        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    saveFilterState();
                    if (document.getElementById('toggleFilters')?.classList.contains('active')) {
                        window.RaceFiltering?.filterRacesList();
                    }
                });
            }
        });

        const toggleBtn = document.getElementById('toggleFilters');
        const refreshBtn = document.getElementById('refreshRaces');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                const isEnabled = this.classList.toggle('active');
                this.textContent = isEnabled ? 'Disable Filters' : 'Enable Filters';
                
                if (isEnabled) {
                    window.RaceFiltering?.filterRacesList();
                } else {
                    clearFilters();
                }
                saveFilterState();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('[DEBUG] Refresh button clicked');
                refreshRacesList();
            });
        }

        if (toggleBtn?.classList.contains('active')) {
            window.RaceFiltering?.filterRacesList();
        }

        const filtersEnabled = restoreFilterState();
        if (filtersEnabled && toggleBtn?.classList.contains('active')) {
            window.RaceFiltering?.filterRacesList();
        }
    }

    async function startAutoJoin() {
        const tabSwitched = await ensureCustomEventsTab();
        if (!tabSwitched) {
            console.log('[DEBUG] Failed to switch to Custom Events tab');
            displayStatusMessage('Failed to load Custom Events tab', 'error');
            return;
        }

        const startBtn = document.getElementById('startAutoJoin');
        const stopBtn = document.getElementById('stopAutoJoin');
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'block';

        const track = document.getElementById('autoJoinTrack')?.value || 'all';
        const minLaps = parseInt(document.getElementById('minLaps')?.value) || 0;
        const maxLaps = parseInt(document.getElementById('maxLaps')?.value) || 100;
        const minDrivers = parseInt(document.getElementById('autoJoinMinDrivers')?.value) || 0;
        const maxDrivers = parseInt(document.getElementById('autoJoinMaxDrivers')?.value) || 10;
        const selectedCarId = document.getElementById('autoJoinCar')?.value || document.getElementById('carIdInput')?.value;
        const hidePassworded = document.getElementById('hidePassworded')?.checked || false;
        const hideBets = document.getElementById('hideBets')?.checked || false;
        const hideFullRaces = document.getElementById('hideFullRacesAutoJoin')?.checked || false;
        
        console.log('[DEBUG] Starting Auto-Join process');
        console.log('[DEBUG] Filter settings:', { track, minLaps, maxLaps, minDrivers, maxDrivers, selectedCarId, hidePassworded, hideBets, hideFullRaces });

        if (!selectedCarId) {
            console.log('[DEBUG] No car selected');
            displayStatusMessage('Please select a car first.', 'error');
            return;
        }

        const customEvents = document.querySelector('.custom_events');
        const racesList = customEvents || document.querySelector('.events-list, .races-list');
        
        console.log('[DEBUG] Found race list container:', racesList ? racesList.className : 'Not found');
        
        if (!racesList) {
            console.log('[DEBUG] No races list found');
            displayStatusMessage('No races found. Try refreshing the page.', 'error');
            return;
        }

        const races = Array.from(racesList.children).filter(el => 
            el.tagName === 'LI' && !el.classList.contains('clear') && !el.classList.contains('head')
        );
        
        console.log(`[DEBUG] Total valid race elements found: ${races.length}`);
        races.forEach((race, idx) => {
            console.log(`[DEBUG] Race ${idx + 1} content:`, race.textContent.substring(0, 100) + '...');
        });

        const suitableRaces = races.filter(race => {
            if (!race || race.className === 'clear') return false;
            
            let isMatch = true;
            const lapsElement = race.querySelector('li.track span.laps');
            const lapsMatch = lapsElement ? lapsElement.textContent.match(/(\d+)\s*laps?/i) : null;
            const raceLaps = lapsMatch ? parseInt(lapsMatch[1]) : 0;
            
            console.log(`[DEBUG] Processing race with ${raceLaps} laps`);

            const driversElement = race.querySelector('li.drivers');
            if (driversElement) {
                const driversText = driversElement.textContent.trim();
                const [current, max] = driversText.match(/(\d+)\s*\/\s*(\d+)/)?.slice(1).map(Number) || [0, 0];
                console.log('[DEBUG] Race drivers:', { current, max });
                
                if (hideFullRaces && current >= max) {
                    console.log('[DEBUG] Race filtered out: Full (' + current + '/' + max + ' drivers)');
                    isMatch = false;
                }
                
                if (isMatch && minDrivers > 0 && max < minDrivers) {
                    console.log('[DEBUG] Race filtered out: Max drivers too low (' + max + ' < ' + minDrivers + ')');
                    isMatch = false;
                }
                
                if (isMatch && maxDrivers > 0 && max > maxDrivers) {
                    console.log('[DEBUG] Race filtered out: Max drivers too high (' + max + ' > ' + maxDrivers + ')');
                    isMatch = false;
                }
            }

            const trackNames = {
                '6': 'Uptown',
                '7': 'Withdrawal',
                '8': 'Underdog',
                '9': 'Parkland',
                '10': 'Docks',
                '11': 'Commerce',
                '12': 'Two Islands',
                '15': 'Industrial',
                '16': 'Vector',
                '17': 'Mudpit',
                '18': 'Hammerhead',
                '19': 'Sewage',
                '20': 'Meltdown',
                '21': 'Speedway',
                '23': 'Stone Park',
                '24': 'Convict'
            };

            if (isMatch && track !== 'all') {
                const trackToMatch = trackNames[track] || track;
                const matches = window.RaceFiltering.matchesTrackFilter(race, trackToMatch);
                console.log(`[DEBUG] Track filter (${trackToMatch}):`, matches ? 'passed' : 'failed');
                if (!matches) isMatch = false;
            }

            if (isMatch && minLaps) {
                const matches = window.RaceFiltering.matchesMinLapsFilter(race, minLaps);
                console.log(`[DEBUG] Min laps filter (${minLaps}):`, matches ? 'passed' : 'failed');
                if (!matches) isMatch = false;
            }

            if (isMatch && maxLaps) {
                const matches = window.RaceFiltering.matchesMaxLapsFilter(race, maxLaps);
                console.log(`[DEBUG] Max laps filter (${maxLaps}):`, matches ? 'passed' : 'failed');
                if (!matches) isMatch = false;
            }

            if (isMatch && hidePassworded) {
                const matches = window.RaceFiltering.isPasswordProtected(race);
                console.log(`[DEBUG] Password filter:`, matches ? 'failed' : 'passed');
                if (matches) isMatch = false;
            }

            if (isMatch && hideBets) {
                const matches = hasBet(race);
                console.log(`[DEBUG] Bet filter:`, matches ? 'failed' : 'passed');
                if (matches) isMatch = false;
            }

            if (isMatch) {
                const matches = window.RaceFiltering.hasSuitableCar(race);
                console.log(`[DEBUG] Suitable car filter:`, matches ? 'passed' : 'failed');
                if (!matches) isMatch = false;
            }

            console.log(`[DEBUG] Final match result for race:`, isMatch);
            return isMatch;
        });

        console.log(`[DEBUG] Suitable races found: ${suitableRaces.length}`);

        if (suitableRaces.length === 0 || !suitableRaces.some(race => {
            const lapsElement = race.querySelector('li.track span.laps');
            const lapsMatch = lapsElement ? lapsElement.textContent.match(/(\d+)\s*laps?/i) : null;
            const raceLaps = lapsMatch ? parseInt(lapsMatch[1]) : 0;
            return raceLaps > 0;
        })) {
            console.log('[DEBUG] No valid suitable races found - starting refresh cycle');

            GM_setValue('autoJoinState', {
                track,
                minLaps,
                maxLaps,
                minDrivers,
                maxDrivers,
                selectedCarId,
                hidePassworded,
                hideBets,
                hideFullRaces,
                active: true
            });
            
            let countdown = 3;
            const updateCountdownAndRefresh = () => {
                if (countdown > 0) {
                    displayStatusMessage(`No suitable races found. Refreshing in ${countdown}...`, 'info');
                    countdown--;
                    window.autoJoinRefreshTimeout = setTimeout(updateCountdownAndRefresh, 1000);
                } else {
                    displayStatusMessage('Refreshing race list...', 'info');
                    refreshCustomEventsList();
                }
            };

            updateCountdownAndRefresh();
            return;
        }

        suitableRaces.sort((a, b) => window.RaceFiltering.compareTime(a, b));

        const firstRace = suitableRaces[0];

        let raceId = null;
        const joinLink = firstRace.querySelector('.notification-wrap .join-wrap a[href*="id="]');
        if (joinLink) {
            const idMatch = joinLink.href.match(/[?&]id=(\d+)/);
            if (idMatch) {
                raceId = idMatch[1];
            }
        }

        if (!raceId) {
            const links = firstRace.querySelectorAll('a[href*="id="]');
            for (const link of links) {
                const idMatch = link.href.match(/[?&]id=(\d+)/);
                if (idMatch) {
                    raceId = idMatch[1];
                    break;
                }
            }
        }

        if (!raceId) {
            raceId = firstRace.getAttribute('data-raceid') || firstRace.getAttribute('data-race');
        }

        if (!raceId) {
            console.log('[DEBUG] Could not find race ID');
            console.log('[DEBUG] Race element content:', firstRace.innerHTML);
            displayStatusMessage('Could not find race ID.', 'error');
            return;
        }

        console.log('[DEBUG] Found race ID:', raceId);

        const rfcValue = getRFC();

        const params = new URLSearchParams();
        params.append('sid', 'racing');
        params.append('tab', 'customrace');
        params.append('section', 'getInRace');
        params.append('step', 'getInRace');
        params.append('id', raceId);
        params.append('carID', selectedCarId);
        params.append('rfcv', rfcValue);
        
        const joinUrl = `https://www.torn.com/loader.php?${params.toString()}`;
        console.log('[DEBUG] Generated join URL:', joinUrl);

        GM_setValue('autoJoinState', null);
        updateAutoJoinButtonStates();

        displayStatusMessage('Joining race...', 'info');
        window.location.href = joinUrl;
    }

    function stopAutoJoin(shouldReload = true) {
        if (window.autoJoinRefreshTimeout) {
            clearTimeout(window.autoJoinRefreshTimeout);
            window.autoJoinRefreshTimeout = null;
        }
        
        GM_setValue('autoJoinState', null);
        updateAutoJoinButtonStates();
        displayStatusMessage('Auto-join stopped', 'info');

        if (shouldReload) {
            window.location.reload();
        }
    }

    function resumeAutoJoin() {
        const autoJoinState = GM_getValue('autoJoinState', null);
        if (autoJoinState && autoJoinState.active) {
            console.log('[DEBUG] Resuming Auto-Join with state:', autoJoinState);

            updateAutoJoinButtonStates();
            
            if (window.location.href.includes('sid=racing')) {
                const elements = {
                    'autoJoinTrack': autoJoinState.track,
                    'minLaps': autoJoinState.minLaps,
                    'maxLaps': autoJoinState.maxLaps,
                    'autoJoinMinDrivers': autoJoinState.minDrivers,
                    'autoJoinMaxDrivers': autoJoinState.maxDrivers,
                    'autoJoinCar': autoJoinState.selectedCarId,
                    'hidePassworded': autoJoinState.hidePassworded,
                    'hideBets': autoJoinState.hideBets,
                    'hideFullRacesAutoJoin': autoJoinState.hideFullRaces
                };

                Object.entries(elements).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element) {
                        if (typeof value === 'boolean') {
                            element.checked = value;
                        } else {
                            element.value = value;
                        }
                    }
                });

                setTimeout(() => {
                    console.log('[DEBUG] Restarting auto-join after resume');
                    startAutoJoin();
                }, 1000);
            }
        }
    }

    function refreshCustomEventsList() {
        console.log('[DEBUG] Refreshing Custom Events list');
        const rfcValue = getRFC();

        const params = new URLSearchParams({
            sid: 'racing',
            tab: 'customrace',
            rfcv: rfcValue
        });
        
        const url = `https://www.torn.com/loader.php?${params.toString()}`;
        
        displayStatusMessage('Refreshing race list...', 'info');

        const maxRetries = 3;
        let retryCount = 0;
        
        function attemptRefresh() {
            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                credentials: 'same-origin'
            })
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const newCustomEvents = doc.querySelector('.custom_events, .events-list, .races-list');
                const currentCustomEvents = document.querySelector('.custom_events, .events-list, .races-list');
                
                if (newCustomEvents && currentCustomEvents) {
                    currentCustomEvents.innerHTML = newCustomEvents.innerHTML;
                    console.log('[DEBUG] Custom events refreshed successfully');

                    if (document.getElementById('toggleFilters')?.classList.contains('active')) {
                        window.RaceFiltering?.filterRacesList();
                    }

                    const autoJoinState = GM_getValue('autoJoinState', null);
                    if (autoJoinState) {
                        console.log('[DEBUG] Auto-join active, continuing search');
                        setTimeout(() => {
                            startAutoJoin();
                        }, 500);
                    }
                    
                    displayStatusMessage('Race list refreshed', 'success');
                    setTimeout(() => displayStatusMessage('', ''), 3000);
                } else {
                    handleRefreshError('Could not find race list container');
                }
            })
            .catch(error => handleRefreshError(error));
        }
        
        function handleRefreshError(error) {
            console.error('[DEBUG] Refresh error:', error);
            retryCount++;
            
            const autoJoinState = GM_getValue('autoJoinState', null);
            if (autoJoinState && retryCount < maxRetries) {
                console.log(`[DEBUG] Retry ${retryCount}/${maxRetries}`);
                displayStatusMessage(`Retrying refresh... (${retryCount}/${maxRetries})`, 'info');
                setTimeout(attemptRefresh, 2000);
            } else if (autoJoinState) {
                console.log('[DEBUG] Max retries reached, stopping auto-join');
                displayStatusMessage('Error refreshing races list, auto-join stopped', 'error');
                stopAutoJoin(false);
            } else {
                displayStatusMessage('Error refreshing races list', 'error');
            }
        }
        
        attemptRefresh();
    }

    function hasBet(race) {
        const betText = race.textContent;
        const betMatch = betText.match(/Bet:\s*\$([0-9,]+)/i);
        if (betMatch) {
            const betAmount = parseInt(betMatch[1].replace(/,/g, ''));
            return betAmount > 0;
        }
        return false;
    }

    function isAutoJoinActive() {
        const autoJoinState = GM_getValue('autoJoinState', null);
        const currentUrl = window.location.href;

        if (currentUrl.includes('section=getInRace') || 
            document.querySelector('.car-selected-wrap') || 
            currentUrl.includes('step=getInRace')) {
            console.log('[DEBUG] Race join detected or join URL generated - clearing auto-join state');
            GM_setValue('autoJoinState', null);
            return false;
        }
        
        return autoJoinState?.active === true && currentUrl.includes('sid=racing');
    }

    function updateAutoJoinButtonStates() {
        const startBtn = document.getElementById('startAutoJoin');
        const stopBtn = document.getElementById('stopAutoJoin');
        const isActive = isAutoJoinActive();
        
        if (startBtn) {
            startBtn.style.display = isActive ? 'none' : 'block';
            startBtn.disabled = document.querySelector('.car-selected-wrap') !== null;
        }
        if (stopBtn) {
            stopBtn.style.display = isActive ? 'block' : 'none';
        }
    }

    function initializeAutoJoinSection() {
        console.log('[DEBUG] Initializing auto-join section');

        const waitForAutoJoinDOM = setInterval(() => {
            const autoJoinSection = document.querySelector('.auto-join-section');
            
            if (autoJoinSection) {
                clearInterval(waitForAutoJoinDOM);
                
                const autoJoinConfig = autoJoinSection.querySelector('.auto-join-config');
                if (!autoJoinConfig) return;

                let autoJoinButtons = autoJoinSection.querySelector('.auto-join-buttons');
                if (!autoJoinButtons) {
                    autoJoinButtons = document.createElement('div');
                    autoJoinButtons.className = 'auto-join-buttons';
                    autoJoinConfig.appendChild(autoJoinButtons);
                }

                const existingButton = document.getElementById('saveAutoJoinPreset');
                if (existingButton) {
                    existingButton.remove();
                }

                const savePresetButton = document.createElement('button');
                savePresetButton.id = 'saveAutoJoinPreset';
                savePresetButton.className = 'gui-button';
                savePresetButton.textContent = 'Save Auto-Join Preset';
                
                savePresetButton.addEventListener('click', saveAutoJoinPreset);

                autoJoinButtons.insertBefore(savePresetButton, autoJoinButtons.firstChild);

                setTimeout(() => {
                    const syncResult = syncCarDropdowns();
                    console.log('[DEBUG] Initial car dropdown sync result:', syncResult);

                    if (!syncResult) {
                        setTimeout(syncCarDropdowns, 2000);
                    }

                    const mainCarDropdown = document.getElementById('carDropdown');
                    if (mainCarDropdown) {
                        mainCarDropdown.addEventListener('change', () => {
                            console.log('[DEBUG] Main car dropdown changed, syncing...');
                            syncCarDropdowns();
                        });
                    }
                }, 500);
                
                console.log('[DEBUG] Auto-join preset save button added successfully');
            }
        }, 500);

        setTimeout(() => {
            clearInterval(waitForAutoJoinDOM);
            console.log('[DEBUG] Stopped waiting for auto-join DOM elements');
        }, 20000);
    }

    function syncCarDropdowns() {
        const mainCarDropdown = document.getElementById('carDropdown');
        const autoJoinCarDropdown = document.getElementById('autoJoinCar');
        
        if (!mainCarDropdown || !autoJoinCarDropdown) {
            console.log('[DEBUG] syncCarDropdowns: One or both dropdowns not found');
            return false;
        }
        
        if (mainCarDropdown.options.length <= 1) {
            console.log('[DEBUG] syncCarDropdowns: Main dropdown has no car options');
            return false;
        }

        console.log('[DEBUG] syncCarDropdowns: Found both dropdowns. Main dropdown has', 
                    mainCarDropdown.options.length, 'options');
        
        try {
            const selectedValue = autoJoinCarDropdown.value;

            const clonedOptions = Array.from(mainCarDropdown.options).map(opt => {
                const newOpt = document.createElement('option');
                newOpt.value = opt.value;
                newOpt.text = opt.text;
                return newOpt;
            });

            autoJoinCarDropdown.innerHTML = '';
            clonedOptions.forEach(opt => autoJoinCarDropdown.appendChild(opt));

            if (selectedValue && [...autoJoinCarDropdown.options].some(opt => opt.value === selectedValue)) {
                autoJoinCarDropdown.value = selectedValue;
            }
            
            console.log('[DEBUG] Car dropdowns synchronized successfully. Auto-join dropdown now has', 
                       autoJoinCarDropdown.options.length, 'options');
            return true;
        } catch (error) {
            console.error('[DEBUG] Error synchronizing dropdowns:', error);

            try {
                autoJoinCarDropdown.innerHTML = mainCarDropdown.innerHTML;
                console.log('[DEBUG] Used fallback approach for syncing dropdowns');
                return true;
            } catch (fallbackError) {
                console.error('[DEBUG] Fallback sync also failed:', fallbackError);
                return false;
            }
        }
    }

    function initializeAll() {
        console.log('[Initialization] Starting script initialization');
        
        // Always check if we need to handle a pending car selection
        checkPendingOfficialRaceCarSelection();
        
        // If we're on the official race page or car selection page, check more frequently
        if (window.location.href.includes('section=getInRace') || 
            window.location.href.includes('section=changeRacingCar')) {
            console.log('[Initialization] On race or car page, scheduling additional selection checks');
            setTimeout(checkPendingOfficialRaceCarSelection, 500);
            setTimeout(checkPendingOfficialRaceCarSelection, 1500);
            setTimeout(checkPendingOfficialRaceCarSelection, 3000);
        }

        if (typeof document !== 'undefined' && document.readyState !== 'loading') {
            init();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                init();
            });
        }

        // Additional check on full page load
        if (document.readyState === 'complete') {
            checkPendingOfficialRaceCarSelection();
        } else {
            window.addEventListener('load', function() {
                checkPendingOfficialRaceCarSelection();
            });
        }
    }

    function removeAutoJoinPreset(presetName) {
        if (!confirm(`Are you sure you want to remove auto-join preset "${presetName}"?`)) {
            return;
        }
        
        try {
            const presets = loadAutoJoinPresets();
            delete presets[presetName];
            GM_setValue('autoJoinPresets', JSON.stringify(presets));
            
            updateQuickLaunchButtons();
            displayStatusMessage(`Auto-join preset "${presetName}" removed.`, 'success');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        } catch (error) {
            console.error('Error removing auto-join preset:', error);
            displayStatusMessage('Error removing auto-join preset', 'error');
            setTimeout(() => displayStatusMessage('', ''), 3000);
        }
    }

    if (document.readyState !== 'loading') {
        initializeAll();
    } else {
        document.addEventListener('DOMContentLoaded', initializeAll);
    }

    function enforceElementBoundaries(element) {
        if (!element || !element.getBoundingClientRect) return;

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        const rect = element.getBoundingClientRect();
        const elemWidth = rect.width;
        const elemHeight = rect.height;

        const padding = 10;

        let newLeft = rect.left;
        let newTop = rect.top;

        if (newLeft < padding) {
            newLeft = padding;
        }

        if (newLeft + elemWidth > viewportWidth - padding) {
            newLeft = viewportWidth - elemWidth - padding;
        }

        if (newTop < padding) {
            newTop = padding;
        }

        if (newTop + elemHeight > viewportHeight - padding) {
            newTop = viewportHeight - elemHeight - padding;
        }

        if (newLeft !== rect.left || newTop !== rect.top) {
            if (window.getComputedStyle(element).position === 'fixed' || 
                window.getComputedStyle(element).position === 'absolute') {
                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;
            } else {
                const deltaX = newLeft - rect.left;
                const deltaY = newTop - rect.top;

                const style = window.getComputedStyle(element);
                const currentTransform = style.transform;
                
                if (currentTransform === 'none') {
                    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                } else {
                    element.style.transform = `${currentTransform} translate(${deltaX}px, ${deltaY}px)`;
                }
            }
        }
    }

    function initializeOfficialRacesSection() {
        const officialTrackButtons = document.getElementById('officialTrackButtons');
        if (!officialTrackButtons) return;

        officialTrackButtons.innerHTML = `
            <div class="official-races-description">
                Official races auto-assign tracks. Just select your car and click below to join.
            </div>
            <div class="official-race-button-container">
                <button id="joinOfficialRaceButton" class="join-official-race-button">Join Official Race</button>
                <button id="saveOfficialPresetButton" class="save-official-preset-button">Save As Quick Launch</button>
            </div>
            <br>
            <div id="officialRaceStatus"></div>
        `;

        // Add event listeners to the buttons
        const joinButton = document.getElementById('joinOfficialRaceButton');
        const saveButton = document.getElementById('saveOfficialPresetButton');
        
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                joinOfficialRace();
            });
        }
        
        if (saveButton) {
            saveButton.addEventListener('click', saveOfficialRacePreset);
        }
    }

    async function joinOfficialRace(carId = null) {
        console.log('[Official Race] joinOfficialRace called with carId:', carId);
        
        // If carId not provided, try to get it from the input field
        if (!carId) {
            try {
                const officialCarIdElement = document.getElementById('officialCarId');
                if (officialCarIdElement) {
                    carId = officialCarIdElement.value;
                    console.log('[Official Race] Got carId from DOM element:', carId);
                } else {
                    const errorMsg = 'Error: Car ID element not found and no car ID provided';
                    console.error('[Official Race]', errorMsg);
                    displayQuickLaunchStatus(errorMsg, 'error');
                    return;
                }
            } catch (error) {
                console.error('[Official Race] Error accessing car ID element:', error);
                displayQuickLaunchStatus('Error accessing car ID element', 'error');
                return;
            }
        }
        
        if (!carId) {
            const errorMsg = 'Please select a car first';
            try {
                const statusElement = document.getElementById('officialRaceStatus');
                if (statusElement) {
                    displayStatusMessage(errorMsg, 'error', 'officialRaceStatus');
                }
            } catch (error) {
                console.error('[Official Race] Error accessing status element:', error);
            }
            displayQuickLaunchStatus(errorMsg, 'error');
            return;
        }

        // Store car ID for direct selection
        try {
            sessionStorage.setItem('pendingOfficialRaceCarId', carId);
            console.log('[Official Race] Saved car ID for car selection:', carId);
        } catch (error) {
            console.error('[Official Race] Error saving car ID to session storage:', error);
        }
        
        // Try to update status elements if they exist
        try {
            const statusElement = document.getElementById('officialRaceStatus');
            if (statusElement) {
                displayStatusMessage('Joining official race...', 'info', 'officialRaceStatus');
            }
        } catch (error) {
            console.error('[Official Race] Error updating status element:', error);
        }
        
        // Always try to update quick launch status
        try {
            displayQuickLaunchStatus('Joining official race...', 'info');
        } catch (error) {
            console.error('[Official Race] Error updating quick launch status:', error);
        }
        
        try {
            const rfcValue = getRFC();
            
            if (!rfcValue) {
                const errorMsg = 'Could not get RFC value';
                try {
                    const statusElement = document.getElementById('officialRaceStatus');
                    if (statusElement) {
                        displayStatusMessage(errorMsg, 'error', 'officialRaceStatus');
                    }
                } catch (error) {
                    console.error('[Official Race] Error updating status element:', error);
                }
                displayQuickLaunchStatus(errorMsg, 'error');
                return;
            }
            
            console.log('[Official Race] Got RFC value:', rfcValue);

            // Create and submit form to join the race
            const joinRaceUrl = 'https://www.torn.com/loader.php';
            
            const form = document.createElement('form');
            form.method = 'GET'; 
            form.action = joinRaceUrl;
            form.style.display = 'none';
            
            const params = {
                'sid': 'racing',
                'tab': 'race',
                'section': 'changeRacingCar',
                'step': 'getInRace',
                'rfcv': rfcValue
            };

            for (const key in params) {
                try {
                    if (params.hasOwnProperty(key)) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = params[key];
                        form.appendChild(input);
                    }
                } catch (error) {
                    console.error('[Official Race] Error adding form parameter:', key, error);
                }
            }

            // Add event listener to navigate to car selection URL after form submission
            try {
                window.addEventListener('beforeunload', () => {
                    console.log('[Official Race] Form submitted, navigating to car selection');
                }, { once: true });
            } catch (error) {
                console.error('[Official Race] Error adding beforeunload event listener:', error);
            }

            try {
                document.body.appendChild(form);
                console.log('[Official Race] Submitting join race form with RFC:', rfcValue);
                form.submit();
            } catch (error) {
                throw new Error(`Error submitting form: ${error.message}`);
            }
        } catch (error) {
            const errorMsg = `Error joining race: ${error.message}`;
            
            try {
                const statusElement = document.getElementById('officialRaceStatus');
                if (statusElement) {
                    displayStatusMessage(errorMsg, 'error', 'officialRaceStatus');
                }
            } catch (innerError) {
                console.error('[Official Race] Error updating status element in catch block:', innerError);
            }
            
            try {
                displayQuickLaunchStatus(errorMsg, 'error');
            } catch (innerError) {
                console.error('[Official Race] Error updating quick launch status in catch block:', innerError);
            }
            
            console.error('[Official Race] Error joining race:', error);
        }
    }

    function joinOfficialRaceFromPreset(preset) {
        if (!preset || !preset.carId) {
            console.error('[Official Race] Invalid preset or missing car ID:', preset);
            displayQuickLaunchStatus('Error: Invalid preset data', 'error');
            return;
        }
        
        console.log('[Official Race] Joining with car ID from preset:', preset.carId);
        
        // Use the car ID directly from the preset, not from any UI element
        joinOfficialRace(preset.carId);
    }

    async function joinOfficialRace() {
        const carId = document.getElementById('officialCarId').value;
        if (!carId) {
            displayOfficialRaceStatus('Please select a car first', 'error');
            return;
        }

        sessionStorage.setItem('pendingOfficialRaceCarId', carId);
        console.log('[Official Race] Saved car ID for later selection:', carId);
        
        displayOfficialRaceStatus('Joining official race...', 'info');
        
        try {
            const rfcValue = getRFCFromPage() || getRFC();
            
            if (!rfcValue) {
                throw new Error('Failed to get RFC value');
            }
            
            console.log('[Official Race] Got RFC value:', rfcValue);

            const form = document.createElement('form');
            form.method = 'GET'; 
            form.action = 'https://www.torn.com/loader.php';
            form.style.display = 'none';
            
            const params = {
                'sid': 'racing',
                'tab': 'race',
                'section': 'changeRacingCar',
                'step': 'getInRace',
                'rfcv': rfcValue
            };

            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = params[key];
                    form.appendChild(input);
                }
            }

            document.body.appendChild(form);
            console.log('[Official Race] Submitting join race form with RFC:', rfcValue);
            form.submit();
        } catch (error) {
            displayOfficialRaceStatus(`Error joining race: ${error.message}`, 'error');
            console.error('[Official Race] Error joining race:', error);
        }
    }

    // Helper function to get user ID from page
    function getUserIdFromPage() {
        try {
            // Try to extract from profile link
            const profileLink = document.querySelector('a[href*="profiles.php?XID="]');
            if (profileLink) {
                const match = profileLink.href.match(/XID=(\d+)/);
                if (match && match[1]) return match[1];
            }
            
            // Try other common locations
            const sidLinks = document.querySelectorAll('a[href*="sid="], input[name="userID"]');
            for (const el of sidLinks) {
                let idMatch;
                if (el.href) {
                    idMatch = el.href.match(/user_?[iI][dD]=(\d+)/);
                } else if (el.value) {
                    idMatch = el.value.match(/^(\d+)$/);
                }
                if (idMatch && idMatch[1]) return idMatch[1];
            }
            
            return null;
        } catch (e) {
            console.error('Error getting user ID:', e);
            return null;
        }
    }

    function executeOfficialRacePreset(preset) {
        if (!preset || !preset.carId) {
            console.error('[Official Race] Invalid preset or missing car ID:', preset);
            displayQuickLaunchStatus('Error: Invalid preset data', 'error');
            return;
        }
        
        console.log('[Official Race] Executing official race preset with car ID:', preset.carId);
        
        // Store car information in sessionStorage for retrieval on car selection page
        try {
            sessionStorage.setItem('pendingOfficialRaceCarId', preset.carId);
            sessionStorage.setItem('pendingOfficialRaceCarName', preset.carName || '');
            sessionStorage.setItem('pendingOfficialRacePresetTimestamp', Date.now().toString());
            console.log('[Official Race] Stored car data in session storage');
        } catch (e) {
            console.error('[Official Race] Failed to store car data in session storage:', e);
        }
        
        // Show status message if possible
        displayQuickLaunchStatus(`Joining official race with ${preset.carName || 'car #' + preset.carId}...`, 'info');
        
        // Get RFC value
        const rfcValue = getRFC();
        if (!rfcValue) {
            displayQuickLaunchStatus('Error: Could not get security token (RFC)', 'error');
            console.error('[Official Race] Could not get RFC value');
            return;
        }
        
        // Step 1: Navigate to the official race page to initialize the race
        const joinRaceUrl = `https://www.torn.com/loader.php?sid=racing&tab=race&section=getInRace&step=getInRace&rfcv=${rfcValue}`;
        console.log('[Official Race] Navigating to:', joinRaceUrl);
        
        // We use a timeout to allow the status message to be displayed
        setTimeout(() => {
            // Create and store the car selection URL for use after the redirect
            const carSelectionUrl = `https://www.torn.com/loader.php?sid=racing&tab=cars&section=changeRacingCar&step=changeRacingCar&id=${preset.carId}&rfcv=${rfcValue}&type=official`;
            sessionStorage.setItem('pendingOfficialRaceCarSelectionUrl', carSelectionUrl);
            
            // Navigate to the first URL (official race page)
            window.location.href = joinRaceUrl;
        }, 100);
    }

    function checkPendingOfficialRaceCarSelection() {
        console.log('[Official Race] Running car selection check');
    
        const pendingCarId = sessionStorage.getItem('pendingOfficialRaceCarId');
        const pendingUrl = sessionStorage.getItem('pendingOfficialRaceCarSelectionUrl');
        const timestamp = sessionStorage.getItem('pendingOfficialRacePresetTimestamp');
        
        // Clear old pending selections (older than 5 minutes)
        if (timestamp && (Date.now() - parseInt(timestamp)) > 300000) {
            console.log('[Official Race] Clearing stale pending car selection (older than 5 minutes)');
            sessionStorage.removeItem('pendingOfficialRaceCarId');
            sessionStorage.removeItem('pendingOfficialRaceCarName');
            sessionStorage.removeItem('pendingOfficialRacePresetTimestamp');
            sessionStorage.removeItem('pendingOfficialRaceCarSelectionUrl');
            return;
        }
        
        if (pendingCarId) {
            console.log('[Official Race] Found pending car selection:', pendingCarId);
    
            // If we're on the official race entry page after clicking the preset
            if (window.location.href.includes('section=getInRace') && 
                window.location.href.includes('step=getInRace') && 
                window.location.href.includes('tab=race')) {
                
                console.log('[Official Race] On official race entry page, proceeding to car selection');
                
                // Navigate to car selection URL if we have it stored
                if (pendingUrl) {
                    console.log('[Official Race] Navigating to stored car selection URL:', pendingUrl);
                    sessionStorage.removeItem('pendingOfficialRaceCarSelectionUrl');
                    window.location.href = pendingUrl;
                    return;
                }
                
                // Fallback: Generate car selection URL if we don't have one stored
                const rfcValue = getRFC();
                if (rfcValue) {
                    const carSelectionUrl = `https://www.torn.com/loader.php?sid=racing&tab=cars&section=changeRacingCar&step=changeRacingCar&id=${pendingCarId}&rfcv=${rfcValue}&type=official`;
                    console.log('[Official Race] Navigating to generated car selection URL:', carSelectionUrl);
                    window.location.href = carSelectionUrl;
                    return;
                }
            }
            
            // If we're on the car selection page, select the car
            if (window.location.href.includes('section=changeRacingCar')) {
                console.log('[Official Race] On car selection page, looking for car select element');
                
                // Look for the car selection element which may take a moment to appear
                const checkForCarElement = () => {
                    const carSelectElements = document.querySelectorAll('a[href*="id=' + pendingCarId + '"]');
                    
                    if (carSelectElements.length > 0) {
                        console.log('[Official Race] Found car element, clicking it');
                        // Found the element, click it
                        carSelectElements[0].click();
                        
                        // Clear the pending selection
                        sessionStorage.removeItem('pendingOfficialRaceCarId');
                        sessionStorage.removeItem('pendingOfficialRaceCarName');
                        sessionStorage.removeItem('pendingOfficialRacePresetTimestamp');
                        return true;
                    }
                    
                    // Also look for direct select form
                    const carForms = document.querySelectorAll('form[action*="changeRacingCar"]');
                    for (const form of carForms) {
                        const idInput = form.querySelector('input[name="id"]');
                        if (idInput) {
                            console.log('[Official Race] Found car select form, setting ID and submitting');
                            idInput.value = pendingCarId;
                            form.submit();
                            
                            // Clear the pending selection
                            sessionStorage.removeItem('pendingOfficialRaceCarId');
                            sessionStorage.removeItem('pendingOfficialRaceCarName');
                            sessionStorage.removeItem('pendingOfficialRacePresetTimestamp');
                            return true;
                        }
                    }
                    
                    return false;
                };
                
                // Try immediately
                if (!checkForCarElement()) {
                    // If not found, try again after a delay
                    setTimeout(checkForCarElement, 500);
                    setTimeout(checkForCarElement, 1500);
                    setTimeout(checkForCarElement, 3000);
                }
            }
        }
    }


    function saveOfficialRacePreset() {
        const carId = document.getElementById('officialCarId').value;
        const carDropdown = document.getElementById('officialCarDropdown');
        
        if (!carId) {
            displayStatusMessage('Please select a car first', 'error', 'officialRaceStatus');
            return;
        }
        
        const presetName = prompt("Enter a name for this official race preset:");
        if (!presetName) {
            displayStatusMessage('Preset name cannot be empty', 'error', 'officialRaceStatus');
            return;
        }

        const carOption = carDropdown.querySelector(`option[value="${carId}"]`);
        const carName = carOption ? carOption.textContent.split(' (ID:')[0] : null;
        
        const presetData = {
            type: 'official',
            carId: carId,
            carName: carName,
        };
        
        let officialPresets = loadOfficialRacePresets();
        officialPresets[presetName] = presetData;
        GM_setValue('official_race_presets', JSON.stringify(officialPresets));

        updateQuickLaunchButtons();
        displayStatusMessage(`Official race preset "${presetName}" saved`, 'success', 'officialRaceStatus');
    }

    function loadOfficialRacePresets() {
        try {
            return JSON.parse(GM_getValue('official_race_presets', '{}'));
        } catch (e) {
            console.error('Error loading official race presets:', e);
            return {};
        }
    }

    function showOfficialRaceTrackSelector(preset) {
    console.log('[Official Race] Using preset:', preset);
    
    // Only try to update UI elements if they exist (GUI is open)
    // But don't require them for the preset to work
    const officialCarId = document.getElementById('officialCarId');
    const officialCarDropdown = document.getElementById('officialCarDropdown');
    
    if (officialCarId) officialCarId.value = preset.carId;
    if (officialCarDropdown) officialCarDropdown.value = preset.carId;
    
    // Display status message if UI element exists, but don't require it
    const statusElement = document.getElementById('officialRaceStatus');
    if (statusElement) {
        displayStatusMessage(`Using car: ${preset.carName || preset.carId}`, 'info', 'officialRaceStatus');
    }
    
    // Always show in quick launch status for feedback regardless of GUI state
    displayQuickLaunchStatus(`Joining official race with ${preset.carName || preset.carId}...`, 'info');
    
    // Continue with joining the official race using the preset - this is the crucial part
    // that needs to work even if the GUI hasn't been opened
    joinOfficialRaceFromPreset(preset);
}

    function removeOfficialRacePreset(presetName) {
        if (!confirm(`Are you sure you want to remove official race preset "${presetName}"?`)) {
            return;
        }
        
        let presets = loadOfficialRacePresets();
        delete presets[presetName];
        GM_setValue('official_race_presets', JSON.stringify(presets));
        
        updateQuickLaunchButtons();
        displayQuickLaunchStatus(`Official race preset "${presetName}" removed`, 'success');
    }

    function displayOfficialRaceStatus(message, type = '') {
        const statusElement = document.getElementById('officialRaceStatus');
        if (!statusElement) {
            console.error('Official race status element not found');
            return;
        }
        
        statusElement.textContent = message;
        statusElement.className = '';
        
        if (type) {
            statusElement.classList.add(type);
        }

        statusElement.style.display = 'block';
        
        displayStatusMessage(message, type);  

        console.log(`[Official Race Status - ${type}]: ${message}`);
    }

})();
