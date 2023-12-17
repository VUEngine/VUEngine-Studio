import { nls } from '@theia/core';
import React from 'react';
import { VesRumblePackCommands } from '../../../../rumble-pack/browser/ves-rumble-pack-commands';
import { RumblePakLogLine } from '../../../../rumble-pack/browser/ves-rumble-pack-types';
import { EditorsServices } from '../../ves-editors-widget';
import { BUILT_IN_EFFECTS, RumbleEffectData } from './RumbleEffectTypes';

interface RumbleEffectProps {
    data: RumbleEffectData
    updateData: (data: RumbleEffectData) => void
    services: EditorsServices
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

        props.services.vesRumblePackService.onDidChangeConnectedRumblePack(() => this.forceUpdate());
        props.services.vesRumblePackService.onDidChangeRumblePackLog(() => this.forceUpdate());
    }

    protected rumblePakLogLineLastElementRef = React.createRef<HTMLDivElement>();

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            name: e.target.value
        });
    }

    protected setStateEffect = (effect: number) => {
        this.props.updateData({
            ...this.props.data,
            effect: effect,
        });
    };

    protected setStateFrequency = (frequency: number) => {
        this.props.updateData({
            ...this.props.data,
            frequency: frequency,
        });
    };

    protected setStateSustainPositive = (sustain: number) => {
        if (sustain >= 0 && sustain <= 255) {
            this.props.updateData({
                ...this.props.data,
                sustainPositive: sustain,
            });
        }
    };

    protected setStateSustainNegative = (sustain: number) => {
        if (sustain >= 0 && sustain <= 255) {
            this.props.updateData({
                ...this.props.data,
                sustainNegative: sustain,
            });
        }
    };

    protected setStateOverdrive = (overdrive: number) => {
        if (overdrive >= 0 && overdrive <= 255) {
            this.props.updateData({
                ...this.props.data,
                overdrive: overdrive,
            });
        }
    };

    protected setStateBreak = (breakValue: number) => {
        if (breakValue >= 0 && breakValue <= 255) {
            this.props.updateData({
                ...this.props.data,
                break: breakValue,
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
        const data = this.props.data;
        const service = this.props.services.vesRumblePackService;

        this.props.services.vesRumblePackService.sendCommandSetOverdrive(data.overdrive);
        this.props.services.vesRumblePackService.sendCommandSetPositiveSustain(data.sustainPositive);
        this.props.services.vesRumblePackService.sendCommandSetNegativeSustain(data.sustainNegative);
        this.props.services.vesRumblePackService.sendCommandSetBreak(data.break);
        this.props.services.vesRumblePackService.sendCommandSetFrequency(data.frequency);
        service.sendCommandPlayEffect(data.effect);
    };

    protected detect = () =>
        this.props.services.commandService.executeCommand(VesRumblePackCommands.DETECT.id);

    protected sendCommand = () =>
        this.props.services.vesRumblePackService.sendCommand(this.state.command);

    protected sendCommandPrintMenu = () =>
        this.props.services.vesRumblePackService.sendCommandPrintMenu();

    protected sendCommandPrintVersion = () =>
        this.props.services.vesRumblePackService.sendCommandPrintVersion();

    protected sendCommandPrintVbCommandLineState = () =>
        this.props.services.vesRumblePackService.sendCommandPrintVbCommandLineState();

    protected sendCommandPrintVbSyncLineState = () =>
        this.props.services.vesRumblePackService.sendCommandPrintVbSyncLineState();

    protected sendCommandPlayLastEffect = () =>
        this.props.services.vesRumblePackService.sendCommandPlayLastEffect();

    protected sendCommandStopCurrentEffect = () =>
        this.props.services.vesRumblePackService.sendCommandStopCurrentEffect();

    protected clearLog = () =>
        this.props.services.vesRumblePackService.rumblePackLog = [];

    render(): React.JSX.Element {
        const { data, services } = this.props;
        const { command } = this.state;

        const rumblePackIsConnected = services.vesRumblePackService.connectedRumblePack !== undefined;
        this.rumblePakLogLineLastElementRef.current?.scrollIntoView();

        return <div className='rumbleEffectEditor'>
            <div className="setting">
                <label>
                    {nls.localize('vuengine/rumbleEffectEditor/name', 'Name')}
                </label>
                <input
                    className="theia-input large"
                    value={data.name}
                    onChange={this.onChangeName.bind(this)}
                />
            </div>
            <div className='settings'>
                <div className="setting">
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/effect', 'Effect')}
                    </label>
                    <select
                        className='theia-select'
                        title={nls.localize('vuengine/rumbleEffectEditor/builtInHapticEffects', 'Built-In Haptic Effects')}
                        onChange={e => this.setStateEffect(parseInt(e.target.value))}
                        value={data.effect}
                    >
                        {BUILT_IN_EFFECTS.map((value, index) => (
                            <option key={`effect-option-${index}`} value={index}>{value}</option>
                        ))}
                    </select>
                    {/*
                        <SelectComponent
                        defaultValue={data.effect}
                        options={BUILT_IN_EFFECTS.map((value, index) => ({
                            label: value,
                            value: index
                        }))}
                        onChange={option => this.setStateEffect(option.value || '001')}
                        />
                        */}
                </div>
                <div className="setting">
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/frequency', 'Frequency')}
                    </label>
                    <select
                        className='theia-select'
                        title={nls.localize('vuengine/rumbleEffectEditor/frequency', 'Frequency')}
                        onChange={e => this.setStateFrequency(parseInt(e.target.value))}
                        value={data.frequency}
                    >
                        <option value={0}>160 Hz</option>
                        <option value={1}>240 Hz</option>
                        <option value={2}>320 Hz</option>
                        <option value={3}>400 Hz</option>
                    </select>
                </div>
            </div>
            <div className='settings'>
                <div className="setting">
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
                </div>
                <div className="setting">
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
                </div>
                <div className="setting">
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
                </div>
                <div className="setting">
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
                </div>
            </div>
            <div className="setting">
                <label>
                    <input
                        type="checkbox"
                        checked={data.stopBeforeStarting}
                        onChange={this.toggleStopBeforeStarting}
                    />
                    {nls.localize('vuengine/rumbleEffectEditor/stopBeforeStarting', 'Stop before starting')}
                </label>
            </div>
            <div className="connectionStatus">
                {nls.localize('vuengine/rumbleEffectEditor/rumbleEffectEditorConnectionStatus', 'Rumble Pack connection status')}: {
                    rumblePackIsConnected
                        ? <span className='connected'>{nls.localize('vuengine/rumbleEffectEditor/connected', 'Connected')}</span>
                        : <span className='disconnected'>{nls.localize('vuengine/rumbleEffectEditor/disconnected', 'Disconnected')}</span>
                }
            </div>
            {rumblePackIsConnected
                ? <>
                    <div className="actions">
                        <div>
                            <label>
                                {nls.localize('vuengine/rumbleEffectEditor/actions', 'Actions')}
                            </label>
                            <div className="buttons">
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
                            </div>
                        </div>
                        <div>
                            <label>
                                {nls.localize('vuengine/rumbleEffectEditor/printCommands', 'Print Commands')}
                            </label>
                            <div className='buttons'>
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
                                <button
                                    className="theia-button secondary"
                                    onClick={this.sendCommandPrintVbCommandLineState}
                                    disabled={!rumblePackIsConnected}
                                >
                                    {nls.localize('vuengine/rumbleEffectEditor/vbCommandLineState', 'VB Command Line State')}
                                </button>
                                <button
                                    className="theia-button secondary"
                                    onClick={this.sendCommandPrintVbSyncLineState}
                                    disabled={!rumblePackIsConnected}
                                >
                                    {nls.localize('vuengine/rumbleEffectEditor/vbSyncLineState', 'VB Sync Line State')}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label>
                                {nls.localize('vuengine/rumbleEffectEditor/command', 'Command')}
                            </label>
                            <div className='buttons'>
                                <input
                                    className="theia-input"
                                    onChange={e => this.setState({ command: e.target.value })}
                                    value={command}
                                    min="0"
                                    max="255"
                                />
                                <button
                                    className="theia-button secondary"
                                    onClick={this.sendCommand}
                                    disabled={!rumblePackIsConnected}
                                >
                                    {nls.localize('vuengine/rumbleEffectEditor/send', 'Send')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className='log'>
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
                    </div>
                    <div className='log-actions'>
                        <button
                            className="theia-button secondary"
                            title={nls.localize('vuengine/rumbleEffectEditor/clearLog', 'Clear Log')}
                            onClick={this.clearLog}
                            disabled={!services.vesRumblePackService.rumblePackLog.length}
                        >
                            {nls.localize('vuengine/rumbleEffectEditor/clearLog', 'Clear Log')}
                        </button>
                    </div>
                </>
                : <button
                    className="theia-button secondary"
                    onClick={this.detect}>
                    {nls.localize('vuengine/rumblePack/commands/detectConnected', 'Detect Connected Rumble Pack')}
                </button>}
        </div>;
    }
}
