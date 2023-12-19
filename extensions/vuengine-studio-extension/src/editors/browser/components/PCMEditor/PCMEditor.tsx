import { URI, nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React from 'react';
import { EditorsServices } from '../../ves-editors-widget';
import { DataSection } from '../Common/CommonTypes';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { MAX_RANGE, MIN_RANGE, PCMData } from './PCMTypes';

interface PCMProps {
    data: PCMData
    updateData: (data: PCMData) => void
    fileUri: URI
    services: EditorsServices
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
        const workspaceRootUri = this.props.services.workspaceService.tryGetRoots()[0]?.resource;
        const name = workspaceRootUri.resolve(sourceFile).path.name.replace(/([A-Z])/g, ' $1').trim();

        this.props.updateData({
            ...this.props.data,
            sourceFile,
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
        const { data } = this.props;
        const workspaceRootUri = this.props.services.workspaceService.tryGetRoots()[0]?.resource;

        const selectSourceFile = async (): Promise<void> => {
            const openFileDialogProps: OpenFileDialogProps = {
                title: nls.localize('vuengine/pcmEditor/selectSourceFile', 'Select source file'),
                canSelectFolders: false,
                canSelectFiles: true,
                filters: { 'WAV': ['wav'] }
            };
            const currentPath = await this.props.services.fileService.resolve(this.props.fileUri.parent);
            const uri = await this.props.services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
            if (uri) {
                const source = await this.props.services.fileService.resolve(uri);
                if (source.isFile) {
                    const relativeUri = workspaceRootUri.relative(uri);
                    if (!relativeUri) {
                        this.props.services.messageService.error(
                            nls.localize('vuengine/pcmEditor/errorSourceFileMustBeInWorkspace', 'Source file must live in workspace.')
                        );
                    } else {
                        this.setSourceFile(relativeUri.fsPath());
                    }
                }
            }
        };

        return <VContainer gap={20} className='pcmEditor'>
            <VContainer>
                <label>
                    {nls.localize('vuengine/pcmEditor/name', 'Name')}
                </label>
                <input
                    className="theia-input large"
                    value={data.name}
                    onChange={this.onChangeName.bind(this)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/emulator/path', 'Path')}
                </label>
                <HContainer gap={0}>
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
            <VContainer>
                <label>
                    {nls.localize('vuengine/pcmEditor/range', 'Range')}
                </label>
                <input
                    type="number"
                    className="theia-input"
                    title={nls.localize('vuengine/pcmEditor/range', 'Range')}
                    onChange={e => this.setRange(parseInt(e.target.value))}
                    value={data.range}
                    min={MIN_RANGE}
                    max={MAX_RANGE}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/pcmEditor/section', 'Section')}
                </label>
                <SelectComponent
                    defaultValue={data.section}
                    options={[{
                        label: nls.localize('vuengine/pcmEditor/romSpace', 'ROM Space'),
                        value: DataSection.ROM,
                        description: nls.localize('vuengine/pcmEditor/romSpaceDescription', 'Save PCM data to ROM space'),
                    }, {
                        label: nls.localize('vuengine/pcmEditor/expansionSpace', 'Expansion Space'),
                        value: DataSection.EXP,
                        description: nls.localize('vuengine/pcmEditor/expansionSpaceDescription', 'Save PCM data to expansion space'),
                    }]}
                    onChange={option => this.setSection(option.value as DataSection)}
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
        </VContainer>;
    }
}
