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
      label: BuildMode.Release,
      value: BuildMode.Release,
      description: BuildMode.Release,
      detail: "Includes no asserts or debug flags, for shipping only.",
      iconClass: (BuildMode.Release === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: BuildMode.Beta,
      value: BuildMode.Beta,
      description: BuildMode.Beta,
      detail: "Includes selected asserts, for testing the performance on hardware.",
      iconClass: (BuildMode.Beta === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: BuildMode.Tools,
      value: BuildMode.Tools,
      description: BuildMode.Tools,
      detail: "Includes selected asserts, includes debugging tools.",
      iconClass: (BuildMode.Tools === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: BuildMode.Debug,
      value: BuildMode.Debug,
      description: BuildMode.Debug,
      detail: "Includes all runtime assertions, includes debugging tools.",
      iconClass: (BuildMode.Debug === currentBuildMode) ? "fa fa-check" : "",
    },
    {
      label: BuildMode.Preprocessor,
      value: BuildMode.Preprocessor,
      description: BuildMode.Preprocessor,
      detail: "The .o files are preprocessor output instead of compiler output.",
      iconClass: (BuildMode.Preprocessor === currentBuildMode) ? "fa fa-check" : "",
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