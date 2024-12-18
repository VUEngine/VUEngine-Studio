
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import VContainer from '../../components/Common/Base/VContainer';
import Palette from '../../components/Common/Palette';
import { EditorsContext } from '../../ves-editors-types';

interface VesPaletteControlProps {
    data: string;
    handleChange(path: string, value: string): void;
    path: string;
    label: string;
}

const VesPaletteControl = ({ data, handleChange, path, label }: VesPaletteControlProps) => (
    <EditorsContext.Consumer>
        {context =>
            <VContainer>
                <label>{label}</label>
                <Palette
                    value={data}
                    updateValue={(newValue: string) => {
                        if (!context.isReadonly) {
                            handleChange(path, newValue);
                        }
                    }}
                />
            </VContainer>}
    </EditorsContext.Consumer>

);

export default withJsonFormsControlProps(VesPaletteControl);
