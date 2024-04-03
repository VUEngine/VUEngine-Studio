import { nls } from '@theia/core';
import React from 'react';
import { VesRumblePackCommands } from '../../../../rumble-pack/browser/ves-rumble-pack-commands';
import { RumblePakLogLine } from '../../../../rumble-pack/browser/ves-rumble-pack-types';
import { EditorsContextType } from '../../ves-editors-types';
import { BUILT_IN_EFFECTS, RumbleEffectData, RumbleEffectFrequency } from './RumbleEffectTypes';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import VContainer from '../Common/VContainer';
import HContainer from '../Common/HContainer';
import { clamp } from '../Common/Utils';

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

    protected setStateSustainPositive = (sustain: number) => {
        this.props.updateData({
            ...this.props.data,
            sustainPositive: clamp(sustain, 0, 255),
        });
    };

    protected setStateSustainNegative = (sustain: number) => {
        if (sustain >= 0 && sustain <= 255) {
            this.props.updateData({
                ...this.props.data,
                sustainNegative: clamp(sustain, 0, 255),
            });
        }
    };

    protected setStateOverdrive = (overdrive: number) => {
        if (overdrive >= 0 && overdrive <= 255) {
            this.props.updateData({
                ...this.props.data,
                overdrive: clamp(overdrive, 0, 255),
            });
        }
    };

    protected setStateBreak = (breakValue: number) => {
        if (breakValue >= 0 && breakValue <= 255) {
            this.props.updateData({
                ...this.props.data,
                break: clamp(breakValue, 0, 255),
            });
        }
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
            case 130: frequency = 6; break;
        }

        services.vesRumblePackService.sendCommandSetFrequency(frequency);
        services.vesRumblePackService.sendCommandSetOverdrive(data.overdrive);
        services.vesRumblePackService.sendCommandSetPositiveSustain(data.sustainPositive);
        services.vesRumblePackService.sendCommandSetNegativeSustain(data.sustainNegative);
        services.vesRumblePackService.sendCommandSetBreak(data.break);
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
                        options={[50, 95, 130, 160, 240, 320, 400].map(f => ({
                            label: `${f} Hz`,
                            value: f.toString(),
                        }))}
                        onChange={option => this.setFrequency(option.value ? parseInt(option.value) as RumbleEffectFrequency : 160)}
                    />
                </VContainer>
            </HContainer>
            <HContainer gap={15}>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/overdrive', 'Overdrive')}
                    </label>
                    <input
                        type="number"
                        className="theia-input"
                        title={nls.localize('vuengine/rumbleEffectEditor/overdrive', 'Overdrive')}
                        onChange={e => this.setStateOverdrive(parseInt(e.target.value))}
                        value={data.overdrive}
                        min="0"
                        max="255"
                    />
                </VContainer>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/break', 'Break')}
                    </label>
                    <input
                        type="number"
                        className="theia-input"
                        title={nls.localize('vuengine/rumbleEffectEditor/break', 'Break')}
                        onChange={e => this.setStateBreak(parseInt(e.target.value))}
                        value={data.break}
                        min="0"
                        max="255"
                    />
                </VContainer>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/sustainPos', 'Sustain (Pos.)')}
                    </label>
                    <input
                        type="number"
                        className="theia-input"
                        title={nls.localize('vuengine/rumbleEffectEditor/positiveSustain', 'Positive Sustain')}
                        onChange={e => this.setStateSustainPositive(parseInt(e.target.value))}
                        value={data.sustainPositive}
                        min="0"
                        max="255"
                    />
                </VContainer>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/sustainNeg', 'Sustain (Neg.)')}
                    </label>
                    <input
                        type="number"
                        className="theia-input"
                        title={nls.localize('vuengine/rumbleEffectEditor/negativeSustain', 'Negative Sustain')}
                        onChange={e => this.setStateSustainNegative(parseInt(e.target.value))}
                        value={data.sustainNegative}
                        min="0"
                        max="255"
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
