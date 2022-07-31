import type * as tsMorph from 'ts-morph';

export enum SyntaxKind {
  Unknown = 0,
  File = 1,

  SetDirective = 2,
  IfDirective = 3,
  ForeachDirective = 4,
  IncludeDirective = 5,
  ParseDirective = 6,
  StopDirective = 7,
  BreakDirective = 8,
  EvaluateDirective = 9,
  DefineDirective = 10,
  MacroDirective = 11,

  Identifier = 12,
  VariableReference = 13,
  PropertyReference = 14,
  MethodReference = 15,

  Block = 16,
  ConditionAndBlock = 17,

  NumericLiteral = 18,
  StringLiteral = 19,
  TemplateLiteral = 20,
  BooleanLiteral = 21,
  ListLiteral = 22,
  RangeLiteral = 23,
  MapLiteral = 24,
  TextNode = 25,

  PropertyNotation = 26,
  IndexNotation = 27,
  PropertyAssignment = 28,
  CallExpression = 29,
  BinaryExpression = 30,
  PrefixUnaryExpression = 31,
  NewLine = 32,

  PlusToken = 33,
  MinusToken = 34,
  AsteriskToken = 35,
  SlashToken = 36,
  PercentToken = 37,
  EqualsToken = 38,
  EqualsEqualsToken = 39,
  ExclamationEqualsToken = 40,
  LessThanToken = 41,
  LessThanEqualsToken = 42,
  GreaterThanToken = 43,
  GreaterThanEqualsToken = 44,
  OpenParenToken = 45,
  CloseParenToken = 46,
  ExclamationToken = 47,
  AmpersandAmpersandToken = 48,
  BarBarToken = 49,

  TemplateSpan = 50,

  ParenthesizedExpression = 51,
}

export const TOKEN_TO_STRING = {
  [SyntaxKind.PlusToken]: '+',
  [SyntaxKind.MinusToken]: '-',
  [SyntaxKind.AsteriskToken]: '*',
  [SyntaxKind.SlashToken]: '/',
  [SyntaxKind.PercentToken]: '%',
  [SyntaxKind.EqualsToken]: '=',
  [SyntaxKind.EqualsEqualsToken]: '==',
  [SyntaxKind.ExclamationEqualsToken]: '!=',
  [SyntaxKind.LessThanToken]: '<',
  [SyntaxKind.LessThanEqualsToken]: '<=',
  [SyntaxKind.GreaterThanToken]: '>',
  [SyntaxKind.GreaterThanEqualsToken]: '>=',
  [SyntaxKind.OpenParenToken]: '(',
  [SyntaxKind.CloseParenToken]: ')',
  [SyntaxKind.ExclamationToken]: '!',
  [SyntaxKind.AmpersandAmpersandToken]: '&&',
  [SyntaxKind.BarBarToken]: '||',
}

/**
 * The node of AST for VTL.
 */
export interface Node {
  /**
   * The kind of this node.
   */
  kind: any;

  /**
   * The TypeScript node from which this node is generated.
   */
  node?: tsMorph.Node;
}

/**
 * The node presents one file of VTL.
 * 
 * This node is generated from the function declaration in TypeScript.
 */
export interface File extends Node {
  kind: SyntaxKind.File;
  node: tsMorph.FunctionDeclaration;

  /**
   * The name of the VTL file.
   * 
   * This value is set the name of the function in TypeScript.
   */
  name: string;

  block: Block;
}

export type BlockElement = Directive | Reference | TextNode | NewLine | Literal;

export interface Block extends Node {
  kind: SyntaxKind.Block;
  elements: BlockElement[];
}

export interface Directive extends Node {
  _directiveBrand: any;
}

export type LeftHandSideReference = VariableReference | PropertyReference;

export interface SetDirective extends Directive {
  kind: SyntaxKind.SetDirective;
  ref: LeftHandSideReference;
  arg: Literal | Reference | Expression;
}

export interface IfDirective extends Directive {
  kind: SyntaxKind.IfDirective;
  ifClause: ConditionAndBlock;
  elseIfClauses?: ConditionAndBlock[];
  elseClause?: Block;
}

export interface ConditionAndBlock extends Node {
  kind: SyntaxKind.ConditionAndBlock;
  condition: Expression;
  block: Block;
}

export interface ForeachDirective extends Directive {
  kind: SyntaxKind.ForeachDirective;
  ref: VariableReference;
  arg: Literal | Reference;
  block: Block;
}

