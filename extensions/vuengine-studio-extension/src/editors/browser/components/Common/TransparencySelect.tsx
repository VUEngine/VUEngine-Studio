import { nls } from '@theia/core';
import React from 'react';
import RadioSelect from './Base/RadioSelect';
import VContainer from './Base/VContainer';
import InfoLabel from './InfoLabel';
import { Transparency } from './VUEngineTypes';

interface TransparencySelectProps {
    value: Transparency
    setValue: (transparency: Transparency) => void
    onFocus?: () => void
    onBlur?: () => void
}

export default function TransparencySelect(props: TransparencySelectProps): React.JSX.Element {
    const { value, setValue, onFocus, onBlur } = props;

    return (
        <VContainer>
            <InfoLabel
                label={nls.localize('vuengine/editors/general/transparency', 'Transparency')}
                tooltip={nls.localize(
                    'vuengine/editors/general/transparencyDescription',
                    'With transparency enabled, this component will only be shown on every even or odd frame, \
resulting in it appearing transparent (and slightly dimmer). \
This also halves CPU load since 50% less pixels have to be rendered per frame in average.'
                )}
            />
            <RadioSelect
                defaultValue={value}
                options={[{
                    value: Transparency.None,
                    label: nls.localize('vuengine/editors/general/transparencyNone', 'None'),
                }, {
                    value: Transparency.Odd,
                    label: nls.localize('vuengine/editors/general/transparencyOdd', 'Odd'),
                }, {
                    value: Transparency.Even,
                    label: nls.localize('vuengine/editors/general/transparencyEven', 'Even'),
                }]}
                onChange={options => setValue(options[0].value as Transparency)}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </VContainer>
    );
}

