import {
    ArrowBendRightUp,
    ArrowFatLinesUp,
    Coin,
    Crosshair,
    CursorClick,
    DiceFive,
    Fire,
    HandFist,
    LockSimple,
    LockSimpleOpen,
    Play,
    Plus,
    Shuffle,
    Stop,
    Swap,
} from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, ReactElement, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import PopUpDialog from '../../Common/Base/PopUpDialog';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import NumberArrayPreview from '../../Common/NumberArrayPreview';
import { VSU_NOISE_TAP } from '../Emulator/VsuTypes';
import { getNoteLabel } from '../ImportExport/importHelpers';
import { getTimerResolution } from '../Other/tempo';
import { SoundData, SoundEditorTrackType, TRACK_TYPE_INSTRUMENT_COMPATIBILITY, TRACK_TYPE_LABELS, WAVEFORM_MAX } from '../SoundEditorTypes';
import WaveformWithPresets from '../Waveforms/WaveformWithPresets';
import {
    createSfxPreviewSoundData,
    getMutatedSfxParams,
    getRandomSfxParams,
    getRandomWaveform,
    getSfxPresetParams,
    getSfxTicks,
    SFX_PARAM_SPECS,
    SfxLockableParam,
    SfxNumericParam,
    SfxParams,
    SfxPreset,
} from './sfxGeneration';

const PLOT_WIDTH = 418;
const PLOT_HEIGHT = 140;
const HISTORY_SIZE = 5;
const RANDOM = 'random';
// how long to wait for the emulator to report that the preview started, before giving up on it
const PREVIEW_START_TIMEOUT_MS = 3000;
// how long the emulator keeps running after the preview's end. What it emulates gets heard only after the audio it has buffered,
// and the audio context has to start up first when the emulator wakes up, so stopping it right away would cut the sound off.
const PREVIEW_TAIL_MS = 600;

const BorderedVContainer = styled(VContainer)`
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    padding: 10px;
`;

const StyledPresets = styled.div`
    display: grid;
    gap: 4px;
    grid-template-columns: repeat(4, minmax(0, 1fr));

    button {
        flex-direction: column;
        gap: 4px;
        height: 56px;
        margin: 0;
        min-width: 0;
        padding: 0;
    }

    button.selected {
        outline: 1px solid var(--theia-editor-foreground);
        outline-offset: -1px;
    }
`;

const StyledParam = styled.div`
    align-items: center;
    display: flex;
    gap: 8px;

    > label {
        flex: 0 0 96px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    > div {
        flex-grow: 1;
        min-width: 0;
    }

    /* the sliders' handles stack within their slider only, so that they stay below the footer and open dropdowns */
    input[type="range"] {
        isolation: isolate;
    }
`;

const StyledLockButton = styled.button`
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 2px;
    color: var(--theia-editor-foreground);
    cursor: pointer;
    display: flex;
    flex: 0 0 24px;
    height: 24px;
    justify-content: center;
    padding: 0;

    svg {
        opacity: .3;
    }

    &:hover svg,
    &.locked svg {
        opacity: 1;
    }
`;

const StyledPlot = styled.svg`
    background: var(--theia-editor-background);
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    display: block;
    height: auto;
    width: 100%;
`;

const StyledHint = styled.div`
    color: var(--theia-descriptionForeground);
    font-size: 90%;
`;

const StyledLegend = styled.div`
    align-items: center;
    color: var(--theia-descriptionForeground);
    display: flex;
    font-size: 90%;
    gap: 12px;

    span {
        align-items: center;
        display: inline-flex;
        gap: 5px;
    }

    i {
        background-color: var(--theia-button-background);
        display: inline-block;
        height: 2px;
        width: 12px;
    }

    i.area {
        height: 10px;
        opacity: .3;
        width: 10px;
    }
`;

// stays at the bottom of the sidebar while the rest scrolls
const StyledFooter = styled(VContainer)`
    background-color: var(--theia-editor-background);
    border-top: 1px solid var(--theia-dropdown-border);
    bottom: 0;
    padding-top: var(--padding);
    position: sticky;
    z-index: 1;
`;

export interface SfxHistoryEntry {
    label: string
    params: SfxParams
}

export interface SfxGeneratorState {
    params: SfxParams
    locks: Partial<Record<SfxLockableParam, boolean>>
    history: SfxHistoryEntry[]
    historyIndex: number
    preset: SfxPreset | typeof RANDOM | undefined
    playOnChange: boolean
}

