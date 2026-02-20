import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { clamp } from '../../Common/Utils';

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
                <button
                    className='theia-button secondary'
                    onClick={() => setTransposeOptions({
                        ...transposeOptions,
                        halfTones: clamp(transposeOptions.halfTones - OCTAVE_HALF_TONES, TRANSPOSE_AMOUNT_MIN, TRANSPOSE_AMOUNT_MAX)
                    })}
                    disabled={transposeOptions.halfTones <= TRANSPOSE_AMOUNT_MIN}
                >
                    - {nls.localize('vuengine/editors/sound/octave', 'Octave')}
                </button>
                <Range
                    value={transposeOptions.halfTones}
                    setValue={v => setTransposeOptions({
                        ...transposeOptions,
                        halfTones: clamp(v, TRANSPOSE_AMOUNT_MIN, TRANSPOSE_AMOUNT_MAX),
                    })}
                    min={TRANSPOSE_AMOUNT_MIN}
                    max={TRANSPOSE_AMOUNT_MAX}
                    clearable
                    containerStyle={{ flexGrow: 1 }}
                />
                <button
                    className='theia-button secondary'
                    onClick={() => setTransposeOptions({
                        ...transposeOptions,
                        halfTones: clamp(transposeOptions.halfTones + OCTAVE_HALF_TONES, TRANSPOSE_AMOUNT_MIN, TRANSPOSE_AMOUNT_MAX)
                    })}
                    disabled={transposeOptions.halfTones >= TRANSPOSE_AMOUNT_MAX}
                >
                    + {nls.localize('vuengine/editors/sound/octave', 'Octave')}
                </button>
            </HContainer>
        </VContainer>
    </VContainer>;
}
