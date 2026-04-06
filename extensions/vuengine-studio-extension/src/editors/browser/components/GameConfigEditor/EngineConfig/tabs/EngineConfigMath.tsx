import { nls } from '@theia/core';
import React from 'react';
import Input from '../../../Common/Base/Input';
import RadioSelect from '../../../Common/Base/RadioSelect';
import VContainer from '../../../Common/Base/VContainer';
import InfoLabel from '../../../Common/InfoLabel';
import {
    EngineConfigData,
    FIXED_POINT_PRECISION_DEFAULT_VALUE,
    SEED_ADD_USER_INPUT_DEFAULT_VALUE,
    SEED_CYCLES_DEFAULT_VALUE,
    SEED_CYCLES_MAX_VALUE,
    SEED_CYCLES_MIN_VALUE
} from '../EngineConfigTypes';

interface EngineConfigMathProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigMath(props: EngineConfigMathProps): React.JSX.Element {
    const { data, updateData } = props;

    const setFixedPointPrecision = (fixedPointPrecision: number): void => {
        updateData({
            ...data,
            math: {
                ...(data.math ?? {}),
                fixedPointPrecision,
            }
        });
    };

    const toggleAddUserInput = (): void => {
        updateData({
            ...data,
            random: {
                ...(data.random ?? {}),
                addUserInputAndTimeToRandomSeed: !(data.random?.addUserInputAndTimeToRandomSeed ?? SEED_ADD_USER_INPUT_DEFAULT_VALUE),
            }
        });
    };

    const setSeedCycles = (seedCycles: number): void => {
        updateData({
            ...data,
            random: {
                ...(data.random ?? {}),
                seedCycles,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/math/fixedPointPrecisionTitle', 'Fixed-Point Precision')}
                    tooltip={<>
                        <div>
                            {nls.localize(
                                'vuengine/editors/engineConfig/math/fixedPointPrecisionDescription',
                                "VUEngine uses fixed-point arithmetic to effectively represent, and work with, fractional numbers. \
That means that a fixed number of bits is used to represent a number's integral part and the remaining for the fractional part. \
Various fixed-point precision modes are supported."
                            )}
                        </div>
                        <ul>
                            <li>
                                <strong>19.13: </strong>
                                {nls.localize(
                                    'vuengine/editors/engineConfig/math/fixedPointPrecision1913Description',
                                    'Provides great precision (13 bits for fractional data) and a huge range (19 bits for integral data). \
This means thar huge stages of 2^19 (524.288) pixels in size are possible and a 1/(2^13) (1/8.192) fractional accuracy. \
However, this mode is very heavy on the CPU because divisions and multiplications are performed \
through software functions instead of CPU instructions and thus is practically not feasible.'
                                )}
                            </li>
                            <li>
                                <strong>7.9: </strong>
                                {nls.localize(
                                    'vuengine/editors/engineConfig/math/fixedPointPrecision79Description',
                                    'Reasonable fractional accuracy (1/512), but extremely low integral range, \
so stages can only be 128 pixels in width, height, and depth. Thus, this mode is not really usable.'
                                )}
                            </li>
                            <li>
                                <strong>10.6: </strong>
                                {nls.localize(
                                    'vuengine/editors/engineConfig/math/fixedPointPrecision106Description',
                                    'Good balance between stage size (8.192 pixels wide, high and deep) and reasonable fractional accuracy for most use cases (1/64).'
                                )}
                            </li>
                        </ul>
                    </>}
                />
                <RadioSelect
                    options={[{
                        value: 6,
                        label: '10.6',
                    }, {
                        value: 9,
                        label: '7.9',
                    }, {
                        value: 13,
                        label: '19.13',
                    }]}
                    defaultValue={data.math?.fixedPointPrecision ?? FIXED_POINT_PRECISION_DEFAULT_VALUE}
                    onChange={options => setFixedPointPrecision(options[0].value as number)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/engineConfig/math/addUserInputAndTimeToRandomSeed', 'Add User Input and Time To Random Seed')}
                </label>
                <input
                    type="checkbox"
                    checked={(data.random?.addUserInputAndTimeToRandomSeed ?? SEED_ADD_USER_INPUT_DEFAULT_VALUE)}
                    onChange={() => toggleAddUserInput()}
                />
            </VContainer>
            <Input
                label={nls.localize('vuengine/editors/engineConfig/math/randomSeedCycles', 'Random Seed Cycles')}
                type="number"
                value={data.random?.seedCycles ?? SEED_CYCLES_DEFAULT_VALUE}
                setValue={v => setSeedCycles(v as number)}
                min={SEED_CYCLES_MIN_VALUE}
                max={SEED_CYCLES_MAX_VALUE}
                defaultValue={SEED_CYCLES_DEFAULT_VALUE}
                width={66}
            />
        </VContainer>
    );
}
