import { Error } from './Error';


export interface RequestContext {
  args: any;
}

export interface ResponseContext extends RequestContext {
  error?: Error;
  result: any;
}
