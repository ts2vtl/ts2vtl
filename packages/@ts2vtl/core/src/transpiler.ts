import {
  ArrayLiteralExpression,
  BinaryExpression,
  Block,
  CallExpression,
  ElementAccessExpression,
  Expression,
  ExpressionStatement,
  ForOfStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  Node,
  NumericLiteral,
  ObjectLiteralExpression,
  ParenthesizedExpression,
  PrefixUnaryExpression,
  PropertyAccessExpression,
  ReturnStatement,
  SourceFile,
  Statement,
  StringLiteral,
  TemplateExpression,
  ts,
  VariableDeclaration,
  VariableStatement,
} from "ts-morph";
import * as vtl from '@ts2vtl/vtl';
import { createPropertyAssignment, createStringLiteral } from "@ts2vtl/vtl";


const TS_TO_VTL_FOR_BINARY_OPEATOR_TOKEN: { [kind: number]: vtl.BinaryOperatorToken } = {
  [ts.SyntaxKind.PlusToken]: vtl.SyntaxKind.PlusToken,
  [ts.SyntaxKind.MinusToken]: vtl.SyntaxKind.MinusToken,
  [ts.SyntaxKind.AsteriskToken]: vtl.SyntaxKind.AsteriskToken,
  [ts.SyntaxKind.SlashToken]: vtl.SyntaxKind.SlashToken,
  [ts.SyntaxKind.PercentToken]: vtl.SyntaxKind.PercentToken,
  [ts.SyntaxKind.EqualsToken]: vtl.SyntaxKind.EqualsToken,
  [ts.SyntaxKind.EqualsEqualsToken]: vtl.SyntaxKind.EqualsEqualsToken,
  [ts.SyntaxKind.EqualsEqualsEqualsToken]: vtl.SyntaxKind.EqualsEqualsToken,
  [ts.SyntaxKind.ExclamationEqualsToken]: vtl.SyntaxKind.ExclamationEqualsToken,
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: vtl.SyntaxKind.ExclamationEqualsToken,
  [ts.SyntaxKind.LessThanToken]: vtl.SyntaxKind.LessThanToken,
  [ts.SyntaxKind.LessThanEqualsToken]: vtl.SyntaxKind.LessThanEqualsToken,
  [ts.SyntaxKind.GreaterThanToken]: vtl.SyntaxKind.GreaterThanToken,
  [ts.SyntaxKind.GreaterThanEqualsToken]: vtl.SyntaxKind.GreaterThanEqualsToken,
  [ts.SyntaxKind.AmpersandAmpersandToken]: vtl.SyntaxKind.AmpersandAmpersandToken,
  [ts.SyntaxKind.BarBarToken]: vtl.SyntaxKind.BarBarToken,
};

export interface Transpiler {
  getErrors(): vtl.VTLError[];
  getFiles(): vtl.File[];
}

export interface CreateTranspilerOptions {
  source: SourceFile;

  /**
   * Specify which AWS service the template to be generated will be used for.
   * 
   * @default "appsync"
   */
  targetService?: "appsync" | "apigateway";
}

/**
 * Create a transpiler to convert from TypeScript to VTL.
 * 
 * @param options 
 * @returns 
 */
