import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import { VesRumblePackCommands } from '../../../../rumble-pack/browser/ves-rumble-pack-commands';
import { RumblePakLogLine } from '../../../../rumble-pack/browser/ves-rumble-pack-types';
import { EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import { clamp } from '../Common/Utils';
import VContainer from '../Common/VContainer';
import {
    BUILT_IN_RUMBLE_EFFECTS,
    DEFAULT_RUMBLE_EFFECT,
    DEFAULT_RUMBLE_EFFECT_FREQUENCY,
    DEFAULT_RUMBLE_EFFECT_BREAK,
    DEFAULT_RUMBLE_EFFECT_OVERDRIVE,
    DEFAULT_RUMBLE_EFFECT_SUSTAIN_NEGATIVE,
    DEFAULT_RUMBLE_EFFECT_SUSTAIN_POSITIVE,
    RUMBLE_EFFECT_FREQUENCIES,
    MAX_RUMBLE_EFFECT_BREAK,
    MAX_RUMBLE_EFFECT_OVERDRIVE,
    MAX_RUMBLE_EFFECT_SUSTAIN_NEGATIVE,
    MAX_RUMBLE_EFFECT_SUSTAIN_POSITIVE,
    MIN_RUMBLE_EFFECT_BREAK,
    MIN_RUMBLE_EFFECT_OVERDRIVE,
    MIN_RUMBLE_EFFECT_SUSTAIN_NEGATIVE,
    MIN_RUMBLE_EFFECT_SUSTAIN_POSITIVE,
    RumbleEffectData,
    RumbleEffectFrequency,
} from './RumbleEffectTypes';

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
            sustainPositive: clamp(
                sustain,
                MIN_RUMBLE_EFFECT_SUSTAIN_POSITIVE,
                MAX_RUMBLE_EFFECT_SUSTAIN_POSITIVE
            ),
        });
    };

    protected setStateSustainNegative = (sustain: number) => {
        this.props.updateData({
            ...this.props.data,
            sustainNegative: clamp(
                sustain,
                MIN_RUMBLE_EFFECT_SUSTAIN_NEGATIVE,
                MAX_RUMBLE_EFFECT_SUSTAIN_NEGATIVE
            ),
        });
    };

    protected setStateOverdrive = (overdrive: number) => {
        this.props.updateData({
            ...this.props.data,
            overdrive: clamp(
                overdrive,
                MIN_RUMBLE_EFFECT_OVERDRIVE,
                MAX_RUMBLE_EFFECT_OVERDRIVE
            ),
        });
    };

    protected setStateBreak = (breakValue: number) => {
        this.props.updateData({
            ...this.props.data,
            break: clamp(
                breakValue,
                MIN_RUMBLE_EFFECT_BREAK,
                MAX_RUMBLE_EFFECT_BREAK
            ),
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

        let frequencyId = 0;
        switch (data.frequency) {
            case 160: frequencyId = 0; break;
            case 240: frequencyId = 1; break;
            case 320: frequencyId = 2; break;
            case 400: frequencyId = 3; break;
            case 50: frequencyId = 4; break;
            case 95: frequencyId = 5; break;
            case 130: frequencyId = 6; break;
        }

        services.vesRumblePackService.sendCommandSetFrequency(frequencyId);
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
                        defaultValue={data.effect >= 1 && data.effect <= BUILT_IN_RUMBLE_EFFECTS.length ? data.effect.toString() : DEFAULT_RUMBLE_EFFECT.toString()}
                        options={BUILT_IN_RUMBLE_EFFECTS.map((value, index) => ({
                            label: value,
                            value: (index + 1).toString(),
                        }))}
                        onChange={option => this.setEffect(option.value ? parseInt(option.value) : DEFAULT_RUMBLE_EFFECT)}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/rumbleEffectEditor/frequency', 'Frequency')}
                    </label>
                    <SelectComponent
                        defaultValue={RUMBLE_EFFECT_FREQUENCIES.includes(data.frequency) ? data.frequency.toString() : DEFAULT_RUMBLE_EFFECT_FREQUENCY.toString()}
                        options={RUMBLE_EFFECT_FREQUENCIES.map(f => ({
                            label: `${f} Hz`,
                            value: f.toString(),
                        }))}
                        onChange={option => this.setFrequency(option.value ? parseInt(option.value) as RumbleEffectFrequency : DEFAULT_RUMBLE_EFFECT_FREQUENCY)}
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
                        value={data.overdrive < MIN_RUMBLE_EFFECT_OVERDRIVE || data.overdrive > MAX_RUMBLE_EFFECT_OVERDRIVE
                            ? DEFAULT_RUMBLE_EFFECT_OVERDRIVE
                            : data.overdrive}
                        min={MIN_RUMBLE_EFFECT_OVERDRIVE}
                        max={MAX_RUMBLE_EFFECT_OVERDRIVE}
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
                        value={data.break < MIN_RUMBLE_EFFECT_BREAK || data.break > MAX_RUMBLE_EFFECT_BREAK
                            ? DEFAULT_RUMBLE_EFFECT_BREAK
                            : data.break}
                        min={MIN_RUMBLE_EFFECT_BREAK}
                        max={MAX_RUMBLE_EFFECT_BREAK}
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
                        value={data.sustainPositive < MIN_RUMBLE_EFFECT_SUSTAIN_POSITIVE || data.sustainPositive > MAX_RUMBLE_EFFECT_SUSTAIN_POSITIVE
                            ? DEFAULT_RUMBLE_EFFECT_SUSTAIN_POSITIVE
                            : data.sustainPositive}
                        min={MIN_RUMBLE_EFFECT_SUSTAIN_POSITIVE}
                        max={MAX_RUMBLE_EFFECT_SUSTAIN_POSITIVE}
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
                        value={data.sustainNegative < MIN_RUMBLE_EFFECT_SUSTAIN_NEGATIVE || data.sustainNegative > MAX_RUMBLE_EFFECT_SUSTAIN_NEGATIVE
                            ? DEFAULT_RUMBLE_EFFECT_SUSTAIN_NEGATIVE
                            : data.sustainNegative}
                        min={MIN_RUMBLE_EFFECT_SUSTAIN_NEGATIVE}
                        max={MAX_RUMBLE_EFFECT_SUSTAIN_NEGATIVE}
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
                    {nls.localize('vuengine/rumbleEffectEditor/stopBeforeStarting', 'Stop previous effect(s) before starting this')}
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
