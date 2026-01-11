import React, { useEffect, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import CanvasImage from '../../Common/CanvasImage';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { DisplayMode } from '../../Common/VUEngineTypes';
import {
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_SPECTRUM,
    PatternConfig,
    SEQUENCER_GRID_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';

interface PatternCanvasProps {
    soundData: SoundData
    trackId: number
    pattern: PatternConfig
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    style?: Object
}

export default function PatternCanvas(props: PatternCanvasProps): React.JSX.Element {
    const {
        soundData,
        trackId,
        pattern,
        sequencerPatternHeight, sequencerPatternWidth,
        style,
    } = props;
    const [patternPixels, setPatternPixels] = useState<number[][][]>([]);
    const [colorOverrides, setColorOverrides] = useState<string[][]>([]);

    const track = soundData.tracks[trackId];
    const trackDefaultInstrument = soundData.instruments[track.instrument];
    const defaultColor = COLOR_PALETTE[trackDefaultInstrument?.color ?? DEFAULT_COLOR_INDEX];

    const patternNoteWidth = sequencerPatternWidth / NOTE_RESOLUTION;
    const width = pattern.size / SEQUENCER_RESOLUTION * sequencerPatternWidth - SEQUENCER_GRID_WIDTH;
    const widthCeil = Math.ceil(width);

    useEffect(() => {
        const pixels: number[][] = [];
        const colors: string[][] = [];

        // init arrays
        const emptyPixelLine = [...Array(widthCeil)].map(v => 0);
        const emptyColorLine = [...Array(widthCeil)].map(v => '');
        [...Array(sequencerPatternHeight)].map(v => {
            pixels.push([...emptyPixelLine]);
            colors.push([...emptyColorLine]);
        });

        const placePixel = (x: number, y: number, color: string) => {
            if (pixels[y] === undefined) {
                pixels[y] = [];
                colors[y] = [];
            }
            for (let k = 0; k < patternNoteWidth; k++) {
                const xPos = Math.round(x * patternNoteWidth + k);
                pixels[y][xPos] = 1;
                colors[y][xPos] = color;
                if (pixels[y - 1]) {
                    pixels[y - 1][xPos] = 1;
                    colors[y - 1][xPos] = color;
                }
                if (pixels[y + 1]) {
                    pixels[y + 1][xPos] = 1;
                    colors[y + 1][xPos] = color;
                }
            }
        };

        // find set notes
        Object.keys(pattern.events).forEach((key: string) => {
            const s = parseInt(key);
            const event = pattern.events[s];
            const noteLabel = event[SoundEvent.Note];
            const instrumentId = event[SoundEvent.Instrument];
            const color = instrumentId
                ? COLOR_PALETTE[soundData.instruments[instrumentId].color ?? DEFAULT_COLOR_INDEX]
                : defaultColor;
            if (noteLabel !== '') {
                const noteId = NOTES_LABELS.indexOf(noteLabel);
                const duration = event[SoundEvent.Duration]
                    ? Math.floor(event[SoundEvent.Duration] / SUB_NOTE_RESOLUTION)
                    : 1;
                const startXPosition = Math.floor(s / SUB_NOTE_RESOLUTION);
                const noteYPosition = Math.round(sequencerPatternHeight / NOTES_SPECTRUM * noteId) - 1;
                for (let k = 0; k < duration; k++) {
                    placePixel(startXPosition + k, noteYPosition, color);
                }
            }
        });

        setPatternPixels([pixels]);
        setColorOverrides(colors);
    }, [
        track.instrument,
        soundData.instruments[track.instrument],
        pattern.events,
        sequencerPatternHeight,
        sequencerPatternWidth,
    ]);

    return (
        <CanvasImage
            height={sequencerPatternHeight - 1}
            palette={'00000000'}
            pixelData={patternPixels}
            colorOverride={colorOverrides}
            width={widthCeil}
            displayMode={DisplayMode.Mono}
            colorMode={ColorMode.Default}
            style={{
                height: sequencerPatternHeight,
                width: widthCeil,
                ...style,
            }}
        />
    );
}
