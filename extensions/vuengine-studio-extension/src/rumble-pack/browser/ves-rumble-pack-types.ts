export const RUMBLE_PACK_IDS: RumblePackId[] = [{
  // Final
  usbVendorId: 9025,
  usbProductId: 32822,
  // productName: 'Arduino Leonardo',
  // manufacturerName: 'Arduino LLC',
}, {
  // Prototype
  usbVendorId: 39321,
  usbProductId: 39321,
  // productName: 'Unknown',
  // manufacturerName: 'Unknown',
}];

export interface RumblePackId {
  usbVendorId: number
  usbProductId: number
  // productName: string
  // manufacturerName: string
}

export interface RumblePakLogLine {
  timestamp: number
  text: string
}
