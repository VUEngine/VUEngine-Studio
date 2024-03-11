import { LayerDataForHook } from 'dotting';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import { Displays } from '../Common/VUEngineTypes';

export const DEFAULT_SPRITE_SIZE = 16;
export const PLACEHOLDER_LAYER_NAME = 'placeholderLayer';

export interface ExtraSpriteLayerData {
    name: string
    parallax: number
    displayMode: Displays
}

export interface SpriteData {
    colorMode: ColorMode
    dimensions: {
        x: number
        y: number
    }
    layers: SpriteLayersData
}

export interface SpriteLayersData {
    [id: string]: (LayerDataForHook & ExtraSpriteLayerData)
}

export const DOT_BRUSH_PATTERNS = [
    [
        [1],
    ],
    [
        [1, 1],
        [1, 1],
    ],
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
    ],
    [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
    ],
    [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [0, 1, 1, 0],
    ],
    [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
    ],
    [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
    ],
    [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
    ],
    [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
    ],
];
