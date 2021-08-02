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

    //
    // Generate VTL.
    //
    const sources = project.getSourceFiles("templates/*.ts");
    const templates: { [name: string]: string } = {};

    for (const source of sources) {
      const moduleName = source.getBaseNameWithoutExtension();

      const transpiler = createTranspiler({ source });

      const errors = transpiler.getErrors();
      if (errors.length) {
        vtl.printVTLErrors(errors);
        throw new Error('Generating VTL failed');
      }

      for (const file of transpiler.getFiles()) {
        const generator = vtl.createGenerator();
        const vtlString = generator.generateTemplate(file);

        templates[`${moduleName}.${file.name}`] = vtlString;
      }
    }

    //
    // Define GraphQL API.
    //
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
      requestMappingTemplate: MappingTemplate.fromString(templates["Query_getItem.request"]),
      responseMappingTemplate: MappingTemplate.fromString(templates["Query_getItem.response"]),
    }));

    schema.addQuery("updateItem", new ResolvableField({
      returnType: GraphqlType.intermediate({
        intermediateType: itemType,
      }),
      args: {
        id: GraphqlType.string(),
      },
      dataSource: demoTableDataSource,
      requestMappingTemplate: MappingTemplate.fromString(templates["Query_updateItem.request"]),
      responseMappingTemplate: MappingTemplate.fromString(templates["Query_updateItem.response"]),
    }));
  }
}
