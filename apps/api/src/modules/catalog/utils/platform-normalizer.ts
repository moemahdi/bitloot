/**
 * Platform Normalization Utility
 * 
 * Standardizes platform names from various sources (Kinguin, user input, etc.)
 * to consistent, display-friendly names.
 */

/**
 * Platform normalization mapping
 * Keys are lowercase variations, values are the standardized display names
 */
const PLATFORM_NORMALIZATION: Record<string, string> = {
  // Steam
  'steam': 'Steam',
  'steam cd key': 'Steam',
  'steam key': 'Steam',
  'steam gift': 'Steam',
  
  // Epic Games
  'epic': 'Epic Games',
  'epic games': 'Epic Games',
  'epic games store': 'Epic Games',
  'egs': 'Epic Games',
  
  // GOG
  'gog': 'GOG',
  'gog.com': 'GOG',
  'gog key': 'GOG',
  
  // Ubisoft Connect (formerly Uplay)
  'uplay': 'Ubisoft Connect',
  'ubisoft': 'Ubisoft Connect',
  'ubisoft connect': 'Ubisoft Connect',
  
  // EA (formerly Origin)
  'origin': 'EA App',
  'ea': 'EA App',
  'ea app': 'EA App',
  'ea play': 'EA App',
  
  // Battle.net (Blizzard)
  'battle.net': 'Battle.net',
  'battlenet': 'Battle.net',
  'blizzard': 'Battle.net',
  
  // Microsoft
  'microsoft': 'Microsoft Store',
  'microsoft store': 'Microsoft Store',
  'windows': 'Windows',
  'xbox': 'Xbox',
  'xbox live': 'Xbox',
  'xbox one': 'Xbox',
  'xbox series': 'Xbox',
  'xbox game pass': 'Xbox Game Pass',
  
  // PlayStation
  'playstation': 'PlayStation',
  'ps': 'PlayStation',
  'psn': 'PlayStation',
  'ps4': 'PlayStation',
  'ps5': 'PlayStation',
  'playstation network': 'PlayStation',
  
  // Nintendo
  'nintendo': 'Nintendo',
  'switch': 'Nintendo Switch',
  'nintendo switch': 'Nintendo Switch',
  'eshop': 'Nintendo eShop',
  'nintendo eshop': 'Nintendo eShop',
  
  // Rockstar
  'rockstar': 'Rockstar Games',
  'rockstar games': 'Rockstar Games',
  'rockstar games launcher': 'Rockstar Games',
  
  // Other
  'bethesda': 'Bethesda',
  'bethesda.net': 'Bethesda',
  'pc': 'PC',
  'other': 'Other',
  'global': 'Global',
  
  // Subscription / streaming platforms
  'amazon': 'Amazon',
  'google play': 'Google Play',
  'apple': 'Apple',
  'itunes': 'iTunes',
  'spotify': 'Spotify',
  'netflix': 'Netflix',
  'discord': 'Discord',
  'twitch': 'Twitch',
};

/**
 * Normalize a platform name to its standardized display name
 * 
 * @param platform - Raw platform name from any source
 * @returns Standardized platform name
 * 
 * @example
 * normalizePlatform('steam') // 'Steam'
 * normalizePlatform('STEAM CD KEY') // 'Steam'
 * normalizePlatform('epic games store') // 'Epic Games'
 * normalizePlatform('Unknown Platform') // 'Unknown Platform' (returned as-is)
 */
export function normalizePlatform(platform: string | null | undefined): string {
  if (platform === null || platform === undefined || platform.trim() === '') {
    return 'Unknown';
  }

  const lowercasePlatform = platform.toLowerCase().trim();
  
  // Check for exact match first
  if (PLATFORM_NORMALIZATION[lowercasePlatform] !== undefined) {
    return PLATFORM_NORMALIZATION[lowercasePlatform];
  }
  
  // Check for partial matches (e.g., "Steam CD Key EU" should match "steam")
  for (const [key, value] of Object.entries(PLATFORM_NORMALIZATION)) {
    if (lowercasePlatform.includes(key) || key.includes(lowercasePlatform)) {
      return value;
    }
  }
  
  // Return original with title case if no match found
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

/**
 * Get all known platforms for filter options
 * @returns Array of unique standardized platform names
 */
export function getKnownPlatforms(): string[] {
  const uniquePlatforms = new Set(Object.values(PLATFORM_NORMALIZATION));
  return Array.from(uniquePlatforms).sort();
}

/**
 * Check if a platform is a gaming platform (vs gift card, subscription, etc.)
 * @param platform - Platform name
 * @returns true if it's a gaming platform
 */
export function isGamingPlatform(platform: string): boolean {
  const gamingPlatforms = [
    'Steam', 'Epic Games', 'GOG', 'Ubisoft Connect', 'EA App',
    'Battle.net', 'Xbox', 'PlayStation', 'Nintendo Switch',
    'Rockstar Games', 'Bethesda', 'PC', 'Microsoft Store',
  ];
  
  const normalized = normalizePlatform(platform);
  return gamingPlatforms.includes(normalized);
}
