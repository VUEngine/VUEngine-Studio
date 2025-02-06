import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import {
    DELAYED_MESSAGES_HALF_FRAME_RATE_DEFAULT_VALUE,
    EngineConfigData,
    FRAME_CYCLE_DEFAULT_VALUE,
    FRAME_CYCLE_MAX_VALUE,
    FRAME_CYCLE_MIN_VALUE,
    TARGET_FPS_OPTIONS,
    TIMER_RESOLUTION_DEFAULT_VALUE,
    TIMER_RESOLUTION_MAX_VALUE,
    TIMER_RESOLUTION_MIN_VALUE
} from '../EngineConfigEditorTypes';
import RadioSelect from '../../Common/Base/RadioSelect';

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
                timerResolution: clamp(
                    timerResolution,
                    TIMER_RESOLUTION_MIN_VALUE,
                    TIMER_RESOLUTION_MAX_VALUE,
                    TIMER_RESOLUTION_DEFAULT_VALUE
                )
            },
        });
    };

    const toggleRunDelayedMessagesAtHalfFrameRate = (): void => {
        updateData({
            ...data,
            frameRate: {
                ...(data.frameRate ?? {}),
                runDelayedMessagesAtHalfFrameRate: !(data.frameRate?.runDelayedMessagesAtHalfFrameRate
                    ?? DELAYED_MESSAGES_HALF_FRAME_RATE_DEFAULT_VALUE),
            }
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
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/framerate/timerResolution', 'Timer Resolution')}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.frameRate?.timerResolution ?? TIMER_RESOLUTION_DEFAULT_VALUE}
                    min={TIMER_RESOLUTION_MIN_VALUE}
                    max={TIMER_RESOLUTION_MAX_VALUE}
                    onChange={e => setTimerResolution(e.target.value === '' ? TIMER_RESOLUTION_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize(
                        'vuengine/editors/engineConfig/framerate/runDelayedMessagesAtHalfFrameRate',
                        'Run Delayed Messages At Half Frame Rate'
                    )}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/framerate/runDelayedMessagesAtHalfFrameRateDescription',
                        'Dispatch delayed messages every other game frame cycle only.',
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.frameRate?.runDelayedMessagesAtHalfFrameRate ?? DELAYED_MESSAGES_HALF_FRAME_RATE_DEFAULT_VALUE}
                    onChange={() => toggleRunDelayedMessagesAtHalfFrameRate()}
                />
            </VContainer>
        </VContainer>
    );
}
