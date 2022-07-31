import { expect, test } from '@jest/globals';
import { createTranspiler, vtl } from "../";
import { Project } from 'ts-morph';

test('appsync-template', () => {
  const project = new Project({
    tsConfigFilePath: "test/tsconfig.json",
  });

  const source = project.getSourceFileOrThrow("test/templates/appsync-template.ts");
  const transpiler = createTranspiler({ source });

  expect(transpiler.getErrors()).toEqual([]);

  const files = transpiler.getFiles();

  const generator = vtl.createGenerator();
  const vtlString = generator.generateTemplate(files[0]);

  expect(vtlString).toMatchInlineSnapshot(`
"## Module: appsync-template
## Function: request
#set($String = \\"\\")
#set($String = \${String.class})

#set($expValues = {})
#set($expSet = {})
#set($expRemove = [])

#if(!\${util.isNull(\${ctx.arguments.input})})
  #foreach($entry in \${ctx.arguments.input.entrySet()})
    #if(!\${util.isNullOrEmpty(\${entry.value})})
      #set(\${expSet[\${entry.key}]} = \${entry.value})
    #elseif(\${entry.value} == \\"\\")
      \${util.qr(\${expRemove.add(\${entry.key})})}
    #end
  #end
#end

#set($expression = [])

#if(!\${expSet.isEmpty()})
  \${util.qr(\${expression.add(\\"SET\\")})}

  #set($terms = [])
  #foreach($entry in \${expSet.entrySet()})
    \${util.qr(\${terms.add(\\"#\${entry.key} = :\${entry.key}\\")})}
    #set(\${expValues[\${entry.key}]} = \${entry.value})
  #end

  \${util.qr(\${expression.add(\${String.join(\\",\\", $terms)})})}
#end

#if(!\${expRemove.isEmpty()})
  \${util.qr(\${expression.add(\\"REMOVE\\")})}

  #set($terms = [])
  #foreach($entry in $expRemove)
    \${util.qr(\${terms.add(\\"#$entry\\")})}
  #end

  \${util.qr(\${expression.add(\${String.join(\\",\\", $terms)})})}
#end

#set($expNames = [])
\${util.qr(\${expNames.addAll(\${expValues.keySet()})})}
\${util.qr(\${expNames.addAll($expRemove)})}

#set($expressionNames = {})
#foreach($key in $expNames)
  #set(\${expressionNames[\\"#$key\\"]} = $key)
#end

#set($expressionValues = {})
#foreach($entry in \${expValues.entrySet()})
  #set(\${expressionValues[\\":\${entry.key}\\"]} = \${util.dynamodb.toDynamoDB(\${entry.value})})
#end

{
  \\"version\\": \\"2018-05-29\\",
  \\"operation\\": \\"UpdateItem\\",
  \\"key\\": {
    \\"id\\": \${util.dynamodb.toDynamoDBJson(\${ctx.arguments.id})}
  },
  \\"update\\": {
    \\"expression\\": \${util.toJson(\${String.join(\\" \\", $expression)})},
    \\"expressionNames\\": \${util.toJson($expressionNames)},
    \\"expressionValues\\": \${util.toJson($expressionValues)}
  }
}"
`);
});

test('appsync-template', () => {
  const project = new Project({
    tsConfigFilePath: "test/tsconfig.json",
  });

  const source = project.getSourceFileOrThrow("test/templates/apigateway-template.ts");
  const transpiler = createTranspiler({ source });

  expect(transpiler.getErrors()).toEqual([]);

  const files = transpiler.getFiles();

  const generator = vtl.createGenerator();
  const vtlString = generator.generateTemplate(files[0]);

  expect(vtlString).toMatchInlineSnapshot(`
"## Module: apigateway-template
## Function: request
#set($esc = {
  \\"q\\": '\\"'
})

#set($foo = \${input.params(\\"foo\\")})

#set($json = \\"{
    \${esc.q}foo\${esc.q}: $foo
  }\\")

{
  \\"json\\": $json
}"
`);
});
