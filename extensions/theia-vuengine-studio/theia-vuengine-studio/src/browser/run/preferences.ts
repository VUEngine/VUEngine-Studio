import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";

const VesRunPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    "vuengine.emulators": {
      type: "array",
      label: "Emulator Configurations",
      description: "Emulator configurations",
      items: {
        type: "object",
        title: "Emulator configs",
        properties: {
          name: {
            type: "string",
            description: "Name of the emulator configuration",
            label: "Name",
          },
          path: {
            type: "string",
            description: "Full path to emulator",
            label: "Path",
          },
          args: {
            type: "string",
            multiline: true,
            description: "Arguments to pass to emulator",
            label: "Arguments",
          },
        },
      },
      default: [
        {
          name: "Mednafen (2D)",
          path: "%MEDNAFEN%",
          args:
            "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'disabled' -'vb.anaglyph.lcolor' '0xff0000' -'vb.anaglyph.rcolor' '0x000000' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
        },
        {
          name: "Mednafen (Anaglyph Red/Blue)",
          path: "%MEDNAFEN%",
          args:
            "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'red_blue' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
        },
      ],
    },
  },
};

const VesRunPreferences = Symbol("VesRunPreferences");
type VesRunPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(
  preferences: PreferenceService
): VesRunPreferences {
  return createPreferenceProxy(preferences, VesRunPreferenceSchema);
}

export function bindVesRunPreferences(bind: interfaces.Bind): void {
  bind(VesRunPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createNavigatorPreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: VesRunPreferenceSchema,
  });
}
