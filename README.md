# ts2vtl

Generate VTL templates from TypeScript sources.

## Usage

```
npx ts2vtl -p path/to/tsconfig.json --outDir path/to/dir src/template.ts
```

## Options

```
Options:
      --outDir   Output templates to the directory                      [string]
      --outFile  Output to single file                                  [string]
  -p, --project  The path of tsconfig.json                              [string]
  -v, --verbose  Verbose mode                         [boolean] [default: false]
      --version  Show version number                                   [boolean]
      --help     Show help                                             [boolean]
```

## Packages

- [@ts2vtl/aws-appsync](packages/@ts2vtl/aws-appsync)
- [@ts2vtl/core](packages/@ts2vtl/core)
- [@ts2vtl/java-types](packages/@ts2vtl/java-types)
- [@ts2vtl/vtl](packages/@ts2vtl/vtl)
- [ts2vtl](packages/ts2vtl)

## License

MIT
