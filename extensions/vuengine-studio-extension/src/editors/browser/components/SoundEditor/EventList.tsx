import React, { Dispatch, SetStateAction } from 'react';
import { BAR_NOTE_RESOLUTION, PatternConfig, SOUND_EVENT_LABELS, SoundEvent } from './SoundEditorTypes';
import VContainer from '../Common/Base/VContainer';
import { nls } from '@theia/core';

interface EventListProps {
    currentSequenceIndex: number
    pattern: PatternConfig
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
}

export default function EventList(props: EventListProps): React.JSX.Element {
    const { currentSequenceIndex, pattern, noteCursor, setNoteCursor } = props;

    const noteOffset = currentSequenceIndex * BAR_NOTE_RESOLUTION;
    const eventsKeys = Object.keys(pattern?.events ?? {});
    const formatter = new Intl.NumberFormat(nls.locale);

    return (
        <VContainer
            style={{
                minWidth: 260,
                overflowY: 'scroll',
            }}
        >
            {pattern
                ? eventsKeys.length > 0
                    ? <table>
                        <thead>
                            <tr>
                                <td align="right">{nls.localize('vuengine/editors/sound/step', 'Step')}</td>
                                <td>{nls.localize('vuengine/editors/sound/event', 'Event')}</td>
                                <td align="right">{nls.localize('vuengine/editors/sound/duration', 'Duration')}</td>
                                <td align="right">{nls.localize('vuengine/editors/sound/value', 'Value')}</td>
                            </tr>
                        </thead>
                        <tbody>
                            {eventsKeys.map(k => {
                                const localStep = parseInt(k);
                                const globalStep = noteOffset + localStep;
                                const stepEvents = pattern.events[localStep];
                                const stepEventsKeys = Object.keys(stepEvents);
                                return stepEventsKeys.map((e, i) => {
                                    const value = stepEvents[e];
                                    return <tr
                                        className={noteCursor === globalStep ? 'selected' : undefined}
                                        onClick={() => setNoteCursor(globalStep)}
                                    >
                                        {i === 0 &&
                                            <td align="right" valign="top" rowSpan={stepEventsKeys.length}>
                                                {formatter.format(localStep)}
                                            </td>
                                        }
                                        <td>
                                            {SOUND_EVENT_LABELS[e as SoundEvent]}
                                        </td>
                                        <td align="right">
                                            -
                                        </td>
                                        <td align="right">
                                            {value}
                                        </td>
                                    </tr>;
                                });
                            })}
                        </tbody>
                    </table>
                    : <div className="empty">
                        {nls.localize('vuengine/editors/sound/noEventsInPattern', 'No Events In This Pattern')}
                    </div>
                : <div className="empty">
                    {nls.localize('vuengine/editors/sound/noPatternSelected', 'No Pattern Selected')}
                </div>
            }
        </VContainer>
    );
}
