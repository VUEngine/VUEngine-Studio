import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect from '../../Common/Base/BasicSelect';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../MusicEditor';
import { BAR_PATTERN_LENGTH_MULT_MAP, PatternConfig, SongData } from '../MusicEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentPatternProps {
    songData: SongData
    currentChannelId: number
    currentPatternId: number
    setCurrentPatternId: (channelId: number, patternId: number) => void
    setPattern: (channelId: number, patternId: number, pattern: Partial<PatternConfig>) => void
}

export default function CurrentPattern(props: CurrentPatternProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        setPattern,
    } = props;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    const getName = (i: number): string => channel.patterns[i].name
        ? `${i + 1}: ${channel.patterns[i].name}`
        : (i + 1).toString();

    const setPatternName = (name: string): void => {
        setPattern(currentChannelId, currentPatternId, { name });
    };

    const setBar = (bar: string): void => {
        setPattern(currentChannelId, currentPatternId, { bar });
    };

    const addPattern = () => {
        // TODO
    };

    const removeCurrentPattern = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/musicEditor/deletePatternQuestion', 'Delete Pattern?'),
            msg: nls.localize('vuengine/musicEditor/areYouSureYouWantToDeletePattern', 'Are you sure you want to completely delete this pattern?'),
        });
        const remove = await dialog.open();
        if (remove) {
            // TODO
        }
    };

    return <VContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/currentPattern', 'Current Pattern')}
            </label>
            <InputWithAction>
                <select
                    className='theia-select'
                    value={currentPatternId}
                    onChange={e => setCurrentPatternId(channel.id, parseInt(e.target.value))}
                >
                    {channel.patterns.map((n, i) => (
                        <option key={`select-pattern-${i}`} value={i}>{getName(i)}</option>
                    ))}
                </select>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localize('vuengine/musicEditor/deletePattern', 'Delete Pattern')}
                    onClick={removeCurrentPattern}
                >
                    <i className='fa fa-minus' />
                </InputWithActionButton>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localize('vuengine/musicEditor/addPattern', 'Add Pattern')}
                    onClick={addPattern}
                >
                    <i className='codicon codicon-plus' />
                </InputWithActionButton>
            </InputWithAction>
        </VContainer>
        <HContainer gap={15}>
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/musicEditor/name', 'Name')}
                </label>
                <input
                    className='theia-input'
                    value={pattern.name}
                    onChange={e => setPatternName(e.target.value)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/musicEditor/bar', 'Bar')}
                </label>
                <BasicSelect
                    options={Object.keys(BAR_PATTERN_LENGTH_MULT_MAP).map(v => ({ value: v }))}
                    value={pattern.bar}
                    onChange={e => setBar(e.target.value)}
                />
            </VContainer>
        </HContainer>
    </VContainer>;
}
