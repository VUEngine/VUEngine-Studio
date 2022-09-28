import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesCommonService } from '../../core/browser/ves-common-service';
import MusicEditor from './components/MusicEditor';
import {
    ChannelConfig,
    MAX_SPEED,
    MIN_SPEED,
    MusicEditorStateApi,
    PatternConfig,
    MUSIC_EDITOR_STATE_TEMPLATE,
    Notes,
    vesMusicEditorWidgetState
} from './ves-music-editor-types';

export const VesMusicEditorWidgetOptions = Symbol('VesMusicEditorWidgetOptions');
export interface VesMusicEditorWidgetOptions {
    uri: string;
}

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
        this.state = MUSIC_EDITOR_STATE_TEMPLATE;
    }

    protected stateApi: MusicEditorStateApi = {
        setName: (name: string): void => {
            this.state.name = name;
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
            if (volume <= 100 && volume >= 0) {
                this.state.volume = volume;
                this.update();
            }
        },

        setChannels: (channels: ChannelConfig[]): void => {
            this.state.channels = channels;
            this.update();
        },

        setChannelVolume: (volume: number): void => {
            this.state.channels[this.state.currentChannel].volume = volume;
            this.update();
        },

        setPatterns: (channelId: number, patterns: PatternConfig[]): void => {
            this.state.channels[channelId].patterns = patterns;
            this.update();
        },

        setCurrentChannel: (id: number): void => {
            this.state.currentChannel = id;
            this.state.currentPattern = this.state.channels[id].sequence[0] ?? -1;
            this.state.currentNote = -1;
            this.state.sidebarTab = 0;
            this.update();
        },

        setCurrentPattern: (channel: number, pattern: number): void => {
            this.state.currentChannel = channel;
            this.state.currentPattern = pattern;
            this.state.currentNote = -1;
            this.state.sidebarTab = 0;
            this.update();
        },

        setCurrentNote: (id: number): void => {
            this.state.currentNote = id;
            this.state.sidebarTab = 1;
            this.update();
        },

        setNote: (noteIndex: number, note: number | undefined): void => {
            this.state.channels[this.state.currentChannel].patterns[this.state.currentPattern].notes[noteIndex] = note;
            this.update();
        },

        setVolumeL: (noteIndex: number, volume: number | undefined): void => {
            this.state.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeL[noteIndex] = volume;
            this.update();
        },

        setVolumeR: (noteIndex: number, volume: number | undefined): void => {
            this.state.channels[this.state.currentChannel].patterns[this.state.currentPattern].volumeR[noteIndex] = volume;
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

        addToSequence: (channelId: number, patternId: number): void => {
            this.state.channels[channelId].sequence.push(patternId);

            const largestPatternId = this.state.channels[channelId].patterns.length - 1;
            if (patternId > largestPatternId) {
                this.state.channels[channelId].patterns.push({
                    size: this.state.defaultPatternSize,
                    notes: [],
                    volumeL: [],
                    volumeR: [],
                    effects: [],
                });
            }

            this.state.currentChannel = channelId;
            this.state.currentPattern = patternId;

            this.update();
        },

        removeFromSequence: (channelId: number, index: number): void => {
            this.state.channels[channelId].sequence.splice(index, 1);
            this.update();
        },

        setPatternSize: (size: number): void => {
            this.state.channels[this.state.currentChannel].patterns[this.state.currentPattern].size = size;
            this.update();
        },

        setDefaultPatternSize: (size: number): void => {
            this.state.defaultPatternSize = size;
            this.update();
        },

        setSidebarTab: (tab: number): void => {
            this.state.sidebarTab = tab;
            this.update();
        },
    };

    protected render(): React.ReactNode {
        const soloChannel = this.state.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

        const songNotes: (string | undefined)[][] = [];
        this.state.channels.forEach(channel => {
            const channelNotes: (string | undefined)[] = [];
            let step = 0;
            channel.sequence.forEach(patternId => {
                const pattern = this.state.channels[channel.id].patterns[patternId];
                [...Array(pattern.size)].forEach((s, i) => {
                    channelNotes[step + i] = (pattern.notes[i] !== undefined
                        && !channel.muted
                        && !(soloChannel > -1 && soloChannel !== channel.id))
                        ? Notes[pattern.notes[i]!]
                        : undefined;
                });
                step += pattern.size;
            });
            if (channelNotes.length) {
                songNotes.push(channelNotes);
            }
        });

        return <MusicEditor
            name={this.state.name}
            channels={this.state.channels}
            currentChannel={this.state.currentChannel}
            currentPattern={this.state.currentPattern}
            currentNote={this.state.currentNote}
            bar={this.state.bar}
            speed={this.state.speed}
            volume={this.state.volume}
            stateApi={this.stateApi}
            sidebarTab={this.state.sidebarTab}
            defaultPatternSize={this.state.defaultPatternSize}
            songNotes={songNotes}
        />;
    }
}
