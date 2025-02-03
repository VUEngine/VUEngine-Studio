import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import {
    EngineConfigData,
    EXCEPTION_POSITION_X_DEFAULT_VALUE,
    EXCEPTION_POSITION_X_MAX_VALUE,
    EXCEPTION_POSITION_X_MIN_VALUE,
    EXCEPTION_POSITION_Y_DEFAULT_VALUE,
    EXCEPTION_POSITION_Y_MAX_VALUE,
    EXCEPTION_POSITION_Y_MIN_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigExceptionsProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigExceptions(props: EngineConfigExceptionsProps): React.JSX.Element {
    const { data, updateData } = props;

    const setPositionX = (position: number): void => {
        updateData({
            ...data,
            exceptions: {
                ...(data.exceptions ?? {}),
                position: {
                    ...(data.exceptions?.position ?? {}),
                    x: clamp(
                        position,
                        EXCEPTION_POSITION_X_MIN_VALUE,
                        EXCEPTION_POSITION_X_MAX_VALUE,
                        EXCEPTION_POSITION_X_DEFAULT_VALUE
                    )
                },
            }
        });
    };

    const setPositionY = (position: number): void => {
        updateData({
            ...data,
            exceptions: {
                ...(data.exceptions ?? {}),
                position: {
                    ...(data.exceptions?.position ?? {}),
                    y: clamp(
                        position,
                        EXCEPTION_POSITION_Y_MIN_VALUE,
                        EXCEPTION_POSITION_Y_MAX_VALUE,
                        EXCEPTION_POSITION_Y_DEFAULT_VALUE
                    )
                },
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/exceptions/position', 'Position (x, y)')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/exceptions/positionDescription',
                        'The camera coordinates for the output of exceptions.'
                    )}
                />
                <HContainer>
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.exceptions?.position?.x ?? EXCEPTION_POSITION_X_DEFAULT_VALUE}
                        min={EXCEPTION_POSITION_X_MIN_VALUE}
                        max={EXCEPTION_POSITION_X_MAX_VALUE}
                        onChange={e => setPositionX(e.target.value === '' ? EXCEPTION_POSITION_X_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.exceptions?.position?.y ?? EXCEPTION_POSITION_Y_DEFAULT_VALUE}
                        min={EXCEPTION_POSITION_Y_MIN_VALUE}
                        max={EXCEPTION_POSITION_Y_MAX_VALUE}
                        onChange={e => setPositionY(e.target.value === '' ? EXCEPTION_POSITION_Y_MIN_VALUE : parseInt(e.target.value))}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
