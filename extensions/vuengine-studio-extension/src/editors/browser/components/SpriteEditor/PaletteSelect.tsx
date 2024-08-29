import { DottingRef, useBrush, useHandlers } from 'dotting';
import React, { useEffect } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { SpriteEditorTool } from './SpriteEditorTool';

interface PaletteSelectProps {
    colorMode?: ColorMode
    setColorMode?: (color: ColorMode) => void
    primaryColor: number
    setPrimaryColor: (color: number) => void
    secondaryColor: number
    setSecondaryColor: (color: number) => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PaletteSelect(props: PaletteSelectProps): React.JSX.Element {
    const { colorMode, setColorMode, primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor, dottingRef } = props;
    const { changeBrushColor } = useBrush(dottingRef);
    const { addCanvasElementEventListener, removeCanvasElementEventListener } = useHandlers(dottingRef);

    const paletteColors = PALETTE_COLORS[colorMode ?? ColorMode.Default];

    const toggleHiColor = (): void => {
        setPrimaryColor(mapColors(primaryColor));
        setSecondaryColor(mapColors(secondaryColor));

        if (setColorMode) {
            setColorMode(colorMode === ColorMode.Default ? ColorMode.FrameBlend : ColorMode.Default);
        }
    };

    const mapColors = (color: number): number => {
        switch (colorMode) {
            default:
            case ColorMode.Default:
                return color * 2;
            case ColorMode.FrameBlend:
                return Math.floor(color / 2);
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (e.buttons === 2) {
            changeBrushColor(paletteColors[secondaryColor]);
        }
    };
    const handleMouseUp = (e: MouseEvent) => {
        changeBrushColor(paletteColors[primaryColor]);
    };

    useEffect(() => {
        addCanvasElementEventListener('mousedown', handleMouseDown);
        addCanvasElementEventListener('mouseup', handleMouseUp);
        return () => {
            removeCanvasElementEventListener('mousedown', handleMouseDown);
            removeCanvasElementEventListener('mouseup', handleMouseUp);
        };
    }, [secondaryColor, primaryColor]);

    return (
        <VContainer>
            <HContainer gap={2} wrap='wrap'>
                {colorMode !== undefined && setColorMode !== undefined &&
                    <SpriteEditorTool
                        onClick={toggleHiColor}
                        style={{ width: 70 }}
                    >
                        {colorMode === ColorMode.FrameBlend ? ' HiColor' : '4 Colors'}
                    </SpriteEditorTool>
                }
                {[...Array(paletteColors.length)].map((p, paletteIndex) => (
                    <SpriteEditorTool
                        key={paletteIndex}
                        className={primaryColor === paletteIndex ? 'active' : ''}
                        style={{
                            backgroundColor: paletteColors[paletteIndex],
                            color: '#fff',
                        }}
                        onClick={() => setPrimaryColor(paletteIndex)}
                        onContextMenu={() => setSecondaryColor(paletteIndex)}
                    >
                        {primaryColor === paletteIndex && 'L'}
                        {secondaryColor === paletteIndex && 'R'}
                    </SpriteEditorTool>
                ))}
            </HContainer>
            { /* }
            <RadioSelect
                options={[{
                    label: 'Default',
                    value: ColorMode.Default,
                }, {
                    label: 'HiColor',
                    value: ColorMode.HiColor,
                }]}
                defaultValue={colorMode}
                onChange={options => toggleHiColor()}
            />
            { */ }
        </VContainer>
    );
}
