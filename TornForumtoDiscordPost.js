// ==UserScript==
// @name         Torn Forum to Discord Post
// @namespace    https://github.com/gnsc4
// @version      1.0.8
// @description  Sends Torn Forum posts to Discord via webhook
// @author       GNSC4 [2779998]
// @match        https://www.torn.com/forums.php*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @connect      discord.com
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const settings = {
        torn: {
            api: {
                key: "",
                keyLevel: ""
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
            mode: true,
            log: {
                all: false,
            }
        },
        cache: {
            enabled: true,
            expiration: 60, // minutes
        },
        selectedPosts: [] // Array to store selected posts
    };

    const cache = {};

    // --- Helper Functions ---

    const debug = (...args) => {
        if (settings.debug.mode) {
            console.debug(...args);
        }
    };

    const log = (...args) => {
        if (settings.debug.log.all) {
            console.log(...args);
        }
    };

    const loadScript = (url, callback) => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
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
            expiry: now.getTime() + (expiration * 60 * 1000),
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

    const fetchTornApi = async(endpoint) => {
        const apiKey = settings.torn.api.key;
        const cachedData = getCache(endpoint);
        if (cachedData) {
            debug(`[Cache] Fetched data from cache for ${endpoint}`);
            return cachedData;
        }
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://api.torn.com/<span class="math-inline">\{endpoint\}?key\=</span>{apiKey}&comment=TornForumToDiscordScript`,
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response);
                        } else {
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        reject(error);
                    }
                });
            });
            if (!response.responseText) {
                throw new Error('Empty response received from Torn API');
            }
            const data = JSON.parse(response.responseText);
            setCache(endpoint, data, settings.cache.expiration);
            debug(`[API] Fetched data from API for ${endpoint}`);
            return data;
        } catch (error) {
            console.error(`Error fetching Torn API data: ${error}`);
            return null;
        }
    };

    const fetchPlayer = async(playerId) => {
        const endpoint = `user/${playerId}`;
        return await fetchTornApi(endpoint);
    };

    const fetchFaction = async(factionId) => {
        const endpoint = `faction/${factionId}`;
        return await fetchTornApi(endpoint);
    };

    // --- Content Parsing ---

    const parseContent = async(content) => {
        // Regular expression to match different elements
        const regex = /\[player=(\d+)\]|\[faction=(\d+)\]|\[link=(.*?)\](.*?)\[\/link\]|\[quote=(.*?)(?:&quot;|\u201D|\u201C)(?: timestamp=.*?)?\](.*?)\[\/quote\]|\[img=(.*?)(?:&quot;|\u201D|\u201C)(?: alt=.*?)?\](.*?)\[\/img\]|\[size=(\d+)\](.*?)\[\/size\]|\[color=(.*?)\](.*?)\[\/color\]|\[b\](.*?)\[\/b\]|\[i\](.*?)\[\/i\]|\[u\](.*?)\[\/u\]|\[s\](.*?)\[\/s\]|\[center\](.*?)\[\/center\]|\[right\](.*?)\[\/right\]|\[left\](.*?)\[\/left\]|\[list\](.*?)\[\/list\]|\[\*\](.*?)\[\/\*\]|\[code\](.*?)\[\/code\]/g;

        let parsedContent = "";
        let match;

        while ((match = regex.exec(content)) !== null) {
            const [fullMatch, playerId, factionId, linkUrl, linkText, quoteAuthor, quoteContent, imgUrl, imgAlt, sizeValue, sizeContent, colorValue, colorContent, boldContent, italicContent, underlineContent, strikethroughContent, centerContent, rightContent, leftContent, listContent, listItemContent, codeContent] = match;

            log(`[Match] ${fullMatch}`);

            if (playerId) {
                const player = await fetchPlayer(playerId);
                if (player && player.name) {
                    parsedContent += `[<span class="math-inline">\{player\.name\}\]\(https\://www\.torn\.com/profiles\.php?XID\=</span>{playerId})`;
                } else {
                    parsedContent += `[Player <span class="math-inline">\{playerId\}\]\(https\://www\.torn\.com/profiles\.php?XID\=</span>{playerId})`;
                }
            } else if (factionId) {
                const faction = await fetchFaction(factionId);
                if (faction && faction.faction_name) {
                    parsedContent += `[<span class="math-inline">\{faction\.faction\_name\}\]\(https\://www\.torn\.com/factions\.php?step\=profile&ID\=</span>{factionId})`;
                } else {
                    parsedContent += `[Faction <span class="math-inline">\{factionId\}\]\(https\://www\.torn\.com/factions\.php?step\=profile&ID\=</span>{factionId})`;
                }
            } else if (linkUrl && linkText) {
                parsedContent += `[<span class="math-inline">\{linkText\}\]\(</span>{linkUrl})`;
            } else if (quoteAuthor && quoteContent) {
                parsedContent += `> **${quoteAuthor}:** ${quoteContent}\n`;
            } else if (imgUrl) {
                if (imgAlt) {
                  parsedContent += `\n[<span class="math-inline">\{imgAlt\}\]\(</span>{imgUrl})\n`;
                } else {
                  parsedContent += `\n${imgUrl}\n`; // Just the link if no alt text
                }
            } else if (sizeValue && sizeContent) {
                parsedContent += `<font size="<span class="math-inline">\{sizeValue\}"\></span>{sizeContent}</font>`;
            } else if (colorValue && colorContent) {
                parsedContent += `<font color="<span class="math-inline">\{colorValue\}"\></span>{colorContent}</font>`;
            } else if (boldContent) {
                parsedContent += `**${boldContent}**`;
            } else if (italicContent) {
                parsedContent += `*${italicContent}*`;
            } else if (underlineContent) {
                parsedContent += `<u>${underlineContent}</u>`;
            } else if (strikethroughContent) {
                parsedContent += `~~${strikethroughContent}~~`;
            } else if (centerContent) {
                parsedContent += `<center>${centerContent}</center>`;
            } else if (rightContent) {
                parsedContent += `<div align="right">${rightContent}</div>`;
            } else if (leftContent) {
                parsedContent += `<div align="left">${leftContent}</div>`;
            } else if (listContent) {
                parsedContent += `${listContent}`;
            } else if (listItemContent) {
                parsedContent += `* ${listItemContent}\n`;
            } else if (codeContent) {
                parsedContent += `\`\`\`\n${codeContent}\n\`\`\``;
            } else {
                parsedContent += fullMatch;
            }
        }

        // Replace line breaks with markdown equivalent
        parsedContent = parsedContent.replace(/\n/g, "  \n");

        return parsedContent;
    };

    // --- Discord Functions ---

    const postToDiscord = async(content) => {
        const webhookUrl = settings.discord.webhook.url;
        const username = settings.discord.webhook.username;
        const avatarUrl = settings.discord.webhook.avatar_url;
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: webhookUrl,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify({
                        username: username,
                        avatar_url: avatarUrl,
                        content: content,
                    }),
                    onload: (response) => {
                        if (response.status === 204) {
                            resolve(response);
                        } else {
                            reject(response);
                        }
                    },
                    onerror: (error) => {
                        reject(error);
                    }
                });
            });
            debug("[Discord] Post successful");
        } catch (error) {
            console.error(`Error posting to Discord:`, error);
        }
    };

    // --- Post Selection Functions ---

    const selectPost = (postId) => {
        const index = settings.selectedPosts.indexOf(postId);
        if (index > -1) {
            settings.selectedPosts.splice(index, 1); // Remove post if already selected
            debug(`[Post Selection] Removed post ${postId} from selection`);
        } else {
            settings.selectedPosts.push(postId); // Add post if not selected
            debug(`[Post Selection] Added post ${postId} to selection`);
        }
        updateSelectedPostsDisplay();
    };
    const sendSelectedPosts = async () => {
      debug(`[Post Selection] Sending ${settings.selectedPosts.length} selected posts`);
      for (const postId of settings.selectedPosts) {
          const postElement = document.querySelector(`.post-container[data-post="${postId}"] .post`);
          if (postElement) {
              const content = postElement.innerHTML;
              const parsedContent = await parseContent(content);
              await postToDiscord(parsedContent);
              debug(`[Post Selection] Sent post ${postId} to Discord`);
          }
      }
      settings.selectedPosts = []; // Clear the selection after sending
      updateSelectedPostsDisplay();
    };

    const updateSelectedPostsDisplay = () => {
        const selectedPostsDisplay = document.getElementById("selected-posts-display");
        if (selectedPostsDisplay) {
            selectedPostsDisplay.textContent = `Selected Posts: ${settings.selectedPosts.length}`;
        }
    };

    // --- Post Processing ---

    const processPosts = async() => {
        const posts = document.querySelectorAll(".post-container");
        debug(`[Posts] Found ${posts.length} posts`);

        for (const post of posts) {
            const postId = post.getAttribute("data-post");
            if (!postId) continue;

            // Add a "Select Post" button to each post
            const selectButton = document.createElement("button");
            selectButton.textContent = "Select Post";
            selectButton.classList.add("select-post-button");
            selectButton.addEventListener("click", () => {
                selectPost(postId);
                selectButton.classList.toggle("selected"); // Toggle visual indicator
            });

            // Find the reply button's parent (usually a div or li) and insert the select button before it
            const ql_parent = post.querySelector(".post-wrap .info-wrap .quick-link.icon-reply").parentNode;
            if (ql_parent) {
              ql_parent.insertBefore(selectButton, post.querySelector(".post-wrap .info-wrap .quick-link.icon-reply"));
            } else {
                console.error("Could not find the parent element of the reply button to insert the Select Post button.");
            }

            // Add data-post attribute to identify the post
            post.setAttribute("data-post", postId);
        }
        const sendButton = document.createElement("button");
        sendButton.textContent = "Send Selected Posts";
        sendButton.id = "send-selected-posts-button";
        sendButton.addEventListener("click", sendSelectedPosts);

        const selectedPostsDisplay = document.createElement("div");
        selectedPostsDisplay.id = "selected-posts-display";
        selectedPostsDisplay.textContent = `Selected Posts: 0`;

        const target = document.querySelector("#forums-page-wrap");
        if (target) {
            target.parentNode.insertBefore(sendButton, target);
            target.parentNode.insertBefore(selectedPostsDisplay, target);
        } else {
            console.error("Could not find the target element to insert the Send Selected Posts button and display.");
        }

    };

    // --- Mutation Observer ---

    const observer = new MutationObserver(async(mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.classList && node.classList.contains("post-container")) {
                        debug(`[Mutation] New post detected`);
                        const contentElement = node.querySelector(".post");
                        if (contentElement) {
                            const content = contentElement.innerHTML;
                            const parsedContent = await parseContent(content);
                            // Do not send to Discord automatically anymore - only on button press
                            // await postToDiscord(parsedContent);
                            debug(`[Mutation] Processed new post: ${parsedContent.substring(0, 50)}...`);
                        }
                    }
                }
            }
        }
    });

    // --- GUI Functions ---

    const createGUI = () => {
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
            <select id="api-key-level">
                <option value="user" ${settings.torn.api.keyLevel === "user" ? "selected" : ""}>User Level</option>
                <option value="faction" ${settings.torn.api.keyLevel === "faction" ? "selected" : ""}>Faction Level</option>
            </select>
        `;
        guiContainer.appendChild(apiKeySection);

        // Create the Discord Webhook section
        const discordSection = document.createElement("div");
        discordSection.innerHTML = `
            <h3>Discord Webhook</h3>
            <input type="text" id="webhook-url" placeholder="Enter your Discord webhook URL" value="${settings.discord.webhook.url}">
            <input type="text" id="webhook-username" placeholder="Enter a custom username (optional)" value="${settings.discord.webhook.username}">
            <input type="text" id="webhook-avatar" placeholder="Enter a custom avatar URL (optional)" value="${settings.discord.webhook.avatar_url}">
        `;
        guiContainer.appendChild(discordSection);

        // Create the Help section
        const helpSection = document.createElement("div");
        helpSection.innerHTML = `
            <h3>Help</h3>
            <p><b>Torn API Key:</b> You can find your API key at <a href="https://www.torn.com/preferences.php#tab=api" target="_blank">https://www.torn.com/preferences.php#tab=api</a></p>
            <p><b>API Key Level:</b> Choose the level of access for your API key based on your needs:</p>
            <ul>
                <li><b>Public Key:</b> Required for reading user-related information (e.g., player names from forum posts).</li>
                <li><b>Limited Key:</b> Required if you want to fetch faction names from faction links in forum posts.</li>
            </ul>
            <p><b>Discord Webhook:</b> To create a webhook, go to your Discord server settings -> Integrations -> Webhooks -> New Webhook.</p>
            <p><b>Webhook URL:</b> Enter the URL of your Discord webhook. This is required for the script to function.</p>
            <p><b>Custom Username (Optional):</b> You can specify a custom username that will be displayed with each message sent to Discord. Leave this blank to use the default webhook username.</p>
            <p><b>Custom Avatar URL (Optional):</b> You can specify a custom avatar URL for the messages sent to Discord. Leave this blank to use the default webhook avatar.</p>
        `;
        guiContainer.appendChild(helpSection);

        // Create the Save button
        const saveButton = document.createElement("button");
        saveButton.textContent = "Save Settings";
        saveButton.addEventListener("click", saveSettings);
        guiContainer.appendChild(saveButton);
        // Create the Close button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.addEventListener("click", () => {
            guiContainer.style.display = "none";
        });
        guiContainer.appendChild(closeButton);

    };

    // --- Settings Functions ---

    const saveSettings = () => {
        // Torn API Key
        settings.torn.api.key = document.getElementById("api-key").value;
        settings.torn.api.keyLevel = document.getElementById("api-key-level").value;

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
    };

    const loadSettings = () => {
        // Load settings using GM_getValue
        settings.torn.api.key = GM_getValue("torn_api_key", "");
        settings.torn.api.keyLevel = GM_getValue("torn_api_key_level", "user");
        settings.discord.webhook.url = GM_getValue("discord_webhook_url", "");
        settings.discord.webhook.username = GM_getValue("discord_webhook_username", "");
        settings.discord.webhook.avatar_url = GM_getValue("discord_webhook_avatar_url", "");

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
                width: calc(100% - 12px); /* Adjust width to fix formatting */
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
        `);
    };

    // --- Script Initialization ---

    const init = () => {
        addStyles();
        createGUI();
        // Display GUI on startup or set it to hidden initially and add a button to open it later.
        // For now, let's display it on startup:
        //document.getElementById("torn-to-discord-gui").style.display = "block";

        // Alternatively, hide it on startup:
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

        const targetNode = document.querySelector("#forums-page-wrap .posts-list");
        if (targetNode) {
            observer.observe(targetNode, {
                childList: true,
                subtree: true
            });
            debug(`[Observer] Observing for new posts...`);
            processPosts();
        }
    };

    // --- Start the script ---

    init();

})();