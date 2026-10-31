import { nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { EFFECT_LANES, getEffectLaneValues, withGlobalEvent } from '../EffectsPanel/EffectsPanelGrid';
import { formatTempo, getTimerResolution } from '../Other/tempo';
import TempoSelect from '../Other/TempoSelect';
import TimeSignatureInput from '../Other/TimeSignatureInput';
import { getInstrumentName, getNoteSlideLabel } from '../SoundEditor';
import {
    EventsMap,
    GLOBAL_SOUND_EVENTS,
    NOTE_SLIDE_STEPS_DEFAULT,
    NOTE_SLIDE_STEPS_MAX,
    NOTE_SLIDE_STEPS_MIN,
    PatternConfig,
    SOUND_EVENT_LABELS,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';
import EffectSelect from './EffectSelect';
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
                max-width: 56px;
                min-width: 56px;
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
                    min-width: 56px !important;
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
                    padding: 0 2px;
                }

                .timeSignatureInput {
                    input, select {
                        min-width: 40px !important;
                        width: 40px !important;
                    }
                }

                &:nth-child(3) {
                    max-width: 72px;
                    min-width: 72px;
                }

                &:nth-child(4) {
                    max-width: 114px;
                    min-width: 114px;
                }

                &:last-child {
                    max-width: 22px;
                    min-width: 22px;

                    button {
                        min-width: 20px;
                        padding: 0;
                        visibility: hidden;
                    }
                }
            }

            &.selected,
            &:hover {
                td:not(.lightLabel) {
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
    setNotes: (notes: EventsMap, globalEvents?: EventsMap) => void
    setGlobalEvents: (events: EventsMap) => void
    setNoteCursor: (step: number) => void
    width: number
}

export default function EventList(props: EventListProps): React.JSX.Element {
    const { soundData, currentTrackId, currentSequenceIndex, noteSnapping, pattern, noteCursor, setNotes, setGlobalEvents, setNoteCursor, width } = props;

    const patternStartStep = currentSequenceIndex * SUB_NOTE_RESOLUTION;
    const globalEvents = soundData.events ?? {};
    // global events within the pattern's range get listed along with the pattern's own events
    const globalEventSteps = pattern
        ? Object.keys(globalEvents)
            .map(s => parseInt(s) - patternStartStep)
            .filter(s => s >= 0 && s < pattern.size * SUB_NOTE_RESOLUTION)
        : [];
    const eventsKeys = [...new Set([
        ...Object.keys(pattern?.events ?? {}).map(s => parseInt(s)),
        ...globalEventSteps,
    ])].sort((a, b) => a - b);
    const formatter = new Intl.NumberFormat(nls.locale);

    const getEffectSelect = (eventType: SoundEvent, value: number, setValue: (value: number) => void, key: number) =>
        <EffectSelect
            key={key}
            value={value}
            values={getEffectLaneValues(EFFECT_LANES[eventType])}
            format={EFFECT_LANES[eventType].format}
            setValue={setValue}
        />;

    return (
        <VContainer
            overflow="hidden"
            style={{
                maxWidth: width,
                minWidth: width,
            }}
        >
            <StyledTableContainer>
                <StyledTable>
                    <thead>
                        <tr>
                            <td>{nls.localize('vuengine/editors/sound/step', 'Step')}</td>
                            <td>{nls.localize('vuengine/editors/sound/duration', 'Duration')}</td>
                            <td>{nls.localize('vuengine/editors/sound/event', 'Event')}</td>
                            <td>{nls.localize('vuengine/editors/sound/value', 'Value')}</td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {pattern
                            ? eventsKeys.length > 0
                                ? <>
                                    {eventsKeys.map((localStep, i) => {
                                        const globalStep = patternStartStep + localStep;
                                        const stepEvents = pattern.events[localStep] ?? {};
                                        const stepGlobalEvents = globalEvents[globalStep] ?? {};
                                        const hasGlobalEvents = Object.keys(stepGlobalEvents).length > 0;
                                        const listedEvents = { ...stepEvents, ...stepGlobalEvents };
                                        // the steps of a note slide are listed with the slide, even if they are not set
                                        if (stepEvents[SoundEvent.NoteSlide] !== undefined && stepEvents[SoundEvent.NoteSlideSteps] === undefined) {
                                            listedEvents[SoundEvent.NoteSlideSteps] = NOTE_SLIDE_STEPS_DEFAULT;
                                        }
                                        const stepEventsKeys = Object.keys(listedEvents);
                                        const isSelectedNote = noteCursor === globalStep;
                                        const hasPatternEvents = Object.keys(stepEvents).length > 0;
                                        const hasNote = stepEvents[SoundEvent.Note] !== undefined;
                                        const duration = stepEvents[SoundEvent.Duration] ?? SUB_NOTE_RESOLUTION;

                                        return (
                                            <tr
                                                key={i}
                                                className={isSelectedNote ? 'selected' : undefined}
                                                onClick={() => setNoteCursor(globalStep)}
                                            >
                                                <td valign="top">
                                                    {isSelectedNote && hasPatternEvents &&
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
                                                    {!(isSelectedNote && hasPatternEvents) && formatter.format(localStep)}
                                                </td>
                                                <td valign="top">
                                                    {isSelectedNote && hasNote && <Input
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
                                                    {!isSelectedNote && hasNote && formatter.format(duration)}
                                                </td>
                                                <td valign="top">
                                                    {stepEventsKeys.map((eventType, j) => {
                                                        if (eventType === SoundEvent.Duration) {
                                                            return;
                                                        }
                                                        if (GLOBAL_SOUND_EVENTS.includes(eventType as SoundEvent)) {
                                                            return <div
                                                                key={j}
                                                                title={nls.localize('vuengine/editors/sound/globalEffect', 'Global effect, applies to all tracks')}
                                                            >
                                                                <i className='codicon codicon-globe' style={{ fontSize: 10, marginRight: 2, verticalAlign: 'middle' }} />
                                                                {SOUND_EVENT_LABELS[eventType as SoundEvent]}
                                                            </div>;
                                                        }
                                                        return <div key={j}>
                                                            {SOUND_EVENT_LABELS[eventType as SoundEvent]}
                                                        </div>;
                                                    })}
                                                </td>
                                                <td valign="top">
                                                    {stepEventsKeys.map((eventType, j) => {
                                                        let value = listedEvents[eventType];

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

                                                            case SoundEvent.NoteSlideSteps:
                                                                if (isSelectedNote) {
                                                                    return <Input
                                                                        key={j}
                                                                        type='number'
                                                                        min={NOTE_SLIDE_STEPS_MIN}
                                                                        max={NOTE_SLIDE_STEPS_MAX}
                                                                        value={value}
                                                                        title={nls.localize(
                                                                            'vuengine/editors/sound/noteSlideStepsDescription',
                                                                            'In how many steps per 1/16 note the note slide changes the pitch'
                                                                        )}
                                                                        setValue={v => setNotes({
                                                                            [localStep]: { [SoundEvent.NoteSlideSteps]: v === NOTE_SLIDE_STEPS_DEFAULT ? undefined : v },
                                                                        })}
                                                                    />;
                                                                }
                                                                break;

                                                            case SoundEvent.Volume:
                                                            case SoundEvent.Panning:
                                                                if (isSelectedNote) {
                                                                    return getEffectSelect(eventType, value, v => setNotes({
                                                                        [localStep]: { [eventType]: v },
                                                                    }), j);
                                                                }
                                                                value = EFFECT_LANES[eventType].format(value);
                                                                break;

                                                            case SoundEvent.MasterVolume:
                                                                if (isSelectedNote) {
                                                                    return getEffectSelect(eventType, value, v => setGlobalEvents(
                                                                        withGlobalEvent(globalEvents, globalStep, eventType, v)
                                                                    ), j);
                                                                }
                                                                value = EFFECT_LANES[eventType].format(value);
                                                                break;

                                                            case SoundEvent.Tempo:
                                                                if (isSelectedNote) {
                                                                    return <TempoSelect
                                                                        key={j}
                                                                        value={value}
                                                                        timerResolution={getTimerResolution(soundData)}
                                                                        setValue={v => setGlobalEvents(
                                                                            withGlobalEvent(globalEvents, globalStep, SoundEvent.Tempo, v)
                                                                        )}
                                                                    />;
                                                                }
                                                                value = formatTempo(value);
                                                                break;

                                                            case SoundEvent.TimeSignature:
                                                                if (isSelectedNote) {
                                                                    return <TimeSignatureInput
                                                                        key={j}
                                                                        value={value}
                                                                        setValue={v => setGlobalEvents(
                                                                            withGlobalEvent(globalEvents, globalStep, SoundEvent.TimeSignature, v)
                                                                        )}
                                                                    />;
                                                                }
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
                                                            // remove all of the step's events, including global ones
                                                            const { [globalStep]: removed, ...remainingGlobalEvents } = globalEvents;
                                                            setNotes(
                                                                hasPatternEvents
                                                                    ? { [localStep]: Object.fromEntries(Object.keys(stepEvents).map(e => [e, undefined])) }
                                                                    : {},
                                                                hasGlobalEvents ? remainingGlobalEvents : undefined
                                                            );
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