export interface Identifier extends Expression {
  kind: SyntaxKind.Identifier;
  text: string;
}

export interface Reference extends Expression {
  _referenceBrand: any;
}

export interface VariableReference extends Reference {
  kind: SyntaxKind.VariableReference;
  name: Identifier;
}

export interface PropertyReference extends Reference {
  kind: SyntaxKind.PropertyReference;
  expression: PropertyNotation | IndexNotation;
}

export interface MethodReference extends Reference {
  kind: SyntaxKind.MethodReference;
  expression: CallExpression;
}

export interface Literal extends Expression {
  _literalBrand: any;
}

export interface NumericLiteral extends Literal {
  kind: SyntaxKind.NumericLiteral;
  value: number;
}

export interface StringLiteral extends Literal {
  kind: SyntaxKind.StringLiteral;
  value: string;
  quoteKind?: "'" | "\"",
}

export interface TemplateLiteral extends Literal {
  kind: SyntaxKind.TemplateLiteral;
  head: string,
  templateSpans: TemplateSpan[];
}

export interface TemplateSpan extends Node {
  kind: SyntaxKind.TemplateSpan;
  expression: Reference | Literal;
  literal: string;
}

export interface BooleanLiteral extends Literal {
  kind: SyntaxKind.BooleanLiteral;
  value: boolean;
}

export interface ListLiteral extends Literal {
  kind: SyntaxKind.ListLiteral;
  elements: (Reference | Literal)[];
}

export interface RangeLiteral extends Literal {
  kind: SyntaxKind.RangeLiteral;
  begin: NumericLiteral | Reference;
  end: NumericLiteral | Reference;
}

export interface MapLiteral extends Literal {
  kind: SyntaxKind.MapLiteral;
  properties: PropertyAssignment[];
}

export interface PropertyAssignment extends Node {
  kind: SyntaxKind.PropertyAssignment;
  name: Literal | Reference;
  initializer: Literal | Reference;
}

export interface TextNode extends Node {
  kind: SyntaxKind.TextNode;
  text: string;
}

export interface NewLine extends Node {
  kind: SyntaxKind.NewLine;
}

export interface Expression extends Node {
  _expressionBrand: any;
}

export interface PropertyNotation extends Expression {
  kind: SyntaxKind.PropertyNotation;
  expression: PropertyNotation | IndexNotation | CallExpression | Identifier;
  name: Identifier;
}

export interface IndexNotation extends Expression {
  kind: SyntaxKind.IndexNotation;
  expression: PropertyNotation | IndexNotation | CallExpression | Identifier;
  index: Reference | Literal;
}

export interface CallExpression extends Expression {
  kind: SyntaxKind.CallExpression;
  expression: PropertyNotation;
  arguments: (Reference | Literal)[];
}

export type BinaryOperatorToken =
  SyntaxKind.PlusToken |
  SyntaxKind.MinusToken |
  SyntaxKind.AsteriskToken |
  SyntaxKind.SlashToken |
  SyntaxKind.PercentToken |
  SyntaxKind.EqualsToken |
  SyntaxKind.EqualsEqualsToken |
  SyntaxKind.ExclamationEqualsToken |
  SyntaxKind.LessThanToken |
  SyntaxKind.LessThanEqualsToken |
  SyntaxKind.GreaterThanToken |
  SyntaxKind.GreaterThanEqualsToken |
  SyntaxKind.AmpersandAmpersandToken |
  SyntaxKind.BarBarToken;

export interface BinaryExpression extends Expression {
  kind: SyntaxKind.BinaryExpression,
  left: Expression;
  operatorToken: BinaryOperatorToken;
  right: Expression;
}

export interface ParenthesizedExpression extends Expression {
  kind: SyntaxKind.ParenthesizedExpression,
  expression: Expression;
}

export type PrefixUnaryOperator =
  SyntaxKind.MinusToken |
  SyntaxKind.ExclamationToken;

export interface PrefixUnaryExpression extends Expression {
  kind: SyntaxKind.PrefixUnaryExpression,
  operator: PrefixUnaryOperator;
  operand: Expression;
}

type OmitKind<T> = Omit<T, 'kind'>;
type OmitKindDirective<T> = Omit<OmitKind<T>, '_directiveBrand'>;
type OmitKindExpression<T> = Omit<OmitKind<T>, '_expressionBrand'>;
type OmitKindLiteral<T> = Omit<OmitKindExpression<T>, '_literalBrand'>;
type OmitKindReference<T> = Omit<OmitKindExpression<T>, '_referenceBrand'>;

