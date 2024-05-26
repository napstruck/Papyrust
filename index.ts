import { configDotenv } from 'dotenv';
configDotenv();

import express from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { initMongoDB } from './db/db-init';
import { envSchema } from './env.schema';
import { appRouter } from './routers/app';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { test_main } from './trpc.test';

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: ['http://localhost:5173'],
  }),
);

let startTime = Date.now();
app.get('/', (_, res) => {
  res.json({
    status: 'OK',
    code: '200',
    uptime: Number((Date.now() - startTime) / 1000).toFixed(0),
    message: 'All Good WW 🌻',
  });
});

app.use('/trpc', createExpressMiddleware({ router: appRouter }));

server.listen(process.env.PORT || 3000, async () => {
  envSchema.parse(process.env);
  console.log(`[✓] Server running at http://localhost:${process.env.PORT || 3000}`);
  await initMongoDB();
  await test_main();
});
