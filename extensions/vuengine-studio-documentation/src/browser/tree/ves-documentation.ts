interface VesDocuments {
  name: string;
  members: VesDocumentationChild[];
}

interface VesDocumentationChild {
  name: string;
  file: string;
  children?: VesDocumentationChild[];
}
