import { createContext } from 'react';
import { Brightness, PixelSize, PixelVector, Vector3D } from '../Common/VUEngineTypes';
import { PositionedEntityData } from '../EntityEditor/EntityEditorTypes';
import { StageEditorSaveDataOptions } from './StageEditor';

// @ts-ignore
export const StageEditorContext = createContext<StageEditorContextType>({});

export interface StageEditorContextType {
    state: StageEditorState
    setState: (state: Partial<StageEditorState>) => void
    data: StageData
    setData: (partialData: Partial<StageData>, options?: StageEditorSaveDataOptions) => Promise<void>
}

export interface StageEntityData {
    pinToScreen: boolean // true -> UI, false -> normal
}

export interface StageData {
    assets: {
        charSetSpecs: string[]
        fontSpecs: string[]
        sounds: string[]
        textureSpecs: string[]
    }
    entities: (PositionedEntityData & StageEntityData)[]
    level: {
        cameraFrustum: {
            x0: number
            x1: number
            y0: number
            y1: number
            z0: number
            z1: number
        }
        cameraInitialPosition: PixelVector
        size: PixelSize
    }
    physics: {
        frictionCoefficient: number
        gravity: Vector3D
    }
    rendering: {
        colorConfig: {
            backgroundColor: number
            brightness: Brightness
            brightnessRepeat: string
        }
        maximumAffineRowsToComputePerCall: number
        objectSpritesContainersSize: number[]
        objectSpritesContainersZPosition: number[]
        paletteConfig: {
            bgmap: {
                gplt0: number
                gplt1: number
                gplt2: number
                gplt3: number
            }
            object: {
                jplt0: number
                jplt1: number
                jplt2: number
                jplt3: number
            }
        }
        paramTableSegments: number
        pixelOptical: {
            maximumXViewDistance: number
            maximumYViewDistance: number
            cameraNearPlane: number
            baseDistance: number
            horizontalViewPointCenter: number
            verticalViewPointCenter: number
            scalingFactor: number
        }
        texturesMaximumRowsToWrite: number
    }
    sound: {
        midiPlaybackCounterPerInterrupt: number
        pcmTargetPlaybackFrameRate: number
    }
    streaming: {
        // TODO
    }
    timer: {
        resolution: number
        timePerInterrupt: number
        timePerInterruptUnits: number
    }
}

export interface StageEditorState {
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
