import { nls } from '@theia/core';
import React from 'react';
import { VesRumblePackService } from '../../../../rumble-pack/browser/ves-rumble-pack-service';
import { HapticFrequency, RumblePakLogLine } from '../../../../rumble-pack/common/ves-rumble-pack-types';
import { BUILT_IN_EFFECTS, FREQUENCY_MAPPING, RumbleEffectData } from './RumbleEffectTypes';

interface RumbleEffectProps {
    data: RumbleEffectData
    updateData: (data: RumbleEffectData) => void
    services: {
        vesRumblePackService: VesRumblePackService,
    }
}

interface RumbleEffectState {
}

export default class RumbleEffectEditor extends React.Component<RumbleEffectProps, RumbleEffectState> {
    constructor(props: RumbleEffectProps) {
        super(props);
        this.state = {
        };

        props.services.vesRumblePackService.onDidChangeRumblePackIsConnected(() => this.forceUpdate());
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
        this.sendCommandSetFrequency(FREQUENCY_MAPPING[frequency]);
    };

    protected setStateSustainPositive = (sustain: number) => {
        if (sustain >= 0 && sustain <= 255) {
            this.props.updateData({
                ...this.props.data,
                sustainPositive: sustain,
            });
            this.sendCommandSetPositiveSustain(sustain);
        }
    };

    protected setStateSustainNegative = (sustain: number) => {
        if (sustain >= 0 && sustain <= 255) {
            this.props.updateData({
                ...this.props.data,
                sustainNegative: sustain,
            });
            this.sendCommandSetNegativeSustain(sustain);
        }
    };

    protected setStateOverdrive = (overdrive: number) => {
        if (overdrive >= 0 && overdrive <= 255) {
            this.props.updateData({
                ...this.props.data,
                overdrive: overdrive,
            });
            this.sendCommandSetOverdrive(overdrive);
        }
    };

    protected setStateBreak = (breakValue: number) => {
        if (breakValue >= 0 && breakValue <= 255) {
            this.props.updateData({
                ...this.props.data,
                break: breakValue,
            });
            this.sendCommandSetBreak(breakValue);
        }
    };

    protected toggleStopBeforeStarting = () => {
        this.props.updateData({
            ...this.props.data,
            stopBeforeStarting: !this.props.data.stopBeforeStarting,
        });
    };

    protected sendCommandPrintMenu = () =>
        this.props.services.vesRumblePackService.sendCommandPrintMenu();

    protected sendCommandPrintVbCommandLineState = () =>
        this.props.services.vesRumblePackService.sendCommandPrintVbCommandLineState();

    protected sendCommandPrintVbSyncLineState = () =>
        this.props.services.vesRumblePackService.sendCommandPrintVbSyncLineState();

    protected sendCommandPlayLastEffect = () =>
        this.props.services.vesRumblePackService.sendCommandPlayLastEffect();

    protected sendCommandStopCurrentEffect = () =>
        this.props.services.vesRumblePackService.sendCommandStopCurrentEffect();

    protected sendCommandPlayEffect = () =>
        this.props.services.vesRumblePackService.sendCommandPlayEffect((this.props.data.effect + 1).toString().padStart(3, '0'));

    protected sendCommandSetFrequency = (frequency: HapticFrequency) =>
        this.props.services.vesRumblePackService.sendCommandSetFrequency(frequency);

    protected sendCommandSetOverdrive = (overdrive: number) =>
        this.props.services.vesRumblePackService.sendCommandSetOverdrive(overdrive);

    protected sendCommandSetPositiveSustain = (sustain: number) =>
        this.props.services.vesRumblePackService.sendCommandSetPositiveSustain(sustain);

    protected sendCommandSetNegativeSustain = (sustain: number) =>
        this.props.services.vesRumblePackService.sendCommandSetNegativeSustain(sustain);

    protected sendCommandSetBreak = (breakValue: number) =>
        this.props.services.vesRumblePackService.sendCommandSetBreak(breakValue);

