import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { clamp } from '../../Common/Utils';
import { ArrowDown, ArrowFatDown, ArrowFatUp, ArrowUp } from '@phosphor-icons/react';

export enum TransposeScope {
    EVERYTHING = 'everything',
    TRACK = 'track',
    PATTERN = 'pattern',
}

export enum TransposeOverflowBehavior {
    CUT = 'cut',
    WRAP = 'wrap',
    BOUND = 'bound',
}

export interface TransposeOptions {
    scope: TransposeScope
    halfTones: number
    overflowBehavior: TransposeOverflowBehavior
}

export const DEFAULT_TRANSPOSE_OPTIONS: TransposeOptions = {
    scope: TransposeScope.EVERYTHING,
    overflowBehavior: TransposeOverflowBehavior.CUT,
    halfTones: 0,
};

export const TRANSPOSE_SCOPE_LABELS: { [type: string]: string } = {
    [TransposeScope.EVERYTHING]: nls.localize('vuengine/editors/sound/transposeScope/everything', 'Everything'),
    [TransposeScope.TRACK]: nls.localize('vuengine/editors/sound/transposeScope/track', 'Current Track'),
    [TransposeScope.PATTERN]: nls.localize('vuengine/editors/sound/transposeScope/pattern', 'Current Pattern'),
};

export const TRANSPOSE_OVERFLOW_BEHAVIOR_LABELS: { [type: string]: string } = {
    [TransposeOverflowBehavior.CUT]: nls.localize('vuengine/editors/sound/overflowBehavior/cut', 'Cut'),
    [TransposeOverflowBehavior.BOUND]: nls.localize('vuengine/editors/sound/overflowBehavior/bound', 'Bound'),
    [TransposeOverflowBehavior.WRAP]: nls.localize('vuengine/editors/sound/overflowBehavior/wrap', 'Wrap'),
};

interface TransposeProps {
    transposeOptions: TransposeOptions
    setTransposeOptions: Dispatch<SetStateAction<TransposeOptions>>
}

const OCTAVE_HALF_TONES = 12;
const TRANSPOSE_AMOUNT_MAX = OCTAVE_HALF_TONES * 5;
const TRANSPOSE_AMOUNT_MIN = TRANSPOSE_AMOUNT_MAX * -1;

export default function Transpose(props: TransposeProps): React.JSX.Element {
    const { transposeOptions, setTransposeOptions } = props;

    const setHalftones = (ht: number) => {
        setTransposeOptions({
            ...transposeOptions,
            halfTones: clamp(ht, TRANSPOSE_AMOUNT_MIN, TRANSPOSE_AMOUNT_MAX),
        });
    };

    return <VContainer gap={20}>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/scope', 'Scope')}
            </label>
            <RadioSelect
                defaultValue={transposeOptions.scope}
                options={Object.values(TransposeScope).map(g => ({
                    label: TRANSPOSE_SCOPE_LABELS[g],
                    value: g,
                }))}
                onChange={options => setTransposeOptions({
                    ...transposeOptions,
                    scope: options[0].value as TransposeScope
                })}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/overflowBehavior', 'Overflow Behavior')}
            </label>
            <RadioSelect
                defaultValue={transposeOptions.overflowBehavior}
                options={Object.values(TransposeOverflowBehavior).map(g => ({
                    label: TRANSPOSE_OVERFLOW_BEHAVIOR_LABELS[g],
                    value: g,
                }))}
                onChange={options => setTransposeOptions({
                    ...transposeOptions,
                    overflowBehavior: options[0].value as TransposeOverflowBehavior,
                })}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/amount', 'Amount')}
            </label>
            <HContainer>
                <Range
                    value={transposeOptions.halfTones}
                    setValue={v => setHalftones(v)}
                    min={TRANSPOSE_AMOUNT_MIN}
                    max={TRANSPOSE_AMOUNT_MAX}
                    clearable
                    containerStyle={{ flexGrow: 1 }}
                />
                <button
                    className='theia-button secondary'
                    onClick={() => setHalftones(transposeOptions.halfTones - OCTAVE_HALF_TONES)}
                    disabled={transposeOptions.halfTones <= TRANSPOSE_AMOUNT_MIN}
                    title={nls.localize('vuengine/editors/sound/upAnOctave', 'Down An Octave')}
                >
                    <ArrowFatDown size={17} />
                </button>
                <button
                    className='theia-button secondary'
                    onClick={() => setHalftones(transposeOptions.halfTones - 1)}
                    disabled={transposeOptions.halfTones <= TRANSPOSE_AMOUNT_MIN}
                    title={nls.localize('vuengine/editors/sound/upAnOctave', 'Down A Half-Tone')}
                >
                    <ArrowDown size={17} />
                </button>
                <button
                    className='theia-button secondary'
                    onClick={() => setHalftones(transposeOptions.halfTones + 1)}
                    disabled={transposeOptions.halfTones >= TRANSPOSE_AMOUNT_MAX}
                    title={nls.localize('vuengine/editors/sound/upAnOctave', 'Up A Half-Tone')}
                >
                    <ArrowUp size={17} />
                </button>
                <button
                    className='theia-button secondary'
                    onClick={() => setHalftones(transposeOptions.halfTones + OCTAVE_HALF_TONES)}
                    disabled={transposeOptions.halfTones >= TRANSPOSE_AMOUNT_MAX}
                    title={nls.localize('vuengine/editors/sound/upAnOctave', 'Up An Octave')}
                >
                    <ArrowFatUp size={17} />
                </button>
            </HContainer>
        </VContainer>
    </VContainer>;
}
