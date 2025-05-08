import { MagicWand } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React from 'react';
import { EXCLUDED_SOUND_EVENTS, NOTE_RESOLUTION, SoundData, SoundEvent } from '../SoundEditorTypes';
import NotePropertiesNote from './NotePropertiesNote';
import { MetaLine, MetaLineHeader, MetaLineHeaderLine } from './StyledComponents';

interface NotePropertiesProps {
    soundData: SoundData
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    currentChannelId: number
    currentPatternId: number
    setNote: (step: number, note?: number, duration?: number, prevStep?: number) => void
}

export default function NoteProperties(props: NotePropertiesProps): React.JSX.Element {
    const {
        soundData,
        currentTick, setCurrentTick,
        currentChannelId,
        currentPatternId,
        setNote,
    } = props;

    const channel = soundData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    return <MetaLine
        style={{
            bottom: 0,
            minHeight: 29,
        }}
    >
        <MetaLineHeader>
            <MetaLineHeaderLine title={nls.localize('vuengine/editors/sound/effects', 'Effects')}>
                <MagicWand size={16} />
            </MetaLineHeaderLine>
        </MetaLineHeader>
        {[...Array(pattern.size * NOTE_RESOLUTION)].map((x, index) => {
            const events = pattern.events[index] ?? {};
            const effects = Object.keys(events).filter(e => !EXCLUDED_SOUND_EVENTS.includes(e as SoundEvent)) as SoundEvent[];
            return (
                <NotePropertiesNote
                    key={index}
                    index={index}
                    effects={effects}
                    current={currentTick === index}
                    setCurrentTick={setCurrentTick}
                    setNote={setNote}
                />
            );
        })}
    </MetaLine>;
}
