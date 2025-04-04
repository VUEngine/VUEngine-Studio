import { MagicWand } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, SoundEvent, SoundData } from '../SoundEditorTypes';
import NotePropertiesNote from './NotePropertiesNote';
import { MetaLine, MetaLineHeader, MetaLineHeaderLine } from './StyledComponents';

interface NotePropertiesProps {
    songData: SoundData
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    currentChannelId: number
    currentPatternId: number
    setNote: (index: number, note: number | undefined) => void
}

export default function NoteProperties(props: NotePropertiesProps): React.JSX.Element {
    const {
        songData,
        currentTick, setCurrentTick,
        currentChannelId,
        currentPatternId,
        setNote,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;

    return <MetaLine style={{ bottom: 0 }}>
        <MetaLineHeader>
            <MetaLineHeaderLine title={nls.localize('vuengine/editors/sound/effects', 'Effects')}>
                <MagicWand size={16} />
            </MetaLineHeaderLine>
        </MetaLineHeader>
        {[...Array(patternSize)].map((x, index) => {
            const events = pattern.events[index] ?? {};
            const effects = Object.keys(events).filter(e => e !== SoundEvent.Note) as SoundEvent[];
            return (
                <NotePropertiesNote
                    key={index}
                    index={index}
                    effects={effects}
                    noteResolution={songData.noteResolution}
                    current={currentTick === index}
                    setCurrentTick={setCurrentTick}
                    setNote={setNote}
                />
            );
        })}
    </MetaLine>;
}
