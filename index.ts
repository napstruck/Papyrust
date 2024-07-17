import { configDotenv } from 'dotenv';
configDotenv();

import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { initMongoDB } from './db/db-init';
import { envSchema } from './env.schema';
import { appRouter } from './routers/app';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { test_main } from './trpc.test';
import { uptimeInSecond } from './utils/system';
import { WebSocketServer } from 'ws';

envSchema.parse(process.env);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

applyWSSHandler({ wss, router: appRouter });

app.use(cors({ origin: ['http://localhost:5173', 'https://papyrust.netlify.app'] }));

app.get('/', (_, res) => {
  res.json({ status: 'OK', uptime: uptimeInSecond(), message: 'All Good WW 🌻' });
});

app.use('/trpc', createExpressMiddleware({ router: appRouter }));

server.listen(process.env.PORT || 3000, async () => {
  envSchema.parse(process.env);
  console.log(`[✓] Server running at http://localhost:${process.env.PORT || 3000}`);
  await initMongoDB();
  //await test_main();
});
