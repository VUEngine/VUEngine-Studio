import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { getInstrumentName, getNoteSlideLabel } from '../SoundEditor';
import {
    EventsMap,
    PatternConfig,
    SOUND_EVENT_LABELS,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';
import InstrumentSelect from './InstrumentSelect';
import NoteSelect from './NoteSelect';
import StepInput from './StepInput';

const StyledTableContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: auto;
    user-select: none;
`;

const StyledTable = styled.table`
    border-spacing: 0;

    thead {
        td {
            background-color: var(--theia-editor-background);
            border-bottom: 1px solid rgba(255, 255, 255, .6);
            padding: 13px 4px 2px;
            position: sticky;
            top: 0;
            z-index: 1;

            body.theia-light &,
            body.theia-hc & {
                border-bottom-color: rgba(0, 0, 0, .6);
            }
        }
    }

    tbody {
        overflow: auto;

        tr {
            td {
                border-bottom: 1px solid rgba(255, 255, 255, .1);
                cursor: pointer;
                padding: 1px 4px;

                body.theia-light &,
                body.theia-hc & {
                    border-bottom-color: rgba(0, 0, 0, .1);
                }

                &.lightLabel {
                    padding: var(--padding);
                    text-align: center;
                }

                div, input, select {
                    margin-bottom: 1px;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;

                    &:last-child {
                        margin-bottom: 0;
                    }
                }

                input, select {
                    height: 16px;
                    min-height: 16px;
                    padding-bottom: 0;
                    padding-top: 0;
                }

                &:last-child {
                    button {
                        min-width: 20px;
                        padding: 0;
                        visibility: hidden;
                    }
                }
            }

            &.selected,
            &:hover {
                td {
                    background-color: rgba(255, 255, 255, .1);

                    body.theia-light &,
                    body.theia-hc & {
                        background-color: rgba(0, 0, 0, .1);
                    }

                    &:last-child {
                        button {
                            visibility: visible;
                        }
                    }
                }
            }

            &:last-child {
                td {
                    border-bottom-width: 0;
                }
            }
        }
    }
`;

interface EventListProps {
    soundData: SoundData
    currentTrackId: number
    currentSequenceIndex: number
    noteSnapping: boolean
    pattern: PatternConfig
    noteCursor: number
    setNotes: (notes: EventsMap) => void
    setNoteCursor: Dispatch<SetStateAction<number>>
}

export default function EventList(props: EventListProps): React.JSX.Element {
    const { soundData, currentTrackId, currentSequenceIndex, noteSnapping, pattern, noteCursor, setNotes, setNoteCursor } = props;

    const eventsKeys = Object.keys(pattern?.events ?? {});
    const formatter = new Intl.NumberFormat(nls.locale);

    return (
        <VContainer
            overflow="hidden"
            style={{
                minWidth: 300,
            }}
        >
            <StyledTableContainer>
                <StyledTable>
                    <thead>
                        <tr>
                            <td width={56}>{nls.localize('vuengine/editors/sound/step', 'Step')}</td>
                            <td width={56}>{nls.localize('vuengine/editors/sound/durationShort', 'Dur.')}</td>
                            <td width={72}>{nls.localize('vuengine/editors/sound/event', 'Event')}</td>
                            <td width={120}>{nls.localize('vuengine/editors/sound/value', 'Value')}</td>
                            <td width={10}></td>
                        </tr>
                    </thead>
                    <tbody>
                        {pattern
                            ? eventsKeys.length > 0
                                ? <>
                                    {eventsKeys.map((k, i) => {
                                        const localStep = parseInt(k);
                                        const globalStep = currentSequenceIndex * SUB_NOTE_RESOLUTION + localStep;
                                        const stepEvents = pattern.events[localStep];
                                        const stepEventsKeys = Object.keys(stepEvents);
                                        const isSelectedNote = noteCursor === globalStep;
                                        const duration = stepEvents[SoundEvent.Duration] ?? SUB_NOTE_RESOLUTION;

                                        return (
                                            <tr
                                                key={i}
                                                className={isSelectedNote ? 'selected' : undefined}
                                                onClick={() => setNoteCursor(globalStep)}
                                            >
                                                <td valign="top">
                                                    {isSelectedNote &&
                                                        <StepInput
                                                            step={localStep}
                                                            events={stepEvents}
                                                            noteSnapping={noteSnapping}
                                                            patternSize={pattern.size}
                                                            patternStepOffset={currentSequenceIndex}
                                                            setNotes={setNotes}
                                                            setNoteCursor={setNoteCursor}
                                                        />
                                                    }
                                                    {!isSelectedNote && formatter.format(localStep)}
                                                </td>
                                                <td valign="top">
                                                    {isSelectedNote && <Input
                                                        type='number'
                                                        min={noteSnapping ? SUB_NOTE_RESOLUTION : 1}
                                                        step={noteSnapping ? SUB_NOTE_RESOLUTION : 1}
                                                        value={duration}
                                                        setValue={v => {
                                                            setNotes({
                                                                [localStep]: {
                                                                    ...stepEvents,
                                                                    [SoundEvent.Duration]: v
                                                                }
                                                            });
                                                        }}
                                                    />}
                                                    {!isSelectedNote && formatter.format(duration)}
                                                </td>
                                                <td valign="top">
                                                    {stepEventsKeys.map((eventType, j) => {
                                                        if (eventType === SoundEvent.Duration) {
                                                            return;
                                                        }
                                                        return <div key={j}>
                                                            {SOUND_EVENT_LABELS[eventType as SoundEvent]}
                                                        </div>;
                                                    })}
                                                </td>
                                                <td valign="top">
                                                    {stepEventsKeys.map((eventType, j) => {
                                                        let value = stepEvents[eventType];

                                                        switch (eventType) {
                                                            case SoundEvent.Duration:
                                                                return;

                                                            case SoundEvent.Instrument:
                                                                const instrumentId = stepEvents[SoundEvent.Instrument];
                                                                value = getInstrumentName(soundData, instrumentId);

                                                                if (isSelectedNote) {
                                                                    return (
                                                                        <InstrumentSelect
                                                                            key={j}
                                                                            soundData={soundData}
                                                                            currentTrackId={currentTrackId}
                                                                            step={localStep}
                                                                            instrumentId={instrumentId}
                                                                            setNotes={setNotes}
                                                                        />
                                                                    );
                                                                }
                                                                break;

                                                            case SoundEvent.Note:
                                                                if (isSelectedNote) {
                                                                    return (
                                                                        <NoteSelect
                                                                            key={j}
                                                                            value={value}
                                                                            step={localStep}
                                                                            setNotes={setNotes}
                                                                        />
                                                                    );
                                                                }
                                                                break;

                                                            case SoundEvent.NoteSlide:
                                                                value = getNoteSlideLabel(stepEvents[SoundEvent.Note], value);
                                                                break;

                                                            case SoundEvent.Volume:
                                                                const volume = stepEvents[SoundEvent.Volume];
                                                                const volumeLeft = volume >> 4;
                                                                const volumeRight = volume - (volumeLeft << 4);
                                                                value = `${volumeLeft}/${volumeRight}`;
                                                                break;
                                                        }

                                                        return <div key={j} title={value}>
                                                            {value}
                                                        </div>;
                                                    })}
                                                </td>
                                                <td valign="top">
                                                    <button
                                                        className='theia-button secondary small'
                                                        onClick={() => {
                                                            setNotes({
                                                                [localStep]: {},
                                                            });
                                                        }}
                                                    >
                                                        <i className='codicon codicon-x' />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                    }
                                </>
                                : <tr>
                                    <td colSpan={4} className="lightLabel">
                                        {nls.localize('vuengine/editors/sound/noEventsInPattern', 'No Events In This Pattern')}
                                    </td>
                                </tr>
                            : <tr>
                                <td colSpan={4} className="lightLabel">
                                    {nls.localize('vuengine/editors/sound/noPatternSelected', 'No Pattern Selected')}
                                </td>
                            </tr>
                        }
                    </tbody>
                </StyledTable>
            </StyledTableContainer>
        </VContainer>
    );
}
