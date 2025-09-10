import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
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
                brightRed: value,
            },
        });
    };

    const setBrightnessMedium = (value: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                mediumRed: value,
            },
        });
    };

    const setBrightnessDark = (value: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                darkRed: value,
            },
        });
    };

    const setFadeDelay = (fadeDelay: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                fadeDelay,
            },
        });
    };

    const setFadeIncrement = (fadeIncrement: number): void => {
        updateData({
            ...data,
            brightness: {
                ...(data.brightness ?? {}),
                fadeIncrement,
            },
        });
    };

    let brightnessWarning;
    if (data.brightness?.brightRed <= (data.brightness?.mediumRed + data.brightness?.darkRed)) {
        brightnessWarning = nls.localize(
            'vuengine/editors/engineConfig/brightness/brightnessWarning',
            'Bright Red must be larger than Medium Red + Dark Red.'
        );
    }

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/brightness/brightness', 'Brightness (Bright, Medium, Dark)')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/brightness/brightnessDescription',
                        'The default brightness settings, actual values are set in stage specs. \
For a nice progression, each shade should be about twice as big as the previous one.'
                    )}
                />
                <HContainer>
                    <Input
                        type="number"
                        value={data.brightness?.brightRed ?? BRIGHTNESS_BRIGHT_DEFAULT_VALUE}
                        setValue={setBrightnessBright}
                        min={BRIGHTNESS_BRIGHT_MIN_VALUE}
                        max={BRIGHTNESS_BRIGHT_MAX_VALUE}
                        defaultValue={BRIGHTNESS_BRIGHT_DEFAULT_VALUE}
                        width={64}
                    />
                    <Input
                        type="number"
                        value={data.brightness?.mediumRed ?? BRIGHTNESS_MEDIUM_DEFAULT_VALUE}
                        setValue={setBrightnessMedium}
                        min={BRIGHTNESS_MEDIUM_MIN_VALUE}
                        max={BRIGHTNESS_MEDIUM_MAX_VALUE}
                        defaultValue={BRIGHTNESS_MEDIUM_DEFAULT_VALUE}
                        width={64}
                    />
                    <Input
                        type="number"
                        value={data.brightness?.darkRed ?? BRIGHTNESS_DARK_DEFAULT_VALUE}
                        setValue={setBrightnessDark}
                        min={BRIGHTNESS_DARK_MIN_VALUE}
                        max={BRIGHTNESS_DARK_MAX_VALUE}
                        defaultValue={BRIGHTNESS_DARK_DEFAULT_VALUE}
                        width={64}
                    />
                </HContainer>
                {brightnessWarning &&
                    <div className="error">
                        <i className="codicon codicon-warning" style={{ verticalAlign: 'bottom' }} /> {brightnessWarning}
                    </div>
                }
            </VContainer>
            <VContainer>
                <Input
                    label={nls.localize('vuengine/editors/engineConfig/brightness/fadeDelay', 'Fade Delay (ms)')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/brightness/fadeDelayDescription',
                        'The default delay between steps in synchronous fade effects in milliseconds.'
                    )}
                    type="number"
                    value={data.brightness?.fadeDelay ?? FADE_DELAY_DEFAULT_VALUE}
                    setValue={setFadeDelay}
                    min={FADE_DELAY_MIN_VALUE}
                    max={FADE_DELAY_MAX_VALUE}
                    defaultValue={FADE_DELAY_DEFAULT_VALUE}
                    width={64}
                />
            </VContainer>
            <VContainer>
                <Input
                    label={nls.localize('vuengine/editors/engineConfig/brightness/fadeIncrement', 'Fade Increment')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/brightness/fadeIncrementDescription',
                        'The defaul step increment in asynchronous fade transitions.'
                    )}
                    type="number"
                    value={data.brightness?.fadeIncrement ?? FADE_INCREMENT_DEFAULT_VALUE}
                    setValue={setFadeIncrement}
                    min={FADE_INCREMENT_MIN_VALUE}
                    max={FADE_INCREMENT_MAX_VALUE}
                    width={64}
                />
            </VContainer>
        </VContainer>
    );
}
