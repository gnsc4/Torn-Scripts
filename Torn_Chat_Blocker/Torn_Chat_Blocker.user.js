// ==UserScript==
// @name         Torn Chat Blocker
// @namespace    Torn-Chat-Blocker
// @version      1.0.34
// @description  Block users in Torn Chat 3.0: Removes recent chats, windows, buttons. Hides messages. Provides integrated UI.
// @author       GNSC4 [268863]
// @match        https://www.torn.com/*
// @updateURL    https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn_Chat_Blocker/Torn_Chat_Blocker.user.js
// @downloadURL  https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn_Chat_Blocker/Torn_Chat_Blocker.user.js
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration & Constants ---
    const BLOCKED_USERS_KEY = 'tornChatBlockedUsers_v1';
    const MAX_USER_ID_LENGTH = 10; // Basic validation for User ID length
    const DEBUG_MODE = false; // Set to false for normal use
    const HIDDEN_CLASS = 'torn-blocker-hidden-layout'; // CSS class for aggressive hiding
    const INITIAL_SCAN_DELAY = 100; // Delay in ms before running the first block scan

    // --- Selectors ---
    // Blocking Targets
    const CHAT_MESSAGE_SELECTOR = '.root___NVIc9'; // Container for a single or grouped message(s)
    const SENDER_LINK_SELECTOR = 'a.sender___Ziikt[href*="XID="]'; // Link containing the sender's XID (within messages)
    const RECENT_CHAT_LIST_SELECTOR = '#private-channel-list'; // Container for recent private chats list
    const RECENT_CHAT_ITEM_SELECTOR = 'button.root___mnDAj[id*="private_chat_card_private-"]'; // Individual recent chat list item
    const RECENT_CHAT_LINK_SELECTOR = 'a[href*="XID="]'; // Link within recent chat item containing XID
    const RECENT_CHAT_NOTIFICATION_BADGE_SELECTOR = '.messageCount___nKic1'; // Notification badge on recent chat item
    const CHAT_WINDOW_SELECTOR = 'div.root___FmdS_[id^="private-"]'; // Main container div for an open private chat window
    const CHAT_BUTTON_SELECTOR = 'button.root___WHFbh[id^="channel_panel_button:private-"]'; // Button in the bottom row for an open private chat
    const CHAT_BUTTON_PARENT_SELECTOR = 'div.root___cYD0i'; // Parent container of chat button

    // UI Injection Targets / Triggers
    const CHAT_ICON_CONTAINER_SELECTOR = '.root___oWxEV'; // Container for the bottom chat icons
    const SETTINGS_BUTTON_SELECTOR = '#notes_settings_button'; // Use settings button as insertion anchor
    const PEOPLE_PANEL_SELECTOR = '#people_panel'; // The entire people panel element
    const PEOPLE_PANEL_BUTTON_SELECTOR = '#people_panel_button'; // Button that opens the recent chats panel
    const BLOCKER_BUTTON_ID = 'torn-blocker-button'; // ID for our manage button
    const BLOCKER_ADD_BUTTON_ID = 'torn-blocker-add-button'; // ID for the add button in panel
    const BLOCKER_REMOVE_BUTTON_CLASS = 'torn-blocker-remove-button'; // Class for remove buttons in panel

    let blockedUserIds = [];
    let blockerButtonListenerAttached = false; // Flag for blocker button listener
    let peopleButtonListenerAttached = false; // Flag for people button listener

    // --- Helper Function for Logging ---
    function logDebug(message, ...optionalParams) {
        if (DEBUG_MODE) {
            console.log(`Torn Chat Blocker DEBUG: ${message}`, ...optionalParams);
        }
    }

    // --- Storage Functions ---
    /**
     * Loads the list of blocked user IDs from storage.
     */
    function loadBlockedUsers() {
        try {
            const storedData = GM_getValue(BLOCKED_USERS_KEY, '[]');
            blockedUserIds = JSON.parse(storedData);
            if (!Array.isArray(blockedUserIds)) {
                console.warn('Torn Chat Blocker: Invalid data found in storage. Resetting block list.');
                blockedUserIds = [];
                saveBlockedUsers(); // Clear invalid data
            }
            console.log('Torn Chat Blocker: Loaded blocked users:', blockedUserIds);
        } catch (e) {
            console.error('Torn Chat Blocker: Error loading blocked users from storage.', e);
            blockedUserIds = [];
        }
    }

    /**
     * Saves the current list of blocked user IDs to storage.
     */
    function saveBlockedUsers() {
        try {
            GM_setValue(BLOCKED_USERS_KEY, JSON.stringify(blockedUserIds));
            logDebug('Saved blocked users:', blockedUserIds);
        } catch (e) {
            console.error('Torn Chat Blocker: Error saving blocked users to storage.', e);
        }
    }

    /**
     * Adds a user ID to the block list if it's valid and not already present.
     * @param {string} userId - The user ID to block.
     * @returns {boolean} - True if the user was added, false otherwise.
     */
    function addBlockedUser(userId) {
        if (!userId || typeof userId !== 'string' || !/^\d+$/.test(userId) || userId.length > MAX_USER_ID_LENGTH) {
            alert('Invalid User ID. Please enter numbers only.');
            return false;
        }
        if (!blockedUserIds.includes(userId)) {
            blockedUserIds.push(userId);
            saveBlockedUsers();
            console.log(`Torn Chat Blocker: Added user ${userId} to block list.`);
            logDebug(">>> Calling applyBlockingToAllWindows after adding user <<<");
            try {
                 applyBlockingToAllWindows(); // Re-apply blocking to all visible elements
            } catch(e) {
                 console.error("Error in applyBlockingToAllWindows after add:", e);
            }
             logDebug("<<< Finished applyBlockingToAllWindows call after adding user >>>");
            updateBlockListUI(); // Update the management UI list
            return true;
        }
        alert(`User ID ${userId} is already blocked.`);
        return false;
    }

    /**
     * Removes a user ID from the block list.
     * @param {string} userId - The user ID to unblock.
     */
    function removeBlockedUser(userId) {
        const index = blockedUserIds.indexOf(userId);
        if (index > -1) {
            blockedUserIds.splice(index, 1);
            saveBlockedUsers();
            console.log(`Torn Chat Blocker: Removed user ${userId} from block list.`);
            unhideBlockedElements(userId); // Make previously hidden elements visible again
            updateBlockListUI(); // Update the management UI list
            // Re-apply blocking in case other elements should now be shown
            logDebug(">>> Calling applyBlockingToAllWindows after removing user <<<");
             try {
                applyBlockingToAllWindows(); // Force immediate rescan after unblocking
             } catch(e) {
                 console.error("Error in applyBlockingToAllWindows after remove:", e);
             }
            logDebug("<<< Finished applyBlockingToAllWindows call after removing user >>>");
        }
    }

    /**
     * Checks if a user ID is in the block list.
     * @param {string} userId - The user ID to check.
     * @returns {boolean} - True if the user is blocked, false otherwise.
     */
    function isBlocked(userId) {
        const result = userId && blockedUserIds.includes(userId.toString());
        // Only log if debugging, to reduce noise
        if (DEBUG_MODE && userId) logDebug(`[isBlocked] Checking user ${userId}. Blocked: ${result}. Current list:`, blockedUserIds);
        return result;
    }

    // --- UI Management ---
    let blockListContainer = null; // To hold the list of blocked users in the UI
    let blockPanel = null; // Reference to the panel element
    let uiContainer = null; // Reference to the main UI container (button + panel)

    /**
     * Creates and injects the Block List management UI into the chat icon row.
     * Attaches listeners for internal panel elements only.
     */
    function createBlockUI() {
        if (document.getElementById('torn-blocker-ui-container')) return;

        const chatIconContainer = document.querySelector(CHAT_ICON_CONTAINER_SELECTOR);
        if (!chatIconContainer) {
             logDebug('Could not find chat icon container. Retrying later.');
             setTimeout(createBlockUI, 1000); return;
        }
        const settingsButton = chatIconContainer.querySelector(SETTINGS_BUTTON_SELECTOR);
        if (!settingsButton) {
             logDebug('Could not find settings button to anchor UI. Retrying later.');
             setTimeout(createBlockUI, 1000); return;
        }

        uiContainer = document.createElement('div');
        uiContainer.id = 'torn-blocker-ui-container';
        uiContainer.style.position = 'relative';

        const button = document.createElement('button');
        button.id = BLOCKER_BUTTON_ID; // Use constant
        button.type = 'button';
        button.className = 'root___WHFbh root___J_YsG';
        button.title = 'Manage Block List';

        const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgIcon.setAttribute('viewBox', '0 0 24 24'); svgIcon.setAttribute('width', '24'); svgIcon.setAttribute('height', '24');
        svgIcon.classList.add('root___DYylw', 'icon___M_Izz');
        svgIcon.innerHTML = `<defs><linearGradient id="icon_gradient_blocker_default" x1="0.5" x2="0.5" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#bababa"></stop><stop offset="1" stop-color="#8a8a8a"></stop></linearGradient></defs><g fill="url(#icon_gradient_blocker_default)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13H7v-2h10v2z"/></g>`;
        button.appendChild(svgIcon);

        blockPanel = document.createElement('div');
        blockPanel.id = 'torn-blocker-panel';
        blockPanel.style.display = 'none';

        const inputLabel = document.createElement('label'); inputLabel.textContent = 'User ID to Block: ';
        const input = document.createElement('input'); input.id = 'torn-blocker-input'; input.type = 'text'; input.placeholder = 'Enter User ID';
        const addButton = document.createElement('button'); addButton.id = BLOCKER_ADD_BUTTON_ID; addButton.textContent = 'Add'; addButton.className = 'torn-btn torn-btn-green';
        blockListContainer = document.createElement('ul'); blockListContainer.id = 'torn-blocker-list';

        // Add keypress listener directly to input
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addButton.click(); });

        // Add button listener directly
         addButton.addEventListener('click', () => {
            logDebug("Add button clicked (direct).");
            const userIdToAdd = input.value.trim();
            if (addBlockedUser(userIdToAdd)) input.value = '';
        });

        blockPanel.appendChild(inputLabel); blockPanel.appendChild(input); blockPanel.appendChild(addButton); blockPanel.appendChild(blockListContainer);
        uiContainer.appendChild(button); uiContainer.appendChild(blockPanel);

        chatIconContainer.insertBefore(uiContainer, settingsButton);
        console.log('Torn Chat Blocker: UI Injected into chat icon row.');
        // Listener for main button (#torn-blocker-button) attached in attachDynamicListeners
    }

    /**
     * Updates the list of blocked users displayed in the UI panel.
     * Attaches direct click listeners to remove buttons here.
     */
    function updateBlockListUI() {
        if (!blockListContainer || !blockPanel || blockPanel.style.display === 'none') {
             logDebug("[updateBlockListUI] Panel/container not ready or hidden, skipping update.");
             return;
        }
        logDebug("[updateBlockListUI] Updating list display.");
        blockListContainer.innerHTML = '';

        if (blockedUserIds.length === 0) {
            const emptyMsg = document.createElement('li'); emptyMsg.textContent = 'No users blocked.'; emptyMsg.style.color = '#888';
            blockListContainer.appendChild(emptyMsg);
            logDebug("[updateBlockListUI] Displayed 'No users blocked'."); return;
        }

        blockedUserIds.forEach(userId => {
            const listItem = document.createElement('li'); listItem.className = 'torn-blocker-list-item';
            const userIdSpan = document.createElement('span'); userIdSpan.textContent = userId;
            const removeButton = document.createElement('button'); removeButton.textContent = 'Remove';
            removeButton.className = `torn-btn torn-btn-red torn-btn-small ${BLOCKER_REMOVE_BUTTON_CLASS}`; // Use constant class
            removeButton.dataset.userId = userId;
            // Add DIRECT click listener to each remove button
            removeButton.addEventListener('click', (e) => {
                logDebug("Remove button clicked (direct).");
                const idToRemove = e.currentTarget.dataset.userId;
                if (idToRemove) removeBlockedUser(idToRemove);
            });
            listItem.appendChild(userIdSpan); listItem.appendChild(removeButton);
            blockListContainer.appendChild(listItem);
        });
         logDebug(`[updateBlockListUI] Displayed ${blockedUserIds.length} blocked users.`);
    }


    // --- Blocking Logic ---

    /**
     * Extracts the User ID from a chat message element's sender link.
     */
    function getUserIdFromChatMessage(messageElement) {
        if (messageElement.style.display === 'none' && messageElement.dataset.blockedByScript) return null;
        const senderLink = messageElement.querySelector(SENDER_LINK_SELECTOR);
        if (senderLink?.href) {
             const match = senderLink.href.match(/XID=(\d+)/);
             if (match && match[1]) return match[1];
        }
        return null;
    }

    /**
     * Extracts BOTH User IDs from a private chat window element's ID.
     */
    function getIdPairFromChatWindow(windowElement) {
        logDebug("[getIdPairFromChatWindow] Processing element:", windowElement);
        if (windowElement?.id) {
            const match = windowElement.id.match(/^private-(\d+)-(\d+)$/);
            if (match && match[1] && match[2]) return [match[1], match[2]];
        }
        logDebug("[getIdPairFromChatWindow] Could not extract ID pair from window ID.");
        return null;
    }

    /**
     * Extracts BOTH User IDs from a chat button element's ID.
     */
    function getIdPairFromChatButton(buttonElement) {
        logDebug("[getIdPairFromChatButton] Processing element:", buttonElement);
        if (buttonElement?.id) {
            const match = buttonElement.id.match(/^channel_panel_button:private-(\d+)-(\d+)$/);
            if (match && match[1] && match[2]) return [match[1], match[2]];
        }
        logDebug("[getIdPairFromChatButton] Could not extract ID pair from button ID.");
        return null;
    }


    /**
     * Extracts BOTH User IDs from a recent chat list item element.
     */
    function getIdPairFromRecentChat(recentChatElement) {
        logDebug("[getIdPairFromRecentChat] Processing element:", recentChatElement);
        // Check if already hidden by class or style
        if (recentChatElement?.classList.contains(HIDDEN_CLASS) || recentChatElement?.style.display === 'none') return null;

        if (recentChatElement?.id) {
            const idMatch = recentChatElement.id.match(/private_chat_card_private-(\d+)-(\d+)/);
            if (idMatch && idMatch[1] && idMatch[2]) return [idMatch[1], idMatch[2]];
        }
        logDebug("[getIdPairFromRecentChat] Could not extract ID pair from element ID.");
        return null;
    }

    /**
     * Hides an element using CSS class and marks it.
     * Prefers hiding parent container for chat buttons.
     */
    function hideElementCSS(element, blockedUserId) { // Renamed second arg
        let elementToHide = element;
        // Target parent for chat buttons
        if (element?.matches(CHAT_BUTTON_SELECTOR)) {
             const parentContainer = element.closest(CHAT_BUTTON_PARENT_SELECTOR);
             if (parentContainer) elementToHide = parentContainer;
        }

        if (elementToHide && !elementToHide.classList.contains(HIDDEN_CLASS)) {
            logDebug(`[hideElementCSS] Hiding element for user ${blockedUserId} using CSS class:`, elementToHide);
            elementToHide.classList.add(HIDDEN_CLASS);
            // Store marker on original element for unhiding checks
            element.dataset.blockedByScript = blockedUserId;
            // Also mark parent if different
             if (elementToHide !== element) elementToHide.dataset.blockedByScript = blockedUserId;
        } else if (DEBUG_MODE && elementToHide) {
             logDebug(`[hideElementCSS] Element for user ${blockedUserId} already hidden or invalid.`);
        }
    }

     /**
     * Unhides an element by removing CSS class and marker.
     * Handles chat button parent containers.
     */
    function unhideElementCSS(element) {
        let elementToUnhide = element;
        let markerElement = element; // Element where marker is stored

         if (element?.matches(CHAT_BUTTON_SELECTOR)) {
             const parentContainer = element.closest(CHAT_BUTTON_PARENT_SELECTOR);
             // Check if parent has the class before assigning
             if (parentContainer?.classList.contains(HIDDEN_CLASS)) {
                 elementToUnhide = parentContainer;
             }
             // Marker is always on the button itself
             markerElement = element;
        } else if (element?.matches(RECENT_CHAT_ITEM_SELECTOR) || element?.matches(CHAT_WINDOW_SELECTOR)) {
             elementToUnhide = element; // For these, the element itself gets the class
             markerElement = element;
        } else {
            // If it's some other element type passed unexpectedly, do nothing
            return;
        }


        if (elementToUnhide?.classList.contains(HIDDEN_CLASS)) {
             logDebug(`[unhideElementCSS] Unhiding element by removing class:`, elementToUnhide);
             elementToUnhide.classList.remove(HIDDEN_CLASS);
        }
        if (markerElement?.dataset.blockedByScript) {
             logDebug(`[unhideElementCSS] Removing marker from:`, markerElement);
             delete markerElement.dataset.blockedByScript;
        }
         // Remove marker from parent if it was hidden and marked
         if (elementToUnhide !== markerElement && elementToUnhide?.dataset.blockedByScript) {
             logDebug(`[unhideElementCSS] Removing marker from parent:`, elementToUnhide);
             delete elementToUnhide.dataset.blockedByScript;
         }

        // Special handling for recent chat badges
        if (element?.matches(RECENT_CHAT_ITEM_SELECTOR)) {
            const badge = element.querySelector(RECENT_CHAT_NOTIFICATION_BADGE_SELECTOR);
            if (badge) badge.style.display = ''; // Ensure badge is visible
        }
    }


    /**
     * Processes a chat message element. Hides using display:none.
     */
    function processChatMessage(messageElement) {
        if (!messageElement || typeof messageElement.querySelector !== 'function') return;
        if (messageElement.style.display === 'none' && messageElement.dataset.blockedByScript) return; // Already hidden

        const userId = getUserIdFromChatMessage(messageElement);
        if (userId) {
            if (isBlocked(userId)) {
                 logDebug(`[Process Chat Message] Hiding message from blocked user ${userId}.`);
                 messageElement.style.display = 'none';
                 messageElement.dataset.blockedByScript = userId;
            } else if (messageElement.dataset.blockedByScript) {
                 logDebug(`[Process Chat Message] Unhiding message previously blocked by ${messageElement.dataset.blockedByScript}.`);
                 messageElement.style.display = '';
                 delete messageElement.dataset.blockedByScript;
            }
        } else if (messageElement.dataset.blockedByScript) {
             logDebug(`[Process Chat Message] Unhiding message previously blocked by ${messageElement.dataset.blockedByScript} (could not re-verify ID).`);
             messageElement.style.display = '';
             delete messageElement.dataset.blockedByScript;
        }
    }

     /**
     * Processes an open chat window element. Hides using CSS class if EITHER user is blocked.
     */
    function processChatWindow(windowElement) {
        logDebug("[Process Chat Window] Checking element:", windowElement);
        if (!windowElement) return;

        const idPair = getIdPairFromChatWindow(windowElement);
        const currentlyHidden = windowElement.classList.contains(HIDDEN_CLASS);
        const blockedMarker = windowElement.dataset.blockedByScript;

        if (idPair) {
            const [id1, id2] = idPair;
            const shouldBeBlocked = isBlocked(id1) || isBlocked(id2);
            const blockingId = shouldBeBlocked ? (isBlocked(id1) ? id1 : id2) : null;

            if (shouldBeBlocked && !currentlyHidden) {
                hideElementCSS(windowElement, blockingId);
            } else if (!shouldBeBlocked && currentlyHidden) {
                unhideElementCSS(windowElement);
            } else if (shouldBeBlocked && currentlyHidden && blockedMarker !== blockingId) {
                 // Update marker if blocking reason changes
                 windowElement.dataset.blockedByScript = blockingId;
            }
        } else if (currentlyHidden) {
             unhideElementCSS(windowElement); // Unhide if ID cannot be verified
        }
    }

    /**
     * Processes a chat button element in the bottom row. Hides parent div using CSS class if EITHER user is blocked.
     */
    function processChatButton(buttonElement) {
        logDebug("[Process Chat Button] Checking element:", buttonElement);
        const parentDiv = buttonElement?.closest(CHAT_BUTTON_PARENT_SELECTOR);
        if (!buttonElement || !parentDiv) return;

        const idPair = getIdPairFromChatButton(buttonElement);
        // Check based on parent's class, marker is on button
        const currentlyHidden = parentDiv.classList.contains(HIDDEN_CLASS);
        const blockedMarker = buttonElement.dataset.blockedByScript;

        if (idPair) {
             const [id1, id2] = idPair;
             const shouldBeBlocked = isBlocked(id1) || isBlocked(id2);
             const blockingId = shouldBeBlocked ? (isBlocked(id1) ? id1 : id2) : null;

             if (shouldBeBlocked && !currentlyHidden) {
                 hideElementCSS(buttonElement, blockingId); // Hides parent div
             } else if (!shouldBeBlocked && currentlyHidden) {
                 unhideElementCSS(buttonElement); // Unhides parent div
             } else if (shouldBeBlocked && currentlyHidden && blockedMarker !== blockingId) {
                 buttonElement.dataset.blockedByScript = blockingId; // Update marker
             }
        } else if (currentlyHidden) {
             unhideElementCSS(buttonElement); // Unhide if ID cannot be verified
        }
    }


    /**
     * Processes a recent chat item element. Hides using CSS class if EITHER user is blocked.
     */
    function processRecentChat(recentChatElement) {
        logDebug("[Process Recent Chat] Checking element:", recentChatElement);
        if (!recentChatElement || typeof recentChatElement.querySelector !== 'function') return;

        const idPair = getIdPairFromRecentChat(recentChatElement);
        const badge = recentChatElement.querySelector(RECENT_CHAT_NOTIFICATION_BADGE_SELECTOR);
        const currentlyHidden = recentChatElement.classList.contains(HIDDEN_CLASS);
        const blockedMarker = recentChatElement.dataset.blockedByScript;

        if (idPair) {
            const [id1, id2] = idPair;
            const shouldBeBlocked = isBlocked(id1) || isBlocked(id2);
            const blockingId = shouldBeBlocked ? (isBlocked(id1) ? id1 : id2) : null;

            if (shouldBeBlocked && !currentlyHidden) {
                logDebug(`[Process Recent Chat] User ${blockingId} IS blocked. Hiding recent chat item with CSS class.`);
                if (badge) badge.style.display = 'none'; // Hide badge directly first
                hideElementCSS(recentChatElement, blockingId);
            } else if (!shouldBeBlocked && currentlyHidden) {
                 logDebug(`[Process Recent Chat] Unhiding previously blocked recent chat item (Users ${id1}, ${id2} no longer blocked).`);
                 unhideElementCSS(recentChatElement); // Also handles badge
            } else if (shouldBeBlocked && currentlyHidden && blockedMarker !== blockingId) {
                 logDebug(`[Process Recent Chat] Item remains hidden, updating blocking user marker from ${blockedMarker} to ${blockingId}.`);
                 recentChatElement.dataset.blockedByScript = blockingId;
                 if (badge) badge.style.display = 'none'; // Ensure badge stays hidden
            } else if (!shouldBeBlocked && !currentlyHidden && badge && badge.style.display === 'none') {
                 // Ensure badge is visible if item isn't blocked
                 logDebug(`[Process Recent Chat] Ensuring notification badge is visible.`);
                 badge.style.display = '';
            }
        } else if (currentlyHidden) {
             // Unhide if previously blocked but ID couldn't be verified
             logDebug(`[Process Recent Chat] Unhiding previously blocked recent chat item (could not re-verify ID pair).`);
             unhideElementCSS(recentChatElement);
        }
    }

    /**
     * Finds and makes visible elements previously hidden by this script for a specific user ID.
     */
    function unhideBlockedElements(userIdBeingUnblocked) {
        logDebug(`[unhideBlockedElements] Searching for elements blocked specifically by user ${userIdBeingUnblocked}`);
        // Select elements that were hidden *because* this specific user was blocked
        const hiddenElements = document.querySelectorAll(`[data-blocked-by-script="${userIdBeingUnblocked}"]`);

        logDebug(`[unhideBlockedElements] Found ${hiddenElements.length} elements previously hidden by ${userIdBeingUnblocked}. Unhiding them.`);
        hiddenElements.forEach(el => {
            if (el.matches(CHAT_MESSAGE_SELECTOR)) {
                // Unhide messages directly
                 logDebug("[unhideBlockedElements] Unhiding message:", el);
                 el.style.display = '';
                 delete el.dataset.blockedByScript;
            } else {
                // For other elements (windows, buttons, recent chats), use the CSS unhide function
                 logDebug("[unhideBlockedElements] Unhiding element via CSS:", el);
                 unhideElementCSS(el); // This handles removing class and marker
            }
        });
        console.log(`Torn Chat Blocker: Processed unhiding for user ${userIdBeingUnblocked}.`);
    }

    /**
     * Re-scans and applies blocking/hiding only to recent chat list items.
     */
    function applyRecentChatBlocking() {
        logDebug("[applyRecentChatBlocking] Applying blocking to recent chat list...");
        try {
            const items = document.querySelectorAll(RECENT_CHAT_ITEM_SELECTOR);
            logDebug(`[applyRecentChatBlocking] Found ${items.length} recent chat items to process.`);
            items.forEach(processRecentChat); // Process each found item
        } catch (e) {
             console.error("Torn Chat Blocker: Error inside applyRecentChatBlocking!", e);
        }
        logDebug("[applyRecentChatBlocking] Finished applying blocking to recent chat list.");
    }


    /**
     * Re-scans and applies blocking/hiding to all relevant elements.
     */
    function applyBlockingToAllWindows() {
        console.log('Torn Chat Blocker: Applying blocking/hiding to all windows/elements...');
        logDebug("Processing messages...");
        document.querySelectorAll(CHAT_MESSAGE_SELECTOR).forEach(processChatMessage); // Hides messages
        logDebug("Processing recent chats...");
        applyRecentChatBlocking(); // Hides recent chat items
        logDebug("Processing chat windows...");
        document.querySelectorAll(CHAT_WINDOW_SELECTOR).forEach(processChatWindow); // Hides windows
         logDebug("Processing chat buttons...");
        document.querySelectorAll(CHAT_BUTTON_SELECTOR).forEach(processChatButton); // Hides buttons
        console.log('Torn Chat Blocker: Finished applying blocking/hiding.');
    }


    // --- Initialization & Observers ---

    /**
     * Sets up MutationObservers to watch for new elements.
     * NOTE: recentChatObserver is disabled to prevent potential freezes.
     */
    function setupObservers() {
         const observerOptions = { childList: true, subtree: true };

        // Combined observer for chat messages, chat windows, and chat buttons
        const mainObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    const checkAndProcess = (targetNode, selector, processor) => {
                        if (targetNode.matches(selector)) {
                            logDebug(`[Observer Added Node] Direct match for ${selector}:`, targetNode);
                            processor(targetNode); // Process immediately
                        } else if (typeof targetNode.querySelectorAll === 'function') {
                           const nestedMatches = targetNode.querySelectorAll(selector);
                           if (nestedMatches.length > 0) {
                               logDebug(`[Observer Added Node] Found ${nestedMatches.length} nested match(es) for ${selector} in:`, targetNode);
                               nestedMatches.forEach(processor); // Process immediately
                           }
                        }
                    };
                    checkAndProcess(node, CHAT_MESSAGE_SELECTOR, processChatMessage);
                    checkAndProcess(node, CHAT_WINDOW_SELECTOR, processChatWindow);
                    checkAndProcess(node, CHAT_BUTTON_SELECTOR, processChatButton);
                    // Also check for recent chat items added to the body (less likely but possible)
                    checkAndProcess(node, RECENT_CHAT_ITEM_SELECTOR, processRecentChat);
                });
                 // Re-process recent chat items if attributes/children change (for badges)
                 mutation.attributeFilter = ['style', 'class'];
                 if (mutation.type === 'attributes' && mutation.target.matches(RECENT_CHAT_ITEM_SELECTOR)) {
                     logDebug(`[Observer Attributes Changed] Attributes changed on recent chat item:`, mutation.target);
                     processRecentChat(mutation.target);
                 } else if (mutation.type === 'childList' && mutation.target.matches(RECENT_CHAT_ITEM_SELECTOR)) {
                     logDebug(`[Observer ChildList Changed] Children changed within recent chat item:`, mutation.target);
                     processRecentChat(mutation.target);
                 }
            });
        });

        // *** Temporarily disabling recentChatObserver to prevent potential freezes ***
        /*
        // Observer specifically for the recent chats list container
        const recentChatObserver = new MutationObserver(mutations => {
             mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                     if (node.nodeType !== Node.ELEMENT_NODE) return;
                     const checkAndProcess = (targetNode, selector, processor) => {
                        if (targetNode.matches(selector)) {
                            logDebug(`[Observer Added Node] Direct match for ${selector}:`, targetNode);
                            processor(targetNode); // Process immediately
                        } else if (typeof targetNode.querySelectorAll === 'function') {
                           const nestedMatches = targetNode.querySelectorAll(selector);
                           if (nestedMatches.length > 0) {
                               logDebug(`[Observer Added Node] Found ${nestedMatches.length} nested match(es) for ${selector} in:`, targetNode);
                               nestedMatches.forEach(processor); // Process immediately
                           }
                        }
                    };
                    checkAndProcess(node, RECENT_CHAT_ITEM_SELECTOR, processRecentChat);
                });
                 // Also check for changes within the list items in this observer
                 if (mutation.type === 'attributes' && mutation.target.matches(RECENT_CHAT_ITEM_SELECTOR)) {
                     logDebug(`[Recent Chat Observer Attributes Changed] Attributes changed on recent chat item:`, mutation.target);
                     processRecentChat(mutation.target);
                 } else if (mutation.type === 'childList' && mutation.target.matches(RECENT_CHAT_ITEM_SELECTOR)) {
                     logDebug(`[Recent Chat Observer ChildList Changed] Children changed within recent chat item:`, mutation.target);
                     processRecentChat(mutation.target);
                 }
            });
        });
        */

        // Start observing the body for general chat elements
        mainObserver.observe(document.body, observerOptions);
        logDebug("Main observer (messages/windows/buttons/recent) attached to document.body.");

        // *** Temporarily disabling recentChatObserver attachment ***
        logDebug("Recent chat observer is currently DISABLED to prevent potential freezes.");
        /*
        // Try to observe the recent chat list container
        requestAnimationFrame(() => {
            const recentListContainer = document.querySelector(RECENT_CHAT_LIST_SELECTOR);
            if (recentListContainer) {
                recentChatObserver.observe(recentListContainer, {...observerOptions, attributes: true, attributeFilter: ['style', 'class']});
                logDebug("Recent chat observer attached to:", recentListContainer);
            } else {
                logDebug("Recent chat list container not found yet. Will attempt to observe later.");
                const findRecentListObserver = new MutationObserver((mutations, obs) => {
                     const listContainer = document.querySelector(RECENT_CHAT_LIST_SELECTOR);
                     if (listContainer) {
                         recentChatObserver.observe(listContainer, {...observerOptions, attributes: true, attributeFilter: ['style', 'class']});
                         logDebug("Found and attached recent chat observer to:", listContainer);
                         obs.disconnect();
                     }
                });
                findRecentListObserver.observe(document.body, { childList: true, subtree: true });
            }
        });
        */
        console.log('Torn Chat Blocker: Observers initialized (Recent Chat Observer Disabled).');
     }

    /**
     * Adds necessary CSS styles for the UI integrated into the icon row.
     */
    function addStyles() {
        GM_addStyle(`
            /* --- Blocker UI Container (within icon row) --- */
            #torn-blocker-ui-container {
                position: relative; /* For absolute positioning of panel */
                display: inline-block; /* Align with other buttons */
                vertical-align: top; /* Align with other buttons */
            }

            /* --- Manage Button (inherits Torn styles) --- */
            #torn-blocker-button {
                /* Using Torn classes: root___WHFbh root___J_YsG */
                cursor: pointer;
            }
            #torn-blocker-button svg {
                 vertical-align: middle;
            }


            /* --- Management Panel (Opens Above Button) --- */
            #torn-blocker-panel {
                background-color: #2a2a2a;
                border: 1px solid #555;
                border-radius: 5px;
                padding: 10px;
                max-height: 250px;
                overflow-y: auto;
                position: absolute !important;
                bottom: calc(100% + 5px);
                right: 0;
                width: 300px;
                z-index: 99998 !important;
                box-shadow: 0 -2px 5px rgba(0,0,0,0.3);
                color: #ccc;
            }

            /* --- Input & Add Button --- */
            #torn-blocker-panel label {
                color: #ccc;
                margin-right: 5px;
            }
            #torn-blocker-input {
                background-color: #333;
                color: #ddd;
                border: 1px solid #666;
                border-radius: 3px;
                padding: 4px 6px;
                width: calc(100% - 75px);
                vertical-align: middle;
                pointer-events: auto !important; /* Keep this */
                position: relative;
                z-index: 1;
            }
            #torn-blocker-add-button {
                 vertical-align: middle;
                 margin-left: 5px;
                 padding: 4px 8px;
                 position: relative;
                 z-index: 5; /* Ensure button is clickable */
                 pointer-events: auto !important; /* Ensure clickable */
                 cursor: pointer; /* Explicitly set cursor */
            }

            /* --- Blocked List Styling --- */
            #torn-blocker-list {
                 margin-top: 10px;
                 padding: 0;
                 list-style: none;
            }
            .torn-blocker-list-item {
                border-bottom: 1px dashed #444;
                padding: 4px 2px;
                color: #bbb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                 position: relative;
                 z-index: 1;
            }
             .torn-blocker-list-item:last-child {
                border-bottom: none;
            }
            .torn-blocker-remove-button {
                 margin-left: 10px;
                 padding: 2px 6px;
                 font-size: 0.8em;
                 cursor: pointer;
                 position: relative;
                 z-index: 5; /* Ensure button is clickable */
                 pointer-events: auto !important; /* Ensure clickable */
            }

            /* --- Style for Hidden Messages --- */
            ${CHAT_MESSAGE_SELECTOR}[data-blocked-by-script] {
                 display: none !important;
            }

             /* --- Aggressive CSS Hiding Class for Layout Elements --- */
            .${HIDDEN_CLASS} {
                display: block !important; /* Keep block display for parent */
                height: 0 !important;
                width: 0 !important; /* Set width 0 for horizontal items */
                min-height: 0 !important;
                min-width: 0 !important;
                font-size: 0 !important; /* Hide text */
                line-height: 0 !important; /* Hide text */
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                overflow: hidden !important;
                visibility: hidden !important;
                opacity: 0 !important;
                /* Attempt to remove from layout flow */
                position: absolute !important; /* Make it absolute if not already */
                z-index: -100 !important; /* Send it behind */
                /* Reset transforms that might affect layout */
                transform: none !important;
                 /* Prevent interaction */
                pointer-events: none !important;
            }
            /* Ensure direct children are also hidden if parent uses this class */
             .${HIDDEN_CLASS} > * {
                 /* Hiding children might interfere less than hiding parent display */
                 /* Let parent keep its dimensions but hide content */
                 visibility: hidden !important;
                 pointer-events: none !important;
                 opacity: 0 !important;
             }
        `);
    }

    /**
     * Attaches listeners needed for dynamic interactions using MutationObserver for reliability.
     */
     function attachDynamicListeners() {
         logDebug("Setting up observer to find UI buttons...");
         let blockerButtonFound = false;
         let peopleButtonFound = false;

         const uiButtonObserver = new MutationObserver((mutations, obs) => {
             // Check for Blocker Button
             if (!blockerButtonListenerAttached) {
                 const blockerButton = document.getElementById(BLOCKER_BUTTON_ID);
                 if (blockerButton) {
                     logDebug("Found Blocker button via observer.");
                     blockerButton.addEventListener('click', () => {
                         logDebug("Manage Block List button clicked (direct/attached by observer).");
                         if (blockPanel) { // Ensure panel exists
                             blockPanel.style.display = blockPanel.style.display === 'none' ? 'block' : 'none';
                             if (blockPanel.style.display === 'block') updateBlockListUI();
                         }
                     });
                     blockerButtonListenerAttached = true;
                     logDebug("Attached click listener to Blocker button.");
                 }
             }

             // Check for People Button
             if (!peopleButtonListenerAttached) {
                 const peopleButton = document.querySelector(PEOPLE_PANEL_BUTTON_SELECTOR);
                 if (peopleButton) {
                     logDebug("Found People panel button via observer.");
                     peopleButton.addEventListener('click', () => {
                         logDebug("People panel button clicked (direct/attached by observer). Starting list content wait...");

                         // --- Observer to wait for List Content ---
                         const listWaitObserver = new MutationObserver((listMutations, listObs) => {
                             const panelElement = document.querySelector(PEOPLE_PANEL_SELECTOR); // Check panel still exists
                             const listContainer = panelElement?.querySelector(RECENT_CHAT_LIST_SELECTOR);
                             // Check if list container exists AND has at least one recent chat item inside
                             if (listContainer && listContainer.querySelector(RECENT_CHAT_ITEM_SELECTOR)) {
                                 logDebug("Recent chat list container AND content found by listWaitObserver.");
                                 listObs.disconnect(); // Stop waiting

                                 // --- Process the list ---
                                 listContainer.style.visibility = 'hidden'; // Hide to prevent flash
                                 logDebug(">>> Calling applyRecentChatBlocking NOW <<<");
                                 try {
                                     applyRecentChatBlocking(); // Process items
                                     logDebug("<<< Finished applyRecentChatBlocking call >>>");
                                 } catch (e) {
                                     console.error("Torn Chat Blocker: Error during applyRecentChatBlocking!", e);
                                 }
                                 requestAnimationFrame(() => { // Unhide in next frame
                                     listContainer.style.visibility = 'visible';
                                     logDebug("Made recent chat list visible again.");
                                 });
                                 logDebug("Disconnected listWaitObserver after finding list content.");
                             } else {
                                 // Optional: Check if panel still exists, if not, disconnect
                                 if (!panelElement) {
                                     logDebug("listWaitObserver: Panel disappeared, disconnecting.");
                                     listObs.disconnect();
                                 } else {
                                     logDebug("listWaitObserver: List container or items not ready yet. Still waiting...");
                                 }
                             }
                         });

                         // Start observing the panel (or body) for list/item changes
                         const watchTarget = document.querySelector(PEOPLE_PANEL_SELECTOR) || document.body;
                         listWaitObserver.observe(watchTarget, { childList: true, subtree: true });
                         logDebug("Attached listWaitObserver to:", watchTarget);
                         // Timeout fallback for list observer
                         setTimeout(() => {
                             listWaitObserver.disconnect();
                             logDebug("Disconnected listWaitObserver via timeout fallback.");
                             // Ensure list is visible if timeout hit before processing
                             const listContainer = document.querySelector(RECENT_CHAT_LIST_SELECTOR);
                             if(listContainer) listContainer.style.visibility = 'visible';
                            }, 3000);

                     }); // End peopleButton click listener
                     peopleButtonListenerAttached = true;
                     logDebug("Attached click listener to People panel button.");
                 } // End if(peopleButton)
             } // End if (!peopleButtonListenerAttached)

             // If both listeners are attached, stop observing
             if (blockerButtonListenerAttached && peopleButtonListenerAttached) {
                 obs.disconnect();
                 logDebug("Disconnected UI button observer (both listeners attached).");
             }
         }); // End uiButtonObserver callback

         // Start observing the body for the buttons to appear
         uiButtonObserver.observe(document.body, { childList: true, subtree: true });
         logDebug("UI button observer attached to document.body.");

     } // End attachDynamicListeners


    // --- Main Execution ---
    function initializeBlocker() {
        console.log('Torn Chat Blocker: Script starting...');
        loadBlockedUsers();
        addStyles();
        // Run initial scan with a delay
        setTimeout(applyBlockingToAllWindows, INITIAL_SCAN_DELAY);
        console.log(`Torn Chat Blocker: Initial scan scheduled in ${INITIAL_SCAN_DELAY}ms.`);
        setupObservers(); // Setup observers early
        setTimeout(createBlockUI, 500); // Create UI slightly later
        attachDynamicListeners(); // Use observer-based attachment for button listeners
    }

    // Run the initialization function
    initializeBlocker();

})();
