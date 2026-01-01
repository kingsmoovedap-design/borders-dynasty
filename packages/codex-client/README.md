# @borders/codex-client

Reusable client for communicating with the Codex Ecclesia service.

## Usage

```js
const { codexLog } = require("@borders/codex-client");

await codexLog("LOAD_CREATED", "LOGISTICS", { loadId: 1 }, "omega");
```

## Environment Variables

- `CODEX_URL` - URL of the Codex Ecclesia service (default: http://localhost:3001)
