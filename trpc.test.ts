import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/app';

const cipherioClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
});

async function runTest() {
  const res = await cipherioClient.helloStuti.query();
  console.log(res);
}

export async function test_main() {
  console.log('--------------------------');
  await runTest();
  console.log('--------------------------');
}