export const DEFAULT_SFX_GENERATOR_STATE: SfxGeneratorState = {
    params: getSfxPresetParams(SfxPreset.Laser),
    locks: {},
    history: [],
    historyIndex: -1,
    preset: SfxPreset.Laser,
    playOnChange: true,
};

const PRESET_BUTTONS: { preset: SfxPreset | typeof RANDOM, label: string, icon: ReactElement }[] = [
    { preset: SfxPreset.Pickup, label: nls.localize('vuengine/editors/sound/sfxGenerator/pickup', 'Pickup'), icon: <Coin size={22} /> },
    { preset: SfxPreset.Laser, label: nls.localize('vuengine/editors/sound/sfxGenerator/laser', 'Laser'), icon: <Crosshair size={22} /> },
    { preset: SfxPreset.Explosion, label: nls.localize('vuengine/editors/sound/sfxGenerator/explosion', 'Explosion'), icon: <Fire size={22} /> },
    { preset: SfxPreset.PowerUp, label: nls.localize('vuengine/editors/sound/sfxGenerator/powerUp', 'Power-up'), icon: <ArrowFatLinesUp size={22} /> },
    { preset: SfxPreset.Hit, label: nls.localize('vuengine/editors/sound/sfxGenerator/hit', 'Hit'), icon: <HandFist size={22} /> },
    { preset: SfxPreset.Jump, label: nls.localize('vuengine/editors/sound/sfxGenerator/jump', 'Jump'), icon: <ArrowBendRightUp size={22} /> },
    { preset: SfxPreset.Blip, label: nls.localize('vuengine/editors/sound/sfxGenerator/blip', 'Blip'), icon: <CursorClick size={22} /> },
    { preset: RANDOM, label: nls.localize('vuengine/editors/sound/sfxGenerator/random', 'Random'), icon: <DiceFive size={22} /> },
];

const PARAM_LABELS: Record<SfxNumericParam, { label: string, unit?: string }> = {
    attack: { label: nls.localize('vuengine/editors/sound/sfxGenerator/attack', 'Attack'), unit: 'ms' },
    sustain: { label: nls.localize('vuengine/editors/sound/sfxGenerator/sustain', 'Sustain'), unit: 'ms' },
    punch: { label: nls.localize('vuengine/editors/sound/sfxGenerator/punch', 'Punch'), unit: '%' },
    decay: { label: nls.localize('vuengine/editors/sound/sfxGenerator/decay', 'Decay'), unit: 'ms' },
    start: { label: nls.localize('vuengine/editors/sound/sfxGenerator/startNote', 'Start Note') },
    slide: { label: nls.localize('vuengine/editors/sound/sfxGenerator/slide', 'Slide'), unit: 'st/s' },
    slideChange: { label: nls.localize('vuengine/editors/sound/sfxGenerator/slideChange', 'Slide Change'), unit: 'st/s²' },
    stopBelow: { label: nls.localize('vuengine/editors/sound/sfxGenerator/stopBelow', 'Stop Below') },
    vibratoDepth: { label: nls.localize('vuengine/editors/sound/sfxGenerator/depth', 'Depth'), unit: 'st' },
    vibratoSpeed: { label: nls.localize('vuengine/editors/sound/sfxGenerator/speed', 'Speed'), unit: 'Hz' },
    arpeggioJump: { label: nls.localize('vuengine/editors/sound/sfxGenerator/jump', 'Jump'), unit: 'st' },
    arpeggioAfter: { label: nls.localize('vuengine/editors/sound/sfxGenerator/after', 'After'), unit: 'ms' },
    repeat: { label: nls.localize('vuengine/editors/sound/sfxGenerator/repeat', 'Repeat'), unit: 'ms' },
    volume: { label: nls.localize('vuengine/editors/sound/volume', 'Volume'), unit: '%' },
};

const getNoteOptions = (offLabel?: string) => {
    const spec = offLabel ? SFX_PARAM_SPECS.stopBelow : SFX_PARAM_SPECS.start;
    return [...Array(spec.max - spec.min + 1)].map((_, i) => ({
        value: spec.min + i,
        label: offLabel && i === 0 ? offLabel : getNoteLabel(spec.min + i),
    }));
};
const START_NOTE_OPTIONS = getNoteOptions();
const STOP_BELOW_OPTIONS = getNoteOptions(nls.localize('vuengine/editors/sound/sfxGenerator/off', 'Off'));

