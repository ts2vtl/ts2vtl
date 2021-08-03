export class Integration {
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
