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
export const MIN_TEXTURE_SIZE = 1;
export const MAX_TEXTURE_SIZE = 64;

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
    allocator: string
    displacement: {
        x: number
        y: number
        z: number
    }
    color: number
    transparency: Transparency
    interlaced: boolean
}

export interface Mesh {
    wireframe: Wireframe
    segments: MeshSegment[]
}

export interface Animation {
    name: string
    // ...
}

export interface Sprite {
    class: string
    section: DataSection
    compression: ImageCompressionType
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
        charset: {
            optimized: boolean
            shared: boolean
        }
        files: string[],
        padding: {
            x: number
            y: number
        }
        palette: number
        recycleable: boolean
        flip: {
            horizontal: boolean
            vertical: boolean
        },
        size: {
            x: number
            y: number
        }
    }
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
    meshes: {
        meshes: Mesh[]
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
    sprites: {
        type: string
        useZDisplacementInProjection: boolean
        sprites: Sprite[]
    }
}

export interface EntityEditorState {
    preview: {
        anaglyph: boolean
        animations: boolean
        collisions: boolean
        meshes: boolean
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
