import { nls } from '@theia/core';
import { Dialog, DialogProps, Message } from '@theia/core/lib/browser';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { inject, injectable } from 'inversify';
import * as React from 'react';
import { ProjectFileTypesWithContributor } from '../../project/browser/ves-project-types';

@injectable()
export class VesNewFileDialogProps extends DialogProps {
    parentLabel: string;
    types: ProjectFileTypesWithContributor;
}

@injectable()
export class VesNewFileDialog extends ReactDialog<string> {
    constructor(
        @inject(VesNewFileDialogProps) protected override readonly props: VesNewFileDialogProps
    ) {
        super(props);

        this.appendAcceptButton(Dialog.OK);
    }

    protected ext = '.c / .h';
    protected name = nls.localize('vuengine/editors/newFileDialog/untitled', 'Untitled');

    get value(): string {
        return this.ext.startsWith('.')
            ? this.name + this.ext
            : this.ext;
    }

    protected onActivateRequest(msg: Message): void {
    }

    protected render(): React.ReactNode {
        return <>
            <div
                title={this.props.parentLabel}
                style={{
                    verticalAlign: 'text-bottom',
                    paddingBottom: '1em',
                    width: 460,
                }}
            >
                <i className="codicon codicon-folder" style={{ marginRight: '0.5em', verticalAlign: 'text-bottom' }}></i>
                {this.props.parentLabel}
            </div>
            <div style={{ alignItems: 'end', display: 'flex', gap: 'calc(var(--theia-ui-padding) * 2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--theia-ui-padding)', flexGrow: 1 }}>
                    <label style={{ marginTop: 'var(--theia-ui-padding)' }}>{nls.localize('vuengine/editors/newFileDialog/fileName', 'File Name')}</label>
                    <div style={{ display: 'flex', gap: 'var(--theia-ui-padding)' }}>
                        <input
                            type="text"
                            className="theia-input"
                            style={{ display: this.ext.startsWith('.') ? 'block' : 'none', flexGrow: 3, width: 0 }}
                            spellCheck="false"
                            placeholder={nls.localize('vuengine/editors/newFileDialog/fileName', 'File Name')}
                            value={this.name}
                            tabIndex={0}
                            onChange={e => {
                                this.name = e.currentTarget.value;
                                this.update();
                            }}
                            autoFocus
                        />
                        <input
                            type="text"
                            className="theia-input"
                            style={{ flexGrow: 1, width: 0 }}
                            spellCheck="false"
                            value={this.ext}
                            disabled
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--theia-ui-padding)' }}>
                    <label>{nls.localizeByDefault('Type')}</label>
                    <select
                        className="theia-select"
                        style={{ flexGrow: 1 }}
                        onChange={e => {
                            this.ext = e.currentTarget.value;
                            this.update();
                        }}
                    >
                        <optgroup>
                            <option
                                value=".c / .h"
                                selected={this.ext === '.c / .h'}
                            >
                                {nls.localize('vuengine/editors/newFileDialog/types/CSourceAndHeader', 'C Source & Header')}
                            </option>
                            <option
                                value=".c"
                                selected={this.ext === '.c'}
                            >
                                {nls.localize('vuengine/editors/newFileDialog/types/CSource', 'C Source Code')}
                            </option>
                            <option
                                value=".h"
                                selected={this.ext === '.h'}
                            >
                                {nls.localize('vuengine/editors/newFileDialog/types/CHeader', 'C Header')}
                            </option>
                            <option
                                value=".txt"
                                selected={this.ext === '.txt'}
                            >
                                {nls.localize('vuengine/editors/newFileDialog/types/Text', 'Text')}
                            </option>
                        </optgroup>
                        {[true, false].map(b =>
                            <optgroup>
                                {Object.keys(this.props.types).map(typeId => (
                                    (this.props.types[typeId].file.startsWith('.') === b) &&
                                    <option
                                        value={this.props.types[typeId].file}
                                        selected={this.ext === this.props.types[typeId].file}
                                    >
                                        {nls.localize(`vuengine/editors/newFileDialog/types/${typeId}`, this.props.types[typeId].schema.title || typeId)}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>
            </div >
            <div className="error"></div>
        </>;
    }

    protected override onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.update();
    }
}
