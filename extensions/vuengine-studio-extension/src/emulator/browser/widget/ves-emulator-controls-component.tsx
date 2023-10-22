import * as React from '@theia/core/shared/react';
import { CommandService, nls } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';
import { VesEmulatorCommands } from '../ves-emulator-commands';
import IMAGE_VB_CONTROLLER from '../../../../src/emulator/browser/images/vb-controller.png';

export interface VesEmulatorControlsProps {
    commandService: CommandService
    keybindingRegistry: KeybindingRegistry
}

export interface VesEmulatorControlsState {
}

export class VesEmulatorControls extends React.Component<VesEmulatorControlsProps, VesEmulatorControlsState> {
    protected commandService: CommandService;
    protected keybindingRegistry: KeybindingRegistry;

    protected controllerButtonAssignmentSelectRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentStartRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentARef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentBRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentLUpRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentLLeftRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentLRightRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentLDownRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentRUpRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentRLeftRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentRRightRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentRDownRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentLTRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentRTRef = React.createRef<HTMLDivElement>();
    protected controllerButtonAssignmentPowerRef = React.createRef<HTMLDivElement>();
    protected controllerButtonSelectRef = React.createRef<HTMLDivElement>();
    protected controllerButtonStartRef = React.createRef<HTMLDivElement>();
    protected controllerButtonARef = React.createRef<HTMLDivElement>();
    protected controllerButtonBRef = React.createRef<HTMLDivElement>();
    protected controllerButtonLUpRef = React.createRef<HTMLDivElement>();
    protected controllerButtonLLeftRef = React.createRef<HTMLDivElement>();
    protected controllerButtonLRightRef = React.createRef<HTMLDivElement>();
    protected controllerButtonLDownRef = React.createRef<HTMLDivElement>();
    protected controllerButtonRUpRef = React.createRef<HTMLDivElement>();
    protected controllerButtonRLeftRef = React.createRef<HTMLDivElement>();
    protected controllerButtonRRightRef = React.createRef<HTMLDivElement>();
    protected controllerButtonRDownRef = React.createRef<HTMLDivElement>();
    protected controllerButtonLTRef = React.createRef<HTMLDivElement>();
    protected controllerButtonRTRef = React.createRef<HTMLDivElement>();
    protected controllerButtonPowerRef = React.createRef<HTMLDivElement>();

    constructor(props: VesEmulatorControlsProps) {
        super(props);

        this.commandService = props.commandService;
        this.keybindingRegistry = props.keybindingRegistry;
    }

