import React from 'react';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import { ConversionResult, ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { DataSection } from '../Common/CommonTypes';
import {
    Axis,
    BgmapMode,
    ColliderType,
    DisplayMode,
    Displays,
    PixelRotation,
    PixelSize,
    PixelVector,
    Scale,
    ScreenPixelVector,
    SpriteType,
    Transparency,
    Vector3D,
    WireframeType
} from '../Common/VUEngineTypes';
import { EntityEditorSaveDataOptions } from './EntityEditor';
import { ScriptType, ScriptedActionData } from './Scripts/ScriptTypes';

// @ts-ignore
export const EntityEditorContext = React.createContext<EntityEditorContextType>({});

export interface EntityEditorContextType {
    state: EntityEditorState
    setState: (state: Partial<EntityEditorState>) => void
    data: EntityData
    setData: (partialData: Partial<EntityData>, options?: EntityEditorSaveDataOptions) => Promise<void>
}

export const EntityEditorLayoutStorageName = 'ves-editors-entityEditor-layout';

export const MIN_ENTITY_PIXEL_SIZE = 0;
export const MAX_ENTITY_PIXEL_SIZE = 511;
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
export const MIN_PREVIEW_SPRITE_ZOOM = 1;
export const MAX_PREVIEW_SPRITE_ZOOM = 20;
export const MIN_PREVIEW_SCRIPT_ZOOM = 0.1;
export const MAX_PREVIEW_SCRIPT_ZOOM = 1;
export const WHEEL_SENSITIVITY = 50;
export const WIREFRAME_CANVAS_PADDING = 1;

export const MIN_COLLIDER_PIXEL_SIZE = 0;
export const MAX_COLLIDER_PIXEL_SIZE = 511;
export const MIN_COLLIDER_ROTATION = 0;
export const MAX_COLLIDER_ROTATION = 511;
// VUEngine uses 512 segments for a full circle for easier computations.
// On the frontend, we work in degrees, though.
export const COLLIDER_ROTATION_RATIO = 0.703125; // 360/512
export const MIN_COLLIDER_SCALE = 0;
export const MAX_COLLIDER_SCALE = 64;
export const MIN_COLLIDER_DISPLACEMENT = -256;
export const MAX_COLLIDER_DISPLACEMENT = 256;
export const MIN_COLLIDER_DISPLACEMENT_PARALLAX = -32;
export const MAX_COLLIDER_DISPLACEMENT_PARALLAX = 32;
export const MIN_COLLIDER_LINEFIELD_LENGTH = 0;
export const MAX_COLLIDER_LINEFIELD_LENGTH = 511;
export const MIN_COLLIDER_LINEFIELD_THICKNESS = 0;
export const MAX_COLLIDER_LINEFIELD_THICKNESS = 511;

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
    type: WireframeType
    displacement: Vector3D
    color: number
    transparency: Transparency
    interlaced: boolean
}

export interface WireframeData {
    name: string
    wireframe: WireframeConfigData
    segments: MeshSegmentData[] // only WireframeType.Mesh
    length: number // only WireframeType.Asterisk
    radius: number // only WireframeType.Sphere
    drawCenter: boolean // only WireframeType.Sphere
}

export interface ScriptData {
    name: string
    type: ScriptType
    script: ScriptedActionData[]
}

export interface AnimationData {
    name: string
    cycles: number
    callback: string
    loop: boolean
    frames: number[]
}

export interface BehaviorData {
    name: string
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

export interface SpriteData {
    _imageData?: Partial<ConversionResult & { _dupeIndex: number }> | number
    name: string
    bgmapMode: BgmapMode
    colorMode: ColorMode
    displayMode: DisplayMode
    displays: Displays
    transparency: Transparency
    displacement: PixelVector
    manipulationFunction: string
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
            horizontal: boolean
            vertical: boolean
        }
    }
    section: DataSection
    compression: ImageCompressionType
}

export interface PositionedEntityData {
    itemId: string
    onScreenPosition: ScreenPixelVector
    name: string
    children: PositionedEntityData[]
    extraInfo: string
    loadRegardlessOfPosition: boolean
}

export type ComponentKey = 'animations' | 'behaviors' | 'children' | 'colliders' | 'scripts' | 'sprites' | 'wireframes';
export type ComponentData = AnimationData | BehaviorData | PositionedEntityData | ColliderData | SpriteData | WireframeData | ScriptData;

export interface EntityData {
    _id: string
    extraProperties: {
        enabled: boolean // flag just for the UI to be able to treat as component
        extraInfo: string
        pixelSize: PixelSize
        customAllocator: string
    }
    animations: {
        default: number
        totalFrames: number
        multiframe: boolean
    }
    components: {
        animations: AnimationData[]
        behaviors: BehaviorData[]
        children: PositionedEntityData[]
        colliders: ColliderData[]
        sprites: SpriteData[]
        wireframes: WireframeData[]
        scripts: ScriptData[]
    }
    inGameType: string
    physics: {
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
        customClass: string
        useZDisplacementInProjection: boolean
        sharedTiles: boolean
        optimizedTiles: boolean
    }
}

export interface EntityEditorPreviewState {
    backgroundColor: number
    anaglyph: boolean
    children: boolean
    colliders: boolean
    wireframes: boolean
    palettes: string[]
    sprites: boolean
    zoom: number
    projectionDepth: number
}

export interface EntityEditorState {
    currentComponent: string,
    preview: EntityEditorPreviewState
}
