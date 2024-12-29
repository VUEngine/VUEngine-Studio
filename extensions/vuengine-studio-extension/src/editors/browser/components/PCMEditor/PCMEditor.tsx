import { nls } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React from 'react';
import { EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import RadioSelect from '../Common/Base/RadioSelect';
import VContainer from '../Common/Base/VContainer';
import { DataSection } from '../Common/CommonTypes';
import InfoLabel from '../Common/InfoLabel';
import SectionSelect from '../Common/SectionSelect';
import { PCM_MAX_RANGE, PCM_MIN_RANGE, PCMData } from './PCMTypes';

interface PCMProps {
    data: PCMData
    updateData: (data: PCMData) => void
    context: EditorsContextType
}

interface PCMState {
    command: string
}

export default class PCMEditor extends React.Component<PCMProps, PCMState> {
    constructor(props: PCMProps) {
        super(props);
        this.state = {
            command: ''
        };
    }

    protected setSourceFile = async (sourceFile: string) => {
        this.props.updateData({
            ...this.props.data,
            sourceFile: sourceFile.replace(/\\/g, '/'),
        });
    };

    protected setRange = (range: number) => {
        if (range >= PCM_MIN_RANGE && range <= PCM_MAX_RANGE) {
            this.props.updateData({
                ...this.props.data,
                range,
            });
        }
    };

    protected setSection = (section: DataSection) => {
        this.props.updateData({
            ...this.props.data,
            section,
        });
    };

    protected toggleLoop = () => {
        this.props.updateData({
            ...this.props.data,
            loop: !this.props.data.loop,
        });
    };

    render(): React.JSX.Element {
        const { fileUri, services } = this.props.context;
        const { data } = this.props;

        const configFileParentUri = fileUri.parent;

        const selectSourceFile = async (): Promise<void> => {
            const openFileDialogProps: OpenFileDialogProps = {
                title: nls.localize('vuengine/pcmEditor/selectSourceFile', 'Select source file'),
                canSelectFolders: false,
                canSelectFiles: true,
                filters: { 'WAV': ['wav'] }
            };
            const currentPath = await services.fileService.resolve(configFileParentUri);
            const uri = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
            if (uri) {
                const source = await services.fileService.resolve(uri);
                if (source.isFile) {
                    const relativeUri = configFileParentUri.relative(uri);
                    if (!relativeUri) {
                        services.messageService.error(
                            nls.localize('vuengine/pcmEditor/errorSourceFileMustBeInWorkspace', 'Source file must live in workspace.')
                        );
                    } else {
                        this.setSourceFile(relativeUri.fsPath());
                    }
                }
            }
        };

        return <VContainer gap={15} className='pcmEditor'>
            <VContainer>
                <label>
                    {nls.localize('vuengine/emulator/path', 'Path')}
                </label>
                <HContainer>
                    <input
                        type="text"
                        className="theia-input"
                        value={data.sourceFile}
                        style={{ flexGrow: 1 }}
                        onBlur={e => this.setSourceFile(e.target.value)}
                        onChange={e => this.setSourceFile(e.target.value)}
                    />
                    <button
                        className="theia-button secondary"
                        onClick={selectSourceFile}
                    >
                        <i className="fa fa-ellipsis-h" />
                    </button>
                </HContainer>
                {data.sourceFile && <div>
                    <audio src={configFileParentUri.resolve(data.sourceFile).path.fsPath()} controls={true} />
                </div>}
            </VContainer>
            <HContainer gap={15}>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/pcmEditor/volumeResolution', 'Volume Resolution')}
                        tooltip={nls.localize(
                            'vuengine/pcmEditor/volumeResolutionDescription',
                            'VUEngine can dynamically allocate up to 5 channels for playback to increase volume amplitude resolution. ' +
                            'Thus, a higher value can deliver finer nuances in volume changes at a small performance cost.'
                        )}
                    />
                    <RadioSelect
                        defaultValue={data.range}
                        options={[{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }]}
                        onChange={options => this.setRange(options[0].value as number)}
                    />
                </VContainer>
                <VContainer>
                    <label className='setting'>
                        {nls.localize('vuengine/pcmEditor/loop', 'Loop')}
                    </label>
                    <input
                        type="checkbox"
                        checked={data.loop}
                        onChange={this.toggleLoop}
                    />
                </VContainer>
            </HContainer>
            <SectionSelect
                value={data.section}
                setValue={this.setSection.bind(this)}
            />
        </VContainer>;
    }
}
