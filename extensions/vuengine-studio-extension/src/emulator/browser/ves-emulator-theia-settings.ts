import { PreferenceScope, PreferenceService } from '@theia/core';
import { Emitter, Event } from 'vueport-core/lib/common/emulator-events';
import {
    VUEPORT_DEFAULTS,
    VueportConfig,
    VueportSettings,
} from 'vueport-core/lib/common/emulator-settings';
import { VUEPORT_PREFERENCE_IDS } from './ves-emulator-preferences';

/** Theia preference ids back to the emulator's own names. */
const BY_PREFERENCE_ID = new Map<string, keyof VueportConfig>(
    (Object.entries(VUEPORT_PREFERENCE_IDS) as [keyof VueportConfig, string][])
        .map(([key, id]) => [id, key])
);

/** The studio's side of {@link VueportSettings}. */
export class VesEmulatorTheiaSettings implements VueportSettings {

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

    /**
     * Written at user scope, which is where the emulator's own windows have
     * always put them: they are how somebody likes the emulator to behave
     * rather than anything about the project in front of them.
     */
    async set<K extends keyof VueportConfig>(key: K, value: VueportConfig[K]): Promise<void> {
        await this.preferenceService.set(
            VUEPORT_PREFERENCE_IDS[key], value, PreferenceScope.User
        );
    }
}
