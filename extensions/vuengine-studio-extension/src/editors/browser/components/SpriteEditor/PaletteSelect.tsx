import { DottingRef, useBrush, useHandlers } from 'dotting';
import React, { useEffect } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import HContainer from '../Common/HContainer';
import { SpriteData } from './SpriteEditorTypes';
import VContainer from '../Common/VContainer';

interface PaletteSelectProps {
    data: SpriteData
    setData: (partialData: Partial<SpriteData>) => void
    colorMode: ColorMode
    primaryColor: number
    setPrimaryColor: (color: number) => void
    secondaryColor: number
    setSecondaryColor: (color: number) => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PaletteSelect(props: PaletteSelectProps): React.JSX.Element {
    const { data, setData, colorMode, primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor, dottingRef } = props;
    const { changeBrushColor } = useBrush(dottingRef);
    const { addCanvasElementEventListener, removeCanvasElementEventListener } = useHandlers(dottingRef);

    const toggleHiColor = (): void => {
        setPrimaryColor(mapColors(primaryColor));
        setSecondaryColor(mapColors(secondaryColor));

        setData({
            colorMode: data.colorMode === ColorMode.Default ? ColorMode.FrameBlend : ColorMode.Default,
        });
    };

    const mapColors = (color: number): number => {
        switch (data.colorMode) {
            default:
            case ColorMode.Default:
                return color * 2;
            case ColorMode.FrameBlend:
                return Math.floor(color / 2);
        }
    };

    const onKeyDown = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'KeyX') {
            const secColor = secondaryColor;
            setSecondaryColor(primaryColor);
            setPrimaryColor(secColor);
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (e.buttons === 2) {
            changeBrushColor(PALETTE_COLORS[colorMode][secondaryColor]);
        }
    };
    const handleMouseUp = (e: MouseEvent) => {
        changeBrushColor(PALETTE_COLORS[colorMode][primaryColor]);
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
        <VContainer>
            <HContainer gap={2} wrap='wrap'>
                <div
                    className={'tool'}
                    onClick={toggleHiColor}
                    style={{ width: 70 }}
                >
                    {data.colorMode === ColorMode.FrameBlend ? ' HiColor' : '4 Colors'}
                </div>
                {[...Array(PALETTE_COLORS[colorMode].length)].map((p, paletteIndex) => (
                    <div
                        key={paletteIndex}
                        className={`tool${primaryColor === paletteIndex ? ' active' : ''}`}
                        style={{ backgroundColor: PALETTE_COLORS[colorMode][paletteIndex] }}
                        onClick={() => setPrimaryColor(paletteIndex)}
                        onContextMenu={() => setSecondaryColor(paletteIndex)}
                    >
                        {primaryColor === paletteIndex && 'L'}
                        {secondaryColor === paletteIndex && 'R'}
                    </div>
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
