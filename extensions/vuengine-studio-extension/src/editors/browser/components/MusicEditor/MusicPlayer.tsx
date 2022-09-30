import React from 'react';
import * as Tone from 'tone';
import { Synth } from 'tone';

interface MusicPlayerProps {
    currentStep: number
    playing: boolean
    speed: number
    notes: (string | undefined)[][]
    increaseCurrentStep: () => void
}

export default class MusicPlayer extends React.Component<MusicPlayerProps> {
    protected synths: Synth[];
    protected timer: NodeJS.Timer;

    constructor(props: MusicPlayerProps) {
        super(props);
        this.synths = [...[...Array(6)].map((n, i) =>
            (new Tone.Synth().toDestination())
        )];
    };

    playNote(): void {
        const { currentStep, increaseCurrentStep, notes, playing, speed } = this.props;

        if (playing) {
            notes.forEach((channel, index) => {
                const note = channel[currentStep];
                if (note !== undefined) {
                    this.synths[index].triggerAttackRelease(note, 0.5);
                }
            });
            increaseCurrentStep();

            this.timer = setTimeout(() => this.playNote(), speed);
        }
    }

    componentDidUpdate(prevProps: MusicPlayerProps): void {
        const { playing, speed } = this.props;
        if (playing && playing !== prevProps.playing) {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.playNote(), speed);
        }
    }

    render(): JSX.Element {
        return <></>;
    }
}
