import { nls } from '@theia/core';
import React, { useContext, useMemo, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { ChannelConfig, MusicEvent, PATTERN_HEIGHT, PATTERN_MAPPING_FACTOR, PatternConfig, SongData } from '../MusicEditorTypes';
import { StyledPattern, StyledPatternRemove } from './StyledComponents';

interface PatternProps {
    songData: SongData
    index: number
    pattern: PatternConfig
    patternSize: number
    channel: number
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
        pattern,
        patternSize,
        patternId,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const isCurrent = currentChannelId === channel && currentPatternId === patternId;
    const textColor = isCurrent ? '#fff' : services.colorRegistry.getCurrentColor('editor.foreground') ?? '#000';

    const patternNoteWidth = Math.max(0, 16 / songData.noteResolution);
    const patternPixels: number[][][] = useMemo(() => {
        const result: number[][] = [[]];

        // init array
        const emptyLine = [...Array(patternSize)].map(v => 0);
        [...Array(PATTERN_HEIGHT)].map(v => result.push([...emptyLine]));

        // find set notes
        Object.keys(pattern.events).forEach((key: string) => {
            const numKey = parseInt(key);
            const note = pattern.events[numKey][MusicEvent.Note];
            if (note) {
                const noteYPosition = Math.round(PATTERN_MAPPING_FACTOR * note);
                for (let k = 0; k < patternNoteWidth; k++) {
                    result[noteYPosition][numKey * patternNoteWidth + k] = 1;
                }
            }
        });

        return [result];
    }, [
        pattern.events,
        songData.noteResolution,
    ]);

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

    return (
        <StyledPattern
            className={isCurrent ? 'current' : undefined}
            style={{
                backgroundColor: currentChannelId === channel && currentSequenceIndex === index
                    ? 'var(--theia-focusBorder)'
                    : undefined,
                height: `${PATTERN_HEIGHT}px`,
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
            <CanvasImage
                height={PATTERN_HEIGHT}
                palette={'00000000'}
                pixelData={patternPixels}
                textColor={textColor}
                width={patternSize}
                displayMode={DisplayMode.Mono}
                colorMode={ColorMode.Default}
                style={{
                    left: 0,
                    position: 'absolute',
                    top: 0,
                }}
            />
            {patternId + 1}
            <StyledPatternRemove
                title={nls.localize('vuengine/musicEditor/removePattern', 'Remove Pattern')}
                onClick={e => {
                    removeFromSequence(channel, index);
                    e.stopPropagation();
                }}
            >
                &times;
            </StyledPatternRemove>
        </StyledPattern>
    );
}
