import { CommandService } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import * as React from '@theia/core/shared/react';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';
import styled from 'styled-components';
import IMAGE_VB_CONTROLLER from '../../../../src/emulator/browser/images/vb-controller.png';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import ButtonAssignment from '../../../editors/browser/components/Common/ButtonAssignment/ButtonAssignment';
import { VesEmulatorCommands } from '../ves-emulator-commands';

const ControlsOverlay = styled.div`
  align-items: flex-start;
  background-color: var(--theia-editor-background);
  bottom: 0;
  display: flex;
  left: 0;
  overflow: auto;
  padding: calc(var(--theia-ui-padding) * 4) calc(var(--theia-ui-padding) * 2);
  position: absolute;
  right: 0;
  top: 50px;
  z-index: 10;

  &>div {
    margin: auto;
  }

  &>div>div {
    align-self: center;
    display: flex;
    justify-content: space-between;
  }

  &>div>div {
    border-bottom: 1px dashed var(--theia-activityBar-background);
    margin-bottom: calc(var(--theia-ui-padding) * 4);
    padding-bottom: calc(var(--theia-ui-padding) * 4);
  }

  &>div>div:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const Controller = styled.div`
    align-items: center;

    .controllerImage {
        margin: 0 calc(var(--theia-ui-padding) * 4);
        position: relative;
    }

    .controllerImage img {
        max-width: 500px;
        width: 100%;
    }
`;

const ControllerImage = styled.div`
    margin: 0 calc(var(--theia-ui-padding) * 4);
    position: relative;

    img {
        max-width: 500px;
        width: 100%;
    }
`;

const ControllerButtonOverlay = styled.div`
    background-color: #fff;
    cursor: pointer;
    opacity: 0;
    position: absolute;

    &:hover,
    &.highlighted {
        opacity: 1;
    }

    &.power {
        height: 4%;
        left: 44.5%;
        top: 36.3%;
        transform: perspective(7px) rotateX(-10deg);
        width: 11%;
        border-radius: 2px;
    }

    &.select,
    &.start,
    &.a,
    &.b,
    &.lt,
    &.rt {
        border-radius: 50%;
        height: 7.8%;
        width: 7.8%;
    }

    &.lup,
    &.lleft,
    &.lright,
    &.ldown,
    &.rup,
    &.rleft,
    &.rright,
    &.rdown {
        border-radius: 2px;
        height: 5.5%;
        width: 5.5%;
    }

    &.select {
        left: 27.2%;
        top: 38.7%;
    }

    &.start {
        left: 34.8%;
        top: 42.2%;
    }

    &.lup {
        border-bottom-width: 0;
        left: 15%;
        top: 30%;
    }

    &.lleft {
        border-right-width: 0;
        left: 10.9%;
        top: 33.9%;
    }

    &.lright {
        border-left-width: 0;
        left: 19.5%;
        top: 33.9%;
    }

    &.ldown {
        border-top-width: 0;
        left: 15%;
        top: 38.4%;
    }

    &.lt {
        left: 13.8%;
        top: 7.7%;
    }

    &.b {
        right: 34.8%;
        top: 42.2%;
    }

    &.a {
        right: 27.2%;
        top: 38.7%;
    }

    &.rup {
        border-bottom-width: 0;
        right: 15%;
        top: 30%;
    }

    &.rleft {
        border-right-width: 0;
        right: 19.5%;
        top: 33.9%;
    }

    &.rright {
        border-left-width: 0;
        right: 10.9%;
        top: 33.9%;
    }

    &.rdown {
        border-top-width: 0;
        right: 15%;
        top: 38.4%;
    }

    &.rt {
        right: 13.8%;
        top: 7.7%;
    }
