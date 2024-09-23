import { nls } from '@theia/core';
import React, { useState } from 'react';
import { ChannelConfig, HIGHEST_NOTE, LOWEST_NOTE, PATTERN_NOTE_HEIGHT, PatternConfig, SongData } from '../MusicEditorTypes';

interface PatternProps {
    songData: SongData
    index: number
    pattern: PatternConfig
    patternSize: number
    channel: number
    height: number
    patternId: number
    currentChannelId: number
    currentPatternId: number
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function Pattern(props: PatternProps): React.JSX.Element {
    const [dragged, setDragged] = useState<boolean>(false);
    const {
        songData,
        index,
        channel,
        height,
        pattern,
        patternSize,
        patternId,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
    } = props;

    const classNames = ['pattern'];
    if (currentChannelId === channel && currentPatternId === patternId) {
        classNames.push('current');
    }

    const boxShadow: string[] = [];
    const patternNoteWidth = 16 / songData.noteResolution;
    pattern.notes.forEach((note, i) => {
        if (note !== undefined
            && note >= HIGHEST_NOTE
            && note <= LOWEST_NOTE) {
            boxShadow.push(
                `${(i + 1) * patternNoteWidth}px ${(note - HIGHEST_NOTE) * PATTERN_NOTE_HEIGHT}px 0 0 var(--theia-editor-foreground)`
            );
        }
    });

    const moveSequencePattern = (channelId: number, from: number, to: number): void => {
        const sequence = [...songData.channels[channelId].sequence];
        const removedPattern = sequence.splice(from, 1).pop();
        sequence.splice(to > from ? to - 1 : to, 0, removedPattern!);
        setChannel(channelId, {
            sequence: sequence
        });
    };

    const removeFromSequence = (channelId: number, i: number): void => {
        setChannel(channelId, {
            sequence: [
                ...songData.channels[channelId].sequence.slice(0, i),
                ...songData.channels[channelId].sequence.slice(i + 1)
            ],
        });
    };

    const onDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
        setDragged(true);
        e.currentTarget.classList.add('beingDragged');
        e.dataTransfer.setData('channel', e.currentTarget.getAttribute('data-channel') ?? '');
        e.dataTransfer.setData('position', e.currentTarget.getAttribute('data-position') ?? '');
    };

    const onDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
        setDragged(false);
        e.currentTarget.classList.remove('beingDragged');

        const dragOverElements = document.getElementsByClassName('dragOver');
        for (let i = 0; i < dragOverElements.length; i++) {
            dragOverElements[i].classList.remove('dragOver');
        }
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        const from = parseInt(e.dataTransfer.getData('position'));
        const to = parseInt(e.currentTarget.getAttribute('data-position') ?? '');
        const fromChannelId = parseInt(e.dataTransfer.getData('channel'));
        if (channel === fromChannelId) {
            moveSequencePattern(channel, from, to);
        }
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
        if (dragged) {
            e.currentTarget.classList.add('dragOver');
        }
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.currentTarget.classList.remove('dragOver');
    };

    return <div
        className={classNames.join(' ')}
        style={{
            backgroundColor: currentChannelId === channel && currentSequenceIndex === index
                ? 'var(--theia-focusBorder)'
                : undefined,
            height: `${height * PATTERN_NOTE_HEIGHT + 3}px`,
            minWidth: `${(patternSize * patternNoteWidth) - 1}px`,
            width: `${(patternSize * patternNoteWidth) - 1}px`
        }}
        data-channel={channel}
        data-position={index}
        onClick={() => setCurrentSequenceIndex(channel, index)}
        draggable={true}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
    >
        <div
            className='notes'
            style={{
                boxShadow: boxShadow.join(','),
                height: '1px',
                marginLeft: `-${patternNoteWidth}px`,
                width: `${patternNoteWidth}px`,
            }}
        />
        {patternId + 1}
        <div
            className='remove'
            title={nls.localize('vuengine/musicEditor/removePattern', 'Remove Pattern')}
            onClick={e => {
                removeFromSequence(channel, index);
                e.stopPropagation();
            }}
        >
            &times;
        </div>
    </div>;
}
