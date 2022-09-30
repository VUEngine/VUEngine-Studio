import { nls } from '@theia/core';
import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, PatternConfig, PATTERN_NOTE_HEIGHT, PATTERN_NOTE_WIDTH } from '../types';

interface PatternProps {
    index: number
    pattern: PatternConfig
    currentChannel: number
    currentPattern: number
    channel: number
    height: number
    patternId: number
    dragged: boolean
    setDragged: (dragged: boolean) => void
    setCurrentPattern: (channelId: number, patternId: number) => void
    removeFromSequence: (channelId: number, index: number) => void
    moveSequencePattern: (channelId: number, from: number, to: number) => void
}

export default function Pattern(props: PatternProps): JSX.Element {
    const {
        index,
        channel,
        height,
        pattern,
        patternId,
        currentChannel,
        currentPattern,
        dragged,
        setDragged,
        setCurrentPattern,
        removeFromSequence,
        moveSequencePattern,
    } = props;

    const classNames = ['pattern'];
    if (currentChannel === channel && currentPattern === patternId) {
        classNames.push('current');
    }

    const boxShadow: string[] = [];
    pattern.notes.forEach((note, i) => {
        if (note !== undefined
            && note >= HIGHEST_NOTE
            && note <= LOWEST_NOTE) {
            boxShadow.push(
                `${(i + 1) * PATTERN_NOTE_WIDTH}px ${(note - HIGHEST_NOTE) * PATTERN_NOTE_HEIGHT}px 0 0 #f00`
            );
        }
    });

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
            height: `${height * PATTERN_NOTE_HEIGHT}px`,
            minWidth: `${(pattern.size * PATTERN_NOTE_WIDTH) - 1}px`,
            width: `${(pattern.size * PATTERN_NOTE_WIDTH) - 1}px`
        }}
        data-channel={channel}
        data-position={index}
        onClick={() => setCurrentPattern(channel, patternId)}
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
                marginLeft: `-${PATTERN_NOTE_WIDTH}px`,
                width: `${PATTERN_NOTE_WIDTH}px`,
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
