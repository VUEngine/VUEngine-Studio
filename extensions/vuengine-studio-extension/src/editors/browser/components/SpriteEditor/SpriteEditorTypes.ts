import { LayerDataForHook } from 'dotting';

export const DEFAULT_SPRITE_SIZE = 16;
export const PLACEHOLDER_LAYER_NAME = 'placeholderLayer';

export interface ExtraSpriteLayerData {
    name: string
}

export interface SpriteData {
    dimensions: {
        x: number
        y: number
    }
    layers: SpriteLayersData
}

export interface SpriteLayersData {
    [id: string]: (LayerDataForHook & ExtraSpriteLayerData)
}