export function createBlock(props: OmitKind<Block>): Block {
  return {
    kind: SyntaxKind.Block,
    ...props,
  };
}

export function createBinaryExpression(props: OmitKindExpression<BinaryExpression>): BinaryExpression {
  return {
    kind: SyntaxKind.BinaryExpression,
    _expressionBrand: undefined,
    ...props,
  };
}

export function createCallExpression(props: OmitKindExpression<CallExpression>): CallExpression {
  return {
    kind: SyntaxKind.CallExpression,
    _expressionBrand: undefined,
    ...props,
  };
}

export function createConditionAndBlock(props: OmitKind<ConditionAndBlock>): ConditionAndBlock {
  return {
    kind: SyntaxKind.ConditionAndBlock,
    ...props,
  };
}

export function createFile(props: OmitKind<File>): File {
  return {
    kind: SyntaxKind.File,
    ...props,
  };
}

export function createForeachDirective(props: OmitKindDirective<ForeachDirective>): ForeachDirective {
  return {
    kind: SyntaxKind.ForeachDirective,
    _directiveBrand: undefined,
    ...props,
  };
}

export function createIdentifier(props: OmitKindExpression<Identifier>): Identifier {
  return {
    kind: SyntaxKind.Identifier,
    _expressionBrand: undefined,
    ...props,
  };
}

export function createIfDirective(props: OmitKindDirective<IfDirective>): IfDirective {
  return {
    kind: SyntaxKind.IfDirective,
    _directiveBrand: undefined,
    ...props,
  };
}

export function createIndexNotation(props: OmitKindExpression<IndexNotation>): IndexNotation {
  return {
    kind: SyntaxKind.IndexNotation,
    _expressionBrand: undefined,
    ...props,
  };
}

export function createListLiteral(props: OmitKindLiteral<ListLiteral>): ListLiteral {
  return {
    kind: SyntaxKind.ListLiteral,
    _expressionBrand: undefined,
    _literalBrand: undefined,
    ...props,
  };
}

export function createMapLiteral(props: OmitKindLiteral<MapLiteral>): MapLiteral {
  return {
    kind: SyntaxKind.MapLiteral,
    _expressionBrand: undefined,
    _literalBrand: undefined,
    ...props,
  };
}

export function createMethodReference(props: OmitKindReference<MethodReference>): MethodReference {
  return {
    kind: SyntaxKind.MethodReference,
    _expressionBrand: undefined,
    _referenceBrand: undefined,
    ...props,
  };
}

export function createNewLine(): NewLine {
  return {
    kind: SyntaxKind.NewLine,
  };
}

export function createNumericLiteral(props: OmitKindLiteral<NumericLiteral>): NumericLiteral {
  return {
    kind: SyntaxKind.NumericLiteral,
    _expressionBrand: undefined,
    _literalBrand: undefined,
    ...props,
  };
}

export function createParenthesizedExpression(props: OmitKindExpression<ParenthesizedExpression>): ParenthesizedExpression {
  return {
    kind: SyntaxKind.ParenthesizedExpression,
    _expressionBrand: undefined,
    ...props,
  };
}

export function createPrefixUnaryExpression(props: OmitKindExpression<PrefixUnaryExpression>): PrefixUnaryExpression {
  return {
    kind: SyntaxKind.PrefixUnaryExpression,
    _expressionBrand: undefined,
    ...props,
  };
}

export function createPropertyAssignment(props: OmitKind<PropertyAssignment>): PropertyAssignment {
  return {
    kind: SyntaxKind.PropertyAssignment,
    ...props,
  };
}

export function createPropertyNotation(props: OmitKindExpression<PropertyNotation>): PropertyNotation {
  return {
    kind: SyntaxKind.PropertyNotation,
    _expressionBrand: undefined,
    ...props,
  };
}

export function createPropertyReference(props: OmitKindReference<PropertyReference>): PropertyReference {
  return {
    kind: SyntaxKind.PropertyReference,
    _expressionBrand: undefined,
    _referenceBrand: undefined,
    ...props,
  };
}

export function createRangeLiteral(props: OmitKindLiteral<RangeLiteral>): RangeLiteral {
  return {
    kind: SyntaxKind.RangeLiteral,
    _expressionBrand: undefined,
    _literalBrand: undefined,
    ...props,
  };
}

export function createSetDirective(props: OmitKindDirective<SetDirective>): SetDirective {
  return {
    kind: SyntaxKind.SetDirective,
    _directiveBrand: undefined,
    ...props,
  };
}

