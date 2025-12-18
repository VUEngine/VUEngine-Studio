const { XMLParser } = require('fast-xml-parser');
import { VBMusicFile } from './vbmTypes';
import { isArray } from '@theia/core';

const compareIds = (a: any, b: any) => {
    if (a.ID < b.ID) {
        return -1;
    } else if (a.ID > b.ID) {
        return 1;
    }

    return 0;
};

export const parseVbmSong = (fileArrayBuffer: ArrayBuffer): VBMusicFile | false => {
    const parsedData = parseRawFile(fileArrayBuffer);
    if (!parsedData) {
        return false;
    }

    const result: VBMusicFile = {
        EditorSettings: {
            Octave: parseInt(parsedData.EditorSettings.Octave),
            RowHighlight: parseInt(parsedData.EditorSettings.RowHighlight),
            Step: parseInt(parsedData.EditorSettings.Step),
        },
        Instrument: parsedData.Instrument.map((i: any) => ({
            ...i,
            ID: parseInt(i.ID),
            Effect: (!isArray(i.Effect) ? [i.Effect] : i.Effect)
                .map((e: any) => ({
                    ...e,
                    On: e.On === '1',
                })),
        })).sort(compareIds),
        Pattern: parsedData.Pattern.map((p: any) => ({
            ...p,
            Channel: parseInt(p.Channel),
            ID: parseInt(p.ID),
            Row: p.Row.map((r: any) => ({
                ...r,
                ID: parseInt(r.ID),
                Inst: r.Inst ? parseInt(r.Inst) : undefined,
                Note: r.Note ? parseInt(r.Note) : undefined,
                VolL: r.VolL ? parseInt(r.VolL) : undefined,
                VolR: r.VolR ? parseInt(r.VolR) : undefined,
            })).sort(compareIds),
        })).sort(compareIds),
        PatternMap: {
            Frame: parsedData.PatternMap.Frame.map((f: any) => ({
                ...f,
                Data: f.Data.split(',').map((x: string) => parseInt(x)),
                ID: parseInt(f.ID),
            })).sort(compareIds)
        },
        SongSettings: {
            ...parsedData.SongSettings,
            Frames: parseInt(parsedData.SongSettings.Frames),
            Rows: parseInt(parsedData.SongSettings.Rows),
            Speed: parseInt(parsedData.SongSettings.Speed),
        },
        Version: parsedData.Version,
        Waveform: parsedData.Waveform.map((w: any) => ({
            ...w,
            Data: w.Data.split(',').map((x: string) => parseInt(x)),
            ID: parseInt(w.ID),
        })).sort(compareIds),
    };

    return result;
};

const parseRawFile = (fileArrayBuffer: ArrayBuffer): any => {
    const xmlParser = new XMLParser({
        attributeNamePrefix: '',
        ignoreAttributes: false,
    });
    const parsedData = xmlParser.parse(fileArrayBuffer);
    if (parsedData?.VBMusicFile) {
        return parsedData.VBMusicFile;
    }

    return false;
};
