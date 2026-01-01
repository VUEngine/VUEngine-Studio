import { nls } from '@theia/core';
import React, { useContext } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS, MAX_SEQUENCE_SIZE, MAX_TICK_DURATION, MIN_TICK_DURATION, SoundData } from '../SoundEditorTypes';

interface PropertiesProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
}

export default function Properties(props: PropertiesProps): React.JSX.Element {
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { soundData, updateSoundData } = props;

    const handleOnFocus = () => {
        disableCommands(INPUT_BLOCKING_COMMANDS);
    };

    const handleOnBlur = () => {
        enableCommands(INPUT_BLOCKING_COMMANDS);
    };

    const setName = (n: string): void => {
        updateSoundData({ ...soundData, name: n });
    };

    const setAuthor = (a: string): void => {
        updateSoundData({ ...soundData, author: a });
    };

    const setComment = (c: string): void => {
        updateSoundData({ ...soundData, comment: c });
    };

    const setLoopPoint = (loopPoint: number): void => {
        updateSoundData({ ...soundData, loopPoint });
    };

    /*
    const setSection = (section: DataSection): void => {
        updateSoundData({ ...soundData, section });
    };
    */

    const toggleLoop = (): void => {
        updateSoundData({ ...soundData, loop: !soundData.loop });
    };

    const setSpeed = (s: number): void => {
        if (s <= MAX_TICK_DURATION && s >= MIN_TICK_DURATION) {
            updateSoundData({ ...soundData, speed: s });
        }
    };

    return <VContainer gap={15}>
        <Input
            label={nls.localize('vuengine/editors/sound/name', 'Name')}
            value={soundData.name}
            setValue={setName}
            commands={INPUT_BLOCKING_COMMANDS}
        />
        <Input
            label={nls.localize('vuengine/editors/sound/author', 'Author')}
            value={soundData.author}
            setValue={setAuthor}
            commands={INPUT_BLOCKING_COMMANDS}
        />

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/comment', 'Comment')}
            </label>
            <ReactTextareaAutosize
                className="theia-input"
                value={soundData.comment}
                minRows={1}
                maxRows={4}
                onChange={e => setComment(e.target.value)}
                onFocus={handleOnFocus}
                onBlur={handleOnBlur}
                onKeyDown={e => e.stopPropagation()} // allow to use enter key
                style={{ resize: 'none' }}
            />
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/sixteenthNoteDurationMs', '1/16 note duration (in milliseconds)')}
            </label>
            <Range
                value={soundData.speed}
                max={MAX_TICK_DURATION}
                min={MIN_TICK_DURATION}
                setValue={setSpeed}
                commandsToDisable={INPUT_BLOCKING_COMMANDS}
            />
        </VContainer>

        <HContainer gap={20}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/loop', 'Loop')}
                </label>
                <input
                    type="checkbox"
                    checked={soundData.loop}
                    onChange={() => toggleLoop()}
                />
            </VContainer>
            {soundData.loop &&
                <Input
                    label={nls.localize('vuengine/editors/sound/loopPoint', 'LoopPoint')}
                    value={soundData.loopPoint}
                    setValue={setLoopPoint}
                    type='number'
                    min={0}
                    max={MAX_SEQUENCE_SIZE - 1}
                    width={64}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
            }
        </HContainer>
        { /* }
        <SectionSelect
            value={soundData.section}
            setValue={setSection}
        />
        { */ }
    </VContainer >;
}
