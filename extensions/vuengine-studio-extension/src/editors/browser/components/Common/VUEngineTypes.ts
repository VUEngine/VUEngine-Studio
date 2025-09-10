export const MIN_ROTATION = 0;
export const MAX_ROTATION = 511;
// VUEngine uses 512 segments for a full circle for easier computations.
// On the frontend, we work in degrees, though.
export const ROTATION_RATIO = 0.703125; // 360/512

export enum SpriteType {
    Bgmap = 'Bgmap',
    Object = 'Object',
}

export enum Transparency {
    None = 'None',
    Odd = 'Odd',
    Even = 'Even',
}

export enum DisplayMode {
    Mono = 'Mono',
    Stereo = 'Stereo',
}

export enum Displays {
    Both = 'ON',
    Left = 'LON',
    Right = 'RON',
}

export enum BgmapMode {
    Bgmap = 'Bgmap',
    Affine = 'Affine',
    HBias = 'HBias',
}

export enum SpriteSourceType {
    Image = 'image',
    Pixel = 'pixel',
    TileMap = 'tilemap',
    Model = 'model',
}

export enum BgmapRepeatMode {
    '1x1' = '1x1',
    '1x2' = '1x2',
    '1x4' = '1x4',
    '1x8' = '1x8',
    '2x1' = '2x1',
    '2x2' = '2x2',
    '2x4' = '2x4',
    '4x1' = '4x1',
    '4x2' = '4x2',
    '8x1' = '8x1',
}

export enum WireframeType {
    Mesh = 'Mesh',
    Sphere = 'Sphere',
    Asterisk = 'Asterisk',
}

export enum ColliderType {
    Ball = 'Ball',
    Box = 'Box',
    InverseBox = 'InverseBox',
    LineField = 'LineField',
}

export enum Axis {
    XAxis = 'X_AXIS',
    YAxis = 'Y_AXIS',
    ZAxis = 'Z_AXIS',
}

export interface PixelVector {
    x: number // int16
    y: number // int16
    z: number // int16
    parallax: number // int16
}

export interface ScreenPixelVector {
    x: number // int16
    y: number // int16
    z: number // int16
}

export interface ScreenPixelScale {
    x: number // float
    y: number // float
    z: number // float
}

export interface ScreenPixelRotation {
    x: number // int16
    y: number // int16
    z: number // int16
}

export interface PixelSize {
    x: number // uint16
    y: number // uint16
    z: number // uint16
}

export interface PixelRotation {
    x: number // int16
    y: number // int16
    z: number // int16
}

export interface Scale {
    x: number // fix7_9
    y: number // fix7_9
    z: number // fix7_9
}

export interface Vector3D {
    x: number // fixed_t
    y: number // fixed_t
    z: number // fixed_t
}

export interface Brightness {
    dark: number // uint8
    medium: number // uint8
    bright: number // uint8
}
