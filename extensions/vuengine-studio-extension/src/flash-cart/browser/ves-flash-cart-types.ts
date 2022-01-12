import { Device } from 'usb';

export const PROG_VB_PLACEHOLDER = '%PROGVB%';
export const HFCLI_PLACEHOLDER = '%HFCLI%';
export const HBCLI_PLACEHOLDER = '%HBCLI%';
export const NAME_PLACEHOLDER = '%NAME%';
export const NAME_NO_SPACES_PLACEHOLDER = '%NAME_NO_SPACES%';
export const ROM_PLACEHOLDER = '%ROM%';
export const FLASHBOY_PLUS_PREFERENCE_NAME = 'FlashBoy (Plus)';
export const HYPERFLASH32_PREFERENCE_NAME = 'HyperFlash32';
export const HYPERBOY_PREFERENCE_NAME = 'HyperBoy';
export const FLASHBOY_PLUS_IMAGE_PLACEHOLDER = '%FBP_IMG%';
export const HYPERFLASH32_IMAGE_PLACEHOLDER = '%HF32_IMG%';
export const HYPERBOY_IMAGE_PLACEHOLDER = '%HB_IMG%';

export interface FlashCartConfig {
  name: string
  vid: number
  pid: number
  manufacturer: string
  product: string
  size: number
  path: string
  args: string
  padRom: boolean
  image: string
}

export interface ConnectedFlashCart {
  config: FlashCartConfig
  device: Device
  status: FlashCartStatus
  canHoldRom: boolean
}

export interface FlashCartStatus {
  processId: number
  progress: number
  step: string
  log: FlashLogLine[]
}

export interface FlashLogLine {
  timestamp: number;
  text: string;
};
