import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
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

    const setPosition = (axis: 'x' | 'y', position: number): void => {
        updateData({
            ...data,
            exceptions: {
                ...(data.exceptions ?? {}),
                position: {
                    ...(data.exceptions?.position ?? {}),
                    [axis]: position,
                },
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/exceptions/position', 'Position (x, y)')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/exceptions/positionDescription',
                        'The camera coordinates for the output of exceptions.'
                    )}
                />
                <HContainer>
                    <Input
                        type="number"
                        value={data.exceptions?.position?.x ?? EXCEPTION_POSITION_X_DEFAULT_VALUE}
                        setValue={position => setPosition('x', position as number)}
                        min={EXCEPTION_POSITION_X_MIN_VALUE}
                        max={EXCEPTION_POSITION_X_MAX_VALUE}
                        defaultValue={EXCEPTION_POSITION_X_DEFAULT_VALUE}
                        width={64}
                    />
                    <Input
                        type="number"
                        value={data.exceptions?.position?.y ?? EXCEPTION_POSITION_Y_DEFAULT_VALUE}
                        setValue={position => setPosition('y', position as number)}
                        min={EXCEPTION_POSITION_Y_MIN_VALUE}
                        max={EXCEPTION_POSITION_Y_MAX_VALUE}
                        defaultValue={EXCEPTION_POSITION_Y_DEFAULT_VALUE}
                        width={64}
                    />
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
