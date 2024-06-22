import {NodeModulesExternal} from "@finos/perspective-esbuild-plugin/external.js";
import { build } from "@finos/perspective-esbuild-plugin/build.js";
import { BuildCss } from "@prospective.co/procss/target/cjs/procss.js";
import fs from "fs";
import path_mod from "path";

const BUILD = [
  {
    define: {
      global: "window",
    },
    entryPoints: ["src/ts/index.ts"],
    plugins: [NodeModulesExternal()],
    format: "esm",
    loader: {
      ".css": "text",
      ".html": "text",
    },
    outfile: "dist/esm/dock-layout.js",
  },
  {
    define: {
      global: "window",
    },
    entryPoints: ["src/ts/index.ts"],
    plugins: [],
    format: "esm",
    loader: {
      ".css": "text",
      ".html": "text",
    },
    outfile: "dist/cdn/dock-layout.js",
  },
];

function add(builder, path) {
  builder.add(
    path,
    fs.readFileSync(path_mod.join("./src/less", path)).toString(),
  );
}

async function compile_css() {
  fs.mkdirSync("dist/css", { recursive: true });

  fs.readdirSync("src/less").forEach(file => {
    const outfile = file.replace(".less", ".css");
    const builder = new BuildCss("");
    add(builder, file);
    fs.writeFileSync(`dist/css/${outfile}`,
      builder.compile().get(outfile),
    );
  });
}

async function build_all() {
  await compile_css();
  await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
