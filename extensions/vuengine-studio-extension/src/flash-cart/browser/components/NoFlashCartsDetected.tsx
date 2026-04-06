import { CommandService, nls } from '@theia/core';
import React from 'react';
import { VesFlashCartCommands } from '../ves-flash-cart-commands';
import EmptyContainer from '../../../editors/browser/components/Common/EmptyContainer';
import { Cpu } from '@phosphor-icons/react';

interface NoFlashCartsDetectedProps {
    commandService: CommandService
}

export default function NoFlashCartsDetected(props: NoFlashCartsDetectedProps): React.JSX.Element {
    const { commandService } = props;
    const detect = () => commandService.executeCommand(VesFlashCartCommands.DETECT.id);

    return (
        <EmptyContainer
            title={nls.localize('vuengine/flashCarts/noneFound', 'No flash carts found')}
            description={nls.localize(
                'vuengine/flashCarts/connectYourFlashCarts',
                'Connect your Virtual Boy flash cart(s) to your computer via USB. You can connect, and flash to, any number of flash carts at once.'
            )}
            icon={<Cpu size={32} />}
            buttonIconCls='codicon codicon-refresh'
            buttonLabel={nls.localize('vuengine/flashCarts/commands/detectConnected', 'Detect Connected Flash Carts')}
            onClick={detect}
        />
    );
}
