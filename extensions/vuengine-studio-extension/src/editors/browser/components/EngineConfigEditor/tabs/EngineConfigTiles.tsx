import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { EngineConfigData, TOTAL_TILES_DEFAULT_VALUE, TOTAL_TILES_MAX_VALUE, TOTAL_TILES_MIN_VALUE } from '../EngineConfigEditorTypes';

interface EngineConfigTilesProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigTiles(props: EngineConfigTilesProps): React.JSX.Element {
    const { data, updateData } = props;

    const setTotalChars = (totalTiles: number): void => {
        updateData({
            ...data,
            chars: {
                ...(data.chars ?? {}),
                totalTiles,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/animation/availableChars',
                    'Available Tiles'
                )}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/animation/availableCharsDescription',
                    'The total number of available chars in char memory.',
                )}
                type="number"
                value={data.chars?.totalTiles ?? TOTAL_TILES_DEFAULT_VALUE}
                setValue={setTotalChars}
                min={TOTAL_TILES_MIN_VALUE}
                max={TOTAL_TILES_MAX_VALUE}
                defaultValue={TOTAL_TILES_DEFAULT_VALUE}
                width={64}
            />
        </VContainer>
    );
}
