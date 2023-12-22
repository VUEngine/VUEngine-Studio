import { CommandService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React from 'react';
import { VesBuildService } from '../../../build/browser/ves-build-service';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import IMAGE_HYPERFLASH32_LABEL from '../../../../src/flash-cart/browser/images/hyperflash32-label.png';
import { VesFlashCartCommands } from '../ves-flash-cart-commands';
import { VesFlashCartService } from '../ves-flash-cart-service';
import { ConnectedFlashCart, FlashLogLine, HYPERFLASH32_PREFERENCE_NAME } from '../ves-flash-cart-types';
import FlashAutoQueuePreference from './FlashAutoQueuePreference';

interface ConnectedFlashCartsProps {
    commandService: CommandService
    preferenceService: PreferenceService
    vesBuildService: VesBuildService
    vesCommonService: VesCommonService
    vesFlashCartService: VesFlashCartService
    workspaceService: WorkspaceService
}

export default function ConnectedFlashCarts(props: ConnectedFlashCartsProps): React.JSX.Element {
    const {
        commandService,
        preferenceService,
        vesBuildService,
        vesCommonService,
        vesFlashCartService,
        workspaceService,
    } = props;
    const [showLog, setShowLog] = React.useState<boolean[]>([]);

    const lastBuildMode = vesBuildService.lastBuildMode;

    const toggleLog = (index: number) => {
        const updatedShowLog = [...showLog];
        updatedShowLog[index] = !showLog[index];
        setShowLog(updatedShowLog);
    };
    const flash = () => commandService.executeCommand(VesFlashCartCommands.FLASH.id);
    const abort = () => vesFlashCartService.abort();

    return <>
        <div className='flashingActions'>
            {vesFlashCartService.isQueued && (
                <>
                    <div className='flashingPanel'>
                        <i className='fa fa-fw fa-hourglass-half'></i>{' '}
                        <em>
                            {nls.localize('vuengine/flashCarts/flashingIsQueued', 'Flashing is queued and will start once the build is ready')}
                        </em>
                    </div>
                    <button
                        className='theia-button large secondary cancel'
                        onClick={flash}
                    >
                        {nls.localize('vuengine/flashCarts/cancel', 'Cancel')}
                    </button>
                </>
            )}
            {!vesFlashCartService.isQueued &&
                vesFlashCartService.flashingProgress > -1 && vesFlashCartService.flashingProgress < 100 && (
                    <div className='flashingPanel'>
                        <div className='vesProgressBar'>
                            <div style={{ width: vesFlashCartService.flashingProgress + '%' }}></div>
                            <span>
                                {vesFlashCartService.flashingProgress}%
                            </span>
                        </div>
                    </div>
                )}
            {!vesFlashCartService.isQueued && !vesFlashCartService.isFlashing && (
                <button
                    className='theia-button large flash'
                    onClick={flash}
                    disabled={!workspaceService.opened || !vesFlashCartService.atLeastOneCanHoldRom}
                >
                    {nls.localize('vuengine/flashCarts/flash', 'Flash')}
                </button>
            )}
            {vesFlashCartService.isFlashing && (
                <button
                    className='theia-button secondary abort'
                    onClick={abort}
                >
                    {nls.localize('vuengine/flashCarts/abort', 'Abort')}
                </button>
            )}
            <FlashAutoQueuePreference
                preferenceService={preferenceService}
            />
        </div>
        {lastBuildMode && lastBuildMode !== 'Release' &&
            <div className="infoPanel warning">
                <i className='fa fa-fw fa-exclamation-triangle'></i>{' '}
                {nls.localize(
                    'vuengine/flashCarts/buildModeWarning',
                    'The last build was done in {0} mode. Be warned that any mode other than Release will result in decreased performance on real hardware.',
                    lastBuildMode
                )}
            </div>
        }
        <div>
            {vesFlashCartService.connectedFlashCarts.map(
                (connectedFlashCart: ConnectedFlashCart, index: number) => (
                    <div className='flashCart' key={`flashCart${index}`}>
                        <div className='flashCartInfo'>
                            <div>
                                <h2>{connectedFlashCart.config.name}</h2>
                                <div className={!connectedFlashCart.canHoldRom ? 'warning' : ''}>
                                    <i className='fa fa-fw fa-microchip'></i>{' '}
                                    {connectedFlashCart.config.size} MBit<br />
                                    ({connectedFlashCart.config.padRom
                                        ? 'Padding Enabled'
                                        : 'Padding Disabled'})
                                </div>
                                <div>
                                    <i className='fa fa-fw fa-usb'></i>{' '}
                                    {connectedFlashCart.deviceCodes.vid}:
                                    {connectedFlashCart.deviceCodes.pid}<br />
                                    {connectedFlashCart.deviceCodes.manufacturer}<br />
                                    {connectedFlashCart.deviceCodes.product}<br />
                                    {connectedFlashCart.port}
                                </div>
                                <div>
                                    <i className='fa fa-fw fa-terminal'></i>{' '}
                                    {vesCommonService.basename(connectedFlashCart.config.path)}{' '}
                                    {connectedFlashCart.config.args}
                                </div>
                                {!connectedFlashCart.canHoldRom &&
                                    <div className="infoPanel warning">
                                        <i className='fa fa-fw fa-exclamation-triangle'></i>{' '}
                                        {nls.localize('vuengine/flashCarts/insufficientSpaceToHoldRom', 'Insufficient space to hold ROM')} ({
                                            vesBuildService.bytesToMbit(vesBuildService.romSize)
                                        } MBit)
                                    </div>
                                }
                                {connectedFlashCart.status.progress === 100 ? (
                                    <div className='infoPanel success'>
                                        <i className='fa fa-fw fa-check'></i> {nls.localize('vuengine/flashCarts/done', 'Done')}
                                    </div>
                                ) : connectedFlashCart.status.progress > -1 ? (
                                    <div className='infoPanel'>
                                        <i className='fa fa-fw fa-cog fa-spin'></i>{' '}
                                        {connectedFlashCart.status.step}...{' '}
                                        {connectedFlashCart.status.progress}%
                                    </div>
                                ) : <></>}
                            </div>
                            {connectedFlashCart.config.image && (
                                <div>
                                    <img
                                        src={connectedFlashCart.config.image}
                                        style={
                                            connectedFlashCart.config.name === HYPERFLASH32_PREFERENCE_NAME
                                                ? {
                                                    /* HyperFlash32 eInk label */
                                                    backgroundImage: `url(${IMAGE_HYPERFLASH32_LABEL})`,
                                                    backgroundPosition: '69% 28%',
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundSize: '76%',
                                                }
                                                : {}
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        {connectedFlashCart.status.log.length > 0 &&
                            <div className='flashLogWrapper'>
                                <button
                                    className='theia-button secondary'
                                    onClick={() => toggleLog(index)}
                                >
                                    {showLog[index] ? 'Hide Log' : 'Show Log'}
                                </button>
                                {showLog[index] && (
                                    <div className='flashLog'>
                                        <div>
                                            {connectedFlashCart.status.log.map(
                                                (line: FlashLogLine, idx: number) => (
                                                    line.text !== ''
                                                        ? <div className="flashLogLine" key={`flashLogLine${idx}`}>
                                                            <span className='timestamp'>
                                                                {new Date(line.timestamp).toTimeString().substring(0, 8)}
                                                            </span>
                                                            <span className='text'>
                                                                {line.text}
                                                            </span>
                                                        </div>
                                                        : <div className='flashLogLine'></div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        }
                    </div>
                )
            )}
        </div>
    </>;
}
