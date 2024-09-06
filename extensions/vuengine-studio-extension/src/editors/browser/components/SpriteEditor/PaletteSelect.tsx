import { nls } from '@theia/core';
import { DottingRef, useBrush, useHandlers } from 'dotting';
import React, { useContext, useEffect } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import { EDITORS_COMMANDS } from '../../ves-editors-commands';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { SpriteEditorTool } from './SpriteEditorTool';

interface PaletteSelectProps {
    colorMode?: ColorMode
    setColorMode?: (color: ColorMode) => void
    primaryColorIndex: number
    setPrimaryColorIndex: (color: number) => void
    secondaryColorIndex: number
    setSecondaryColorIndex: (color: number) => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PaletteSelect(props: PaletteSelectProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { colorMode, setColorMode, primaryColorIndex, setPrimaryColorIndex, secondaryColorIndex, setSecondaryColorIndex, dottingRef } = props;
    const { changeBrushColor } = useBrush(dottingRef);
    const { addCanvasElementEventListener, removeCanvasElementEventListener } = useHandlers(dottingRef);

    const paletteColors = PALETTE_COLORS[colorMode ?? ColorMode.Default];

    const toggleHiColor = (): void => {
        setPrimaryColorIndex(mapColors(primaryColorIndex));
        setSecondaryColorIndex(mapColors(secondaryColorIndex));

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
            changeBrushColor(paletteColors[secondaryColorIndex]);
        }
    };
    const handleMouseUp = (e: MouseEvent) => {
        changeBrushColor(paletteColors[primaryColorIndex]);
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case EDITORS_COMMANDS.FontEditor.commands.swapColors.id:
                const secColorIndex = secondaryColorIndex;
                setSecondaryColorIndex(primaryColorIndex);
                setPrimaryColorIndex(secColorIndex);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex1.id:
                setPrimaryColorIndex(0);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex2.id:
                setPrimaryColorIndex(1);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex3.id:
                setPrimaryColorIndex(2);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex4.id:
                setPrimaryColorIndex(3);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex5.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(4);
                }
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex6.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(5);
                }
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex7.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(6);
                }
                break;
        }
    };

    useEffect(() => {
        addCanvasElementEventListener('mousedown', handleMouseDown);
        addCanvasElementEventListener('mouseup', handleMouseUp);
        return () => {
            removeCanvasElementEventListener('mousedown', handleMouseDown);
            removeCanvasElementEventListener('mouseup', handleMouseUp);
        };
    }, [secondaryColorIndex, primaryColorIndex]);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        primaryColorIndex,
        secondaryColorIndex,
    ]);

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/spriteEditor/palette', 'Palette')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                {colorMode !== undefined && setColorMode !== undefined &&
                    <SpriteEditorTool
                        onClick={toggleHiColor}
                        style={{ width: 70 }}
                    >
                        {colorMode === ColorMode.FrameBlend
                            ? ' HiColor'
                            : nls.localize('vuengine/spriteEditor/4colors', '4 Colors')}
                    </SpriteEditorTool>
                }
                {[...Array(paletteColors.length)].map((p, paletteIndex) => (
                    <SpriteEditorTool
                        key={paletteIndex}
                        className={primaryColorIndex === paletteIndex ? 'active' : ''}
                        style={{
                            backgroundColor: paletteColors[paletteIndex],
                            color: '#fff',
                        }}
                        title={
                            nls.localize('vuengine/spriteEditor/paletteIndex', 'Palette Index') + ' ' + (paletteIndex + 1) +
                            // @ts-ignore
                            services.vesCommonService.getKeybindingLabel(EDITORS_COMMANDS.FontEditor.commands[`paletteSelectIndex${paletteIndex + 1}`].id, true)
                        }
                        onClick={() => setPrimaryColorIndex(paletteIndex)}
                        onContextMenu={() => setSecondaryColorIndex(paletteIndex)}
                    >
                        {primaryColorIndex === paletteIndex && 'L'}
                        {secondaryColorIndex === paletteIndex && 'R'}
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
        </VContainer >
    );
}
