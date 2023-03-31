import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import { DataSection, MAX_RANGE, MIN_RANGE, PCMData } from './PCMTypes';

interface PCMProps {
    data: PCMData
    updateData: (data: PCMData) => void
    services: {
    }
}

interface PCMState {
    command: string
}

export default class PCMEditor extends React.Component<PCMProps, PCMState> {
    constructor(props: PCMProps) {
        super(props);
        this.state = {
            command: ''
        };
    }

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            name: e.target.value.trim()
        });
    }

    protected setRange = (range: number) => {
        if (range >= MIN_RANGE && range <= MAX_RANGE) {
            this.props.updateData({
                ...this.props.data,
                range,
            });
        }
    };

    protected setSection = (section: DataSection) => {
        this.props.updateData({
            ...this.props.data,
            section,
        });
    };

    protected toggleLoop = () => {
        this.props.updateData({
            ...this.props.data,
            loop: !this.props.data.loop,
        });
    };

    render(): JSX.Element {
        const { data } = this.props;

        return <div className='pcmEditor'>
            <div className='setting'>
                <label>
                    {nls.localize('vuengine/pcmEditor/name', 'Name')}
                </label>
                <input
                    className="theia-input large"
                    value={data.name}
                    onChange={this.onChangeName.bind(this)}
                />
            </div>
            <div className='setting'>
                <label>
                    {nls.localize('vuengine/pcmEditor/range', 'Range')}
                </label>
                <input
                    type="number"
                    className="theia-input"
                    title={nls.localize('vuengine/pcmEditor/range', 'Range')}
                    onChange={e => this.setRange(parseInt(e.target.value))}
                    value={data.range}
                    min={MIN_RANGE}
                    max={MAX_RANGE}
                />
            </div>
            <div className='setting'>
                <label>
                    {nls.localize('vuengine/pcmEditor/section', 'Section')}
                </label>
                <SelectComponent
                    defaultValue={data.section}
                    options={[{
                        label: nls.localize('vuengine/pcmEditor/romSpace', 'ROM Space'),
                        value: DataSection.ROM,
                        description: nls.localize('vuengine/pcmEditor/romSpaceDescription', 'Save PCM data to ROM space'),
                    }, {
                        label: nls.localize('vuengine/pcmEditor/expansionSpace', 'Expansion Space'),
                        value: DataSection.EXP,
                        description: nls.localize('vuengine/pcmEditor/expansionSpaceDescription', 'Save PCM data to expansion space'),
                    }]}
                    onChange={option => this.setSection(option.value as DataSection)}
                />
            </div>
        </div>;
    }
}