interface SfxGeneratorProps {
    soundData: SoundData
    currentTrackId: number
    state: SfxGeneratorState
    setState: Dispatch<SetStateAction<SfxGeneratorState>>
    setPreviewSoundData: (soundData: SoundData | undefined) => void
    insertSfx: (params: SfxParams, name: string, replace: boolean) => void
    emulatorInitialized: boolean
    // counts up whenever a preview has started playing
    previewStarts: number
}

export default function SfxGenerator(props: SfxGeneratorProps): React.JSX.Element {
    const { soundData, currentTrackId, state, setState, setPreviewSoundData, insertSfx, emulatorInitialized, previewStarts } = props;
    const { disableCommands, enableCommands, focusEditor } = useContext(EditorsContext) as EditorsContextType;
    const { params, locks, history, historyIndex, preset, playOnChange } = state;
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<boolean>(false);
    const [playProgress, setPlayProgress] = useState<number>(-1);
    const playCount = useRef<number>(0);
    const stopTimeout = useRef<ReturnType<typeof setTimeout>>();
    const animationFrame = useRef<number>(0);
    // the length of the preview that has been sent to the emulator last, each report of a preview that started restarts the
    // playhead with it, so that the last report, which is the last preview's, counts
    const pendingPreviewMs = useRef<number | undefined>();

    const tickMs = getTimerResolution(soundData);
    const ticks = useMemo(() => getSfxTicks(params, tickMs), [params, tickMs]);
    const durationMs = ticks.length * tickMs;
    const currentTrack = soundData.tracks[currentTrackId];
    const fitsCurrentTrack = currentTrack !== undefined
        && TRACK_TYPE_INSTRUMENT_COMPATIBILITY[currentTrack.type].includes(params.type);

    const stop = (): void => {
        clearTimeout(stopTimeout.current);
        cancelAnimationFrame(animationFrame.current);
        pendingPreviewMs.current = undefined;
        setPlayProgress(-1);
        setPreviewSoundData(undefined);
    };

    const play = (playedParams: SfxParams): void => {
        if (!emulatorInitialized) {
            return;
        }
        clearTimeout(stopTimeout.current);
        cancelAnimationFrame(animationFrame.current);
        // a new name for every time it plays, so the same sound plays again
        playCount.current++;
        setPreviewSoundData(createSfxPreviewSoundData(soundData, playedParams, `SFX ${playCount.current}`));
        setPlayProgress(0);
        // the playhead runs and the preview ends once the emulator has started it, which takes a moment, as it might have to
        // wake up first
        pendingPreviewMs.current = getSfxTicks(playedParams, tickMs).length * tickMs;
        stopTimeout.current = setTimeout(stop, PREVIEW_START_TIMEOUT_MS);
    };

    useEffect(() => {
        const playedMs = pendingPreviewMs.current;
        if (playedMs === undefined) {
            return;
        }
        clearTimeout(stopTimeout.current);
        cancelAnimationFrame(animationFrame.current);
        const startTime = performance.now();
        const animate = () => {
            const progress = (performance.now() - startTime) / playedMs;
            if (progress < 1) {
                setPlayProgress(progress);
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                setPlayProgress(-1);
            }
        };
        animate();
        stopTimeout.current = setTimeout(stop, playedMs + PREVIEW_TAIL_MS);
    }, [previewStarts]);

    useEffect(() => () => stop(), []);

    const setParams = (updatedParams: SfxParams, label?: string, updatedPreset?: SfxPreset | typeof RANDOM): void => {
        setState(previous => {
            const updatedHistory = label !== undefined
                ? [{ label, params: updatedParams }, ...previous.history].slice(0, HISTORY_SIZE)
                : previous.history;
            return {
                ...previous,
                params: updatedParams,
                history: updatedHistory,
                historyIndex: label !== undefined ? 0 : -1,
                preset: updatedPreset,
            };
        });
        if (playOnChange) {
            play(updatedParams);
        }
    };

    const setParam = (param: keyof SfxParams, value: SfxParams[keyof SfxParams]): void =>
        setParams({ ...params, [param]: value });

    const toggleLock = (param: SfxLockableParam): void =>
        setState(previous => ({ ...previous, locks: { ...previous.locks, [param]: !previous.locks[param] } }));

    const applyPreset = (selected: SfxPreset | typeof RANDOM, label: string): void => {
        if (selected === RANDOM) {
            setParams(getRandomSfxParams(params, locks), label, RANDOM);
        } else {
            setParams(getSfxPresetParams(selected), label, selected);
        }
    };

    const mutate = (): void => {
        const baseLabel = (history[historyIndex]?.label ?? nls.localize('vuengine/editors/sound/sfxGenerator/sound', 'Sound')).replace(/ ~$/, '');
        setParams(getMutatedSfxParams(params, locks), `${baseLabel} ~`);
    };

    const selectHistoryEntry = (index: number): void => {
        setState(previous => ({ ...previous, params: previous.history[index].params, historyIndex: index, preset: undefined }));
        if (playOnChange) {
            play(history[index].params);
        }
    };

    const getLockButton = (param: SfxLockableParam, label: string): ReactElement =>
        <StyledLockButton
            className={locks[param] ? 'locked' : undefined}
            onClick={() => toggleLock(param)}
            title={nls.localize('vuengine/editors/sound/sfxGenerator/lockDescription', 'Keep when randomizing or mutating')}
            aria-label={label}
            aria-pressed={!!locks[param]}
        >
            {locks[param] ? <LockSimple size={16} /> : <LockSimpleOpen size={16} />}
        </StyledLockButton>;

    const getParam = (param: SfxNumericParam): ReactElement => {
        const spec = SFX_PARAM_SPECS[param];
        const { label, unit } = PARAM_LABELS[param];
        const noteOptions = param === 'start' ? START_NOTE_OPTIONS : param === 'stopBelow' ? STOP_BELOW_OPTIONS : undefined;
        return <StyledParam key={param}>
            <InfoLabel label={label} subLabel={unit} />
            <Range
                value={params[param]}
                min={spec.min}
                max={spec.max}
                step={spec.step}
                options={noteOptions}
                selectWidth={noteOptions ? 72 : undefined}
                setValue={v => setParam(param, v)}
            />
            {getLockButton(param, label)}
        </StyledParam>;
    };

    // the pitch as a line and the volume as an area, over the sound's length
    const plot = useMemo(() => {
        const x = (tick: number) => Math.round(tick * PLOT_WIDTH / ticks.length * 10) / 10;
        const y = (pitch: number) => Math.round((PLOT_HEIGHT - 8 - (pitch - SFX_PARAM_SPECS.start.min) /
            (SFX_PARAM_SPECS.start.max - SFX_PARAM_SPECS.start.min) * (PLOT_HEIGHT - 16)) * 10) / 10;
        let pitchPath = '';
        let volumePath = `M0 ${PLOT_HEIGHT}`;
        let drawing = false;
        ticks.forEach((tick, i) => {
            if (tick.level === 0) {
                drawing = false;
            } else if (!drawing || tick.restart) {
                pitchPath += `M${x(i)} ${y(tick.pitch)}H${x(i + 1)}`;
                drawing = true;
            } else {
                pitchPath += `V${y(tick.pitch)}H${x(i + 1)}`;
            }
            volumePath += `V${Math.round(PLOT_HEIGHT - tick.level / 15 * (PLOT_HEIGHT - 20))}H${x(i + 1)}`;
        });
        volumePath += `V${PLOT_HEIGHT}Z`;
        return { pitchPath, volumePath };
    }, [ticks]);

    return <VContainer gap="var(--padding)">
        <BorderedVContainer gap={8}>
            <InfoLabel
                label={nls.localize('vuengine/editors/sound/presets', 'Presets')}
                tooltip={nls.localize(
                    'vuengine/editors/sound/sfxGenerator/presetsDescription',
                    'Presets set all values. Random and Mutate keep the values you have locked.'
                )}
            />
            <StyledPresets>
                {PRESET_BUTTONS.map(b =>
                    <button
                        key={b.preset}
                        className={`theia-button secondary${preset === b.preset ? ' selected' : ''}`}
                        onClick={() => applyPreset(b.preset, b.label)}
                    >
                        {b.icon}
                        {b.label}
                    </button>
                )}
            </StyledPresets>
            <HContainer alignItems="center">
                <VContainer grow={1} overflow="hidden">
                    {history.length > 0 &&
                        <RadioSelect
                            options={history.map((h, i) => ({ value: i, label: h.label }))}
                            defaultValue={historyIndex}
                            onChange={options => selectHistoryEntry(options[0].value as number)}
                            fitSpace
                        />
                    }
                </VContainer>
                <button
                    className="theia-button secondary"
                    onClick={mutate}
                    title={nls.localize('vuengine/editors/sound/sfxGenerator/mutateDescription', 'Changes all values that are not locked a little')}
                >
                    <Shuffle size={16} />
                    {nls.localize('vuengine/editors/sound/sfxGenerator/mutate', 'Mutate')}
                </button>
            </HContainer>
        </BorderedVContainer>

        <BorderedVContainer gap={8}>
            <HContainer justifyContent="space-between">
                <label>{nls.localize('vuengine/editors/sound/sfxGenerator/preview', 'Preview')}</label>
                <span className="lightLabel">{durationMs} ms</span>
            </HContainer>
            <StyledPlot viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} width={PLOT_WIDTH} height={PLOT_HEIGHT}>
                <path d={plot.volumePath} fill="var(--theia-button-background)" fillOpacity={0.3} />
                <path d={plot.pitchPath} fill="none" stroke="var(--theia-button-background)" strokeWidth={1.6} />
                {playProgress >= 0 &&
                    <line
                        x1={playProgress * PLOT_WIDTH}
                        x2={playProgress * PLOT_WIDTH}
                        y1={0}
                        y2={PLOT_HEIGHT}
                        stroke="var(--theia-editor-foreground)"
                    />
                }
            </StyledPlot>
            <StyledLegend>
                <span>
                    <i />
                    {nls.localize('vuengine/editors/sound/sfxGenerator/pitch', 'Pitch')}
                </span>
                <span>
                    <i className="area" />
                    {nls.localize('vuengine/editors/sound/volume', 'Volume')}
                </span>
            </StyledLegend>
            <HContainer alignItems="center" gap={12}>
                <button
                    className="theia-button secondary"
                    onClick={() => playProgress >= 0 ? stop() : play(params)}
                    disabled={!emulatorInitialized}
                >
                    {playProgress >= 0 ? <Stop size={16} /> : <Play size={16} />}
                    {playProgress >= 0
                        ? nls.localizeByDefault('Stop')
                        : nls.localize('vuengine/editors/sound/sfxGenerator/play', 'Play')}
                </button>
                <Checkbox
                    checked={playOnChange}
                    setChecked={checked => setState(previous => ({ ...previous, playOnChange: checked }))}
                    sideLabel={nls.localize('vuengine/editors/sound/sfxGenerator/playOnChange', 'Play on change')}
                />
            </HContainer>
        </BorderedVContainer>

        <BorderedVContainer gap={8}>
            <label>{nls.localize('vuengine/editors/sound/sfxGenerator/channel', 'Channel')}</label>
            <RadioSelect
                options={[
                    { value: SoundEditorTrackType.WAVE, label: TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE] },
                    { value: SoundEditorTrackType.NOISE, label: TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE] },
                ]}
                defaultValue={params.type}
                onChange={options => setParam('type', options[0].value as SoundEditorTrackType)}
                fitSpace
            />
        </BorderedVContainer>

        {params.type === SoundEditorTrackType.NOISE
            ? <BorderedVContainer gap={8}>
                <InfoLabel
                    label={nls.localize('vuengine/editors/sound/tapLocation', 'Tap Location')}
                    tooltip={nls.localize(
                        'vuengine/editors/sound/tapDescription',
                        'Specifies the bit within the shift register to use as the feedback source in noise generation. \
Different bits will produce pseudorandom bit sequences of different lengths before the sequences repeat.'
                    )}
                />
                <AdvancedSelect
                    options={Object.keys(VSU_NOISE_TAP).map((tl, i) => ({
                        label: `${nls.localize('vuengine/editors/sound/bit', 'Bit')} ${VSU_NOISE_TAP[i][0]}, ` +
                            `${nls.localize('vuengine/editors/sound/sequenceLength', 'Sequence Length')}: ${VSU_NOISE_TAP[i][1]}`,
                        value: i.toString(),
                    }))}
                    defaultValue={params.tap.toString()}
                    onChange={options => setParam('tap', parseInt(options[0]))}
                />
            </BorderedVContainer>
            : <BorderedVContainer gap={8}>
                <HContainer alignItems="center" justifyContent="space-between">
                    <label>{nls.localize('vuengine/editors/sound/waveform', 'Waveform')}</label>
                    {getLockButton('waveform', nls.localize('vuengine/editors/sound/waveform', 'Waveform'))}
                </HContainer>
                <HContainer alignItems="end">
                    <NumberArrayPreview
                        active={true}
                        height={WAVEFORM_MAX * 2}
                        width={WAVEFORM_MAX * 4}
                        maximum={WAVEFORM_MAX}
                        data={params.waveform}
                        onClick={() => {
                            disableCommands();
                            setWaveformDialogOpen(true);
                        }}
                    />
                    <button
                        className="theia-button secondary"
                        onClick={() => setParam('waveform', getRandomWaveform())}
                    >
                        <DiceFive size={16} />
                        {nls.localize('vuengine/editors/sound/sfxGenerator/randomize', 'Randomize')}
                    </button>
                </HContainer>
            </BorderedVContainer>
        }

        <BorderedVContainer gap={6}>
            <label>{nls.localize('vuengine/editors/sound/sfxGenerator/envelope', 'Envelope')}</label>
            {(['attack', 'sustain', 'punch', 'decay'] as SfxNumericParam[]).map(getParam)}
        </BorderedVContainer>

        <BorderedVContainer gap={6}>
            <label>{nls.localize('vuengine/editors/sound/sfxGenerator/pitch', 'Pitch')}</label>
            {(['start', 'slide', 'slideChange', 'stopBelow'] as SfxNumericParam[]).map(getParam)}
        </BorderedVContainer>

        <BorderedVContainer gap={6}>
            <label>{nls.localize('vuengine/editors/sound/sfxGenerator/vibrato', 'Vibrato')}</label>
            {(['vibratoDepth', 'vibratoSpeed'] as SfxNumericParam[]).map(getParam)}
        </BorderedVContainer>

        <BorderedVContainer gap={6}>
            <label>{nls.localize('vuengine/editors/sound/sfxGenerator/arpeggio', 'Arpeggio')}</label>
            {(['arpeggioJump', 'arpeggioAfter'] as SfxNumericParam[]).map(getParam)}
        </BorderedVContainer>

        <BorderedVContainer gap={6}>
            <label>{nls.localize('vuengine/editors/sound/sfxGenerator/repeatAndVolume', 'Repeat & Volume')}</label>
            {(['repeat', 'volume'] as SfxNumericParam[]).map(getParam)}
        </BorderedVContainer>

        <StyledFooter gap={6}>
            <HContainer wrap="wrap">
                <button
                    className="theia-button"
                    onClick={() => insertSfx(params, history[historyIndex]?.label ?? 'SFX', false)}
                    disabled={!fitsCurrentTrack}
                >
                    <Plus size={16} />
                    {nls.localize('vuengine/editors/sound/sfxGenerator/insertAtCursor', 'Insert at Cursor')}
                </button>
                <button
                    className="theia-button secondary"
                    onClick={() => insertSfx(params, history[historyIndex]?.label ?? 'SFX', true)}
                    disabled={!fitsCurrentTrack}
                >
                    <Swap size={16} />
                    {nls.localize('vuengine/editors/sound/sfxGenerator/replaceTrack', 'Replace Track')}
                </button>
            </HContainer>
            <StyledHint>
                {fitsCurrentTrack
                    ? nls.localize(
                        'vuengine/editors/sound/sfxGenerator/insertDescription',
                        'Writes notes, note slides and volume events to the current track, with a new instrument for the waveform.'
                    )
                    : nls.localize(
                        'vuengine/editors/sound/sfxGenerator/trackTypeMismatch',
                        'The current track can not play this channel\'s sounds.'
                    )}
            </StyledHint>
        </StyledFooter>

        {waveformDialogOpen &&
            <PopUpDialog
                open={waveformDialogOpen}
                onClose={() => {
                    setWaveformDialogOpen(false);
                    enableCommands();
                    focusEditor();
                }}
                onOk={() => {
                    setWaveformDialogOpen(false);
                    enableCommands();
                    focusEditor();
                }}
                title={nls.localize('vuengine/editors/sound/editWaveform', 'Edit Waveform')}
                height='100%'
                width='100%'
                maxWidth='1600px'
            >
                <WaveformWithPresets
                    value={params.waveform}
                    setValue={value => setParam('waveform', value)}
                />
            </PopUpDialog>
        }
    </VContainer>;
}
