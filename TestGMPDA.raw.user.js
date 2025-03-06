// ==UserScript==
// @name         Test Script - GMPDA with Meta Headers (No GMfPDA Inline)
// @namespace    torn.testgmpda.metaheaders
// @version      0.1
// @description  Test GMPDA script for Torn PDA with metadata headers, NO GMforPDA inlined
// @author       GNSC4 (or your name/handle)
// @match        https://www.torn.com/loader.php?sid=racing*
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @grant        none
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/TestGMPDA_MetaHeaders_NoGMfPDA.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/TestGMPDA_MetaHeaders_NoGMfPDA.user.js
// @license      MIT (or your preferred license)
// ==/UserScript==

(function() {
    'use strict';
    $(document).ready(function() {
        $('div.content-title > h4').append('<span style="color: blue; margin-left: 10px;">TestGMPDA - MetaHeaders (No GMfPDA)</span>');
        if (typeof GM_getValue !== 'undefined') {
            $('div.content-title > h4').append('<span style="color: green; margin-left: 10px;">GM_getValue is Defined!</span>');
        } else {
            $('div.content-title > h4').append('<span style="color: red; margin-left: 10px;">GM_getValue is UNDEFINED!</span>');
        }
    });
})();