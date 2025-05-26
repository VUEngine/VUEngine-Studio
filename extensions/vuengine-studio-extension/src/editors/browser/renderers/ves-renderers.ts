import VesActorEditorControl from './actor-editor/ves-actor-editor-control';
import VesActorEditorControlTester from './actor-editor/ves-actor-editor-control-tester';
import VesBrightnessRepeatEditorControl from './brightness-repeat-editor/ves-brightness-repeat-editor-control';
import VesBrightnessRepeatEditorControlTester from './brightness-repeat-editor/ves-brightness-repeat-editor-control-tester';
import VesColumnTableEditorControl from './column-table-editor/ves-column-table-editor-control';
import VesColumnTableEditorControlTester from './column-table-editor/ves-column-table-editor-control-tester';
import vesCompilerConfigEditorControl from './compiler-config-editor/ves-compiler-config-editor-control';
import vesCompilerConfigEditorControlTester from './compiler-config-editor/ves-compiler-config-editor-control-tester';
import vesEngineConfigEditorControl from './engine-config-editor/ves-engine-config-editor-control';
import vesEngineConfigEditorControlTester from './engine-config-editor/ves-engine-config-editor-control-tester';
import VesFontEditorControl from './font-editor/ves-font-editor-control';
import VesFontEditorControlTester from './font-editor/ves-font-editor-control-tester';
import VesImageEditorControl from './image-editor/ves-image-editor-control';
import VesImageEditorControlTester from './image-editor/ves-image-editor-control-tester';
import VesLogicEditorControl from './logic-editor/ves-logic-editor-control';
import vesLogicEditorControlTester from './logic-editor/ves-logic-editor-control-tester';
import VesSoundEditorControl from './sound-editor/ves-sound-editor-control';
import VesSoundEditorControlTester from './sound-editor/ves-sound-editor-control-tester';
import VesPcmEditorControl from './pcm-editor/ves-pcm-editor-control';
import VesPcmEditorControlTester from './pcm-editor/ves-pcm-editor-control-tester';
import vesPixelEditorControl from './pixel-editor/ves-pixel-editor-control';
import vesPixelEditorControlTester from './pixel-editor/ves-pixel-editor-control-tester';
import VesPluginFileEditorControl from './plugin-file-editor/ves-plugin-file-editor-control';
import VesPluginFileEditorControlTester from './plugin-file-editor/ves-plugin-file-editor-control-tester';
import vesRominfoEditorControl from './rominfo-editor/ves-rominfo-editor-control';
import vesRominfoEditorControlTester from './rominfo-editor/ves-rominfo-editor-control-tester';
import VesRumbleEffectEditorControl from './rumble-effect-editor/ves-rumble-effect-editor-control';
import VesRumbleEffectEditorControlTester from './rumble-effect-editor/ves-rumble-effect-editor-control-tester';
import vesSimpleListEditorControl from './simple-list-editor/ves-simple-list-editor-control';
import vesSimpleListEditorControlTester from './simple-list-editor/ves-simple-list-editor-control-tester';
import vesStageEditorControl from './stage-editor/ves-stage-editor-control';
import vesStageEditorControlTester from './stage-editor/ves-stage-editor-control-tester';
import VesTranslationsEditorControl from './translations-editor/ves-translations-editor-control';
import VesTranslationsEditorControlTester from './translations-editor/ves-translations-editor-control-tester';
import vesVsuSandboxControl from './vsu-sandbox/ves-vsu-sandbox-control';
import vesVsuSandboxControlTester from './vsu-sandbox/ves-vsu-sandbox-control-tester';

export const VES_RENDERERS = [
    { tester: VesActorEditorControlTester, renderer: VesActorEditorControl },
    { tester: VesBrightnessRepeatEditorControlTester, renderer: VesBrightnessRepeatEditorControl },
    { tester: VesColumnTableEditorControlTester, renderer: VesColumnTableEditorControl },
    { tester: vesCompilerConfigEditorControlTester, renderer: vesCompilerConfigEditorControl },
    { tester: vesEngineConfigEditorControlTester, renderer: vesEngineConfigEditorControl },
    { tester: VesFontEditorControlTester, renderer: VesFontEditorControl },
    { tester: VesImageEditorControlTester, renderer: VesImageEditorControl },
    { tester: vesLogicEditorControlTester, renderer: VesLogicEditorControl },
    { tester: VesSoundEditorControlTester, renderer: VesSoundEditorControl },
    { tester: VesPcmEditorControlTester, renderer: VesPcmEditorControl },
    { tester: vesPixelEditorControlTester, renderer: vesPixelEditorControl },
    { tester: VesPluginFileEditorControlTester, renderer: VesPluginFileEditorControl },
    { tester: vesRominfoEditorControlTester, renderer: vesRominfoEditorControl },
    { tester: VesRumbleEffectEditorControlTester, renderer: VesRumbleEffectEditorControl },
    { tester: vesSimpleListEditorControlTester, renderer: vesSimpleListEditorControl },
    { tester: vesStageEditorControlTester, renderer: vesStageEditorControl },
    { tester: VesTranslationsEditorControlTester, renderer: VesTranslationsEditorControl },
    { tester: vesVsuSandboxControlTester, renderer: vesVsuSandboxControl },
];
