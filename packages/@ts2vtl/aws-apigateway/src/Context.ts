export class Context {
  accountId: string;
  apiId: string;
  authorizer: {
    claims: {
      [name: string]: string;
    };
    principalId: string;
  };
  awsEndpointRequestId: string;
  domainName: string;
  domainPrefix: string;
  error: {
    message: string;
    messageString: string;
    responseType: string;
    validationErrorString: string;
  };
  extendedRequestId: string;
  httpMethod: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
  identity: {
    accountId: string;
    apiKey: string;
    apiKeyId: string;
    caller: string;
    cognitoAuthenticationProvider: string;
    cognitoAuthenticationType: "authenticated" | "unauthenticated";
    cognitoIdentityId: string;
    cognitoIdentityPoolId: string;
    principalOrgId: string;
    sourceIp: string;
    clientCert: {
      clientCertPem: string;
      subjectDN: string;
      issuerDN: string;
      serialNumber: string;
      validity: {
        notBefore: string;
        notAfter: string;
      };
    };
    user: string;
    userAgent: string;
    userArn: string;
  };
  path: string;
  protocol: string;
  requestId: string;
  requestOverride: {
    header: {
      [name: string]: string;
    };
    path: {
      [name: string]: string;
    };
    querystring: {
      [name: string]: string;
    };
  };
  responseOverride: {
    header: {
      [name: string]: string;
    };
    status: number;
  };
  requestTime: string;
  requestTimeEpoch: number;
  resourceId: string;
  resourcePath: string;
  stage: string;
  wafResponseCode: string;
  webaclArn: string;
}