`;

export interface EmulatorControlsOverlayProps {
    commandService: CommandService
    keybindingRegistry: KeybindingRegistry
    vesCommonService: VesCommonService
}

export interface EmulatorControlsOverlayState {
}

export class EmulatorControlsOverlay extends React.Component<EmulatorControlsOverlayProps, EmulatorControlsOverlayState> {
    protected commandService: CommandService;
    protected keybindingRegistry: KeybindingRegistry;
    protected vesCommonService: VesCommonService;

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

    constructor(props: EmulatorControlsOverlayProps) {
        super(props);

        this.commandService = props.commandService;
        this.vesCommonService = props.vesCommonService;
        this.keybindingRegistry = props.keybindingRegistry;
    }

    render(): React.JSX.Element {
        return <ControlsOverlay>
            <div>
                <Controller>
                    <VContainer>
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_L_TRIGGER}
                            refObject={this.controllerButtonAssignmentLTRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLTRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_L_UP}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            refObject={this.controllerButtonAssignmentLUpRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLUpRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_L_RIGHT}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            refObject={this.controllerButtonAssignmentLRightRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLRightRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_L_DOWN}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            refObject={this.controllerButtonAssignmentLDownRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLDownRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_L_LEFT}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            refObject={this.controllerButtonAssignmentLLeftRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLLeftRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_SELECT}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            refObject={this.controllerButtonAssignmentSelectRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonSelectRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonSelectRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_START}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            refObject={this.controllerButtonAssignmentStartRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonStartRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonStartRef)}
                        />
                    </VContainer>
                    <ControllerImage>
                        <img src={IMAGE_VB_CONTROLLER} />
                        <ControllerButtonOverlay
                            className='power'
                            ref={this.controllerButtonPowerRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentPowerRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentPowerRef)}
                        />
                        <ControllerButtonOverlay
                            className='select'
                            ref={this.controllerButtonSelectRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentSelectRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentSelectRef)}
                        />
                        <ControllerButtonOverlay
                            className='start'
                            ref={this.controllerButtonStartRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentStartRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentStartRef)}
                        />
                        <ControllerButtonOverlay
                            className='a'
                            ref={this.controllerButtonARef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentARef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentARef)}
                        />
                        <ControllerButtonOverlay
                            className='b'
                            ref={this.controllerButtonBRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentBRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentBRef)}
                        />
                        <ControllerButtonOverlay
                            className='lup'
                            ref={this.controllerButtonLUpRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLUpRef)}
                        />
                        <ControllerButtonOverlay
                            className='lleft'
                            ref={this.controllerButtonLLeftRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLLeftRef)}
                        />
                        <ControllerButtonOverlay
                            className='lright'
                            ref={this.controllerButtonLRightRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLRightRef)}
                        />
                        <ControllerButtonOverlay
                            className='ldown'
                            ref={this.controllerButtonLDownRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLDownRef)}
                        />
                        <ControllerButtonOverlay
                            className='rup'
                            ref={this.controllerButtonRUpRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRUpRef)}
                        />
                        <ControllerButtonOverlay
                            className='rleft'
                            ref={this.controllerButtonRLeftRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRLeftRef)}
                        />
                        <ControllerButtonOverlay
                            className='rright'
                            ref={this.controllerButtonRRightRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRRightRef)}
                        />
                        <ControllerButtonOverlay
                            className='rdown'
                            ref={this.controllerButtonRDownRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRDownRef)}
                        />
                        <ControllerButtonOverlay
                            className='lt'
                            ref={this.controllerButtonLTRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLTRef)}
                        />
                        <ControllerButtonOverlay
                            className='rt'
                            ref={this.controllerButtonRTRef}
                            onClick={this.openKeymaps}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRTRef)}
                        />
                    </ControllerImage>
                    <VContainer>
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_R_TRIGGER}
                            refObject={this.controllerButtonAssignmentRTRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRTRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_R_UP}
                            refObject={this.controllerButtonAssignmentRUpRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRUpRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_R_RIGHT}
                            refObject={this.controllerButtonAssignmentRRightRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRRightRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_R_DOWN}
                            refObject={this.controllerButtonAssignmentRDownRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRDownRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_R_LEFT}
                            refObject={this.controllerButtonAssignmentRLeftRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRLeftRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_A}
                            refObject={this.controllerButtonAssignmentARef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonARef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonARef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_B}
                            refObject={this.controllerButtonAssignmentBRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonBRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonBRef)}
                        />
                    </VContainer>
                </Controller>
                <HContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_PAUSE_TOGGLE}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_RESET}
                            refObject={this.controllerButtonAssignmentPowerRef}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonPowerRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonPowerRef)}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_AUDIO_MUTE}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                    </VContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_FRAME_ADVANCE}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_REWIND}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                    </VContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_SAVE_STATE}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_LOAD_STATE}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                    </VContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_FULLSCREEN}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_SCREENSHOT}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                        <ButtonAssignment
                            command={VesEmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY}
                            commandService={this.commandService}
                            vesCommonService={this.vesCommonService}
                        />
                    </VContainer>
                </HContainer>
            </div>
        </ControlsOverlay>;
    }

    protected toggleRefHighlighted = (buttonOverlayRef: React.RefObject<HTMLDivElement>) =>
        buttonOverlayRef.current?.classList.toggle('highlighted');

    protected openKeymaps = async () => this.commandService.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
}
