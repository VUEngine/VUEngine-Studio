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
    NoteConfig,
    PatternConfig,
    MUSIC_EDITOR_STATE_TEMPLATE,
    PatternSwitchStep,
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

        setPatterns: (patterns: PatternConfig[]): void => {
            this.state.patterns = patterns;
            this.update();
        },

        setCurrentChannel: (id: number): void => {
            this.state.currentChannel = id;
            this.state.currentNote = -1;
            this.update();
        },

        setCurrentPattern: (channel: number, pattern: number): void => {
            this.state.currentChannel = channel;
            this.state.currentPattern = pattern;
            this.state.currentNote = -1;
            this.update();
        },

        setCurrentNote: (id: number): void => {
            this.state.currentNote = id;
            this.update();
        },

        setNote: (channel: number, patternId: number, noteIndex: number, note: NoteConfig): void => {
            this.state.patterns.forEach(pattern => {
                if (pattern.channel === channel && pattern.id === patternId) {
                    pattern.notes[noteIndex] = note;
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
            this.state.channels[channelId].patterns.push(patternId);

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

            this.state.currentChannel = channelId;
            this.state.currentPattern = patternId;

            this.update();
        },

        removeChannelPattern: (channelId: number, index: number): void => {
            this.state.channels[channelId].patterns.splice(index, 1);
            this.update();
        },

        setPatternSize: (channelId: number, patternId: number, size: number): void => {
            this.state.patterns.forEach(pattern => {
                if (pattern.channel === channelId && pattern.id === patternId) {
                    pattern.size = size;
                    return;
                }
            });
            this.update();
        },
    };

    protected render(): React.ReactNode {
        let currentlyEditedPattern: PatternConfig | false = false;
        this.state.patterns.forEach(pattern => {
            if (pattern.channel === this.state.currentChannel && pattern.id === this.state.currentPattern) {
                currentlyEditedPattern = pattern;
            }
        });

        const soloChannel = this.state.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

        const songNotes: (string | undefined)[][] = [];
        const currentChannelPatternMap: PatternSwitchStep[] = [];
        this.state.channels.forEach((channel, index) => {
            const channelNotes: (string | undefined)[] = [];
            let step = 0;
            channel.patterns.forEach(patternId => {
                this.state.patterns.forEach(pattern => {
                    if (pattern.channel === channel.id && pattern.id === patternId) {
                        if (channel.id === this.state.currentChannel) {
                            currentChannelPatternMap.push({
                                step: step,
                                pattern: patternId
                            });
                        }
                        [...Array(pattern.size)].forEach((s, i) => {
                            channelNotes[step + i] = (pattern.notes[i] !== undefined
                                && pattern.notes[i]!.note !== undefined
                                && !channel.muted
                                && !(soloChannel > -1 && soloChannel !== channel.id))
                                ? Notes[pattern.notes[i]!.note!]
                                : undefined;
                        });
                        step += pattern.size;
                        return;
                    }
                });
            });
            if (channelNotes.length) {
                songNotes.push(channelNotes);
            }
        });

        return <MusicEditor
            name={this.state.name}
            channels={this.state.channels}
            patterns={this.state.patterns}
            currentChannel={this.state.currentChannel}
            currentPattern={this.state.currentPattern}
            currentNote={this.state.currentNote}
            bar={this.state.bar}
            speed={this.state.speed}
            volume={this.state.volume}
            stateApi={this.stateApi}
            currentlyEditedPattern={currentlyEditedPattern}
            songNotes={songNotes}
            currentChannelPatternMap={currentChannelPatternMap}
        />;
    }
}
