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

  const currentBuildMode = preferenceService.get(VesBuildModePreference.id) as BuildMode;

  const quickPickOptions: QuickPickOptions = {
    title: "Set build mode",
    placeholder: "Select which mode to build in"
  };

  const buildTypes = [
    {
      label: capitalizeFirstLetter(BuildMode.release),
      value: BuildMode.release,
      description: BuildMode.release,
      detail: "Includes no asserts or debug flags, for shipping only.",
      iconClass: (BuildMode.release === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: capitalizeFirstLetter(BuildMode.beta),
      value: BuildMode.beta,
      description: BuildMode.beta,
      detail: "Includes selected asserts, for testing the performance on hardware.",
      iconClass: (BuildMode.beta === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: capitalizeFirstLetter(BuildMode.tools),
      value: BuildMode.tools,
      description: BuildMode.tools,
      detail: "Includes selected asserts, includes debugging tools.",
      iconClass: (BuildMode.tools === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: capitalizeFirstLetter(BuildMode.debug),
      value: BuildMode.debug,
      description: BuildMode.debug,
      detail: "Includes all runtime assertions, includes debugging tools.",
      iconClass: (BuildMode.debug === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: capitalizeFirstLetter(BuildMode.preprocessor),
      value: BuildMode.preprocessor,
      description: BuildMode.preprocessor,
      detail: "The .o files are preprocessor output instead of compiler output.",
      iconClass: (BuildMode.preprocessor === currentBuildMode) ? "fa fa-check" : "",
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

function capitalizeFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}