import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { QuickPickOptions, QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { VesBuildModePreference } from "../preferences";
import { BuildMode } from "../types";

export async function setModeCommand(
  preferenceService: PreferenceService,
  quickPickService: QuickPickService,
  buildMode?: BuildMode
) {
  if (buildMode) {
    setBuildMode(preferenceService, buildMode);
    return;
  }

  const quickPickOptions: QuickPickOptions = {
    title: "Set build mode",
    placeholder: "Select which mode to build in"
  };

  const buildTypes = [
    {
      label: "Release Mode",
      value: BuildMode.release,
      description: `(${BuildMode.release})`,
      detail: "Includes no asserts or debug flags, for shipping only."
    },
    {
      label: "Beta Mode",
      value: BuildMode.beta,
      description: `(${BuildMode.beta})`,
      detail: "Includes selected asserts, for testing the performance on hardware."
    },
    {
      label: "Tools Mode",
      value: BuildMode.tools,
      description: `(${BuildMode.tools})`,
      detail: "Includes selected asserts, includes debugging tools."
    },
    {
      label: "Debug Mode",
      value: BuildMode.debug,
      description: `(${BuildMode.debug})`,
      detail: "Includes all runtime assertions, includes debugging tools."
    },
    {
      label: "Preprocessor Mode",
      value: BuildMode.preprocessor,
      description: `(${BuildMode.preprocessor})`,
      detail: "The .o files are preprocessor output instead of compiler output."
    }
  ];

  quickPickService.show<string>(buildTypes, quickPickOptions).then(selection => {
    if (!selection) {
      return;
    }
    setBuildMode(preferenceService, selection);
  });
}
function setBuildMode(preferenceService: PreferenceService, buildMode: string) {
  preferenceService.set(VesBuildModePreference.id, buildMode, PreferenceScope.User);
}