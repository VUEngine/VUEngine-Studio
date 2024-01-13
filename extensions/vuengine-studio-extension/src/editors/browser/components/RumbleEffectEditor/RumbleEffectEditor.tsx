import { nls } from '@theia/core';
import React from 'react';
import { VesRumblePackCommands } from '../../../../rumble-pack/browser/ves-rumble-pack-commands';
import { RumblePakLogLine } from '../../../../rumble-pack/browser/ves-rumble-pack-types';
import { EditorsContextType } from '../../ves-editors-types';
import { BUILT_IN_EFFECTS, RumbleEffectData, RumbleEffectFrequency } from './RumbleEffectTypes';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import VContainer from '../Common/VContainer';
import HContainer from '../Common/HContainer';

interface RumbleEffectProps {
    data: RumbleEffectData
    updateData: (data: RumbleEffectData) => void
    context: EditorsContextType
}

interface RumbleEffectState {
    command: string
}

export default class RumbleEffectEditor extends React.Component<RumbleEffectProps, RumbleEffectState> {
    constructor(props: RumbleEffectProps) {
        super(props);
        this.state = {
            command: ''
        };

        const { services } = this.props.context;
        services.vesRumblePackService.onDidChangeConnectedRumblePack(() => this.forceUpdate());
        services.vesRumblePackService.onDidChangeRumblePackLog(() => this.forceUpdate());
    }

