// src/types/react-quill.d.ts
// Minimal ambient module declaration for react-quill to satisfy TypeScript.
// Keeps things typed as `any` while you use the runtime dynamic import.
declare module "react-quill" {
  import * as React from "react";
  const ReactQuill: React.ComponentType<any>;
  export default ReactQuill;
}