// ==UserScript==
// @name         Torn Drug Alert
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Alerts when no drug cooldown is active and allows taking drugs from any page
// @author       GNSC4
// @match        https://www.torn.com/*
// @download     https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.js
// @update       https://github.com/gnsc4/Torn-Scripts/raw/refs/heads/master/Torn%20Drug%20Alerts/DrugAlerts.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add CSS
    GM_addStyle(`
        .drug-alert {
            background-color: #ff3333;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            cursor: pointer;
            margin-left: 15px;
            display: inline-flex;
            align-items: center;
            font-size: 12px;
        }

        .drug-gui {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background-color: #222;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .drug-gui h3 {
            margin-top: 0;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }

        .drug-search {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #444;
            background-color: #333;
            color: white;
            border-radius: 3px;
        }

        .drug-search::placeholder {
            color: #aaa;
        }

        .drug-list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
        }

        .drug-item {
            background-color: #333;
            padding: 8px;
            border-radius: 3px;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .drug-item:hover {
            background-color: #444;
        }

        .drug-notification {
            position: fixed;
            bottom: 70px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            opacity: 1;
            transition: opacity 0.5s;
        }

        .drug-notification.success {
            background-color: #4CAF50;
        }

        .drug-notification.error {
            background-color: #f44336;
        }

        .drug-notification.info {
            background-color: #2196F3;
        }
    `);

    // Fallback drug list in case fetch fails
    const fallbackDrugs = [
        { id: 196, name: "Xanax" },
        { id: 197, name: "Ecstasy" },
        { id: 198, name: "Ketamine" },
        { id: 199, name: "LSD" },
        { id: 200, name: "Opium" },
        { id: 201, name: "Shrooms" },
        { id: 202, name: "Speed" },
        { id: 203, name: "PCP" },
        { id: 204, name: "Cannabis" }
    ];

    let alertElements = null;
    let drugList = []; // Will hold our drugs

    // Check if drug cooldown is active
    function hasDrugCooldown() {
        // Look for any of the drug cooldown icons by ID
        const drugIcons = [
            document.getElementById('icon49'), // Drug cooldown (0-10m)
            document.getElementById('icon50'), // Drug cooldown (10-60m)
            document.getElementById('icon51'), // Drug cooldown (1-2hr)
            document.getElementById('icon52'), // Drug cooldown (2-5hr)
            document.getElementById('icon53')  // Drug cooldown (5hr+)
        ];

        // Return true if any of the icons are found
        return drugIcons.some(icon => icon !== null);
    }

    // Find header element on any page
    function findHeader() {
        // Try multiple possible header selectors that exist on various pages
        const possibleHeaders = [
            document.querySelector('.appHeader___gUnYC'), // Crimes page
            document.querySelector('.content-title'), // Many pages
            document.querySelector('.tutorial-cont'), // Some pages
            document.querySelector('.cont-gray'), // Some pages
            document.querySelector('.content-wrapper .header'), // Profile and other pages
            document.querySelector('.content-wrapper .title-black'), // Some pages
            document.querySelector('.captionWithActionContainment___nVTbE'), // Faction page
            document.querySelector('.pageTitle___CaFrO'), // Items page
            document.querySelector('.sortable-list .title'), // Various listing pages
            document.querySelector('.topSection___CfKvI'), // Travel page
            document.querySelector('.mainStatsContainer___TXO7F'), // City page
            document.querySelector('div[role="heading"]') // Many modern pages
        ];

        // Return the first found header
        return possibleHeaders.find(header => header !== null);
    }

    // Create a fixed header if none exists
    function createFixedHeader() {
        // Check if we already created a fixed header
        let fixedHeader = document.getElementById('torn-drug-fixed-header');

        if (!fixedHeader) {
            fixedHeader = document.createElement('div');
            fixedHeader.id = 'torn-drug-fixed-header';
            fixedHeader.style.position = 'fixed';
            fixedHeader.style.top = '50px';
            fixedHeader.style.right = '20px';
            fixedHeader.style.zIndex = '9999';
            fixedHeader.style.backgroundColor = 'rgba(34, 34, 34, 0.8)';
            fixedHeader.style.padding = '5px 10px';
            fixedHeader.style.borderRadius = '5px';
            fixedHeader.style.display = 'flex';
            fixedHeader.style.alignItems = 'center';
            document.body.appendChild(fixedHeader);
        }

        return fixedHeader;
    }

    // Create alert and GUI with search
    function createAlert(drugs) {
        // Find the header element
        let header = findHeader();

        // If no standard header found, create our fixed header
        if (!header) {
            header = createFixedHeader();
        }

        // Create alert element
        const alert = document.createElement('div');
        alert.className = 'drug-alert';
        alert.textContent = 'No Drugs';

        // Insert alert into header
        header.appendChild(alert);

        // Create GUI
        const gui = document.createElement('div');
        gui.className = 'drug-gui';
        gui.innerHTML = `
            <h3>Take Drugs</h3>
            <input type="text" class="drug-search" placeholder="Search drugs...">
            <div class="drug-list"></div>
        `;
        document.body.appendChild(gui);

        // Add search functionality
        const searchInput = gui.querySelector('.drug-search');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const drugItems = gui.querySelectorAll('.drug-item');

            drugItems.forEach(item => {
                const name = item.textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        // Populate drug list
        const drugListElement = gui.querySelector('.drug-list');
        drugs.forEach(drug => {
            const drugItem = document.createElement('div');
            drugItem.className = 'drug-item';
            drugItem.textContent = drug.name;
            drugItem.dataset.id = drug.id;
            drugListElement.appendChild(drugItem);

            // Add click handler
            drugItem.addEventListener('click', () => {
                useDrug(drug.id, drug.name);
            });
        });

        // Toggle GUI on alert click
        alert.addEventListener('click', () => {
            gui.style.display = gui.style.display === 'none' || gui.style.display === '' ? 'block' : 'none';
        });

        // Close GUI when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!gui.contains(e.target) && !alert.contains(e.target) && gui.style.display === 'block') {
                gui.style.display = 'none';
            }
        });

        return { alert, gui };
    }

    // Function to use a drug
    function useDrug(id, name) {
        // Using fetch to call the Torn API
        fetch('https://www.torn.com/item.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `step=actionForm&id=${id}&action=use&type=use`,
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message
                showNotification(`Used ${name} successfully!`, 'success');
                // Check cooldown again after a short delay
                setTimeout(checkDrugCooldown, 1000);
            } else {
                // Show error message
                showNotification(data.message || 'Failed to use drug', 'error');
            }
        })
        .catch(error => {
            showNotification('Error using drug', 'error');
            console.error('Error using drug:', error);
        });
    }

    // Function to show notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `drug-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Fetch drugs from items.html
    function fetchDrugs() {
        return new Promise((resolve, reject) => {
            // Fetch the items.html page
            fetch('https://www.torn.com/items.php?pfaction=category&category=Drugs')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Find all drug items
                    const drugItems = [];
                    const itemElements = doc.querySelectorAll('.items-cont .items-wrap .items-link');

                    itemElements.forEach(item => {
                        const nameElem = item.querySelector('.name');
                        if (!nameElem) return;

                        const name = nameElem.textContent.trim();
                        // Extract item ID from the onclick attribute
                        const onclick = item.getAttribute('onclick');
                        if (onclick) {
                            const match = onclick.match(/item_\((\d+),/);
                            if (match && match[1]) {
                                drugItems.push({
                                    id: parseInt(match[1]),
                                    name: name
                                });
                            }
                        }
                    });

                    if (drugItems.length > 0) {
                        resolve(drugItems);
                    } else {
                        // Fallback if no drugs found
                        resolve(fallbackDrugs);
                    }
                })
                .catch(error => {
                    console.error('Error fetching drugs:', error);
                    // Fallback to predefined list if fetch fails
                    resolve(fallbackDrugs);
                });
        });
    }

    // Check for drug cooldown and manage alert
    function checkDrugCooldown() {
        const hasCooldown = hasDrugCooldown();

        // If no cooldown and alert doesn't exist, create it
        if (!hasCooldown && !alertElements) {
            alertElements = createAlert(drugList);
        }
        // If cooldown and alert exists, remove it
        else if (hasCooldown && alertElements) {
            alertElements.alert.remove();
            alertElements.gui.remove();
            alertElements = null;
        }
    }

    // Initialize the script
    fetchDrugs().then(fetchedDrugs => {
        drugList = fetchedDrugs;

        // Initial check
        setTimeout(checkDrugCooldown, 2000); // Wait for page to fully load

        // Set up a mutation observer to detect when the header might appear/change
        const observer = new MutationObserver((mutations) => {
            // If we already have alert elements but the header changed, we might need to recreate
            if (alertElements && alertElements.alert && !hasDrugCooldown()) {
                const header = findHeader();
                if (header && !header.contains(alertElements.alert)) {
                    // Remove old alert
                    alertElements.alert.remove();
                    // Create new one in header
                    const newAlert = document.createElement('div');
                    newAlert.className = 'drug-alert';
                    newAlert.textContent = 'No Drugs';
                    header.appendChild(newAlert);

                    // Update reference and event listener
                    alertElements.alert = newAlert;
                    newAlert.addEventListener('click', () => {
                        alertElements.gui.style.display = alertElements.gui.style.display === 'none' ||
                                                        alertElements.gui.style.display === '' ? 'block' : 'none';
                    });
                }
            } else {
                // Regular check
                checkDrugCooldown();
            }
        });

        // Observe the entire body for changes to catch header appearances
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Periodic check
        setInterval(checkDrugCooldown, 60000);
    });
})();