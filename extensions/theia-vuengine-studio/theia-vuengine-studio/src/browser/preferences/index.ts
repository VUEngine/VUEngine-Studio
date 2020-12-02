import { interfaces } from "inversify";
import { createPreferenceProxy, PreferenceProxy, PreferenceService, PreferenceContribution, PreferenceSchema } from "@theia/core/lib/browser";

export const HostedPluginConfigSchema: PreferenceSchema = {
    type: "object",
    name: "VUEngine Bums",
    properties: {
        "hosted-plugin.watchMode": {
            type: "boolean",
            description: "Run watcher on plugin under development",
            default: true
        },
        "hosted-plugin.debugMode": {
            type: "string",
            description: "Using inspect or inspect-brk for Node.js debug",
            default: "inspect",
            enum: ["inspect", "inspect-brk"]
        }
    }
};

export interface HostedPluginConfiguration {
    "hosted-plugin.watchMode": boolean;
    "hosted-plugin.debugMode": string;
}

export const HostedPluginPreferences = Symbol("HostedPluginPreferences");
export type HostedPluginPreferences = PreferenceProxy<HostedPluginConfiguration>;

export function createNavigatorPreferences(preferences: PreferenceService): HostedPluginPreferences {
    return createPreferenceProxy(preferences, HostedPluginConfigSchema);
}

export function bindHostedPluginPreferences(bind: interfaces.Bind): void {
    bind(HostedPluginPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        return createNavigatorPreferences(preferences);
    });
    bind(PreferenceContribution).toConstantValue({ schema: HostedPluginConfigSchema });
}
