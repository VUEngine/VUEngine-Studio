import { PreferenceScope, PreferenceService } from '@theia/core';
import { Emitter, Event } from 'vueport-core/lib/common/emulator-events';
import {
    VUEPORT_DEFAULTS,
    VueportConfig,
    VueportSettings,
} from 'vueport-core/lib/common/emulator-settings';
import { VUEPORT_PREFERENCE_IDS } from './ves-emulator-preferences';

const BY_PREFERENCE_ID = new Map<string, keyof VueportConfig>(
    (Object.entries(VUEPORT_PREFERENCE_IDS) as [keyof VueportConfig, string][])
        .map(([key, id]) => [id, key])
);

export class VesEmulatorSettings implements VueportSettings {

    protected readonly onDidChangeEmitter = new Emitter<keyof VueportConfig>();
    readonly onDidChange: Event<keyof VueportConfig> = this.onDidChangeEmitter.event;

    constructor(protected readonly preferenceService: PreferenceService) {
        this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
            const key = BY_PREFERENCE_ID.get(preferenceName);
            if (key) {
                this.onDidChangeEmitter.fire(key);
            }
        });
    }

    get ready(): Promise<void> {
        return this.preferenceService.ready;
    }

    get<K extends keyof VueportConfig>(key: K): VueportConfig[K] {
        return this.preferenceService.get<VueportConfig[K]>(
            VUEPORT_PREFERENCE_IDS[key],
            VUEPORT_DEFAULTS[key]
        ) as VueportConfig[K];
    }

    async set<K extends keyof VueportConfig>(key: K, value: VueportConfig[K]): Promise<void> {
        await this.preferenceService.set(
            VUEPORT_PREFERENCE_IDS[key], value, PreferenceScope.User
        );
    }
}
