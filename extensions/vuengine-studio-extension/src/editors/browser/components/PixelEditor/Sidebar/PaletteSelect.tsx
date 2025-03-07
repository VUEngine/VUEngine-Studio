import { nls } from '@theia/core';
import { DottingRef, useBrush, useHandlers } from 'dotting';
import React, { useContext, useEffect } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../core/browser/ves-common-types';
import { EditorCommand, EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { PixelEditorCommands } from '../PixelEditorCommands';
import { PixelEditorTool } from './PixelEditorTool';

const PALETTE_COMMANDS: EditorCommand[] = [
    PixelEditorCommands.PALETTE_SELECT_INDEX_0,
    PixelEditorCommands.PALETTE_SELECT_INDEX_1,
    PixelEditorCommands.PALETTE_SELECT_INDEX_2,
    PixelEditorCommands.PALETTE_SELECT_INDEX_3,
    PixelEditorCommands.PALETTE_SELECT_INDEX_4,
    PixelEditorCommands.PALETTE_SELECT_INDEX_5,
    PixelEditorCommands.PALETTE_SELECT_INDEX_6,
    PixelEditorCommands.PALETTE_SELECT_INDEX_7,
];

interface PaletteSelectProps {
    colorMode?: ColorMode
    setColorMode?: (color: ColorMode) => void
    primaryColorIndex: number
    setPrimaryColorIndex: (color: number) => void
    secondaryColorIndex: number
    setSecondaryColorIndex: (color: number) => void
    includeTransparent: boolean
    dottingRef: React.RefObject<DottingRef>
}

export default function PaletteSelect(props: PaletteSelectProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { colorMode, setColorMode, primaryColorIndex, setPrimaryColorIndex, secondaryColorIndex, setSecondaryColorIndex, includeTransparent, dottingRef } = props;
    const { changeBrushColor } = useBrush(dottingRef);
    const { addCanvasElementEventListener, removeCanvasElementEventListener } = useHandlers(dottingRef);

    const paletteColors = [
        ...PALETTE_COLORS[colorMode ?? ColorMode.Default],
    ];
    if (includeTransparent) {
        paletteColors.unshift('');
    }

    const toggleHiColor = (): void => {
        setPrimaryColorIndex(mapColors(primaryColorIndex));
        setSecondaryColorIndex(mapColors(secondaryColorIndex));

        if (setColorMode) {
            setColorMode(colorMode === ColorMode.Default ? ColorMode.FrameBlend : ColorMode.Default);
        }
    };

    const mapColors = (color: number): number => {
        if (colorMode === ColorMode.Default) {
            switch (color) {
                case 0:
                    return 0;
                case 1:
                    return 1;
                case 2:
                    return 3;
                case 3:
                    return 5;
                case 4:
                    return 7;
            }
        } else {
            switch (color) {
                case 0:
                    return 0;
                case 1:
                case 2:
                    return 1;
                case 3:
                case 4:
                    return 2;
                case 5:
                case 6:
                    return 3;
                case 7:
                    return 4;
            }
        }

        return 0;
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
            case PixelEditorCommands.SWAP_COLORS.id:
                const secColorIndex = secondaryColorIndex;
                setSecondaryColorIndex(primaryColorIndex);
                setPrimaryColorIndex(secColorIndex);
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_0.id:
                setPrimaryColorIndex(0);
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_1.id:
                setPrimaryColorIndex(includeTransparent ? 1 : 0);
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_2.id:
                setPrimaryColorIndex(includeTransparent ? 2 : 1);
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_3.id:
                setPrimaryColorIndex(includeTransparent ? 3 : 2);
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_4.id:
                setPrimaryColorIndex(includeTransparent ? 4 : 3);
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_5.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(includeTransparent ? 5 : 4);
                }
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_6.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(includeTransparent ? 6 : 5);
                }
                break;
            case PixelEditorCommands.PALETTE_SELECT_INDEX_7.id:
                if (colorMode === ColorMode.FrameBlend) {
                    setPrimaryColorIndex(includeTransparent ? 7 : 6);
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

    useEffect(() => {
        changeBrushColor(paletteColors[primaryColorIndex]);
    }, [
        primaryColorIndex,
    ]);

    return (
        <VContainer>
            {colorMode !== undefined && setColorMode !== undefined
                ? <InfoLabel
                    label={nls.localize('vuengine/editors/pixel/palette', 'Palette')}
                    tooltip={<>
                        <div>
                            {nls.localize(
                                'vuengine/editors/pixel/colorModeDescription',
                                "Whether to use the system's default 4 color palette or HiColor mode, \
which simulates 7 colors by blending together adjacent frames to create mix colors."
                            )}
                        </div>
                        <div>
                            {nls.localize(
                                'vuengine/editors/pixel/colorModeHiColorMemoryNote',
                                'Note: HiColor sprites consume more video memory space than regular sprites.'
                            )}
                        </div>
                        <div>
                            {nls.localize(
                                'vuengine/editors/pixel/colorModeHiColorFlickerNote',
                                'Note: Mixed colors look fine on hardware, but flicker on emulators.'
                            )}
                        </div>
                        <div>
                            {nls.localize(
                                'vuengine/editors/pixel/colorModeHiColorMaxHeightNote',
                                'Note: HiColor sprites can be 256 pixels high max.'
                            )}
                        </div>
                    </>}
                    tooltipPosition='bottom'
                />
                : <label>
                    {nls.localize('vuengine/editors/pixel/palette', 'Palette')}
                </label>
            }
            <HContainer gap={2} wrap={colorMode !== undefined && setColorMode !== undefined ? 'nowrap' : 'wrap'}>
                {colorMode !== undefined && setColorMode !== undefined &&
                    <PixelEditorTool
                        onClick={toggleHiColor}
                        style={{ minWidth: 70 }}
                    >
                        {colorMode === ColorMode.FrameBlend
                            ? ' HiColor'
                            : nls.localizeByDefault('Default')}
                    </PixelEditorTool>
                }
                {[...Array(paletteColors.length)].map((p, paletteIndex) =>
                    <PixelEditorTool
                        key={paletteIndex}
                        className={primaryColorIndex === paletteIndex ? 'active' : ''}
                        style={{
                            backgroundColor: paletteIndex === 0 ? 'var(--theia-editor-background)' : paletteColors[paletteIndex],
                            color: '#fff',
                        }}
                        title={
                            PALETTE_COMMANDS[paletteIndex].label +
                            services.vesCommonService.getKeybindingLabel(PALETTE_COMMANDS[paletteIndex].id, true)
                        }
                        onClick={() => setPrimaryColorIndex(paletteIndex)}
                        onContextMenu={() => setSecondaryColorIndex(paletteIndex)}
                    >
                        {primaryColorIndex === paletteIndex && 'L'}
                        {secondaryColorIndex === paletteIndex && 'R'}
                    </PixelEditorTool>
                )}
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