export function createStringLiteral(props: OmitKindLiteral<StringLiteral>): StringLiteral {
  return {
    kind: SyntaxKind.StringLiteral,
    _expressionBrand: undefined,
    _literalBrand: undefined,
    ...props,
  };
}

export function createTemplateLiteral(props: OmitKindLiteral<TemplateLiteral>): TemplateLiteral {
  return {
    kind: SyntaxKind.TemplateLiteral,
    _expressionBrand: undefined,
    _literalBrand: undefined,
    ...props,
  };
}

export function createTemplateSpan(props: OmitKind<TemplateSpan>): TemplateSpan {
  return {
    kind: SyntaxKind.TemplateSpan,
    ...props,
  };
}

export function createTextNode(props: OmitKind<TextNode>): TextNode {
  return {
    kind: SyntaxKind.TextNode,
    ...props,
  };
}

export function createVariableReference(props: OmitKindReference<VariableReference>): VariableReference {
  return {
    kind: SyntaxKind.VariableReference,
    _expressionBrand: undefined,
    _referenceBrand: undefined,
    ...props,
  };
}

export function isBinaryExpression(node: Node): node is BinaryExpression {
  return node.kind === SyntaxKind.BinaryExpression;
}

export function isBlock(node: Node): node is Block {
  return node.kind === SyntaxKind.Block;
}

export function isBooleanLiteral(node: Node): node is BooleanLiteral {
  return node.kind === SyntaxKind.BooleanLiteral;
}

export function isCallExpression(node: Node): node is CallExpression {
  return node.kind === SyntaxKind.CallExpression;
}

export function isDirective(node: Node): node is Directive {
  return '_directiveBrand' in node;
}

export function isExpression(node: Node): node is Expression {
  return '_expressionBrand' in node;
}

export function isFile(node: Node): node is File {
  return node.kind === SyntaxKind.File;
}

export function isForeachDirective(node: Node): node is ForeachDirective {
  return node.kind === SyntaxKind.ForeachDirective;
}

export function isIdentifier(node: Node): node is Identifier {
  return node.kind === SyntaxKind.Identifier;
}

export function isIfDirective(node: Node): node is IfDirective {
  return node.kind === SyntaxKind.IfDirective;
}

export function isIndexNotation(node: Node): node is IndexNotation {
  return node.kind === SyntaxKind.IndexNotation;
}

export function isListLiteral(node: Node): node is ListLiteral {
  return node.kind === SyntaxKind.ListLiteral;
}

export function isLiteral(node: Node): node is Literal {
  return '_literalBrand' in node;
}

export function isMapLiteral(node: Node): node is MapLiteral {
  return node.kind === SyntaxKind.MapLiteral;
}

export function isMethodReference(node: Node): node is MethodReference {
  return node.kind === SyntaxKind.MethodReference;
}

export function isNewLine(node: Node): node is NewLine {
  return node.kind === SyntaxKind.NewLine;
}

export function isNumericLiteral(node: Node): node is NumericLiteral {
  return node.kind === SyntaxKind.NumericLiteral;
}

export function isParenthesizedExpression(node: Node): node is ParenthesizedExpression {
  return node.kind === SyntaxKind.ParenthesizedExpression;
}

export function isPrefixUnaryExpression(node: Node): node is PrefixUnaryExpression {
  return node.kind === SyntaxKind.PrefixUnaryExpression;
}

export function isPropertyNotation(node: Node): node is PropertyNotation {
  return node.kind === SyntaxKind.PropertyNotation;
}

export function isPropertyReference(node: Node): node is PropertyReference {
  return node.kind === SyntaxKind.PropertyReference;
}

export function isRangeLiteral(node: Node): node is RangeLiteral {
  return node.kind === SyntaxKind.RangeLiteral;
}

export function isReference(node: Node): node is Reference {
  return '_referenceBrand' in node;
}

export function isSetDirective(node: Node): node is SetDirective {
  return node.kind === SyntaxKind.SetDirective;
}

export function isStringLiteral(node: Node): node is StringLiteral {
  return node.kind === SyntaxKind.StringLiteral;
}

export function isTemplateLiteral(node: Node): node is TemplateLiteral {
  return node.kind === SyntaxKind.TemplateLiteral;
}

export function isTextNode(node: Node): node is TextNode {
  return node.kind === SyntaxKind.TextNode;
}

export function isVariableReference(node: Node): node is VariableReference {
  return node.kind === SyntaxKind.VariableReference;
}