    render(): JSX.Element {
        const { data, services } = this.props;

        this.rumblePakLogLineLastElementRef.current?.scrollIntoView();

        return <div className='rumbleEffectEditor'>
            <div>
                <div className='setting'>
                    <label>
                        {nls.localize('vuengine/brightnessRepeatEditor/name', 'Name')}
                    </label>
                    <input
                        className="theia-input large"
                        value={data.name}
                        onChange={this.onChangeName.bind(this)}
                    />
                </div>
                <div className='setting'>
                    <label>
                        {nls.localize('vuengine/rumblePack/effect', 'Effect')}
                    </label>
                    <select
                        className='theia-select'
                        title={nls.localize('vuengine/rumblePack/builtInHapticEffects', 'Built-In Haptic Effects')}
                        onChange={e => this.setStateEffect(e.target.value as unknown as number)}
                        value={data.effect}
                    >
                        {BUILT_IN_EFFECTS.map((value, index) => (
                            <option value={index}>{value}</option>
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
                <div className='settings'>
                    <div className='setting'>
                        <label>
                            {nls.localize('vuengine/rumblePack/frequency', 'Frequency')}
                        </label>
                        <select
                            className='theia-select'
                            title={nls.localize('vuengine/rumblePack/frequency', 'Frequency')}
                            onChange={e => this.setStateFrequency(e.target.value as unknown as number)}
                            value={data.frequency}
                        >
                            <option value={160}>160 Hz</option>
                            <option value={240}>240 Hz</option>
                            <option value={320}>320 Hz</option>
                            <option value={400}>400 Hz</option>
                        </select>
                    </div>
                    <div className='setting'>
                        <label>
                            {nls.localize('vuengine/rumblePack/sustainPos', 'Sustain (Pos.)')}
                        </label>
                        <input
                            type="number"
                            className="theia-input"
                            title={nls.localize('vuengine/rumblePack/positiveSustain', 'Positive Sustain')}
                            onChange={e => this.setStateSustainPositive(parseInt(e.target.value))}
                            value={data.sustainPositive}
                            min="0"
                            max="255"
                        />
                    </div>
                    <div className='setting'>
                        <label>
                            {nls.localize('vuengine/rumblePack/sustainNeg', 'Sustain (Neg.)')}
                        </label>
                        <input
                            type="number"
                            className="theia-input"
                            title={nls.localize('vuengine/rumblePack/negativeSustain', 'Negative Sustain')}
                            onChange={e => this.setStateSustainNegative(parseInt(e.target.value))}
                            value={data.sustainNegative}
                            min="0"
                            max="255"
                        />
                    </div>
                    <div className='setting'>
                        <label>
                            {nls.localize('vuengine/rumblePack/overdrive', 'Overdrive')}
                        </label>
                        <input
                            type="number"
                            className="theia-input"
                            title={nls.localize('vuengine/rumblePack/overdrive', 'Overdrive')}
                            onChange={e => this.setStateOverdrive(parseInt(e.target.value))}
                            value={data.overdrive}
                            min="0"
                            max="255"
                        />
                    </div>
                    <div className='setting'>
                        <label>
                            {nls.localize('vuengine/rumblePack/break', 'Break')}
                        </label>
                        <input
                            type="number"
                            className="theia-input"
                            title={nls.localize('vuengine/rumblePack/break', 'Break')}
                            onChange={e => this.setStateBreak(parseInt(e.target.value))}
                            value={data.break}
                            min="0"
                            max="255"
                        />
                    </div>
                </div>
                <div className='setting'>
                    <label>
                        <input
                            type='checkbox'
                            checked={data.stopBeforeStarting}
                            onChange={this.toggleStopBeforeStarting}
                        />
                        {nls.localize('vuengine/rumblePack/stopBeforeStarting', 'Stop before starting')}
                    </label>
                </div>
            </div>
            <div>
                <div className='connectionStatus'>
                    {nls.localize('vuengine/rumblePack/rumblePackConnectionStatus', 'Rumble Pack connection status')}: {
                        services.vesRumblePackService.rumblePackIsConnected
                            ? <span className='connected'>{nls.localize('vuengine/rumblePack/connected', 'Connected')}</span>
                            : <span className='disconnected'>{nls.localize('vuengine/rumblePack/disconnected', 'Disconnected')}</span>
                    }
                </div>
                <div className='actions'>
                    <div>
                        <label>
                            {nls.localize('vuengine/rumblePack/actions', 'Actions')}
                        </label>
                        <div className='buttons'>
                            <button
                                className='theia-button'
                                title={nls.localize('vuengine/rumblePack/runEffect', 'Run effect')}
                                onClick={this.sendCommandPlayEffect}
                                disabled={!services.vesRumblePackService.rumblePackIsConnected}
                            >
                                <i className='fa fa-play'></i>
                            </button>
                            <button
                                className='theia-button secondary'
                                title={nls.localize('vuengine/rumblePack/reRunLastEffect', 'Re-run last effect')}
                                onClick={this.sendCommandPlayLastEffect}
                                disabled={!services.vesRumblePackService.rumblePackIsConnected}
                            >
                                <i className='fa fa-repeat'></i>
                            </button>
                            <button
                                className='theia-button secondary'
                                title={nls.localize('vuengine/rumblePack/stopCurrentEffect', 'Stop current effect')}
                                onClick={this.sendCommandStopCurrentEffect}
                                disabled={!services.vesRumblePackService.rumblePackIsConnected}
                            >
                                <i className='fa fa-stop'></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label>
                            {nls.localize('vuengine/rumblePack/printCommands', 'Print Commands')}
                        </label>
                        <div className='buttons'>
                            <button
                                className='theia-button secondary'
                                onClick={this.sendCommandPrintMenu}
                                disabled={!services.vesRumblePackService.rumblePackIsConnected}
                            >
                                {nls.localize('vuengine/rumblePack/menu', 'Menu')}
                            </button>
                            <button
                                className='theia-button secondary'
                                onClick={this.sendCommandPrintVbCommandLineState}
                                disabled={!services.vesRumblePackService.rumblePackIsConnected}
                            >
                                {nls.localize('vuengine/rumblePack/vbCommandLineState', 'VB Command Line State')}
                            </button>
                            <button
                                className='theia-button secondary'
                                onClick={this.sendCommandPrintVbSyncLineState}
                                disabled={!services.vesRumblePackService.rumblePackIsConnected}
                            >
                                {nls.localize('vuengine/rumblePack/vbSyncLineState', 'VB Sync Line State')}
                            </button>
                        </div>
                    </div>
                </div>
                <div className='log'>
                    <label>
                        {nls.localize('vuengine/rumblePack/log', 'Log')}
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
            </div>
        </div >;
    }
}
