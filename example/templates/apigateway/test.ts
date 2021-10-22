import { Context } from "@ts2vtl/aws-apigateway";

export function response(this: Context) {
  return {
    accountId: `${this.accountId}`,
    identity: {
      apiKey: `${this.identity.apiKey}`,
      sourceIp: `${this.identity.sourceIp}`,
    },
  };
}
