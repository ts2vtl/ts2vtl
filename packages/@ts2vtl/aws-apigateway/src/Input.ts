export class Input {
  body: string;
  json(path: string): any {
  }
  params(name?: string): { [name: string]: string; } {
    return {};
  }
  path(name: string): any {
  }
}
