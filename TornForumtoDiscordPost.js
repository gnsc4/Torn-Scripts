// ==UserScript==
// @name         Torn Forum to Discord Post
// @namespace    https://github.com/gnsc4
// @version      1.0.89
// @description  Sends Torn Forum posts to Discord via webhook
// @author       GNSC4 [2779998]
// @match        https://www.torn.com/forums.php*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @connect      discord.com
// @connect      api.torn.com
// @require      https://unpkg.com/turndown/dist/turndown.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const settings = {
        torn: {
            api: {
                key: "",
                keyLevel: "" // Automatically detected: '', 'user', or 'faction'
            },
            img: {
                default: {
                    alt: "torn",
                    url: "https://cdn4.iconfinder.com/data/icons/various-icons-2/48/v-07-512.png",
                },
                show: {
                    url: false,
                }
            }
        },
        discord: {
            webhook: {
                url: "",
                username: "",
                avatar_url: ""
            },
            img: {
                size: 25
            }
        },
        debug: {
            mode: true, // Enable debug mode here
            log: {
                all: true, // Enable verbose logging here
            }
        },
        cache: {
            enabled: true,
            expiration: 60, // minutes
        },
        selectedPosts: [] // Array to store selected posts (post IDs)
    };

    // --- Helper Functions ---

    const debug = (...args) => {
        if (settings.debug.mode) {
            console.debug('[T2D]', ...args);
        }
    };

    const log = (...args) => {
        if (settings.debug.log.all) {
            console.log('[T2D]', ...args);
        }
    };

    const cacheKey = (key) => {
        return `torn_forum_to_discord_${key}`;
    };

    const setCache = (key, value, expiration) => {
        if (!settings.cache.enabled) {
            return;
        }
        const now = new Date();
        const item = {
            value,
            expiry: now.getTime() + expiration * 60 * 1000,
        };
        GM_setValue(cacheKey(key), JSON.stringify(item));
    };

    const getCache = (key) => {
        if (!settings.cache.enabled) {
            return null;
        }
        const itemStr = GM_getValue(cacheKey(key));
        if (!itemStr) {
            return null;
        }
        const item = JSON.parse(itemStr);
        const now = new Date();
        if (now.getTime() > item.expiry) {
            GM_deleteValue(cacheKey(key));
            return null;
        }
        return item.value;
    };

    const clearCache = () => {
        if (!settings.cache.enabled) {
            return;
        }
        const keys = GM_listValues();
        keys.forEach((key) => {
            if (key.startsWith("torn_forum_to_discord_")) {
                GM_deleteValue(key);
            }
        });
    };

    // --- API Functions ---

    // Function to check API key level using /key/ endpoint
    const checkApiKeyLevel = async (apiKey) => {
        debug(`[checkApiKeyLevel] Checking API key level for key: ${apiKey}`);
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://api.torn.com/key/?selections=info&key=${apiKey}&comment=TornForumToDiscordScript-KeyCheck`,
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response);
                        } else {
                            debug(`[checkApiKeyLevel] API request failed with status: ${response.status}`);
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        debug(`[checkApiKeyLevel] API request error:`, error);
                        reject(error);
                    }
                });
            });

            const data = JSON.parse(response.responseText);

            if (data.error) {
                debug('[checkApiKeyLevel] Key check failed:', data.error);
                return ''; // Invalid key or other error
            } else {
                debug('[checkApiKeyLevel] Key information:', data);
                let keyLevel = '';
                switch (data.access_level) {
                    case 0:
                        keyLevel = ''; // Invalid Key
                        break;
                    case 1:
                        keyLevel = 'user'; // User Level
                        break;
                    case 2:
                        keyLevel = 'user'; // Minimal Access - treating as User level
                        break;
                    case 3:
                        keyLevel = 'faction'; // Limited Access
                        break;
                    case 4:
                        keyLevel = 'faction'; // Full Access
                        break;
                    default:
                        keyLevel = ''; // Unknown
                        break;
                }
                debug(`[checkApiKeyLevel] Detected key level: ${keyLevel}`);
                return keyLevel;
            }
        } catch (error) {
            console.error(`[checkApiKeyLevel] Error checking API key level: ${error}`);
            return ''; // Error
        }
    };

    // Generic function to fetch data from Torn API
    const fetchTornApi = async (endpoint, selections = '', id = '', limit = 0, from = 0) => {
        const apiKey = settings.torn.api.key;
        const keyLevel = settings.torn.api.keyLevel;
        const cacheKey = `<span class="math-inline">\{endpoint\}\-</span>{id}-<span class="math-inline">\{selections\}\-</span>{limit}-${from}`;

        debug(`[fetchTornApi] Fetching ${endpoint} data with ID ${id} and selections ${selections}`);

        // Check cache first
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            debug(`[fetchTornApi] Fetched data from cache for ${cacheKey}`);
            return cachedData;
        }

        // Determine the appropriate API endpoint based on key level and requested data
        let url;
        let headers = {};
        if (endpoint === 'user' && id && keyLevel === 'user') {
            url = `https://api.torn.com/user/<span class="math-inline">\{id\}?selections\=</span>{selections}&comment=TornForumToDiscordScript`;
            headers = { 'Authorization': `Bearer ${apiKey}` };
        } else if (endpoint === 'faction' && id && keyLevel === 'faction') {
            url = `https://api.torn.com/faction/<span class="math-inline">\{id\}?selections\=</span>{selections}&comment=TornForumToDiscordScript`;
            headers = { 'Authorization': `Bearer ${apiKey}` };
        } else if (endpoint === 'user' && keyLevel === 'faction') {
            url = `https://api.torn.com/user/?selections=${selections}&comment=TornForumToDiscordScript`;
            headers = { 'Authorization': `Bearer ${apiKey}` };
        } else if (endpoint === 'faction' && keyLevel === 'faction') {
            url = `https://api.torn.com/faction/?selections=${selections}&comment=TornForumToDiscordScript`;
            headers = { 'Authorization': `Bearer ${apiKey}` };
        } else if (endpoint === 'forum' && id && keyLevel === 'faction') {
            url = `https://api.torn.com/v2/<span class="math-inline">\{apiKey\}/forum/</span>{id}`;
            headers = { 'Accept': 'application/json' };
            if (selections) {
                url += `?selections=${selections}`;
                if (limit > 0) {
                    url += `&limit=${limit}`;
                }
                if (from > 0) {
                    url += `&from=${from}`;
                }
            }
        } else {
            debug(`[fetchTornApi] Insufficient API key level or invalid endpoint for ${endpoint}`);
            return null;
        }

        debug(`[fetchTornApi] API URL: ${url}`);

        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    headers: headers,
                    onload: (response) => {
                        debug("[fetchTornApi] API Response:", response);
                        if (response.status === 200) {
                            debug(`[fetchTornApi] API request successful: ${response.status}`);
                            resolve(response);
                        } else {
                            debug(`[fetchTornApi] API request failed with status: ${response.status}`);
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        debug(`[fetchTornApi] API request error:`, error);
                        reject(error);
                    }
                });
            });

            // Ensure response.responseText is a string before parsing
            const data = typeof response.responseText === 'string' ? JSON.parse(response.responseText) : response.responseText;

            if (data.error) {
                console.error('[fetchTornApi] API Error:', data.error);
                return null;
            }

            // Cache the data
            setCache(cacheKey, data, settings.cache.expiration);
            debug(`[fetchTornApi] Fetched data from API for ${cacheKey}`, data);
            return data;
        } catch (error) {
            console.error(`[fetchTornApi] Error fetching Torn API data: ${error}`);
            return null;
        }
    };

    // --- Content Parsing ---
    const parseContent = async (content) => {
        debug('[parseContent] Started parsing content');
        debug('[parseContent] Content before parsing:', content);

        try {
            // Initialize Turndown service with desired options
            const turndownService = new TurndownService({
                headingStyle: 'atx', // Use '#' for headings
                codeBlockStyle: 'fenced', // Use fenced code blocks (```)
            });

            // Add a custom rule for Torn's [player] tags
            turndownService.addRule('playerTag', {
                filter: function (node, options) {
                    return (
                        node.nodeName === 'A' &&
                        node.href &&
                        node.href.includes('profiles.php?XID=')
                    );
                },
                replacement: function (content, node, options) {
                    const playerId = node.href.split('=')[1];
                    debug(`[parseContent] Parsing player ID: ${playerId}`);
                    return `[${content}](https://www.torn.com/profiles.php?XID=${playerId})`;
                }
            });
            
            // Add a custom rule for Torn's [faction] tags
            turndownService.addRule('factionTag', {
                filter: function (node, options) {
                    return (
                        node.nodeName === 'A' &&
                        node.href &&
                        node.href.includes('factions.php?step=profile&ID=')
                    );
                },
                replacement: function (content, node, options) {
                    const factionId = node.href.split('=')[2];
                    debug(`[parseContent] Parsing faction ID: ${factionId}`);
                    return `[${content}](https://www.torn.com/factions.php?step=profile&ID=${factionId})`;
                }
            });

            // Convert the content using Turndown
            let parsedContent = turndownService.turndown(content);

            debug('[parseContent] Parsed content:', parsedContent);
            return parsedContent;
        } catch (error) {
            console.error(`[parseContent] Error parsing content: ${error}`);
            return content; // Fallback to original content in case of error
        }
    };

    // --- Discord Functions ---

    const postToDiscord = async (embed) => {
        const webhookUrl = settings.discord.webhook.url;
        const username = settings.discord.webhook.username;
        const avatarUrl = settings.discord.webhook.avatar_url;

        debug(`[postToDiscord] Posting to Discord webhook: ${webhookUrl}`);

        if (!webhookUrl) {
            console.error('[postToDiscord] Webhook URL is not set.');
            return;
        }

        const payload = {
            username: username,
            avatar_url: avatarUrl,
            embeds: [embed]
        };

        debug('[postToDiscord] Payload:', payload);

        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: webhookUrl,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify(payload),
                    onload: (response) => {
                        debug("[postToDiscord] Post response:", response);
                        if (response.status === 204 || response.status === 200) {
                            debug("[postToDiscord] Post successful");
                            resolve(response);
                        } else {
                            debug(`[postToDiscord] Post failed with status: ${response.status}`);
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        debug(`[postToDiscord] Post error:`, error);
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error(`[postToDiscord] Error posting to Discord:`, error);
            if (error.status) {
                try {
                    const errorBody = JSON.parse(error.responseText);
                    console.error(`[postToDiscord] Discord API Error:`, errorBody);
                } catch (e) {
                    console.error(`[postToDiscord] Error parsing Discord API response:`, e);
                }
            }
        }
    };

    // --- Post Selection Functions ---

    const selectPost = (postId) => {
        debug(`[selectPost] Selecting post with ID: ${postId}`);
        const index = settings.selectedPosts.indexOf(postId);
        if (index > -1) {
            settings.selectedPosts.splice(index, 1); // Remove post if already selected
            debug(`[selectPost] Removed post ${postId} from selection`);
        } else {
            settings.selectedPosts.push(postId); // Add post if not selected
            debug(`[selectPost] Added post ${postId} to selection`);
        }
        updateSelectedPostsDisplay();
    };

    // --- Select All Posts in Thread ---
    const selectAllPostsInThread = async (threadId) => {
        debug(`[selectAllPostsInThread] Selecting all posts in thread: ${threadId}`);
        try {
            const threadData = await fetchTornApi('forum', 'posts', threadId, 100);
            if (threadData && threadData.posts) {
                const postIds = Object.keys(threadData.posts);
                debug(`[selectAllPostsInThread] Found post IDs: ${postIds.join(', ')}`);
                for (const postId of postIds) {
                    selectPost(postId);
                }
            } else {
                console.error(`[selectAllPostsInThread] Could not fetch posts for thread ID: ${threadId}`);
            }
        } catch (error) {
            console.error(`[selectAllPostsInThread] Error selecting all posts in thread: ${error}`);
        }
    };

    // --- Send Selected Posts ---
    const sendSelectedPosts = async () => {
        debug(`[sendSelectedPosts] Sending ${settings.selectedPosts.length} selected posts`);
        let sendError = false;
        
        for (const postId of settings.selectedPosts) {
            try {
                // Fetch the post data using the Torn API
                const postData = await fetchTornApi('post', '', postId);
                if (postData && postData.posts && postData.posts[postId]) {
                    const post = postData.posts[postId];
                    debug(`[sendSelectedPosts] Fetched post data for post ID: ${postId}`, post);
    
                    // Extract necessary information from the API response
                    const userName = post.author.name;
                    const userId = post.author.user_id;
                    const postContent = post.text; // Use 'text' for post content from API
                    const postLink = `https://www.torn.com/forums.php#/p=post&q=${postId}`;
    
                    // Convert the Unix timestamp to a JavaScript Date object
                    const postDate = new Date(post.timestamp * 1000);
                    const postDateTime = postDate.toUTCString(); // Format as UTC string
    
                    // Parse the post content for additional formatting if necessary
                    const parsedContent = await parseContent(postContent);
                    debug(`[sendSelectedPosts] Parsed content for post ${postId}: ${parsedContent}`);
    
                    // Construct the embed object
                    const embed = {title: `Post by ${userName}`,
                        url: postLink,
                        description: parsedContent,
                        color: 0x007BFF,
                        author: {
                            name: userName,
                            url: `https://www.torn.com/profiles.php?XID=${userId}`
                        },
                        footer: {
                            text: `Posted on: ${postDateTime} UTC - 0`
                        }
                    };
    
                    // Check for images in post content and add to embed
                    const postElement = document.querySelector(`li[data-id="${postId}"]`);
                    if (postElement) {
                        const imageElement = postElement.querySelector('.post-container .post img');
                        if (imageElement) {
                            const imageUrl = imageElement.getAttribute('src');
                            if (imageUrl) {
                                embed.image = { url: imageUrl };
                                debug(`[sendSelectedPosts] Added image to embed for post: ${postId}`);
                            } else {
                                debug(`[sendSelectedPosts] Image found for post ${postId} but no src attribute present.`);
                            }
                        } else {
                            debug(`[sendSelectedPosts] No image found for post: ${postId}`);
                        }
                    }
    
                    await postToDiscord(embed);
                    debug(`[sendSelectedPosts] Sent post ${postId} to Discord`);
                } else {
                    console.error(`[sendSelectedPosts] Could not fetch post data for post ID: ${postId}`);
                    sendError = true;
                }
            } catch (error) {
                console.error(`[sendSelectedPosts] Error sending post ${postId}: ${error}`);
                sendError = true;
            }
            await new Promise(resolve => setTimeout(resolve, 1200));
        }
    
        // Clear the selection only if no error occurred
        if (!sendError) {
            settings.selectedPosts = [];
            updateSelectedPostsDisplay();
            debug('[sendSelectedPosts] Selected posts cleared');
        } else {
            debug('[sendSelectedPosts] Some posts were not sent due to errors. Selected posts not cleared.');
        }
    };

    const updateSelectedPostsDisplay = () => {
        debug(`[updateSelectedPostsDisplay] Updating selected posts display`);
        const selectedPostsDisplay = document.getElementById("selected-posts-display");
        if (selectedPostsDisplay) {
            selectedPostsDisplay.textContent = `Selected Posts: ${settings.selectedPosts.length}`;
        } else {
            debug(`[updateSelectedPostsDisplay] Could not find selected posts display element`);
        }
    };

     // --- Post Processing ---
     let processingPosts = false; // Flag to prevent processPosts from running concurrently

     const processPosts = async () => {
         // Check if processPosts is already running
         if (processingPosts) {
             debug(`[processPosts] processPosts is already running, skipping this run.`);
             return;
         }
 
         processingPosts = true; // Set the flag to indicate that processing is in progress
         debug(`[processPosts] Starting processPosts`);
 
         try {
             const currentUrl = window.location.href;
             const isForumSectionPage = currentUrl.includes("forums.php#/p=forums&f=");
             const isThreadPage = currentUrl.includes("forums.php#/p=thread");
 
             debug(`[processPosts] isForumSectionPage: ${isForumSectionPage}`);
             debug(`[processPosts] isThreadPage: ${isThreadPage}`);
 
             if (isForumSectionPage) {
                 // Forum section page - no buttons needed
                 debug(`[processPosts] No buttons needed for forum section pages.`);
             } else if (isThreadPage) {
                // Code to add "Select Post" buttons to individual posts
                debug(`[processPosts] Processing thread page`);

                // Use waitForPosts to ensure posts are loaded
                const posts = await waitForPosts();
                debug(`[processPosts] Found ${posts.length} posts with data-id`);
                const processedPostIds = new Set();

                for (const post of posts) {
                    const postId = post.dataset.id;
                    if (!postId) {
                        debug(`[processPosts] Post ID not found for post:`, post);
                        continue;
                    }

                    // Check if the post has already been processed
                    if (processedPostIds.has(postId)) {
                        debug(`[processPosts] Post with ID ${postId} already processed. Skipping.`);
                        continue;
                    }

                    debug(`[processPosts] Processing post with ID: ${postId}`);

                    // Add a "Select Post" button to each post
                    const selectButton = document.createElement("button");
                    selectButton.textContent = "Select Post";
                    selectButton.classList.add("select-post-button");
                    selectButton.style.order = '-1';
                    selectButton.addEventListener("click", () => {
                        selectPost(postId);
                        selectButton.classList.toggle("selected");
                    });

                    // Find the action bar and append the button
                    const actionBar = post.querySelector(".action-wrap");
                    if (actionBar) {
                        debug(`[processPosts] Inserting button for post: ${postId}`);
                        actionBar.insertBefore(selectButton, actionBar.firstChild);
                    } else {
                        console.error(`[processPosts] Could not find the action bar element for post: ${postId}`);
                    }

                    // Set data-post attribute and mark as processed
                    post.setAttribute("data-post", postId);
                    processedPostIds.add(postId);
                }
            }

            // Add a "Send Selected Posts" button (only if not already present)
            if (!document.getElementById("send-selected-posts-button")) {
                debug(`[processPosts] Adding "Send Selected Posts" button`);
                const sendButton = document.createElement("button");
                sendButton.textContent = "Send Selected Posts";
                sendButton.id = "send-selected-posts-button";
                sendButton.addEventListener("click", sendSelectedPosts);

                const selectedPostsDisplay = document.createElement("div");
                selectedPostsDisplay.id = "selected-posts-display";
                selectedPostsDisplay.textContent = `Selected Posts: 0`;

                const target = document.querySelector("#forums-page-wrap");
                if (target) {
                    debug(`[processPosts] Inserting "Send Selected Posts" button`);
                    target.parentNode.insertBefore(sendButton, target);
                    target.parentNode.insertBefore(selectedPostsDisplay, target);
                } else {
                    console.error("[processPosts] Could not find the target element to insert the Send button and display.");
                }
            }
        } catch (error) {
            console.error(`[processPosts] Error in processPosts: ${error}`);
        } finally {
            processingPosts = false; // Reset the flag when processing is complete
        }
    };

    // --- Helper Function to Wait for Posts ---
    const waitForPosts = () => {
        debug(`[waitForPosts] Waiting for posts to load`);
        return new Promise((resolve) => {
            const timeout = 10000; // Timeout after 10 seconds
            const interval = 100; // Check every 100 milliseconds
            let elapsedTime = 0;

            const checkPosts = () => {
                const posts = document.querySelectorAll("li[data-id]");
                if (posts.length > 0) {
                    debug(`[waitForPosts] Found ${posts.length} posts`);
                    resolve(posts);
                } else {
                    elapsedTime += interval;
                    if (elapsedTime < timeout) {
                        debug(`[waitForPosts] No posts found yet, checking again in ${interval}ms`);
                        setTimeout(checkPosts, interval);
                    } else {
                        debug(`[waitForPosts] Timeout reached, no posts found`);
                        resolve([]); // Resolve with an empty array if no posts are found after timeout
                    }
                }
            };

            checkPosts();
        });
    };

   // --- Mutation Observer ---
   const observer = new MutationObserver(() => {
    debug('[MutationObserver] A change was detected in the DOM');
    processPosts(); // Call processPosts directly when a change is detected
    });

    // --- GUI Functions ---

    const createGUI = () => {
        debug('[createGUI] Creating settings GUI');
        // Load saved settings
        loadSettings();

        // Create a container for the GUI
        const guiContainer = document.createElement("div");
        guiContainer.id = "torn-to-discord-gui";
        document.body.appendChild(guiContainer);

        // Create the API Key section
        const apiKeySection = document.createElement("div");
        apiKeySection.innerHTML = `
            <h3>Torn API Key</h3>
            <input type="text" id="api-key" placeholder="Enter your Torn API key" value="${settings.torn.api.key}">
            <p class="help-text api-key-level-text"></p>
        `;
        guiContainer.appendChild(apiKeySection);

        // Set the initial API key level text based on saved settings
        const apiKeyLevelText = guiContainer.querySelector(".api-key-level-text");
        if (apiKeyLevelText) {
            apiKeyLevelText.textContent = settings.torn.api.keyLevel ? `Key Level: ${settings.torn.api.keyLevel === "faction" ? "Faction (or higher)" : "User"}` : '';
        }

        // Create the Discord Webhook section
        const discordSection = document.createElement("div");
        discordSection.innerHTML = `
            <h3>Discord Webhook</h3>
            <input type="text" id="webhook-url" placeholder="Enter your Discord webhook URL" value="<span class="math-inline">\{settings\.discord\.webhook\.url\}"\>
<input type\="text" id\="webhook\-username" placeholder\="Enter a custom username \(optional\)" value\="</span>{settings.discord.webhook.username}">
            <input type="text" id="webhook-avatar" placeholder="Enter a custom avatar URL (optional)" value="${settings.discord.webhook.avatar_url}">
        `;
        guiContainer.appendChild(discordSection);

        // Create the Help section
        const helpSection = document.createElement("div");
        helpSection.innerHTML = `
            <h3>Help</h3>
            <p class="help-text"><b>Torn API Key:</b> You can find your API key at <a href="https://www.torn.com/preferences.php#tab=api" target="_blank">https://www.torn.com/preferences.php#tab=api</a></p>
            <p class="help-text"><b>API Key Level:</b></p>
            <ul class="help-text">
                <li><b>User Level:</b> Required for reading user-related information (e.g., player names from forum posts).</li>
                <li><b>Faction Level:</b> Required if you want to fetch faction names from faction links in forum posts.</li>
            </ul>
            <p class="help-text"><b>Discord Webhook:</b> To create a webhook, go to your Discord server settings -> Integrations -> Webhooks -> New Webhook.</p>
            <p class="help-text"><b>Webhook URL:</b> Enter the URL of your Discord webhook. This is required for the script to function.</p>
            <p class="help-text"><b>Custom Username (Optional):</b> You can specify a custom username that will be displayed with each message sent to Discord. Leave this blank to use the default webhook username.</p>
            <p class="help-text"><b>Custom Avatar URL (Optional):</b> You can specify a custom avatar URL for the messages sent to Discord. Leave this blank to use the default webhook avatar.</p>
        `;
        guiContainer.appendChild(helpSection);

        // Create the Save button
        const saveButton = document.createElement("button");
        saveButton.id = "save-settings-button";
        saveButton.textContent = "Save Settings";
        saveButton.addEventListener("click", saveSettings);
        guiContainer.appendChild(saveButton);

        // Create the Close button
        const closeButton = document.createElement("button");
        closeButton.id = "close-gui-button";
        closeButton.textContent = "Close";
        closeButton.addEventListener("click", () => {
            guiContainer.style.display = "none";
        });
        guiContainer.appendChild(closeButton);

    };

    // --- Settings Functions ---

    const saveSettings = async () => {
        try {
            debug('[saveSettings] Saving settings');
            // Torn API Key
            settings.torn.api.key = document.getElementById("api-key").value;
            settings.torn.api.keyLevel = await checkApiKeyLevel(settings.torn.api.key);

            // Update the API key level display in the GUI
            const apiKeyLevelText = document.querySelector(".api-key-level-text");
            if (apiKeyLevelText) {
                apiKeyLevelText.textContent = settings.torn.api.keyLevel ? `Key Level: ${settings.torn.api.keyLevel === "faction" ? "Faction (or higher)" : "User"}` : '';
            }

            // Discord Webhook
            settings.discord.webhook.url = document.getElementById("webhook-url").value;
            settings.discord.webhook.username = document.getElementById("webhook-username").value;
            settings.discord.webhook.avatar_url = document.getElementById("webhook-avatar").value;

            // Save settings using GM_setValue
            GM_setValue("torn_api_key", settings.torn.api.key);
            GM_setValue("torn_api_key_level", settings.torn.api.keyLevel);
            GM_setValue("discord_webhook_url", settings.discord.webhook.url);
            GM_setValue("discord_webhook_username", settings.discord.webhook.username);
            GM_setValue("discord_webhook_avatar_url", settings.discord.webhook.avatar_url);

            alert("Settings saved!");
        } catch (error) {
            console.error(`[saveSettings] Error saving settings: ${error}`);
        }
    };

    const loadSettings = () => {
        // Load settings using GM_getValue
        debug('[loadSettings] Loading settings');
        settings.torn.api.key = GM_getValue("torn_api_key", "");
        settings.torn.api.keyLevel = GM_getValue("torn_api_key_level", "");
        settings.discord.webhook.url = GM_getValue("discord_webhook_url", "");
        settings.discord.webhook.username = GM_getValue("discord_webhook_username", "");
        settings.discord.webhook.avatar_url = GM_getValue("discord_webhook_avatar_url", "");
        debug('[loadSettings] Loaded settings:', settings);
    };

    // --- CSS Styles ---

    const addStyles = () => {
        GM_addStyle(`
            #torn-to-discord-gui {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #36393f; /* Dark gray background */
                border: 1px solid #ccc;
                padding: 20px;
                z-index: 1000;
                font-family: Arial, sans-serif;
                color: white; /* White text color */
            }

            #torn-to-discord-gui h3 {
                margin-top: 0;
                color: white; /* White text for headings */
            }

            #torn-to-discord-gui input[type="text"] {
                width: calc(100% - 22px); /* Adjust width to fix formatting */
                padding: 5px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                background-color: #40444b; /* Slightly darker background for inputs */
                color: white; /* White text for inputs */
            }

            #torn-to-discord-gui select {
                width: 100%;
                padding: 5px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                background-color: #40444b; /* Slightly darker background for select */
                color: white; /* White text for select */
            }

            #torn-to-discord-gui button {
                padding: 8px 15px;
                background-color: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
                margin-right: 5px;
            }

            #torn-to-discord-gui button:hover {
                background-color: #3e8e41;
            }

            #torn-to-discord-gui ul {
                padding-left: 20px;
                margin-top: 5px;
            }

            #torn-to-discord-gui a { /* Style for links */
                color: #1b87e5; /* Light blue link color */
                text-decoration: none;
            }

            #torn-to-discord-gui a:hover {
                text-decoration: underline;
            }

            .api-key-level-text {
                margin-top: -5px;
                margin-bottom: 10px;
            }

            #torn-to-discord-gui .help-text { /* Class for help text - slightly less bright */
                color: #ccc;
            }

            .select-post-button {
                padding: 5px 10px;
                background-color: #7289da; /* Discord Blue */
                color: white;
                border: none;
                cursor: pointer;
                margin-right: 5px;
                border-radius: 5px; /* Rounded corners */
                font-size: 12px; /* Smaller font size */
            }

            .select-post-button:hover {
                background-color: #677bc4; /* Darker shade on hover */
            }

            .select-post-button.selected {
                background-color: #5b6e9e; /* Even darker shade for selected state */
            }

            #send-selected-posts-button {
                padding: 8px 15px;
                background-color: #04aa6d;
                color: white;
                border: none;
                cursor: pointer;
                margin-top: 10px;
                font-size: 16px;
            }

            #send-selected-posts-button:hover {
                background-color: #048a58;
            }

            #selected-posts-display {
                margin-top: 5px;
                font-size: 14px;
            }

            #save-settings-button, #close-gui-button {
                margin: 5px;
                padding: 8px 16px;
                font-size: 14px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            #close-gui-button{
                background-color: #dc3545;
            }
            #close-gui-button:hover{
                background-color: #c82333;
            }
            #save-settings-button {
                background-color: #28a745;
            }
            #save-settings-button:hover {
                background-color: #218838;
            }
        `);
    };

    // --- Script Initialization ---

    const init = () => {
        addStyles();
        createGUI();

        // Hide GUI on startup
        document.getElementById("torn-to-discord-gui").style.display = "none";

        // Add a button to toggle the GUI
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "T2D Settings";
        toggleButton.style.position = "fixed";
        toggleButton.style.top = "10px";
        toggleButton.style.right = "10px";
        toggleButton.style.zIndex = 999;
        toggleButton.addEventListener("click", () => {
            const gui = document.getElementById("torn-to-discord-gui");
            gui.style.display = gui.style.display === "none" ? "block" : "none";
        });
        document.body.appendChild(toggleButton);

        // Get the target node for the observer
        const targetNode = document.querySelector('#forums-page-wrap');

        // Start observing for changes after a delay
        if (targetNode) {
            observer.observe(targetNode, {
                childList: true,
                subtree: true
            });
            debug('[Observer] Observer set up to watch for new posts within #forums-page-wrap');

            // Initial processing of posts after a delay
            setTimeout(processPosts, 2000);
        } else {
            console.error('[MutationObserver] Target node #forums-page-wrap not found.');
        }
    };

    // --- Start the script ---

    init();

})();