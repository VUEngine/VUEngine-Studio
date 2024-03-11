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
    Object = 'Object',
    Affine = 'Affine',
    HBias = 'HBias',
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
    zDisplacement: number // int16
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
