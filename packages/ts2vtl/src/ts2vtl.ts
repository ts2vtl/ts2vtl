import {
  Project,
} from 'ts-morph';
import {
  createTranspiler,
  vtl,
} from "@ts2vtl/core";
import { mkdir, stat, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";

export interface TS2VTLOptions {
  /**
   * The path of `tsconfig.json`.
   *
   * If this option is a path of a directory, use `tsconfig.json` in the directory.
   *
   * @default 'tsconfig.json'
   */
  tsConfigFilePath?: string;

  /**
   * Glob patterns to specify source files that are transpiled.
   */
  globPatterns?: ReadonlyArray<string>;

  /**
   * Output a generated VTL template to this path.
   */
  outFile?: string;

  /**
   * Output generated VTL ttemplates in this directory.
   */
  outDir?: string;
}

export async function ts2vtl(options: TS2VTLOptions) {
  const {
    outFile,
    outDir,
  } = options;

  if (outDir && outFile) {
    throw new Error("The outDir and outFile options cannot be specified at once");
  }

  const project = new Project({
    tsConfigFilePath: await getTSConfigFilePath(options),
  });

  const sources = getSourceFiles(project, options);

  if (sources.length > 1 && outFile) {
    throw new Error("The outDir option instead of the outFile one must be specified for multiple source files");
  }

  if (outFile) {
    if (outFile.indexOf("/") >= 0) {
      await mkdir(dirname(outFile), { recursive: true });
    }

    const transpiler = createTranspiler({ source: sources[0] });

    const errors = transpiler.getErrors();
    if (errors.length) {
      vtl.printVTLErrors(errors);
      return;
    }

    const files = transpiler.getFiles();
    if (files.length > 1) {
      throw new Error("The outDir option instead of the outFile one must be specified because multiple functions are defined");
    }

    const generator = vtl.createGenerator();
    const template = generator.generateTemplate(files[0]);

    writeFile(outFile, template);
  } else if (outDir) {
    const srcBaseDir = getBaseDir(sources.map(s => s.getFilePath()));

    for (const source of sources) {
      const transpiler = createTranspiler({ source });

      const errors = transpiler.getErrors();
      if (errors.length) {
        vtl.printVTLErrors(errors);
        continue;
      }

      const generator = vtl.createGenerator();

      const files = transpiler.getFiles();
      const rel = relative(srcBaseDir, source.getFilePath());

      if (files.length === 1 && files[0].name === "default") {
        const outFile = join(outDir, rel.replace(/\.([^\.]+)$/, ".vtl"));
        await mkdir(dirname(outFile), { recursive: true });
        const template = generator.generateTemplate(files[0]);
        writeFile(outFile, template);
      } else {
        for (const file of files) {
          const outFile = join(outDir, rel.replace(/\.([^\.]+)$/, `/${file.name}.vtl`));
          await mkdir(dirname(outFile), { recursive: true });
          const template = generator.generateTemplate(file);
          writeFile(outFile, template);
        }
      }
    }
  } else {
    for (const source of sources) {
      const transpiler = createTranspiler({ source });

      const errors = transpiler.getErrors();
      if (errors.length) {
        vtl.printVTLErrors(errors);
        continue;
      }

      const generator = vtl.createGenerator();

      for (const file of transpiler.getFiles()) {
        const template = generator.generateTemplate(file);

        console.log("%s", template);
      }
    }
  }
}

async function getTSConfigFilePath(options: TS2VTLOptions) {
  const {
    tsConfigFilePath = "tsconfig.json",
  } = options;

  return (await stat(tsConfigFilePath)).isDirectory() ?
    join(tsConfigFilePath, "tsconfig.json") :
    tsConfigFilePath;
}

function getSourceFiles(project: Project, options: TS2VTLOptions) {
  const sources = options.globPatterns ? project.getSourceFiles(options.globPatterns) : project.getSourceFiles();

  return sources.filter(source => !source.getFilePath().split("/").includes("@ts2vtl"));
}

function getBaseDir(filePaths: string[]) {
  const [first, ...rest] = filePaths;
  const baseSegments = first.split("/");

  // Drop the basename.
  baseSegments.pop();

  for (const filePath of rest) {
    const segments = filePath.split("/");

    for (let i = 0; i < baseSegments.length; ++i) {
      if (baseSegments[i] !== segments[i]) {
        baseSegments.length = i;
        break;
      }
    }
  }

  return baseSegments.join("/") || "/";
}
