import { Copy, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { EventsMap, INPUT_BLOCKING_COMMANDS, MAX_PATTERN_SIZE, MIN_PATTERN_SIZE, NOTE_RESOLUTION, PatternConfig, SoundData, SoundEvent } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentPatternProps {
    songData: SoundData
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

    const getName = (i: number): string => channel.patterns[i].name?.length
        ? channel.patterns[i].name
        : (i + 1).toString();

    const setPatternName = (name: string): void => {
        setPattern(currentChannelId, currentPatternId, { name });
    };

    const setSize = (size: number): void => {
        // removed all events that are beyond the limits of the pattern
        // this would come into play when resizing down
        const updatedEvents: EventsMap = {};
        const totalTicks = size * NOTE_RESOLUTION;
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

        setPattern(currentChannelId, currentPatternId, {
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

    return <VContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/currentPattern', 'Current Pattern')}
            </label>
            <InputWithAction>
                <AdvancedSelect
                    options={channel.patterns.map((n, i) => ({
                        label: getName(i),
                        value: i.toString(),
                    }))}
                    defaultValue={currentPatternId.toString()}
                    onChange={options => setCurrentPatternId(channel.id, parseInt(options[0]))}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localizeByDefault('Remove')}
                    onClick={removeCurrentPattern}
                    disabled={!pattern}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <Trash size={16} />
                </InputWithActionButton>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localize('vuengine/editors/sound/clone', 'Clone')}
                    onClick={clonePattern}
                    disabled={!pattern}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <Copy size={16} />
                </InputWithActionButton>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localizeByDefault('Add')}
                    onClick={addPattern}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <i className='codicon codicon-plus' />
                </InputWithActionButton>
            </InputWithAction>
        </VContainer>
        <HContainer gap={15}>
            <VContainer grow={1}>
                <label>
                    {nls.localizeByDefault('Name')}
                </label>
                <Input
                    value={pattern.name}
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
        </HContainer>
    </VContainer>;
}
