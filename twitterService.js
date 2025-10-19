// twitterService.js
// Service for fetching Twitter/X account information using TwitterAPI.io

/**
 * Extract Twitter username from various URL formats
 * @param {string} twitterUrl - Twitter/X URL or username
 * @returns {string|null} - Extracted username or null
 */
export function extractTwitterUsername(twitterUrl) {
  if (!twitterUrl || typeof twitterUrl !== "string") return null;
  
  try {
    // Handle different Twitter URL formats including tweet URLs
    const patterns = [
      // Tweet URL format: https://x.com/username/status/123 or https://twitter.com/username/status/123
      /(?:twitter|x)\.com\/([^/?]+)\/status\/\d+/i,
      // Profile URL format: https://x.com/username or https://twitter.com/username
      /(?:twitter|x)\.com\/([^/?]+)/i,
      // Just username with or without @
      /@?([a-zA-Z0-9_]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = twitterUrl.match(pattern);
      if (match && match[1]) {
        const username = match[1].replace("@", "").trim();
        // Filter out common Twitter paths that aren't usernames
        if (!['home', 'explore', 'notifications', 'messages', 'i', 'settings'].includes(username.toLowerCase())) {
          return username;
        }
      }
    }
    
    return null;
  } catch (err) {
    console.warn(`⚠️ Failed to parse Twitter username from: ${twitterUrl}`);
    return null;
  }
}

/**
 * Fetch Twitter user information including follower count using TwitterAPI.io
 * @param {string} username - Twitter username (without @)
 * @param {string} apiKey - TwitterAPI.io API key
 * @returns {Promise<Object|null>} - User info object or null on error
 */
export async function getTwitterUserInfo(username, apiKey) {
  if (!apiKey || apiKey === "YOUR_TWITTERAPI_KEY_HERE") {
    console.log("   ⚠️ TwitterAPI.io API key not configured, skipping follower count");
    return null;
  }
  
  try {
    console.log(`   🐦 Fetching Twitter info for @${username}...`);
    
    // Add small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // TwitterAPI.io endpoint to get user information by username
    // Try RESTful path parameter format
    const userUrl = `https://api.twitterapi.io/twitter/user/${encodeURIComponent(username)}`;
    
    const response = await fetch(userUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'User-Agent': 'dex-watcher/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`   ⚠️ TwitterAPI.io error (${response.status}): ${errorText.substring(0, 200)}`);
      
      // Handle different error codes
      if (response.status === 429) {
        console.warn(`   ⚠️ TwitterAPI.io rate limit reached, will retry later`);
      } else if (response.status === 401 || response.status === 403) {
        console.warn(`   ⚠️ Invalid API key. Get a valid key from https://twitterapi.io`);
      } else if (response.status === 404) {
        console.warn(`   ⚠️ User @${username} not found`);
      }
      
      return null;
    }
    
    const result = await response.json();
    
    // Log the raw response for debugging
    console.log(`   📦 API Response:`, JSON.stringify(result, null, 2));
    
    // Check response status
    if (result.status === 'error') {
      console.warn(`   ⚠️ TwitterAPI.io returned error: ${result.message || result.msg || 'Unknown error'}`);
      return null;
    }
    
    // Check if we got valid user data - TwitterAPI.io returns data in 'data' field
    if (result && result.data) {
      const userData = result.data;
      const followers = userData.followers || 0;
      
      console.log(`   ✅ @${username} has ${followers.toLocaleString()} followers`);
      
      return {
        username: userData.userName || username,
        name: userData.name,
        followers: followers,
        following: userData.following || 0,
        verified: userData.isBlueVerified || false,
        created_at: userData.createdAt,
        description: userData.description
      };
    }
    
    console.warn(`   ⚠️ TwitterAPI.io returned unexpected data structure:`, JSON.stringify(result).substring(0, 200));
    return null;
  } catch (err) {
    console.warn(`   ⚠️ Failed to fetch info for @${username}: ${err.message}`);
    console.warn(`   Stack: ${err.stack}`);
    return null;
  }
}

/**
 * Fetch just the follower count for a Twitter user
 * @param {string} username - Twitter username (without @)
 * @param {string} apiKey - TwitterAPI.io API key
 * @returns {Promise<number|null>} - Follower count or null on error
 */
export async function getTwitterFollowers(username, apiKey) {
  const userInfo = await getTwitterUserInfo(username, apiKey);
  return userInfo ? userInfo.followers : null;
}

