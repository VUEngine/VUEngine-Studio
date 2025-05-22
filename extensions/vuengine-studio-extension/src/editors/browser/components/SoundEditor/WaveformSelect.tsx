import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { ProjectContributor, WithContributor, WithFileUri, WithId } from '../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import NumberArrayPreview from '../Common/NumberArrayPreview';
import { WAVEFORM_MAX, WaveFormData } from '../WaveFormEditor/WaveFormEditorTypes';
import { InputWithActionButton } from './Other/Instruments';

interface WaveformSelectProps {
    value: string
    setValue: (value: string) => void
}

export default function WaveformSelect(props: WaveformSelectProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { value, setValue } = props;

    const waveForms = (Object.values(services.vesProjectService.getProjectDataItemsForType('WaveForm') || {}) as (WaveFormData & WithId & WithContributor & WithFileUri)[])
        .sort((a, b) => a._fileUri.path.base.localeCompare(b._fileUri.path.base));

    const newWaveform = async () => {
        const newFileUri = await services.vesProjectService.createNewFileForType('WaveForm');
        if (newFileUri === undefined) {
            return services.messageService.error(
                nls.localize('vuengine/editors/sound/couldNotCreateWaveFormFile', 'Could not create WaveForm file')
            );
        }

        const newFileContent = await services.fileService.readFile(newFileUri);
        const newFileData = await JSON.parse(newFileContent.value.toString());
        setValue(newFileData._id);
        (await services.openerService.getOpener(newFileUri)).open(newFileUri);
    };

    const waveformDisplay = (waveform: WaveFormData & WithId & WithContributor & WithFileUri) => (
        <VContainer
            key={waveform._id}
            alignItems='center'
            style={{
                position: 'relative',
            }}
        >
            <NumberArrayPreview
                maximum={WAVEFORM_MAX}
                data={waveform.values}
                height={WAVEFORM_MAX * 2}
                width={WAVEFORM_MAX * 2}
                active={waveform._id === value}
                onClick={() => setValue(waveform._id)}
            />
            <InputWithActionButton
                className='theia-button secondary'
                title={nls.localize('vuengine/editors/sound/editWaveforms', 'Edit Waveforms')}
                onClick={async () => (await services.openerService.getOpener(waveform._fileUri)).open(waveform._fileUri)}
                style={{
                    position: 'absolute',
                    right: 'var(--theia-ui-padding)',
                    top: 'var(--theia-ui-padding)',
                    zIndex: 10,
                }}
            >
                <i className='codicon codicon-settings-gear' />
            </InputWithActionButton>
            {waveform._fileUri.path.name}
        </VContainer>
    );

    const listByContributor = (waveforms: (WaveFormData & WithId & WithContributor & WithFileUri)[], templates: boolean) => {
        const filteredWaveforms = waveForms.filter(w => templates ? w._contributor !== ProjectContributor.Project : w._contributor === ProjectContributor.Project);
        return filteredWaveforms.length > 0 || !templates
            ? (
                <VContainer gap={10}>
                    {templates
                        ? nls.localize('vuengine/editors/sound/templates', 'Templates')
                        : nls.localize('vuengine/editors/sound/custom', 'Custom')
                    }
                    <HContainer gap={10} wrap='wrap'>
                        {(Object.values(filteredWaveforms).map((w, i) => waveformDisplay(w)))}
                        {!templates &&
                            <VContainer style={{ position: 'relative' }}>
                                <NumberArrayPreview
                                    maximum={WAVEFORM_MAX}
                                    data={[...Array(32)].map(v => 0)}
                                    height={WAVEFORM_MAX * 2}
                                    width={WAVEFORM_MAX * 2}
                                    onClick={() => newWaveform()}
                                />
                                <i
                                    className='codicon codicon-add'
                                    style={{
                                        color: 'var(--theia-dropdown-border)',
                                        fontSize: 32,
                                        position: 'absolute',
                                        left: 51,
                                        top: 51,
                                    }}
                                />
                            </VContainer>
                        }
                    </HContainer>
                </VContainer>
            )
            : <></>;
    };

    return (
        <div>
            <VContainer gap={20}>
                {listByContributor(waveForms, false)}
                {listByContributor(waveForms, true)}
            </VContainer >
        </div>
    );
}
