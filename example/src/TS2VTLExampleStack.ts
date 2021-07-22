import { Construct } from "@aws-cdk/core";
import { DefaultEnvStack } from "@cdk-util/core";

export class TS2VTLExampleStack extends DefaultEnvStack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      description: `TS2VTL Example`,
    });
  }
}
