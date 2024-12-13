import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { WithContributor, WithFileUri } from '../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import NumberArrayPreview from '../Common/NumberArrayPreview';
import VContainer from '../Common/Base/VContainer';
import WaveForm from '../WaveFormEditor/WaveForm';
import { WaveFormData } from '../WaveFormEditor/WaveFormEditorTypes';

interface WaveformWithPresetsProps {
    value: number[]
    setValue: (value: number[]) => void
}

export default function WaveformWithPresets(props: WaveformWithPresetsProps): React.JSX.Element {
    const { value, setValue } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const waveForms = Object.values(services.vesProjectService.getProjectDataItemsForType('WaveForm') || {}) as (WaveFormData & WithContributor & WithFileUri)[];

    return (
        <VContainer gap={15} grow={1}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/vsuSandbox/presetsClickToApply', 'Presets (Click to apply)')}
                </label>
                <HContainer overflow='scroll'>
                    {(Object.values(waveForms).map((w, i) =>
                        <NumberArrayPreview
                            key={i}
                            maximum={64}
                            data={w.values}
                            onClick={() => setValue(w.values)}
                            onMouseEnter={event => {
                                services.hoverService.requestHover({
                                    content: w._fileUri.path.name,
                                    target: event.currentTarget,
                                    position: 'bottom',
                                });
                            }}
                            onMouseLeave={event => {
                                services.hoverService.cancelHover();
                            }}

                        />
                    ))}
                </HContainer>
            </VContainer>
            <WaveForm
                value={value}
                setValue={setValue}
            />
        </VContainer>
    );
}
