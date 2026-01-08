import { nls } from '@theia/core';
import { HoverService } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';

interface ColorModeSelectProps {
    value: ColorMode
    setValue: (value: ColorMode) => void
    hoverService: HoverService
    disabled?: boolean
}

export default function ColorModeSelect(props: ColorModeSelectProps): React.JSX.Element {
    const { value, setValue, hoverService, disabled } = props;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    return <VContainer>
        <InfoLabel
            label={nls.localize('vuengine/editors/actor/colorMode', 'Color Mode')}
            tooltip={<>
                <div>
                    {nls.localize(
                        'vuengine/editors/actor/colorModeDescription',
                        "Whether to use the system's default 4 color palette or HiColor mode, \
which simulates 7 colors by blending together adjacent frames to create mix colors."
                    )}
                </div>
                <div>
                    {nls.localize(
                        'vuengine/editors/actor/colorModeHiColorMemoryNote',
                        'Note: HiColor sprites consume more video memory space than regular sprites.'
                    )}
                </div>
                <div>
                    {nls.localize(
                        'vuengine/editors/actor/colorModeHiColorFlickerNote',
                        'Note: Mixed colors look fine on hardware, but flicker on emulators.'
                    )}
                </div>
                <div>
                    {nls.localize(
                        'vuengine/editors/actor/colorModeHiColorMaxHeightNote',
                        'Note: HiColor sprites can be 256 pixels high max.'
                    )}
                </div>
            </>}
            hoverService={hoverService}
        />
        <RadioSelect
            options={[{
                value: ColorMode.Default,
                label: nls.localize('vuengine/editors/actor/colorModeDefault', 'Default'),
            }, {
                value: ColorMode.FrameBlend,
                label: nls.localize('vuengine/editors/actor/colorModeHiColor', 'HiColor'),
            }]}
            defaultValue={value}
            onChange={options => setValue(options[0].value as ColorMode)}
            onFocus={() => disableCommands()}
            onBlur={() => enableCommands()}
            disabled={disabled}
        />
    </VContainer>;
}
