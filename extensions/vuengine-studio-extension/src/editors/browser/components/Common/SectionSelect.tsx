import React from 'react';
import VContainer from './Base/VContainer';
import InfoLabel from './InfoLabel';
import { nls } from '@theia/core';
import RadioSelect from './Base/RadioSelect';
import { DataSection } from './CommonTypes';

interface SectionSelectProps {
    value: DataSection
    setValue: (section: DataSection) => void
}

export default function SectionSelect(props: SectionSelectProps): React.JSX.Element {
    const { value, setValue } = props;

    return (
        <VContainer>
            <InfoLabel
                label={nls.localize('vuengine/editors/general/dataSection', 'Data Section')}
                tooltip={nls.localize(
                    'vuengine/editors/general/sectionDescription',
                    'Defines whether data should be stored in ROM space, Data space or Expansion space. \
You usually want to leave this untouched, since the latter only works on specially designed cartridges.'
                )}
            />
            <RadioSelect
                defaultValue={value}
                options={[{
                    label: nls.localize('vuengine/editors/general/space/rom', 'ROM'),
                    value: DataSection.ROM,
                }, {
                    label: nls.localize('vuengine/editors/general/space/data', 'Data'),
                    value: DataSection.DATA,
                }, {
                    label: nls.localize('vuengine/editors/general/space/expansion', 'Expansion'),
                    value: DataSection.EXP,
                }]}
                onChange={options => setValue(options[0].value as DataSection)}
            />
        </VContainer>
    );
}

