import { nls, PreferenceService } from '@theia/core';
import React from 'react';
import { VesFlashCartPreferenceIds } from '../ves-flash-cart-preferences';

interface FlashAutoQueuePreferenceProps {
    preferenceService: PreferenceService
}

export default function FlashAutoQueuePreference(props: FlashAutoQueuePreferenceProps): React.JSX.Element {
    const { preferenceService } = props;
    const [autoQueue, setAutoQueue] = React.useState<boolean>(preferenceService.get(VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE, false));

    React.useEffect(() => {
        const preflistener = preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE) {
                setAutoQueue(change.newValue as boolean);
            }
        });
        return () => preflistener.dispose();
    }, [preferenceService]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = e.target.checked;
        preferenceService.updateValue(VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE, newChecked);
    };

    return <div className='autoQueue'>
        <label>
            <input type="checkbox" className="theia-input" onChange={handleChange} checked={autoQueue} />
            {nls.localize('vuengine/flashCarts/preferences/automaticallyQueue', 'Automatically queue')}
        </label>
    </div>;
}
