export const RUMBLE_PACK_IDS: RumblePackId[] = [
  {
    vendoriId: '9999',
    productId: '9999',
    manufacturer: 'Unknown',
  },
  {
    vendoriId: '2341',
    productId: '8036',
    manufacturer: 'Arduino LLC',
  },
];

export interface RumblePackId {
  vendoriId: string
  productId: string
  manufacturer: string
}

export enum HapticFrequency {
  Hz160 = '000',
  Hz240 = '001',
  Hz320 = '002',
  Hz400 = '003',
}

export interface RumblePakLogLine {
  timestamp: number
  text: string
}
