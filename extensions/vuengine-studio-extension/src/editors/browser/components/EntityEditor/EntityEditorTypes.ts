import React from 'react';
import { ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { DataSection } from '../Common/CommonTypes';

// @ts-ignore
export const EntityEditorContext = React.createContext<EntityEditorContextType>({});

export interface EntityEditorContextType {
    state: EntityEditorState
    setState: (state: Partial<EntityEditorState>) => void
    data: EntityData
    setData: (partialData: Partial<EntityData>) => void
}

export const EntityEditorLayoutStorageName = 'ves-editors-entityEditor-layout';

export const MIN_TEXTURE_PADDING = 0;
export const MAX_TEXTURE_PADDING = 255;
// TODO: compute min, max values from engineConfig.math.fixedPointPrecision
// step would be PIXELS_TO_METERS(1), depending on fixedPointPrecision
export const MIN_WIREFRAME_DISPLACEMENT = -511;
export const MAX_WIREFRAME_DISPLACEMENT = 512;
export const STEP_WIREFRAME_DISPLACEMENT = 0.1;
export const MIN_SPHERE_RADIUS = 0;
export const MAX_SPHERE_RADIUS = 512;
export const STEP_SPHERE_RADIUS = 0.1;

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

export interface MeshSegment {
    fromVertex: {
        x: number
        y: number
        z: number
        parallax: number
    }
    toVertex: {
        x: number
        y: number
        z: number
        parallax: number
    }
}

export interface Wireframe {
    type: WireframeType
    displacement: {
        x: number
        y: number
        z: number
    }
    color: number
    transparency: Transparency
    interlaced: boolean
}

export interface WireframeImpl {
    wireframe: Wireframe
    segments: MeshSegment[] // only WireframeType.Mesh
    length: number // only WireframeType.Asterisk
    radius: number // only WireframeType.Sphere
    drawCenter: boolean // only WireframeType.Sphere
}

export interface Animation {
    name: string
    // ...
}

export interface Sprite {
    bgmapMode: BgmapMode
    displayMode: DisplayMode
    transparency: Transparency
    displacement: {
        x: number
        y: number
        z: number
        parallax: number
    }
    manipulationFunction: string
    texture: {
        files: string[]
        padding: {
            x: number
            y: number
        }
        palette: number
        recycleable: boolean
        flip: {
            horizontal: boolean
            vertical: boolean
        }
    }
}

export interface Sprites {
    type: string
    customClass: string
    useZDisplacementInProjection: boolean
    sharedTiles: boolean
    optimizedTiles: boolean
    section: DataSection
    compression: ImageCompressionType
    sprites: Sprite[]
}

export interface EntityData {
    name: string
    extraInfo: string
    pixelSize: {
        x: number
        y: number
        z: number
    }
    animations: {
        default: string
        animations: Animation[]
    }
    collisions: {
        inGameType: string
        shapes: {
            type: string
            pixelSize: {
                x: number
                y: number
                z: number
            }
            displacement: {
                x: number
                y: number
                z: number
                parallax: number
            }
            rotation: {
                x: number
                y: number
                z: number
            }
            scale: {
                x: number
                y: number
                z: number
            }
            checkForCollisions: boolean
            layers: string
            layersToIgnore: string
        }[]
    }
    wireframes: {
        wireframes: WireframeImpl[]
    }
    physics: {
        enabled: boolean
        mass: number
        friction: number
        bounciness: number
        maximumSpeed: number
        maximumVelocity: {
            x: number
            y: number
            z: number
        }
    }
    sprites: Sprites
}

export interface EntityEditorState {
    preview: {
        anaglyph: boolean
        animations: boolean
        collisions: boolean
        wireframes: boolean
        palettes: string[]
        sprites: boolean
        zoom: number
    }
}

export interface Displacement {
    x: number
    y: number
    z: number
    parallax: number
}
