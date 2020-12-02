import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";

const VesFlashCartsPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    "flashCarts.customFlashCarts": {
      type: "array",
      label: "Flash cart configurations",
      description: "Additional configurations for custom flash carts",
      items: {
        type: "object",
        title: "Flash cart config",
        properties: {
          name: {
            type: "string",
            description: "Name of the flash cart configuration",
          },
          vid: {
            type: "number",
            description: "USB vendor ID (VID) of the flash cart",
            minimum: 0,
            maximum: 65535,
          },
          pid: {
            type: "number",
            description: "USB product ID (PID) of the flash cart",
            minimum: 0,
            maximum: 65535,
          },
          manufacturer: {
            type: "string",
            description: "USB manufacturer string of the flash cart (optional)",
          },
          product: {
            type: "string",
            description: "USB product string of the flash cart (optional)",
          },
          serialNumber: {
            type: "string",
            description:
              "USB serial number string of the flash cart (optional)",
          },
          size: {
            type: "number",
            description: "Size of flash cart (in Mbit)",
          },
          path: {
            type: "string",
            description: "Full path to flasher software",
          },
          args: {
            type: "string",
            multiline: true,
            description: "Arguments to pass to flasher software",
          },
          padRom: {
            type: "boolean",
            description:
              "Should ROMs be padded before being passed to the flasher program?",
          },
        },
      },
      default: [],
    },
  },
};

const VesFlashCartsPreferences = Symbol("VesFlashCartsPreferences");
type VesFlashCartsPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(
  preferences: PreferenceService
): VesFlashCartsPreferences {
  return createPreferenceProxy(preferences, VesFlashCartsPreferenceSchema);
}

export function bindVesFlashCartsPreferences(bind: interfaces.Bind): void {
  bind(VesFlashCartsPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createNavigatorPreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: VesFlashCartsPreferenceSchema,
  });
}
