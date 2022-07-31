import { $input } from "@ts2vtl/aws-apigateway";

export function request() {
  const foo = $input.params("foo");

  const json = `{
    "foo": ${foo}
  }`;

  return {
    json,
  };
}
