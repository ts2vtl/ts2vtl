import { Context } from "./Context";
import { Input } from "./Input";
import { Integration } from "./Integration";
import { Method } from "./Method";
import { Util } from "./Util";

export { Context } from "./Context";
export { Input } from "./Input";
export { Integration } from "./Integration";
export { Method } from "./Method";
export { Util } from "./Util";

export const $method = new Method();
export const $integration = new Integration();
export const $context = new Context();
export const $input = new Input();
export const $stageVariables: { [name: string]: string } = {};
export const $util = new Util();
