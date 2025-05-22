import { nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import WaveForm from './WaveForm';
import { WaveFormData } from './WaveFormEditorTypes';

const StyledWaveformContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 20px;
  outline: none;
`;

interface WaveFormEditorProps {
    data: WaveFormData
    updateData: (data: WaveFormData) => void
}

export default function WaveFormEditor(props: WaveFormEditorProps): React.JSX.Element {
    const { data, updateData } = props;

    const setName = (name: string) => {
        updateData({
            ...data,
            name,
        });
    };

    const setValues = (values: number[]) => {
        updateData({
            ...data,
            values,
        });
    };

    return (
        <VContainer gap={20}>
            <Input
                label={nls.localizeByDefault('Name')}
                value={data.name}
                setValue={(v => setName(v as string))}
            />
            <VContainer gap={2} grow={1}>
                <label>
                    {nls.localizeByDefault('Values')}
                </label>
                <StyledWaveformContainer tabIndex={0}>
                    <WaveForm
                        value={data.values}
                        setValue={setValues}
                    />
                </StyledWaveformContainer>
            </VContainer>
        </VContainer>
    );
}
