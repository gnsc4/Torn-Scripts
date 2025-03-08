// ==UserScript==
// @name         Torn Race Config GUI
// @version      3.1.3
// @description  GUI to configure Torn racing parameters and create races with presets and quick launch buttons
// @author       GNSC4
// @match        https://www.torn.com/loader.php?sid=racing*
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
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const GM = {
        xmlHttpRequest: (details) => {
            return new Promise((resolve, reject) => {
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

    // ...rest of the code from RaceConfiguration.raw.user.js...

})();
