import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig(process.env);
const app = createApp({ corsOrigin: config.corsOrigin, version: config.version });

app.listen(config.port, () => {
  console.log(`salary-api listening on port ${config.port}`);
});
