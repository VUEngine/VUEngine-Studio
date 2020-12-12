import { injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';

@injectable()
export class VesStateModel {

    // is cleaning
    protected _isCleaning = false;
    protected readonly onDidChangeIsCleaningEmitter = new Emitter<boolean>();
    readonly onDidChangeIsCleaning = this.onDidChangeIsCleaningEmitter.event;
    set isCleaning(flag: boolean) {
        this._isCleaning = flag;
        this.onDidChangeIsCleaningEmitter.fire(this._isCleaning);
    }
    get isCleaning(): boolean {
        return this._isCleaning;
    }

    // is building
    protected _isBuilding = false;
    protected readonly onDidChangeIsBuildingEmitter = new Emitter<boolean>();
    readonly onDidChangeIsBuilding = this.onDidChangeIsBuildingEmitter.event;
    set isBuilding(flag: boolean) {
        this._isBuilding = flag;
        this.onDidChangeIsBuildingEmitter.fire(this._isBuilding);
    }
    get isBuilding(): boolean {
        return this._isBuilding;
    }

    // flash cart connected
    protected _connectedFlashCart = "";
    protected readonly onDidChangeConnectedFlashCartEmitter = new Emitter<string>();
    readonly onDidChangeConnectedFlashCart = this.onDidChangeConnectedFlashCartEmitter.event;
    set connectedFlashCart(name: string) {
        this._connectedFlashCart = name;
        this.onDidChangeConnectedFlashCartEmitter.fire(this._connectedFlashCart);
    }
    get connectedFlashCart(): string {
        return this._connectedFlashCart;
    }

    // flash queued
    protected _isFlashQueued = false;
    protected readonly onDidChangeIsFlashQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsFlashQueued = this.onDidChangeIsFlashQueuedEmitter.event;
    set isFlashQueued(flag: boolean) {
        this._isFlashQueued = flag;
        this.onDidChangeIsBuildingEmitter.fire(this._isFlashQueued);
    }
    get isFlashQueued(): boolean {
        return this._isFlashQueued;
    }

    // run queued
    protected _isRunQueued = false;
    protected readonly onDidChangeIsRunQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsRunQueued = this.onDidChangeIsRunQueuedEmitter.event;
    set isRunQueued(flag: boolean) {
        this._isRunQueued = flag;
        this.onDidChangeIsBuildingEmitter.fire(this._isRunQueued);
    }
    get isRunQueued(): boolean {
        return this._isRunQueued;
    }

    // export queue
    protected _isExportQueued = false;
    protected _exportQueueInterval: any = 0;
    protected readonly onDidChangeIsExportQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsExportQueued = this.onDidChangeIsExportQueuedEmitter.event;
    get isExportQueued(): boolean {
        return this._isExportQueued;
    }
    public enqueueExport(interval: any) {
        this._isExportQueued = true;
        this.onDidChangeIsExportQueuedEmitter.fire(this._isExportQueued);
        this._exportQueueInterval = interval;
    }
    public unqueueExport() {
        this._isExportQueued = false;
        this.onDidChangeIsExportQueuedEmitter.fire(this._isExportQueued);
        clearInterval(this._exportQueueInterval);
    }
}