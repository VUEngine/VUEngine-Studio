import { createContext, Dispatch, SetStateAction } from 'react';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import { ConversionResult, ImageCompressionType, ImageProcessingSettings } from '../../../../images/browser/ves-images-types';
import { DataSection } from '../Common/CommonTypes';
import {
    Axis,
    BgmapMode,
    BgmapRepeatMode,
    ColliderType,
    DisplayMode,
    Displays,
    PixelRotation,
    PixelSize,
    PixelVector,
    Scale,
    ScreenPixelRotation,
    ScreenPixelScale,
    ScreenPixelVector,
    SpriteSourceType,
    SpriteType,
    Transparency,
    Vector3D,
    WireframeType
} from '../Common/VUEngineTypes';
import { ActorEditorSaveDataOptions } from './ActorEditor';
import { ActorEditorCommands } from './ActorEditorCommands';

// @ts-ignore
export const ActorEditorContext = createContext<ActorEditorContextType>({});

export interface LocalStorageActorEditorState {
    previewAnaglyph: boolean
    previewBackgroundColor: number
    previewShowChildren: boolean
    previewShowColliders: boolean
    previewShowSprites: boolean
    previewShowWireframes: boolean
    previewZoom: number
}

export interface ActorEditorContextType {
    data: ActorData
    setData: (partialData: Partial<ActorData>, options?: ActorEditorSaveDataOptions) => Promise<void>
    addComponent: (key: ComponentKey) => void
    removeComponent: (key: ComponentKey | 'extraProperties' | 'body' | 'logic', index: number) => void
    currentComponent: string
    setCurrentComponent: Dispatch<SetStateAction<string>>
    currentAnimationStep: number
    setCurrentAnimationStep: Dispatch<SetStateAction<number>>
    previewAnaglyph: boolean
    setPreviewAnaglyph: Dispatch<SetStateAction<boolean>>
    previewBackgroundColor: number
    setPreviewBackgroundColor: Dispatch<SetStateAction<number>>
    previewPalettes: string[]
    setPreviewPalettes: Dispatch<SetStateAction<string[]>>
    previewProjectionDepth: number
    setPreviewProjectionDepth: Dispatch<SetStateAction<number>>
    previewShowChildren: boolean
    setPreviewShowChildren: Dispatch<SetStateAction<boolean>>
    previewShowColliders: boolean
    setPreviewShowColliders: Dispatch<SetStateAction<boolean>>
    previewShowSprites: boolean
    setPreviewShowSprites: Dispatch<SetStateAction<boolean>>
    previewShowWireframes: boolean
    setPreviewShowWireframes: Dispatch<SetStateAction<boolean>>
    previewZoom: number
    setPreviewZoom: Dispatch<SetStateAction<number>>
}

export const MIN_SCALE = 0;
export const MAX_SCALE = 64;
export const MIN_ACTOR_PIXEL_SIZE = 0;
export const MAX_ACTOR_PIXEL_SIZE = 511;
export const MIN_TEXTURE_PADDING = 0;
export const MAX_TEXTURE_PADDING = 255;
export const MIN_ANIMATION_CYLCES = 1;
export const MAX_ANIMATION_CYLCES = 255;
// TODO: compute min, max values from engineConfig.math.fixedPointPrecision
// step would be PIXELS_TO_METERS(1), depending on fixedPointPrecision
export const MIN_WIREFRAME_DISPLACEMENT = -511;
export const MAX_WIREFRAME_DISPLACEMENT = 512;
export const STEP_WIREFRAME_DISPLACEMENT = 0.1;
export const MIN_SPHERE_RADIUS = 0;
export const MAX_SPHERE_RADIUS = 511;
export const STEP_SPHERE_RADIUS = 1;
export const MIN_PREVIEW_SPRITE_ZOOM = 0.5;
export const MAX_PREVIEW_SPRITE_ZOOM = 20;
export const PREVIEW_SPRITE_ZOOM_STEP = 0.5;
export const WHEEL_SENSITIVITY = 50;
export const WIREFRAME_CANVAS_PADDING = 1;

export const MIN_COLLIDER_DIAMETER = 1;
export const MAX_COLLIDER_DIAMETER = 511;
export const MIN_COLLIDER_PIXEL_SIZE = 0;
export const MAX_COLLIDER_PIXEL_SIZE = 511;
export const MIN_COLLIDER_DISPLACEMENT = -256;
export const MAX_COLLIDER_DISPLACEMENT = 256;
export const MIN_COLLIDER_DISPLACEMENT_PARALLAX = -32;
export const MAX_COLLIDER_DISPLACEMENT_PARALLAX = 32;
export const MIN_COLLIDER_LINEFIELD_LENGTH = 0;
export const MAX_COLLIDER_LINEFIELD_LENGTH = 511;
export const MIN_COLLIDER_LINEFIELD_THICKNESS = 0;
export const MAX_COLLIDER_LINEFIELD_THICKNESS = 511;

export const MIN_SPRITE_REPEAT_SIZE = 0;
export const MAX_SPRITE_REPEAT_SIZE = 512;
export const MIN_SPRITE_TEXTURE_DISPLACEMENT = -256;
export const MAX_SPRITE_TEXTURE_DISPLACEMENT = 256;
export const MIN_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX = -32;
export const MAX_SPRITE_TEXTURE_DISPLACEMENT_PARALLAX = 32;

