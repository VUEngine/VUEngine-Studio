import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import VContainer from '../Common/Base/VContainer';
import { getInstrumentName } from './SoundEditor';
import { BAR_NOTE_RESOLUTION, NOTES_LABELS, PatternConfig, SEQUENCER_RESOLUTION, SOUND_EVENT_LABELS, SoundData, SoundEvent, SUB_NOTE_RESOLUTION } from './SoundEditorTypes';

const StyledTableContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: auto;
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
            /*
                border-bottom: 1px solid rgba(255, 255, 255, .2);
            */
                cursor: pointer;
                padding: 2px 4px;

            /*
                body.theia-light &,
                body.theia-hc & {
                    border-bottom-color: rgba(0, 0, 0, .2);
                }
            */

                &.lightLabel {
                    padding: var(--padding);
                    text-align: center;
                }

                div {
                    margin-bottom: 4px;

                    &:last-child {
                        margin-bottom: 0;
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
    currentSequenceIndex: number
    pattern: PatternConfig
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
}

export default function EventList(props: EventListProps): React.JSX.Element {
    const { soundData, currentSequenceIndex, pattern, noteCursor, setNoteCursor } = props;

    const noteOffset = currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
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
                            <td>{nls.localize('vuengine/editors/sound/step', 'Step')}</td>
                            <td>{nls.localize('vuengine/editors/sound/event', 'Event')}</td>
                            <td>{nls.localize('vuengine/editors/sound/durationShort', 'Dur.')}</td>
                            <td>{nls.localize('vuengine/editors/sound/value', 'Value')}</td>
                        </tr>
                    </thead>
                    <tbody>
                        {pattern
                            ? eventsKeys.length > 0
                                ?
                                <>
                                    {eventsKeys.map((k, i) => {
                                        const localStep = parseInt(k);
                                        const globalStep = noteOffset + localStep;
                                        const stepEvents = pattern.events[localStep];
                                        const stepEventsKeys = Object.keys(stepEvents);
                                        return (
                                            <tr
                                                key={i}
                                                className={noteCursor === globalStep ? 'selected' : undefined}
                                                onClick={() => setNoteCursor(globalStep)}
                                            >
                                                <td valign="top">
                                                    {formatter.format(localStep)}
                                                </td>
                                                <td>
                                                    {stepEventsKeys.map((eventType, j) => {
                                                        if (eventType === SoundEvent.Duration) {
                                                            return;
                                                        }
                                                        return <div key={j}>
                                                            {SOUND_EVENT_LABELS[eventType as SoundEvent]}
                                                        </div>;
                                                    })}
                                                </td>
                                                <td>
                                                    {stepEventsKeys.map((eventType, j) => {
                                                        if (eventType === SoundEvent.Duration) {
                                                            return;
                                                        }
                                                        let duration = '-';
                                                        if (eventType === SoundEvent.Note || eventType === SoundEvent.NoteSlide) {
                                                            duration = stepEvents[SoundEvent.Duration] ?? SUB_NOTE_RESOLUTION;
                                                        }
                                                        return <div key={j}>
                                                            {duration}
                                                        </div>;
                                                    })}
                                                </td>
                                                <td>
                                                    {stepEventsKeys.map((eventType, j) => {
                                                        if (eventType === SoundEvent.Duration) {
                                                            return;
                                                        }
                                                        let value = stepEvents[eventType];
                                                        if (eventType === SoundEvent.NoteSlide) {
                                                            const directionLabel = value < 0 ? '↓' : '↑';
                                                            const noteId = NOTES_LABELS.indexOf(stepEvents[SoundEvent.Note] ?? 0);
                                                            const targetNoteLabel = NOTES_LABELS[noteId - value];
                                                            value = `${directionLabel}${targetNoteLabel}`;
                                                        }
                                                        if (eventType === SoundEvent.Instrument) {
                                                            const instrumentId = stepEvents[SoundEvent.Instrument];
                                                            value = getInstrumentName(soundData, instrumentId);
                                                        }
                                                        return <div key={j}>
                                                            {value}
                                                        </div>;
                                                    })}
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
