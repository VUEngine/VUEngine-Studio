import { Device } from 'usb';

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
}

export interface FlashCartStatus {
  processId: number
  progress: number
  step: string
  log: string
}