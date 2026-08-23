import { Command, nls, PreferenceScope, PreferenceService } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import * as React from '@theia/core/shared/react';
import styled from 'styled-components';
import IMAGE_VB_CONTROLLER from '../../../../src/emulator/browser/images/vb-controller.png';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import RadioSelect from '../../../editors/browser/components/Common/Base/RadioSelect';
import ButtonAssignment from '../../../editors/browser/components/Common/ButtonAssignment/ButtonAssignment';
import { EmulatorCommands, EmulatorGamePadButton, emulatorGamePadCommand } from '../ves-emulator-commands';
import { EMULATOR_FOCUS_CONTEXT } from '../ves-emulator-context-key-service';
import { VesEmulatorPreferenceIds } from '../ves-emulator-preferences';

const ControlsOverlay = styled.div`
  align-items: flex-start;
  display: flex;
  height: 100%;
  padding: calc(var(--theia-ui-padding) * 4) calc(var(--theia-ui-padding) * 2);

  &>div {
    margin: auto;
  }

  &>div>div {
    align-self: center;
    display: flex;
    justify-content: space-between;
  }

  &>div>div {
    border-bottom: 1px dashed var(--theia-editorGroup-border);
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

const SameControls = styled.label`
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: var(--theia-ui-padding);
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
    border: 4px solid var(--theia-focusBorder);
    cursor: pointer;
    opacity: 0;
    position: absolute;

    &:hover,
    &.highlighted {
        opacity: 1;
    }

    &.power {
        height: 4%;
        left: 43.1%;
        top: 35%;
        width: 12.4%;
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
        left: 26.5%;
        top: 37.6%;
    }

    &.start {
        left: 34.2%;
        top: 41.35%;
    }

    &.lup {
        border-bottom-width: 0;
        left: 14.3%;
        top: 29%;
    }

    &.lleft {
        border-right-width: 0;
        left: 10%;
        top: 33.1%;
    }

    &.lright {
        border-left-width: 0;
        left: 19.5%;
        top: 33.1%;
    }

    &.ldown {
        border-top-width: 0;
        left: 14.3%;
        top: 38%;
    }

    &.lt {
        left: 13.2%;
        top: 6.9%;
    }

    &.b {
        right: 34.2%;
        top: 41.35%;
    }

    &.a {
        right: 26.4%;
        top: 37.6%;
    }

    &.rup {
        border-bottom-width: 0;
        right: 14.2%;
        top: 29%;
    }

    &.rleft {
        border-right-width: 0;
        right: 19.5%;
        top: 33.1%;
    }

    &.rright {
        border-left-width: 0;
        right: 9.9%;
        top: 33.1%;
    }

    &.rdown {
        border-top-width: 0;
        right: 14.2%;
        top: 38%;
    }

    &.rt {
        right: 13%;
        top: 6.9%;
    }
