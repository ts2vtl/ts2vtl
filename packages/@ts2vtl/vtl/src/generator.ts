import * as vtl from './node-types';

export interface Generator {
  generateTemplate(node: vtl.Node): string;
}

export interface GeneratorOptions {
  /**
   * @default true
   */
  indentEnabled?: boolean;

  /**
   * @default "  "
   */
  indentText?: string;

  /**
   * @default false
   */
  stripComments?: boolean;
}

export function createGenerator(options: GeneratorOptions = {}): Generator {
  const {
    indentEnabled = true,
    indentText = '  ',
    stripComments = false,
  } = options;

  let data: string[] = [];
  let indentLevel = 0;
  let startOfLine = true;

  return {
    generateTemplate(node: vtl.Node) {
      data = [];

      visitNode(node);

      return data.join('');
    },
  };

  function visitNode(node: vtl.Node) {
    if (!node) {
      return;
    } else if (vtl.isBinaryExpression(node)) {
      visitNode(node.left);
      write(` ${vtl.TOKEN_TO_STRING[node.operatorToken]} `);
      visitNode(node.right);
    } else if (vtl.isBlock(node)) {
      visitNodeArray(node.elements);
    } else if (vtl.isCallExpression(node)) {
      visitNode(node.expression);
      write('(');

      const { length } = node.arguments;
      for (let i = 0; i < length; ++i) {
        const arg = node.arguments[i];
        visitNode(arg);
        if (i < length - 1) {
          write(', ');
        }
      }
      write(')');
    } else if (vtl.isFile(node)) {
      writeCommentLine(`Function: ${node.name}`);
      visitNode(node.block);
    } else if (vtl.isForeachDirective(node)) {
      write('#foreach(');
      visitNode(node.ref);
      write(' in ');
      visitNode(node.arg);
      writeLine(')');
      indent();
      visitNode(node.block);
      unindent();
      writeLine('#end');
    } else if (vtl.isIdentifier(node)) {
      write(node.text);
    } else if (vtl.isIndexNotation(node)) {
      visitNode(node.expression);
      write('[');
      visitNode(node.index);
      write(']');
    } else if (vtl.isIfDirective(node)) {
      write('#if(');
      visitNode(node.ifClause.condition);
      writeLine(')');
      indent();
      visitNode(node.ifClause.block);
      unindent();

      if (node.elseIfClauses) {
        for (const elseIfClause of node.elseIfClauses) {
          write('#elseif(');
          visitNode(elseIfClause.condition);
          writeLine(')');
          indent();
          visitNode(elseIfClause.block);
          unindent();
        }
      }

      if (node.elseClause) {
        writeLine('#else');
        indent();
        visitNode(node.elseClause);
        unindent();
      }

      writeLine('#end');
    } else if (vtl.isListLiteral(node)) {
      if (node.elements.length === 0) {
        write('[]');
      } else {
        writeLine('[');
        indent();

        const { length } = node.elements;
        for (let i = 0; i < length; ++i) {
          const element = node.elements[i];
          visitNode(element);
          if (i < length - 1) {
            write(',');
          }
          newLine();
        }

        unindent();
        write(']');
      }
    } else if (vtl.isMapLiteral(node)) {
      if (node.properties.length === 0) {
        write('{}');
      } else {
        writeLine('{');
        indent();

        const { length } = node.properties;
        for (let i = 0; i < length; ++i) {
          const prop = node.properties[i];
          visitNode(prop.name);
          write(': ');
          visitNode(prop.initializer);
          if (i < length - 1) {
            write(',');
          }
          newLine();
        }

        unindent();
        write('}');
      }
    } else if (vtl.isMethodReference(node)) {
      write('${');
      visitNode(node.expression);
      write('}');
    } else if (vtl.isNewLine(node)) {
      newLine();
    } else if (vtl.isNumericLiteral(node)) {
      write(node.value.toString());
    } else if (vtl.isParenthesizedExpression(node)) {
      write('(');
      visitNode(node.expression);
      write(')');
    } else if (vtl.isPrefixUnaryExpression(node)) {
      write(vtl.TOKEN_TO_STRING[node.operator]);
      visitNode(node.operand);
    } else if (vtl.isPropertyNotation(node)) {
      visitNode(node.expression);
      write('.');
      visitNode(node.name);
    } else if (vtl.isPropertyReference(node)) {
      write('${');
      visitNode(node.expression);
      write('}');
    } else if (vtl.isRangeLiteral(node)) {
      write('[');
      visitNode(node.begin);
      write('..');
      visitNode(node.end);
      write(']');
    } else if (vtl.isSetDirective(node)) {
      write('#set(');
      visitNode(node.ref);
      write(' = ');
      visitNode(node.arg);
      writeLine(')');
    } else if (vtl.isStringLiteral(node)) {
      write(`"${node.value}"`);
    } else if (vtl.isTemplateLiteral(node)) {
      write(`"${node.head}`);
      for (const span of node.templateSpans) {
        visitNode(span.expression);
        write(span.literal);
      }
      write('"');
    } else if (vtl.isTextNode(node)) {
      write(node.text);
    } else if (vtl.isVariableReference(node)) {
      write(`$${node.name.text}`);
    } else {
      write(`### ${vtl.SyntaxKind[node.kind]} not implemented ###`);
    }
  }

  function visitNodeArray(nodeArray: vtl.Node[]) {
    if (nodeArray) {
      nodeArray.forEach(visitNode);
    }
  }

  function indent() {
    indentLevel++;
  }

  function unindent() {
    indentLevel--;
  }

  function write(chunk: string) {
    if (startOfLine) {
      if (indentEnabled) {
        for (let i = 0; i < indentLevel; ++i) {
          data.push(indentText);
        }
      }
      startOfLine = false;
    }

    data.push(chunk);
  }

  function newLine() {
    data.push('\n');
    startOfLine = true;
  }

  function writeLine(chunk: string) {
    write(chunk);
    newLine();
  }

  function writeCommentLine(line: string) {
    if (stripComments) {
      return;
    }

    writeLine(`## ${line}`);
  }
}
