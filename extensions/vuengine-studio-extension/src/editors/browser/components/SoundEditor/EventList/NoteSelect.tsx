import React from 'react';
import BasicSelect from '../../Common/Base/BasicSelect';
import VContainer from '../../Common/Base/VContainer';
import {
    EventsMap,
    NOTES_LABELS,
    SoundEvent
} from '../SoundEditorTypes';
import { nls } from '@theia/core';

interface NoteSelectProps {
    value: string
    label?: string
    width?: number
    step: number
    setNotes: (notes: EventsMap) => void
}

export default function NoteSelect(props: NoteSelectProps): React.JSX.Element {
    const { value, label, width, step, setNotes } = props;

    return (
        <VContainer>
            {label &&
                <label>{label}</label>
            }
            <BasicSelect
                options={[
                    {
                        value: '',
                        label: nls.localizeByDefault('none'),
                    },
                    ...NOTES_LABELS
                        .map(n => ({
                            value: n,
                            label: n,
                        }))
                ]}
                value={value}
                title={value}
                onChange={e => {
                    setNotes({
                        [step]: {
                            [SoundEvent.Note]: e.target.value ?? undefined
                        }
                    });
                }}
                style={{ width }}
            />
        </VContainer>
    );
}
