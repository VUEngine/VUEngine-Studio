import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import {
    BRIGHTNESS_BRIGHT_DEFAULT_VALUE,
    BRIGHTNESS_BRIGHT_MAX_VALUE,
    BRIGHTNESS_BRIGHT_MIN_VALUE,
    BRIGHTNESS_DARK_DEFAULT_VALUE,
    BRIGHTNESS_DARK_MAX_VALUE,
    BRIGHTNESS_DARK_MIN_VALUE,
    BRIGHTNESS_MEDIUM_DEFAULT_VALUE,
    BRIGHTNESS_MEDIUM_MAX_VALUE,
    BRIGHTNESS_MEDIUM_MIN_VALUE,
    EngineConfigData,
    FADE_DELAY_DEFAULT_VALUE,
    FADE_DELAY_MAX_VALUE,
    FADE_DELAY_MIN_VALUE,
    FADE_INCREMENT_DEFAULT_VALUE,
    FADE_INCREMENT_MAX_VALUE,
    FADE_INCREMENT_MIN_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigBrightnessProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigBrightness(props: EngineConfigBrightnessProps): React.JSX.Element {
    const { data, updateData } = props;

    const setBrightnessBright = (value: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                brightRed: clamp(
                    value,
                    BRIGHTNESS_BRIGHT_MIN_VALUE,
                    BRIGHTNESS_BRIGHT_MAX_VALUE,
                    BRIGHTNESS_BRIGHT_DEFAULT_VALUE
                )
            },
        });
    };

    const setBrightnessMedium = (value: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                mediumRed: clamp(
                    value,
                    BRIGHTNESS_MEDIUM_MIN_VALUE,
                    BRIGHTNESS_MEDIUM_MAX_VALUE,
                    BRIGHTNESS_MEDIUM_DEFAULT_VALUE
                )
            },
        });
    };

    const setBrightnessDark = (value: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                darkRed: clamp(
                    value,
                    BRIGHTNESS_DARK_MIN_VALUE,
                    BRIGHTNESS_DARK_MAX_VALUE,
                    BRIGHTNESS_DARK_DEFAULT_VALUE
                )
            },
        });
    };

    const setFadeDelay = (fadeDelay: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                fadeDelay: clamp(
                    fadeDelay,
                    FADE_DELAY_MIN_VALUE,
                    FADE_DELAY_MAX_VALUE,
                    FADE_DELAY_DEFAULT_VALUE
                )
            },
        });
    };

    const setFadeIncrement = (fadeIncrement: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                fadeIncrement: clamp(
                    fadeIncrement,
                    FADE_INCREMENT_MIN_VALUE,
                    FADE_INCREMENT_MAX_VALUE,
                    FADE_INCREMENT_DEFAULT_VALUE
                )
            },
        });
    };

    let brightnessWarning;
    if (data.brightness?.brightRed <= (data.brightness?.mediumRed + data.brightness?.darkRed)) {
        brightnessWarning = nls.localize(
            'vuengine/engineConfigEditor/brightness/brightnessWarning',
            'Bright Red must be larger than Medium Red + Dark Red.'
        );
    }

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/brightness/brightness', 'Brightness (Bright, Medium, Dark)')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/brightness/brightnessDescription',
                        'The default brightness settings, actual values are set in stage specs. ' +
                        'For a nice progression, each shade should be about twice as big as the previous one.'
                    )}
                />
                <HContainer>
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.brightness?.brightRed ?? BRIGHTNESS_BRIGHT_DEFAULT_VALUE}
                        min={BRIGHTNESS_BRIGHT_MIN_VALUE}
                        max={BRIGHTNESS_BRIGHT_MAX_VALUE}
                        onChange={e => setBrightnessBright(e.target.value === '' ? BRIGHTNESS_BRIGHT_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.brightness?.mediumRed ?? BRIGHTNESS_MEDIUM_DEFAULT_VALUE}
                        min={BRIGHTNESS_MEDIUM_MIN_VALUE}
                        max={BRIGHTNESS_MEDIUM_MAX_VALUE}
                        onChange={e => setBrightnessMedium(e.target.value === '' ? BRIGHTNESS_MEDIUM_MIN_VALUE : parseInt(e.target.value))}
                    />
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.brightness?.darkRed ?? BRIGHTNESS_DARK_DEFAULT_VALUE}
                        min={BRIGHTNESS_DARK_MIN_VALUE}
                        max={BRIGHTNESS_DARK_MAX_VALUE}
                        onChange={e => setBrightnessDark(e.target.value === '' ? BRIGHTNESS_DARK_MIN_VALUE : parseInt(e.target.value))}
                    />
                </HContainer>
                {brightnessWarning &&
                    <div className="error">
                        <i className="codicon codicon-warning" style={{ verticalAlign: 'bottom' }} /> {brightnessWarning}
                    </div>
                }
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/brightness/fadeDelay', 'Fade Delay (ms)')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/brightness/fadeDelayDescription',
                        'The default delay between steps in synchronous fade effects in milliseconds.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.brightness?.fadeDelay ?? FADE_DELAY_DEFAULT_VALUE}
                    min={FADE_DELAY_MIN_VALUE}
                    max={FADE_DELAY_MAX_VALUE}
                    onChange={e => setFadeDelay(e.target.value === '' ? FADE_DELAY_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/engineConfigEditor/brightness/fadeIncrement', 'Fade Increment')}
                    tooltip={nls.localize(
                        'vuengine/engineConfigEditor/brightness/fadeIncrementDescription',
                        'The defaul step increment in asynchronous fade transitions.'
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.brightness?.fadeIncrement ?? FADE_INCREMENT_DEFAULT_VALUE}
                    min={FADE_INCREMENT_MIN_VALUE}
                    max={FADE_INCREMENT_MAX_VALUE}
                    onChange={e => setFadeIncrement(e.target.value === '' ? FADE_INCREMENT_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
