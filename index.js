// index.js
// Node 18+ (uses global fetch)

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { getTwitterFollowers, extractTwitterUsername } from "./twitterService.js";

// Load environment variables from .env file
dotenv.config();

// Debug: Log if environment variables are loaded
console.log("🔧 Environment check:");
console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? "✓ Loaded" : "✗ Missing"}`);
console.log(`   TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? "✓ Loaded" : "✗ Missing"}`);
console.log(`   TWITTERAPI_KEY: ${process.env.TWITTERAPI_KEY ? "✓ Loaded" : "✗ Missing"}`);
console.log("");

/* ================== CONFIG ================== */
const CHAINS = ["bsc", "solana", "base"]; // chains to watch
const POLL_MINUTES = 5;                     // how often to poll (minutes)
const LOOKBACK_HOURS = 1;                   // consider pairs created within this many hours
const MIN_LIQUIDITY = 6000;                 // minimum liquidity (USD) to report
const MIN_MARKET_CAP = 0;                   // minimum market cap (USD) to report (0 = no filter)
const MAX_MARKET_CAP = 0;                   // maximum market cap (USD) to report (0 = no limit)
const MIN_TWITTER_FOLLOWERS = 0;            // minimum Twitter followers (0 = no filter)
const TOP_N_FOR_NO_TIME = 50;              // heuristic: if no time field, accept only if index <= this
const REQUIRE_TWITTER = true;               // if true, skip tokens without Twitter/X account
const REQUIRE_WEBSITE = false;              // if true, skip tokens without website
const SEEN_FILE = path.resolve("./seen.json");

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN_HERE"; // Get from @BotFather
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "YOUR_CHAT_ID_HERE";     // Your chat/channel ID
const ENABLE_TELEGRAM = true;                      // Set to true to enable Telegram notifications

// TwitterAPI.io Configuration (Optional - for follower count)
const TWITTERAPI_KEY = process.env.TWITTERAPI_KEY || "YOUR_TWITTERAPI_KEY_HERE"; // Get from https://twitterapi.io
const ENABLE_TWITTER_FOLLOWERS = true;  // Set to true to fetch follower counts
/* ============================================ */

/* --- Helpers to load/save seen pairs --- */
function loadSeen() {
  try {
    const txt = fs.readFileSync(SEEN_FILE, "utf8");
    return JSON.parse(txt);
  } catch {
    return {}; // empty object if file missing or corrupt
  }
}
function saveSeen(obj) {
  try {
    fs.writeFileSync(SEEN_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error("Failed to save seen.json:", err.message);
  }
}

/* --- Safe JSON fetch helper with delay --- */
async function fetchJsonIfPossible(url) {
  try {
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const res = await fetch(url, { 
      headers: { 
        "User-Agent": "dex-watcher/1.0",
        "Accept": "application/json"
      } 
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw new Error("Not JSON payload");
    }
    return JSON.parse(trimmed);
  } catch (err) {
    throw err;
  }
}

/* --- Get token profiles to find new pairs --- */
async function fetchNewPairs(chain) {
  console.log(`Fetching new pairs for ${chain}...`);
  
  // Get token profiles which includes newly launched tokens
  const url = `https://api.dexscreener.com/token-profiles/latest/v1`;
  
  try {
    const data = await fetchJsonIfPossible(url);
    
    if (!Array.isArray(data)) {
      console.log(`  ✗ Unexpected data format from token profiles`);
      return [];
    }
    
    console.log(`  ✓ Got ${data.length} token profiles`);
    
    // Filter for our chain and get pairs for each token
    const chainTokens = data.filter(t => t.chainId?.includes(chain));
    console.log(`  ✓ Filtered to ${chainTokens.length} tokens on ${chain}`);
    
    // For each token, fetch its pairs
    const allPairs = [];
    let fetchCount = 0;
    const maxFetch = 200; // Limit to avoid rate limits
    
    for (const token of chainTokens.slice(0, maxFetch)) {
      if (!token.tokenAddress) continue;
      
      try {
        fetchCount++;
        console.log(`  [${fetchCount}/${Math.min(chainTokens.length, maxFetch)}] Fetching pairs for ${token.tokenAddress.substring(0, 8)}...`);
        
        const pairsUrl = `https://api.dexscreener.com/latest/dex/tokens/${token.tokenAddress}`;
        const pairData = await fetchJsonIfPossible(pairsUrl);
        
        if (pairData.pairs && Array.isArray(pairData.pairs)) {
          // Filter to only pairs on the target chain
          const chainPairs = pairData.pairs.filter(p => p.chainId === chain);
          console.log(`    → Found ${chainPairs.length} pairs`);
          allPairs.push(...chainPairs);
        }
      } catch (err) {
        console.log(`    → Failed to fetch pairs: ${err.message}`);
      }
    }
    
    console.log(`  ✓ Total pairs collected: ${allPairs.length}`);
    
    // Sort by liquidity descending, then by creation time
    allPairs.sort((a, b) => {
      const liqA = parseLiquidityUsd(a);
      const liqB = parseLiquidityUsd(b);
      if (liqB !== liqA) return liqB - liqA;
      
      const timeA = extractCreatedMs(a);
      const timeB = extractCreatedMs(b);
      return timeB - timeA;
    });
    
    return allPairs;
    
  } catch (err) {
    console.error(`  ✗ Failed to fetch token profiles: ${err.message}`);
    
    // Fallback: try getting boosted tokens
    try {
      console.log(`  → Trying boosted tokens fallback...`);
      const boostUrl = `https://api.dexscreener.com/token-boosts/latest/v1`;
      const boostData = await fetchJsonIfPossible(boostUrl);
      
      if (Array.isArray(boostData)) {
        const chainBoosts = boostData.filter(b => b.chainId === chain);
        console.log(`  ✓ Got ${chainBoosts.length} boosted tokens on ${chain}`);
        
        const pairs = [];
        for (const boost of chainBoosts.slice(0, 10)) {
          if (!boost.tokenAddress) continue;
          
          try {
            const pairsUrl = `https://api.dexscreener.com/latest/dex/tokens/${boost.tokenAddress}`;
            const pairData = await fetchJsonIfPossible(pairsUrl);
            
            if (pairData.pairs && Array.isArray(pairData.pairs)) {
              const chainPairs = pairData.pairs.filter(p => p.chainId === chain);
              pairs.push(...chainPairs);
            }
          } catch (e) {
            // Continue on error
          }
        }
        
        return pairs;
      }
    } catch (fallbackErr) {
      console.error(`  ✗ Fallback also failed: ${fallbackErr.message}`);
    }
    
    return [];
  }
}

