# Torn Cooldown Manager

**Version:** 1.0.0
**Author:** GNSC4 [268863]

## Description

This userscript enhances the Torn.com interface by providing a comprehensive manager for tracking various cooldowns, player status, and inventory items. It displays timers, item counts, and provides quick-use buttons for common Medical, Drug, and Booster items, sourced from either personal or faction inventory. Includes alerts, desktop notifications, and a detailed settings panel for customization.

## Features

* **Cooldown Tracking:** Displays remaining time for Drug, Booster, and Medical cooldowns. Includes estimated end times on hover.
* **Status Bars:** Shows current Life percentage and values.
* **Refill Tracking:** Indicates the availability of Energy, Nerve, and Token refills, plus the count of Special Refills.
* **Item Inventory:** Tracks counts of specific Medical, Drug, and Booster items from both Personal and Faction inventories (requires visiting the respective pages).
* **Quick Use Buttons:**
    * Configurable buttons for quickly using selected Medical, Drug, and Booster items.
    * Source selection (Personal or Faction) for each item category.
    * Customizable item button colors.
    * Drag-and-drop reordering of Quick Use items in settings.
* **Alerts & Notifications:**
    * Optional desktop notifications when cooldowns finish.
    * Optional in-page alert when Empty Blood Bags become usable based on life and medical cooldown.
    * Low-life visual indicator on the life bar and relevant medical items.
* **Configuration Panel:**
    * Set and test your Torn API Key (minimal access required).
    * Configure notification preferences.
    * Set maximum display values for Medical and Booster cooldowns.
    * Toggle the Empty Blood Bag alert.
    * Select which items appear in the Quick Use sections for Medical, Drugs, and Boosters.
    * Customize the background color for each Quick Use item button.
    * Choose the target link for Refill buttons (Personal Points page or Faction Armoury).
* **Persistent Storage:** Uses `localStorage` and `GM_setValue` to remember item counts, API key, settings, and UI state between sessions.
* **API Caching:** Caches API responses locally for a short duration to reduce API calls.
* **UI:**
    * Fixed-position, collapsible panel on the right side of the screen.
    * Cooperative positioning attempts to avoid overlapping with other common Torn script UIs.
    * Clickable headers link to relevant Torn pages (Items, Faction Armoury).

## Installation

1.  **Install a Userscript Manager:** You need a browser extension like [Tampermonkey](https://www.tampermonkey.net/) (recommended) or Greasemonkey.
2.  **Install the Script:**
    * Navigate to the script's installation URL (usually the `.user.js` file link).
    * Your userscript manager should automatically detect the script and prompt you for installation.
    * Click "Install".

## Configuration

1.  **API Key:**
    * The script requires a Torn API key with **minimal access**.
    * Go to your Torn API Key settings: [https://www.torn.com/preferences.php#tab=api](https://www.torn.com/preferences.php#tab=api)
    * Create a new key if needed, ensuring it has **Public access status** only (no special permissions required).
    * Open the script's settings panel in Torn (click the "⚙️ Settings" button at the bottom of the script's UI).
    * Paste your API key into the "Torn API Key" field.
    * Click "Test" to verify the key, then "Save Key".
2.  **Other Settings:**
    * Click the "⚙️ Settings" button in the script's UI panel.
    * Adjust notification preferences, cooldown display settings, alerts, and Quick Use items/colors as desired.
    * Use the toggles to select whether Medical, Drug, and Booster items should be sourced from your Personal inventory or Faction inventory for the Quick Use buttons.
    * Use the toggle under "Refills" to set where the Refill links point (Personal points page or Faction points armoury).

## Usage

* The script panel will appear on the right side of most Torn pages (excluding attack logs, preferences, etc.).
* Timers and status bars update automatically based on API data.
* Item counts update when you visit your Items page or the Faction Armoury page. The script reads the counts displayed on these pages.
* Click Quick Use buttons to attempt using the corresponding item from the selected source (Personal/Faction). You may be redirected to the appropriate page if not already there.
* Click the `+`/`–` button at the top right of the panel to minimize/expand it.
* Click the "⚙️ Settings" button to access the configuration panel.

## Dependencies

* Requires [SortableJS](https://github.com/SortableJS/Sortable) (loaded via `@require` from CDN).
* Requires a userscript manager extension.

## Notes

* Ensure your API key remains valid and has at least minimal access.
* Item counts are based on what's visible on the Items/Armoury pages when you visit them. They are cached locally and might not reflect real-time changes until you revisit those pages or the script successfully uses an item.
* Using items from the Faction Armoury requires being on the Faction Armoury page. The script will attempt to navigate you there if you try to use a faction item from elsewhere.
