import { nls } from '@theia/core';
import { HoverService } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../EntityEditor';

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
            label={nls.localize('vuengine/entityEditor/colorMode', 'Color Mode')}
            tooltip={<>
                <div>
                    {nls.localize(
                        'vuengine/entityEditor/colorModeDescription',
                        'Whether to use the system\'s default 4 color palette or HiColor mode, ' +
                        'which simulates 7 colors by blending together adjacent frames to create mix colors. '
                    )}
                </div>
                <div>
                    {nls.localize(
                        'vuengine/entityEditor/colorModeHiColorFlickerNote',
                        'Note: Mixed colors look fine on hardware, but flicker on emulators.'
                    )}
                </div>
                <div>
                    {nls.localize(
                        'vuengine/entityEditor/colorModeHiColorMaxHeightNote',
                        'Note: HiColor sprites can be 256 pixels high max.'
                    )}
                </div>
            </>}
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
            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
            disabled={disabled}
        />
    </VContainer>;
}
