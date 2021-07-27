import { Construct, RemovalPolicy } from "@aws-cdk/core";
import { DefaultEnvStack } from "@cdk-util/core";
import { AuthorizationType, GraphqlApi, GraphqlType, MappingTemplate, ObjectType, ResolvableField, Schema } from "@aws-cdk/aws-appsync";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import { Project } from 'ts-morph';
import { createTranspiler, vtl } from "@ts2vtl/core";

export class TS2VTLExampleStack extends DefaultEnvStack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      description: `TS2VTL Example`,
    });

    const demoTable = new Table(this, 'demoTable', {
      tableName: "ts2vtl-demo",
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const project = new Project({
      tsConfigFilePath: "tsconfig.json",
    });

    const source = project.getSourceFileOrThrow("templates/Query_getItem_request.ts");

    const transpiler = createTranspiler({ source });

    const errors = transpiler.getErrors();
    if (errors.length) {
      vtl.printVTLErrors(errors);
      throw new Error('Generating VTL failed');
    }

    const generator = vtl.createGenerator();

    const files = transpiler.getFiles();

    const vtlString = generator.generateTemplate(files[0]);

    const schema = new Schema();

    const graphqlApi = new GraphqlApi(this, "graphqlApi", {
      name: "ts2vtl",
      schema,
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.IAM,
        },
      },
    });

    const demoTableDataSource = graphqlApi.addDynamoDbDataSource("demoTableDataSource", demoTable);

    const itemType = new ObjectType("Item", {
      definition: {
        value: GraphqlType.string(),
      },
    });

    schema.addType(itemType);

    schema.addQuery("getItem", new ResolvableField({
      returnType: GraphqlType.intermediate({
        intermediateType: itemType,
      }),
      args: {
        id: GraphqlType.string(),
      },
      dataSource: demoTableDataSource,
      requestMappingTemplate: MappingTemplate.fromString(vtlString),
      responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
    }));
  }
}