    protected rumblePakLogLineLastElementRef = React.createRef<HTMLDivElement>();

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            name: e.target.value
        });
    }

    protected setEffect = (effect: number) => {
        this.props.updateData({
            ...this.props.data,
            effect: effect,
        });
    };

    protected setFrequency = (frequency: RumbleEffectFrequency) => {
        this.props.updateData({
            ...this.props.data,
            frequency: frequency,
        });
    };

    protected toggleStopBeforeStarting = () => {
        this.props.updateData({
            ...this.props.data,
            stopBeforeStarting: !this.props.data.stopBeforeStarting,
        });
    };

    protected playEffect = () => {
        const { services } = this.props.context;
        const data = this.props.data;
        const service = services.vesRumblePackService;

        let frequency = 0;
        switch (data.frequency) {
            case 160: frequency = 0; break;
            case 240: frequency = 1; break;
            case 320: frequency = 2; break;
            case 400: frequency = 3; break;
            case 50: frequency = 4; break;
            case 95: frequency = 5; break;
            case 135: frequency = 6; break;
        }

        services.vesRumblePackService.sendCommandSetFrequency(frequency);
        service.sendCommandPlayEffect(data.effect);
    };

    protected detect = () => this.props.context.services.commandService.executeCommand(VesRumblePackCommands.DETECT.id);
    protected sendCommand = () => this.props.context.services.vesRumblePackService.sendCommand(this.state.command);
    protected sendCommandPrintMenu = () => this.props.context.services.vesRumblePackService.sendCommandPrintMenu();
    protected sendCommandPrintVersion = () => this.props.context.services.vesRumblePackService.sendCommandPrintVersion();
    protected sendCommandPlayLastEffect = () => this.props.context.services.vesRumblePackService.sendCommandPlayLastEffect();
    protected sendCommandStopCurrentEffect = () => this.props.context.services.vesRumblePackService.sendCommandStopCurrentEffect();
    protected clearLog = () => this.props.context.services.vesRumblePackService.rumblePackLog = [];

    render(): React.JSX.Element {
        const { services } = this.props.context;
        const { data } = this.props;
        const { command } = this.state;

        const rumblePackIsConnected = services.vesRumblePackService.connectedRumblePack !== undefined;
        this.rumblePakLogLineLastElementRef.current?.scrollIntoView();

        return <VContainer className='rumbleEffectEditor' gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/rumbleEffectEditor/name', 'Name')}
                </label>
                <input
                    className="theia-input large"
                    value={data.name}
                    onChange={this.onChangeName.bind(this)}
                />
            </VContainer>
            <HContainer gap={15}>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/effect', 'Effect')}
                    </label>
                    <SelectComponent
                        defaultValue={data.effect}
                        options={BUILT_IN_EFFECTS.map((value, index) => ({
                            label: value,
                            value: index.toString(),
                        }))}
                        onChange={option => this.setEffect(option.value ? parseInt(option.value) : 1)}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/frequency', 'Frequency')}
                    </label>
                    <SelectComponent
                        defaultValue={data.frequency.toString()}
                        options={[50, 95, 135, 160, 240, 320, 400].map(f => ({
                            label: `${f} Hz`,
                            value: f.toString(),
                        }))}
                        onChange={option => this.setFrequency(option.value ? parseInt(option.value) as RumbleEffectFrequency : 160)}
                    />
                </VContainer>
            </HContainer>
            <VContainer>
                <label>
                    <input
                        type="checkbox"
                        checked={data.stopBeforeStarting}
                        onChange={this.toggleStopBeforeStarting}
                    />
                    {nls.localize('vuengine/rumbleEffectEditor/stopBeforeStarting', 'Stop before starting')}
                </label>
            </VContainer>
            <VContainer className="connectionStatus">
                {nls.localize('vuengine/rumbleEffectEditor/rumbleEffectEditorConnectionStatus', 'Rumble Pack connection status')}: {
                    rumblePackIsConnected
                        ? <span className='connected'>{nls.localize('vuengine/rumbleEffectEditor/connected', 'Connected')}</span>
                        : <span className='disconnected'>{nls.localize('vuengine/rumbleEffectEditor/disconnected', 'Disconnected')}</span>
                }
            </VContainer>
            {rumblePackIsConnected
                ? <>
                    <HContainer gap={15}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/rumbleEffectEditor/actions', 'Actions')}
                            </label>
                            <HContainer>
                                <button
                                    className="theia-button"
                                    title={nls.localize('vuengine/rumbleEffectEditor/runEffect', 'Run effect')}
                                    onClick={this.playEffect}
                                    disabled={!rumblePackIsConnected}
                                >
                                    <i className="fa fa-play"></i>
                                </button>
                                <button
                                    className="theia-button secondary"
                                    title={nls.localize('vuengine/rumbleEffectEditor/reRunLastEffect', 'Re-run last effect')}
                                    onClick={this.sendCommandPlayLastEffect}
                                    disabled={!rumblePackIsConnected}
                                >
                                    <i className="fa fa-repeat"></i>
                                </button>
                                <button
                                    className="theia-button secondary"
                                    title={nls.localize('vuengine/rumbleEffectEditor/stopCurrentEffect', 'Stop current effect')}
                                    onClick={this.sendCommandStopCurrentEffect}
                                    disabled={!rumblePackIsConnected}
                                >
                                    <i className="fa fa-stop"></i>
                                </button>
                            </HContainer>
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/rumbleEffectEditor/printCommands', 'Print Commands')}
                            </label>
                            <HContainer>
                                <button
                                    className="theia-button secondary"
                                    onClick={this.sendCommandPrintMenu}
                                    disabled={!rumblePackIsConnected}
                                >
                                    {nls.localize('vuengine/rumbleEffectEditor/menu', 'Menu')}
                                </button>
                                <button
                                    className="theia-button secondary"
                                    onClick={this.sendCommandPrintVersion}
                                    disabled={!rumblePackIsConnected}
                                >
                                    {nls.localize('vuengine/rumbleEffectEditor/version', 'Version')}
                                </button>
                            </HContainer>
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/rumbleEffectEditor/command', 'Command')}
                            </label>
                            <HContainer>
                                <input
                                    className="theia-input"
                                    onChange={e => this.setState({ command: e.target.value })}
                                    value={command}
                                />
                                <button
                                    className="theia-button secondary"
                                    onClick={this.sendCommand}
                                    disabled={!rumblePackIsConnected}
                                >
                                    {nls.localize('vuengine/rumbleEffectEditor/send', 'Send')}
                                </button>
                            </HContainer>
                        </VContainer>
                    </HContainer>
                    <VContainer className='log'>
                        <label>
                            {nls.localize('vuengine/rumbleEffectEditor/log', 'Log')}
                        </label>
                        <div className='rumblePakLog'>
                            <div>
                                {services.vesRumblePackService.rumblePackLog.map((line: RumblePakLogLine, index: number) => (
                                    <div className='rumblePakLogLine' key={`rumblePakLogLine${index} `}>
                                        <span>{new Date(line.timestamp).toTimeString().substring(0, 8)}</span>
                                        <span>{line.text}</span>
                                    </div>
                                ))}
                                <div ref={this.rumblePakLogLineLastElementRef} key={'rumblePakLogLineLast'}></div>
                            </div>
                        </div>
                        <button
                            className="theia-button secondary"
                            title={nls.localize('vuengine/rumbleEffectEditor/clearLog', 'Clear Log')}
                            onClick={this.clearLog}
                            disabled={!services.vesRumblePackService.rumblePackLog.length}
                        >
                            {nls.localize('vuengine/rumbleEffectEditor/clearLog', 'Clear Log')}
                        </button>
                    </VContainer>
                </>
                : <button
                    className="theia-button secondary"
                    onClick={this.detect}>
                    {nls.localize('vuengine/rumblePack/commands/detectConnected', 'Detect Connected Rumble Pack')}
                </button>}
        </VContainer>;
    }
}
