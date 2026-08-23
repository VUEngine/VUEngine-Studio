export const RUMBLE_PACK_IDS: RumblePackId[] = [{
  name: 'Final',
  usbVendorId: 9025,
  usbProductId: 32822,
  // productName: 'Arduino Leonardo',
  // manufacturerName: 'Arduino LLC',
}, {
  name: 'Prototype',
  usbVendorId: 39321,
  usbProductId: 39321,
  // productName: 'Unknown',
  // manufacturerName: 'Unknown',
}];

export interface RumblePackId {
  /** Which revision of the board these ids belong to. */
  name: string
  usbVendorId: number
  usbProductId: number
  // productName: string
  // manufacturerName: string
}

export const RUMBLE_PACK_FILTERS: SerialPortFilter[] = RUMBLE_PACK_IDS.map(
  ({ usbVendorId, usbProductId }) => ({ usbVendorId, usbProductId })
);

export function getRumblePackName(info: SerialPortInfo): string | undefined {
  return RUMBLE_PACK_IDS.find(id =>
    id.usbVendorId === info.usbVendorId && id.usbProductId === info.usbProductId
  )?.name;
}

export function isRumblePack(port: SerialPort): boolean {
  return getRumblePackName(port.getInfo()) !== undefined;
}

export interface RumblePakLogLine {
  timestamp: number
  text: string
}
