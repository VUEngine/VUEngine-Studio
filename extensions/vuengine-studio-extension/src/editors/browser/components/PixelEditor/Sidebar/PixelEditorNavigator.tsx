/* eslint-disable no-null/no-null */
import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import CanvasImage from '../../Common/CanvasImage';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { LayerPixelData, SpriteData } from '../PixelEditorTypes';
import styled from 'styled-components';

const NavigatorContainer = styled.div`
    background-color: var(--theia-editorGroupHeader-tabsBackground);
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    display: flex;
    flex-grow: 1;
    height: 180px;
    max-height: 180px;
    position: relative;

    canvas {
        height: 100%;
        object-fit: contain;
        width: 100%;
    }
`;

interface PixelEditorNavigatorProps {
    data: SpriteData
    currentFrame: number
}

export default function PixelEditorNavigator(props: PixelEditorNavigatorProps): React.JSX.Element {
    const { data, currentFrame } = props;

    const mergeLayers = (layers: LayerPixelData[]): number[][] => {
        const result: number[][] = [];

        // initialize as all black
        for (let i = 0; i < data.dimensions.y; i++) {
            const row: number[] = [];
            for (let j = 0; j < data.dimensions.x; j++) {
                row.push(0);
            }
            result.push(row);
        }

        [...layers].reverse().forEach(layer => {
            layer.data.forEach((row, rowIndex) => row.forEach((color, columnIndex) => {
                if (color !== null) {
                    result[rowIndex][columnIndex] = color;
                }
            }));
        });

        return result;
    };

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/pixel/navigator', 'Navigator')}
            </label>
            <NavigatorContainer>
                <CanvasImage
                    height={data.dimensions.y}
                    palette={'11100100'}
                    pixelData={[mergeLayers(data.frames[currentFrame])]}
                    displayMode={DisplayMode.Mono}
                    width={data.dimensions.x}
                    colorMode={data.colorMode}
                    drawBlack={true}
                />
            </NavigatorContainer>
        </VContainer>
    );
}
