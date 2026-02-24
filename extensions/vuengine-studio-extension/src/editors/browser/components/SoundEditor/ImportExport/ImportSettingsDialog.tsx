import { FileArrowDown } from '@phosphor-icons/react';
import { nls, URI } from '@theia/core';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import styled from 'styled-components';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { DataSection } from '../../Common/CommonTypes';
import { COLOR_PALETTE } from '../../Common/PaletteColorSelect';
import { getInstrumentName, getTrackTypeLabel } from '../SoundEditor';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { SoundData, SoundEditorTrackType, SoundGroup } from '../SoundEditorTypes';
import { SUPPORTED_IMPORT_FORMATS_ELEMENT } from './ImportExport';

const StyledFileUri = styled.div`
    align-items: center;
    border-bottom: 1px solid var(--theia-dropdown-border);
    cursor: pointer;
    display: flex;
    gap: 5px;
    padding-bottom: var(--padding);
`;

const StyledTrack = styled.div`
    align-items: center;
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    display: flex;
    gap: var(--padding);
    padding: var(--padding);

    &.disabled {
        opacity: .3;
    }

    &:hover {
        border-color: var(--theia-button-background) !important;
    }
`;

const StyledTrackNumber = styled.div`
    font-size: 110%;
    min-width: 18px;
    width: 18px;
    text-align: right;
`;

const ColoredDiv = styled.div`
    border-radius: 2px;
    height: 18px;
    min-width: 18px;
    width: 18px;
`;

export enum ImportMode {
    Overwrite = 'overwrite',
    Add = 'add',
}

export const IMPORT_MODE_LABELS = {
    [ImportMode.Overwrite]: nls.localize('vuengine/editors/sound/importMode/overwrite', 'Overwrite'),
    [ImportMode.Add]: nls.localize('vuengine/editors/sound/importMode/add', 'Add Selected Tracks'),
};

export interface ImportSettings {
    dialogOpen: boolean
    soundData: SoundData
    trackSettings: {
        enabled: boolean
        type: SoundEditorTrackType
    }[]
    fileUri?: URI
    importMode: ImportMode
    removeUnusedPatterns: boolean
    removeUnusedInstruments: boolean
    cleanDuplicatePatterns: boolean
    error?: string
}

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
    dialogOpen: false,
    soundData: {
        author: '',
        comment: '',
        group: SoundGroup.None,
        instruments: {},
        loop: false,
        loopPoint: 0,
        name: '',
        patterns: {},
        section: DataSection.ROM,
        size: 0,
        speed: {},
        timeSignature: '4/4',
        tracks: []
    },
    trackSettings: [],
    importMode: ImportMode.Overwrite,
    removeUnusedPatterns: true,
    removeUnusedInstruments: true,
    cleanDuplicatePatterns: true,
};

export const SUPPORTED_IMPORT_FILETYPES = [
    // 'midi', 'mid',
    'uge',
    // 's3m',
    'vbm',
];

interface ImportSettingsDialogProps {
    soundData: SoundData
    importSettings: ImportSettings
    setImportSettings: Dispatch<SetStateAction<ImportSettings>>
    importFile: () => Promise<void>
}

