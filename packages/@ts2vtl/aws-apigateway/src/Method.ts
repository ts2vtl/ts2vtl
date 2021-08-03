export class Method {
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
