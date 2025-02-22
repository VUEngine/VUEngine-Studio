import { LayerProps } from 'dotting';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import { Displays } from '../Common/VUEngineTypes';

export const DEFAULT_SPRITE_SIZE = 16;

export interface LayerAttributes {
    name: string
    parallax: number
    displayMode: Displays
    isVisible: boolean
}

export interface SpriteData {
    colorMode: ColorMode
    dimensions: {
        x: number
        y: number
    }
    frames: LayerProps[][]
    layerAttributes: LayerAttributesMap
}

export interface LayerAttributesMap {
    [id: string]: LayerAttributes
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
    /*
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
    */
];
