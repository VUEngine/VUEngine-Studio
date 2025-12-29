import React, { useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    NOTE_RESOLUTION,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData
} from '../SoundEditorTypes';
import { drawGrid } from './NotePropertiesGridOverview';

interface NotePropertiesGridProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (noteCursor: number) => void
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
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
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
        const themeType = services.themeService.getCurrentTheme().type;

        scaleCanvasAccountForDpi(canvas, context, width, EFFECTS_PANEL_EXPANDED_HEIGHT);
        drawGrid(canvas, context, themeType, songLength, pianoRollNoteWidth, pianoRollScrollWindow.x, pianoRollScrollWindow.w);
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
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
        // TODO: wrap in disposable
        // services.themeService.onDidColorThemeChange(() => draw());

        draw();
    }, [
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
