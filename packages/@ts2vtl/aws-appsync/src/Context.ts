import { Error } from './Error';

export interface RequestContext {
  arguments: any;
  args: any;
  identity: {
    accountId: string;
    cognitoIdentityPoolId: string;
    cognitoIdentityId: string;
    sourceIp: string[];
    username: string;
    userArn: string;
    cognitoIdentityAuthType: string;
    cognitoIdentityAuthProvider: string;
    sub: string;
    issuer: string;
    claims: any;
    defaultAuthStrategy: string;
  };
  source: any;
  stash: any;
  result: any;
  prev: {
    result: any;
  };
  request: {
    headers: any;
  };
  info: any;
}

export interface ResponseContext extends RequestContext {
  error?: Error;
  result: any;
}
