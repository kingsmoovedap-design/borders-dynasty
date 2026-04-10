import { renderApp } from "./server.js"; // or wherever your render logic lives

export const metadata = {
  name: "borders",
  version: "1.0.0",
  description: "Borders Dynasty subsystem with render hooks",
  hooks: []
};

export async function bordersCommands(args, runtime) {
  const action = args[0];
  switch (action) {
    case "start":
      runtime.logger.info("Starting Borders render subsystem...");
      await renderApp(); // call your render() or server start
      console.log("Borders render subsystem running.");
      break;
    case "stop":
      runtime.logger.info("Stopping Borders subsystem...");
      process.exit(0);
      break;
    default:
      console.log("Usage: borders start | stop");
  }
}
