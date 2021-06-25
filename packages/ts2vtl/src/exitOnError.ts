import chalk = require('chalk');

const { red } = chalk;

export function exitOnError(err: Error | null) {
  if (!err) {
    return;
  }

  console.error(`[${red('ERROR')}] ${err.message}`);

  if (process.env.DEBUG) {
    console.error();
    console.error(err);
  }

  process.exit(1);
}
