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

export const RUMBLE_EFFECT_DURATIONS_MS: number[] =
[
     53,  58,  50,  34,  47,  37,  85,  79,  79, 175,
    165, 226, 194, 197, 751, 999,  79,  77,  82,  82,
     71,  77,  69,  31,  34,  31, 111, 109, 114, 109,
    114, 127, 119, 106, 114, 111, 146, 151, 159, 154,
    141, 127, 141, 159, 173, 159, 247, 250, 247, 245,
    247, 311, 309, 173, 175, 130, 122, 495, 490, 490,
    490, 501, 495, 474, 479, 477, 482, 479, 477, 285,
    479, 285, 479, 279, 346, 261, 282, 266, 287, 263,
    287, 189, 437, 199, 383, 215, 346, 279, 522, 277,
    466, 277, 402, 277, 450, 271, 437, 261, 298, 266,
    282, 269, 282, 269, 282, 178, 405, 186, 343, 205,
    309, 282, 525, 279, 471, 279, 405, Number.MAX_SAFE_INTEGER,
    477, 474, 466, 463, 511,
];