`;

export interface EmulatorControlsOverlayProps {
    keybindingRegistry: KeybindingRegistry
    preferenceService: PreferenceService
    vesCommonService: VesCommonService
}

export interface EmulatorControlsOverlayState {
    /** Whose mappings are being looked at, which is not tied to any emulator. */
    player: number
}

export class EmulatorControlsOverlay extends React.Component<EmulatorControlsOverlayProps, EmulatorControlsOverlayState> {
    protected keybindingRegistry: KeybindingRegistry;
    protected preferenceService: PreferenceService;
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

        this.vesCommonService = props.vesCommonService;
        this.keybindingRegistry = props.keybindingRegistry;
        this.preferenceService = props.preferenceService;
        this.state = { player: 1 };
    }

    /**
     * The command carrying one button's mapping for the player being looked
     * at. Player 2 has a set of its own, which is what makes its controls
     * separately configurable.
     */
    protected commandFor(button: EmulatorGamePadButton): Command {
        return emulatorGamePadCommand(button, this.state.player);
    }

    protected setPlayer(player: number): void {
        this.setState({ player });
    }

    /** Whether player 2 answers to player 1's keys. */
    protected get sameControls(): boolean {
        return this.preferenceService.get(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS, true
        ) ?? true;
    }

    protected async setSameControls(sameControls: boolean): Promise<void> {
        await this.preferenceService.set(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS,
            sameControls,
            PreferenceScope.User
        );
        // Nothing else here holds the answer, so the redraw has to be asked for.
        this.forceUpdate();
    }

    render(): React.JSX.Element {
        const isPlayer2 = this.state.player === 2;
        // Nothing to configure while player 2 is on player 1's keys, and the
        // function keys below are the application's rather than either
        // player's, so they belong to the first player's page only.
        const configurable = !isPlayer2 || !this.sameControls;

        return <ControlsOverlay>
            <div>
                <div>
                    <VContainer>
                        <RadioSelect
                            options={[
                                { value: 1, label: nls.localize('vuengine/emulator/player1', 'Player 1') },
                                { value: 2, label: nls.localize('vuengine/emulator/player2', 'Player 2') },
                            ]}
                            defaultValue={this.state.player}
                            onChange={options => this.setPlayer(options[0].value as number)}
                        />
                        {isPlayer2 &&
                            <SameControls>
                                <input
                                    type='checkbox'
                                    checked={this.sameControls}
                                    onChange={e => this.setSameControls(e.target.checked)}
                                />
                                {nls.localize('vuengine/emulator/sameAsPlayer1', 'Same as Player 1')}
                            </SameControls>
                        }
                    </VContainer>
                </div>
                {!configurable &&
                    <div>
                        <VContainer>
                            {nls.localize(
                                'vuengine/emulator/player2SameControlsHint',
                                'Player 2 answers to the same keys as player 1. Uncheck the box above to give it a set of its own.',
                            )}
                        </VContainer>
                    </div>
                }
                {configurable && <>
                <Controller>
                    <VContainer>
                        <ButtonAssignment
                            command={this.commandFor('lTrigger')}
                            refObject={this.controllerButtonAssignmentLTRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLTRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={this.commandFor('lUp')}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            refObject={this.controllerButtonAssignmentLUpRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLUpRef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('lRight')}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            refObject={this.controllerButtonAssignmentLRightRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLRightRef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('lDown')}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            refObject={this.controllerButtonAssignmentLDownRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLDownRef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('lLeft')}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            refObject={this.controllerButtonAssignmentLLeftRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonLLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonLLeftRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={this.commandFor('select')}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            refObject={this.controllerButtonAssignmentSelectRef}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonSelectRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonSelectRef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('start')}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
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
                            onClick={() => this.assignKeybinding(EmulatorCommands.INPUT_TOGGLE_LOW_POWER)}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentPowerRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentPowerRef)}
                        />
                        <ControllerButtonOverlay
                            className='select'
                            ref={this.controllerButtonSelectRef}
                            onClick={() => this.assignKeybinding(this.commandFor('select'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentSelectRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentSelectRef)}
                        />
                        <ControllerButtonOverlay
                            className='start'
                            ref={this.controllerButtonStartRef}
                            onClick={() => this.assignKeybinding(this.commandFor('start'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentStartRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentStartRef)}
                        />
                        <ControllerButtonOverlay
                            className='a'
                            ref={this.controllerButtonARef}
                            onClick={() => this.assignKeybinding(this.commandFor('a'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentARef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentARef)}
                        />
                        <ControllerButtonOverlay
                            className='b'
                            ref={this.controllerButtonBRef}
                            onClick={() => this.assignKeybinding(this.commandFor('b'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentBRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentBRef)}
                        />
                        <ControllerButtonOverlay
                            className='lup'
                            ref={this.controllerButtonLUpRef}
                            onClick={() => this.assignKeybinding(this.commandFor('lUp'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLUpRef)}
                        />
                        <ControllerButtonOverlay
                            className='lleft'
                            ref={this.controllerButtonLLeftRef}
                            onClick={() => this.assignKeybinding(this.commandFor('lLeft'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLLeftRef)}
                        />
                        <ControllerButtonOverlay
                            className='lright'
                            ref={this.controllerButtonLRightRef}
                            onClick={() => this.assignKeybinding(this.commandFor('lRight'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLRightRef)}
                        />
                        <ControllerButtonOverlay
                            className='ldown'
                            ref={this.controllerButtonLDownRef}
                            onClick={() => this.assignKeybinding(this.commandFor('lDown'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLDownRef)}
                        />
                        <ControllerButtonOverlay
                            className='rup'
                            ref={this.controllerButtonRUpRef}
                            onClick={() => this.assignKeybinding(this.commandFor('rUp'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRUpRef)}
                        />
                        <ControllerButtonOverlay
                            className='rleft'
                            ref={this.controllerButtonRLeftRef}
                            onClick={() => this.assignKeybinding(this.commandFor('rLeft'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRLeftRef)}
                        />
                        <ControllerButtonOverlay
                            className='rright'
                            ref={this.controllerButtonRRightRef}
                            onClick={() => this.assignKeybinding(this.commandFor('rRight'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRRightRef)}
                        />
                        <ControllerButtonOverlay
                            className='rdown'
                            ref={this.controllerButtonRDownRef}
                            onClick={() => this.assignKeybinding(this.commandFor('rDown'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRDownRef)}
                        />
                        <ControllerButtonOverlay
                            className='lt'
                            ref={this.controllerButtonLTRef}
                            onClick={() => this.assignKeybinding(this.commandFor('lTrigger'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentLTRef)}
                        />
                        <ControllerButtonOverlay
                            className='rt'
                            ref={this.controllerButtonRTRef}
                            onClick={() => this.assignKeybinding(this.commandFor('rTrigger'))}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonAssignmentRTRef)}
                        />
                    </ControllerImage>
                    <VContainer>
                        <ButtonAssignment
                            command={this.commandFor('rTrigger')}
                            refObject={this.controllerButtonAssignmentRTRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRTRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRTRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={this.commandFor('rUp')}
                            refObject={this.controllerButtonAssignmentRUpRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRUpRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRUpRef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('rRight')}
                            refObject={this.controllerButtonAssignmentRRightRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRRightRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRRightRef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('rDown')}
                            refObject={this.controllerButtonAssignmentRDownRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRDownRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRDownRef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('rLeft')}
                            refObject={this.controllerButtonAssignmentRLeftRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonRLeftRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonRLeftRef)}
                        />
                        <br />
                        <ButtonAssignment
                            command={this.commandFor('a')}
                            refObject={this.controllerButtonAssignmentARef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonARef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonARef)}
                        />
                        <ButtonAssignment
                            command={this.commandFor('b')}
                            refObject={this.controllerButtonAssignmentBRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonBRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonBRef)}
                        />
                    </VContainer>
                </Controller>
                </>}
                {this.state.player === 1 &&
                <HContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_PAUSE_TOGGLE}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_RESET}
                            refObject={this.controllerButtonAssignmentPowerRef}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                            onMouseEnter={() => this.toggleRefHighlighted(this.controllerButtonPowerRef)}
                            onMouseLeave={() => this.toggleRefHighlighted(this.controllerButtonPowerRef)}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_AUDIO_MUTE}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_TOGGLE_LOW_POWER}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                    </VContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_FRAME_ADVANCE}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_TOGGLE_FAST_FORWARD}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_TOGGLE_SLOWMOTION}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_REWIND}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                    </VContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_SAVE_STATE}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_LOAD_STATE}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_STATE_SLOT_INCREASE}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_STATE_SLOT_DECREASE}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                    </VContainer>
                    <VContainer>
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_FULLSCREEN}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_SCREENSHOT}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                        <ButtonAssignment
                            command={EmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY}
                            vesCommonService={this.vesCommonService}
                            when={EMULATOR_FOCUS_CONTEXT}
                        />
                    </VContainer>
                </HContainer>
                }
            </div>
        </ControlsOverlay>;
    }

    protected toggleRefHighlighted = (buttonOverlayRef: React.RefObject<HTMLDivElement>) =>
        buttonOverlayRef.current?.classList.toggle('highlighted');

    /**
     * Clicking a button on the picture maps a key to it, the same as clicking
     * its row. The rows read their mapping from the keybinding registry as
     * they render, so a change made here needs a redraw to show up in them.
     */
    protected assignKeybinding = async (command: Command) => {
        if (await this.vesCommonService.captureKeybinding(command, EMULATOR_FOCUS_CONTEXT)) {
            this.forceUpdate();
        }
    };

}
