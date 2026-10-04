export interface SystemRequirements {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export interface GameMetadata {
  features: string[];
  specs?: SystemRequirements;
  playModes: string[];
  approxCampaignHours?: number;
}

// Key features and system specifications for top AAA titles
export const GAME_METADATA: Record<string, GameMetadata> = {
  'gta-5': {
    features: ['4K Ultra HD', 'GTA Online Included', 'Custom Radio Stations', 'Mod Support on PC', 'Controller Support'],
    playModes: ['Single-player Campaign', 'Online Multiplayer (30 players)'],
    approxCampaignHours: 32,
    specs: {
      os: 'Windows 10 / 11 64-bit',
      processor: 'Intel Core i5 3470 / AMD FX-8350',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 660 2GB / AMD HD 7870 2GB',
      storage: '110 GB available space',
    },
  },
  'cyberpunk-2077': {
    features: ['Full Path Tracing', 'Phantom Liberty Ready', 'DLSS 3.5 & FSR 3', 'DualSense Haptics', 'HDR10 Support'],
    playModes: ['Single-player Campaign'],
    approxCampaignHours: 25,
    specs: {
      os: 'Windows 10 64-bit',
      processor: 'Core i7-6700 or Ryzen 5 1600',
      memory: '12 GB RAM',
      graphics: 'GeForce GTX 1060 6GB or Radeon RX 580 8GB',
      storage: '70 GB SSD required',
    },
  },
  'black-myth-wukong': {
    features: ['Unreal Engine 5.4', 'Full Ray Tracing', 'Chinese Folklore Story', 'Cinematic Boss Battles', 'DualSense Support'],
    playModes: ['Single-player Action RPG'],
    approxCampaignHours: 35,
    specs: {
      os: 'Windows 10 / 11 64-bit',
      processor: 'Core i5-8400 or Ryzen 5 1600',
      memory: '16 GB RAM',
      graphics: 'GeForce GTX 1060 6GB or RX 580 8GB',
      storage: '130 GB available space',
    },
  },
  'elden-ring': {
    features: ['Open-World Exploration', 'Shadow of the Erdtree DLC Ready', '60 FPS Ultra Settings', 'Co-op Summoning', 'Cloud Saves'],
    playModes: ['Single-player', 'Online Co-op & Invasions'],
    approxCampaignHours: 55,
    specs: {
      os: 'Windows 10 / 11 64-bit',
      processor: 'Intel Core i5-8400 or AMD Ryzen 3 3300X',
      memory: '12 GB RAM',
      graphics: 'NVIDIA GeForce GTX 1060 3GB or AMD Radeon RX 580 4GB',
      storage: '60 GB available space',
    },
  },
  'spider-man-2': {
    features: ['Fast Travel via SSD', 'Ray-Traced Reflections', 'DualSense Adaptive Triggers', '3D Audio Tempest', 'Peter & Miles Swap'],
    playModes: ['Single-player Campaign'],
    approxCampaignHours: 18,
  },
  'god-of-war': {
    features: ['Seamless One-Shot Camera', 'Ultra-Wide 21:9 Support', 'NVIDIA Reflex & DLSS', 'High-Fidelity Visuals', 'DualSense Controller'],
    playModes: ['Single-player Campaign'],
    approxCampaignHours: 21,
    specs: {
      os: 'Windows 10 64-bit',
      processor: 'Intel i5-2500k or AMD FX-6300',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 960 (4 GB) or AMD R9 290X (4 GB)',
      storage: '70 GB available space',
    },
  },
  'red-dead-redemption-2': {
    features: ['Living Open World', 'Red Dead Online Included', '4K HDR Visuals', 'Realistic Physics & Wildlife', 'First-Person Mode'],
    playModes: ['Single-player', 'Online Multiplayer'],
    approxCampaignHours: 50,
    specs: {
      os: 'Windows 10 64-bit',
      processor: 'Intel Core i5-2500K / AMD FX-6300',
      memory: '8 GB RAM',
      graphics: 'Nvidia GeForce GTX 770 2GB / AMD Radeon R9 280 3GB',
      storage: '150 GB available space',
    },
  },
  'silent-hill-2': {
    features: ['Unreal Engine 5 Remake', 'Over-The-Shoulder Camera', '3D Spatial Audio', 'Ray Tracing Global Illumination', 'DualSense Haptics'],
    playModes: ['Single-player Psychological Horror'],
    approxCampaignHours: 14,
    specs: {
      os: 'Windows 10 64-bit',
      processor: 'Intel Core i7-6700K / AMD Ryzen 5 3600',
      memory: '16 GB RAM',
      graphics: 'NVIDIA GeForce RTX 2060 or AMD Radeon RX 5700 XT',
      storage: '50 GB SSD recommended',
    },
  },
};

// Generic fallback features for titles without custom specs
export function getGameMetadata(id: string, genre: string): GameMetadata {
  if (GAME_METADATA[id]) {
    return GAME_METADATA[id];
  }

  return {
    features: ['Instant Digital Delivery', 'Full Campaign Access', 'Cloud & Offline Saves', 'Official Store Download', 'Verified Credentials'],
    playModes: ['Full Story / Campaign', 'Official Updates Included'],
    approxCampaignHours: genre.toLowerCase().includes('rpg') ? 35 : 15,
  };
}

export const COMMON_FAQS = [
  {
    q: 'Can I play the game on my personal account?',
    a: 'Yes! For console purchases, you add the profile to your PlayStation as a primary account, and you can play directly from your own personal profile with your own save files and trophies.',
  },
  {
    q: 'How fast do I receive the game after payment?',
    a: 'Digital access credentials (or instant scan-to-play QR code) are sent directly to your WhatsApp within 15–30 minutes during active store hours.',
  },
  {
    q: 'Can I play online multiplayer?',
    a: 'Yes, if the game features online modes (like GTA Online, EA Sports FC, Call of Duty), you can play online just like a standard digital copy.',
  },
  {
    q: 'How does returning a rented game work?',
    a: 'There is zero physical shipping or return friction. When your rental period is up, the digital access simply concludes. If you want to keep playing, you can easily extend or upgrade to permanent ownership by messaging us on WhatsApp.',
  },
];
