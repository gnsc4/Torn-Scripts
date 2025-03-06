// ==UserScript==
// @name         Minimal Test Script - DOM Test PDA v2
// @match        https://www.torn.com/loader.php?sid=racing*
// ==/UserScript==

document.querySelector('div.content-title > h4').textContent += ' PDA Script Injected!';