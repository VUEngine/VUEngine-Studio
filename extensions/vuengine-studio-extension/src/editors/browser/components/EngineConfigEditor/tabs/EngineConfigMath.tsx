import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import {
    EngineConfigData,
    FIXED_POINT_PRECISION_DEFAULT_VALUE,
    FIXED_POINT_PRECISION_MAX_VALUE,
    FIXED_POINT_PRECISION_MIN_VALUE,
    SEED_ADD_USER_INPUT_DEFAULT_VALUE,
    SEED_CYCLES_DEFAULT_VALUE,
    SEED_CYCLES_MAX_VALUE,
    SEED_CYCLES_MIN_VALUE
} from '../EngineConfigEditorTypes';

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
            <Input
                label={nls.localize('vuengine/editors/engineConfig/math/fixedPointPrecision', 'Fixed Point Precision')}
                type="number"
                value={data.math?.fixedPointPrecision ?? FIXED_POINT_PRECISION_DEFAULT_VALUE}
                setValue={setFixedPointPrecision}
                min={FIXED_POINT_PRECISION_MIN_VALUE}
                max={FIXED_POINT_PRECISION_MAX_VALUE}
                defaultValue={FIXED_POINT_PRECISION_DEFAULT_VALUE}
                width={66}
            />
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
                setValue={setSeedCycles}
                min={SEED_CYCLES_MIN_VALUE}
                max={SEED_CYCLES_MAX_VALUE}
                defaultValue={SEED_CYCLES_DEFAULT_VALUE}
                width={66}
            />
        </VContainer>
    );
}