/* --- Normalize possible time fields into ms (number) --- */
function normalizeTimestampToMs(val) {
  if (!val && val !== 0) return 0;
  const n = Number(val);
  if (Number.isNaN(n) || n <= 0) return 0;
  // if n looks like seconds (<= 1e11) convert to ms; if already ms (> 1e12) keep
  if (n < 1e11) return Math.round(n * 1000); // seconds -> ms
  return Math.round(n); // assume ms
}

function extractCreatedMs(pair) {
  // try multiple fields
  const candidates = [
    pair.pairCreatedAt,
    pair.createdAt,
    pair.firstTradeAt,
    pair.info?.createdAt,
    pair.info?.firstTradeAt,
    pair.firstTradeUnix,
  ];

  for (const c of candidates) {
    const ms = normalizeTimestampToMs(c);
    if (ms > 0) return ms;
  }
  return 0;
}

/* --- parse liquidity safely --- */
function parseLiquidityUsd(pair) {
  const raw = pair?.liquidity?.usd;
  if (raw === undefined || raw === null) return 0;
  const n = Number(raw);
  if (Number.isNaN(n)) return 0;
  return n;
}

/* --- check if token has Twitter/X account --- */
function hasTwitterAccount(pair) {
  // Check multiple possible locations for Twitter/X info
  const info = pair.info || {};
  const socials = info.socials || [];
  const links = pair.links || [];
  
  // Check in socials array
  for (const social of socials) {
    if (social.type === 'twitter' || social.platform === 'twitter') {
      return social.url || true;
    }
  }
  
  // Check in links array
  for (const link of links) {
    if (link.type === 'twitter' || link.label?.toLowerCase().includes('twitter') || link.label?.toLowerCase().includes('x.com')) {
      return link.url || true;
    }
  }
  
  // Check direct fields
  if (info.twitter || info.twitterUrl) {
    return info.twitter || info.twitterUrl;
  }
  
  // Check websites array for twitter/x links
  const websites = info.websites || [];
  for (const site of websites) {
    const url = site.url || site;
    if (typeof url === 'string' && (url.includes('twitter.com') || url.includes('x.com'))) {
      return url;
    }
  }
  
  return null;
}

