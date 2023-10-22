import React from 'react';
import { SongNote } from './MusicEditorTypes';

interface MusicPlayerProps {
    currentStep: number
    playing: boolean
    speed: number
    song: (SongNote | undefined)[][]
    increaseCurrentStep: () => void
}

export default class MusicPlayer extends React.Component<MusicPlayerProps> {
    protected synths: any[];
    protected timer: NodeJS.Timer;

    constructor(props: MusicPlayerProps) {
        super(props);
        this.synths = [...[...Array(6)].map((n, i) =>
            // (new Tone.Synth().toDestination())
            undefined
        )];
    };

    componentWillUnmount(): void {
        clearTimeout(this.timer);
    }

    playNote(): void {
        const { currentStep, increaseCurrentStep, song, playing, speed } = this.props;

        if (playing) {
            song.forEach((channel, index) => {
                const note = channel[currentStep];
                if (typeof note?.volumeL === 'number') {
                    // this.synths[index].volume.value = note!.volumeL!;
                }
                if (typeof note?.note === 'string') {
                    // this.synths[index].triggerAttack(note.note, 1);
                }
            });
            increaseCurrentStep();

            this.timer = setTimeout(() => this.playNote(), speed);
        } else {
            this.synths.map(synth => {
                // synth.triggerRelease();
            });
        }
    }

    componentDidUpdate(prevProps: MusicPlayerProps): void {
        const { playing, speed } = this.props;
        if (playing && playing !== prevProps.playing) {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.playNote(), speed);
        }
    }

    render(): React.JSX.Element {
        return <></>;
    }
}
