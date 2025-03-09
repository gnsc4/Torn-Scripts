// ==UserScript==
// @name         Torn: Scripts library
// @namespace    lugburz.lib
// @version      0.1.5
// @description  Library of functions used in my Torn scripts.
// @author       Lugburz
// @exclude      *
// @grant        none
// ==/UserScript==

// Enhanced ajax function with debugging
function ajax(callback) {
    const debugInfo = {
        requests: new Map(),
        lastResponse: null,
        timing: new Map()
    };

    function logAjaxDebug(type, ...args) {
        console.log(`[Ajax Debug ${type}]`, ...args);
    }

    // Track all AJAX requests
    $(document).ajaxSend((event, xhr, settings) => {
        const requestId = Math.random().toString(36).substring(7);
        const startTime = performance.now();
        
        debugInfo.requests.set(requestId, {
            url: settings.url,
            startTime,
            xhr
        });

        logAjaxDebug('request', {
            id: requestId,
            url: settings.url,
            type: settings.type,
            data: settings.data
        });
    });

    // Enhanced ajax complete handler
    $(document).ajaxComplete((event, xhr, settings) => {
        // Track response timing
        const endTime = performance.now();

        if (xhr.readyState > 3 && xhr.status == 200) {
            let url = settings.url;
            if (url.indexOf("torn.com/") < 0) {
                url = "torn.com" + (url.startsWith("/") ? "" : "/") + url;
            }
            const page = url.substring(url.indexOf("torn.com/") + "torn.com/".length, url.indexOf(".php"));

            // Log detailed response info
            logAjaxDebug('response', {
                url,
                page,
                status: xhr.status,
                readyState: xhr.readyState,
                responseType: xhr.responseType,
                responseSize: xhr.responseText?.length,
                timing: {
                    total: endTime - debugInfo.requests.get([...debugInfo.requests.keys()].pop())?.startTime
                }
            });

            try {
                // Try to parse response as JSON for additional debugging
                const responseData = xhr.responseText && xhr.responseText[0] === '{' 
                    ? JSON.parse(xhr.responseText)
                    : null;

                if (responseData) {
                    logAjaxDebug('parsed', {
                        hasRaceData: !!responseData.raceData,
                        hasUserData: !!responseData.user,
                        dataKeys: Object.keys(responseData)
                    });
                }

                debugInfo.lastResponse = {
                    time: new Date(),
                    url,
                    page,
                    data: responseData
                };

            } catch (e) {
                logAjaxDebug('parse-error', {
                    error: e,
                    responseStart: xhr.responseText?.substring(0, 100)
                });
            }

            // Call original callback with enhanced error handling
            try {
                callback(page, xhr, settings);
            } catch (e) {
                console.error('Error in ajax callback:', e);
                logAjaxDebug('callback-error', {
                    error: e,
                    page,
                    lastResponse: debugInfo.lastResponse
                });
            }
        }
    });

    // Track failed requests
    $(document).ajaxError((event, xhr, settings, error) => {
        logAjaxDebug('error', {
            url: settings.url,
            status: xhr.status,
            error,
            requestHeaders: settings.headers,
            responseHeaders: xhr.getAllResponseHeaders()
        });
    });

    return debugInfo; // Return debug info object for external monitoring
}

function pad(num, size) {
    return ('000000000' + num).substr(-size);
}

function formatTime(date) {
    return pad(date.getUTCHours(), 2) + ':' + pad(date.getUTCMinutes(), 2) + ':' + pad(date.getUTCSeconds(), 2);
}

function formatTimeMsec(msec, alwaysShowHours = false) {
    const hours = Math.floor((msec % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msec % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((msec % (1000 * 60)) / 1000);
    const mseconds = Math.floor(msec % 1000);

    return (alwaysShowHours ? pad(hours, 2) + ":" : (hours > 0 ? hours + ":" : '')) + (hours > 0 || minutes > 0 ? pad(minutes, 2) + ":" : '') + pad(seconds, 2) + "." + pad(mseconds, 3);
}

function formatTimeSecWithLetters(msec) {
    const hours = Math.floor((msec % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msec % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((msec % (1000 * 60)) / 1000);

    return (hours > 0 ? hours + "h " : '') + (hours > 0 || minutes > 0 ? minutes + "min " : '') + seconds + "s";
}

// Enhanced decode64 with better validation
function decode64(input) {
    if (!input) {
        console.error('decode64: Empty input');
        return '';
    }

    const debugStart = performance.now();
    const base64test = /[^A-Za-z0-9\+\/\=]/g;
    
    // Input validation logging
    if (base64test.exec(input)) {
        console.warn('decode64: Invalid base64 characters detected in input:', {
            input: input.substring(0, 100),
            invalidChars: input.match(base64test)
        });
        // Clean invalid characters
        input = input.replace(base64test, '');
    }

    try {
        // Validate input length
        if (input.length % 4 !== 0) {
            console.warn('decode64: Input length not multiple of 4:', input.length);
            input = input.padEnd(Math.ceil(input.length / 4) * 4, '=');
        }

        var output = '';
        var chr1, chr2, chr3 = '';
        var enc1, enc2, enc3, enc4 = '';
        var i = 0;
        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
        do {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
            chr1 = chr2 = chr3 = '';
            enc1 = enc2 = enc3 = enc4 = '';
        } while (i < input.length);

        const debugEnd = performance.now();
        console.log(`decode64: Processed ${input.length} chars in ${debugEnd - debugStart}ms`);
        
        return unescape(output);
    } catch (error) {
        console.error('decode64: Error decoding input:', error);
        return '';
    }
}
