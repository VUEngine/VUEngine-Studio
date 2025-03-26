import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VsuData } from '../../components/SoundEditor/Emulator/VsuTypes';
import VsuSandbox from '../../components/VsuSandbox/VsuSandbox';
import { EditorsContext } from '../../ves-editors-types';

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
