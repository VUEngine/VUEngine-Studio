import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesCommonService } from '../../core/browser/ves-common-service';
import MusicEditor from './components/MusicEditor';
import { ChannelConfig, CurrentPattern, MAX_SPEED, MAX_VOLUME, MIN_SPEED, MIN_VOLUME, MusicEditorStateApi, PatternConfig } from './ves-music-editor-types';

export const VesMusicEditorWidgetOptions = Symbol('VesMusicEditorWidgetOptions');
export interface VesMusicEditorWidgetOptions {
    uri: string;
}

export interface vesMusicEditorWidgetState {
    name: string
    channels: ChannelConfig[],
    patterns: PatternConfig[],
    currentPattern: CurrentPattern,
    playing: boolean
    recording: boolean
    speed: number
    volume: number
    bar: number
};

@injectable()
export class VesMusicEditorWidget extends ReactWidget {
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesMusicEditorWidgetOptions)
    protected readonly options: VesMusicEditorWidgetOptions;

    static readonly ID = 'vesMusicEditorWidget';
    static readonly LABEL = nls.localize('vuengine/musicEditor/musicEditor', 'Music Editor');

    protected state: vesMusicEditorWidgetState;

    @postConstruct()
    protected init(): void {
        const label = this.options
            ? this.vesCommonService.basename(this.options.uri)
            : VesMusicEditorWidget.LABEL;
        const caption = this.options ? this.options.uri : VesMusicEditorWidget.LABEL;

        this.id = VesMusicEditorWidget.ID;
        this.title.label = label;
        this.title.caption = caption;
        this.title.iconClass = 'fa fa-music';
        this.title.closable = true;

        this.initState();

        this.update();
    }
    protected initState(): void {
        this.state = {
            name: 'New',
            channels: [...Array(6)].map((c, index) => ({
                name: '',
                patterns: index === 0 ? [1] : [],
                muted: false,
                solo: false,
                collapsed: false,
            })),
            patterns: [{
                id: 1,
                channel: 1,
                size: 32,
                notes: []
            }],
            currentPattern: {
                channel: 1,
                id: 1,
            },
            playing: false,
            recording: false,
            speed: 160,
            volume: 10,
            bar: 4,
        };
    }

    protected stateApi: MusicEditorStateApi = {
        setName: (name: string): void => {
            this.state.name = name;
            this.update();
        },

        setPlaying: (playing: boolean): void => {
            this.state.playing = playing;
            this.update();
        },

        setRecording: (recording: boolean): void => {
            this.state.recording = recording;
            this.update();
        },

        setBar: (bar: number): void => {
            this.state.bar = bar;
            this.update();
        },

        setSpeed: (speed: number): void => {
            if (speed <= MAX_SPEED && speed >= MIN_SPEED) {
                this.state.speed = speed;
                this.update();
            }
        },

        setVolume: (volume: number): void => {
            if (volume <= MAX_VOLUME && volume >= MIN_VOLUME) {
                this.state.volume = volume;
                this.update();
            }
        },

        setChannels: (channels: ChannelConfig[]): void => {
            this.state.channels = channels;
            this.update();
        },

        setPatterns: (patterns: PatternConfig[]): void => {
            this.state.patterns = patterns;
            this.update();
        },

        setCurrentPattern: (currentPattern: CurrentPattern): void => {
            this.state.currentPattern = currentPattern;
            this.update();
        },

        setNote: (channel: number, patternId: number, noteIndex: number, noteId: number): void => {
            this.state.patterns.forEach(pattern => {
                if (pattern.channel === channel && pattern.id === patternId) {
                    pattern.notes[noteIndex] = noteId;
                    return;
                }
            });
            this.update();
        },

        toggleChannelMuted: (channelId: number): void => {
            this.state.channels[channelId].muted = !this.state.channels[channelId].muted;
            this.state.channels[channelId].solo = false;
            this.update();
        },

        toggleChannelSolo: (channelId: number): void => {
            this.state.channels.forEach((channel, index) => {
                if (index === channelId) {
                    channel.solo = !channel.solo;
                    channel.muted = false;
                } else {
                    channel.solo = false;
                }
            });
            this.update();
        },

        toggleChannelCollapsed: (channelId: number): void => {
            this.state.channels[channelId].collapsed = !this.state.channels[channelId].collapsed;
            this.state.channels[channelId].solo = false;
            this.update();
        },

        addChannelPattern: (channelId: number, patternId: number): void => {
            this.state.channels[channelId - 1].patterns.push(patternId);

            let patternExists = false;
            this.state.patterns.forEach(pattern => {
                if (pattern.channel === channelId && pattern.id === patternId) {
                    patternExists = true;
                    return;
                }
            });

            if (!patternExists) {
                this.state.patterns.push({
                    channel: channelId,
                    id: patternId,
                    size: 32,
                    notes: [],
                });
            }

            this.state.currentPattern = {
                channel: channelId,
                id: patternId,
            };
            this.update();
        },
    };

    protected render(): React.ReactNode {
        return <MusicEditor
            channels={this.state.channels}
            patterns={this.state.patterns}
            currentPattern={this.state.currentPattern}
            playing={this.state.playing}
            recording={this.state.recording}
            bar={this.state.bar}
            speed={this.state.speed}
            maxSpeed={MAX_SPEED}
            minSpeed={MIN_SPEED}
            volume={this.state.volume}
            maxVolume={MAX_VOLUME}
            minVolume={MIN_VOLUME}
            stateApi={this.stateApi}
        />;
    }
}
