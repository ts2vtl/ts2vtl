import yargs = require('yargs');
import { exitOnError } from './exitOnError';
import { ts2vtl } from './ts2vtl';

async function main() {
  const argv = await yargs
    .positional("files", {
      array: true,
      type: "string",
    })
    .options({
      outDir: {
        describe: 'Output templates to the directory',
        type: 'string',
      },
      outFile: {
        describe: 'Output to single file',
        type: 'string',
      },
      project: {
        alias: 'p',
        describe: 'The path of tsconfig.json',
        type: 'string',
      },
      verbose: {
        alias: 'v',
        describe: 'Verbose mode',
        type: 'boolean',
        default: false,
      },
    })
    .version()
    .help()
    .argv;

  await ts2vtl({
    tsConfigFilePath: argv.project,
    outDir: argv.outDir,
    outFile: argv.outFile,
    globPatterns: argv.files,
  });
}

main().catch(exitOnError);
