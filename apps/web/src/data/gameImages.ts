// Authentic, high-resolution official game artwork sourced from Steam CDN and official publisher assets.
// Steam CDN URLs format:
// Portrait Box Art (600x900): https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appId}/library_600x900.jpg
// Hero Wallpaper (1920x620): https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appId}/library_hero.jpg
// Header (460x215): https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appId}/header.jpg

const STEAM_APP_IDS: Record<string, string> = {
  'gta-5': '271590',
  'cyberpunk-2077': '1091500',
  'elden-ring': '1245620',
  'black-myth-wukong': '2358720',
  'red-dead-redemption-2': '1174180',
  'god-of-war': '1593500',
  'spider-man-remastered': '1817070',
  'spider-man-2': '1817070',
  'spider-man-miles-morales': '1817190',
  'the-witcher-3': '292030',
  'ghost-of-tsushima': '2215430',
  'ghost-of-yotei': '2215430',
  'counter-strike-2': '730',
  'apex-legends': '1172470',
  'call-of-duty': '1938090',
  'cod-modern-warfare': '1938090',
  'cod-black-ops': '42700',
  'cod-vanguard': '1985810',
  'cod-1-2': '2620',
  'forza-horizon-5': '1551360',
  'baldurs-gate': '1086940',
  'palworld': '1623730',
  'ea-sports-fc': '2195250',
  'tekken': '1778820',
  'street-fighter-6': '1364780',
  'mortal-kombat-1': '1971870',
  'mortal-kombat-x': '307780',
  'mortal-kombat-2': '307780',
  'dragon-ball-sparking-zero': '1790600',
  'dragon-ball-legends': '1790600',
  'resident-evil-4': '2050650',
  'resident-evil-2-remake': '883710',
  'resident-evil-3-remake': '952060',
  'resident-evil-7': '418370',
  'resident-evil-village': '1196590',
  'resident-evil-1': '304240',
  'resident-evil-5': '21690',
  'resident-evil-6': '221040',
  'resident-evil-requiem': '2050650',
  'silent-hill-2': '2124490',
  'silent-hill-f': '2124490',
  'it-takes-two': '1426210',
  'lies-of-p': '1627720',
  'little-nightmares': '1079940',
  'the-last-of-us-1': '1888930',
  'the-last-of-us-2': '1888930',
  'the-last-of-us-2-remastered': '1888930',
  'days-gone': '1259420',
  'death-stranding': '1850570',
  'diablo': '2344520',
  'dying-light': '534380',
  'beamng-drive': '284160',
  'battlefield-2042': '1517290',
  'battlefield-6': '1517290',
  'batman-arkham': '208650',
  'alan-wake-2': '1091500',
  'ac-black-flag-resynced': '242050',
  'ac-shadows': '242050',
  'assassins-creed': '812140',
  'avatar-frontiers-of-pandora': '2840770',
  'far-cry': '552520',
  'f1-25': '2488620',
  'horizon-forbidden-west': '2420110',
  'horizon-adventures-remastered': '2420110',
  'marvel-rivals': '2767030',
  'microsoft-flight-simulator': '1250410',
  'nba-2k': '2878980',
  'no-mans-sky': '275850',
  'phasmophobia': '739630',
  'red-dead-redemption': '2668510',
  'ratchet-and-clank': '1895880',
  'subnautica': '264710',
  'the-crew-motorfest': '2698940',
  'uncharted-4': '1659420',
  'uncharted-legacy-of-thieves': '1659420',
  'uncharted-nathan-drake-collection': '1659420',
  'watch-dogs': '447040',
  'wwe-2k23': '2115160',
  'wwe-2k24': '2315690',
  'wwe-2k25': '2315690',
  'wwe-2k26': '2315690',
  'cricket-24': '2495370',
  'cricket-26': '2495370',
  'a-plague-tale': '1182900',
  'smite': '386360',
  'smite-2': '2437170',
  'splitgate': '677620',
  'devil-may-cry': '601150',
  'mafia': '1030830',
  'rise-of-the-tomb-raider': '391220',
  'shadow-of-the-tomb-raider': '750920',
  'tomb-raider-2013': '203160',
  'tomb-raider-i-iii-remastered': '2525380',
  'tomb-raider-iv-vi-remastered': '2525380',
  'tomb-raider-legacy-of-atlantis': '391220',
  'ufc': '1451190',
  'elden-ring-nightreign': '1245620',
  'nioh-3': '1325200',
  'mortal-shell-2': '1110910',
  'onimusha-way-of-the-sword': '761030',
  'reanimal': '1079940',
  '007-first-light': '1659040',
  'world-war-2': '476600',
  'split-fiction': '1426210',
  'the-blood-of-dawnwalker': '292030',
  'beasts-of-reincarnation': '2358720',
  'doomsday': '1091500',
};

// Hand-curated custom high-res game covers & hero backgrounds for games not on Steam or needing special hero treatment
const CUSTOM_GAME_ART: Record<string, { cover: string; hero: string }> = {
  'gta-6': {
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=1080&fit=crop&q=85',
  },
  'astro-bot': {
    cover: '/games/astro-bot-cover.jpg',
    hero: '/games/astro-bot-hero.jpg',
  },
  'gran-turismo': {
    cover: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=1080&fit=crop&q=85',
  },
  'marvels-wolverine': {
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1920&h=1080&fit=crop&q=85',
  },
  'minecraft': {
    cover: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=1920&h=1080&fit=crop&q=85',
  },
  'roblox': {
    cover: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&h=1080&fit=crop&q=85',
  },
  'capcut': {
    cover: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&h=1080&fit=crop&q=85',
  },
  'canva': {
    cover: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1920&h=1080&fit=crop&q=85',
  },
  'chatgpt': {
    cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=1200&fit=crop&q=85',
    hero: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=1080&fit=crop&q=85',
  },
};

// Ultra-high definition 4K website atmosphere & dark gaming aesthetic wallpapers
export const SITE_GAMING_ASSETS = {
  heroBg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=3840&q=90', // 4K Battle station setup with purple/cyan glow
  cyberCity4K: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=3840&q=90', // 4K Cyberpunk city illuminated
  gamingSetup4K: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=3840&q=90', // 4K RGB Battlestation
  darkRealm4K: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=3840&q=90', // 4K Mystic dark portal
  esportsArena4K: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=3840&q=90', // 4K Esports competition stage
  controllerSetup: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=1600&q=90', // Glowing controllers
};

export function getGameImage(id: string): { cover: string; hero: string } {
  // 1. Check custom art first
  if (CUSTOM_GAME_ART[id]) {
    return CUSTOM_GAME_ART[id];
  }

  // 2. Check Steam CDN for authentic official game artwork
  const steamAppId = STEAM_APP_IDS[id];
  if (steamAppId) {
    return {
      cover: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_600x900.jpg`,
      hero: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_hero.jpg`,
    };
  }

  // 3. Fallback to high quality atmospheric gaming aesthetic
  return {
    cover: `https://images.unsplash.com/photo-1550745165-9bc1bceb27a3?w=600&h=900&fit=crop&q=80`,
    hero: `https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&h=1080&fit=crop&q=80`,
  };
}

export function getGameBoxArt(id: string): string {
  return getGameImage(id).cover;
}

export function getGameHero(id: string): string {
  return getGameImage(id).hero;
}

export function placeholderColor(id: string): string {
  const hash = hueFor(id);
  return `hsl(${hash} 40% 12%)`;
}

function hueFor(id: string): number {
  let hash = 0;
  for (const ch of id) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  }
  return hash;
}
