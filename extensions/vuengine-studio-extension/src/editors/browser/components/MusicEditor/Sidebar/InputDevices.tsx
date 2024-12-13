import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { nls } from '@theia/core';

interface InputDevicesProps {
}

export default function InputDevices(props: InputDevicesProps): React.JSX.Element {
    // const { } = props;

    return <VContainer gap={15}>
        <label>
            {nls.localize('vuengine/musicEditor/inputDevices', 'Input Devices')}
        </label>
        <i>Not yet implemented</i>
    </VContainer>;
}
