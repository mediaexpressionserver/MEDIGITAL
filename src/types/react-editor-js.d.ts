// silence and provide minimal typing for react-editor-js
declare module "react-editor-js" {
  import type EditorJS from "@editorjs/editorjs";
  import type { OutputData } from "@editorjs/editorjs";
  import * as React from "react";

  export type ReactEditorJSProps = {
    onInitialize?: (editor: EditorJS) => void;
    tools?: any;
    data?: OutputData;
    placeholder?: string;
    [k: string]: any;
  };

  // factory that returns a React component
  export function createReactEditorJS(): React.ComponentType<ReactEditorJSProps>;

  // default unknown export (some bundlers expose default)
  const _default: any;
  export default _default;
}