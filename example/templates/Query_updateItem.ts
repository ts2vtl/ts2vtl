import {
  $util,
  ResponseContext,
  RequestContext,
} from "@ts2vtl/aws-appsync";
import {
  entrySet,
  isEmpty,
  add,
  addAll,
  keySet,
  String,
} from "@ts2vtl/java-types";

interface Input {
  [key: string]: any;
}

/**
 * updateItem
 * 
 * @param this 
 * @param id 
 * @param input 
 */
export function request(this: RequestContext, id: string, input: Input) {
  const expValues: { [key: string]: any } = {};
  const expSet: { [key: string]: any } = {};
  const expRemove: string[] = [];

  if (!$util.isNull(input)) {
    for (const entry of entrySet(input)) {
      if (!$util.isNullOrEmpty(entry.value)) {
        expSet[entry.key] = entry.value;
      } else if (entry.value === "") {
        add(expRemove, entry.key);
      }
    }
  }

  const expression: string[] = [];

  if (!isEmpty(expSet)) {
    add(expression, 'SET');

    const terms: string[] = [];
    for (const entry of entrySet(expSet)) {
      add(terms, `#${entry.key} = :${entry.key}`);
      expValues[entry.key] = entry.value;
    }

    add(expression, String.join(',', terms))
  }

  if (!isEmpty(expRemove)) {
    add(expression, 'REMOVE');

    const terms: string[] = [];
    for (const entry of expRemove) {
      add(terms, `#${entry}`);
    }

    add(expression, String.join(',', terms))
  }

  const expNames: string[] = [];
  addAll(expNames, keySet(expValues));
  addAll(expNames, expRemove);

  const expressionNames: { [key: string]: string } = {};
  for (const key of expNames) {
    expressionNames[`#${key}`] = key;
  }

  const expressionValues: { [key: string]: any } = {};
  for (const entry of entrySet(expValues)) {
    expressionValues[`:${entry.key}`] = $util.dynamodb.toDynamoDB(entry.value);
  }

  return {
    "version": "2018-05-29",
    "operation": "UpdateItem",
    "key": {
      "id": $util.dynamodb.toDynamoDBJson(id),
    },
    "update": {
      "expression": $util.toJson(String.join(' ', expression)),
      "expressionNames": $util.toJson(expressionNames),
      "expressionValues": $util.toJson(expressionValues),
    },
  };
}

export function response(this: ResponseContext) {
  if (this.error) {
    $util.error(this.error.message, this.error.type);
  }

  return this.result;
}
