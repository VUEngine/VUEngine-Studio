import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import {
    EngineConfigData,
    FRAME_CYCLE_DEFAULT_VALUE,
    FRAME_CYCLE_MAX_VALUE,
    FRAME_CYCLE_MIN_VALUE,
    TARGET_FPS_OPTIONS,
    TIMER_RESOLUTION_DEFAULT_VALUE,
    TIMER_RESOLUTION_MAX_VALUE,
    TIMER_RESOLUTION_MIN_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigFrameRateProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigFrameRate(props: EngineConfigFrameRateProps): React.JSX.Element {
    const { data, updateData } = props;

    const setFrameCycle = (frameCycle: number): void => {
        updateData({
            ...data,
            frameRate: {
                ...(data.frameRate ?? {}),
                frameCycle: clamp(
                    frameCycle,
                    FRAME_CYCLE_MIN_VALUE,
                    FRAME_CYCLE_MAX_VALUE,
                    FRAME_CYCLE_DEFAULT_VALUE
                )
            },
        });
    };

    const setTimerResolution = (timerResolution: number): void => {
        updateData({
            ...data,
            frameRate: {
                ...(data.frameRate ?? {}),
                timerResolution
            },
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/framerate/targetFps', 'Target FPS')}
                />
                <RadioSelect
                    options={TARGET_FPS_OPTIONS.map((fps, index) => ({
                        value: index,
                        label: `${fps}`
                    }))}
                    defaultValue={data.frameRate?.frameCycle ?? FRAME_CYCLE_DEFAULT_VALUE}
                    onChange={options => setFrameCycle(options[0].value as number)}
                />
            </VContainer>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/framerate/timerResolution', 'Timer Resolution')}
                type="number"
                value={data.frameRate?.timerResolution ?? TIMER_RESOLUTION_DEFAULT_VALUE}
                setValue={setTimerResolution}
                min={TIMER_RESOLUTION_MIN_VALUE}
                max={TIMER_RESOLUTION_MAX_VALUE}
                defaultValue={TIMER_RESOLUTION_DEFAULT_VALUE}
                width={64}
            />
        </VContainer>
    );
}
