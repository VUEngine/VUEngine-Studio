import React, { useEffect } from 'react';
import { PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import HContainer from '../Common/HContainer';
import { DottingRef, useBrush, useHandlers } from 'dotting';

interface PaletteSelectProps {
    primaryColor: number
    setPrimaryColor: (color: number) => void
    secondaryColor: number
    setSecondaryColor: (color: number) => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PaletteSelect(props: PaletteSelectProps): React.JSX.Element {
    const { primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor, dottingRef } = props;
    const { changeBrushColor } = useBrush(dottingRef);
    const { addCanvasElementEventListener, removeCanvasElementEventListener } = useHandlers(dottingRef);

    const onKeyDown = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'KeyX') {
            const secColor = secondaryColor;
            setSecondaryColor(primaryColor);
            setPrimaryColor(secColor);
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (e.buttons === 2) {
            changeBrushColor(PALETTE_COLORS[secondaryColor]);
        }
    };
    const handleMouseUp = (e: MouseEvent) => {
        changeBrushColor(PALETTE_COLORS[primaryColor]);
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        addCanvasElementEventListener('mousedown', handleMouseDown);
        addCanvasElementEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            removeCanvasElementEventListener('mousedown', handleMouseDown);
            removeCanvasElementEventListener('mouseup', handleMouseUp);
        };
    }, [secondaryColor, primaryColor]);

    return (
        <HContainer gap={2} wrap='wrap'>
            {[3, 2, 1, 0].map(paletteIndex => (
                <div
                    key={paletteIndex}
                    className={`tool ${primaryColor === paletteIndex ? 'active' : undefined}`}
                    style={{ backgroundColor: PALETTE_COLORS[paletteIndex] }}
                    onClick={() => setPrimaryColor(paletteIndex)}
                    onContextMenu={() => setSecondaryColor(paletteIndex)}
                >
                    {primaryColor === paletteIndex && 'L'}
                    {secondaryColor === paletteIndex && 'R'}
                </div>
            ))}
        </HContainer>
    );
}
