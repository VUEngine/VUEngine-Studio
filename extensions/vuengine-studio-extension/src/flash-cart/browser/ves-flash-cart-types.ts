import { isOSX, isWindows } from '@theia/core';

export const PROG_VB_PLACEHOLDER = '%PROGVB%';
export const HFCLI_PLACEHOLDER = '%HFCLI%';
export const HBCLI_PLACEHOLDER = '%HBCLI%';
export const NAME_PLACEHOLDER = '%NAME%';
export const NAME_NO_SPACES_PLACEHOLDER = '%NAME_NO_SPACES%';
export const ROM_PLACEHOLDER = '%ROM%';
export const PORT_PLACEHOLDER = '%PORT%';
export const FLASHBOY_PLUS_PREFERENCE_NAME = 'FlashBoy (Plus)';
export const HYPERFLASH32_PREFERENCE_NAME = 'HyperFlash32';
export const HYPERBOY_PREFERENCE_NAME = 'HyperBoy';
export const FLASHBOY_PLUS_IMAGE_PLACEHOLDER = '%FBP_IMG%';
export const HYPERFLASH32_IMAGE_PLACEHOLDER = '%HF32_IMG%';
export const HYPERBOY_IMAGE_PLACEHOLDER = '%HB_IMG%';

export interface FlashCartConfig {
  name: string
  deviceCodes: FlashCartDeviceCode[],
  size: number
  path: string
  args: string
  padRom: boolean
  image: string
}

export interface FlashCartDeviceCode {
  vid: number
  pid: number
  manufacturer: string
  product: string
}

export interface ConnectedFlashCart {
  config: FlashCartConfig
  deviceCodes: FlashCartDeviceCode,
  port: string
  status: FlashCartStatus
  canHoldRom: boolean
}

export interface FlashCartStatus {
  processId: number
  progress: number
  step: string
  log: FlashLogLine[]
  currentLogLine: number
}

export interface FlashLogLine {
  timestamp: number;
  text: string;
};

export const BUILT_IN_FLASH_CART_CONFIGS: Array<FlashCartConfig> = [
  {
    // FlashBoy, FlashBoy Plus, FlashBoy+ (Vintex64)
    name: FLASHBOY_PLUS_PREFERENCE_NAME,
    deviceCodes: [{
      vid: 6017,
      pid: 2466,
      manufacturer: 'Richard Hutchinson',
      product: 'FlashBoy',
    }],
    size: 16,
    path: PROG_VB_PLACEHOLDER,
    args: ROM_PLACEHOLDER,
    padRom: true,
    image: FLASHBOY_PLUS_IMAGE_PLACEHOLDER,
  },
  {
    // HyperFlash32
    name: HYPERFLASH32_PREFERENCE_NAME,
    deviceCodes: [{
      // FTDI chips
      vid: 1027,
      pid: 24577,
      manufacturer: 'FTDI',
      product: 'FT232R USB UART',
    }, {
      // Cypress chips
      vid: 1204,
      pid: 3,
      manufacturer: 'Cypress Semiconductor',
      product: 'USB-UART LP',
    }, {
      // Cypress chips, renamed
      vid: 1204,
      pid: 3,
      manufacturer: 'RetroOnyx',
      product: 'HyperFlash32',
    }],
    size: 32,
    path: HFCLI_PLACEHOLDER,
    args: isWindows
      ? `-p ${PORT_PLACEHOLDER} -x ${ROM_PLACEHOLDER} -n ${NAME_NO_SPACES_PLACEHOLDER}`
      : `-p ${PORT_PLACEHOLDER} -x ${ROM_PLACEHOLDER} -n ${NAME_NO_SPACES_PLACEHOLDER} --slow`,
    padRom: false,
    image: HYPERFLASH32_IMAGE_PLACEHOLDER,
  },
  {
    // HyperBoy
    name: HYPERBOY_PREFERENCE_NAME,
    deviceCodes: [{
      vid: 1027,
      pid: 24577,
      manufacturer: 'RETROONYX',
      product: 'HYPERBOY',
    }],
    size: 32,
    path: HBCLI_PLACEHOLDER,
    args: isWindows
      ? `-p ${PORT_PLACEHOLDER} -f ${ROM_PLACEHOLDER}`
      : `-p ${PORT_PLACEHOLDER} -f ${ROM_PLACEHOLDER} --slow`,
    padRom: false,
    image: HYPERBOY_IMAGE_PLACEHOLDER,
  },
];
