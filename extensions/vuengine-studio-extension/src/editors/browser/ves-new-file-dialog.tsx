import { nls } from '@theia/core';
import { Dialog, DialogProps, Message } from '@theia/core/lib/browser';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { inject, injectable } from 'inversify';
import * as React from 'react';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ProjectContributor, ProjectDataTypesWithContributor } from '../../project/browser/ves-project-types';

@injectable()
export class VesNewFileDialogProps extends DialogProps {
    parentLabel: string;
    types: ProjectDataTypesWithContributor;
    vesProjectService: VesProjectService;
    defaultName: string;
    defaultExt: string;
}

@injectable()
export class VesNewFileDialog extends ReactDialog<string> {
    constructor(
        @inject(VesNewFileDialogProps) protected override readonly props: VesNewFileDialogProps
    ) {
        super(props);

        this.name = props.defaultName;
        this.ext = props.defaultExt;
        this.appendAcceptButton(Dialog.OK);
    }

    protected ext: string;
    protected name: string;

    get value(): string {
        return this.ext.startsWith('.')
            ? this.name + this.ext
            : this.ext;
    }

    protected onActivateRequest(msg: Message): void {
    }

    protected render(): React.ReactNode {
        const typeKeys = Object.keys(this.props.types).sort();
        const multiFileTypes = typeKeys.filter(typeId => this.props.types[typeId].file?.startsWith('.'));
        const singleFileTypes = typeKeys.filter(typeId => !this.props.types[typeId].file?.startsWith('.') &&
            // ignore if a file of this kind already exists
            !this.props.vesProjectService.getProjectDataItemById(ProjectContributor.Project, typeId));

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
                            style={{ flexGrow: 2, width: 0 }}
                            spellCheck="false"
                            placeholder={nls.localize('vuengine/editors/newFileDialog/fileName', 'File Name')}
                            value={this.name}
                            tabIndex={0}
                            onChange={e => {
                                this.name = e.currentTarget.value;
                                this.update();
                            }}
                            autoFocus
                            onFocus={e => e.target.select()}
                        />
                        <input
                            type="text"
                            className="theia-input"
                            style={{ flexGrow: 1, width: 0 }}
                            spellCheck="false"
                            placeholder={`.${nls.localize('vuengine/editors/newFileDialog/extension', 'extension')}`}
                            value={this.ext}
                            onChange={e => {
                                this.ext = e.currentTarget.value;
                                this.update();
                            }}
                            onFocus={e => e.target.select()}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--theia-ui-padding)' }}>
                    <label>{nls.localizeByDefault('Type')}</label>
                    <select
                        className="theia-select"
                        style={{ flexGrow: 1 }}
                        value={this.ext}
                        onChange={e => {
                            if (e.currentTarget.value.startsWith('.')) {
                                this.ext = e.currentTarget.value;
                            } else {
                                this.name = e.currentTarget.value.split('.')[0];
                                this.ext = e.currentTarget.value.split('.').slice(1).join('.');
                            }
                            this.update();
                        }}
                    >
                        <optgroup>
                            <option value="">
                                {nls.localize('vuengine/editors/newFileDialog/types/None', 'None')}
                            </option>
                            <option value=".c / .h">
                                {nls.localize('vuengine/editors/newFileDialog/types/SourceAndHeader', 'Source & Header')}
                            </option>
                            <option value=".c">
                                {nls.localize('vuengine/editors/newFileDialog/types/Source', 'Source Code')}
                            </option>
                            <option value=".h">
                                {nls.localize('vuengine/editors/newFileDialog/types/Header', 'Header')}
                            </option>
                        </optgroup>

                        {[multiFileTypes, singleFileTypes].map((b, i) =>
                            b.length > 0 &&
                            <optgroup key={'optgroup-' + i}>
                                {b.map(typeId => {
                                    const ext = this.props.types[typeId].file;
                                    return (
                                        <option value={ext} key={ext}>
                                            {nls.localize(`vuengine/projects/types/${typeId}`, this.props.types[typeId].schema.title || typeId)}
                                        </option>
                                    );
                                })}
                            </optgroup>
                        )}
                    </select>
                </div>
            </div>
            <div className="error"></div>
        </>;
    }

    protected override onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.update();
    }
}
