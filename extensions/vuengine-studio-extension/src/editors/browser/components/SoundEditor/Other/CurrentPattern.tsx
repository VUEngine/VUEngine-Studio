import { Copy, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { BAR_NOTE_RESOLUTION, EventsMap, INPUT_BLOCKING_COMMANDS, MAX_PATTERN_SIZE, MIN_PATTERN_SIZE, PatternConfig, SoundData, SoundEvent } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentPatternProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    setPattern: (patternId: string, pattern: Partial<PatternConfig>) => void
}

export default function CurrentPattern(props: CurrentPatternProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        setPattern,
    } = props;

    const pattern = soundData.patterns[currentPatternId];

    const getName = (patternId: string, i: number): string => soundData.patterns[patternId] && soundData.patterns[patternId].name?.length
        ? soundData.patterns[patternId].name
        : (i + 1).toString();

    const setPatternName = (name: string): void => {
        setPattern(currentPatternId, { name });
    };

    const setSize = (size: number): void => {
        // removed all events that are beyond the limits of the pattern
        // this would come into play when resizing down
        const updatedEvents: EventsMap = {};
        const totalTicks = size * BAR_NOTE_RESOLUTION;
        Object.keys(pattern.events).forEach(tickStr => {
            const tick = parseInt(tickStr);
            if (tick < totalTicks) {
                updatedEvents[tick] = pattern.events[tick];

                // cut note duration if it would reach beyond the pattern limits
                if (updatedEvents[tick][SoundEvent.Duration] &&
                    updatedEvents[tick][SoundEvent.Duration] + tick >= totalTicks
                ) {
                    updatedEvents[tick][SoundEvent.Duration] = totalTicks - tick;
                }
            }
        });

        setPattern(currentPatternId, {
            events: updatedEvents,
            size,
        });
    };

    const addPattern = () => {
        // TODO
        alert('not yet implemented');
    };

    const clonePattern = () => {
        // TODO
        alert('not yet implemented');
    };

    const removeCurrentPattern = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deletePatternQuestion', 'Delete Pattern?'),
            msg: nls.localize('vuengine/editors/sound/areYouSureYouWantToDeletePattern', 'Are you sure you want to completely delete this pattern?'),
        });
        const remove = await dialog.open();
        if (remove) {
            // TODO
            alert('not yet implemented');
        }
    };

    return pattern
        ? <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/currentPattern', 'Current Pattern')}
                </label>
                <InputWithAction>
                    <AdvancedSelect
                        options={Object.keys(soundData.patterns).map((n, i) => ({
                            label: getName(n, i),
                            value: n,
                        }))}
                        defaultValue={currentPatternId.toString()}
                        onChange={options => setCurrentPatternId(currentChannelId, options[0])}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Remove')}
                        onClick={removeCurrentPattern}
                        disabled={!pattern}
                    >
                        <Trash size={16} />
                    </InputWithActionButton>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/editors/sound/clone', 'Clone')}
                        onClick={clonePattern}
                        disabled={!pattern}
                    >
                        <Copy size={16} />
                    </InputWithActionButton>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Add')}
                        onClick={addPattern}
                    >
                        <i className='codicon codicon-plus' />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localizeByDefault('Name')}
                </label>
                <Input
                    value={pattern.name ?? ''}
                    setValue={setPatternName}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
            </VContainer>
            <Input
                label={nls.localize('vuengine/editors/sound/size', 'Size')}
                value={pattern.size}
                setValue={v => setSize(v as number)}
                type='number'
                min={MIN_PATTERN_SIZE}
                max={MAX_PATTERN_SIZE}
                width={64}
                commands={INPUT_BLOCKING_COMMANDS}
            />
        </VContainer>
        : <></>;
}
