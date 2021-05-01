import { Device } from "usb"

export type FlashCartConfig = {
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

export type ConnectedFlashCart = {
    config: FlashCartConfig
    device: Device
    status: FlashCartStatus
}

export type FlashCartStatus = {
    processId: number
    progress: number
    step: string
    log: string
}