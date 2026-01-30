import { nls, PreferenceService } from '@theia/core';
import React from 'react';
import { VesEmulatorPreferenceIds } from '../ves-emulator-preferences';

interface EmulatorAutoQueuePreferenceProps {
    preferenceService: PreferenceService
}

export default function EmulatorAutoQueuePreference(props: EmulatorAutoQueuePreferenceProps): React.JSX.Element {
    const { preferenceService } = props;
    const [autoQueue, setAutoQueue] = React.useState<boolean>(preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE, false));

    React.useEffect(() => {
        const preflistener = preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE) {
                setAutoQueue(props.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE) as boolean);
            }
        });
        return () => preflistener.dispose();
    }, [preferenceService]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = e.target.checked;
        preferenceService.updateValue(VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE, newChecked);
    };

    return <div className='autoQueue'>
        <label>
            <input type="checkbox" className="theia-input" onChange={handleChange} checked={autoQueue} />
            {nls.localize('vuengine/emulator/preferences/automaticallyQueue', 'Automatically queue')}
        </label>
    </div>;
}
