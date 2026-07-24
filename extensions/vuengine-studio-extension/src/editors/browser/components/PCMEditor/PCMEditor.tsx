import { nls } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import { DataSection } from '../Common/CommonTypes';
import InfoLabel from '../Common/InfoLabel';
import MissingPlugin from '../Common/MissingPlugin';
import SectionSelect from '../Common/SectionSelect';
import { PCMData, TimerResolution, TimerTargetTimePerInterruptUnits } from './PCMTypes';
import Checkbox from '../Common/Base/Checkbox';
import RadioSelect from '../Common/Base/RadioSelect';

interface PCMProps {
    data: PCMData
    updateData: (data: PCMData) => void
}

export default function PCMEditor(props: PCMProps): React.JSX.Element {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData} = props;

    const configFileParentUri = fileUri.parent;

    const setSourceFile = async (sourceFile: string) => {
        updateData({
            ...data,
            sourceFile: sourceFile.replace(/\\/g, '/'),
        });
    };

    const setAuthor = (author: string) => updateData({ ...data, author });
    const setSection = (section: DataSection) => updateData({ ...data, section });
    const setTimerResolution = (resolution: TimerResolution) => updateData({
        ...data,
        timer: {
            ...data.timer,
            resolution
        }
    });
    const setTargetTimePerInterruptUnits = (targetTimePerInterruptUnits: TimerTargetTimePerInterruptUnits) => updateData({
        ...data,
        timer: {
            ...data.timer,
            targetTimePerInterruptUnits
        }
    });
    const setTargetTimePerInterrupt = (targetTimePerInterrupt: number) => updateData({
        ...data,
        timer: {
            ...data.timer,
            targetTimePerInterrupt
        }
    });
    const toggleLoop = () => updateData({ ...data, loop: !data.loop });

    const selectSourceFile = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/editors/pcm/selectSourceFile', 'Select source file'),
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
                        nls.localize('vuengine/editors/pcm/errorSourceFileMustBeInWorkspace', 'Source file must live in workspace.')
                    );
                } else {
                    setSourceFile(relativeUri.fsPath());
                }
            }
        }
    };

    return <VContainer gap={15} className='pcmEditor'>
        <MissingPlugin
            plugin='vuengine//sounds/PCMPlayer'
        />
        <VContainer>
            <InfoLabel
                label={nls.localizeByDefault('Path')}
                tooltip={nls.localize(
                    'vuengine/editors/pcm/pathDescription',
                    'Must be an 8-bit mono WAV file at around 8kHz or less.'
                )}
            />
            <HContainer>
                <Input
                    value={data.sourceFile}
                    onBlur={e => setSourceFile(e.target.value)}
                    setValue={v => setSourceFile(v as string)}
                    grow={1}
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
            <Input
                label={nls.localize('vuengine/editors/pcm/author', 'Author')}
                value={data.author}
                setValue={v => setAuthor(v as string)}
                width={350}
            />
            <Checkbox
                label={nls.localize('vuengine/editors/pcm/loop', 'Loop')}
                checked={data.loop}
                setChecked={toggleLoop}
            />
        </HContainer>
        <HContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/pcm/palette', 'Timer Resolution')}
                </label>
                <RadioSelect
                    options={[{ value: TimerResolution['20US'] }, { value: TimerResolution['100US'] }]}
                    defaultValue={data.timer.resolution}
                    onChange={options => setTimerResolution(options[0].value as TimerResolution)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/pcm/targetTimePerInterrupt', 'Target Time Per Interrupt')}
                </label>
                <HContainer>
                    <Input
                        value={data.timer.targetTimePerInterrupt}
                        setValue={v => setTargetTimePerInterrupt(v as number)}
                        width={80}
                    />
                    <RadioSelect
                        options={[{ value: TimerTargetTimePerInterruptUnits.MS }, { value: TimerTargetTimePerInterruptUnits.US }]}
                        defaultValue={data.timer.targetTimePerInterruptUnits}
                        onChange={options => setTargetTimePerInterruptUnits(options[0].value as TimerTargetTimePerInterruptUnits)}
                    />
                </HContainer>
            </VContainer>
        </HContainer>
        <SectionSelect
            value={data.section}
            setValue={setSection}
        />
    </VContainer>;
}
