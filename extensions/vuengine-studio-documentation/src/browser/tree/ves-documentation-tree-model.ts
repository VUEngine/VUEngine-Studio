
import { injectable, inject, postConstruct } from 'inversify';
import { join as joinPath } from 'path';
import { env } from 'process';
import URI from '@theia/core/lib/common/uri';
import { TreeModelImpl } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

import { VesDocumentationChild, VesDocumentationChildNode, VesDocumentationRootNode, VesDocumentationTree, VesDocumentTree } from './ves-documentation-tree';

@injectable()
export class VesDocumentationTreeModel extends TreeModelImpl {

    @inject(FileService) protected readonly fileService: FileService;
    @inject(VesDocumentationTree) protected readonly tree: VesDocumentationTree;

    getTree(): VesDocumentationTree {
        return this.tree;
    }

    @postConstruct()
    async init(): Promise<void> {
        const documents: VesDocumentTree = {
            members: [
                {
                    name: 'Handbook',
                    children: []
                },
                {
                    name: 'Engine Code Docs',
                    children: [
                        {
                            name: 'Graphics',
                        },
                        {
                            name: 'Printing',
                        }
                    ]
                },
                {
                    name: 'Hardware Documentation',
                    file: '<vbsts>'
                }
            ]
        };

        const handbookIndexUri = new URI(this.getHandbookIndex());
        const handbookIndexContents = await this.fileService.readFile(handbookIndexUri); /* eslint-disable-line */
        const handbookIndex = JSON.parse(handbookIndexContents.value.toString());

        for (const index in handbookIndex) {
            if (handbookIndex.hasOwnProperty(index)) {
                const newNode: VesDocumentationChild = {
                    name: index,
                    children: []
                };

                for (const documentIndex in handbookIndex[index]) {
                    if (handbookIndex[index].hasOwnProperty(documentIndex)) {
                        newNode.children?.push(handbookIndex[index][documentIndex]);
                    }
                }

                documents.members[0].children?.push(newNode);
            }
        }

        const root: VesDocumentationRootNode = {
            id: 'ves-documentation-root',
            name: 'ves-documentation-root',
            visible: false,
            parent: undefined,
            children: [],
            documents
        };

        this.tree.root = root;
    }

    protected getResourcesPath(): string {
        return env.THEIA_APP_PROJECT_PATH ?? '';
    }

    getHandbookRoot(): string {
        return joinPath(
            this.getResourcesPath(),
            'documentation',
            'vuengine-studio-documentation',
        );
    }

    protected getHandbookIndex(): string {
        return joinPath(
            this.getHandbookRoot(),
            'index.json',
        );
    }
}
