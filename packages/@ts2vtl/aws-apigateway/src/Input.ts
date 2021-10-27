export class Input {
  body: string;

  json(path: string): any {
  }

  params(): { [name: string]: string; };
  params(name: string): string;
  params(name?: string): { [name: string]: string; } | string {
    return {};
  }

  path(name: string): any {
  }
}
