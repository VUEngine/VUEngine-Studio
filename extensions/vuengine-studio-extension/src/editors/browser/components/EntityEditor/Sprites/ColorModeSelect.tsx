import { nls } from '@theia/core';
import { HoverService } from '@theia/core/lib/browser';
import React from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';

interface ColorModeSelectProps {
    value: ColorMode
    setValue: (value: ColorMode) => void
    hoverService: HoverService
}

export default function ColorModeSelect(props: ColorModeSelectProps): React.JSX.Element {
    const { value, setValue, hoverService } = props;

    return <VContainer>
        <InfoLabel
            label={nls.localize('vuengine/entityEditor/colorMode', 'Color Mode')}
            tooltip={nls.localize(
                'vuengine/entityEditor/colorModeDescription',
                'Whether to use the system\'s default 4 color palette or HiColor mode, ' +
                'which simulates 7 colors by blending together adjacent frames to create mix colors. ' +
                'Note: Mixed colors look fine on hardware, but flicker on emulators.'
            )}
            hoverService={hoverService}
        />
        <RadioSelect
            options={[{
                value: ColorMode.Default,
                label: nls.localize('vuengine/entityEditor/colorModeDefault', 'Default'),
            }, {
                value: ColorMode.FrameBlend,
                label: nls.localize('vuengine/entityEditor/colorModeHiColor', 'HiColor'),
            }]}
            defaultValue={value}
            onChange={options => setValue(options[0].value as ColorMode)}
        />
    </VContainer>;
}
