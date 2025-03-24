import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { EditorsContext } from '../../ves-editors-types';
import VsuSandbox from '../../components/VsuSandbox/VsuSandbox';
import { VsuData } from '../../components/Emulator/VsuTypes';

interface VesVsuSandboxControlProps {
    data: VsuData;
    handleChange(path: string, value: VsuData): void;
    path: string;
}

const VesVsuSandboxControl = ({ data, handleChange, path }: VesVsuSandboxControlProps) =>
    <EditorsContext.Consumer>
        {context => <VsuSandbox
            data={data}
            updateData={(newValue: VsuData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesVsuSandboxControl);
