import { nls } from '@theia/core';
import { CanvasInfoChangeHandler, DottingRef, useDotting, useHandlers } from 'dotting';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import VContainer from '../../Common/Base/VContainer';
import CanvasImage from '../../Common/CanvasImage';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { mergeLayers } from '../PixelEditorFrames';
import { SpriteData } from '../PixelEditorTypes';

const NavigatorContainer = styled.div`
    align-items: center;
    background-color: var(--theia-editorGroupHeader-tabsBackground);
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    display: flex;
    flex-grow: 1;
    height: 180px;
    justify-content: center;
    max-height: 180px;
    position: relative;
`;

const CanvasContainer = styled.div`
    position: relative;

    canvas {
        height: 100%;
        width: 100%;
    }
`;

const NavigatorVisibleWindow = styled.div`
    border: 1px solid var(--theia-focusBorder);
    box-sizing: border-box;
    position: absolute;
    z-index: 1;
`;

interface PixelEditorNavigatorProps {
    data: SpriteData
    currentFrame: number
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorNavigator(props: PixelEditorNavigatorProps): React.JSX.Element {
    const { data, currentFrame, dottingRef } = props;
    const [bottomOffset, setBottomOffset] = useState<number>(0);
    const [leftOffset, setLeftOffset] = useState<number>(0);
    const [rightOffset, setRightOffset] = useState<number>(0);
    const [topOffset, setTopOffset] = useState<number>(0);
    const { addCanvasInfoChangeEventListener, removeCanvasInfoChangeEventListener } = useHandlers(dottingRef);
    const { getForegroundCanvas } = useDotting(dottingRef);

    const height = data.frames[currentFrame][0].data.length;
    const width = data.frames[currentFrame][0].data[0].length;
    const scale = Math.min(
        238 / width,
        178 / height
    );

    const canvasInfoChangeHandler: CanvasInfoChangeHandler = canvasInfo => {
        const canvas = getForegroundCanvas();

        setLeftOffset(canvasInfo.topLeftCornerOffset.x < 0
            ? Math.abs(canvasInfo.topLeftCornerOffset.x) / canvasInfo.gridSquareSize * scale
            : 0
        );
        setTopOffset(canvasInfo.topLeftCornerOffset.y < 0
            ? Math.abs(canvasInfo.topLeftCornerOffset.y) / canvasInfo.gridSquareSize * scale
            : 0
        );

        const r = canvasInfo.bottomRightCornerOffset.x - canvas.width;
        setRightOffset(r > 0
            ? r / canvasInfo.gridSquareSize * scale
            : 0
        );
        const b = canvasInfo.bottomRightCornerOffset.y - canvas.height;
        setBottomOffset(b > 0
            ? b / canvasInfo.gridSquareSize * scale
            : 0
        );
    };

    useEffect(() => {
        addCanvasInfoChangeEventListener(canvasInfoChangeHandler);
        return () => {
            removeCanvasInfoChangeEventListener(canvasInfoChangeHandler);
        };
    }, []);

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/pixel/navigator', 'Navigator')}
            </label>
            <NavigatorContainer>
                <CanvasContainer
                    style={{
                        height: data.frames[currentFrame][0].data.length * scale,
                        width: data.frames[currentFrame][0].data[0].length * scale,
                    }}
                >
                    <NavigatorVisibleWindow
                        style={{
                            height: `calc(100% - ${topOffset + bottomOffset}px)`,
                            marginLeft: leftOffset,
                            marginTop: topOffset,
                            visibility: bottomOffset + leftOffset + rightOffset + topOffset === 0 ? 'hidden' : 'visible',
                            width: `calc(100% - ${leftOffset + rightOffset}px)`,
                        }}
                    />
                    <CanvasImage
                        height={data.frames[currentFrame][0].data.length}
                        palette={'11100100'}
                        pixelData={[mergeLayers(data.frames[currentFrame])]}
                        displayMode={DisplayMode.Mono}
                        width={data.frames[currentFrame][0].data[0].length}
                        colorMode={data.colorMode}
                        drawBlack={true}
                    />
                </CanvasContainer>
            </NavigatorContainer>
        </VContainer>
    );
}