    render(): React.JSX.Element {
        return <>
            <div>
                <div className='controlsController'>
                    <div className='buttonAssignmentGroup'>
                        <div
                            ref={this.controllerButtonAssignmentLTRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLTRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_L_TRIGGER.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_L_TRIGGER.id, false)}
                                </button>
                            </span>
                        </div>
                        <br />
                        <div
                            ref={this.controllerButtonAssignmentLUpRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLUpRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_L_UP.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_L_UP.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentLRightRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLRightRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_L_RIGHT.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_L_RIGHT.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentLDownRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLDownRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_L_DOWN.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_L_DOWN.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentLLeftRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLLeftRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_L_LEFT.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_L_LEFT.id, false)}
                                </button>
                            </span>
                        </div>
                        <br />
                        <div
                            ref={this.controllerButtonAssignmentSelectRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonSelectRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonSelectRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_SELECT.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_SELECT.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentStartRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonStartRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonStartRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_START.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_START.id, false)}
                                </button>
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className='controllerImage'>
                            <img src={IMAGE_VB_CONTROLLER} />
                            <div
                                className='buttonOverlay power'
                                ref={this.controllerButtonPowerRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentPowerRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentPowerRef)}
                            ></div>
                            <div
                                className='buttonOverlay select'
                                ref={this.controllerButtonSelectRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentSelectRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentSelectRef)}
                            ></div>
                            <div
                                className='buttonOverlay start'
                                ref={this.controllerButtonStartRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentStartRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentStartRef)}
                            ></div>
                            <div
                                className='buttonOverlay a'
                                ref={this.controllerButtonARef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentARef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentARef)}
                            ></div>
                            <div
                                className='buttonOverlay b'
                                ref={this.controllerButtonBRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentBRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentBRef)}
                            ></div>
                            <div
                                className='buttonOverlay lup'
                                ref={this.controllerButtonLUpRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLUpRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLUpRef)}
                            ></div>
                            <div
                                className='buttonOverlay lleft'
                                ref={this.controllerButtonLLeftRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLLeftRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLLeftRef)}
                            ></div>
                            <div
                                className='buttonOverlay lright'
                                ref={this.controllerButtonLRightRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLRightRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLRightRef)}
                            ></div>
                            <div
                                className='buttonOverlay ldown'
                                ref={this.controllerButtonLDownRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLDownRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLDownRef)}
                            ></div>
                            <div
                                className='buttonOverlay rup'
                                ref={this.controllerButtonRUpRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRUpRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRUpRef)}
                            ></div>
                            <div
                                className='buttonOverlay rleft'
                                ref={this.controllerButtonRLeftRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRLeftRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRLeftRef)}
                            ></div>
                            <div
                                className='buttonOverlay rright'
                                ref={this.controllerButtonRRightRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRRightRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRRightRef)}
                            ></div>
                            <div
                                className='buttonOverlay rdown'
                                ref={this.controllerButtonRDownRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRDownRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRDownRef)}
                            ></div>
                            <div
                                className='buttonOverlay lt'
                                ref={this.controllerButtonLTRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLTRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLTRef)}
                            ></div>
                            <div
                                className='buttonOverlay rt'
                                ref={this.controllerButtonRTRef}
                                onClick={this.openKeymaps}
                                onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRTRef)}
                                onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRTRef)}
                            ></div>
                        </div>
                    </div>
                    <div className='buttonAssignmentGroup'>
                        <div
                            ref={this.controllerButtonAssignmentRTRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRTRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_R_TRIGGER.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_R_TRIGGER.id, false)}
                                </button>
                            </span>
                        </div>
                        <br />
                        <div
                            ref={this.controllerButtonAssignmentRUpRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRUpRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_R_UP.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_R_UP.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentRRightRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRRightRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_R_RIGHT.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_R_RIGHT.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentRDownRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRDownRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_R_DOWN.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_R_DOWN.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentRLeftRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRLeftRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_R_LEFT.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_R_LEFT.id, false)}
                                </button>
                            </span>
                        </div>
                        <br />
                        <div
                            ref={this.controllerButtonAssignmentARef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonARef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonARef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_A.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_A.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentBRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonBRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonBRef)}
                        >
                            <span>
                                {VesEmulatorCommands.INPUT_B.label}
                            </span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_B.id, false)}
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
                <div className='controlsKeyboard'>
                    <div className='buttonAssignmentGroup'>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_PAUSE_TOGGLE.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_PAUSE_TOGGLE.id, false)}
                                </button>
                            </span>
                        </div>
                        <div
                            ref={this.controllerButtonAssignmentPowerRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonPowerRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonPowerRef)}
                        >
                            <span>{VesEmulatorCommands.INPUT_RESET.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_RESET.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_AUDIO_MUTE.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_AUDIO_MUTE.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.id, false)}
                                </button>
                            </span>
                        </div>
                    </div>
                    <div className='buttonAssignmentGroup'>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_FRAME_ADVANCE.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_FRAME_ADVANCE.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_REWIND.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_REWIND.id, false)}
                                </button>
                            </span>
                        </div>
                    </div>
                    <div className='buttonAssignmentGroup'>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_SAVE_STATE.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_SAVE_STATE.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_LOAD_STATE.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_LOAD_STATE.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.id, false)}
                                </button>
                            </span>
                        </div>
                    </div>
                    <div className='buttonAssignmentGroup'>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_FULLSCREEN.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_FULLSCREEN.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_SCREENSHOT.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_SCREENSHOT.id, false)}
                                </button>
                            </span>
                        </div>
                        <div>
                            <span>{VesEmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.label}</span>
                            <span>
                                <button className='theia-button secondary' onClick={this.openKeymaps}>
                                    {this.getKeybindingLabel(VesEmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id, false)}
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>;
    }

    protected toggleRefHighlighted = (buttonOverlayRef: React.RefObject<HTMLDivElement>) =>
        buttonOverlayRef.current?.classList.toggle('highlighted');

    protected getKeybindingLabel(
        commandId: string,
        wrapInBrackets: boolean = false
    ): string {
        const keybinding = this.keybindingRegistry.getKeybindingsForCommand(commandId)[0];
        let keybindingAccelerator = keybinding
            ? this.keybindingRegistry.acceleratorFor(keybinding, '+').join(', ')
            : '';

        keybindingAccelerator = keybindingAccelerator
            .replace(' ', nls.localize('vuengine/general/space', 'Space'));

        if (wrapInBrackets && keybindingAccelerator !== '') {
            keybindingAccelerator = ` (${keybindingAccelerator})`;
        }

        return keybindingAccelerator;
    }

    protected openKeymaps = async () => this.commandService.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
}
