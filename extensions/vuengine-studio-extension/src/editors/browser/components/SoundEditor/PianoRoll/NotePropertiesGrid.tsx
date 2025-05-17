import React, { useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    NOTE_RESOLUTION,
    SoundData
} from '../SoundEditorTypes';
import { drawGrid } from './NotePropertiesGridOverview';

interface NotePropertiesGridProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    noteCursor: number
    setNoteCursor: (noteCursor: number) => void
    setNote: (step: number, note?: number, prevStep?: number) => void
    pianoRollNoteWidth: number
}

export default function NotePropertiesGrid(props: NotePropertiesGridProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId,
        currentPatternId, // setCurrentPatternId,
        currentSequenceIndex, // setCurrentSequenceIndex,
        noteCursor, setNoteCursor,
        // setNote,
        pianoRollNoteWidth,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const width = soundData.size * NOTE_RESOLUTION * pianoRollNoteWidth;

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
        drawGrid(canvas, context, themeType, soundData.size, pianoRollNoteWidth);
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
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    useEffect(() => {
        draw();
    }, [
        soundData.channels,
        soundData.size,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor,
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
