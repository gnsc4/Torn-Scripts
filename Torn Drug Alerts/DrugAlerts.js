// ==UserScript==
// @name         Torn Drug Alert
// @namespace    http://tampermonkey.net/
// @version      1.0.1
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
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #ff3333;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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
        { id: 206, name: "Xanax" },
        { id: 197, name: "Ecstasy" },
        { id: 198, name: "Ketamine" },
        { id: 199, name: "LSD" },
        { id: 200, name: "Opium" },
        { id: 203, name: "Shrooms" },
        { id: 204, name: "Speed" },
        { id: 203, name: "PCP" },
        { id: 196, name: "Cannabis" },
        { id: 205, name: "Vicodin" }
    ];
    
    let alertElements = null;
    let drugList = []; // Will hold our drugs
    
    // Check if drug cooldown is active
    function hasDrugCooldown() {
        // Look for the drug cooldown icon in the icon bar
        const cooldownIcon = document.querySelector('.icon-wrap .cooldown[data-section="drugs"]');
        return !!cooldownIcon;
    }
    
    // Create alert and GUI with search
    function createAlert(drugs) {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = 'drug-alert';
        alert.textContent = 'No Drugs';
        document.body.appendChild(alert);
        
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
        
        // Periodic check
        setInterval(checkDrugCooldown, 60000);
    });
})();