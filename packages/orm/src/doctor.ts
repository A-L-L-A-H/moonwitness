import { runDoctor } from "./doctor-cli.js";

process.exitCode = await runDoctor(process.argv.slice(2), process.env, {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
});
