import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { EngineConfigData, TOTAL_CHARS_DEFAULT_VALUE, TOTAL_CHARS_MAX_VALUE, TOTAL_CHARS_MIN_VALUE } from '../EngineConfigEditorTypes';
import { clamp } from '../../Common/Utils';
import InfoLabel from '../../Common/InfoLabel';
import { nls } from '@theia/core';

interface EngineConfigTilesProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigTiles(props: EngineConfigTilesProps): React.JSX.Element {
    const { data, updateData } = props;

    const setTotalChars = (totalChars: number): void => {
        updateData({
            ...data,
            chars: {
                ...(data.chars ?? {}),
                totalChars: clamp(
                    totalChars,
                    TOTAL_CHARS_MIN_VALUE,
                    TOTAL_CHARS_MAX_VALUE,
                    TOTAL_CHARS_DEFAULT_VALUE
                ),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/engineConfigEditor/animation/availableChars',
                        'Available Tiles'
                    )}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/animation/availableCharsDescription',
                        'The total number of available chars in char memory.',
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.chars?.totalChars ?? TOTAL_CHARS_DEFAULT_VALUE}
                    min={TOTAL_CHARS_MIN_VALUE}
                    max={TOTAL_CHARS_MAX_VALUE}
                    onChange={e => setTotalChars(e.target.value === '' ? TOTAL_CHARS_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
