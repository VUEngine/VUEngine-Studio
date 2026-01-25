import React from 'react';
import BasicSelect from '../../Common/Base/BasicSelect';
import { getInstrumentName } from '../SoundEditor';
import {
    EventsMap,
    SoundData,
    SoundEvent,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TRACK_DEFAULT_INSTRUMENT_NAME,
    TRACK_TYPE_INSTRUMENT_COMPATIBILITY
} from '../SoundEditorTypes';
import VContainer from '../../Common/Base/VContainer';

interface InstrumentSelectProps {
    soundData: SoundData
    currentTrackId: number
    label?: string
    grow?: number
    step: number
    instrumentId: string
    setNotes: (notes: EventsMap) => void
}

export default function InstrumentSelect(props: InstrumentSelectProps): React.JSX.Element {
    const { soundData, currentTrackId, label, grow, step, instrumentId, setNotes } = props;

    const currentTrack = soundData.tracks[currentTrackId];

    return (
        <VContainer grow={grow}>
            {label &&
                <label>{label}</label>
            }
            <BasicSelect
                options={[
                    {
                        value: TRACK_DEFAULT_INSTRUMENT_ID,
                        label: TRACK_DEFAULT_INSTRUMENT_NAME,
                    },
                    ...Object.keys(soundData.instruments)
                        .filter(iid => {
                            const instr = soundData.instruments[iid];
                            return iid ===
                                instrumentId ||
                                TRACK_TYPE_INSTRUMENT_COMPATIBILITY[currentTrack.type].includes(instr.type);
                        })
                        .sort((a, b) => (soundData.instruments[a].name.length
                            ? soundData.instruments[a].name
                            : 'zzz').localeCompare(
                                (soundData.instruments[b].name.length
                                    ? soundData.instruments[b].name
                                    : 'zzz')
                            ))
                        .map(instrId => ({
                            value: `${instrId}`,
                            label: getInstrumentName(soundData, instrId),
                        }))
                ]}
                title={getInstrumentName(soundData, instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID)}
                value={instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID}
                onChange={e => {
                    setNotes({
                        [step]: {
                            [SoundEvent.Instrument]:
                                (e.target.value === TRACK_DEFAULT_INSTRUMENT_ID ||
                                    e.target.value === currentTrack.instrument)
                                    ? ''
                                    : e.target.value
                        }
                    });
                }}
            />
        </VContainer>
    );
}