export function createTranspiler(options: CreateTranspilerOptions): Transpiler {
  const { targetService = "appsync" } = options;

  const errors: vtl.VTLError[] = [];
  let localVariableReferences = 0;
  let preludeFlags: {
    esc?: boolean,
    stringClass?: boolean,
  } = {};

  const files: vtl.File[] = visitSourceFile(options.source);

  return {
    getErrors() { return errors; },
    getFiles() { return files; },
  };

  function appendError(message: string, node?: Node) {
    errors.push({ message, node });
  }

  function appendNotSupportedSyntaxError(node: Node, additional?: string) {
    appendError(
      `Syntax ${node.getKindName()} not supported` + (additional ? ` ${additional}` : ''),
      node,
    );
  }

  function appendNotImplementedSyntaxError(node: Node, additional?: string) {
    appendError(
      `Syntax ${node.getKindName()} not implemented` + (additional ? ` ${additional}` : ''),
      node,
    );
  }

  function createIdentifier(props: { text: string, node?: Node }) {
    if (!props.text.match(/^\$?[a-zA-Z]([\w-])*$/)) {
      appendError(`The identifier '${props.text}' is an invalid name for VTL`, props.node);
    }

    return vtl.createIdentifier({
      text: props.text.startsWith("$") ? props.text.substr(1) : props.text,
      node: props.node,
    });
  }

  function createLocalVariableReference(node?: Node) {
    return vtl.createVariableReference({
      name: createIdentifier({
        text: `local_${localVariableReferences++}`,
        node,
      }),
      node,
    })
  }

  function createDiscardVariableReference(node?: Node) {
    return vtl.createVariableReference({
      name: createIdentifier({
        text: `discard`,
        node,
      }),
      node,
    })
  }

  function visitArrayLiteralExpression(node: ArrayLiteralExpression, directives: vtl.Directive[]) {
    const elements = mapWithFilter(node.getElements(), node => {
      const expression = visitExpression(node, directives);
      if (!expression) {
        return;
      }

      const element = expressionToLiteralOrReference(expression, directives);
      if (!element) {
        appendNotSupportedSyntaxError(node, `for an element of an array`);
        return;
      }

      return element;
    });

    return vtl.createListLiteral({ elements, node });
  }

  function visitBinaryExpression(node: BinaryExpression, directives: vtl.Directive[]) {
    const leftExpression = visitExpression(node.getLeft(), directives);
    const rightExpression = visitExpression(node.getRight(), directives);

    if (!leftExpression || !rightExpression) {
      return;
    }

    const left = expressionToReference(leftExpression) || leftExpression;
    const right = expressionToReference(rightExpression) || rightExpression;

    const operatorTokenKind = node.getOperatorToken().getKind();
    if (operatorTokenKind === ts.SyntaxKind.EqualsToken) {
      return visitAssignmentOperator(left, right, vtl.SyntaxKind.EqualsToken);
    } else if (operatorTokenKind === ts.SyntaxKind.PlusEqualsToken) {
      return visitAssignmentOperator(left, right, vtl.SyntaxKind.PlusToken);
    } else if (operatorTokenKind === ts.SyntaxKind.MinusEqualsToken) {
      return visitAssignmentOperator(left, right, vtl.SyntaxKind.MinusToken);
    } else if (operatorTokenKind === ts.SyntaxKind.AsteriskEqualsToken) {
      return visitAssignmentOperator(left, right, vtl.SyntaxKind.AsteriskToken);
    } else if (operatorTokenKind === ts.SyntaxKind.SlashEqualsToken) {
      return visitAssignmentOperator(left, right, vtl.SyntaxKind.SlashToken);
    } else if (operatorTokenKind === ts.SyntaxKind.PercentEqualsToken) {
      return visitAssignmentOperator(left, right, vtl.SyntaxKind.PercentToken);
    } else {
      const operatorToken = visitBinaryOperatorToken(node.getOperatorToken());
      if (!operatorToken) {
        return;
      }

      return vtl.createBinaryExpression({
        left,
        operatorToken,
        right,
        node,
      });
    }

    function visitAssignmentOperator(left: vtl.Expression, right: vtl.Expression, operatorToken: vtl.BinaryOperatorToken) {
      if (operatorToken !== vtl.SyntaxKind.EqualsToken) {
        right = vtl.createBinaryExpression({
          left,
          operatorToken,
          right,
          node,
        });
      }

      const setDirective = createSetDirective(left, right, node);
      if (!setDirective) {
        return;
      }

      directives.push(setDirective);

      if (Node.isExpressionStatement(node.getParent())) {
        return vtl.createBinaryExpression({
          left,
          operatorToken: vtl.SyntaxKind.EqualsToken,
          right,
          node,
        });
      } else {
        return left;
      }
    }
  }

  function visitBinaryOperatorToken(node: Node<ts.BinaryOperatorToken>): vtl.BinaryOperatorToken | undefined {
    const token = TS_TO_VTL_FOR_BINARY_OPEATOR_TOKEN[node.getKind()];
    if (!token) {
      appendNotSupportedSyntaxError(node, 'in the binary expression');
      return;
    }
    return token;
  }

  function visitBlock(node: Block): vtl.Block {
    return vtl.createBlock({
      elements: node.getStatements().flatMap(visitStatement),
      node,
    });
  }

  function visitCallExpression(node: CallExpression, directives: vtl.Directive[]) {
    const expression = node.getExpression();

    if (Node.isIdentifier(expression)) {
      const name = visitIdentifier(expression);

      if (isCallExpressionForTS2VTLFunction(node) && name.text === 'Range') {
        const [beginArg, endArg] = node.getArguments();

        if (!beginArg) {
          appendError('Missing begin value of Range', node);
          return;
        }

        if (!endArg) {
          appendError('Missing end value of Range', node);
          return;
        }

        if (!Node.isExpression(beginArg)) {
          appendError('The begin value of Range is not an expression', beginArg);
          return;
        }

        if (!Node.isExpression(endArg)) {
          appendError('The end value of Range is not an expression', endArg);
          return;
        }

        const beginExpression = visitExpression(beginArg, directives);
        const endExpression = visitExpression(endArg, directives);

        if (!beginExpression || !endExpression) {
          return;
        }

        const begin = expressionToLiteralOrReference(beginExpression, directives);
        if (!begin || (!vtl.isNumericLiteral(begin) && !vtl.isReference(begin))) {
          appendError('The begin value of Range must be an number or an reference', beginArg);
          return;
        }

        const end = expressionToLiteralOrReference(endExpression, directives);
        if (!end || (!vtl.isNumericLiteral(end) && !vtl.isReference(end))) {
          appendError('The end value of Range must be an number or an reference', endArg);
          return;
        }

        return vtl.createRangeLiteral({
          begin,
          end,
          node,
        });
      } else {
        const [tsReceiver, ...tsArgs] = node.getArguments();

        if (!tsReceiver) {
          appendError(`Arguments require at least one for calling the function`, node.getExpression());
          return;
        }

        if (!Node.isExpression(tsReceiver)) {
          appendError('1st argument of the function is not an expression', tsReceiver);
          return;
        }

        const receiver = visitExpression(tsReceiver, directives);
        if (!receiver) {
          appendNotSupportedSyntaxError(tsReceiver, 'for the reciever');
          return;
        }

        if (!vtl.isIdentifier(receiver) && !vtl.isPropertyNotation(receiver) && !vtl.isIndexNotation(receiver)) {
          appendNotSupportedSyntaxError(tsReceiver, 'for the reciever');
          return;
        }

        const expression = vtl.createPropertyNotation({
          name,
          expression: receiver,
        });

        const args = tsArgs.flatMap(node => {
          if (!Node.isExpression(node)) {
            appendError('Arguments of the function must be an expression', node);
            return [];
          }

          const expression = visitExpression(node, directives);
          if (!expression) {
            return [];
          }

          const arg = expressionToLiteralOrReference(expression, directives);
          if (!arg) {
            appendNotSupportedSyntaxError(node, 'for the parameter');
            return [];
          }

          return [arg];
        });

        return vtl.createCallExpression({
          expression,
          arguments: args,
          node,
        });
      }
    } else if (Node.isPropertyAccessExpression(expression)) {
      const propertyAccessExpression = visitPropertyAccessExpression(expression, directives);
      if (!propertyAccessExpression) {
        return;
      }

      const args = node.getArguments().flatMap(node => {
        if (!Node.isExpression(node)) {
          appendError('Arguments of the function must be an expression', node);
          return [];
        }

        const expression = visitExpression(node, directives);
        if (!expression) {
          return [];
        }

        const arg = expressionToLiteralOrReference(expression, directives);
        if (!arg) {
          appendNotSupportedSyntaxError(node, 'for the parameter');
          return [];
        }

        return [arg];
      });

      return vtl.createCallExpression({
        expression: propertyAccessExpression,
        arguments: args,
        node,
      });
    } else {
      appendNotSupportedSyntaxError(node.getExpression(), 'in the call expression');
      return;
    }
  }

  function visitElementAccessExpression(node: ElementAccessExpression, directives: vtl.Directive[]) {
    const expression = visitExpression(node.getExpression(), directives);
    if (!expression) {
      return;
    }

    if (!vtl.isIdentifier(expression) && !vtl.isPropertyNotation(expression) && !vtl.isIndexNotation(expression)) {
      appendNotSupportedSyntaxError(node.getExpression(), 'in the element access expression');
      return;
    }

    const argumentExpression = node.getArgumentExpression();
    if (!argumentExpression) {
      return;
    }

    const indexExpression = visitExpression(argumentExpression, directives);
    if (!indexExpression) {
      return;
    }

    const index = expressionToLiteralOrReference(indexExpression, directives);
    if (!index) {
      appendNotSupportedSyntaxError(argumentExpression, 'for the index');
      return;
    }

    const indexNotation = vtl.createIndexNotation({
      expression,
      index,
      node,
    });

    return indexNotation;
  }

  function visitExpression(node: Expression, directives: vtl.Directive[]): vtl.Expression | undefined {
    if (Node.isArrayLiteralExpression(node)) {
      return visitArrayLiteralExpression(node, directives);
    } else if (Node.isBinaryExpression(node)) {
      return visitBinaryExpression(node, directives);
    } else if (Node.isCallExpression(node)) {
      return visitCallExpression(node, directives);
    } else if (Node.isElementAccessExpression(node)) {
      return visitElementAccessExpression(node, directives);
    } else if (Node.isIdentifier(node)) {
      return visitIdentifier(node);
    } else if (Node.isObjectLiteralExpression(node)) {
      return visitObjectLiteralExpression(node, directives);
    } else if (Node.isNumericLiteral(node)) {
      return visitNumericLiteral(node);
    } else if (Node.isParenthesizedExpression(node)) {
      return visitParenthesizedExpression(node, directives);
    } else if (Node.isPrefixUnaryExpression(node)) {
      return visitPrefixUnaryExpression(node, directives);
    } else if (Node.isPropertyAccessExpression(node)) {
      return visitPropertyAccessExpression(node, directives);
    } else if (Node.isStringLiteral(node)) {
      return visitStringLiteral(node);
    } else if (Node.isTemplateExpression(node)) {
      return visitTemplateExpression(node, directives);
    } else if (node.getKind() === ts.SyntaxKind.ThisKeyword) {
      return visitThisKeyword(node);
    } else {
      appendNotImplementedSyntaxError(node, 'in the expression');
      return;
    }
  }

  function visitExpressionStatement(node: ExpressionStatement): vtl.BlockElement[] {
    const directives: vtl.Directive[] = [];

    const expression = node.getExpression();
    const vtlExpression = visitExpression(expression, directives);

    if (!vtlExpression) {
      return [];
    }

    if (vtl.isBinaryExpression(vtlExpression)) {
      if (vtlExpression.operatorToken === vtl.SyntaxKind.EqualsToken) {
        return directives;
      } else {
        appendError(
          `Operator ${vtl.SyntaxKind[vtlExpression.operatorToken]} not supported for VTL in the expression statement`,
          vtlExpression.node,
        );
        return [];
      }
    }

    const ref = expressionToReference(vtlExpression);
    if (!ref) {
      appendNotImplementedSyntaxError(expression, 'in the expresion statement');
      return [];
    }

    let block: vtl.BlockElement = ref;
    if (vtl.isMethodReference(ref) && ref.node && Node.isCallExpression(ref.node)) {
      if (!checkReturnVoid(ref.node)) {
        if (targetService === "appsync") {
          const expression = vtl.createPropertyNotation({
            expression: createIdentifier({ text: 'util', node: ref.node }),
            name: createIdentifier({ text: 'qr', node: ref.node }),
            node: ref.node,
          });
          block = vtl.createMethodReference({
            expression: vtl.createCallExpression({
              expression,
              arguments: [ref],
              node: ref.node,
            }),
            node: ref.node,
          });
        } else if (targetService === "apigateway") {
          block = vtl.createSetDirective({
            ref: createDiscardVariableReference(ref.node),
            arg: ref,
            node: ref.node,
          });
        }
      }
    }

    return [block, vtl.createNewLine()];

    function checkReturnVoid(node: CallExpression) {
      return node.getReturnType().getText() === 'void';
    }
  }

  function visitForOfStatement(node: ForOfStatement): vtl.BlockElement[] {
    const initializer = node.getInitializer();

    if (!Node.isVariableDeclarationList(initializer)) {
      appendError(`The initializer of the for-of statement is not variable declaration`, node);
      return [];
    }

    const bindingName = initializer.getDeclarations()[0].getNameNode();
    const preBlockElements: vtl.BlockElement[] = [];
    let ref;

    if (Node.isIdentifier(bindingName)) {
      ref = variableReferenceFromTSIdentifier(bindingName);
    } else if (Node.isArrayBindingPattern(bindingName)) {
      const elements = bindingName.getElements();

      if (elements.length !== 2) {
        appendError('The array binding of the for-of statement must have 2 elements', bindingName);
        return [];
      }

      ref = createLocalVariableReference(bindingName);

      const [keyBindingElement, valueBindingElement] = elements;

      if (!Node.isBindingElement(keyBindingElement)) {
        appendError('The array binding of the for-of statement must have identifiers', keyBindingElement);
        return [];
      }

      if (!Node.isBindingElement(valueBindingElement)) {
        appendError('The array binding of the for-of statement must have identifiers', valueBindingElement);
        return [];
      }

      const keyBindingElementName = keyBindingElement.getNameNode();
      const valueBindingElementName = valueBindingElement.getNameNode();

      if (!Node.isIdentifier(keyBindingElementName)) {
        appendError('The array binding of the for-of statement must have identifiers', keyBindingElementName);
        return [];
      }

      if (!Node.isIdentifier(valueBindingElementName)) {
        appendError('The array binding of the for-of statement must have identifiers', valueBindingElementName);
        return [];
      }

      const keyRef = variableReferenceFromTSIdentifier(keyBindingElementName);
      const valueRef = variableReferenceFromTSIdentifier(valueBindingElementName);

      preBlockElements.push(
        vtl.createSetDirective({
          ref: keyRef,
          arg: vtl.createPropertyReference({
            expression: vtl.createPropertyNotation({
              expression: ref.name,
              name: createIdentifier({ text: 'key' }),
            })
          }),
        }),
        vtl.createSetDirective({
          ref: valueRef,
          arg: vtl.createPropertyReference({
            expression: vtl.createPropertyNotation({
              expression: ref.name,
              name: createIdentifier({ text: 'value' }),
            })
          }),
        }),
        vtl.createNewLine(),
      );
    } else {
      appendNotSupportedSyntaxError(bindingName, `for the initializer of the for-of statement`);
      return [];
    }

    const directives: vtl.Directive[] = [];

    const expression = node.getExpression();

    const vtlExpression = visitExpression(expression, directives);
    if (!vtlExpression) {
      return [];
    }

    const arg = expressionToLiteralOrReference(vtlExpression, directives);
    if (!arg) {
      appendNotSupportedSyntaxError(expression, `for the expression of the for-of statement`);
      return [];
    }

    const foreachDirective = vtl.createForeachDirective({
      ref,
      arg,
      block: vtl.createBlock({
        elements: preBlockElements.concat(visitStatement(node.getStatement())),
        node: node.getStatement(),
      }),
      node,
    });

    directives.push(foreachDirective);

    return directives;
  }

  function visitFunctionDeclaration(node: FunctionDeclaration): vtl.File | undefined {
    const modifierFlags = node.getCombinedModifierFlags();

    if (!(modifierFlags & ts.ModifierFlags.Export)) {
      appendError('Function without the export modifier not supported yet', node);
      return;
    }

    if (modifierFlags & ~ts.ModifierFlags.ExportDefault) {
      appendError(
        'Function with modifiers except the export modifier and the default modifier, not supported',
        node,
      );
      return;
    }

    const body = node.getBody();
    if (!body) {
      appendError('Function requires the body', node);
      return;
    }

    preludeFlags = {};

    if (!Node.isBlock(body)) {
      appendError('Function requires the body', body);
      return;
    }

    const block = visitBlock(body);

    const preludeCode: vtl.BlockElement[] = [];

    if (preludeFlags.esc) {
      preludeCode.push(...preludeEsc());
    }

    if (preludeFlags.stringClass) {
      preludeCode.push(...preludeStringClass());
    }

    block.elements = [...preludeCode, ...block.elements];

    return vtl.createFile({
      name: node.getName() || 'default',
      block,
      node,
    });
  }

  function visitIdentifier(node: Identifier) {
    const definitionNodes = node.getDefinitionNodes();

    if (definitionNodes.length) {
      if (definitionNodes.find(node => isInTS2VTLScope(node.getSourceFile()))) {
        for (const node of definitionNodes) {
          if (Node.isClassDeclaration(node)) {
            if (node.getName() === "JavaString") {
              preludeFlags.stringClass = true;
            }
          }
        }
      }
    }

    return createIdentifier({ text: node.getText(), node });
  }

  function visitIfStatement(node: IfStatement): vtl.BlockElement[] {
    const blocks: vtl.BlockElement[] = [];

    const directives: vtl.Directive[] = []
    const expression = visitExpression(node.getExpression(), directives);
    if (!expression) {
      return [];
    }

    blocks.push(...directives);

    const ifClause = vtl.createConditionAndBlock({
      condition: expressionToReference(expression) || expression,
      block: vtl.createBlock({
        elements: visitStatement(node.getThenStatement()),
        node: node.getThenStatement(),
      }),
    });

    let elseIfClauses, elseClause;

    const elseStatement = node.getElseStatement();
    if (elseStatement) {
      if (Node.isIfStatement(elseStatement)) {
        const elements = visitIfStatement(elseStatement);
        if (elements.length === 0) {
          return elements;
        }

        const ifDirective = elements.pop();
        blocks.push(...elements);

        if (!ifDirective || !vtl.isIfDirective(ifDirective)) {
          appendError('Parsing if statement failed after the else clause', elseStatement);
          return [];
        }

        elseIfClauses = [ifDirective.ifClause, ...(ifDirective.elseIfClauses || [])];
        elseClause = ifDirective.elseClause;
      } else {
        elseClause = vtl.createBlock({
          elements: visitStatement(elseStatement),
          node: elseStatement,
        });
      }
    }

    const ifDirective = vtl.createIfDirective({
      ifClause,
      elseIfClauses,
      elseClause,
    });

    return blocks.concat(ifDirective);
  }

  function visitObjectLiteralExpression(node: ObjectLiteralExpression, directives: vtl.Directive[]) {
    const properties = mapWithFilter(node.getProperties(), node => {
      if (Node.isShorthandPropertyAssignment(node)) {
        const nameNode = node.getNameNode();

        return vtl.createPropertyAssignment({
          name: vtl.createStringLiteral({ value: nameNode.getText(), node: nameNode }),
          initializer: variableReferenceFromTSIdentifier(nameNode)
        });
      } else if (Node.isPropertyAssignment(node)) {
        const nameNode = node.getNameNode();
        let name;

        if (Node.isPrivateIdentifier(nameNode)) {
          appendNotSupportedSyntaxError(nameNode);
          return;
        } else if (Node.isComputedPropertyName(nameNode)) {
          appendNotImplementedSyntaxError(nameNode);
          return;
        } else if (Node.isIdentifier(nameNode)) {
          name = vtl.createStringLiteral({ value: nameNode.getText(), node: nameNode });
        } else if (Node.isStringLiteral(nameNode)) {
          name = visitStringLiteral(nameNode);
        } else if (Node.isNumericLiteral(nameNode)) {
          name = visitNumericLiteral(nameNode);
          if (!name) {
            return;
          }
        }

        if (!name) {
          return;
        }

        const initializer = node.getInitializer();
        if (!Node.isExpression(initializer)) {
          appendError('The initializer must be an expression', initializer);
          return;
        }

        const vtlExpression = visitExpression(initializer, directives);
        if (!vtlExpression) {
          return;
        }

        const vtlInitializer = expressionToLiteralOrReference(vtlExpression, directives);
        if (!vtlInitializer) {
          appendNotImplementedSyntaxError(node, `for the property initializer`);
          return;
        }

        return vtl.createPropertyAssignment({ name, initializer: vtlInitializer, node });
      } else {
        appendNotImplementedSyntaxError(node, 'in the object literal');
        return;
      }
    });

    return vtl.createMapLiteral({ properties, node });
  }

  function visitNumericLiteral(node: NumericLiteral) {
    try {
      return vtl.createNumericLiteral({
        value: parseFloat(node.getText()),
        node,
      });
    } catch (err) {
      appendError(`Invalid numeric text ${node.getText()}`, node);
      return;
    }
  }

  function visitParenthesizedExpression(node: ParenthesizedExpression, directives: vtl.Directive[]) {
    const expression = visitExpression(node.getExpression(), directives);
    if (!expression) {
      return;
    }

    return vtl.createParenthesizedExpression({
      expression,
      node,
    });
  }

  function visitPrefixUnaryExpression(node: PrefixUnaryExpression, directives: vtl.Directive[]) {
    let vtlOperator: vtl.PrefixUnaryOperator;

    const operator = node.getOperatorToken();

    if (operator === ts.SyntaxKind.ExclamationToken) {
      vtlOperator = vtl.SyntaxKind.ExclamationToken;
    } else if (operator === ts.SyntaxKind.MinusToken) {
      vtlOperator = vtl.SyntaxKind.MinusToken;
    } else {
      appendError(
        `Operator ${node.getKindName()} not supported in VTL`,
        node
      );
      return;
    }

    const operand = visitExpression(node.getOperand(), directives);
    if (!operand) {
      return;
    }

    return vtl.createPrefixUnaryExpression({
      operand: expressionToReference(operand) || operand,
      operator: vtlOperator,
      node,
    });
  }

  function visitPropertyAccessExpression(node: PropertyAccessExpression, directives: vtl.Directive[]) {
    const expression = visitExpression(node.getExpression(), directives);
    if (!expression) {
      return;
    }

    if (!vtl.isPropertyNotation(expression) && !vtl.isIndexNotation(expression) && !vtl.isIdentifier(expression)) {
      appendNotSupportedSyntaxError(node.getExpression(), 'in the property access');
      return;
    }

    const name = node.getNameNode()
    if (Node.isPrivateIdentifier(name)) {
      appendNotSupportedSyntaxError(name, 'in the property access');
      return;
    }

    return vtl.createPropertyNotation({
      name: visitIdentifier(name),
      expression,
      node,
    });
  }

  function visitReturnStatement(node: ReturnStatement) {
    const expression = node.getExpression();
    if (!expression) {
      return [];
    }

    const directives: vtl.Directive[] = [];

    const result = visitExpression(expression, directives);
    if (!result) {
      return [];
    }

    const blockElement = expressionToLiteralOrReference(result, directives);
    if (!blockElement) {
      appendNotSupportedSyntaxError(expression, 'in the return statement');
      return [];
    }

    const blocks: vtl.BlockElement[] = [...directives];

    if (directives.length > 0) {
      blocks.push(vtl.createNewLine());
    }

    blocks.push(blockElement);

    return blocks;
  }

  function visitSourceFile(node: SourceFile): vtl.File[] {
    localVariableReferences = 0;

    return mapWithFilter(node.getStatements(), node => {
      if (Node.isFunctionDeclaration(node)) {
        return visitFunctionDeclaration(node);
      } else if (Node.isImportDeclaration(node)) {
        return; // ignore
      } else if (Node.isInterfaceDeclaration(node)) {
        return; // ignore
      } else {
        appendNotImplementedSyntaxError(node, 'under the top level');
        return;
      }
    });
  }

  function visitStatement(node: Statement): vtl.BlockElement[] {
    const leadingEmptyLines = createLeadingEmptyLines(node);

    if (Node.isBlock(node)) {
      return leadingEmptyLines.concat(node.getStatements().flatMap(visitStatement));
    } else if (Node.isExpressionStatement(node)) {
      return leadingEmptyLines.concat(visitExpressionStatement(node));
    } else if (Node.isForOfStatement(node)) {
      return leadingEmptyLines.concat(visitForOfStatement(node));
    } else if (Node.isIfStatement(node)) {
      return leadingEmptyLines.concat(visitIfStatement(node));
    } else if (Node.isReturnStatement(node)) {
      return leadingEmptyLines.concat(visitReturnStatement(node));
    } else if (Node.isVariableStatement(node)) {
      return leadingEmptyLines.concat(visitVariableStatement(node));
    } else {
      appendNotImplementedSyntaxError(node, 'in the statement');
      return leadingEmptyLines.concat(vtl.createTextNode({ text: `## ${node.getKindName()}\n` }));
    }
  }

  function visitStringLiteral(node: StringLiteral) {
    return vtl.createStringLiteral({ value: node.getLiteralValue(), quoteKind: node.getQuoteKind(), node });
  }

  function visitTemplateExpression(node: TemplateExpression, directives: vtl.Directive[]) {
    const head = escape(node.getHead().getLiteralText() || '');

    const templateSpans = node.getTemplateSpans().flatMap(node => {
      const expression = node.getExpression();

      const expressionResult = visitExpression(expression, directives);
      if (!expressionResult) {
        return [];
      }

      const vtlExpression = expressionToLiteralOrReference(expressionResult, directives);
      if (!vtlExpression) {
        appendNotSupportedSyntaxError(expression, 'in the template string');
        return [];
      }

      return vtl.createTemplateSpan({
        expression: vtlExpression,
        literal: escape(node.getLiteral().getLiteralText() || ''),
        node,
      });
    });

    return vtl.createTemplateLiteral({
      head,
      templateSpans,
      node,
    });

    function escape(text: string) {
      if (text.indexOf("\"") < 0) {
        return text;
      }

      preludeFlags.esc = true;

      return text.replace(/"/g, "${esc.q}");
    }
  }

  function visitThisKeyword(node: Node) {
    if (targetService === "apigateway") {
      return createIdentifier({
        text: 'context',
        node,
      });
    } else {
      return createIdentifier({
        text: 'ctx',
        node,
      });
    }
  }

  function visitVariableDeclaration(node: VariableDeclaration): vtl.BlockElement[] {
    const nameNode = node.getNameNode();

    if (Node.isIdentifier(nameNode)) {
      const initializer = node.getInitializer();

      if (!initializer) {
        return [];
      }

      const directives: vtl.Directive[] = [];

      const leftExpression = visitExpression(nameNode, directives);
      if (!leftExpression) {
        return [];
      }

      const rightExpression = visitExpression(initializer, directives);
      if (!rightExpression) {
        return [];
      }

      const setDirective = createSetDirective(leftExpression, rightExpression, node);
      if (!setDirective) {
        return [];
      }

      directives.push(setDirective);

      return directives;
    } else {
      appendError(`Destructuring not implemented`, node);
      return [];
    }
  }

  function visitVariableStatement(node: VariableStatement): vtl.BlockElement[] {
    return node.getDeclarationList().getDeclarations().flatMap(visitVariableDeclaration);
  }

  function mapWithFilter<T, U>(array: ReadonlyArray<T>, mapper: (t: T) => U | undefined) {
    return array.flatMap(t => mapper(t) || []);
  }

  function isCallExpressionForTS2VTLFunction(node: CallExpression): boolean {
    const expression = node.getExpression();

    if (!Node.isIdentifier(expression)) {
      return false;
    }

    const definitionNodes = expression.getDefinitionNodes();

    if (definitionNodes.length === 0) {
      return false;
    }

    return !!definitionNodes.find(node => isInTS2VTLScope(node.getSourceFile()));
  }

  function createSetDirective(leftExpression: vtl.Expression, rightExpression: vtl.Expression, node?: Node) {
    const ref = expressionToLeftHandSideReference(leftExpression);
    if (!ref) {
      const n = leftExpression.node || node;
      if (n) {
        appendNotSupportedSyntaxError(n, `for left of the assignment operator`);
      } else {
        appendError(`createSetDirective failed`);
      }
      return;
    }

    return vtl.createSetDirective({
      ref,
      arg: expressionToReference(rightExpression) || rightExpression,
      node,
    });
  }

  function expressionToReference(node: vtl.Expression): vtl.Reference | undefined {
    if (vtl.isIdentifier(node)) {
      const result = transformArgumentReference(node);

      if (result) {
        return expressionToReference(result);
      }

      return vtl.createVariableReference({
        name: node,
        node: node.node,
      });
    } else if (vtl.isPropertyNotation(node) || vtl.isIndexNotation(node)) {
      transformArgumentReference(node);

      return vtl.createPropertyReference({
        expression: node,
        node: node.node,
      });
    } else if (vtl.isCallExpression(node)) {
      transformArgumentReference(node);

      return vtl.createMethodReference({
        expression: node,
        node: node.node,
      });
    } else if (vtl.isReference(node)) {
      return node;
    } else {
      return;
    }
  }

  function transformArgumentReference(vtlNode: vtl.Identifier | vtl.PropertyNotation | vtl.IndexNotation | vtl.CallExpression): vtl.PropertyNotation | undefined {
    if (vtl.isIdentifier(vtlNode)) {
      const tsNode = vtlNode.node;
      if (!tsNode) {
        return;
      }

      const symbol = tsNode.getSymbol();
      if (!symbol) {
        return;
      }

      if (!symbol.getValueDeclaration() || !Node.isParameterDeclaration(symbol.getValueDeclaration())) {
        return;
      }

      if (targetService === "apigateway") {
        return;
      }

      return vtl.createPropertyNotation({
        expression: createPropertyNotationChain('ctx', 'arguments'),
        name: vtlNode,
      });
    } else {
      const result = transformArgumentReference(vtlNode.expression);
      if (result) {
        vtlNode.expression = result;
      }
      return;
    }
  }

  function createPropertyNotationChain(...args: string[]): vtl.PropertyNotation | vtl.Identifier {
    let result: vtl.PropertyNotation | vtl.Identifier | undefined;

    for (const arg of args) {
      const name = createIdentifier({ text: arg });

      if (result) {
        result = vtl.createPropertyNotation({
          expression: result,
          name,
        });
      } else {
        result = name;
      }
    }

    if (!result) {
      throw new Error('createPropertyNotationChain() must have at least one parameter');
    }

    return result;
  }

  function expressionToLiteralOrReference(node: vtl.Expression, directives: vtl.Directive[]): vtl.Literal | vtl.Reference | undefined {
    if (vtl.isLiteral(node)) {
      return node;
    }

    const ref = expressionToReference(node);
    if (ref) {
      return ref;
    }

    const localVariableReference = createLocalVariableReference(node.node);

    const setDirective = createSetDirective(localVariableReference, node, node.node);
    if (!setDirective) {
      appendError(`createSetDirective failed`);
      return;
    }

    directives.push(setDirective);

    return localVariableReference
  }

  function expressionToLeftHandSideReference(node: vtl.Expression): vtl.LeftHandSideReference | undefined {
    const ref = expressionToReference(node);
    if (!ref) {
      return;
    }

    if (vtl.isVariableReference(ref) || vtl.isPropertyReference(ref)) {
      return ref;
    }

    return;
  }

  function variableReferenceFromTSIdentifier(identifier: Identifier) {
    return vtl.createVariableReference({
      name: createIdentifier({
        text: identifier.getText(),
        node: identifier,
      }),
      node: identifier,
    });
  }

  /**
   * Genrate following VTL code.
   *
   * ```
   * #set($esc={"q":'"'})
   * ```
   * 
   * This $esc variable is used to present double quotes in template strings.
   */
  function preludeEsc() {
    const esc = createIdentifier({ text: 'esc' });

    const line1 = createSetDirective(esc, vtl.createMapLiteral({
      properties: [
        createPropertyAssignment({
          name: createStringLiteral({ value: "q" }),
          initializer: createStringLiteral({ value: '"', quoteKind: "'" }),
        })
      ],
    }));

    if (!line1) {
      appendError('Generating prelude code for $esc is failed');
      return [];
    }

    return [
      line1,
      vtl.createNewLine(),
    ];
  }

  /**
   * Genrate following VTL code to get a reference of java.lang.String class.
   * 
   * ```
   * #set($String='')
   * #set($String=$String.class)
   * ```
   * 
   * This $String variable is used to call String.format() or String.join().
   */
  function preludeStringClass() {
    const String = createIdentifier({ text: 'String' });
    const klass = createIdentifier({ text: 'class' });

    const line1 = createSetDirective(String, vtl.createStringLiteral({ value: '' }));
    const line2 = createSetDirective(String, vtl.createPropertyNotation({
      expression: String,
      name: klass,
    }));

    if (!line1 || !line2) {
      appendError('Generating prelude code for String class is failed');
      return [];
    }

    return [
      line1,
      line2,
      vtl.createNewLine(),
    ];
  }
}

function createLeadingEmptyLines(node: Statement): vtl.BlockElement[] {
  const leadingTrivia = node.getFullText().substr(0, node.getLeadingTriviaWidth());
  const length = (leadingTrivia.match(/\n/g) || []).length - 1;

  return Array.from({ length }, () => vtl.createNewLine());
}

/**
 * Return whether a source file is in packages of @ts2vtl or not.
 * 
 * @param source 
 * @returns 
 */
function isInTS2VTLScope(source: SourceFile) {
  return source.getFilePath().split("/").includes("@ts2vtl");
}
