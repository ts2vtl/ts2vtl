class Method {
  request: {
    path: {
      [name: string]: string;
    };
    querystring: {
      [name: string]: string;
    };
    multivaluequerystring: {
      [name: string]: string[];
    };
    header: {
      [name: string]: string;
    };
    multivalueheader: {
      [name: string]: string[];
    };
    body: any;
  } = {
      body: "",
      header: {},
      multivalueheader: {},
      multivaluequerystring: {},
      path: {},
      querystring: {},
    };
}

class Integration {
  response: {
    header: {
      [name: string]: string;
    };
    multivalueheader: {
      [name: string]: string[];
    };
    body: any;
  } = {
      body: "",
      header: {},
      multivalueheader: {},
    };
}

class Context {
  accountId: string;
  apiId: string;
  authorizer: {
    claims: {
      [name: string]: string;
    };
    principalId: string;
    // [name: string]: string;
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

class Input {
  body: string;
  json(path: string): any {
  }
  params(name?: string): { [name: string]: string } {
    return {};
  }
  path(name: string): any {
  }
}

class Util {
  escapeJavaScript(data: any): string {
    return "";
  }
  parseJson(json: string): any {
  }
  urlEncode(data: string): string {
    return "";
  }
  urlDecode(data: string): string {
    return "";
  }
  base64Encode(data: string): string {
    return "";
  }
  base64Decode(data: string): string {
    return "";
  }
}

export const $method = new Method();
export const $integration = new Integration();
export const $context = new Context();
export const $input = new Input();
export const $stageVariables: { [name: string]: string } = {};
export const $util = new Util();
