import { ArrowsOut, GridFour } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { SpriteEditorTool } from './SpriteEditorTool';

interface SpriteEditorSettingsProps {
    allowResize?: boolean
    setAllowResize?: (allowResize: boolean) => void
    gridSize: number
    setGridSize: (gridSize: number) => void
}

export default function SpriteEditorSettings(props: SpriteEditorSettingsProps): React.JSX.Element {
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
                <SpriteEditorTool
                    className={gridSize > 0 ? 'active' : ''}
                    onClick={toggleGrid}
                >
                    <GridFour size={20} />
                </SpriteEditorTool>
                {allowResize !== undefined && setAllowResize !== undefined &&
                    <SpriteEditorTool
                        className={allowResize ? 'active' : ''}
                        onClick={() => setAllowResize(!allowResize)}
                    >
                        <ArrowsOut size={20} />
                    </SpriteEditorTool>
                }
            </HContainer>
        </VContainer>
    );
}
