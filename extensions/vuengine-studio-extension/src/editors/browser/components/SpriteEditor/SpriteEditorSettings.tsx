import { ArrowsOut, GridFour } from '@phosphor-icons/react';
import React from 'react';
import HContainer from '../Common/HContainer';

interface SpriteEditorSettingsProps {
    allowResize: boolean
    setAllowResize: (allowResize: boolean) => void
    gridSize: number
    setGridSize: (gridSize: number) => void
}

export default function SpriteEditorSettings(props: SpriteEditorSettingsProps): React.JSX.Element {
    const { gridSize, setGridSize, allowResize, setAllowResize } = props;

    const toggleGrid = (): void => {
        setGridSize(gridSize > 0 ? 0 : 1);
    };

    return (
        <HContainer gap={2} wrap='wrap'>
            <div
                className={`tool${gridSize > 0 ? ' active' : ''}`}
                onClick={toggleGrid}
            >
                <GridFour size={20} />
            </div>
            <div
                className={`tool${allowResize ? ' active' : ''}`}
                onClick={() => setAllowResize(!allowResize)}
            >
                <ArrowsOut size={20} />
            </div>
        </HContainer>
    );
}
