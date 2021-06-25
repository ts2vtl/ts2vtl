import type * as tsMorph from "ts-morph";

export interface VTLError {
  message: string;
  node?: tsMorph.Node;
}

export function printVTLErrors(error: VTLError | VTLError[]) {
  if (Array.isArray(error)) {
    for (const e of error) {
      printVTLErrors(e);
    }
    return;
  }

  const { message, node } = error;
  let errorMessage = `VTLError: ${message}`;

  if (node) {
    const sourceFile = node.getSourceFile();
    const start = sourceFile.getLineAndColumnAtPos(node.getStart());

    errorMessage += `\n\tat ${sourceFile.getFilePath()}:${start.line + 1}:${start.column + 1}`;
  }

  console.error(errorMessage);
}
