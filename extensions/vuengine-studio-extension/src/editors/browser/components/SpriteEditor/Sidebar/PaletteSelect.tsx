import { nls } from '@theia/core';
import { DottingRef, useBrush, useHandlers } from 'dotting';
import React, { useContext, useEffect } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { FontEditorCommands } from '../../FontEditor/FontEditorCommands';
import { SpriteEditorTool } from './SpriteEditorTool';
import InfoLabel from '../../Common/InfoLabel';

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
            case FontEditorCommands.SWAP_COLORS.id:
                const secColorIndex = secondaryColorIndex;
                setSecondaryColorIndex(primaryColorIndex);
                setPrimaryColorIndex(secColorIndex);
                break;
            case FontEditorCommands.PALETTE_SELECT_INDEX_1.id:
                setPrimaryColorIndex(0);
                break;
            case FontEditorCommands.PALETTE_SELECT_INDEX_2.id:
                setPrimaryColorIndex(1);
                break;
            case FontEditorCommands.PALETTE_SELECT_INDEX_3.id:
                setPrimaryColorIndex(2);
                break;
            case FontEditorCommands.PALETTE_SELECT_INDEX_4.id:
                setPrimaryColorIndex(3);
                break;
            case FontEditorCommands.PALETTE_SELECT_INDEX_5.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(4);
                }
                break;
            case FontEditorCommands.PALETTE_SELECT_INDEX_6.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(5);
                }
                break;
            case FontEditorCommands.PALETTE_SELECT_INDEX_7.id:
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
            {colorMode !== undefined && setColorMode !== undefined
                ? <InfoLabel
                    label={nls.localize('vuengine/editors/sprite/palette', 'Palette')}
                    tooltip={<>
                        <div>
                            {nls.localize(
                                'vuengine/editors/sprite/colorModeDescription',
                                "Whether to use the system's default 4 color palette or HiColor mode, \
which simulates 7 colors by blending together adjacent frames to create mix colors."
                            )}
                        </div>
                        <div>
                            {nls.localize(
                                'vuengine/editors/sprite/colorModeHiColorMemoryNote',
                                'Note: HiColor sprites consume more video memory space than regular sprites.'
                            )}
                        </div>
                        <div>
                            {nls.localize(
                                'vuengine/editors/sprite/colorModeHiColorFlickerNote',
                                'Note: Mixed colors look fine on hardware, but flicker on emulators.'
                            )}
                        </div>
                        <div>
                            {nls.localize(
                                'vuengine/editors/sprite/colorModeHiColorMaxHeightNote',
                                'Note: HiColor sprites can be 256 pixels high max.'
                            )}
                        </div>
                    </>}
                    tooltipPosition='bottom'
                />
                : <label>
                    {nls.localize('vuengine/editors/sprite/palette', 'Palette')}
                </label>
            }
            <HContainer gap={2} wrap={colorMode !== undefined && setColorMode !== undefined ? 'nowrap' : 'wrap'}>
                {colorMode !== undefined && setColorMode !== undefined &&
                    <SpriteEditorTool
                        onClick={toggleHiColor}
                        style={{ minWidth: 70 }}
                    >
                        {colorMode === ColorMode.FrameBlend
                            ? ' HiColor'
                            : nls.localizeByDefault('Default')}
                    </SpriteEditorTool>
                }
                {[...Array(paletteColors.length)].map((p, paletteIndex) => {
                    const commandId = () => {
                        switch (paletteIndex) {
                            default:
                            case 0: return FontEditorCommands.PALETTE_SELECT_INDEX_1.id;
                            case 1: return FontEditorCommands.PALETTE_SELECT_INDEX_2.id;
                            case 2: return FontEditorCommands.PALETTE_SELECT_INDEX_3.id;
                            case 3: return FontEditorCommands.PALETTE_SELECT_INDEX_4.id;
                            case 4: return FontEditorCommands.PALETTE_SELECT_INDEX_5.id;
                            case 5: return FontEditorCommands.PALETTE_SELECT_INDEX_6.id;
                            case 6: return FontEditorCommands.PALETTE_SELECT_INDEX_7.id;
                        }
                    };
                    return (<SpriteEditorTool
                        key={paletteIndex}
                        className={primaryColorIndex === paletteIndex ? 'active' : ''}
                        style={{
                            backgroundColor: paletteColors[paletteIndex],
                            color: '#fff',
                        }}
                        title={
                            nls.localize('vuengine/editors/sprite/paletteIndex', 'Palette Index') + ' ' + (paletteIndex + 1) +
                            services.vesCommonService.getKeybindingLabel(commandId(), true)
                        }
                        onClick={() => setPrimaryColorIndex(paletteIndex)}
                        onContextMenu={() => setSecondaryColorIndex(paletteIndex)}
                    >
                        {primaryColorIndex === paletteIndex && 'L'}
                        {secondaryColorIndex === paletteIndex && 'R'}
                    </SpriteEditorTool>
                    );
                })}
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
