import { nls } from '@theia/core';
import React from 'react';
import Input from '../../../Common/Base/Input';
import VContainer from '../../../Common/Base/VContainer';
import { EngineConfigData, TOTAL_TILES_DEFAULT_VALUE, TOTAL_TILES_MAX_VALUE, TOTAL_TILES_MIN_VALUE } from '../EngineConfigTypes';

interface EngineConfigTilesProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigTiles(props: EngineConfigTilesProps): React.JSX.Element {
    const { data, updateData } = props;

    const setTotalTiles = (totalTiles: number): void => {
        updateData({
            ...data,
            tiles: {
                ...(data.tiles ?? {}),
                totalTiles,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize(
                    'vuengine/editors/engineConfig/animation/availableTiles',
                    'Available Tiles'
                )}
                tooltip={nls.localize(
                    'vuengine/editors/engineConfig/animation/availableTilesDescription',
                    'The total number of available tiles in tile memory.',
                )}
                type="number"
                value={data.tiles?.totalTiles ?? TOTAL_TILES_DEFAULT_VALUE}
                setValue={v => setTotalTiles(v as number)}
                min={TOTAL_TILES_MIN_VALUE}
                max={TOTAL_TILES_MAX_VALUE}
                defaultValue={TOTAL_TILES_DEFAULT_VALUE}
                width={64}
            />
        </VContainer>
    );
}
