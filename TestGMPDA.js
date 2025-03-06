// ==UserScript==
// @name         Minimal Test Script - DOM Test (PDA)
// @match        https://www.torn.com/loader.php?sid=racing*
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==

(function() {
    'use strict';
    $(document).ready(function() {
        $('div.content-title > h4').append('<span style="color: red; margin-left: 10px;">Minimal Script Injected (PDA Test)</span>');
    });
})();