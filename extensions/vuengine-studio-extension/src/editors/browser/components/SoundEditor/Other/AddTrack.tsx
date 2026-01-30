import { Waveform, WaveSine, WaveTriangle } from '@phosphor-icons/react';
import { deepClone, nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { SoundType } from '../../../../../project/browser/types/Sound';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { ALL_TRACK_TYPES, DEFAULT_TRACK_SETTINGS, SoundData, SoundEditorTrackType, TRACK_TYPE_LABELS, TrackConfig, TrackSettings } from '../SoundEditorTypes';

const StyledChannel = styled.button`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border: none;
    border-radius: 2px;
    box-sizing: border-box;
    color: var(--theia-foreground-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 5px;
    height: 88px;
    overflow: hidden;
    padding: var(--theia-ui-padding) !important;
    width: 200px;

    &:focus,
    &:hover {
        outline: 1px solid var(--theia-button-background);
        outline-offset: 1px;
    }

    &.disabled {
        cursor: unset;
        opacity: .2;

        &:hover {
            outline-width: 0;
        }
    }
`;

const AllAvailable = styled(StyledChannel)`
    background-color: transparent;
    border: 1px solid var(--theia-secondaryButton-background);
    justify-content: center;
`;

interface AddTrackProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    setEditTrackDialogOpen: Dispatch<SetStateAction<boolean>>
    setAddTrackDialogOpen: Dispatch<SetStateAction<boolean>>
    trackSettings: TrackSettings[]
    setTrackSettings: Dispatch<SetStateAction<TrackSettings[]>>
    isTrackAvailable: (trackType: SoundEditorTrackType, tracks: TrackConfig[]) => boolean
}

export default function AddTrack(props: AddTrackProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        setEditTrackDialogOpen, setAddTrackDialogOpen,
        trackSettings, setTrackSettings,
        isTrackAvailable,
    } = props;
    const { services, disableCommands, enableCommands, focusEditor } = useContext(EditorsContext) as EditorsContextType;

    const waveAvailable = isTrackAvailable(SoundEditorTrackType.WAVE, soundData.tracks);
    const sweepModAvailable = isTrackAvailable(SoundEditorTrackType.SWEEPMOD, soundData.tracks);
    const noiseAvailable = isTrackAvailable(SoundEditorTrackType.NOISE, soundData.tracks);

    const onEnter = (e: React.KeyboardEvent, fn: () => void): void => {
        if (e.key === 'Enter') {
            fn();
        }
    };

    const addTrack = (trackType: SoundEditorTrackType | string): void => {
        if (trackType === ALL_TRACK_TYPES) {
            doAddTracks([
                SoundEditorTrackType.WAVE,
                SoundEditorTrackType.WAVE,
                SoundEditorTrackType.WAVE,
                SoundEditorTrackType.WAVE,
                SoundEditorTrackType.SWEEPMOD,
                SoundEditorTrackType.NOISE
            ]);
        } else {
            doAddTracks([
                trackType as SoundEditorTrackType
            ]);
        }
    };

    const doAddTracks = async (trackTypes: SoundEditorTrackType[]): Promise<void> => {
        const schema = await window.electronVesCore.dereferenceJsonSchema(SoundType.schema);
        if (!schema?.properties?.tracks?.items) {
            return;
        }
        const newTrackData = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.tracks?.items);
        if (!newTrackData) {
            return;
        }

        const updatedTracks = deepClone(soundData.tracks);
        const updatedTrackSettings = [...updatedTracks.map((track, trackId) => ({
            ...trackSettings[trackId] ?? DEFAULT_TRACK_SETTINGS,
            type: track.type,
        }))];
        trackTypes.forEach(trackType => {
            if (!isTrackAvailable(trackType, updatedTracks)) {
                return;
            }

            updatedTrackSettings.push({
                ...DEFAULT_TRACK_SETTINGS,
                type: trackType,
            });

            updatedTracks.push({
                ...newTrackData,
                type: trackType
            });
        });

        updateSoundData({
            ...soundData,
            tracks: updatedTracks.sort((a, b) => b.type.localeCompare(a.type)),
        });
        setTrackSettings(updatedTrackSettings.sort((a, b) => b.type.localeCompare(a.type)));

        setEditTrackDialogOpen(false);
        setAddTrackDialogOpen(false);
        enableCommands();
        focusEditor();
    };

    return <HContainer gap={10} wrap='wrap' overflow='auto' style={{ padding: 2 }}>
        <AllAvailable
            onClick={() => addTrack(ALL_TRACK_TYPES)}
            onKeyDown={e => onEnter(e, () => addTrack(ALL_TRACK_TYPES))}
            tabIndex={0}
            autoFocus
            onFocus={disableCommands}
            onBlur={enableCommands}
        >
            {nls.localize('vuengine/editors/sound/allAvailable', 'All available')}
        </AllAvailable>

        <StyledChannel
            className={!waveAvailable ? 'disabled' : undefined}
            disabled={!waveAvailable}
            onClick={() => {
                if (waveAvailable) {
                    addTrack(SoundEditorTrackType.WAVE);
                }
            }}
            onKeyDown={e => onEnter(e, () => {
                if (waveAvailable) {
                    addTrack(SoundEditorTrackType.WAVE);
                }
            })}
            onFocus={disableCommands}
            onBlur={enableCommands}
        >
            <VContainer justifyContent='center' grow={1}>
                <WaveSine size={48} />
            </VContainer>
            {TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE]}
        </StyledChannel>

        <StyledChannel
            className={!sweepModAvailable ? 'disabled' : undefined}
            disabled={!sweepModAvailable}
            onClick={() => {
                if (sweepModAvailable) {
                    addTrack(SoundEditorTrackType.SWEEPMOD);
                }
            }}
            onKeyDown={e => onEnter(e, () => {
                if (sweepModAvailable) {
                    addTrack(SoundEditorTrackType.SWEEPMOD);
                }
            })}
            onFocus={disableCommands}
            onBlur={enableCommands}
        >
            <VContainer justifyContent='center' grow={1}>
                <WaveTriangle size={48} />
            </VContainer>
            {TRACK_TYPE_LABELS[SoundEditorTrackType.SWEEPMOD]}
        </StyledChannel>

        <StyledChannel
            className={!noiseAvailable ? 'disabled' : undefined}
            disabled={!noiseAvailable}
            onClick={() => {
                if (noiseAvailable) {
                    addTrack(SoundEditorTrackType.NOISE);
                }
            }}
            onKeyDown={e => onEnter(e, () => {
                if (noiseAvailable) {
                    addTrack(SoundEditorTrackType.NOISE);
                }
            })}
            onFocus={disableCommands}
            onBlur={enableCommands}
        >
            <VContainer justifyContent='center' grow={1}>
                <Waveform size={48} />
            </VContainer>
            {TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE]}
        </StyledChannel>
    </HContainer>;
}
