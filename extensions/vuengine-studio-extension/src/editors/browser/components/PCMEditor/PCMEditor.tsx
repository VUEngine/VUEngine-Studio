import { nls } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React from 'react';
import { EditorsContextType } from '../../ves-editors-types';
import { DataSection } from '../Common/CommonTypes';
import HContainer from '../Common/HContainer';
import RadioSelect from '../Common/RadioSelect';
import SectionSelect from '../Common/SectionSelect';
import VContainer from '../Common/VContainer';
import { MAX_RANGE, MIN_RANGE, PCMData } from './PCMTypes';

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

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            name: e.target.value
        });
    }

    protected setSourceFile = async (sourceFile: string) => {
        const { services } = this.props.context;
        const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
        const name = workspaceRootUri.resolve(sourceFile).path.name.replace(/([A-Z])/g, ' $1').trim();

        this.props.updateData({
            ...this.props.data,
            sourceFile: sourceFile.replace(/\\/g, '/'),
            name,
        });
    };

    protected setRange = (range: number) => {
        if (range >= MIN_RANGE && range <= MAX_RANGE) {
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
        const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;

        const selectSourceFile = async (): Promise<void> => {
            const openFileDialogProps: OpenFileDialogProps = {
                title: nls.localize('vuengine/pcmEditor/selectSourceFile', 'Select source file'),
                canSelectFolders: false,
                canSelectFiles: true,
                filters: { 'WAV': ['wav'] }
            };
            const currentPath = await services.fileService.resolve(fileUri.parent);
            const uri = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
            if (uri) {
                const source = await services.fileService.resolve(uri);
                if (source.isFile) {
                    const relativeUri = workspaceRootUri.relative(uri);
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
            <HContainer alignItems='start' gap={15}>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/pcmEditor/name', 'Name')}
                    </label>
                    <input
                        className="theia-input large"
                        value={data.name}
                        onChange={this.onChangeName.bind(this)}
                    />
                </VContainer>
                <SectionSelect
                    value={data.section}
                    setValue={this.setSection.bind(this)}
                />
            </HContainer>
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
                    <audio src={workspaceRootUri.resolve(data.sourceFile).path.fsPath()} controls={true} />
                </div>}
            </VContainer>
            <HContainer gap={15}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/pcmEditor/range', 'Range')}
                    </label>
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
        </VContainer>;
    }
}