export enum AxisNumeric {
    X = 0,
    Y = 1,
    Z = 2,
}

export interface MeshSegmentData {
    fromVertex: PixelVector
    toVertex: PixelVector
}

export interface WireframeConfigData {
}

export interface WireframeData {
    name: string
    type: WireframeType
    displacement: Vector3D
    color: number
    transparency: Transparency
    interlaced: boolean
    segments: MeshSegmentData[] // only WireframeType.Mesh
    length: number // only WireframeType.Asterisk
    radius: number // only WireframeType.Sphere
    drawCenter: boolean // only WireframeType.Sphere
}

export interface AnimationData {
    name: string
    cycles: number
    callback: string
    loop: boolean
    frames: number[]
}

export interface MutatorData {
    name: string
    mutationClass: string
}

export interface ColliderData {
    name: string
    type: ColliderType
    pixelSize: PixelSize
    displacement: PixelVector
    rotation: PixelRotation
    scale: Scale
    checkForCollisions: boolean
    layers: string[]
    layersToCheck: string[]
}

export interface SpriteImageData {
    images: Partial<ConversionResult>[], // index 1 only set for stereo animations
}

export interface SpriteData {
    _imageData?: SpriteImageData | number
    name: string
    sourceType: SpriteSourceType
    imageProcessingSettings: ImageProcessingSettings,
    bgmapMode: BgmapMode
    colorMode: ColorMode
    displayMode: DisplayMode
    displays: Displays
    isAnimated: boolean
    transparency: Transparency
    displacement: PixelVector
    manipulationFunction: string
    optimizeTiles: boolean
    shareTiles: boolean
    texture: {
        files: string[]
        files2: string[] // files for right eye in stereo mode
        padding: {
            x: number
            y: number
        }
        palette: number
        recycleable: boolean
        flip: {
            x: boolean
            y: boolean
        }
        repeat: {
            // TODO: support all repeat modes
            mode: BgmapRepeatMode
            x: boolean
            y: boolean
            size: {
                x: number
                y: number
            }
        }
    }
    section: DataSection
    compression: ImageCompressionType
}

export interface PositionedActorData {
    itemId: string
    onScreenPosition: ScreenPixelVector
    onScreenRotation: ScreenPixelRotation
    onScreenScale: ScreenPixelScale
    name: string
    children: PositionedActorData[]
    extraInfo: string
    loadRegardlessOfPosition: boolean
}

export type ComponentKey = 'animations' | 'mutators' | 'children' | 'colliders' | 'sprites' | 'wireframes';
export type ComponentData = AnimationData | MutatorData | PositionedActorData | ColliderData | SpriteData | WireframeData;

export const CLONABLE_COMPONENT_TYPES = [
    'animations',
    'children',
    'colliders',
    'sprites',
    'wireframes',
];

export const ADDABLE_COMPONENT_TYPES = CLONABLE_COMPONENT_TYPES;

export type HideableComponent = 'children' | 'colliders' | 'sprites' | 'wireframes';
export const HIDEABLE_COMPONENT_TYPES = [
    'children',
    'colliders',
    'sprites',
    'wireframes',
];

export interface ActorData {
    _id: string
    extraProperties: {
        enabled: boolean // flag just for the UI to be able to treat as component
        extraInfo: string
        pixelSize: PixelSize
    }
    animations: {
        default: number
        totalFrames: number
        multiframe: boolean
    }
    components: {
        animations: AnimationData[]
        mutators: MutatorData[]
        children: PositionedActorData[]
        colliders: ColliderData[]
        sprites: SpriteData[]
        wireframes: WireframeData[]
    }
    inGameType: string
    body: {
        enabled: boolean
        mass: number
        friction: number
        bounciness: number
        maximumSpeed: number
        maximumVelocity: Vector3D
        gravityAxes: Axis[]
        rotationAxes: Axis[]
    }
    sprites: {
        type: SpriteType
        useZDisplacementInProjection: boolean
    }
    logic: {
        enabled: boolean // flag just for the UI to be able to treat as component
        customAllocator: string
        configuration: Record<string, string>
    }
}

export const INPUT_BLOCKING_COMMANDS = [
    ActorEditorCommands.CENTER_CURRENT_COMPONENT.id,
    ActorEditorCommands.DELETE_CURRENT_COMPONENT.id,
    ActorEditorCommands.DESELECT_CURRENT_COMPONENT.id,
    ActorEditorCommands.MOVE_COMPONENT_DOWN.id,
    ActorEditorCommands.MOVE_COMPONENT_LEFT.id,
    ActorEditorCommands.MOVE_COMPONENT_RIGHT.id,
    ActorEditorCommands.MOVE_COMPONENT_UP.id,
    ActorEditorCommands.INCREASE_COMPONENT_Z_DISPLACEMENT.id,
    ActorEditorCommands.DECREASE_COMPONENT_Z_DISPLACEMENT.id,
    ActorEditorCommands.INCREASE_COMPONENT_PARALLAX.id,
    ActorEditorCommands.DECREASE_COMPONENT_PARALLAX.id,
];
