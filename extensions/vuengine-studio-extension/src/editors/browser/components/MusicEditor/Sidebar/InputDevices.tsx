import React from 'react';
import VContainer from '../../Common/VContainer';
import { nls } from '@theia/core';

interface InputDevicesProps {
}

export default function InputDevices(props: InputDevicesProps): React.JSX.Element {
    // const { } = props;

    return <VContainer gap={10}>
        <label>
            {nls.localize('vuengine/musicEditor/inputDevices', 'Input Devices')}
        </label>
        <i>Not yet implemented</i>
    </VContainer>;
}
