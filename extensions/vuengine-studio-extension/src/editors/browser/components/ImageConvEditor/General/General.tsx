import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { DataSection } from '../../Common/CommonTypes';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';

interface GeneralProps {
}

export default function General(props: GeneralProps): React.JSX.Element {
    const { imageConvData, setImageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;

    const setName = (n: string): void => {
        setImageConvData({ name: n });
    };

    const setSection = (section: DataSection) => {
        setImageConvData({
            section,
        });
    };

    return <VContainer gap={10}>
        <HContainer gap={10} wrap='wrap'>
            <VContainer grow={4}>
                <label>
                    {nls.localize('vuengine/imageConvEditor/name', 'Name')}
                </label>
                <input
                    className='theia-input large'
                    value={imageConvData.name}
                    onChange={e => setName(e.target.value)}
                />
            </VContainer>
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/imageConvEditor/section', 'Section')}
                </label>
                <SelectComponent
                    defaultValue={imageConvData.section}
                    options={[{
                        label: nls.localize('vuengine/imageConvEditor/romSpace', 'ROM Space'),
                        value: DataSection.ROM,
                        description: nls.localize('vuengine/imageConvEditor/romSpaceDescription', 'Store image data in ROM space'),
                    }, {
                        label: nls.localize('vuengine/imageConvEditor/expansionSpace', 'Expansion Space'),
                        value: DataSection.EXP,
                        description: nls.localize('vuengine/imageConvEditor/expansionSpaceDescription', 'Store image data in expansion space'),
                    }]}
                    onChange={option => setSection(option.value as DataSection)}
                />
            </VContainer>
        </HContainer>
    </VContainer>;
}
