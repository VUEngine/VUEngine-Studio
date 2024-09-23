import { CommandService, nls } from '@theia/core';
import React from 'react';
import { VesFlashCartCommands } from '../ves-flash-cart-commands';

interface NoFlashCartsDetectedProps {
    commandService: CommandService
}

export default function NoFlashCartsDetected(props: NoFlashCartsDetectedProps): React.JSX.Element {
    const { commandService } = props;
    const detect = () => commandService.executeCommand(VesFlashCartCommands.DETECT.id);

    return <div className="theia-TreeContainer lightLabel" style={{ boxSizing: 'border-box' }}>
        <div className="theia-WelcomeView">
            <div>
                <span>{nls.localize('vuengine/flashCarts/noneFound', 'No flash carts found.')}</span>
            </div>
            <div>
                <span>
                    {nls.localize(
                        'vuengine/flashCarts/connectYourFlashCarts',
                        'Connect your Virtual Boy flash cart(s) to your computer via USB. You can connect, and flash to, any number of flash carts at once.'
                    )}
                </span>
            </div>
            <div className="theia-WelcomeViewButtonWrapper">
                <button
                    className="theia-button theia-WelcomeViewButton"
                    onClick={detect}>
                    {nls.localize('vuengine/flashCarts/commands/detectConnected', 'Detect Connected Flash Carts')}
                </button>
            </div>
        </div>
    </div>;
}
