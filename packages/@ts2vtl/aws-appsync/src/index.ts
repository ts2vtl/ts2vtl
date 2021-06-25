import { isEmpty } from "@ts2vtl/java-types";

class Util {
  error(message: string): never;
  error(message: string, errorType: string): never;
  error(message: string, errorType: string, data: any): never;
  error(message: string, errorType?: string, data?: any, errorInfo?: any): never {
    throw message;
  }

  isNull(value: any): boolean {
    return value === null;
  }

  isNullOrBlank(value: any): boolean {
    return value === null || value === '';
  }

  isNullOrEmpty(value: any): boolean {
    return value === null || isEmpty(value);
  }

  toJson(object: any): string {
    return JSON.stringify(object);
  }

  dynamodb = {
    toDynamoDB(object: any): any {

    },

    toDynamoDBJson(object: any): string {
      return JSON.stringify(this.toDynamoDB(object));
    },

    toString(string: string): any {
      return { S: string };
    },

    toStringJson(string: string): string {
      return JSON.stringify(this.toString(string));
    },
  };

  time = {
    nowEpochMilliSeconds(): number {
      return Date.now();
    },
  };
}

export interface RequestContext {
  args: any;
}

export interface ResponseContext extends RequestContext {
  error?: Error;
  result: any;
}

export interface Error {
  message: string;
  type: string;
}

export const $util = new Util();
export declare const $context: RequestContext;
export declare const $ctx: RequestContext;
