import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import {
    BGMAP_PALETTE_0_DEFAULT_VALUE,
    BGMAP_PALETTE_1_DEFAULT_VALUE,
    BGMAP_PALETTE_2_DEFAULT_VALUE,
    BGMAP_PALETTE_3_DEFAULT_VALUE,
    EngineConfigData,
    OBJECT_PALETTE_0_DEFAULT_VALUE,
    OBJECT_PALETTE_1_DEFAULT_VALUE,
    OBJECT_PALETTE_2_DEFAULT_VALUE,
    OBJECT_PALETTE_3_DEFAULT_VALUE,
    PRINTING_PALETTE_DEFAULT_VALUE,
    PRINTING_PALETTE_MAX_VALUE,
    PRINTING_PALETTE_MIN_VALUE
} from '../EngineConfigEditorTypes';
import Palette from '../../Common/Palette';
import HContainer from '../../Common/Base/HContainer';
import { nls } from '@theia/core';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';

interface EngineConfigPalettesProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigPalettes(props: EngineConfigPalettesProps): React.JSX.Element {
    const { data, updateData } = props;

    const setPalette = (key: string, value: string): void => {
        updateData({
            ...data,
            palettes: {
                ...(data.palettes ?? {}),
                [key]: value,
            }
        });
    };

    const setPrintingPalette = (printingPalette: number): void => {
        updateData({
            ...data,
            palettes: {
                ...(data.palettes ?? {}),
                printingPalette: clamp(printingPalette, PRINTING_PALETTE_MIN_VALUE, PRINTING_PALETTE_MAX_VALUE, PRINTING_PALETTE_DEFAULT_VALUE),
            }
        });
    };

    return (
        <VContainer gap={10}>
            <VContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                    </label>
                    <InfoLabel
                        label={nls.localize('vuengine/engineConfigEditor/palettes/palette', 'Palette')}
                        tooltip={nls.localize(
                            'vuengine/engineConfigEditor/palettes/paletteDescription',
                            'The default palette values, actual values are set in stage specs.'
                        )}
                        style={{ width: 232 }}
                    />
                    <InfoLabel
                        label={nls.localize('vuengine/engineConfigEditor/palettes/printing', 'Printing')}
                        tooltip={nls.localize(
                            'vuengine/engineConfigEditor/palettes/printingDescription',
                            'The BGMap palette that shall be used for text on the printing layer.'
                        )}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        BGMap 1
                    </label>
                    <Palette
                        value={data.palettes?.bgMapPalette0 ?? BGMAP_PALETTE_0_DEFAULT_VALUE}
                        updateValue={value => setPalette('bgMapPalette0', value)}
                    />
                    <input
                        type="checkbox"
                        checked={data.palettes?.printingPalette === 0}
                        onChange={() => setPrintingPalette(0)}
                    />
                </HContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        BGMap 2
                    </label>
                    <Palette
                        value={data.palettes?.bgMapPalette1 ?? BGMAP_PALETTE_1_DEFAULT_VALUE}
                        updateValue={value => setPalette('bgMapPalette1', value)}
                    />
                    <input
                        type="checkbox"
                        checked={data.palettes?.printingPalette === 1}
                        onChange={() => setPrintingPalette(1)}
                    />
                </HContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        BGMap 3
                    </label>
                    <Palette
                        value={data.palettes?.bgMapPalette2 ?? BGMAP_PALETTE_2_DEFAULT_VALUE}
                        updateValue={value => setPalette('bgMapPalette2', value)}
                    />
                    <input
                        type="checkbox"
                        checked={data.palettes?.printingPalette === 2}
                        onChange={() => setPrintingPalette(2)}
                    />
                </HContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        BGMap 4
                    </label>
                    <Palette
                        value={data.palettes?.bgMapPalette3 ?? BGMAP_PALETTE_3_DEFAULT_VALUE}
                        updateValue={value => setPalette('bgMapPalette3', value)}
                    />
                    <input
                        type="checkbox"
                        checked={data.palettes?.printingPalette === 3}
                        onChange={() => setPrintingPalette(3)}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        Object 1
                    </label>
                    <Palette
                        value={data.palettes?.objectPalette0 ?? OBJECT_PALETTE_0_DEFAULT_VALUE}
                        updateValue={value => setPalette('objectPalette0', value)}
                    />
                </HContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        Object 2
                    </label>
                    <Palette
                        value={data.palettes?.objectPalette1 ?? OBJECT_PALETTE_1_DEFAULT_VALUE}
                        updateValue={value => setPalette('objectPalette1', value)}
                    />
                </HContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        Object 3
                    </label>
                    <Palette
                        value={data.palettes?.objectPalette2 ?? OBJECT_PALETTE_2_DEFAULT_VALUE}
                        updateValue={value => setPalette('objectPalette2', value)}
                    />
                </HContainer>
                <HContainer alignItems="center" gap={10}>
                    <label style={{ width: 64 }}>
                        Object 4
                    </label>
                    <Palette
                        value={data.palettes?.objectPalette3 ?? OBJECT_PALETTE_3_DEFAULT_VALUE}
                        updateValue={value => setPalette('objectPalette3', value)}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
