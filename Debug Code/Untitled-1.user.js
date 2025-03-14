// ==UserScript==
// @name         Torn City: 1 Click Racing
// @namespace    Ownen [3077223]
// @version      0.5.9
// @description  Adds buttons to the raceway, that instantly starts a specific race.
// @author       Ownen [3077223]
// @match        https://www.torn.com/*
// @downloadURL  https://codeberg.org/Ownen/userscripts/raw/branch/main/torn/one_click_racing/one_click_racing.user.js
// @updateURL    https://codeberg.org/Ownen/userscripts/raw/branch/main/torn/one_click_racing/one_click_racing.user.js
// @run-at document-idle
// ==/UserScript==

(function () {
    'use strict';

    let AddCss = () => {
        // Add script specific style to page
        const style = document.createElement('style');
        style.textContent = `
        #tcocrConfigDialog {
            position: fixed;
            top: 15px;
            right: 15px;
            border-bottom: 1px solid;
            border-radius: 5px;
            background-color: var(--default-bg-panel-color);
            border-bottom-color: var(--panel-border-bottom-color);
            padding: 20px;
            z-index: 100000;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        #tcocrConfigDialog h2 {
            color: var(--content-title-color);
            margin-top: initial;
        }

        #tcocrConfigEntries {
            margin-bottom: 15px;
        }

        .tcocrConfigEntry {
            margin-bottom: 5px;
            text-align: center;
        }

        .tcocrConfigInput {
            background:#fff;
            background:var(--gym-input-bg-color);
            border:1px solid #ccc;
            border-color:var(--input-border-color);
            border-radius:5px;
            box-sizing:border-box;
            color:#333;
            color:var(--gym-input-font-color);
            line-height:22px;
            padding:0 15px;
            text-align:center;
            width:160px
        }

        .tcocrConfigTrackId, .tcocrConfigCarId{
            height: 25px;
        }

        .tcocrConfigTrackId {
            width: 120px;
        }

        #tcocrConfigButtons {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        #tcocrConfigExt{
            margin-bottom: 10px;
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            background:#fff;
            background:var(--gym-input-bg-color);
            border:1px solid #ccc;
            border-color:var(--input-border-color);
            border-radius:5px;
            line-height:22px;
            padding: 5px;
            text-align:center;
        }

        #tcocrSaveConfig {
            margin-left: auto;
        }

        #tcocrCancelConfig {
            margin-left: 5px;
        }

        .tcocrConfigId {
            display: none;
        }

        .tcocrConfigLabel {
            width: 190px;
        }

        .tcocrConfigLaps {
            width: 90px;
        }

        #tcocrConfigEnableSidebar {
            margin-left: 0px;
        }

        #tcocrConfigApiKey {
            -webkit-text-security: disc;
            text-security: disc;
        }

        #tcocrConfigApiKeyLabel {
            margin-right: 10px;
        }

        #tcocrBar, #tcocrBarSidebar {
            background: url(/images/v2/racing/header/stripy_bg.png) 0 0 repeat;
            border: 1px solid #000;
            font-size: 12px;
            line-height: 24px;
            padding-left: 10px;
            padding-right: 10px;
            border-radius: 5px;
            margin-top: 3px;
            margin-bottom: -8px;
            text-decoration: none;
            text-align: center;
            color: #00BFFF;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 1);
        }

        #tcocrBarSidebar {
            background: var(--default-bg-panel-color);
            padding: 3px;
            font-weight: 700;
            color: inherit;
            border: 0px;
            border-radius: 0 5px 5px 0; 
            line-height: 20px;
            margin-top: 2px;
            margin-bottom: 2px;
            text-shadow: 0 0px 0px rgba(0, 0, 0, 0);
        }
      
        #tcocrBarConfigButton {
            cursor: pointer;
            margin-right: 5px;
        }

        .tcocrBarLink {
            cursor: pointer;
        }

        #tcocrBarSidebar .tcocrBarLink {
            display: block;
            text-align: left;
            margin-left: 8px;
        }

        #tcocrBarSidebar .tcocrBarLink:hover {
            color: #888888;
        }

        .tcocrBarLinkSeparator {
            margin-left: 3px;
            margin-right: 3px;
            color: #FFF;
        }

        #tcocrSpinnerContainer {
            position: relative;
        }

        #tcocrSpinner {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%); /* Adjusts position to center */
            border: 4px solid #f3f3f3; /* Light grey */
            border-top: 4px solid #3498db; /* Blue */
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: tcocrSpin 1s linear infinite;
        }

        @keyframes tcocrSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media only screen and (max-width: 999px) {
            #tcocrBar, #tcocrBarSidebar {
                font-size: 15px;
                line-height: 36px;
            }

            #tcocrBarSidebar {
                font-size: 16px;
                line-height: 30px;
            }

            #tcocrBarSidebar .tcocrBarLink {
                display: initial;
                text-align: center;
            }
        }
        `;

        document.head.appendChild(style);
    }

    let placeOcrBar = (selector, sidebar = false) => {
        let sideBarSelectorSuffix = "";
        if (sidebar) {
            sideBarSelectorSuffix = "Sidebar";
        }
        document.querySelector('#tcocrBar' + sideBarSelectorSuffix)?.remove();
        document.querySelector(selector).insertAdjacentHTML('afterend', `
            <div id="tcocrBar${sideBarSelectorSuffix}">
                ${!sidebar ? '<a id="tcocrBarConfigButton">+</a>' : ''}
            </div>
        `);

        const configKeys = Object.keys(config);
        if (configKeys.length > 0) {
            configKeys.forEach((id, index) => {
                document.querySelector('#tcocrBar' + sideBarSelectorSuffix).insertAdjacentHTML('beforeend', `
                    <a class="tcocrBarLink" data-id="${id}">${config[id]?.label}</a>
                    ${(index < configKeys.length - 1) && (!sidebar) ? '<span class="tcocrBarLinkSeparator"> * </span>' : ''}
                `);
            });
        } else {
            if (!sidebar) {
                document.querySelector('#tcocrBar').insertAdjacentHTML('beforeend', `
                    <span><-- Click here to add tracks!</span>
                `);
            }
        }

        document.querySelector('#tcocrBar' + sideBarSelectorSuffix).addEventListener('click', function (event) {
            if (event.target.classList.contains('tcocrBarLink')) {
                const id = event.target.dataset.id;
                startRace(id);
            }
        });

        if (!sidebar) {
            document.querySelector('#tcocrBarConfigButton').addEventListener('click', () => {
                showConfigDialog(selector);
            });
        }
    }

    let getUnixTimestamp = () => {
        return Math.floor(Date.now() / 1000);
    }

    let showConfigDialog = async (selector) => {
        let dialog = document.createElement('div');
        dialog.innerHTML = `
            <div id="tcocrConfigDialog">
                <h2>Track Link List</h2>
                <div id="tcocrConfigEntries">
                    <div id="tcocrSpinnerContainer">
                        <div id="tcocrSpinner"></div>
                    </div>
                </div>
                <div id="tcocrConfigExt">
                    <span>
                        <span id="tcocrConfigApiKeyLabel">API key:</span>
                        <input type="text" id="tcocrConfigApiKey" class="tcocrConfigInput" value="${apiKey}" placeholder="Limited Access API Key">
                    </span>
                    <label>
                        Show in sidebar:
                        <input type="checkbox" id="tcocrConfigEnableSidebar" ${showSidebar ? 'checked' : ''} title="Show links in the sidebar as well.">
                    </label>
                </div>
                <div id="tcocrConfigButtons">
                    <button id="tcocrNewEntry" class="torn-btn">New</button>
                    <button id="tcocrSaveConfig" class="torn-btn">Save</button>
                    <button id="tcocrCancelConfig" class="torn-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        const spinner = document.getElementById('tcocrSpinner');

        // Fetch Car and Track data
        let enlistedCars = {};
        let tracks = {};
        if (apiKey) {
            try {
                spinner.style.display = 'block';

                enlistedCars = await fetchApiData('https://api.torn.com/v2/user/enlistedcars?key=' + apiKey);
                enlistedCars = enlistedCars ? enlistedCars.enlistedcars : [];
                tracks = await fetchApiData('https://api.torn.com/v2/racing/tracks?key=' + apiKey);
                tracks = tracks ? tracks.tracks : [];
            } catch (error) {
                console.error('Error:', error);
            } finally {
                spinner.style.display = 'none';
            }

            for (let id in config) {
                addConfigEntry({
                    id: id,
                    label: config[id]?.label,
                    trackId: config[id]?.trackId,
                    carId: config[id]?.carId,
                    laps: config[id]?.laps,
                    minDrivers: config[id]?.minDrivers,
                    maxDrivers: config[id]?.maxDrivers,
                    allowUpgrades: config[id]?.allowUpgrades,
                    trackData: tracks,
                    carData: enlistedCars,
                });
            }
        }

        dialog.querySelector('#tcocrNewEntry').addEventListener('click', () => {
            addConfigEntry({
                id: getUnixTimestamp(),
                trackData: tracks,
                carData: enlistedCars
            });
        });

        dialog.querySelector('#tcocrSaveConfig').addEventListener('click', () => {
            saveConfig(selector);
            dialog.remove();
        });

        dialog.querySelector('#tcocrCancelConfig').addEventListener('click', () => {
            dialog.remove();
        });
    }

    let addConfigEntry = ({
        id,
        label = 'Your race title',
        trackId,
        carId,
        laps = 100,
        minDrivers = 2,
        maxDrivers = 2,
        allowUpgrades = 1,
        trackData,
        carData,
    }) => {
        let entry = document.createElement('div');
        entry.classList.add("tcocrConfigEntry");

        entry.innerHTML = `
            <input type="text" class="tcocrConfigId tcocrConfigInput" value="${id}">
            <input type="text" maxlength="25" class="tcocrConfigLabel tcocrConfigInput" value="${label}" placeholder="Race title">
            ${createTracksSelectBox(trackData, trackId)}
            ${createEnlistedCarsSelectBox(carData, carId)}
            <div class="tcocrConfigMore" style="display: none;">
                <input class="tcocrConfigLaps tcocrConfigInput" value="${laps}" placeholder="laps" title="default 100" type="number" min="1" max="100">
                <input class="tcocrConfigMinDrivers tcocrConfigInput" value="${minDrivers}" placeholder="Min Drivers" title="default 2" type="number" min="2" max="6">
                <input class="tcocrConfigMaxDrivers tcocrConfigInput" value="${maxDrivers}" placeholder="Max Drivers" title="default 2" type="number" min="2" max="100">
                <label>
                    Allow upgrades:
                    <input type="checkbox" id="tcocrConfigAllowUpgrades" ${allowUpgrades != 2 ? 'checked' : ''}>
                </label>
            </div>
            <button class="torn-btn tcocrConfigToggleMore">+</button>
            <button class="torn-btn tcocrRemoveEntry">Remove</button>
        `;
        document.querySelector('#tcocrConfigEntries').appendChild(entry);

        entry.querySelector('.tcocrRemoveEntry').addEventListener('click', () => {
            entry.remove();
        });

        entry.querySelector('.tcocrConfigToggleMore').addEventListener('click', (event) => {
            const button = event.target;
            const additionalDetails = button.closest('.tcocrConfigEntry').querySelector('.tcocrConfigMore');
            if (additionalDetails.style.display === 'none' || additionalDetails.style.display === '') {
                additionalDetails.style.display = 'block';
                button.textContent = '-';
            } else {
                additionalDetails.style.display = 'none';
                button.textContent = '+';
            }
        });


    }

    let createTracksSelectBox = (data, trackId) => {
        const selectElement = document.createElement('select');
        selectElement.classList.add("tcocrConfigTrackId");
        selectElement.classList.add("tcocrConfigInput");

        data.forEach((track, index) => {
            let option = new Option(track.title, track.id);
            if (track.id == trackId) {
                option = new Option(track.title, track.id, true, false);
            }
            selectElement.add(option);
        });

        return selectElement.outerHTML;
    }

    let createEnlistedCarsSelectBox = (data, carId) => {
        const selectElement = document.createElement('select');
        selectElement.classList.add("tcocrConfigCarId");
        selectElement.classList.add("tcocrConfigInput");

        data.forEach((car, index) => {
            // Check car parts to append to name
            let name = car.item_name;
            let suffix = "";
            if (car.parts.includes(84)) // Paddle Shift Gearbox (Long Ratio)
                suffix += "TL";
            if (car.parts.includes(85)) // Paddle Shift Gearbox (Short Ratio)
                suffix += "TS";
            if (car.parts.includes(86)) // Rally Gearbox (Long Ratio)
                suffix += "DL";
            if (car.parts.includes(87)) // Rally Gearbox (Short Ratio)
                suffix += "DS";
            if (car.parts.includes(81)) // Stage Two Turbo kit
                suffix += "2";
            if (car.parts.includes(99)) // Stage Three Turbo Kit
                suffix += "3";

            suffix ? name += ` (${suffix})` : '';

            let option = new Option(name, car.id);
            if (car.id == carId) {
                option = new Option(name, car.id, true, false);
            }
            selectElement.add(option);
        });

        return selectElement.outerHTML;
    }

    let startRace = (id) => {
        const laps = config[id].laps || 100;
        const minDrivers = config[id].minDrivers || 2;
        const maxDrivers = config[id].maxDrivers || 2;
        const allowUpgrades = config[id].allowUpgrades || 1;
        const url = `https://www.torn.com/loader.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=&carID=${config[id].carId}&createRace=true&title=${config[id].label}&minDrivers=${minDrivers}&maxDrivers=${maxDrivers}&trackID=${config[id].trackId}&laps=${laps}&minClass=5&carsTypeAllowed=${allowUpgrades}&carsAllowed=5&betAmount=0&waitTime=${getUnixTimestamp()}&rfcv=${getRFC()}`;

        fetch(url, {
            method: 'GET',
            credentials: 'include'
        }).then(data => {
            window.location = 'https://www.torn.com/loader.php?sid=racing';
        }).catch(error => {
            console.error('Error:', error);
        });
    }

    let saveConfig = (selector) => {
        let newConfig = {};
        let entries = document.querySelectorAll('#tcocrConfigEntries > .tcocrConfigEntry');

        entries.forEach(entry => {
            let id = entry.querySelector('.tcocrConfigId').value.trim();
            let label = entry.querySelector('.tcocrConfigLabel').value.trim();
            let trackId = entry.querySelector('.tcocrConfigTrackId').value.trim();
            let carId = entry.querySelector('.tcocrConfigCarId').value.trim();

            let laps = entry.querySelector('.tcocrConfigLaps').value.trim();
            let minDrivers = entry.querySelector('.tcocrConfigMinDrivers').value.trim();
            let maxDrivers = entry.querySelector('.tcocrConfigMaxDrivers').value.trim();
            let allowUpgrades = entry.querySelector('#tcocrConfigAllowUpgrades').checked ? 1 : 2;

            if (id)
                newConfig[id] = {
                    "label": label,
                    "trackId": trackId,
                    "carId": carId,
                    "laps": laps,
                    "minDrivers": minDrivers,
                    "maxDrivers": maxDrivers,
                    "allowUpgrades": allowUpgrades
                };
        });

        config = newConfig;
        if (apiKey)
            localStorage.setItem('tcocrScriptConfig', JSON.stringify(config));

        apiKey = document.querySelector('#tcocrConfigApiKey').value.trim();
        localStorage.setItem('tcocrConfigApiKey', apiKey);

        showSidebar = !!document.querySelector('#tcocrConfigEnableSidebar').checked;
        localStorage.setItem('tcocrConfigShowSidebar', showSidebar);

        placeOcrBar(selector);
        if (showSidebar) {
            placeOcrBar(buttonCssSelectorSidebar, true);
        } else {
            document.querySelector('#tcocrBarSidebar')?.remove();
        }
    }

    let fetchApiData = async (url) => {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            throw error;
        }
    }

    // https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
    function waitForKeyElements(selectorOrFunction, callback, waitOnce, interval, maxIntervals) {
        if (typeof waitOnce === "undefined") {
            waitOnce = true;
        }
        if (typeof interval === "undefined") {
            interval = 300;
        }
        if (typeof maxIntervals === "undefined") {
            maxIntervals = -1;
        }
        if (typeof waitForKeyElements.namespace === "undefined") {
            waitForKeyElements.namespace = Date.now().toString();
        }
        var targetNodes = (typeof selectorOrFunction === "function")
            ? selectorOrFunction()
            : document.querySelectorAll(selectorOrFunction);

        var targetsFound = targetNodes && targetNodes.length > 0;
        if (targetsFound) {
            targetNodes.forEach(function (targetNode) {
                var attrAlreadyFound = `data-userscript-${waitForKeyElements.namespace}-alreadyFound`;
                var alreadyFound = targetNode.getAttribute(attrAlreadyFound) || false;
                if (!alreadyFound) {
                    var cancelFound = callback(targetNode);
                    if (cancelFound) {
                        targetsFound = false;
                    }
                    else {
                        targetNode.setAttribute(attrAlreadyFound, true);
                    }
                }
            });
        }

        if (maxIntervals !== 0 && !(targetsFound && waitOnce)) {
            maxIntervals -= 1;
            setTimeout(function () {
                waitForKeyElements(selectorOrFunction, callback, waitOnce, interval, maxIntervals);
            }, interval);
        }
    }

    let stringToBoolean = (str) => {
        if (str === null || str === undefined) {
            return false;
        }
        return str.toLowerCase() === 'true';
    }

    //
    // Main 
    //

    let config = JSON.parse(localStorage.getItem('tcocrScriptConfig') || '{}');
    let showSidebar = stringToBoolean(localStorage.getItem('tcocrConfigShowSidebar')) || !!'';
    let apiKey = localStorage.getItem('tcocrConfigApiKey') || '';

    AddCss();

    if (/sid\=racing/.test(window.location)) {
        let buttonCssSelector = ".racing-main-wrap .header-wrap";
        waitForKeyElements(buttonCssSelector, () => {
            placeOcrBar(buttonCssSelector);
        }, false);
    }

    let buttonCssSelectorSidebar = "#sidebar > div:first-child";
    if (showSidebar) {
        setTimeout(function () { // little delay so other extensions and scripts load first.
            waitForKeyElements(buttonCssSelectorSidebar, () => {
                placeOcrBar(buttonCssSelectorSidebar, true);
            }, false);
        }, 100);
    }

})();
