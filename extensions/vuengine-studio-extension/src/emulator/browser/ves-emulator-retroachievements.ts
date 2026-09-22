import { Endpoint } from '@theia/core/lib/browser';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import {
    RetroAchievementsCredentials,
    RetroAchievementsTransport,
} from 'vueport-core/lib/browser/emulator-retroachievements';

const STORAGE_KEY = 'ves-emulator-retroachievements';

export class VesEmulatorRetroAchievementsTransport implements RetroAchievementsTransport {
    get available(): boolean {
        return true;
    }

    async request(
        method: 'GET' | 'POST',
        url: string,
        body: string | undefined,
        contentType: string | undefined,
    ): Promise<{ status: number, body: string }> {
        const relay = new Endpoint({ path: '/emulator/retroachievements' }).getRestUrl().toString();
        const response = await fetch(relay, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ method, url, body, contentType }),
        });
        if (!response.ok) {
            throw new Error(`The RetroAchievements relay answered ${response.status}.`);
        }
        return response.json() as Promise<{ status: number, body: string }>;
    }
}

export class VesEmulatorTheiaRetroAchievementsCredentials implements RetroAchievementsCredentials {

    constructor(protected readonly storageService: StorageService) { }

    async load(): Promise<{ username: string, token: string } | undefined> {
        const stored = await this.storageService.getData<{ username?: string, token?: string }>(STORAGE_KEY);
        return stored?.username && stored.token
            ? { username: stored.username, token: stored.token }
            : undefined;
    }

    async save(credentials: { username: string, token: string }): Promise<void> {
        await this.storageService.setData(STORAGE_KEY, credentials);
    }

    async clear(): Promise<void> {
        await this.storageService.setData(STORAGE_KEY, undefined);
    }
}