export default function ImportSettingsDialog(props: ImportSettingsDialogProps): React.JSX.Element {
    const { soundData, importSettings, setImportSettings, importFile } = props;

    const toggleTrackEnabled = (trackIndex: number): void => {
        setImportSettings(prev => ({
            ...prev,
            trackSettings: prev.trackSettings.map((ts, i) => ({
                ...ts,
                enabled: i === trackIndex
                    ? !ts.enabled
                    : ts.enabled
            })),
        }));
    };

    const setTrackType = (trackIndex: number, type: SoundEditorTrackType): void => {
        setImportSettings(prev => ({
            ...prev,
            trackSettings: prev.trackSettings.map((ts, i) => ({
                ...ts,
                type: i === trackIndex
                    ? type
                    : ts.type
            })),
        }));
    };

    useEffect(() => {
        const errors: string[] = [];

        let numberOfWaveChannels = importSettings.trackSettings
            .filter(trackSettings => trackSettings.enabled && trackSettings.type === SoundEditorTrackType.WAVE).length;
        let numberOfSmChannels = importSettings.trackSettings
            .filter(trackSettings => trackSettings.enabled && trackSettings.type === SoundEditorTrackType.SWEEPMOD).length;
        let numberOfNoiseChannels = importSettings.trackSettings
            .filter(trackSettings => trackSettings.enabled && trackSettings.type === SoundEditorTrackType.NOISE).length;

        if (importSettings.importMode === ImportMode.Add) {
            numberOfWaveChannels += soundData.tracks.filter(t => t.type === SoundEditorTrackType.WAVE).length;
            numberOfSmChannels += soundData.tracks.filter(t => t.type === SoundEditorTrackType.SWEEPMOD).length;
            numberOfNoiseChannels += soundData.tracks.filter(t => t.type === SoundEditorTrackType.NOISE).length;
        }

        if (numberOfWaveChannels > 4) {
            errors.push(nls.localize('vuengine/editors/sound/tooManyWaveChannels', 'Too Many Wave Channels ({0})', numberOfWaveChannels));
        }
        if (numberOfSmChannels > 1) {
            errors.push(nls.localize('vuengine/editors/sound/tooManySweepModChannels', 'Too Many Sweep/Mod. Channels ({0})', numberOfSmChannels));
        }
        if (numberOfNoiseChannels > 1) {
            errors.push(nls.localize('vuengine/editors/sound/tooManyNoiseChannels', 'Too Many Noise Channels ({0})', numberOfNoiseChannels));
        }

        setImportSettings(prev => ({
            ...prev,
            error: errors.length
                ? errors.join(', ')
                : undefined
        }));
    }, [
        importSettings.importMode,
        importSettings.trackSettings,
        importSettings.soundData,
        soundData,
    ]);

    return importSettings.fileUri
        ? (
            <VContainer gap={20} grow={1} overflow="hidden">
                <StyledFileUri onClick={importFile}>
                    <FileArrowDown size={17} /> {importSettings.fileUri.path.base}
                </StyledFileUri>
                <HContainer gap={20} justifyContent="space-between">
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/sound/importMode/title', 'Import Mode')}
                        </label>
                        <div style={{ padding: 2 }}>
                            <RadioSelect
                                defaultValue={importSettings.importMode}
                                options={Object.values(ImportMode).map(m => ({
                                    label: IMPORT_MODE_LABELS[m as ImportMode],
                                    value: m,
                                }))}
                                onChange={options => setImportSettings(prev => ({ ...prev, importMode: options[0].value as ImportMode }))}
                            />
                        </div>
                    </VContainer>
                    <VContainer>
                        <label>{nls.localizeByDefault('Options')}</label>
                        <Checkbox
                            checked={importSettings.removeUnusedPatterns}
                            setChecked={v => setImportSettings(prev => ({ ...prev, removeUnusedPatterns: v }))}
                            sideLabel={SoundEditorCommands.REMOVE_UNUSED_PATTERNS.label}
                        />
                        <Checkbox
                            checked={importSettings.removeUnusedInstruments}
                            setChecked={v => setImportSettings(prev => ({ ...prev, removeUnusedInstruments: v }))}
                            sideLabel={SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.label}
                        />
                        <Checkbox
                            checked={importSettings.cleanDuplicatePatterns}
                            setChecked={v => setImportSettings(prev => ({ ...prev, cleanDuplicatePatterns: v }))}
                            sideLabel={SoundEditorCommands.CLEAN_DUPLICATE_PATTERNS.label}
                        />
                    </VContainer>
                </HContainer>
                <VContainer grow={1} overflow="auto" justifyContent="start">
                    <label>{nls.localize('vuengine/editors/sound/tracks', 'Tracks')}</label>
                    {importSettings.soundData.tracks.map((track, trackIndex) =>
                        <StyledTrack
                            key={trackIndex}
                            className={importSettings.trackSettings[trackIndex].enabled ? undefined : 'disabled'}
                        >
                            <Checkbox
                                checked={importSettings.trackSettings[trackIndex].enabled}
                                setChecked={v => toggleTrackEnabled(trackIndex)}
                            />
                            <StyledTrackNumber>
                                {trackIndex + 1}
                            </StyledTrackNumber>
                            <AdvancedSelect
                                options={Object.values(SoundEditorTrackType).map(m => ({
                                    label: getTrackTypeLabel(m),
                                    value: m,
                                }))}
                                defaultValue={importSettings.trackSettings[trackIndex]
                                    ? importSettings.trackSettings[trackIndex].type
                                    : track.type
                                }
                                onChange={options => setTrackType(trackIndex, options[0] as SoundEditorTrackType)}
                                width={224}
                            />
                            <VContainer grow={1}>
                                <HContainer grow={1} alignItems="center">
                                    <ColoredDiv
                                        style={{
                                            backgroundColor: COLOR_PALETTE[importSettings.soundData.instruments[track.instrument].color]
                                        }}
                                    />
                                    {getInstrumentName(importSettings.soundData, track.instrument)}
                                </HContainer>
                            </VContainer>
                        </StyledTrack>
                    )}
                </VContainer>
            </VContainer>
        ) : (
            <VContainer gap={20}>
                <div className="fileAdd" onClick={importFile} style={{
                    // @ts-ignore
                    '--ves-file-height': '320px',
                    '--ves-file-width': '100%',
                }}>
                    <FileArrowDown size={32} />
                    {nls.localize('vuengine/editors/sound/noFileSelected', 'No file selected')}
                </div>
                {SUPPORTED_IMPORT_FORMATS_ELEMENT}
            </VContainer>
        );
}