/* --- check if token has website --- */
function hasWebsite(pair) {
  const info = pair.info || {};
  const websites = info.websites || [];
  const links = pair.links || [];
  
  if (websites.length > 0) {
    return websites[0].url || websites[0];
  }
  
  for (const link of links) {
    if (link.type === 'website' || link.label?.toLowerCase().includes('website')) {
      return link.url;
    }
  }
  
  return null;
}


/* --- Send message to Telegram --- */
async function sendTelegramMessage(message, imageUrl = null) {
  if (!ENABLE_TELEGRAM) {
    console.log("ℹ️ Telegram notifications are disabled (ENABLE_TELEGRAM = false)");
    return;
  }
  
  if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") {
    console.log("⚠️ Telegram is enabled but credentials are not configured!");
    return;
  }

  console.log("📤 Attempting to send Telegram message...");
  console.log(`   Chat ID: ${TELEGRAM_CHAT_ID}`);
  console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
  
  if (imageUrl) {
    console.log(`   Image URL: ${imageUrl}`);
  }

  try {
    let url, payload;
    
    // If we have an image, send as photo with caption
    if (imageUrl) {
      url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      payload = {
        chat_id: TELEGRAM_CHAT_ID,
        photo: imageUrl,
        caption: message,
        parse_mode: 'HTML',
      };
    } else {
      // Otherwise send as text message
      url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      };
    }

    console.log(`   Sending to: ${url.substring(0, 50)}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (!data.ok) {
      console.error(`❌ Telegram send failed: ${data.description || 'Unknown error'}`);
      console.error(`   Error code: ${data.error_code}`);
      
      // Helpful error messages
      if (data.error_code === 400) {
        console.error(`   💡 Tip: Check if your Chat ID is correct. Try sending a message to your bot first.`);
        // If image failed, try without image
        if (imageUrl) {
          console.log(`   ⚠️ Image might be invalid, retrying without image...`);
          return sendTelegramMessage(message, null);
        }
      } else if (data.error_code === 401) {
        console.error(`   💡 Tip: Your Bot Token might be incorrect. Get a new one from @BotFather.`);
      } else if (data.error_code === 403) {
        console.error(`   💡 Tip: The bot might be blocked. Start a conversation with your bot first.`);
      }
    } else {
      console.log(`✅ Telegram message sent successfully!`);
    }
  } catch (err) {
    console.error(`❌ Telegram error: ${err.message}`);
    console.error(`   Stack: ${err.stack}`);
  }
}

/* --- Format pair info for Telegram --- */
function formatTelegramMessage(pair, chain, rank, twitterFollowers = null) {
  const baseSym = pair.baseToken?.symbol || pair.baseToken?.name || "UNKNOWN";
  const quoteSym = pair.quoteToken?.symbol || pair.quoteToken?.name || "?";
  const id = pair.pairAddress || pair.pair || pair.address || "";
  const liquidity = parseLiquidityUsd(pair);
  const priceUsd = pair.priceUsd ? Number(pair.priceUsd) : null;
  const vol24 = pair.volume?.h24 ? Number(pair.volume.h24) : null;
  const txns24 = pair.txns?.h24 ? (pair.txns.h24.buys + pair.txns.h24.sells) : null;
  const twitterUrl = hasTwitterAccount(pair);
  const marketCap = pair.fdv || pair.marketCap || 0;
  const tokenImageUrl = pair.info?.imageUrl || pair.baseToken?.image || null;
  const dexUrl = pair.url || `https://dexscreener.com/${pair.chainId || chain}/${id}`;
  const createdMs = extractCreatedMs(pair);
  
  let message = `🚀 <b>NEW TOKEN ALERT</b> 🚀\n\n`;
  message += `<b>${baseSym}/${quoteSym}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⛓ <b>Chain:</b> ${(pair.chainId || chain).toUpperCase()}\n`;
  message += `💱 <b>DEX:</b> ${pair.dexId || "Unknown"}\n`;
  message += `💰 <b>Price:</b> ${priceUsd !== null ? priceUsd.toLocaleString() : "N/A"}\n`;
  message += `💧 <b>Liquidity:</b> ${liquidity.toLocaleString()}\n`;
  message += `📊 <b>Market Cap:</b> ${marketCap > 0 ? marketCap.toLocaleString() : "N/A"}\n`;
  
  if (vol24 !== null) {
    message += `📈 <b>Volume 24h:</b> ${vol24.toLocaleString()}\n`;
  }
  
  if (txns24 !== null) {
    message += `🔄 <b>Txns 24h:</b> ${txns24.toLocaleString()}\n`;
  }
  
  if (createdMs > 0) {
    const ageMinutes = Math.floor((Date.now() - createdMs) / 60000);
    message += `⏰ <b>Age:</b> ${ageMinutes < 60 ? `${ageMinutes}m` : `${Math.floor(ageMinutes/60)}h ${ageMinutes%60}m`}\n`;
  }
  
  message += `\n`;
  
  if (twitterUrl) {
    message += `🐦 <a href="${twitterUrl}">Twitter/X</a>`;
    if (twitterFollowers !== null && twitterFollowers > 0) {
      message += ` (${twitterFollowers.toLocaleString()} followers)`;
    }
    message += `\n`;
  }
  
  message += `📈 <a href="${dexUrl}">View on DexScreener</a>\n`;
  message += `\n<code>${id}</code>`;
  
  return { text: message, imageUrl: tokenImageUrl };
}

