import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VueportFile, VueportStorage } from 'vueport-core/lib/common/emulator-host';

export class VesEmulatorStorage implements VueportStorage {

    constructor(
        protected readonly fileService: FileService,
        protected readonly workspaceService: WorkspaceService,
    ) { }

    async read(path: string): Promise<Uint8Array> {
        return (await this.fileService.readFile(new URI(path))).value.buffer;
    }

    async readText(path: string): Promise<string> {
        return (await this.fileService.readFile(new URI(path))).value.toString();
    }

    async write(path: string, data: Uint8Array): Promise<void> {
        await this.fileService.writeFile(new URI(path), BinaryBuffer.wrap(data));
    }

    async writeText(path: string, text: string): Promise<void> {
        await this.fileService.writeFile(new URI(path), BinaryBuffer.fromString(text));
    }

    async exists(path: string): Promise<boolean> {
        return this.fileService.exists(new URI(path));
    }

    async delete(path: string): Promise<void> {
        await this.fileService.delete(new URI(path));
    }

    async list(directory: string): Promise<VueportFile[]> {
        const resolved = await this.fileService.resolve(new URI(directory));
        return (resolved.children ?? [])
            .filter(child => !child.isDirectory)
            .map(child => ({
                path: child.resource.toString(),
                name: child.resource.path.base,
                size: child.size ?? 0,
            }));
    }

    parent(path: string): string {
        return new URI(path).parent.toString();
    }

    stem(path: string): string {
        return new URI(path).path.name;
    }

    name(path: string): string {
        return new URI(path).path.base;
    }

    join(directory: string, name: string): string {
        return new URI(directory).resolve(name).toString();
    }

    async export(name: string, data: Uint8Array): Promise<void> {
        await this.workspaceService.ready;
        const root = this.workspaceService.tryGetRoots()[0]?.resource;
        if (!root) {
            return;
        }
        await this.fileService.writeFile(
            root.resolve(name),
            BinaryBuffer.wrap(data)
        );
    }
}
