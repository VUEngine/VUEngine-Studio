import React from 'react';
import { ConversionResult, ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { DataSection } from '../Common/CommonTypes';
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
export const MAX_SPHERE_RADIUS = 512;
export const STEP_SPHERE_RADIUS = 0.1;
export const MIN_PREVIEW_ZOOM = 1;
export const MAX_PREVIEW_ZOOM = 20;

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
    name: string
    bgmapMode: BgmapMode
    displayMode: DisplayMode
    transparency: Transparency
    displacement: PixelVector
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
    _imageData?: Partial<ConversionResult & { _dupeIndex: number }> | number
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
    name: string
    extraProperties: {
        enabled: boolean
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
        section: DataSection
        compression: ImageCompressionType
    }
}

export interface EntityEditorState {
    currentComponent: string,
    preview: {
        backgroundColor: number
        anaglyph: boolean
        colliders: boolean
        wireframes: boolean
        palettes: string[]
        sprites: boolean
        zoom: number
        projectionDepth: number
    }
}
