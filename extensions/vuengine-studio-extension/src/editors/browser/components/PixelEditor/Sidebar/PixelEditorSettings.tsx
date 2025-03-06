import { ArrowsOut, GridFour } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { PixelEditorTool } from './PixelEditorTool';

interface PixelEditorSettingsProps {
    allowResize?: boolean
    setAllowResize?: (allowResize: boolean) => void
    gridSize: number
    setGridSize: (gridSize: number) => void
}

export default function PixelEditorSettings(props: PixelEditorSettingsProps): React.JSX.Element {
    const { gridSize, setGridSize, allowResize, setAllowResize } = props;

    const toggleGrid = (): void => {
        setGridSize(gridSize > 0 ? 0 : 1);
    };

    return (
        <VContainer>
            <label>
                {nls.localizeByDefault('Settings')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                <PixelEditorTool
                    className={gridSize > 0 ? 'active' : ''}
                    onClick={toggleGrid}
                >
                    <GridFour size={20} />
                </PixelEditorTool>
                {allowResize !== undefined && setAllowResize !== undefined &&
                    <PixelEditorTool
                        className={allowResize ? 'active' : ''}
                        onClick={() => setAllowResize(!allowResize)}
                    >
                        <ArrowsOut size={20} />
                    </PixelEditorTool>
                }
            </HContainer>
        </VContainer>
    );
}
