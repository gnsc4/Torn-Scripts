// ==UserScript==
// @name         Torn Cooldown Manager
// @namespace    Torn_Cooldown_Manager
// @version      1.0.9
// @description  Tracks cooldowns, life, refills, items (Med, Drug, Booster) from Personal or Faction inventory. Quick Use buttons, persistent counts, alerts & notifications. Configurable item colors. Uses local storage to cache API data. Clickable headers for timers and quick-use sections. Points refill configurable. Mobile friendly UI. Movable UI with persistent position. Drag-and-drop quick use items enabled on mobile. Larger drag handles in settings.
// @author       GNSC4 [268863]
// @match        https://www.torn.com/*
// @exclude      https://www.torn.com/loader.php?sid=attack*
// @exclude      https://www.torn.com/loader2.php?sid=attack*
// @exclude      https://www.torn.com/preferences.php*
// @exclude      https://www.torn.com/page.php?sid=bunker*
// @exclude      https://www.torn.com/page.php?sid=travel*
// @connect      api.torn.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Cooldown_Alerts/Coooldown_Alerts_Unified.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Cooldown_Alerts/Coooldown_Alerts_Unified.user.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_info
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '1.0.9';
    const FACTION_FALLBACK_TIMEOUT = 2500;

    const ITEM_TYPES = { MEDICAL: 'medical', DRUG: 'drug', BOOSTER: 'booster' };
    const MEDICAL_ITEMS = [ { id: 66, name: "Morphine", color: "#F44336", type: ITEM_TYPES.MEDICAL }, { id: 67, name: "First Aid Kit", color: "#4CAF50", type: ITEM_TYPES.MEDICAL }, { id: 68, name: "Small First Aid Kit", color: "#FFEB3B", type: ITEM_TYPES.MEDICAL }, { id: 361, name: "Neumune Tablet", color: "#FF9800", type: ITEM_TYPES.MEDICAL }, { id: 731, name: "Empty Blood Bag", color: "#9E9E9E", type: ITEM_TYPES.MEDICAL }, { id: 732, name: "Blood Bag : A+", color: "#EF9A9A", type: ITEM_TYPES.MEDICAL }, { id: 733, name: "Blood Bag : A-", color: "#F48FB1", type: ITEM_TYPES.MEDICAL }, { id: 734, name: "Blood Bag : B+", color: "#A5D6A7", type: ITEM_TYPES.MEDICAL }, { id: 735, name: "Blood Bag : B-", color: "#80CBC4", type: ITEM_TYPES.MEDICAL }, { id: 736, name: "Blood Bag : AB+", color: "#CE93D8", type: ITEM_TYPES.MEDICAL }, { id: 737, name: "Blood Bag : AB-", color: "#B39DDB", type: ITEM_TYPES.MEDICAL }, { id: 738, name: "Blood Bag : O+", color: "#90CAF9", type: ITEM_TYPES.MEDICAL }, { id: 739, name: "Blood Bag : O-", color: "#B3E5FC", type: ITEM_TYPES.MEDICAL }, { id: 1012, name: "Blood Bag : Irradiated", color: "#FFF59D", type: ITEM_TYPES.MEDICAL }, { id: 1363, name: "Ipecac Syrup", color: "#DCE775", type: ITEM_TYPES.MEDICAL } ];
    const DRUG_ITEMS = [ { id: 196, name: "Cannabis", color: "#8BC34A", type: ITEM_TYPES.DRUG }, { id: 197, name: "Ecstasy", color: "#E91E63", type: ITEM_TYPES.DRUG }, { id: 198, name: "Ketamine", color: "#FF5722", type: ITEM_TYPES.DRUG }, { id: 199, name: "LSD", color: "#9C27B0", type: ITEM_TYPES.DRUG }, { id: 200, name: "Opium", color: "#795548", type: ITEM_TYPES.DRUG }, { id: 201, name: "PCP", color: "#607D8B", type: ITEM_TYPES.DRUG }, { id: 203, name: "Shrooms", color: "#FF9800", type: ITEM_TYPES.DRUG }, { id: 204, name: "Speed", color: "#00BCD4", type: ITEM_TYPES.DRUG }, { id: 205, name: "Vicodin", color: "#03A9F4", type: ITEM_TYPES.DRUG }, { id: 206, name: "Xanax", color: "#673AB7", type: ITEM_TYPES.DRUG } ];
    const BOOSTER_ITEMS = [ { id: 987, name: "Can of Crocozade", color: "#FFC107", type: ITEM_TYPES.BOOSTER }, { id: 986, name: "Can of Damp Valley", color: "#AED581", type: ITEM_TYPES.BOOSTER }, { id: 985, name: "Can of Goose Juice", color: "#BCAAA4", type: ITEM_TYPES.BOOSTER }, { id: 530, name: "Can of Munster", color: "#4CAF50", type: ITEM_TYPES.BOOSTER }, { id: 532, name: "Can of Red Cow", color: "#F44336", type: ITEM_TYPES.BOOSTER }, { id: 554, name: "Can of Rockstar Rudolph", color: "#9C27B0", type: ITEM_TYPES.BOOSTER }, { id: 553, name: "Can of Santa Shooters", color: "#2196F3", type: ITEM_TYPES.BOOSTER }, { id: 533, name: "Can of Taurine Elite", color: "#78909C", type: ITEM_TYPES.BOOSTER }, { id: 555, name: "Can of X-MASS", color: "#FFEB3B", type: ITEM_TYPES.BOOSTER }, { id: 367, name: "Feathery Hotel Coupon", color: "#FFC107", type: ITEM_TYPES.BOOSTER }, { id: 180, name: "Bottle of Beer", color: "#FFECB3", type: ITEM_TYPES.BOOSTER }, { id: 181, name: "Bottle of Champagne", color: "#FFF9C4", type: ITEM_TYPES.BOOSTER }, { id: 638, name: "Bottle of Christmas Cocktail", color: "#F8BBD0", type: ITEM_TYPES.BOOSTER }, { id: 924, name: "Bottle of Christmas Spirit", color: "#B3E5FC", type: ITEM_TYPES.BOOSTER }, { id: 873, name: "Bottle of Green Stout", color: "#C8E6C9", type: ITEM_TYPES.BOOSTER }, { id: 550, name: "Bottle of Kandy Kane", color: "#FFCDD2", type: ITEM_TYPES.BOOSTER }, { id: 551, name: "Bottle of Minty Mayhem", color: "#B2DFDB", type: ITEM_TYPES.BOOSTER }, { id: 552, name: "Bottle of Mistletoe Madness", color: "#DCEDC8", type: ITEM_TYPES.BOOSTER }, { id: 984, name: "Bottle of Moonshine", color: "#CFD8DC", type: ITEM_TYPES.BOOSTER }, { id: 531, name: "Bottle of Pumpkin Brew", color: "#FFE0B2", type: ITEM_TYPES.BOOSTER }, { id: 294, name: "Bottle Of Sake Brew", color: "#F5F5F5", type: ITEM_TYPES.BOOSTER }, { id: 426, name: "Bottle of Tequila", color: "#FFECB3", type: ITEM_TYPES.BOOSTER }, { id: 542, name: "Bottle of Wicked Witch", color: "#E1BEE7", type: ITEM_TYPES.BOOSTER }, { id: 634, name: "Bag of Blood Eyeballs", color: "#EF9A9A", type: ITEM_TYPES.BOOSTER }, { id: 37, name: "Bag of Bon Bons", color: "#F48FB1", type: ITEM_TYPES.BOOSTER }, { id: 527, name: "Bag of Candy Kisses", color: "#F8BBD0", type: ITEM_TYPES.BOOSTER }, { id: 210, name: "Bag of Chocolate Kisses", color: "#BCAAA4", type: ITEM_TYPES.BOOSTER }, { id: 529, name: "Bag of Chocolate Truffles", color: "#A1887F", type: ITEM_TYPES.BOOSTER }, { id: 1039, name: "Bag of Humbugs", color: "#E0E0E0", type: ITEM_TYPES.BOOSTER }, { id: 556, name: "Bag of Raindeer Droppings", color: "#8D6E63", type: ITEM_TYPES.BOOSTER }, { id: 587, name: "Bag of Sherbet", color: "#FFF59D", type: ITEM_TYPES.BOOSTER }, { id: 528, name: "Bag of Tootsie Rolls", color: "#BCAAA4", type: ITEM_TYPES.BOOSTER }, { id: 36, name: "Big Box of Chocolate Bars", color: "#795548", type: ITEM_TYPES.BOOSTER }, { id: 1028, name: "Birthday Cupcake", color: "#F48FB1", type: ITEM_TYPES.BOOSTER }, { id: 38, name: "Box of Bon Bons", color: "#F48FB1", type: ITEM_TYPES.BOOSTER }, { id: 35, name: "Box of Chocolate Bars", color: "#A1887F", type: ITEM_TYPES.BOOSTER }, { id: 39, name: "Box of Extra Strong Mints", color: "#E8F5E9", type: ITEM_TYPES.BOOSTER }, { id: 209, name: "Box of Sweet Hearts", color: "#F8BBD0", type: ITEM_TYPES.BOOSTER }, { id: 1312, name: "Chocolate Egg", color: "#A1887F", type: ITEM_TYPES.BOOSTER }, { id: 586, name: "Jawbreaker", color: "#B3E5FC", type: ITEM_TYPES.BOOSTER }, { id: 310, name: "Lollipop", color: "#CE93D8", type: ITEM_TYPES.BOOSTER }, { id: 151, name: "Pixie Sticks", color: "#C5CAE9", type: ITEM_TYPES.BOOSTER }, { id: 366, name: "Erotic DVD", color: "#FF8A65", type: ITEM_TYPES.BOOSTER }, { id: 329, name: "Skateboard", color: "#BDBDBD", type: ITEM_TYPES.BOOSTER }, { id: 331, name: "Dumbbells", color: "#9E9E9E", type: ITEM_TYPES.BOOSTER }, { id: 106, name: "Parachute", color: "#757575", type: ITEM_TYPES.BOOSTER }, { id: 330, name: "Boxing Gloves", color: "#616161", type: ITEM_TYPES.BOOSTER } ];
    const ALL_ITEMS = [...MEDICAL_ITEMS, ...DRUG_ITEMS, ...BOOSTER_ITEMS];
    const ALL_ITEM_IDS = new Set(ALL_ITEMS.map(item => item.id));

    const DEFAULT_MEDICAL_QUICK_USE_ITEMS = [66, 67, 68];
    const DEFAULT_DRUG_QUICK_USE_ITEMS = [206, 197];
    const DEFAULT_BOOSTER_QUICK_USE_ITEMS = [532, 530, 553, 555, 554];

    const API_KEY_STORAGE = 'unifiedTracker_apiKey';
    const ITEM_COUNT_STORAGE_KEY = 'unifiedTracker_KnownCounts';
    const FACTION_ITEM_COUNT_STORAGE_KEY = 'unifiedTracker_FactionCounts';
    const MEDICAL_SOURCE_STORAGE = 'unifiedTracker_MedicalSource';
    const DRUG_SOURCE_STORAGE = 'unifiedTracker_DrugSource';
    const BOOSTER_SOURCE_STORAGE = 'unifiedTracker_BoosterSource';
    const POINTS_REFILL_SOURCE_STORAGE = 'unifiedTracker_PointsRefillSource';
    const MEDICAL_QUICK_USE_CONFIG_STORAGE = 'unifiedTracker_MedicalQuickUseConfig';
    const DRUG_QUICK_USE_CONFIG_STORAGE = 'unifiedTracker_DrugQuickUseConfig';
    const BOOSTER_QUICK_USE_CONFIG_STORAGE = 'unifiedTracker_BoosterQuickUseConfig';
    const MINIMIZED_STATE_STORAGE = 'unifiedTracker_MinimizedState';
    const MAX_MED_CD_STORAGE = 'unifiedTracker_MaxMedCD';
    const MAX_BOOSTER_CD_STORAGE = 'unifiedTracker_MaxBoosterCD';
    const EMPTY_BB_ALERT_STORAGE = 'unifiedTracker_EmptyBBAlert';
    const NOTIFICATIONS_ENABLED_STORAGE = 'unifiedTracker_NotificationsEnabled';
    const NOTIFY_DRUG_CD_STORAGE = 'unifiedTracker_NotifyDrugCD';
    const NOTIFY_BOOSTER_CD_STORAGE = 'unifiedTracker_NotifyBoosterCD';
    const NOTIFY_MEDICAL_CD_STORAGE = 'unifiedTracker_NotifyMedicalCD';
    const ACTIVE_ALERTS_STORAGE = 'unifiedTracker_ActiveAlerts';
    const ITEM_USE_IN_PROGRESS_STORAGE = 'unifiedTracker_ItemUseInProgress';
    const PENDING_FACTION_ITEM_USE_STORAGE = 'unifiedTracker_PendingFactionItemUse';
    const PENDING_PERSONAL_ITEM_USE_STORAGE = 'unifiedTracker_PendingPersonalItemUse';
    const ITEM_COLOR_STORAGE_KEY = 'unifiedTracker_ItemColors';
    const API_DATA_CACHE_KEY = 'unifiedTracker_apiDataCache';
    const UI_POSITION_TOP_STORAGE = 'unifiedTracker_UIPositionTop';
    const UI_POSITION_LEFT_STORAGE = 'unifiedTracker_UIPositionLeft';

    const DEFAULT_SOURCE = 'personal';
    const DEFAULT_POINTS_REFILL_SOURCE = 'personal';
    const DEFAULT_MAX_MED_CD_HOURS = 6;
    const DEFAULT_MAX_BOOSTER_CD_HOURS = 24;
    const DEFAULT_NOTIFY_EMPTY_BB = true;
    const DEFAULT_NOTIFICATIONS_ENABLED = true;
    const DEFAULT_NOTIFY_DRUG_CD = true;
    const DEFAULT_NOTIFY_BOOSTER_CD = true;
    const DEFAULT_NOTIFY_MEDICAL_CD = true;

    const LOW_LIFE_THRESHOLD_PERCENT = 25;
    const API_REFRESH_INTERVAL_MS = 60000;
    const API_CACHE_DURATION_MS = 55000;
    const DISPLAY_UPDATE_INTERVAL = 1000;
    const ITEM_SCAN_DELAY = 1500;
    const TAB_SCAN_DELAY = 1500;
    const EMPTY_BB_LIFE_THRESHOLD = 30;
    const EMPTY_BB_MED_CD_NEEDED = 3600;
    const EBB_ACTIVE_MARKER = 1;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const FACTION_REFILL_URL = 'https://www.torn.com/factions.php?step=your#/tab=armoury&start=0&sub=points';
    const PERSONAL_REFILL_URL = 'https://www.torn.com/page.php?sid=points';

    let apiKey = null;
    let apiData = { cooldowns: { drug: 0, booster: 0, medical: 0, drugEnd: 0, boosterEnd: 0, medicalEnd: 0 }, bars: { life: {}, energy: {}, nerve: {} }, refills: {}, lastUpdate: 0, error: null };
    let apiFetchTimeout = null;
    let displayUpdateTimer = null;
    let itemCounts = { personal: {}, faction: {} };
    let itemColors = {};
    let medicalSource = DEFAULT_SOURCE;
    let drugSource = DEFAULT_SOURCE;
    let boosterSource = DEFAULT_SOURCE;
    let pointsRefillSource = DEFAULT_POINTS_REFILL_SOURCE;
    let itemScanTimer = null;
    let tabScanTimeout = null;
    let medicalQuickUseConfig = [];
    let drugQuickUseConfig = [];
    let boosterQuickUseConfig = [];
    let maxMedicalCooldown = DEFAULT_MAX_MED_CD_HOURS * 3600;
    let maxBoosterCooldown = DEFAULT_MAX_BOOSTER_CD_HOURS * 3600;
    let notifyEmptyBloodBag = DEFAULT_NOTIFY_EMPTY_BB;
    let notificationsEnabled = DEFAULT_NOTIFICATIONS_ENABLED;
    let notifyDrugCD = DEFAULT_NOTIFY_DRUG_CD;
    let notifyBoosterCD = DEFAULT_NOTIFY_BOOSTER_CD;
    let notifyMedicalCD = DEFAULT_NOTIFY_MEDICAL_CD;
    let activeAlertStates = {};
    let isApiDataReady = false;
    let uiContainer = null;
    let medicalQuickUseContainer = null;
    let drugQuickUseContainer = null;
    let boosterQuickUseContainer = null;
    let settingsPanel = null;
    let medicalCustomizationContainer = null;
    let drugCustomizationContainer = null;
    let boosterCustomizationContainer = null;
    let customTooltipElement = null;
    let isSettingsVisible = false;
    let isMinimized = false;
    let isInitialized = false;
    let coopObserver = null;
    let coopAdjustTimeout = null;
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let draggedElement = null;

    function formatTime(seconds) { if (isNaN(seconds) || seconds === null || seconds === undefined) { return '--'; } seconds = Number(seconds); if (seconds <= 0) { return '<span style="color: #90ee90;">Ready</span>'; } const d = Math.floor(seconds / (3600 * 24)); const h = Math.floor(seconds % (3600 * 24) / 3600); const m = Math.floor(seconds % 3600 / 60); const s = Math.floor(seconds % 60); let parts = []; if (d > 0) parts.push(d + 'd'); if (h > 0) parts.push(h + 'h'); if (m > 0) parts.push(m + 'm'); if (s > 0 || parts.length === 0) parts.push(s + 's'); let color = '#ffcc00'; if (seconds < 60) color = '#ff9900'; return `<span style="color: ${color};">${parts.join(' ')}</span>`; }
    function formatSecondsSimple(seconds) { if (isNaN(seconds) || seconds <= 0) { return 'None'; } const d = Math.floor(seconds / (3600 * 24)); const h = Math.floor(seconds % (3600 * 24) / 3600); const m = Math.floor(seconds % 3600 / 60); const s = Math.floor(seconds % 60); let parts = []; if (d > 0) parts.push(d + 'd'); if (h > 0) parts.push(h + 'h'); if (m > 0) parts.push(m + 'm'); parts.push(s + 's'); return parts.join(' '); }
    function getTextColorForBackground(hexColor) { try { if (!hexColor || typeof hexColor !== 'string') return '#FFFFFF'; hexColor = hexColor.replace(/^#/, ''); if (hexColor.length === 3) hexColor = hexColor[0]+hexColor[0]+hexColor[1]+hexColor[1]+hexColor[2]+hexColor[2]; if (hexColor.length !== 6) return '#FFFFFF'; const r = parseInt(hexColor.substring(0,2), 16); const g = parseInt(hexColor.substring(2,4), 16); const b = parseInt(hexColor.substring(4,6), 16); if (isNaN(r) || isNaN(g) || isNaN(b)) return '#FFFFFF'; const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; return lum > 0.5 ? '#000000' : '#FFFFFF'; } catch (e) { return '#FFFFFF'; } }
    function showTemporaryFeedback(message, type = 'info', duration = 5000) { document.querySelectorAll('.unified-tracker-temp-feedback').forEach(n => n.remove()); const n = document.createElement('div'); n.className = `unified-tracker-temp-feedback ${type}`; n.innerHTML = message; document.body.appendChild(n); n.style.opacity = '0'; n.style.transform = 'translate(-50%, -50%) scale(0.9)'; void n.offsetWidth; requestAnimationFrame(() => { n.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; n.style.opacity = '1'; n.style.transform = 'translate(-50%, -50%) scale(1)'; }); const timeoutId = setTimeout(() => { requestAnimationFrame(() => { n.style.opacity = '0'; n.style.transform = 'translate(-50%, -50%) scale(0.9)'; }); n.addEventListener('transitionend', () => { n.remove(); }, { once: true }); }, duration); n.addEventListener('click', () => { clearTimeout(timeoutId); n.remove(); }); }

    function getRFC() { if (typeof $ === 'function' && typeof $.cookie === 'function') { const c = $.cookie('rfc_v'); if(c) return c; } try { const cs = document.cookie.split('; '); for (const c of cs) { const [n, v] = c.split('='); if(n.trim() === 'rfc_v') return decodeURIComponent(v); } } catch (e) { } return null; }
    function extractTokenFromPage() { try { if (typeof window.csrf === 'string' && /^[a-f0-9]{16,}$/i.test(window.csrf)) return window.csrf; if (typeof window.csrf_token === 'string' && /^[a-f0-9]{16,}$/i.test(window.csrf_token)) return window.csrf_token; if (typeof $ === 'function' && typeof $.cookie === 'function') { const c = $.cookie('csrf'); if(c && /^[a-f0-9]{16,}$/i.test(c)) return c; } const inputs = document.querySelectorAll('input[name="csrf"], input[name="csrf_token"], input[id="csrf"], input[name="X-Csrf-Token"], input[data-csrf]'); for (const input of inputs) { const t = input.value || input.dataset?.csrf; if(t && /^[a-f0-9]{16,}$/i.test(t)) return t; } const patterns = [ /["']csrf["']\s*:\s*["']([a-f0-9]{16,})["']/, /csrf_token\s*=\s*["']([a-f0-9]{16,})["']/, /window\.csrf\s*=\s*["']([a-f0-9]{16,})["']/, /value=["']([a-f0-9]{16,})["']\s*name=["']csrf["']/ ]; const scripts = document.querySelectorAll('script:not([src])'); for (const script of scripts) { if (!script.textContent) continue; for (const p of patterns) { const m = script.textContent.match(p); if(m && m[1]) return m[1]; } } const meta = document.querySelector('meta[name="csrf-token"]'); if(meta && meta.content && /^[a-f0-9]{16,}$/i.test(meta.content)) return meta.content; } catch (e) { } return null; }
    function getCsrfToken() { const rfc = getRFC(); if (rfc) { return rfc; } const pageToken = extractTokenFromPage(); if (pageToken) { return pageToken; } return null; }

    try { GM_addStyle(`
.unified-tracker-container { position: fixed; left: calc(100vw - 240px); top: 90px; background-color: rgba(34, 34, 34, 0.9); padding: 10px; border-radius: 5px; z-index: 99999; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); transition: padding 0.3s ease, max-height 0.3s ease, top 0.3s ease, left 0.3s ease; border: 1px solid #555; max-width: 220px; font-size: 12px; color: #ccc; max-height: 85vh; overflow: visible; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; }
.unified-tracker-container[data-minimized="true"] { padding: 2px; max-height: 26px; overflow: visible; }
.tracker-content-wrapper { display: flex; flex-direction: column; gap: 8px; width: 100%; overflow-y: auto; overflow-x: hidden; flex-grow: 1; padding-right: 5px; box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #666 #333; }
.tracker-content-wrapper::-webkit-scrollbar { width: 6px; }
.tracker-content-wrapper::-webkit-scrollbar-track { background: #333; border-radius: 3px; }
.tracker-content-wrapper::-webkit-scrollbar-thumb { background-color: #666; border-radius: 3px; border: 1px solid #333; }
.unified-tracker-container[data-minimized="true"] .tracker-content-wrapper { display: none !important; }
.unified-tracker-container .tracker-section { border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 8px; width: 100%; box-sizing: border-box; flex-shrink: 0; }
.unified-tracker-container .tracker-section:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
.unified-tracker-container h4 { margin: 0 0 5px 0; font-size:  0.8125rem; line-height: 2.0; color: #eee; font-weight: bold; text-align: center; border-bottom: 1px solid #555; padding-bottom: 4px; width: 100%; box-sizing: border-box; flex-shrink: 0; cursor: grab; user-select: none; touch-action: none; }
.unified-tracker-container h4:active { cursor: grabbing; }
.unified-tracker-container .unified-tracker-toggle-button { display: flex !important; position: absolute; top: -8px; right: -12px; z-index: 99999; background-color: #007bff; color: white; border: none; width: 22px; height: 22px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.5); }
.unified-tracker-container[data-minimized="true"] .unified-tracker-toggle-button { background-color: #28a745; }
.api-status { font-size: 10px; text-align: center; color: #888; margin-bottom: 5px; flex-shrink: 0; }
.api-error { color: #ff6b6b; font-weight: bold; }
.cooldown-timers-list, .refills-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.cooldown-timers-list li, .refills-list li { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
.cooldown-timers-list li a { text-decoration: none; color: inherit; display: contents; }
.refills-list li a { text-decoration: none; color: inherit; display: contents; }
.cooldown-timers-list .timer-name, .refills-list .refill-name { color: #bbb; flex-shrink: 0; margin-right: 5px; }
.cooldown-timers-list .timer-value, .refills-list .refill-value { font-weight: bold; color: #fff; text-align: right; }
.cooldown-timers-list .timer-value.ready { color: #90ee90; }
.refills-list .refill-value.available { color: #90ee90; }
.refills-list .refill-value.used { color: #ff6b6b; }
.life-bar-container { width: 100%; background-color: #555; border-radius: 3px; height: 14px; overflow: hidden; position: relative; border: 1px solid #666; box-sizing: border-box; margin-top: 4px;}
.life-bar-fill { height: 100%; background-color: #e74c3c; border-radius: 2px; transition: width 0.5s ease; }
.life-bar-text { position: absolute; top: 0; left: 0; width: 100%; height: 100%; text-align: center; line-height: 13px; font-size: 10px; color: #fff; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.7); z-index: 99999; }
.blood-bag-alert-active { background-color: #c0392b !important; animation: pulse-red 1.5s infinite; }
@keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(255, 82, 82, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); } }
.medical-quick-use-container, .drug-quick-use-container, .booster-quick-use-container { display: flex; flex-direction: column; gap: 5px; }
.quick-use-header { font-size: 11px; color: #aaa; font-weight: bold; text-align: center; margin: 8px 0 2px 0; padding-top: 8px; border-top: 1px solid #444; flex-shrink: 0; }
.quick-use-header a { text-decoration: none; color: inherit; }
.quick-use-source-toggle-container { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 8px 0; margin-bottom: 5px; border-bottom: 1px solid #444; flex-shrink: 0; }
.quick-use-source-toggle-label { font-size: 10px; color: #bbb; flex-grow: 1; margin-right: 6px; text-align: left; white-space: nowrap; }
.quick-use-source-slider { width: 36px; height: 18px; background-color: #ccc; border-radius: 9px; position: relative; transition: background-color 0.3s ease; flex-shrink: 0; border: 1px solid #555; cursor: pointer; }
.quick-use-source-slider::after { content: ''; position: absolute; width: 14px; height: 14px; background-color: white; border-radius: 50%; top: 1px; left: 1px; transition: left 0.3s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.3); }
.quick-use-source-slider.personal-mode { background-color: #4CAF50; }
.quick-use-source-slider.faction-mode { background-color: #f44336; }
.quick-use-source-slider.faction-mode::after { left: calc(100% - 15px); }
.quick-use-button { border: 1px solid #555; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-weight: bold; text-align: left; transition: background-color 0.2s, filter 0.2s; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.quick-use-button-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1; margin-right: 5px; }
.quick-use-button-count { font-size: 10px; font-weight: normal; background-color: rgba(0, 0, 0, 0.2); padding: 1px 4px; border-radius: 2px; margin-left: 5px; flex-shrink: 0; min-width: 16px; text-align: right; }
.quick-use-button:hover { filter: brightness(1.2); }
.quick-use-button.type-medical.blood-bag-alert { animation: pulse-red 1.5s infinite; border-color: #ff6b6b; }
.quick-use-button.type-drug { border-left: 3px solid #9C27B0; }
.quick-use-button.type-booster { border-left: 3px solid #2196F3; }
.quick-use-button.type-medical { border-left: 3px solid #4CAF50; }
.unified-settings-button { background-color: #555; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-weight: bold; text-align: center; font-size: 11px; transition: background-color 0.2s; margin-top: 8px; width: 100%; flex-shrink: 0; }
.unified-settings-button:hover { background-color: #666; }
.unified-settings-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(40, 40, 40, 0.95); border: 1px solid #666; border-radius: 8px; padding: 15px; z-index: 99999; box-shadow: 0 5px 15px rgba(0,0,0,0.6); display: none; flex-direction: column; gap: 15px; width: 90%; max-width: 450px; max-height: 85vh; font-size: 12px; color: #ccc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
.unified-settings-panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #555; padding-bottom: 8px; margin-bottom: 10px; flex-shrink: 0; }
.unified-settings-panel-header h4 { margin: 0; font-size: 14px; color: #eee; font-weight: bold; }
.unified-settings-panel-close-button { background: none; border: none; color: #aaa; font-size: 20px; font-weight: bold; cursor: pointer; line-height: 1; padding: 0 5px; }
.unified-settings-panel-close-button:hover { color: #fff; }
.unified-settings-panel-content { overflow-y: auto; padding-right: 10px; display: flex; flex-direction: column; gap: 15px; flex-grow: 1; scrollbar-width: thin; scrollbar-color: #666 #333; }
.unified-settings-panel-content::-webkit-scrollbar { width: 6px; }
.unified-settings-panel-content::-webkit-scrollbar-track { background: #333; border-radius: 3px; }
.unified-settings-panel-content::-webkit-scrollbar-thumb { background-color: #666; border-radius: 3px; border: 1px solid #333; }
.unified-settings-panel label { font-size: 11px; margin-bottom: 3px; color: #bbb; display: block; }
.unified-settings-panel input[type="text"], .unified-settings-panel input[type="password"], .unified-settings-panel input[type="number"] { width: 100%; padding: 5px 7px; border: 1px solid #444; background-color: #333; color: white; border-radius: 3px; box-sizing: border-box; font-size: 11px; margin-bottom: 5px; }
.unified-settings-panel input::placeholder { color: #888; }
.setting-buttons { display: flex; gap: 5px; justify-content: flex-end; margin-top: 5px;}
.setting-buttons button { padding: 4px 9px; font-size: 11px; border-radius: 3px; border: none; cursor: pointer; font-weight: bold; }
.save-api-key-button { background-color: #4CAF50; color: white; }
.save-api-key-button:hover { filter: brightness(1.1); }
.test-api-key-button { background-color: #2196F3; color: white; }
.test-api-key-button:hover { filter: brightness(1.1); }
.api-key-status { font-size: 10px; margin-top: 3px; text-align: right; min-height: 12px; }
.api-key-status.valid { color: #90ee90; }
.api-key-status.invalid { color: #ff6b6b; }
.api-key-status.testing { color: #ffcc00; }
.settings-section { border-top: 1px dashed #555; margin-top: 10px; padding-top: 10px; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.settings-section h5 { font-size: 13px; margin: 0 0 8px 0; color: #ddd; text-align: center; }
.settings-section label.checkbox-label { display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 5px; }
.settings-section input[type="checkbox"] { cursor: pointer; margin: 0; }
.settings-section .sub-label { font-size: 10px; color: #999; margin-left: 20px; }
.quick-use-customization-section p { font-size: 10px; color: #999; text-align: center; margin-bottom: 5px; }
.quick-use-editor { list-style: none; padding: 0; margin: 0 0 10px 0; border: 1px solid #444; border-radius: 3px; background-color: #2a2a2a; max-height: 150px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #666 #333; }
.quick-use-editor::-webkit-scrollbar { width: 6px; }
.quick-use-editor::-webkit-scrollbar-track { background: #333; border-radius: 3px; }
.quick-use-editor::-webkit-scrollbar-thumb { background-color: #666; border-radius: 3px; border: 1px solid #333; }
.quick-use-selection-item { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #383838; background-color: #333; user-select: none; -webkit-user-select: none; -ms-user-select: none; }
.quick-use-selection-item:last-child { border-bottom: none; }
.quick-use-selection-item label { display: flex; align-items: center; flex-grow: 1; cursor: pointer; font-size: 11px; color: #ccc; }
.quick-use-selection-item input[type="checkbox"] { margin-right: 8px; cursor: pointer; }
.quick-use-selection-item .drag-handle { font-size: 16px; color: #777; margin-left: 8px; cursor: grab; padding: 5px 8px; touch-action: manipulation; user-select: none; -webkit-user-select: none; -ms-user-select: none; }
.quick-use-selection-item input[type="color"].quick-use-color-picker { margin-left: 8px; cursor: pointer; width: 20px; height: 20px; border: 1px solid #555; padding: 0; vertical-align: middle; background: none; }
.quick-use-selection-item.dragging { opacity: 0.5; background: #444; }
.quick-use-selection-item.drag-over { border-top: 2px solid #007bff; }
.unified-tracker-temp-feedback { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 15px 20px; border-radius: 5px; color: white; z-index: 99999; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4); opacity: 1; transition: opacity 0.5s, transform 0.3s ease-out; text-align: center; min-width: 250px; max-width: 80%; pointer-events: auto; cursor: pointer; background-color: rgba(33, 150, 243, 0.9); border: 1px solid #2196F3; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
.unified-tracker-temp-feedback.success { background-color: rgba(76, 175, 80, 0.9); border: 1px solid #4CAF50; }
.unified-tracker-temp-feedback.error { background-color: rgba(244, 67, 54, 0.9); border: 1px solid #f44336; }
.unified-tracker-temp-feedback.info { background-color: rgba(33, 150, 243, 0.9); border: 1px solid #2196F3; }
.unified-tracker-temp-feedback .counter-wrap { font-weight: bold; }
#unified-tracker-alerts-container { position: fixed; top: 10px; right: 10px; z-index: 99999; display: flex; flex-direction: column; gap: 8px; max-width: 350px; pointer-events: none; }
.unified-tracker-interactive-alert { background-color: #444; border: 1px solid #555; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); padding: 10px 12px; color: #ccc; font-size: 13px; line-height: 1.4; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 1; transform: translateX(0); pointer-events: auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: space-between; }
.unified-tracker-interactive-alert.hiding { opacity: 0; transform: translateX(20px); }
.unified-tracker-interactive-alert .alert-message { margin: 0; margin-right: 10px; flex-grow: 1; }
.unified-tracker-interactive-alert .alert-buttons { display: flex; gap: 6px; margin: 0; flex-shrink: 0; }
.unified-tracker-interactive-alert .alert-button { border: none; border-radius: 3px; color: white; padding: 5px 10px; cursor: pointer; font-size: 12px; font-weight: bold; transition: filter 0.2s; text-shadow: none; line-height: 1.2; }
.unified-tracker-interactive-alert .alert-button:hover { filter: brightness(1.15); }
.unified-tracker-interactive-alert .alert-button.navigate { background-color: #3478B4; min-width: 60px; text-align: center; }
.unified-tracker-interactive-alert .alert-button.dismiss { background-color: #BE3432; padding: 5px 8px; font-size: 14px; }
#unified-tracker-tooltip { position: fixed; display: none; padding: 5px 8px; background-color: rgba(20, 20, 20, 0.9); color: #eee; border: 1px solid #555; border-radius: 4px; font-size: 11px; z-index: 99999; pointer-events: none; white-space: pre-wrap; max-width: 200px; }
    `); } catch (e) { console.error("GM_addStyle failed:", e); }

    function adjustTitleFontSize() {
        if (!uiContainer) return;
        const titleElement = uiContainer.querySelector('h4');
        if (!titleElement) return;

        titleElement.style.fontSize = '0.8125rem';

        requestAnimationFrame(() => {
            const containerWidth = titleElement.clientWidth;
            let currentFontSize = parseFloat(window.getComputedStyle(titleElement).fontSize);
            const MIN_FONT_SIZE = 9;

            while (titleElement.scrollWidth > containerWidth + 1 && currentFontSize > MIN_FONT_SIZE) {
                currentFontSize -= 0.5;
                titleElement.style.fontSize = `${currentFontSize}px`;

                if (currentFontSize <= MIN_FONT_SIZE) {
                    break;
                }
            }
             if (titleElement.scrollWidth > containerWidth + 1 && currentFontSize <= MIN_FONT_SIZE) {
                titleElement.style.whiteSpace = 'nowrap';
                titleElement.style.overflow = 'hidden';
                titleElement.style.textOverflow = 'ellipsis';
             } else {
                titleElement.style.whiteSpace = '';
                titleElement.style.overflow = '';
                titleElement.style.textOverflow = '';
             }
        });
    }


    function showInteractiveNotification(message, type = 'info', navigateUrl = null, notificationId = null, isRestored = false, triggerEndTimeMs = null) {
        if (!notificationId) {
            console.warn("showInteractiveNotification called without notificationId");
            return;
        }

        let container = document.getElementById('unified-tracker-alerts-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'unified-tracker-alerts-container';
            document.body.appendChild(container);
        }

        if (container.querySelector(`.unified-tracker-interactive-alert[data-notification-id="${notificationId}"]`)) {
            return;
        }

        const n = document.createElement('div');
        n.className = `unified-tracker-interactive-alert ${type}`;
        n.dataset.notificationId = notificationId;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert-message';
        messageDiv.innerHTML = message;
        n.appendChild(messageDiv);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'alert-buttons';

        if (navigateUrl) {
            const navigateBtn = document.createElement('button');
            navigateBtn.className = 'alert-button navigate';
            if (notificationId === 'emptyBBAlert') {
                navigateBtn.textContent = 'Go to Items';
            } else {
                navigateBtn.textContent = 'Navigate';
            }
            navigateBtn.title = `Go to ${navigateUrl}`;
            navigateBtn.onclick = () => {
                updateAlertState(notificationId, false);
                window.location.href = navigateUrl;
            };
            buttonsDiv.appendChild(navigateBtn);
        }

        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'alert-button dismiss';
        dismissBtn.innerHTML = '&times;';
        dismissBtn.title = 'Dismiss';
        dismissBtn.onclick = () => {
            const currentState = activeAlertStates[notificationId];
            if (currentState) {
                const newDismissCount = (currentState.dismissCount || 0) + 1;
                const dismissalTime = Date.now();
                updateAlertState(notificationId, true, currentState.triggeredAt, newDismissCount, dismissalTime);
            } else {
                console.warn(`Dismiss clicked but no state found for ${notificationId}`);
            }
            n.classList.add('hiding');
            n.addEventListener('transitionend', () => {
                n.remove();
            }, { once: true });
            setTimeout(() => {
                if (document.body.contains(n)) n.remove();
            }, 400);
        };
        buttonsDiv.appendChild(dismissBtn);
        n.appendChild(buttonsDiv);
        container.prepend(n);
        if (!isRestored) {
            console.log(`Showing new interactive notification: ${notificationId}`);
        }
    }

    function updateAlertState(notificationId, isActive, triggerEndTimeMs = null, dismissCount = 0, dismissedAt = null) {
        if (!notificationId) return;
        let currentStates = {};
        try {
            currentStates = JSON.parse(GM_getValue(ACTIVE_ALERTS_STORAGE, '{}'));
        } catch (e) {
            console.error("Error parsing active alerts from storage:", e);
            currentStates = {};
        }
        const currentState = currentStates[notificationId];
        let changed = false;

        if (isActive) {
            if (!currentState || currentState.triggeredAt !== triggerEndTimeMs) {
                currentStates[notificationId] = { triggeredAt: triggerEndTimeMs, dismissCount: 0, dismissedAt: null };
                changed = true;
            } else {
                if (currentState.dismissCount !== dismissCount || currentState.dismissedAt !== dismissedAt) {
                     currentState.dismissCount = dismissCount;
                     currentState.dismissedAt = dismissedAt;
                     changed = true;
                } else {
                }
            }
        } else {
            if (currentState !== undefined) {
                delete currentStates[notificationId];
                changed = true;
            } else {
            }
        }

        activeAlertStates = currentStates;

        if (changed) {
            try {
                GM_setValue(ACTIVE_ALERTS_STORAGE, JSON.stringify(currentStates));
            } catch (e) {
                console.error("Error saving active alerts to storage:", e);
                GM_setValue(ACTIVE_ALERTS_STORAGE, '{}');
                activeAlertStates = {};
            }
        }
    }

    function processApiData(data, source = 'API') {
        let newApiData = { ...apiData, lastUpdate: Date.now(), error: null };
        if (data.error) {
            newApiData.error = `API Error ${data.error.code}`;
            console.error(`API Error: ${data.error.code} - ${data.error.error}`);
            if (data.error.code === 2 && source === 'API') showTemporaryFeedback("Invalid API Key provided.", "error");
            newApiData.cooldowns = { drug: 0, booster: 0, medical: 0, drugEnd: 0, boosterEnd: 0, medicalEnd: 0 };
            newApiData.bars = { life: { percentage: 0 }, energy: {}, nerve: {} };
            newApiData.refills = {};
        } else {
            const now = Date.now();
            const oldDrugEnd = newApiData.cooldowns.drugEnd;
            const oldBoosterEnd = newApiData.cooldowns.boosterEnd;
            const oldMedicalEnd = newApiData.cooldowns.medicalEnd;

            newApiData.cooldowns.drug = data.cooldowns?.drug || 0;
            newApiData.cooldowns.booster = data.cooldowns?.booster || 0;
            newApiData.cooldowns.medical = data.cooldowns?.medical || 0;
            newApiData.cooldowns.drugEnd = newApiData.cooldowns.drug > 0 ? now + newApiData.cooldowns.drug * 1000 : 0;
            newApiData.cooldowns.boosterEnd = newApiData.cooldowns.booster > 0 ? now + newApiData.cooldowns.booster * 1000 : 0;
            newApiData.cooldowns.medicalEnd = newApiData.cooldowns.medical > 0 ? now + newApiData.cooldowns.medical * 1000 : 0;

            newApiData.refills = data.refills || {};
            newApiData.bars.life = data.life || {};
            newApiData.bars.energy = data.energy || {};
            newApiData.bars.nerve = data.nerve || {};

            if (newApiData.bars.life && typeof newApiData.bars.life.current === 'number' && typeof newApiData.bars.life.maximum === 'number' && newApiData.bars.life.maximum > 0) {
                newApiData.bars.life.percentage = Math.round((newApiData.bars.life.current / newApiData.bars.life.maximum) * 100);
            } else {
                newApiData.bars.life.percentage = 0;
            }
        }
        apiData = newApiData;
        isApiDataReady = true;
        updateMainUIDisplay();
        checkBloodBagAlert();
        checkEmptyBloodBagAlert();
        checkCooldownNotifications();
    }

    function fetchAPIData(currentApiKey) {
        isApiDataReady = false;
        clearTimeout(apiFetchTimeout);

        if (!currentApiKey) {
            apiData.error = "API Key missing";
            apiData.lastUpdate = Date.now();
            updateMainUIDisplay();
            checkEmptyBloodBagAlert();
            isApiDataReady = true;
            return Promise.resolve();
        }

        try {
            const cachedDataString = localStorage.getItem(API_DATA_CACHE_KEY);
            if (cachedDataString) {
                const cachedData = JSON.parse(cachedDataString);
                const cacheTimestamp = cachedData.timestamp || 0;
                const now = Date.now();
                if (now - cacheTimestamp < API_CACHE_DURATION_MS && cachedData.apiKey === currentApiKey) {
                    processApiData(cachedData.data, 'Cache');
                    const timeUntilExpiry = API_CACHE_DURATION_MS - (now - cacheTimestamp);
                    apiFetchTimeout = setTimeout(() => fetchAPIData(currentApiKey), Math.max(1000, timeUntilExpiry));
                    return Promise.resolve();
                }
            }
        } catch (e) {
            console.warn("Error reading API cache:", e);
            localStorage.removeItem(API_DATA_CACHE_KEY);
        }

        const url = `https://api.torn.com/user/?selections=cooldowns,bars,refills&key=${currentApiKey}`;
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: 15000,
                onload: function(response) {
                    let fetchedData = null;
                    try {
                        if (response.status !== 200) throw new Error(`API status ${response.status}`);
                        fetchedData = JSON.parse(response.responseText);
                        processApiData(fetchedData, 'API');

                        if (!fetchedData.error) {
                            try {
                                const cachePayload = {
                                    timestamp: Date.now(),
                                    apiKey: currentApiKey,
                                    data: fetchedData
                                };
                                localStorage.setItem(API_DATA_CACHE_KEY, JSON.stringify(cachePayload));
                            } catch (e) {
                                console.warn("Error saving API data to cache:", e);
                            }
                        }
                    } catch (e) {
                        console.error("Error processing API response:", e, response.responseText);
                        apiData.error = "API Parse Error";
                        apiData.lastUpdate = Date.now();
                        apiData.cooldowns = { drug: 0, booster: 0, medical: 0, drugEnd: 0, boosterEnd: 0, medicalEnd: 0 };
                        apiData.bars = { life: { percentage: 0 }, energy: {}, nerve: {} };
                        apiData.refills = {};
                        isApiDataReady = true;
                        updateMainUIDisplay();
                        checkEmptyBloodBagAlert();
                    }
                    apiFetchTimeout = setTimeout(() => fetchAPIData(currentApiKey), API_REFRESH_INTERVAL_MS);
                    resolve();
                },
                onerror: function(response) {
                    console.error("API Network Error:", response);
                    apiData.error = "API Network Error";
                    apiData.lastUpdate = Date.now();
                    isApiDataReady = true;
                    updateMainUIDisplay();
                    checkEmptyBloodBagAlert();
                    apiFetchTimeout = setTimeout(() => fetchAPIData(currentApiKey), API_REFRESH_INTERVAL_MS);
                    resolve();
                },
                ontimeout: function() {
                    console.error("API Timeout");
                    apiData.error = "API Timeout";
                    apiData.lastUpdate = Date.now();
                    isApiDataReady = true;
                    updateMainUIDisplay();
                    checkEmptyBloodBagAlert();
                    apiFetchTimeout = setTimeout(() => fetchAPIData(currentApiKey), API_REFRESH_INTERVAL_MS);
                    resolve();
                }
            });
        });
    }

    function testApiKey(keyToTest) {
        const statusEl = settingsPanel?.querySelector('.api-key-status');
        if (statusEl) {
            statusEl.textContent = 'Testing...';
            statusEl.className = 'api-key-status testing';
        }
        return new Promise((resolve) => {
            if (!keyToTest || typeof keyToTest !== 'string' || keyToTest.trim() === '') {
                if (statusEl) {
                    statusEl.textContent = 'Key is empty';
                    statusEl.className = 'api-key-status invalid';
                }
                resolve(false);
                return;
            }
            const url = `https://api.torn.com/user/?selections=basic&key=${keyToTest.trim()}`;
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: 10000,
                onload: function(response) {
                    let isValid = false;
                    try {
                        if (response.status !== 200) throw new Error(`Test status ${response.status}`);
                        const data = JSON.parse(response.responseText);
                        if (data.error) {
                            if (statusEl) { statusEl.textContent = `Invalid (${data.error.code})`; statusEl.className = 'api-key-status invalid'; }
                        } else {
                            if (statusEl) { statusEl.textContent = 'Valid!'; statusEl.className = 'api-key-status valid'; }
                            isValid = true;
                        }
                    } catch (e) {
                        console.error("API Key Test Error:", e);
                        if (statusEl) { statusEl.textContent = 'Test Error'; statusEl.className = 'api-key-status invalid'; }
                    }
                    resolve(isValid);
                },
                onerror: function() {
                    if (statusEl) { statusEl.textContent = 'Network Error'; statusEl.className = 'api-key-status invalid'; }
                    resolve(false);
                },
                ontimeout: function() {
                    if (statusEl) { statusEl.textContent = 'Timeout'; statusEl.className = 'api-key-status invalid'; }
                    resolve(false);
                }
            });
        });
    }

    function startApiProcessing() {
        apiKey = GM_getValue(API_KEY_STORAGE, null);
        fetchAPIData(apiKey);
    }

    function stopApiProcessing() {
        clearTimeout(apiFetchTimeout);
    }

    function loadCountsFromLocalStorage(source) {
        const storageKey = source === 'faction' ? FACTION_ITEM_COUNT_STORAGE_KEY : ITEM_COUNT_STORAGE_KEY;
        let storedCounts = {};
        try {
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
                storedCounts = JSON.parse(storedData);
                if (typeof storedCounts !== 'object' || storedCounts === null) {
                    storedCounts = {};
                }
            }
        } catch (e) {
            console.warn(`Error loading ${source} counts from localStorage:`, e);
            storedCounts = {};
        }
        return storedCounts;
    }

    function saveCountsToLocalStorage(source, countsToSave) {
        const storageKey = source === 'faction' ? FACTION_ITEM_COUNT_STORAGE_KEY : ITEM_COUNT_STORAGE_KEY;
        try {
            if (typeof countsToSave === 'object' && countsToSave !== null) {
                localStorage.setItem(storageKey, JSON.stringify(countsToSave));
            } else {
                console.warn(`Attempted to save invalid counts for ${source}:`, countsToSave);
            }
        } catch (e) {
            console.error(`Error saving ${source} counts to localStorage:`, e);
         }
    }

    function fetchInitialItemCounts(source, container = document) {
        let scanMadeChanges = false;
        if (!itemCounts[source]) itemCounts[source] = {};
        const currentSourceCounts = { ...(itemCounts[source]) };

        const factionItemsSelector = '#faction-armoury ul.item-list > li';
        const personalItemsSelector = 'div#category-wrap > ul.ui-tabs-panel:not([aria-hidden="true"]) li[data-item], ul#item-list-wrap > li[data-item]';
        const itemsSelector = source === 'faction' ? factionItemsSelector : personalItemsSelector;
        const isTrackedItem = (id) => ALL_ITEM_IDS.has(parseInt(id));

        let itemElements = [];
        try {
            if (!container || typeof container.querySelectorAll !== 'function') {
                console.warn("fetchInitialItemCounts: Invalid container provided, defaulting to document.");
                container = document;
            }
            itemElements = Array.from(container.querySelectorAll(itemsSelector));
        } catch (e) {
            console.error(`Error selecting items for ${source}:`, e);
            itemElements = [];
        }

        if (source === 'personal' && itemElements.length === 0) {
            const altSelector = 'li[id^="item"]';
            try {
                const altItemElements = Array.from(container.querySelectorAll(altSelector));
                if (altItemElements.length > 0) {
                    itemElements = altItemElements;
                }
            } catch(e) { console.warn("Error trying alternative personal item selector:", e); }
        }

        itemElements.forEach((itemLi) => {
            if (!(itemLi instanceof HTMLElement)) return;
            try {
                let itemId = null, quantity = null;

                if (source === 'faction') {
                    itemId = itemLi.getAttribute('data-itemid') || itemLi.getAttribute('data-id');
                    if (!itemId) {
                        const imgWrap = itemLi.querySelector('div.img-wrap[data-itemid]');
                        itemId = imgWrap?.dataset.itemid;
                    }
                    if (!itemId || !isTrackedItem(itemId)) return;

                    const nameDiv = itemLi.querySelector('div.name');
                    const qtySpan = nameDiv?.querySelector('span.qty');
                    if (nameDiv) {
                        if (qtySpan?.textContent) {
                            quantity = parseInt(qtySpan.textContent.replace(/[\D]/g, ''));
                        } else {
                            const nameMatch = nameDiv.textContent.match(/ x([\d,]+)$/);
                            if (nameMatch && nameMatch[1]) {
                                quantity = parseInt(nameMatch[1].replace(/,/g, ''));
                            } else {
                                quantity = 1;
                            }
                        }
                    } else {
                        return;
                    }
                } else {
                    if (itemLi.classList.contains('clear') || itemLi.classList.contains('select-all') || itemLi.classList.contains('deselect-all') || !itemLi.querySelector('.name, .title-wrap')) return;

                    itemId = itemLi.getAttribute('data-item') || itemLi.getAttribute('data-itemid');
                    if (!itemId && itemLi.id && itemLi.id.startsWith('item')) itemId = itemLi.id.replace('item', '');
                    if (!itemId || !isTrackedItem(itemId)) return;

                    const dataQtyStr = itemLi.getAttribute('data-qty');
                    const qtyElement = itemLi.querySelector('.thumbnail-wrap .item-amount.qty');
                    const qtyTextRaw = qtyElement?.textContent;

                    if (dataQtyStr !== null && dataQtyStr !== '') {
                        const parsedDataQty = parseInt(dataQtyStr);
                        if (!isNaN(parsedDataQty) && parsedDataQty >= 0) {
                            quantity = parsedDataQty;
                        }
                    }
                    if (quantity === null && qtyTextRaw) {
                        const qtyText = qtyTextRaw.replace(/[\D]/g, '');
                        if (qtyText !== '') {
                            const parsedTextQty = parseInt(qtyText);
                            if (!isNaN(parsedTextQty) && parsedTextQty >= 0) {
                                quantity = parsedTextQty;
                            }
                        }
                    }
                    if (quantity === null) {
                         if (!qtyElement && dataQtyStr === null) {
                             quantity = 1;
                         } else {
                             quantity = 0;
                         }
                    }
                }

                itemId = parseInt(itemId);
                if (isNaN(itemId)) return;

                if (quantity !== null && !isNaN(quantity) && quantity >= 0) {
                    if (currentSourceCounts[itemId] !== quantity) {
                        currentSourceCounts[itemId] = quantity;
                        scanMadeChanges = true;
                    }
                } else {
                     if (currentSourceCounts[itemId] !== 0 && currentSourceCounts[itemId] !== undefined) {
                         currentSourceCounts[itemId] = 0;
                         scanMadeChanges = true;
                     } else if (currentSourceCounts[itemId] === undefined) {
                          currentSourceCounts[itemId] = 0;
                     }
                }
            } catch (e) {
                console.warn("Error processing item element:", itemLi, e);
            }
        });

        if (scanMadeChanges) {
            itemCounts[source] = currentSourceCounts;
            saveCountsToLocalStorage(source, currentSourceCounts);
            if (source === medicalSource) updateQuickUsePanel(ITEM_TYPES.MEDICAL);
            if (source === drugSource) updateQuickUsePanel(ITEM_TYPES.DRUG);
            if (source === boosterSource) updateQuickUsePanel(ITEM_TYPES.BOOSTER);
            checkEmptyBloodBagAlert();
        } else {
            checkEmptyBloodBagAlert();
        }
    }

    function updateItemCountDisplay(itemId, newCount, source) {
        itemId = parseInt(itemId);
        newCount = parseInt(newCount);
        if (isNaN(itemId) || isNaN(newCount) || newCount < 0 || (source !== 'personal' && source !== 'faction')) {
            console.warn("Invalid updateItemCountDisplay call:", itemId, newCount, source);
            return;
        }

        if (!itemCounts[source]) { itemCounts[source] = {}; }
        if (itemCounts[source][itemId] === newCount) return;

        itemCounts[source][itemId] = newCount;
        saveCountsToLocalStorage(source, itemCounts[source]);

        const itemData = ALL_ITEMS.find(item => item.id === itemId);
        if (!itemData) { console.warn(`updateItemCountDisplay: Item data not found for ID ${itemId}`); return; }
        const itemType = itemData.type;

        let panelContainer, currentItemSource;
        if (itemType === ITEM_TYPES.MEDICAL) { panelContainer = medicalQuickUseContainer; currentItemSource = medicalSource; }
        else if (itemType === ITEM_TYPES.DRUG) { panelContainer = drugQuickUseContainer; currentItemSource = drugSource; }
        else if (itemType === ITEM_TYPES.BOOSTER) { panelContainer = boosterQuickUseContainer; currentItemSource = boosterSource; }
        else return;

        if (panelContainer && currentItemSource === source) {
            const button = panelContainer.querySelector(`.quick-use-button[data-item-id="${itemId}"]`);
            if (button) {
                const countSpan = button.querySelector('.quick-use-button-count');
                if (countSpan) countSpan.textContent = `x${newCount}`;
                button.style.display = isMinimized ? 'none' : (newCount > 0 ? 'flex' : 'none');
                if (itemType === ITEM_TYPES.MEDICAL) {
                    checkBloodBagAlert();
                    checkEmptyBloodBagAlert();
                }
            } else if (newCount > 0) {
                updateQuickUsePanel(itemType);
            }
        }
    }

    function findArmouryItemId(targetItemId, targetItemName) {
        targetItemId = parseInt(targetItemId);
        const armouryContainer = document.querySelector('#faction-armoury');
        if (!armouryContainer) {
             console.warn("findArmouryItemId: Faction armoury container not found.");
             return null;
        }

        const selectors = [
            `ul.item-list > li[data-itemid="${targetItemId}"]`,
            `.item-list-wrap li[data-itemid="${targetItemId}"]`,
            `li[data-id="${targetItemId}"]`,
            `li[data-armoryitemid]`
        ];

        for (const selector of selectors) {
            try {
                const itemLi = armouryContainer.querySelector(selector);
                if (itemLi) {
                    const actionElement = itemLi.querySelector('a[href*="armoryItemID="], button[data-id][onclick*="armoryItemAction"], a[onclick*="armoryItemAction"], div[data-id][onclick*="armoryItemAction"]');
                    if (actionElement) {
                        let match = null;
                        if (actionElement.href) {
                            match = actionElement.href.match(/armoryItemID=(\d+)/);
                        } else if (actionElement.dataset && actionElement.dataset.id && actionElement.onclick && actionElement.onclick.toString().includes('armoryItemAction')) {
                            match = [null, actionElement.dataset.id];
                        } else if (actionElement.onclick) {
                            match = actionElement.onclick.toString().match(/armoryItemAction\((\d+)/);
                        }
                        if (match && match[1]) {
                            return match[1];
                        }
                    }
                    const liArmouryId = itemLi.getAttribute('data-armoryitemid');
                    if (liArmouryId) {
                        return liArmouryId;
                    }
                    const liDataId = itemLi.getAttribute('data-id');
                    if (liDataId && parseInt(liDataId) === targetItemId && itemLi.querySelector('.name')?.textContent.includes(targetItemName)) {
                        const innerAction = itemLi.querySelector('a[href*="armoryItemID="]');
                        if(innerAction) {
                            const innerMatch = innerAction.href.match(/armoryItemID=(\d+)/);
                            if(innerMatch && innerMatch[1]) {
                                return innerMatch[1];
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn(`Error searching for armoury item ID with selector "${selector}":`, e);
            }
        }
        console.warn(`findArmouryItemId: Could not find armouryItemID for ${targetItemName} (ID: ${targetItemId})`);
        return null;
    }

    function submitItemUseRequest(id, name, token, source, originalCount, factionMethod = 'faction_direct') {
        const isFaction = source === 'faction';
        let endpoint = 'https://www.torn.com/item.php';
        const params = new URLSearchParams();
        params.append('step', 'useItem');
        params.append('confirm', 'yes');
        params.append('itemID', id);
        params.append(getRFC() === token ? 'rfc_token' : 'csrf', token);

        let methodType = 'personal';

        if (isFaction) {
            if (factionMethod === 'faction_direct') {
                params.append('fac', '1');
                methodType = 'faction_direct';
            } else {
                const armouryItemID = findArmouryItemId(id, name);
                if (!armouryItemID) {
                    showTemporaryFeedback(`Cannot find ${name} in faction armoury (Fallback Failed). Please refresh armoury page.`, 'error');
                    clearItemUseProgress(id, source);
                    updateItemCountDisplay(id, originalCount, source);
                    return;
                }
                endpoint = 'https://www.torn.com/factions.php';
                params.delete('step');
                params.delete('confirm');
                params.delete('itemID');
                params.delete(getRFC() === token ? 'rfc_token' : 'csrf');
                params.append('step', 'armoryItemAction');
                params.append('confirm', 'yes');
                params.append('armoryItemID', armouryItemID);
                params.append('action', 'use');
                params.append('csrf', token);
                methodType = 'faction_traditional';
            }
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.timeout = 15000;

        xhr.onload = function() {
            handleItemUseResponse(this, id, name, source, methodType, originalCount);
        };
        xhr.onerror = function() {
            showTemporaryFeedback(`Network error using ${name}.`, 'error');
            if (methodType !== 'faction_direct') {
                clearItemUseProgress(id, source);
                updateItemCountDisplay(id, originalCount, source);
            }
        };
        xhr.ontimeout = function() {
             showTemporaryFeedback(`Timeout using ${name}.`, 'error');
             if (methodType !== 'faction_direct') {
                 clearItemUseProgress(id, source);
                 updateItemCountDisplay(id, originalCount, source);
             }
        };

        xhr.send(params.toString());
    }

    function formatCooldownFromMessage(message) {
        try {
            const cooldownRegex = /<span[^>]*class=["']counter-wrap["'][^>]*data-time=["'](\d+)["'][^>]*>\s*<\/span>\.?/i;
            const match = message.match(cooldownRegex);
            if (match && match[1]) {
                const seconds = parseInt(match[1]);
                if (!isNaN(seconds) && seconds > 0) {
                    const formattedTime = formatSecondsSimple(seconds);
                    return message.replace(match[0], ` ${formattedTime}.`);
                } else {
                    return message.replace(match[0], '.');
                }
            }
        } catch (e) {
            console.warn("Error formatting cooldown from message:", e);
        }
        return message;
    }

    function handleItemUseResponse(xhr, itemId, itemName, source, methodUsed, originalCount) {
        let success = false, cooldown = false, overdose = false, requiresNavigation = false;
        let message = `Error using ${itemName}: Unknown response`;
        let rawResponseText = xhr.responseText || '';
        let feedbackType = 'error';

        if (methodUsed === 'faction_direct') {
            clearItemUseProgressFallbackTimer(itemId, source);
        }

        if (xhr.status === 200) {
            try {
                const data = JSON.parse(rawResponseText);
                const responseTextFromJson = data.text || data.message || (data.error ? JSON.stringify(data.error) : '');
                const lowerResponse = responseTextFromJson.toLowerCase();

                if (data.success || (responseTextFromJson && (lowerResponse.includes('consumed') || lowerResponse.includes('used')))) {
                    success = true;
                    message = formatCooldownFromMessage(responseTextFromJson) || `Used ${itemName} successfully!`;
                    feedbackType = 'success';
                } else if (lowerResponse.includes('overdose')) {
                    overdose = true;
                    message = extractCooldownMessage(responseTextFromJson, 'Drug OD') || 'You overdosed!';
                    feedbackType = 'error';
                } else if (lowerResponse.includes('cooldown') || lowerResponse.includes('effect of a')) {
                    cooldown = true;
                    message = extractCooldownMessage(responseTextFromJson, 'Item') || 'Item cooldown active or effect already present.';
                    feedbackType = 'info';
                } else if (lowerResponse.includes('traveling') || lowerResponse.includes('abroad')) {
                    requiresNavigation = true;
                    message = `Cannot use ${itemName} while traveling.`;
                    feedbackType = 'error';
                } else {
                    message = responseTextFromJson || `Error: ${extractCooldownMessage(responseTextFromJson, 'Item') || data.error || 'Unknown error'}`;
                    feedbackType = responseTextFromJson ? 'error' : 'info';
                }
            } catch (e) {
                const lowerHtml = rawResponseText.toLowerCase();
                if (lowerHtml.includes('<span class="counter-wrap"')) {
                    cooldown = true;
                    message = rawResponseText;
                    feedbackType = 'info';
                } else if (lowerHtml.includes('success') || lowerHtml.includes('consumed') || lowerHtml.includes('used')) {
                    success = true;
                    const successMatch = rawResponseText.match(/<div[^>]*class=["'][^"']*success[^"']*["'][^>]*>(.*?)<\/div>/i) || rawResponseText.match(/<p[^>]*class=["'][^"']*msg[^"']*["'][^>]*>(.*?)<\/p>/i);
                    let baseMessage = successMatch ? (successMatch[1].replace(/<[^>]+>/g, '').trim() || `Used ${itemName} successfully!`) : `Used ${itemName} successfully!`;
                    message = formatCooldownFromMessage(baseMessage);
                    feedbackType = 'success';
                } else if (lowerHtml.includes('overdose')) {
                    overdose = true;
                    message = extractCooldownMessage(rawResponseText, 'Drug OD') || 'You overdosed!';
                    feedbackType = 'error';
                } else if (lowerHtml.includes('cooldown') || lowerHtml.includes('effect of a')) {
                    cooldown = true;
                    message = extractCooldownMessage(rawResponseText, 'Item') || 'Item cooldown active or effect already present.';
                    feedbackType = 'info';
                } else if (lowerHtml.includes('traveling') || lowerHtml.includes('abroad')) {
                    requiresNavigation = true;
                    message = `Cannot use ${itemName} while traveling.`;
                    feedbackType = 'error';
                } else {
                    const errorMatch = rawResponseText.match(/<[^>]*class=['"]error['"][^>]*>(.*?)<\/|Validation failed|Error:|not authorized/i);
                    if (errorMatch) {
                        message = `Error: ${(errorMatch[1] || 'Validation failed').replace(/<[^>]+>/g, '').trim()}`;
                    } else {
                        message = `Error: ${extractCooldownMessage(rawResponseText, 'Item') || 'Unexpected response'}`;
                    }
                    feedbackType = 'error';
                }
            }
        } else {
            message = `Error using ${itemName}: Request failed (${xhr.status})`;
            if (xhr.status === 403) {
                message = `Error using ${itemName}: Forbidden (403). Check CSRF token or script interference.`;
            } else if (xhr.status === 0) {
                message = `Error using ${itemName}: Network error or request blocked. Check browser console (F12).`;
            }
            feedbackType = 'error';
        }

        showTemporaryFeedback(message, feedbackType);

        if (!success) {
            if (methodUsed === 'personal' || methodUsed === 'faction_traditional' || (methodUsed === 'faction_direct' && !cooldown && !overdose)) {
                 updateItemCountDisplay(itemId, originalCount, source);
            }
            clearItemUseProgress(itemId, source);
        } else {
            clearItemUseProgress(itemId, source);
            localStorage.removeItem(API_DATA_CACHE_KEY);
            stopApiProcessing();
            setTimeout(startApiProcessing, 2500);
            clearTimeout(itemScanTimer);
            itemScanTimer = setTimeout(() => fetchInitialItemCounts(source), 3500);
        }

        if (cooldown || overdose) {
            localStorage.removeItem(API_DATA_CACHE_KEY);
            stopApiProcessing();
            setTimeout(startApiProcessing, 2000);
        }
    }

    function extractCooldownMessage(html, type = 'Item') {
        if (!html) return null;
        try {
            const timerSpanMatch = html.match(/<span[^>]*class=["']counter-wrap["'][^>]*data-time=["'](\d+)["'][^>]*>/i);
            if (timerSpanMatch && timerSpanMatch[1]) {
                const seconds = parseInt(timerSpanMatch[1]);
                if (seconds > 0) {
                    return `${type} Cooldown Active: ${timerSpanMatch[0]}</span>`;
                }
            }

            const timeMatch = html.match(/(\d+)\s*hours?,\s*(\d+)\s*minutes?,\s*(\d+)\s*seconds?/i)
                             || html.match(/(\d+)\s*minutes?,\s*(\d+)\s*seconds?/i)
                             || html.match(/wait\s+(\d+)\s*m\s+(\d+)\s*s/i)
                             || html.match(/(\d+)\s*seconds?/i)
                             ;
            if (timeMatch) {
                let h = 0, m = 0, s = 0;
                if (timeMatch.length === 4) {
                    h = parseInt(timeMatch[1]); m = parseInt(timeMatch[2]); s = parseInt(timeMatch[3]);
                } else if (timeMatch.length === 3 && (html.includes('minute') || html.includes(' m '))) {
                    m = parseInt(timeMatch[1]); s = parseInt(timeMatch[2]);
                } else if (timeMatch.length === 2 && html.includes('second')) {
                    s = parseInt(timeMatch[1]); m = Math.floor(s / 60); s %= 60;
                }
                if(h > 0 || m > 0 || s > 0) {
                    let parts = [];
                    if (h > 0) parts.push(`${h}h`);
                    if (m > 0) parts.push(`${m}m`);
                    if (s > 0) parts.push(`${s}s`);
                    return `${type} Cooldown: ${parts.join(' ')} remaining`;
                }
            }

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const msgElement = tempDiv.querySelector('.message, .msg, .error, .note, .content, .cont_gray, div[class*="cooldown"], div[class*="note"]');
            if (msgElement) {
                let text = (msgElement.textContent || msgElement.innerText || '').replace(/\s+/g, ' ').trim();
                const lowerText = text.toLowerCase();
                if (lowerText.includes('cooldown') || lowerText.includes('wait') || lowerText.includes('effect of a')) {
                    if (text.length > 150) text = text.substring(0, 147) + '...';
                    return text;
                }
            }

            const lowerHtml = html.toLowerCase();
            if (lowerHtml.includes('cooldown') || lowerHtml.includes('wait')) {
                return `On ${type.toLowerCase()} cooldown`;
            }
        } catch (e) {
            console.warn("Error extracting cooldown message:", e);
        }
        return null;
    }

    function setItemUseProgress(itemId, source, method, fallbackTimerId = null) {
        const key = `${ITEM_USE_IN_PROGRESS_STORAGE}_${source}_${itemId}`;
        const data = { id: itemId, source: source, method: method, timestamp: Date.now(), fallbackTimerId: fallbackTimerId };
        try {
            GM_setValue(key, JSON.stringify(data));
        } catch (e) { console.error("Error setting item use progress:", e); }
    }

    function clearItemUseProgress(itemId, source) {
        const key = `${ITEM_USE_IN_PROGRESS_STORAGE}_${source}_${itemId}`;
        try {
            const existingData = GM_getValue(key, null);
            if (existingData) {
                const parsedData = JSON.parse(existingData);
                if (parsedData.fallbackTimerId) {
                    clearTimeout(parsedData.fallbackTimerId);
                }
                GM_deleteValue(key);
            }
        } catch (e) {
             console.warn("Error clearing item use progress:", e);
             GM_deleteValue(key);
        }
    }

    function clearItemUseProgressFallbackTimer(itemId, source) {
        const key = `${ITEM_USE_IN_PROGRESS_STORAGE}_${source}_${itemId}`;
        try {
            const existingData = GM_getValue(key, null);
            if (existingData) {
                const parsedData = JSON.parse(existingData);
                if (parsedData.fallbackTimerId) {
                    clearTimeout(parsedData.fallbackTimerId);
                    parsedData.fallbackTimerId = null;
                    GM_setValue(key, JSON.stringify(parsedData));
                }
            }
        } catch (e) { console.warn("Error clearing fallback timer in progress data:", e); }
    }

    function isItemUseInProgress(itemId, source) {
        const key = `${ITEM_USE_IN_PROGRESS_STORAGE}_${source}_${itemId}`;
        try {
            const data = GM_getValue(key, null);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed && (Date.now() - (parsed.timestamp || 0)) < 30000) {
                    return true;
                } else if (parsed) {
                    clearItemUseProgress(itemId, source);
                }
            }
        } catch (e) {
            console.warn("Error checking item use progress:", e);
            GM_deleteValue(key);
        }
        return false;
    }

    function setPendingFactionUse(itemId, itemName, originalCount) {
        const data = { id: itemId, name: itemName, originalCount: originalCount };
        try {
            GM_setValue(PENDING_FACTION_ITEM_USE_STORAGE, JSON.stringify(data));
        } catch (e) { console.error("Error setting pending faction use:", e); }
    }

    function getAndClearPendingFactionUse() {
        try {
            const data = GM_getValue(PENDING_FACTION_ITEM_USE_STORAGE, null);
            if (data) {
                GM_deleteValue(PENDING_FACTION_ITEM_USE_STORAGE);
                const parsed = JSON.parse(data);
                return parsed;
            }
        } catch (e) {
            console.warn("Error getting/clearing pending faction use:", e);
            GM_deleteValue(PENDING_FACTION_ITEM_USE_STORAGE);
        }
        return null;
    }

    function setPendingPersonalUse(itemId, itemName, originalCount) {
        const data = { id: itemId, name: itemName, originalCount: originalCount };
        try {
            GM_setValue(PENDING_PERSONAL_ITEM_USE_STORAGE, JSON.stringify(data));
        } catch (e) { console.error("Error setting pending personal use:", e); }
    }

    function getAndClearPendingPersonalUse() {
        try {
            const data = GM_getValue(PENDING_PERSONAL_ITEM_USE_STORAGE, null);
            if (data) {
                GM_deleteValue(PENDING_PERSONAL_ITEM_USE_STORAGE);
                const parsed = JSON.parse(data);
                return parsed;
            }
        } catch (e) {
            console.warn("Error getting/clearing pending personal use:", e);
            GM_deleteValue(PENDING_PERSONAL_ITEM_USE_STORAGE);
        }
        return null;
    }

    function useItem(itemId, itemName, itemType, source) {
        itemId = parseInt(itemId);
        const nonQuickUseBoosters = [ 329, 331, 106, 330, 367, 400, 618, 368, 472, 561, 583, 473, 474, 476, 475, 634, 37, 527, 210, 529, 1039, 556, 587, 528, 36, 1028, 38, 35, 39, 209, 1312, 586, 310, 151, 366 ];
        if (itemType === ITEM_TYPES.BOOSTER && nonQuickUseBoosters.includes(itemId)) {
            showTemporaryFeedback(`Cannot quick-use ${itemName}. Use from item page.`, 'info');
            return;
        }

        if (isItemUseInProgress(itemId, source)) {
            showTemporaryFeedback(`Action for ${itemName} already in progress...`, 'info', 2000);
            return;
        }

        showTemporaryFeedback(`Using ${itemName} from ${source}...`, 'info');

        const currentCount = itemCounts[source]?.[itemId] || 0;
        if (currentCount <= 0) {
            showTemporaryFeedback(`Cannot use ${itemName}: You have none in ${source} inventory.`, 'error');
            updateItemCountDisplay(itemId, 0, source);
            return;
        }

        updateItemCountDisplay(itemId, currentCount - 1, source);

        const token = getCsrfToken();
        if (!token) {
            showTemporaryFeedback(`Unable to use ${itemName}: No CSRF token found. Refresh page?`, 'error');
            updateItemCountDisplay(itemId, currentCount, source);
            return;
        }

        const isItemsPage = window.location.href.includes('item.php');
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');

        if (source === 'faction') {
            if (!isFactionArmouryPage) {
                setPendingFactionUse(itemId, itemName, currentCount);
                const targetUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury';
                showTemporaryFeedback(`Navigating to faction armoury for ${itemName}...`, 'info');
                window.location.href = targetUrl;
                return;
            } else {
                setItemUseProgress(itemId, source, 'faction_direct');
                const fallbackTimer = setTimeout(() => {
                    const progressKey = `${ITEM_USE_IN_PROGRESS_STORAGE}_${source}_${itemId}`;
                    try {
                        const progressData = GM_getValue(progressKey, null);
                        if (progressData) {
                            const parsed = JSON.parse(progressData);
                            if (parsed && parsed.method === 'faction_direct') {
                                showTemporaryFeedback(`Faction use taking long, trying alternative method for ${itemName}...`, 'info');
                                setItemUseProgress(itemId, source, 'faction_traditional');
                                submitItemUseRequest(itemId, itemName, token, source, currentCount, 'faction_traditional');
                            }
                        }
                    } catch(e) { console.warn("Error in faction use fallback timer:", e); }
                }, FACTION_FALLBACK_TIMEOUT);

                setItemUseProgress(itemId, source, 'faction_direct', fallbackTimer);
                submitItemUseRequest(itemId, itemName, token, source, currentCount, 'faction_direct');
            }
        } else {
            if (!isItemsPage) {
                setPendingPersonalUse(itemId, itemName, currentCount);
                const targetUrl = 'https://www.torn.com/item.php';
                showTemporaryFeedback(`Navigating to items page for ${itemName}...`, 'info');
                window.location.href = targetUrl;
                return;
            } else {
                setItemUseProgress(itemId, source, 'personal');
                submitItemUseRequest(itemId, itemName, token, source, currentCount);
            }
        }
    }

    function sendDesktopNotification(title, body, type) {
        if (!notificationsEnabled) { return; }

        if (typeof Notification !== 'undefined') {
            if (Notification.permission === "granted") {
                if (typeof GM_notification === 'function') {
                    GM_notification({
                        title: title,
                        text: body,
                        timeout: 10000,
                        onclick: function() { window.focus(); }
                    });
                } else {
                    const notification = new Notification(title, { body: body });
                    notification.onclick = () => { window.focus(); };
                }
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        sendDesktopNotification(title, body, type);
                    }
                });
            }
        } else if (typeof GM_notification === 'function') {
             GM_notification({
                 title: title,
                 text: body,
                 timeout: 10000,
                 onclick: function() { window.focus(); }
             });
        } else {
            console.warn("Desktop notifications not supported by GM_notification or Notification API.");
        }
    }

    function checkCooldownNotifications() {
        if (!isApiDataReady) { return; }
        const now = Date.now();

        const checkType = (type, endTimeMs, settingEnabled, titlePrefix, navigateSuffix) => {
            const alertId = `${type}CDAlert`;
            const storedState = activeAlertStates[alertId];
            const isFinished = typeof endTimeMs === 'number' && endTimeMs <= now;

            if (isFinished) {
                let shouldShowNotification = false;

                if (!storedState || storedState.triggeredAt !== endTimeMs) {
                    updateAlertState(alertId, true, endTimeMs, 0, null);
                    shouldShowNotification = true;
                } else {
                    const dismissCount = storedState.dismissCount || 0;
                    const dismissedAt = storedState.dismissedAt || 0;

                    if (dismissCount === 0) {
                        shouldShowNotification = true;
                    } else if (dismissCount === 1) {
                        const timeSinceDismissal = now - dismissedAt;
                        if (timeSinceDismissal >= FIVE_MINUTES_MS) {
                            shouldShowNotification = true;
                        } else {
                            shouldShowNotification = false;
                        }
                    } else {
                        shouldShowNotification = false;
                    }
                }

                if (shouldShowNotification && settingEnabled) {
                    const existingDom = document.querySelector(`#unified-tracker-alerts-container .unified-tracker-interactive-alert[data-notification-id="${alertId}"]`);
                    if (!existingDom) {
                        const message = `${titlePrefix} cooldown finished!`;
                        const navigateUrl = `https://www.torn.com/item.php${navigateSuffix}`;
                        showInteractiveNotification(message, 'info', navigateUrl, alertId, false, endTimeMs);
                        if (notificationsEnabled) {
                            sendDesktopNotification(`${titlePrefix} Ready`, message, type);
                        }
                    } else {
                    }
                } else if (!shouldShowNotification) {
                     const existingDom = document.querySelector(`#unified-tracker-alerts-container .unified-tracker-interactive-alert[data-notification-id="${alertId}"]`);
                     if (existingDom) {
                         existingDom.remove();
                     }
                }
            } else {
                if (storedState) {
                    updateAlertState(alertId, false);
                }
                const existingAlert = document.querySelector(`#unified-tracker-alerts-container .unified-tracker-interactive-alert[data-notification-id="${alertId}"]`);
                if (existingAlert) {
                    existingAlert.remove();
                }
            }
        };

        checkType('drug', apiData.cooldowns.drugEnd, notifyDrugCD, 'Drug', '#drugs');
        checkType('booster', apiData.cooldowns.boosterEnd, notifyBoosterCD, 'Booster', '#boosters');
        checkType('medical', apiData.cooldowns.medicalEnd, notifyMedicalCD, 'Medical', '#medical');
    }

    function buildUI() {
        const existingUI = document.getElementById('unified-tracker-container-main');
        if (existingUI) { existingUI.remove(); }
        const oldTooltip = document.getElementById('unified-tracker-tooltip');
        if (oldTooltip) oldTooltip.remove();
        const existingSettings = document.getElementById('unified-tracker-settings-panel');
        if (existingSettings) existingSettings.remove();

        uiContainer = document.createElement('div');
        uiContainer.className = 'unified-tracker-container';
        uiContainer.id = 'unified-tracker-container-main';
        isMinimized = localStorage.getItem(MINIMIZED_STATE_STORAGE) === 'true';

        const savedTop = GM_getValue(UI_POSITION_TOP_STORAGE, null);
        const savedLeft = GM_getValue(UI_POSITION_LEFT_STORAGE, null);

        if (savedTop !== null) uiContainer.style.top = savedTop;
        if (savedLeft !== null) uiContainer.style.left = savedLeft;

        const toggleButton = document.createElement('button');
        toggleButton.className = 'unified-tracker-toggle-button';
        toggleButton.addEventListener('click', toggleMinimize);
        uiContainer.appendChild(toggleButton);

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'tracker-content-wrapper';
        uiContainer.appendChild(contentWrapper);

        const title = document.createElement('h4');
        title.textContent = 'Cooldown Manager';
        title.addEventListener('mousedown', startDrag);
        title.addEventListener('touchstart', startDragTouch, { passive: false });
        contentWrapper.appendChild(title);

        const apiSection = document.createElement('div');
        apiSection.className = 'tracker-section api-data-section';
        apiSection.innerHTML = `
            <div class="api-status">Loading API data...</div>
            <ul class="cooldown-timers-list">
                <li><a href="https://www.torn.com/item.php#drugs" target="_blank"><span class="timer-name">Drug:</span><span class="timer-value" id="cd-drug" data-tooltip-content="">--</span></a></li>
                <li><a href="https://www.torn.com/item.php#boosters" target="_blank"><span class="timer-name">Booster:</span><span class="timer-value" id="cd-booster" data-tooltip-content="">--</span></a></li>
                <li><a href="https://www.torn.com/item.php#medical" target="_blank"><span class="timer-name">Medical:</span><span class="timer-value" id="cd-medical" data-tooltip-content="">--</span></a></li>
            </ul>
        `;
        contentWrapper.appendChild(apiSection);

        const lifeSection = document.createElement('div');
        lifeSection.className = 'tracker-section life-bar-section';
        lifeSection.innerHTML = `
            <div class="life-bar-container" id="life-bar-cont">
                <div class="life-bar-fill" id="life-bar-fill" style="width: 0%;"></div>
                <div class="life-bar-text" id="life-bar-text">Life: --/-- (0%)</div>
            </div>
        `;
        contentWrapper.appendChild(lifeSection);

        const refillSection = document.createElement('div');
        refillSection.className = 'tracker-section refills-section';
        refillSection.innerHTML = `
            <ul class="refills-list">
                <li id="refill-energy-container"><span class="refill-name">E Refill:</span><span class="refill-value" id="refill-energy">--</span></li>
                <li id="refill-nerve-container"><span class="refill-name">N Refill:</span><span class="refill-value" id="refill-nerve">--</span></li>
                <li id="refill-token-container"><span class="refill-name">Token Refill:</span><span class="refill-value" id="refill-token">--</span></li>
                <li><span class="refill-name">Special Refills:</span><span class="refill-value" id="refill-special">--</span></li>
            </ul>
        `;
        contentWrapper.appendChild(refillSection);

        const medicalHeader = document.createElement('h5');
        medicalHeader.className = 'quick-use-header quick-use-section-element';
        medicalHeader.id = 'medical-header';
        const medicalHeaderLink = document.createElement('a');
        medicalHeaderLink.id = 'medical-header-link';
        medicalHeaderLink.textContent = 'Medical Items';
        medicalHeaderLink.href = medicalSource === 'personal' ? 'https://www.torn.com/item.php#medical' : 'https://www.torn.com/factions.php?step=your#/tab=armoury';
        medicalHeaderLink.target = "_blank";
        medicalHeader.appendChild(medicalHeaderLink);
        contentWrapper.appendChild(medicalHeader);
        const medicalToggle = createSourceToggle(ITEM_TYPES.MEDICAL);
        medicalToggle.classList.add('quick-use-section-element');
        contentWrapper.appendChild(medicalToggle);
        medicalQuickUseContainer = document.createElement('div');
        medicalQuickUseContainer.className = 'medical-quick-use-container quick-use-section-element';
        contentWrapper.appendChild(medicalQuickUseContainer);

        const drugHeader = document.createElement('h5');
        drugHeader.className = 'quick-use-header quick-use-section-element';
        drugHeader.id = 'drug-header';
        const drugHeaderLink = document.createElement('a');
        drugHeaderLink.id = 'drug-header-link';
        drugHeaderLink.textContent = 'Drug Items';
        drugHeaderLink.href = drugSource === 'personal' ? 'https://www.torn.com/item.php#drugs' : 'https://www.torn.com/factions.php?step=your#/tab=armoury';
        drugHeaderLink.target = "_blank";
        drugHeader.appendChild(drugHeaderLink);
        contentWrapper.appendChild(drugHeader);
        const drugToggle = createSourceToggle(ITEM_TYPES.DRUG);
        drugToggle.classList.add('quick-use-section-element');
        contentWrapper.appendChild(drugToggle);
        drugQuickUseContainer = document.createElement('div');
        drugQuickUseContainer.className = 'drug-quick-use-container quick-use-section-element';
        contentWrapper.appendChild(drugQuickUseContainer);

        const boosterHeader = document.createElement('h5');
        boosterHeader.className = 'quick-use-header quick-use-section-element';
        boosterHeader.id = 'booster-header';
        const boosterHeaderLink = document.createElement('a');
        boosterHeaderLink.id = 'booster-header-link';
        boosterHeaderLink.textContent = 'Booster Items';
        boosterHeaderLink.href = boosterSource === 'personal' ? 'https://www.torn.com/item.php#boosters' : 'https://www.torn.com/factions.php?step=your#/tab=armoury';
        boosterHeaderLink.target = "_blank";
        boosterHeader.appendChild(boosterHeaderLink);
        contentWrapper.appendChild(boosterHeader);
        const boosterToggle = createSourceToggle(ITEM_TYPES.BOOSTER);
        boosterToggle.classList.add('quick-use-section-element');
        contentWrapper.appendChild(boosterToggle);
        boosterQuickUseContainer = document.createElement('div');
        boosterQuickUseContainer.className = 'booster-quick-use-container quick-use-section-element';
        contentWrapper.appendChild(boosterQuickUseContainer);

        const settingsButton = document.createElement('button');
        settingsButton.className = 'unified-settings-button';
        settingsButton.textContent = '⚙️ Settings';
        settingsButton.title = 'Open Settings Panel';
        settingsButton.addEventListener('click', toggleSettingsPanel);
        contentWrapper.appendChild(settingsButton);

        document.body.appendChild(uiContainer);

        customTooltipElement = document.createElement('div');
        customTooltipElement.id = 'unified-tracker-tooltip';
        document.body.appendChild(customTooltipElement);

        const timerList = apiSection.querySelector('.cooldown-timers-list');
        if (timerList) {
            timerList.addEventListener('mouseover', handleTooltipMouseOver);
            timerList.addEventListener('mouseout', handleTooltipMouseOut);
            timerList.addEventListener('mousemove', handleTooltipMouseMove);
        }

        applyMinimizeState(false);
        updateQuickUsePanel(ITEM_TYPES.MEDICAL);
        updateQuickUsePanel(ITEM_TYPES.DRUG);
        updateQuickUsePanel(ITEM_TYPES.BOOSTER);
        updateMainUIDisplay();
        updateTimerDisplays();
        updateSectionVisibility();
        setupCooperativePositioning();

        buildSettingsPanel();
    }

    function createSourceToggle(itemType) {
        const container = document.createElement('div');
        container.className = 'quick-use-source-toggle-container';
        container.dataset.itemType = itemType;

        const label = document.createElement('span');
        label.className = 'quick-use-source-toggle-label';

        const slider = document.createElement('div');
        slider.className = 'quick-use-source-slider';

        let currentSource;
        let sourceStorageKey;
        let headerLinkId;
        let personalUrl;
        const factionUrl = 'https://www.torn.com/factions.php?step=your#/tab=armoury';

        if (itemType === ITEM_TYPES.MEDICAL) {
            currentSource = medicalSource; sourceStorageKey = MEDICAL_SOURCE_STORAGE;
            headerLinkId = 'medical-header-link'; personalUrl = 'https://www.torn.com/item.php#medical';
        } else if (itemType === ITEM_TYPES.DRUG) {
            currentSource = drugSource; sourceStorageKey = DRUG_SOURCE_STORAGE;
            headerLinkId = 'drug-header-link'; personalUrl = 'https://www.torn.com/item.php#drugs';
        } else {
            currentSource = boosterSource; sourceStorageKey = BOOSTER_SOURCE_STORAGE;
            headerLinkId = 'booster-header-link'; personalUrl = 'https://www.torn.com/item.php#boosters';
        }

        const updateSliderAppearance = (source) => {
            label.textContent = source === 'faction' ? 'Source: Faction' : 'Source: Personal';
            slider.classList.toggle('faction-mode', source === 'faction');
            slider.classList.toggle('personal-mode', source === 'personal');

            const headerLink = document.getElementById(headerLinkId);
            if (headerLink) {
                headerLink.href = source === 'faction' ? factionUrl : personalUrl;
            }
        };

        updateSliderAppearance(currentSource);

        slider.addEventListener('click', (e) => {
            e.stopPropagation();
            let newSource;
            if (itemType === ITEM_TYPES.MEDICAL) { medicalSource = (medicalSource === 'personal') ? 'faction' : 'personal'; newSource = medicalSource; }
            else if (itemType === ITEM_TYPES.DRUG) { drugSource = (drugSource === 'personal') ? 'faction' : 'personal'; newSource = drugSource; }
            else { boosterSource = (boosterSource === 'personal') ? 'faction' : 'personal'; newSource = boosterSource; }

            GM_setValue(sourceStorageKey, newSource);
            updateSliderAppearance(newSource);
            showTemporaryFeedback(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} source set to ${newSource}`, 'info', 3000);

            clearTimeout(itemScanTimer);
            itemScanTimer = setTimeout(() => fetchInitialItemCounts(newSource), 500);
            updateQuickUsePanel(itemType);
        });

        container.appendChild(label);
        container.appendChild(slider);
        return container;
    }

    function createPointsRefillSourceToggle() {
        const container = document.createElement('div');
        container.className = 'quick-use-source-toggle-container';

        const label = document.createElement('span');
        label.className = 'quick-use-source-toggle-label';

        const slider = document.createElement('div');
        slider.className = 'quick-use-source-slider';
        slider.id = 'points-refill-source-slider';

        const updateSliderAppearance = (source) => {
            label.textContent = source === 'faction' ? 'Link Target: Faction' : 'Link Target: Personal';
            slider.classList.toggle('faction-mode', source === 'faction');
            slider.classList.toggle('personal-mode', source === 'personal');
        };

        updateSliderAppearance(pointsRefillSource);

        slider.addEventListener('click', (e) => {
            e.stopPropagation();
            pointsRefillSource = (pointsRefillSource === 'personal') ? 'faction' : 'personal';
            GM_setValue(POINTS_REFILL_SOURCE_STORAGE, pointsRefillSource);
            updateSliderAppearance(pointsRefillSource);
            showTemporaryFeedback(`Points Refill link target set to ${pointsRefillSource}`, 'info', 3000);
            updateMainUIDisplay();
        });

        container.appendChild(label);
        container.appendChild(slider);
        return container;
    }

    function updateMainUIDisplay() {
        if (!uiContainer || !document.body.contains(uiContainer)) { return; }

        const apiStatusEl = uiContainer.querySelector('.api-status');
        const lifeBarFillEl = uiContainer.querySelector('#life-bar-fill');
        const lifeBarTextEl = uiContainer.querySelector('#life-bar-text');
        const energyRefillContainerEl = uiContainer.querySelector('#refill-energy-container');
        const nerveRefillContainerEl = uiContainer.querySelector('#refill-nerve-container');
        const tokenRefillContainerEl = uiContainer.querySelector('#refill-token-container');
        const specialRefillEl = uiContainer.querySelector('#refill-special');

        if (apiStatusEl) {
            if (apiData.error) {
                apiStatusEl.textContent = apiData.error;
                apiStatusEl.className = 'api-status api-error';
            } else if (apiData.lastUpdate > 0) {
                const timeString = new Date(apiData.lastUpdate).toLocaleTimeString();
                apiStatusEl.textContent = `API Updated: ${timeString}`;
                apiStatusEl.className = 'api-status';
            } else {
                apiStatusEl.textContent = "Waiting for API data...";
                apiStatusEl.className = 'api-status';
            }
        }

        const lifeCurrent = apiData.bars?.life?.current;
        const lifeMax = apiData.bars?.life?.maximum;
        const lifePerc = apiData.bars?.life?.percentage ?? 0;
        if (lifeBarFillEl) lifeBarFillEl.style.width = `${lifePerc}%`;
        const currentText = typeof lifeCurrent === 'number' ? lifeCurrent : '--';
        const maxText = typeof lifeMax === 'number' ? lifeMax : '--';
        if (lifeBarTextEl) lifeBarTextEl.textContent = `Life: ${currentText}/${maxText} (${lifePerc}%)`;

        const renderRefillLink = (containerEl, usedStatus, name) => {
             if (!containerEl) return;
             if (usedStatus) {
                 containerEl.innerHTML = `<span class="refill-name">${name}:</span><span class="refill-value used">Used</span>`;
             } else {
                 const url = pointsRefillSource === 'faction' ? FACTION_REFILL_URL : PERSONAL_REFILL_URL;
                 containerEl.innerHTML = `<a href="${url}" target="_blank"><span class="refill-name">${name}:</span><span class="refill-value available">Ready</span></a>`;
             }
        };

        renderRefillLink(energyRefillContainerEl, apiData.refills?.energy_refill_used, 'E Refill');
        renderRefillLink(nerveRefillContainerEl, apiData.refills?.nerve_refill_used, 'N Refill');
        renderRefillLink(tokenRefillContainerEl, apiData.refills?.token_refill_used, 'Token Refill');

        if (specialRefillEl) specialRefillEl.textContent = apiData.refills?.special_refills_available ?? '--';
    }

    function updateTimerDisplays() {
        if (!isApiDataReady || !uiContainer || !document.body.contains(uiContainer)) { return; }

        const now = Date.now();

        const updateElement = (id, endTime, type = null, maxCd = 0) => {
            const el = uiContainer.querySelector(id);
            if (!el) return;

            let tooltipText = '', displayHtml = '';
            if (endTime && endTime > now) {
                const remainingSeconds = Math.max(0, Math.round((endTime - now) / 1000));
                displayHtml = formatTime(remainingSeconds);
                try {
                    tooltipText = `Ends: ${new Date(endTime).toLocaleString()}`;
                } catch (e) { tooltipText = 'Invalid end time'; }
                if ((type === 'medical' || type === 'booster') && maxCd > 0) {
                    const availableSeconds = Math.max(0, maxCd - remainingSeconds);
                    tooltipText += `\nAvailable: ${formatSecondsSimple(availableSeconds)}`;
                }
            } else {
                displayHtml = formatTime(0);
                tooltipText = 'Ready';
            }

            if (!isMinimized && el.innerHTML !== displayHtml) {
                el.innerHTML = displayHtml;
            }
            el.dataset.tooltipContent = tooltipText;
        };

        updateElement('#cd-drug', apiData.cooldowns.drugEnd, 'drug');
        updateElement('#cd-booster', apiData.cooldowns.boosterEnd, 'booster', maxBoosterCooldown);
        updateElement('#cd-medical', apiData.cooldowns.medicalEnd, 'medical', maxMedicalCooldown);

        checkCooldownNotifications();
    }

    function handleTooltipMouseOver(event) {
        const target = event.target.closest('.timer-value');
        if (target && customTooltipElement && target.dataset.tooltipContent) {
            customTooltipElement.innerHTML = target.dataset.tooltipContent;
            customTooltipElement.style.display = 'block';
            positionTooltip(event.pageX, event.pageY);
        }
    }
    function handleTooltipMouseOut(event) {
        const target = event.target.closest('.timer-value');
        if (target && customTooltipElement) {
            customTooltipElement.style.display = 'none';
        }
    }
    function handleTooltipMouseMove(event) {
        if (customTooltipElement && customTooltipElement.style.display === 'block') {
            positionTooltip(event.pageX, event.pageY);
        }
    }
    function positionTooltip(x, y) {
        if (!customTooltipElement) return;
        const offsetX = 10, offsetY = 15;
        let newX = x + offsetX, newY = y + offsetY;
        const tooltipRect = customTooltipElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;

        if (newX + tooltipRect.width > viewportWidth) {
            newX = x - tooltipRect.width - offsetX;
        }
        if (newY + tooltipRect.height > viewportHeight) {
            newY = y - tooltipRect.height - offsetY;
        }
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;

        customTooltipElement.style.left = `${newX}px`;
        customTooltipElement.style.top = `${newY}px`;
    }

    function getItemColor(itemId) {
        const customColor = itemColors[itemId];
        if (customColor) {
            return customColor;
        }
        const itemData = ALL_ITEMS.find(item => item.id === itemId);
        return itemData ? itemData.color : '#888888';
    }

    function createQuickUseButton(itemData, count, source) {
        const btn = document.createElement('div');
        btn.className = `quick-use-button type-${itemData.type}`;
        btn.setAttribute('data-item-id', itemData.id);
        btn.setAttribute('data-item-name', itemData.name);
        btn.setAttribute('data-item-type', itemData.type);
        btn.setAttribute('data-item-source', source);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'quick-use-button-name';
        nameSpan.textContent = itemData.name;

        const countSpan = document.createElement('span');
        countSpan.className = 'quick-use-button-count';
        countSpan.textContent = `x${count}`;

        btn.appendChild(nameSpan);
        btn.appendChild(countSpan);

        const bgColor = getItemColor(itemData.id);
        btn.style.backgroundColor = bgColor;
        btn.style.color = getTextColorForBackground(bgColor);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            useItem(itemData.id, itemData.name, itemData.type, source);
        });

        btn.style.display = isMinimized ? 'none' : (count > 0 ? 'flex' : 'none');

        if (itemData.type === ITEM_TYPES.MEDICAL) {
            const lifePerc = apiData.bars?.life?.percentage ?? 100;
            if (lifePerc < LOW_LIFE_THRESHOLD_PERCENT && count > 0) {
                btn.classList.add('blood-bag-alert');
            }
        }

        return btn;
    }

    function updateQuickUsePanel(itemType) {
        let panelContainer, configStorageKey, currentConfig, defaultConfig, currentSource;

        if (itemType === ITEM_TYPES.MEDICAL) {
            panelContainer = medicalQuickUseContainer; configStorageKey = MEDICAL_QUICK_USE_CONFIG_STORAGE;
            currentConfig = medicalQuickUseConfig; defaultConfig = DEFAULT_MEDICAL_QUICK_USE_ITEMS;
            currentSource = medicalSource;
        } else if (itemType === ITEM_TYPES.DRUG) {
            panelContainer = drugQuickUseContainer; configStorageKey = DRUG_QUICK_USE_CONFIG_STORAGE;
            currentConfig = drugQuickUseConfig; defaultConfig = DEFAULT_DRUG_QUICK_USE_ITEMS;
            currentSource = drugSource;
        } else if (itemType === ITEM_TYPES.BOOSTER) {
            panelContainer = boosterQuickUseContainer; configStorageKey = BOOSTER_QUICK_USE_CONFIG_STORAGE;
            currentConfig = boosterQuickUseConfig; defaultConfig = DEFAULT_BOOSTER_QUICK_USE_ITEMS;
            currentSource = boosterSource;
        } else {
            return;
        }

        if (!panelContainer || !document.body.contains(panelContainer)) {
            return;
        }

        panelContainer.innerHTML = '';

        const savedConfig = GM_getValue(configStorageKey, null);
        let activeConfig = [];
        if (savedConfig) {
            try {
                activeConfig = JSON.parse(savedConfig);
                if (!Array.isArray(activeConfig)) throw new Error("Not an array");
            } catch (e) {
                console.warn(`Error parsing ${itemType} quick use config, using default:`, e);
                activeConfig = [...defaultConfig];
                GM_setValue(configStorageKey, JSON.stringify(activeConfig));
            }
        } else {
            activeConfig = [...defaultConfig];
            GM_setValue(configStorageKey, JSON.stringify(activeConfig));
        }

        if (itemType === ITEM_TYPES.MEDICAL) medicalQuickUseConfig = activeConfig;
        else if (itemType === ITEM_TYPES.DRUG) drugQuickUseConfig = activeConfig;
        else if (itemType === ITEM_TYPES.BOOSTER) boosterQuickUseConfig = activeConfig;

        activeConfig.forEach(itemId => {
            const itemData = ALL_ITEMS.find(item => item.id === itemId && item.type === itemType);
            if (itemData) {
                const count = itemCounts[currentSource]?.[itemId] || 0;
                const btn = createQuickUseButton(itemData, count, currentSource);
                panelContainer.appendChild(btn);
            }
        });

        if (itemType === ITEM_TYPES.MEDICAL) {
            checkBloodBagAlert();
        }
    }

    function saveApiKeyFromSettings() {
        if (!settingsPanel) return;
        const keyInput = settingsPanel.querySelector('#tracker-api-key');
        const newKey = keyInput.value.trim();
        const statusEl = settingsPanel.querySelector('.api-key-status');

        if (!newKey) {
            GM_deleteValue(API_KEY_STORAGE);
            localStorage.removeItem(API_DATA_CACHE_KEY);
            apiKey = null;
            if (statusEl) { statusEl.textContent = 'Key cleared.'; statusEl.className = 'api-key-status'; }
            showTemporaryFeedback('API Key cleared.', 'info');
            stopApiProcessing();
            isApiDataReady = false;
            apiData = { cooldowns: { drug: 0, booster: 0, medical: 0, drugEnd: 0, boosterEnd: 0, medicalEnd: 0 }, bars: { life: {}, energy: {}, nerve: {} }, refills: {}, lastUpdate: 0, error: "API Key missing" };
            updateMainUIDisplay();
            updateTimerDisplays();
            return;
        }

        testApiKey(newKey).then(isValid => {
            if (isValid) {
                GM_setValue(API_KEY_STORAGE, newKey);
                localStorage.removeItem(API_DATA_CACHE_KEY);
                apiKey = newKey;
                showTemporaryFeedback('API Key saved successfully!', 'success');
                stopApiProcessing();
                startApiProcessing();
            } else {
                showTemporaryFeedback('Failed to save: API Key is invalid.', 'error');
            }
        });
    }

    function toggleSettingsPanel() {
        if (!settingsPanel) {
            buildSettingsPanel();
        }
        isSettingsVisible = !isSettingsVisible;
        if (settingsPanel) {
            settingsPanel.style.display = isSettingsVisible ? 'flex' : 'none';
            if (isSettingsVisible) {
                populateSettingsPanel();
            }
        }
    }

    function buildSettingsPanel() {
        if (document.getElementById('unified-tracker-settings-panel')) return;

        settingsPanel = document.createElement('div');
        settingsPanel.className = 'unified-settings-panel';
        settingsPanel.id = 'unified-tracker-settings-panel';

        settingsPanel.innerHTML = `
            <div class="unified-settings-panel-header">
                <h4>Tracker Settings</h4>
                <button class="unified-settings-panel-close-button" title="Close Settings">&times;</button>
            </div>
            <div class="unified-settings-panel-content">
                <div class="settings-section">
                    <h5>API Key</h5>
                    <label for="tracker-api-key">Torn API Key (Minimal):</label>
                    <input type="password" id="tracker-api-key" placeholder="Enter API Key" autocomplete="new-password">
                    <div class="api-key-status"></div>
                    <div class="setting-buttons">
                        <button class="test-api-key-button" title="Check if key is valid">Test</button>
                        <button class="save-api-key-button" title="Save key and refresh data">Save Key</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h5>Refills</h5>
                    <div id="points-refill-source-container"></div>
                </div>

                <div class="settings-section">
                    <h5>Notifications</h5>
                    <label class="checkbox-label">
                        <input type="checkbox" id="tracker-notifications-enabled"> Enable Desktop Notifications
                    </label>
                    <label class="sub-label checkbox-label">
                        <input type="checkbox" id="tracker-notify-drug"> Notify: Drug Cooldown Ready
                    </label>
                    <label class="sub-label checkbox-label">
                        <input type="checkbox" id="tracker-notify-booster"> Notify: Booster Cooldown Ready
                    </label>
                    <label class="sub-label checkbox-label">
                        <input type="checkbox" id="tracker-notify-medical"> Notify: Medical Cooldown Ready
                    </label>
                </div>

                <div class="settings-section">
                    <h5>Alerts & Cooldowns</h5>
                    <div>
                        <label for="tracker-max-med-cd">Max Medical CD (Hours):</label>
                        <input type="number" id="tracker-max-med-cd" min="0" step="0.1" style="width: 60px;">
                    </div>
                    <div>
                        <label for="tracker-max-booster-cd">Max Booster CD (Hours):</label>
                        <input type="number" id="tracker-max-booster-cd" min="0" step="0.1" style="width: 60px;">
                    </div>
                    <div>
                        <label class="checkbox-label">
                            <input type="checkbox" id="tracker-empty-bb-alert"> Show In-Page Alert when Empty Blood Bag usable
                        </label>
                    </div>
                </div>

                <div class="settings-section quick-use-customization-section">
                    <h5>Customize Medical Quick Use</h5>
                    <p>Check items to show, drag to reorder, click color swatch to change.</p>
                    <div id="medical-quick-use-editor" class="quick-use-editor"></div>
                </div>

                <div class="settings-section quick-use-customization-section">
                    <h5>Customize Drug Quick Use</h5>
                    <p>Check items to show, drag to reorder, click color swatch to change.</p>
                    <div id="drug-quick-use-editor" class="quick-use-editor"></div>
                </div>

                <div class="settings-section quick-use-customization-section">
                    <h5>Customize Booster Quick Use</h5>
                    <p>Check items to show, drag to reorder, click color swatch to change.</p>
                    <div id="booster-quick-use-editor" class="quick-use-editor"></div>
                </div>
            </div>
        `;

        document.body.appendChild(settingsPanel);

        settingsPanel.querySelector('.unified-settings-panel-close-button').addEventListener('click', toggleSettingsPanel);
        settingsPanel.querySelector('.save-api-key-button').addEventListener('click', saveApiKeyFromSettings);
        settingsPanel.querySelector('.test-api-key-button').addEventListener('click', () => {
            const keyInput = settingsPanel.querySelector('#tracker-api-key');
            testApiKey(keyInput.value);
        });
        settingsPanel.querySelector('#tracker-api-key').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveApiKeyFromSettings();
        });

        const pointsRefillToggle = createPointsRefillSourceToggle();
        settingsPanel.querySelector('#points-refill-source-container').appendChild(pointsRefillToggle);

        settingsPanel.querySelector('#tracker-notifications-enabled').addEventListener('change', (e) => {
            notificationsEnabled = e.target.checked;
            GM_setValue(NOTIFICATIONS_ENABLED_STORAGE, notificationsEnabled);
        });
        settingsPanel.querySelector('#tracker-notify-drug').addEventListener('change', (e) => {
            notifyDrugCD = e.target.checked;
            GM_setValue(NOTIFY_DRUG_CD_STORAGE, notifyDrugCD);
            checkCooldownNotifications();
        });
        settingsPanel.querySelector('#tracker-notify-booster').addEventListener('change', (e) => {
            notifyBoosterCD = e.target.checked;
            GM_setValue(NOTIFY_BOOSTER_CD_STORAGE, notifyBoosterCD);
            checkCooldownNotifications();
        });
        settingsPanel.querySelector('#tracker-notify-medical').addEventListener('change', (e) => {
            notifyMedicalCD = e.target.checked;
            GM_setValue(NOTIFY_MEDICAL_CD_STORAGE, notifyMedicalCD);
            checkCooldownNotifications();
        });

        settingsPanel.querySelector('#tracker-max-med-cd').addEventListener('change', (e) => {
            const medHours = parseFloat(e.target.value);
            if (!isNaN(medHours) && medHours >= 0) {
                maxMedicalCooldown = Math.round(medHours * 3600);
                GM_setValue(MAX_MED_CD_STORAGE, maxMedicalCooldown);
                updateTimerDisplays();
            } else {
                showTemporaryFeedback("Invalid Max Medical Cooldown value.", "error");
                e.target.value = maxMedicalCooldown / 3600;
            }
        });
        settingsPanel.querySelector('#tracker-max-booster-cd').addEventListener('change', (e) => {
            const boosterHours = parseFloat(e.target.value);
            if (!isNaN(boosterHours) && boosterHours >= 0) {
                maxBoosterCooldown = Math.round(boosterHours * 3600);
                GM_setValue(MAX_BOOSTER_CD_STORAGE, maxBoosterCooldown);
                updateTimerDisplays();
            } else {
                showTemporaryFeedback("Invalid Max Booster Cooldown value.", "error");
                e.target.value = maxBoosterCooldown / 3600;
            }
        });
        settingsPanel.querySelector('#tracker-empty-bb-alert').addEventListener('change', (e) => {
            notifyEmptyBloodBag = e.target.checked;
            GM_setValue(EMPTY_BB_ALERT_STORAGE, notifyEmptyBloodBag);
            checkEmptyBloodBagAlert();
        });

        buildQuickUseCustomizationUI(ITEM_TYPES.MEDICAL);
        buildQuickUseCustomizationUI(ITEM_TYPES.DRUG);
        buildQuickUseCustomizationUI(ITEM_TYPES.BOOSTER);
    }

    function populateSettingsPanel() {
        if (!settingsPanel) return;

        const storedKey = GM_getValue(API_KEY_STORAGE, '');
        if (storedKey) settingsPanel.querySelector('#tracker-api-key').value = storedKey;
        settingsPanel.querySelector('#tracker-max-med-cd').value = maxMedicalCooldown / 3600;
        settingsPanel.querySelector('#tracker-max-booster-cd').value = maxBoosterCooldown / 3600;
        settingsPanel.querySelector('#tracker-empty-bb-alert').checked = notifyEmptyBloodBag;
        settingsPanel.querySelector('#tracker-notifications-enabled').checked = notificationsEnabled;
        settingsPanel.querySelector('#tracker-notify-drug').checked = notifyDrugCD;
        settingsPanel.querySelector('#tracker-notify-booster').checked = notifyBoosterCD;
        settingsPanel.querySelector('#tracker-notify-medical').checked = notifyMedicalCD;

        const pointsSlider = settingsPanel.querySelector('#points-refill-source-slider');
        if (pointsSlider) {
            const label = pointsSlider.previousElementSibling;
            label.textContent = pointsRefillSource === 'faction' ? 'Link Target: Faction' : 'Link Target: Personal';
            pointsSlider.classList.toggle('faction-mode', pointsRefillSource === 'faction');
            pointsSlider.classList.toggle('personal-mode', pointsRefillSource === 'personal');
        }

        buildQuickUseCustomizationUI(ITEM_TYPES.MEDICAL);
        buildQuickUseCustomizationUI(ITEM_TYPES.DRUG);
        buildQuickUseCustomizationUI(ITEM_TYPES.BOOSTER);
    }

    function handleDragStart(e) {
        draggedElement = e.target.closest('.quick-use-selection-item');
        if (!draggedElement) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedElement.dataset.itemId);
        setTimeout(() => {
            draggedElement.classList.add('dragging');
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const targetElement = e.target.closest('.quick-use-selection-item');
        const container = e.target.closest('.quick-use-editor');
        if (!container || !draggedElement || !draggedElement.parentNode.isSameNode(container)) return;

        container.querySelectorAll('.quick-use-selection-item.drag-over').forEach(el => el.classList.remove('drag-over'));

        if (targetElement && !targetElement.isSameNode(draggedElement)) {
             targetElement.classList.add('drag-over');
        }
    }

     function handleDragLeave(e) {
         const targetElement = e.target.closest('.quick-use-selection-item');
         if (targetElement) {
             targetElement.classList.remove('drag-over');
         }
     }

    function handleDrop(e) {
        e.preventDefault();
        const targetElement = e.target.closest('.quick-use-selection-item');
        const container = e.target.closest('.quick-use-editor');

        if (!container || !draggedElement || !draggedElement.parentNode.isSameNode(container)) return;

        container.querySelectorAll('.quick-use-selection-item.drag-over').forEach(el => el.classList.remove('drag-over'));

        if (targetElement && !targetElement.isSameNode(draggedElement)) {
            const targetRect = targetElement.getBoundingClientRect();
            const isAfter = e.clientY > targetRect.top + targetRect.height / 2;

            if (isAfter) {
                container.insertBefore(draggedElement, targetElement.nextSibling);
            } else {
                container.insertBefore(draggedElement, targetElement);
            }
        } else if (!targetElement) {
             container.appendChild(draggedElement);
        }

        let itemType;
        if (container.id === 'medical-quick-use-editor') itemType = ITEM_TYPES.MEDICAL;
        else if (container.id === 'drug-quick-use-editor') itemType = ITEM_TYPES.DRUG;
        else if (container.id === 'booster-quick-use-editor') itemType = ITEM_TYPES.BOOSTER;

        if (itemType) {
            saveQuickUseConfig(itemType);
        }
    }

    function handleDragEnd(e) {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
        }
        document.querySelectorAll('.quick-use-selection-item.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedElement = null;
    }


    function buildQuickUseCustomizationUI(itemType) {
        if (!settingsPanel) return;
        let editorContainer, configStorageKey, defaultConfig, itemsList, globalConfigVar;

        if (itemType === ITEM_TYPES.MEDICAL) {
            editorContainer = settingsPanel.querySelector('#medical-quick-use-editor'); configStorageKey = MEDICAL_QUICK_USE_CONFIG_STORAGE;
            defaultConfig = DEFAULT_MEDICAL_QUICK_USE_ITEMS; itemsList = MEDICAL_ITEMS;
            globalConfigVar = 'medicalQuickUseConfig';
        } else if (itemType === ITEM_TYPES.DRUG) {
            editorContainer = settingsPanel.querySelector('#drug-quick-use-editor'); configStorageKey = DRUG_QUICK_USE_CONFIG_STORAGE;
            defaultConfig = DEFAULT_DRUG_QUICK_USE_ITEMS; itemsList = DRUG_ITEMS;
            globalConfigVar = 'drugQuickUseConfig';
        } else if (itemType === ITEM_TYPES.BOOSTER) {
            editorContainer = settingsPanel.querySelector('#booster-quick-use-editor'); configStorageKey = BOOSTER_QUICK_USE_CONFIG_STORAGE;
            defaultConfig = DEFAULT_BOOSTER_QUICK_USE_ITEMS; itemsList = BOOSTER_ITEMS;
            globalConfigVar = 'boosterQuickUseConfig';
        } else { return; }

        if (!editorContainer) { console.error(`Editor container not found for ${itemType}`); return; }
        editorContainer.innerHTML = '';

        const savedConfig = GM_getValue(configStorageKey, null);
        let activeConfig = [];
        if (savedConfig) {
            try {
                activeConfig = JSON.parse(savedConfig);
                if (!Array.isArray(activeConfig)) activeConfig = [...defaultConfig];
            } catch (e) {
                activeConfig = [...defaultConfig];
            }
        } else {
            activeConfig = [...defaultConfig];
        }

        if (globalConfigVar === 'medicalQuickUseConfig') medicalQuickUseConfig = activeConfig;
        else if (globalConfigVar === 'drugQuickUseConfig') drugQuickUseConfig = activeConfig;
        else if (globalConfigVar === 'boosterQuickUseConfig') boosterQuickUseConfig = activeConfig;

        const allTypeItems = [...itemsList];
        const selectedItems = [];
        const unselectedItems = [];

        allTypeItems.forEach(item => {
            if (activeConfig.includes(item.id)) {
                selectedItems.push(item);
            } else {
                unselectedItems.push(item);
            }
        });

        selectedItems.sort((a, b) => activeConfig.indexOf(a.id) - activeConfig.indexOf(b.id));
        unselectedItems.sort((a, b) => a.name.localeCompare(b.name));
        const sortedItems = [...selectedItems, ...unselectedItems];

        sortedItems.forEach(item => {
            const isChecked = activeConfig.includes(item.id);
            const currentColor = getItemColor(item.id);
            const div = document.createElement('div');
            div.className = 'quick-use-selection-item';
            div.setAttribute('data-item-id', item.id);
            div.setAttribute('draggable', true);
            div.innerHTML = `
                <label>
                    <input type="checkbox" ${isChecked ? 'checked' : ''} data-item-id="${item.id}">
                    <span>${item.name}</span>
                </label>
                <span class="drag-handle">☰</span>
                <input type="color" class="quick-use-color-picker" value="${currentColor}" data-item-id="${item.id}" title="Change item color">
                 `;
            editorContainer.appendChild(div);

            div.querySelector('input[type="checkbox"]').addEventListener('change', () => {
                saveQuickUseConfig(itemType);
            });

            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragend', handleDragEnd);

        });

        editorContainer.addEventListener('dragover', handleDragOver);
        editorContainer.addEventListener('dragleave', handleDragLeave);
        editorContainer.addEventListener('drop', handleDrop);


        editorContainer.querySelectorAll('.quick-use-color-picker').forEach(picker => {
            picker.addEventListener('input', (event) => {
                const id = parseInt(event.target.dataset.itemId);
                const newColor = event.target.value;
                 if (!isNaN(id) && newColor) {
                    itemColors[id] = newColor;
                 }
            });
            picker.addEventListener('change', (event) => {
                const id = parseInt(event.target.dataset.itemId);
                const newColor = event.target.value;
                if (!isNaN(id) && newColor) {
                    itemColors[id] = newColor;
                    try {
                        GM_setValue(ITEM_COLOR_STORAGE_KEY, JSON.stringify(itemColors));
                        updateQuickUsePanel(itemType);
                    } catch (e) {
                        console.error("Error saving item colors:", e);
                    }
                }
            });
        });
    }

    function saveQuickUseConfig(itemType) {
        let editorContainer, configStorageKey, globalConfigVar;

        if (itemType === ITEM_TYPES.MEDICAL) {
            editorContainer = settingsPanel?.querySelector('#medical-quick-use-editor'); configStorageKey = MEDICAL_QUICK_USE_CONFIG_STORAGE;
            globalConfigVar = 'medicalQuickUseConfig';
        } else if (itemType === ITEM_TYPES.DRUG) {
            editorContainer = settingsPanel?.querySelector('#drug-quick-use-editor'); configStorageKey = DRUG_QUICK_USE_CONFIG_STORAGE;
            globalConfigVar = 'drugQuickUseConfig';
        } else if (itemType === ITEM_TYPES.BOOSTER) {
            editorContainer = settingsPanel?.querySelector('#booster-quick-use-editor'); configStorageKey = BOOSTER_QUICK_USE_CONFIG_STORAGE;
            globalConfigVar = 'boosterQuickUseConfig';
        } else { return; }

        if (!editorContainer) {
            return;
        }

        const newConfig = [];
        const orderedIds = Array.from(editorContainer.querySelectorAll('.quick-use-selection-item')).map(el => parseInt(el.getAttribute('data-item-id')));

        orderedIds.forEach(id => {
             if (isNaN(id)) return;
             const itemElement = editorContainer.querySelector(`.quick-use-selection-item[data-item-id="${id}"]`);
             const checkbox = itemElement?.querySelector(`input[type="checkbox"][data-item-id="${id}"]`);
             if (checkbox && checkbox.checked) {
                 newConfig.push(id);
             }
        });

        if (globalConfigVar === 'medicalQuickUseConfig') medicalQuickUseConfig = newConfig;
        else if (globalConfigVar === 'drugQuickUseConfig') drugQuickUseConfig = newConfig;
        else if (globalConfigVar === 'boosterQuickUseConfig') boosterQuickUseConfig = newConfig;

        GM_setValue(configStorageKey, JSON.stringify(newConfig));
        updateQuickUsePanel(itemType);
    }

    function toggleMinimize() {
        isMinimized = !isMinimized;
        applyMinimizeState(true);
    }

    function applyMinimizeState(useTransition = true) {
        if (!uiContainer || !document.body.contains(uiContainer)) return;
        const toggleButton = uiContainer.querySelector('.unified-tracker-toggle-button');

        uiContainer.dataset.minimized = isMinimized.toString();
        if (toggleButton) {
            toggleButton.textContent = isMinimized ? '+' : '–';
            toggleButton.title = isMinimized ? 'Expand Tracker' : 'Minimize Tracker';
        }
        uiContainer.style.transition = useTransition ? 'padding 0.3s ease, max-height 0.3s ease, top 0.3s ease, left 0.3s ease' : '';

        localStorage.setItem(MINIMIZED_STATE_STORAGE, isMinimized.toString());
        updateSectionVisibility();
        adjustUIPosition();
    }

    function adjustUIPosition() {
        if (isDragging || !uiContainer || !document.body.contains(uiContainer)) return;

        const otherPanelSelectors = [
            '.tt-quick-items-container',
            '.quick-items-react-root',
        ];
        let highestBottom = 5;

        document.querySelectorAll(otherPanelSelectors.join(', ')).forEach(panel => {
            try {
                const style = window.getComputedStyle(panel);
                if (style.display !== 'none' && style.visibility !== 'hidden' && panel.offsetHeight > 0) {
                    const rect = panel.getBoundingClientRect();
                    if (rect.height > 0 && rect.bottom > 0) {
                        highestBottom = Math.max(highestBottom, rect.bottom);
                    }
                }
            } catch (e) { console.warn("Error checking other panel position:", e); }
        });

        const margin = 10;
        const targetTop = highestBottom + margin;
        const savedTop = GM_getValue(UI_POSITION_TOP_STORAGE, null);

        if (savedTop === null) {
            const targetTopPx = `${targetTop}px`;
            if (uiContainer.style.top !== targetTopPx) {
                 uiContainer.style.top = targetTopPx;
            }
        } else {
            if (uiContainer.style.top !== savedTop) {
                 uiContainer.style.top = savedTop;
            }
        }

        const savedLeft = GM_getValue(UI_POSITION_LEFT_STORAGE, null);
        if (savedLeft !== null && uiContainer.style.left !== savedLeft) {
            uiContainer.style.left = savedLeft;
        } else if (savedLeft === null) {
            uiContainer.style.left = 'calc(100vw - 240px)';
        }
    }

    function setupCooperativePositioning() {
        if (coopObserver) coopObserver.disconnect();

        setTimeout(adjustUIPosition, 500);

        const observerCallback = (mutations) => {
            let shouldAdjust = false;
            const relevantPanelSelectors = [
                '.tt-quick-items-container',
                '.quick-items-react-root',
            ];

            for (const mutation of mutations) {
                const targetIsRelevant = mutation.target.nodeType === 1 && relevantPanelSelectors.some(sel => mutation.target.matches(sel));
                const attributeChanged = mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class' || mutation.attributeName === 'data-minimized');

                if (targetIsRelevant && attributeChanged) {
                    shouldAdjust = true;
                    break;
                }

                if (mutation.type === 'childList') {
                    const checkNode = (node) => node.nodeType === 1 && relevantPanelSelectors.some(sel => node.matches(sel) || node.querySelector(sel));
                    const nodeAdded = Array.from(mutation.addedNodes).some(checkNode);
                    const nodeRemoved = Array.from(mutation.removedNodes).some(checkNode);
                    if (nodeAdded || nodeRemoved) {
                        shouldAdjust = true;
                        break;
                    }
                }
                else if (mutation.type === 'attributes' && mutation.target === document.body && mutation.attributeName === 'style') {
                     shouldAdjust = true;
                     break;
                }
            }

            if (shouldAdjust) {
                clearTimeout(coopAdjustTimeout);
                coopAdjustTimeout = setTimeout(adjustUIPosition, 150);
            }
        };

        coopObserver = new MutationObserver(observerCallback);
        try {
            coopObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'data-minimized']
            });
        } catch (e) {
            console.error("Failed to set up cooperative positioning observer:", e);
        }

        window.addEventListener('resize', () => {
            clearTimeout(coopAdjustTimeout);
            coopAdjustTimeout = setTimeout(adjustUIPosition, 150);
        });
        window.addEventListener('load', () => {
             setTimeout(adjustUIPosition, 500);
        });
    }

    function startDragTouch(e) {
        if (!uiContainer || isDragging) return;
        if (e.touches.length === 1) {
            isDragging = true;
            const touch = e.touches[0];
            const rect = uiContainer.getBoundingClientRect();
            dragOffsetX = touch.clientX - rect.left;
            dragOffsetY = touch.clientY - rect.top;

            document.addEventListener('touchmove', dragMoveTouch, { passive: false });
            document.addEventListener('touchend', stopDragTouch);
            document.addEventListener('touchcancel', stopDragTouch);
            e.preventDefault();
        }
    }

    function dragMoveTouch(e) {
        if (!isDragging || !uiContainer) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            let newLeft = touch.clientX - dragOffsetX;
            let newTop = touch.clientY - dragOffsetY;

            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - uiContainer.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - uiContainer.offsetHeight));

            uiContainer.style.left = `${newLeft}px`;
            uiContainer.style.top = `${newTop}px`;
            e.preventDefault();
        }
    }

    function stopDragTouch() {
        if (!isDragging || !uiContainer) return;
        isDragging = false;
        document.removeEventListener('touchmove', dragMoveTouch);
        document.removeEventListener('touchend', stopDragTouch);
        document.removeEventListener('touchcancel', stopDragTouch);

        GM_setValue(UI_POSITION_LEFT_STORAGE, uiContainer.style.left);
        GM_setValue(UI_POSITION_TOP_STORAGE, uiContainer.style.top);
    }

    function startDrag(e) {
        if (!uiContainer || e.button !== 0 || isDragging) return;
        isDragging = true;
        const rect = uiContainer.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    }

    function dragMove(e) {
        if (!isDragging || !uiContainer) return;
        let newLeft = e.clientX - dragOffsetX;
        let newTop = e.clientY - dragOffsetY;

        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - uiContainer.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - uiContainer.offsetHeight));

        uiContainer.style.left = `${newLeft}px`;
        uiContainer.style.top = `${newTop}px`;
    }

    function stopDrag() {
        if (!isDragging || !uiContainer) return;
        isDragging = false;
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', stopDrag);

        GM_setValue(UI_POSITION_LEFT_STORAGE, uiContainer.style.left);
        GM_setValue(UI_POSITION_TOP_STORAGE, uiContainer.style.top);
    }

    function checkBloodBagAlert() {
        if (!uiContainer || !document.body.contains(uiContainer) || !apiData.bars?.life) return;

        const lifePerc = apiData.bars.life.percentage ?? 100;
        const lifeBarCont = uiContainer.querySelector('#life-bar-cont');
        const medButtons = medicalQuickUseContainer?.querySelectorAll('.quick-use-button.type-medical');

        const lowLife = lifePerc < LOW_LIFE_THRESHOLD_PERCENT;

        if (lifeBarCont) lifeBarCont.classList.toggle('blood-bag-alert-active', lowLife);

        medButtons?.forEach(btn => {
            const itemId = parseInt(btn.dataset.itemId);
            const source = btn.dataset.itemSource;
            const hasItem = itemCounts[source]?.[itemId] > 0;
            btn.classList.toggle('blood-bag-alert', lowLife && hasItem);
        });
    }

    function checkEmptyBloodBagAlert() {
        if (!isApiDataReady) { return; }

        const alertId = 'emptyBBAlert';
        const storedState = activeAlertStates[alertId];

        if (!notifyEmptyBloodBag) {
            const existingAlert = document.querySelector(`#unified-tracker-alerts-container .unified-tracker-interactive-alert[data-notification-id="${alertId}"]`);
            if (existingAlert) existingAlert.remove();
            if (storedState) updateAlertState(alertId, false);
            return;
        }

        if (!apiData.bars?.life || !apiData.cooldowns || typeof maxMedicalCooldown !== 'number') {
            return;
        }

        const lifeCurrent = apiData.bars.life.current || 0;
        const lifeMax = apiData.bars.life.maximum || 1;
        const lifePercentage = (lifeCurrent / lifeMax) * 100;
        const now = Date.now();
        const currentMedicalCooldown = apiData.cooldowns.medicalEnd > now ? Math.round((apiData.cooldowns.medicalEnd - now) / 1000) : 0;
        const availableMedicalCooldown = maxMedicalCooldown - currentMedicalCooldown;
        const emptyBloodBagCount = itemCounts[medicalSource]?.[731] || 0;

        const canUseEmptyBB = availableMedicalCooldown >= EMPTY_BB_MED_CD_NEEDED &&
                              lifePercentage > EMPTY_BB_LIFE_THRESHOLD &&
                              emptyBloodBagCount > 0;

        if (canUseEmptyBB) {
            let shouldShowAlert = false;
            if (!storedState || storedState.triggeredAt !== EBB_ACTIVE_MARKER) {
                updateAlertState(alertId, true, EBB_ACTIVE_MARKER, 0, null);
                shouldShowAlert = true;
            } else {
                 const dismissCount = storedState.dismissCount || 0;
                 const dismissedAt = storedState.dismissedAt || 0;
                 if (dismissCount === 0) {
                     shouldShowAlert = true;
                 } else if (dismissCount === 1) {
                     const timeSinceDismissal = now - dismissedAt;
                     if (timeSinceDismissal >= FIVE_MINUTES_MS) {
                         shouldShowAlert = true;
                     } else {
                     }
                 } else {
                 }
            }

            if (shouldShowAlert) {
                const existingDom = document.querySelector(`#unified-tracker-alerts-container .unified-tracker-interactive-alert[data-notification-id="${alertId}"]`);
                 if (!existingDom) {
                     showInteractiveNotification(
                         "Empty Blood Bag is usable!",
                         "info",
                         "https://www.torn.com/item.php#medical",
                         alertId,
                         false,
                         EBB_ACTIVE_MARKER
                     );
                 }
            } else {
                 const existingDom = document.querySelector(`#unified-tracker-alerts-container .unified-tracker-interactive-alert[data-notification-id="${alertId}"]`);
                 if (existingDom) existingDom.remove();
            }
        } else {
            if (storedState) {
                const existingAlert = document.querySelector(`#unified-tracker-alerts-container .unified-tracker-interactive-alert[data-notification-id="${alertId}"]`);
                if (existingAlert) existingAlert.remove();
                updateAlertState(alertId, false);
            }
        }
    }

    function runDelayedScanAndBuild() {
        const isItemsPage = window.location.href.includes('item.php');
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');

        const relevantSources = new Set();
        if (isItemsPage) relevantSources.add('personal');
        if (isFactionArmouryPage) relevantSources.add('faction');

        if (relevantSources.has(medicalSource)) fetchInitialItemCounts(medicalSource);
        if (relevantSources.has(drugSource)) fetchInitialItemCounts(drugSource);
        if (relevantSources.has(boosterSource)) fetchInitialItemCounts(boosterSource);

        if (relevantSources.has(medicalSource)) updateQuickUsePanel(ITEM_TYPES.MEDICAL);
        if (relevantSources.has(drugSource)) updateQuickUsePanel(ITEM_TYPES.DRUG);
        if (relevantSources.has(boosterSource)) updateQuickUsePanel(ITEM_TYPES.BOOSTER);

        adjustUIPosition();
    }

    function handleTabClick(event) {
        if (event.target.closest('.unified-tracker-container, #unified-tracker-tooltip, #unified-tracker-alerts-container, .unified-tracker-temp-feedback, .unified-settings-panel')) {
            return;
        }

        const itemTabLink = event.target.closest('div[class*="items-cont"] ul[role="tablist"] a[href^="#"]');
        const factionArmourySubTabLink = event.target.closest('#faction-armoury-tabs a[href^="#armoury-"]');
        const mainFactionArmoryTabLink = event.target.closest('.ui-tabs-nav a[href="#faction-armoury"]');

        let isRelevantTabClick = false;
        if (itemTabLink) { isRelevantTabClick = true; }
        else if (factionArmourySubTabLink || mainFactionArmoryTabLink) { isRelevantTabClick = true; }

        if (isRelevantTabClick) {
            clearTimeout(tabScanTimeout);
            tabScanTimeout = setTimeout(runDelayedScanAndBuild, TAB_SCAN_DELAY);
        }
    }

    function checkForPendingActions() {
        const isItemsPage = window.location.href.includes('item.php');
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');

        try {
            const pendingFacUse = getAndClearPendingFactionUse();
            if (pendingFacUse && pendingFacUse.id && pendingFacUse.name) {
                if (isFactionArmouryPage) {
                    let itemSource = DEFAULT_SOURCE;
                    const itemData = ALL_ITEMS.find(i => i.id === pendingFacUse.id);
                    if(itemData) {
                        if (itemData.type === ITEM_TYPES.MEDICAL) itemSource = medicalSource;
                        else if (itemData.type === ITEM_TYPES.DRUG) itemSource = drugSource;
                        else if (itemData.type === ITEM_TYPES.BOOSTER) itemSource = boosterSource;
                    }

                    if (itemSource === 'faction') {
                        setTimeout(() => {
                            showTemporaryFeedback(`Attempting pending use of ${pendingFacUse.name} from faction...`, 'info');
                            useItem(pendingFacUse.id, pendingFacUse.name, itemData?.type || 'unknown', 'faction');
                        }, 1500);
                    } else {
                        updateItemCountDisplay(pendingFacUse.id, pendingFacUse.originalCount, 'faction');
                    }
                } else {
                     updateItemCountDisplay(pendingFacUse.id, pendingFacUse.originalCount, 'faction');
                }
            }

            const pendingPersUse = getAndClearPendingPersonalUse();
            if (pendingPersUse && pendingPersUse.id && pendingPersUse.name) {
                if (isItemsPage) {
                    let itemSource = DEFAULT_SOURCE;
                    const itemData = ALL_ITEMS.find(i => i.id === pendingPersUse.id);
                     if(itemData) {
                        if (itemData.type === ITEM_TYPES.MEDICAL) itemSource = medicalSource;
                        else if (itemData.type === ITEM_TYPES.DRUG) itemSource = drugSource;
                        else if (itemData.type === ITEM_TYPES.BOOSTER) itemSource = boosterSource;
                    }

                    if (itemSource === 'personal') {
                        setTimeout(() => {
                            showTemporaryFeedback(`Attempting pending use of ${pendingPersUse.name} from personal inventory...`, 'info');
                            useItem(pendingPersUse.id, pendingPersUse.name, itemData?.type || 'unknown', 'personal');
                        }, 1500);
                    } else {
                        updateItemCountDisplay(pendingPersUse.id, pendingPersUse.originalCount, 'personal');
                    }
                } else {
                    updateItemCountDisplay(pendingPersUse.id, pendingPersUse.originalCount, 'personal');
                }
            }
        } catch (e) {
            console.error("Error checking for pending actions:", e);
            GM_deleteValue(PENDING_FACTION_ITEM_USE_STORAGE);
            GM_deleteValue(PENDING_PERSONAL_ITEM_USE_STORAGE);
        }

        ALL_ITEM_IDS.forEach(id => {
            isItemUseInProgress(id, 'personal');
            isItemUseInProgress(id, 'faction');
        });
    }

    function updateSectionVisibility() {
        if (!uiContainer) return;
        const isItemsPage = window.location.href.includes('item.php');
        const isFactionArmouryPage = window.location.href.includes('factions.php') && window.location.href.includes('#/tab=armoury');

        const showQuickUse = isItemsPage || isFactionArmouryPage;
        const displayStyle = showQuickUse && !isMinimized ? '' : 'none';

        uiContainer.querySelectorAll('.quick-use-section-element').forEach(el => {
            el.style.display = displayStyle;
        });

        if (showQuickUse && !isMinimized) {
           updateQuickUsePanel(ITEM_TYPES.MEDICAL);
           updateQuickUsePanel(ITEM_TYPES.DRUG);
           updateQuickUsePanel(ITEM_TYPES.BOOSTER);
        }
    }

    function initialize() {
        if (isInitialized) { return; }

        const SCRIPT_ID = typeof GM_info !== 'undefined' ? GM_info.script.uuid : 'TornUnifiedTracker';
        const SCRIPT_V = typeof GM_info !== 'undefined' ? GM_info.script.version : '?.?.?';
        console.log(`Initializing ${SCRIPT_ID} v${SCRIPT_V}`);

        try {
            apiKey = GM_getValue(API_KEY_STORAGE, null);
            isMinimized = localStorage.getItem(MINIMIZED_STATE_STORAGE) === 'true';
            medicalSource = GM_getValue(MEDICAL_SOURCE_STORAGE, DEFAULT_SOURCE);
            drugSource = GM_getValue(DRUG_SOURCE_STORAGE, DEFAULT_SOURCE);
            boosterSource = GM_getValue(BOOSTER_SOURCE_STORAGE, DEFAULT_SOURCE);
            pointsRefillSource = GM_getValue(POINTS_REFILL_SOURCE_STORAGE, DEFAULT_POINTS_REFILL_SOURCE);
            itemCounts.personal = loadCountsFromLocalStorage('personal');
            itemCounts.faction = loadCountsFromLocalStorage('faction');
            try { itemColors = JSON.parse(GM_getValue(ITEM_COLOR_STORAGE_KEY, '{}')); } catch (e) { itemColors = {}; GM_setValue(ITEM_COLOR_STORAGE_KEY, '{}'); console.warn("Resetting item colors due to parse error:", e); }
            maxMedicalCooldown = GM_getValue(MAX_MED_CD_STORAGE, DEFAULT_MAX_MED_CD_HOURS * 3600);
            maxBoosterCooldown = GM_getValue(MAX_BOOSTER_CD_STORAGE, DEFAULT_MAX_BOOSTER_CD_HOURS * 3600);
            notifyEmptyBloodBag = GM_getValue(EMPTY_BB_ALERT_STORAGE, DEFAULT_NOTIFY_EMPTY_BB);
            notificationsEnabled = GM_getValue(NOTIFICATIONS_ENABLED_STORAGE, DEFAULT_NOTIFICATIONS_ENABLED);
            notifyDrugCD = GM_getValue(NOTIFY_DRUG_CD_STORAGE, DEFAULT_NOTIFY_DRUG_CD);
            notifyBoosterCD = GM_getValue(NOTIFY_BOOSTER_CD_STORAGE, DEFAULT_NOTIFY_BOOSTER_CD);
            notifyMedicalCD = GM_getValue(NOTIFY_MEDICAL_CD_STORAGE, DEFAULT_NOTIFY_MEDICAL_CD);
            try { activeAlertStates = JSON.parse(GM_getValue(ACTIVE_ALERTS_STORAGE, '{}')); }
            catch (e) { activeAlertStates = {}; GM_setValue(ACTIVE_ALERTS_STORAGE, '{}'); console.warn("Resetting active alerts due to parse error:", e); }

            buildUI();

            Object.keys(activeAlertStates).forEach(alertId => {
                const storedState = activeAlertStates[alertId];
                if (storedState && typeof storedState.triggeredAt === 'number') {
                    let message = "Alert Restored", navUrl = null, type = 'info', settingEnabled = false;

                    if (alertId === 'emptyBBAlert') {
                        message = "Empty Blood Bag is usable!"; navUrl = "https://www.torn.com/item.php#medical"; settingEnabled = notifyEmptyBloodBag;
                    } else if (alertId === 'drugCDAlert') {
                        message = "Drug cooldown finished!"; navUrl = "https://www.torn.com/item.php#drugs"; settingEnabled = notifyDrugCD;
                    } else if (alertId === 'boosterCDAlert') {
                        message = "Booster cooldown finished!"; navUrl = "https://www.torn.com/item.php#boosters"; settingEnabled = notifyBoosterCD;
                    } else if (alertId === 'medicalCDAlert') {
                        message = "Medical cooldown finished!"; navUrl = "https://www.torn.com/item.php#medical"; settingEnabled = notifyMedicalCD;
                    } else {
                        return;
                    }

                    if (!settingEnabled) {
                        updateAlertState(alertId, false);
                        return;
                    }

                    const dismissCount = storedState.dismissCount || 0;
                    const dismissedAt = storedState.dismissedAt || 0;
                    const now = Date.now();
                    let shouldRestoreNotification = false;

                    if (dismissCount === 0) {
                        shouldRestoreNotification = true;
                    } else if (dismissCount === 1) {
                        const timeSinceDismissal = now - dismissedAt;
                        if (timeSinceDismissal >= FIVE_MINUTES_MS) {
                            shouldRestoreNotification = true;
                        } else {
                        }
                    } else {
                    }

                    if (shouldRestoreNotification) {
                        showInteractiveNotification(message, type, navUrl, alertId, true, storedState.triggeredAt);
                    }
                } else if (storedState) {
                    updateAlertState(alertId, false);
                }
            });

            startApiProcessing();
            if (displayUpdateTimer) clearInterval(displayUpdateTimer);
            displayUpdateTimer = setInterval(updateTimerDisplays, DISPLAY_UPDATE_INTERVAL);
            clearTimeout(itemScanTimer);
            itemScanTimer = setTimeout(() => {
                fetchInitialItemCounts(medicalSource);
                fetchInitialItemCounts(drugSource);
                fetchInitialItemCounts(boosterSource);
            }, ITEM_SCAN_DELAY);

            document.body.addEventListener('click', handleTabClick, true);

            checkForPendingActions();
            adjustTitleFontSize();

            isInitialized = true;
        } catch (error) {
            console.error("Unified Tracker failed to initialize:", error);
            showTemporaryFeedback("Unified Tracker failed to initialize. Check console (F12).", "error", 15000);
            isInitialized = false;
        }
    }

    function runInitialization() {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            if (!isInitialized) {
                initialize();
            }
        } else {
             window.addEventListener('DOMContentLoaded', () => {
                 if (!isInitialized) {
                     initialize();
                 }
             });
        }
    }

    setTimeout(runInitialization, 500);

})();
