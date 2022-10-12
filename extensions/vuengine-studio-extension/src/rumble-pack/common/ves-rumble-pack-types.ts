export const RUMBLE_PACK_IDS: RumblePackId[] = [{
  vendoriId: '2341',
  productId: '8036',
  manufacturer: 'Arduino LLC',
}, {
  vendoriId: '9999',
  productId: '9999',
  manufacturer: 'Unknown',
}];

export interface RumblePackId {
  vendoriId: string
  productId: string
  manufacturer: string
}

export interface RumblePakLogLine {
  timestamp: number
  text: string
}