/* --- Test Telegram connection --- */
async function testTelegramConnection() {
  console.log("\n🧪 Testing Telegram Connection...\n");
  
  if (!ENABLE_TELEGRAM) {
    console.log("❌ ENABLE_TELEGRAM is set to false. Set it to true to test.");
    return false;
  }
  
  if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
    console.log("❌ TELEGRAM_BOT_TOKEN is not configured.");
    return false;
  }
  
  if (TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") {
    console.log("❌ TELEGRAM_CHAT_ID is not configured.");
    return false;
  }
  
  console.log("✅ Configuration looks good!");
  console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 15)}...`);
  console.log(`   Chat ID: ${TELEGRAM_CHAT_ID}`);
  
  // Test 1: Get bot info
  console.log("\n📋 Test 1: Getting bot info...");
  try {
    const botInfoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
    const botInfoRes = await fetch(botInfoUrl);
    const botInfo = await botInfoRes.json();
    
    if (botInfo.ok) {
      console.log(`✅ Bot connected: @${botInfo.result.username}`);
      console.log(`   Bot name: ${botInfo.result.first_name}`);
    } else {
      console.log(`❌ Failed to get bot info: ${botInfo.description}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Error getting bot info: ${err.message}`);
    return false;
  }
  
  // Test 2: Send test message
  console.log("\n📤 Test 2: Sending test message...");
  const testMsg = `🧪 <b>Test Message</b>\n\nIf you see this, your Telegram bot is working correctly!\n\n⏰ ${new Date().toLocaleString()}`;
  await sendTelegramMessage(testMsg, null);
  
  console.log("\n✅ Test complete! Check your Telegram for the message.");
  return true;
}

/* --- Main scan routine --- */
async function scanOnce() {
  console.log(`\n🔍 Scan start: ${new Date().toLocaleString()}`);
  const seen = loadSeen();
  const now = Date.now();
  const lookbackMs = LOOKBACK_HOURS * 60 * 60 * 1000;

  for (const chain of CHAINS) {
    console.log(`\n--- Chain: ${chain.toUpperCase()} ---`);
    const pairs = await fetchNewPairs(chain);
    console.log(`Processing ${pairs.length} candidate pairs for ${chain}`);

    if (!seen[chain]) seen[chain] = {};

    let foundCount = 0;
    let processedCount = 0;

    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      const rank = i + 1;
      const id = p.pairAddress || p.pair || p.address || "";
      const baseSym = p.baseToken?.symbol || p.baseToken?.name || "UNKNOWN";
      const quoteSym = p.quoteToken?.symbol || p.quoteToken?.name || "?";

      if (!id) {
        continue;
      }

      if (seen[chain][id]) {
        // Already reported previously
        continue;
      }

      processedCount++;

      // Try to get creation time
      const createdMs = extractCreatedMs(p);
      let passesTime = false;
      if (createdMs > 0) {
        const age = now - createdMs;
        if (age <= lookbackMs) {
          passesTime = true;
        } else {
          if (processedCount <= 10) {
            console.log(`- [${rank}] skip by time (age ${(age/60000).toFixed(1)} min) ${baseSym}/${quoteSym}`);
          }
          continue;
        }
      } else {
        // No time field -> apply heuristic: only accept if within TOP_N_FOR_NO_TIME
        if (rank <= TOP_N_FOR_NO_TIME) {
          passesTime = true;
          console.log(`- [${rank}] no time field but within TOP ${TOP_N_FOR_NO_TIME}; treating as new: ${baseSym}/${quoteSym}`);
        } else {
          continue;
        }
      }

      // Liquidity check
      const liquidity = parseLiquidityUsd(p);
      if (liquidity === 0) {
        if (processedCount <= 10) {
          console.log(`  ⚠️ [${rank}] missing liquidity for ${baseSym}/${quoteSym} — skipping`);
        }
        continue;
      }
      if (liquidity < MIN_LIQUIDITY) {
        if (processedCount <= 10) {
          console.log(`  ℹ️ [${rank}] low liquidity ${liquidity.toLocaleString()} < ${MIN_LIQUIDITY} — skipping`);
        }
        continue;
      }

      // Market cap check
      const marketCap = p.fdv || p.marketCap || 0;
      if (MIN_MARKET_CAP > 0 && marketCap > 0 && marketCap < MIN_MARKET_CAP) {
        if (processedCount <= 10) {
          console.log(`  ℹ️ [${rank}] market cap too low ${marketCap.toLocaleString()} < ${MIN_MARKET_CAP} — skipping`);
        }
        continue;
      }
      if (MAX_MARKET_CAP > 0 && marketCap > MAX_MARKET_CAP) {
        if (processedCount <= 10) {
          console.log(`  ℹ️ [${rank}] market cap too high ${marketCap.toLocaleString()} > ${MAX_MARKET_CAP} — skipping`);
        }
        continue;
      }

      // Website check
      if (REQUIRE_WEBSITE) {
        const websiteUrl = hasWebsite(p);
        if (!websiteUrl) {
          if (processedCount <= 10) {
            console.log(`  🚫 [${rank}] no website for ${baseSym}/${quoteSym} — skipping`);
          }
          continue;
        }
      }

      // Twitter/X account check
      const twitterUrl = hasTwitterAccount(p);
      if (REQUIRE_TWITTER) {
        if (!twitterUrl) {
          if (processedCount <= 10) {
            console.log(`  🚫 [${rank}] no Twitter/X account for ${baseSym}/${quoteSym} — skipping`);
          }
          continue;
        }
      }

      // Fetch Twitter followers if enabled
      let twitterFollowers = null;
      if (twitterUrl && ENABLE_TWITTER_FOLLOWERS) {
        console.log(`   🔍 Twitter URL found: ${twitterUrl}`);
        const username = extractTwitterUsername(twitterUrl);
        console.log(`   👤 Extracted username: ${username || 'FAILED TO EXTRACT'}`);
        
        if (username) {
          twitterFollowers = await getTwitterFollowers(username, TWITTERAPI_KEY);
          console.log(`   📊 Follower count result: ${twitterFollowers !== null ? twitterFollowers.toLocaleString() : 'NULL (API failed)'}`);
          
          // Check minimum followers requirement
          if (MIN_TWITTER_FOLLOWERS > 0 && (twitterFollowers === null || twitterFollowers < MIN_TWITTER_FOLLOWERS)) {
            if (processedCount <= 10) {
              console.log(`  🚫 [${rank}] insufficient followers (${twitterFollowers || 0}) < ${MIN_TWITTER_FOLLOWERS} for ${baseSym}/${quoteSym} — skipping`);
            }
            continue;
          }
        } else {
          console.log(`   ⚠️ Could not extract username from: ${twitterUrl}`);
        }
      } else {
        if (!twitterUrl) {
          console.log(`   ℹ️ No Twitter URL found for this token`);
        } else if (!ENABLE_TWITTER_FOLLOWERS) {
          console.log(`   ℹ️ Twitter follower fetching is disabled (ENABLE_TWITTER_FOLLOWERS = false)`);
        }
      }

      // Passed all checks -> report
      foundCount++;
      const priceUsd = p.priceUsd ? Number(p.priceUsd) : null;
      const vol24 = p.volume?.h24 ? Number(p.volume.h24) : null;
      const txns24 = p.txns?.h24 ? (p.txns.h24.buys + p.txns.h24.sells) : null;
      const MarketCap = p.fdv || p.marketCap || 0;
      const tokenImageUrl = p.info?.imageUrl || p.baseToken?.image || null;
      const description = p.baseToken?.description || p.baseToken?.name || "No description";
      const url = p.url || `https://dexscreener.com/${p.chainId || chain}/${id}`;

      console.log(`
  ✅ NEW PAIR [${rank}] ${baseSym}/${quoteSym}
    - Pair ID: ${id}
    - Chain: ${p.chainId || chain}
    - DEX: ${p.dexId || "?"}
    - Price USD: ${priceUsd !== null ? `${priceUsd}` : "?"}
    - Liquidity USD: ${liquidity.toLocaleString()}
    - Market Cap: ${marketCap > 0 ? marketCap.toLocaleString() : "N/A"}
    - Volume 24h: ${vol24 !== null ? "$" + vol24.toLocaleString() : "?"}
    - Txns 24h: ${txns24 !== null ? txns24.toLocaleString() : "?"}
    - Twitter/X: ${twitterUrl || "None"}
    - Followers: ${twitterFollowers !== null ? twitterFollowers.toLocaleString() : "N/A"}
    - Token Image: ${tokenImageUrl || "None"}
    - Description: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}
    - Link: ${url}
    - Created: ${createdMs > 0 ? new Date(createdMs).toLocaleString() : "n/a"}
      `);

      // Send to Telegram
      if (ENABLE_TELEGRAM) {
        console.log(`   📱 Preparing Telegram message with follower count: ${twitterFollowers}`);
        const telegramData = formatTelegramMessage(p, chain, rank, twitterFollowers);
        console.log(`   📤 Telegram message preview (first 200 chars):\n${telegramData.text.substring(0, 200)}`);
        await sendTelegramMessage(telegramData.text, telegramData.imageUrl);
      }

      // Mark as seen
      seen[chain][id] = now;
    } // end pairs loop

    if (foundCount === 0) {
      console.log(`No new acceptable pairs found on ${chain.toUpperCase()}`);
    } else {
      console.log(`✨ Found ${foundCount} new pair(s) on ${chain.toUpperCase()}`);
    }
  } // end chains loop

  // persist seen
  saveSeen(seen);
  console.log(`\n✅ Scan finished: ${new Date().toLocaleString()}`);
}

/* --- Run immediately and schedule --- */
(async () => {
  // Check if user wants to test Telegram
  const args = process.argv.slice(2);
  if (args.includes('--test-telegram')) {
    await testTelegramConnection();
    process.exit(0);
  }
  
  try {
    await scanOnce();
  } catch (err) {
    console.error("❌ Scan failed:", err.message);
  }
  setInterval(async () => {
    try {
      await scanOnce();
    } catch (err) {
      console.error("❌ Scan failed:", err.message);
    }
  }, POLL_MINUTES * 60 * 1000);
})();