// ==UserScript==
// @name         Torn Forum to Discord Post
// @namespace    https://github.com/gnsc4
// @version      1.0.5
// @description  Sends Torn Forum posts to Discord via webhook
// @author       GNSC4 [2779998]
// @match        https://www.torn.com/forums.php*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      discord.com
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const settings = {
        torn: {
            api: {
                key: "", // your torn api key here
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
                url: "", // your discord webhook url here
                username: "", // your discord webhook username here
                avatar_url: "", // your discord webhook avatar url here
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
        }
    };

    const cache = {};

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
                    url: `https://api.torn.com/${endpoint}?key=${apiKey}&comment=TornForumToDiscordScript`,
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
                    parsedContent += `[${player.name}](https://www.torn.com/profiles.php?XID=${playerId})`;
                } else {
                    parsedContent += `[Player ${playerId}](https://www.torn.com/profiles.php?XID=${playerId})`;
                }
            } else if (factionId) {
                const faction = await fetchFaction(factionId);
                if (faction && faction.faction_name) {
                    parsedContent += `[${faction.faction_name}](https://www.torn.com/factions.php?step=profile&ID=${factionId})`;
                } else {
                    parsedContent += `[Faction ${factionId}](https://www.torn.com/factions.php?step=profile&ID=${factionId})`;
                }
            } else if (linkUrl && linkText) {
                parsedContent += `[${linkText}](${linkUrl})`;
            } else if (quoteAuthor && quoteContent) {
                parsedContent += `> **${quoteAuthor}:** ${quoteContent}\n`;
            } else if (imgUrl) {
                if (imgAlt) {
                  parsedContent += `\n[${imgAlt}](${imgUrl})\n`;
                } else {
                  parsedContent += `\n${imgUrl}\n`; // Just the link if no alt text
                }
            } else if (sizeValue && sizeContent) {
                parsedContent += `<font size="${sizeValue}">${sizeContent}</font>`;
            } else if (colorValue && colorContent) {
                parsedContent += `<font color="${colorValue}">${colorContent}</font>`;
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

    const processPosts = async() => {
        const posts = document.querySelectorAll(".post-container");
        debug(`[Posts] Found ${posts.length} posts`);

        for (const post of posts) {
            const contentElement = post.querySelector(".post");
            if (!contentElement) continue;

            const content = contentElement.innerHTML;
            const parsedContent = await parseContent(content);
            await postToDiscord(parsedContent);
            debug(`[Post] Processed post: ${parsedContent.substring(0, 50)}...`);
        }
    };

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
                            await postToDiscord(parsedContent);
                            debug(`[Mutation] Processed new post: ${parsedContent.substring(0, 50)}...`);
                        }
                    }
                }
            }
        }
    });

    const targetNode = document.querySelector("#forums-page-wrap .posts-list");
    if (targetNode) {
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
        debug(`[Observer] Observing for new posts...`);
        processPosts();
    }

})();