import React, { Dispatch, MouseEvent, SetStateAction, useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    NOTE_RESOLUTION,
    ScrollWindow,
    SoundData
} from '../SoundEditorTypes';
import { drawGrid } from './NotePropertiesGridOverview';

interface NotePropertiesGridProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
    pianoRollNoteWidth: number
    pianoRollScrollWindow: ScrollWindow
}

export default function NotePropertiesGrid(props: NotePropertiesGridProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor, setNoteCursor,
        pianoRollNoteWidth,
        pianoRollScrollWindow,
    } = props;
    const { currentThemeType } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / NOTE_RESOLUTION;
    const width = Math.min(
        pianoRollScrollWindow.w,
        songLength * NOTE_RESOLUTION * pianoRollNoteWidth
    );

    const draw = (): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        scaleCanvasAccountForDpi(canvas, context, width, EFFECTS_PANEL_EXPANDED_HEIGHT);
        drawGrid(canvas, context, currentThemeType, songLength, pianoRollNoteWidth, pianoRollScrollWindow.x, pianoRollScrollWindow.w);
    };

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const step = Math.floor(x / pianoRollNoteWidth);

        if (e.button === 0) {
            // TODO
        } else if (e.button === 2) {
            setNoteCursor(step);
        }
    };

    useEffect(() => {
        draw();
    }, [
        currentThemeType,
        soundData.tracks,
        songLength,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor,
        pianoRollNoteWidth,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
    ]);

    return (
        <canvas
            height={EFFECTS_PANEL_EXPANDED_HEIGHT}
            width={width}
            onMouseDown={onMouseDown}
            ref={canvasRef}
        />
    );
}
