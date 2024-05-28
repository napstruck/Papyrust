import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/app';
import crypto from 'node:crypto';

const cipherioClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
});

async function runTest() {
  const res = await cipherioClient.helloStuti.query();
  console.log(res);

  /* const res2 = await cipherioClient.chat.createRoom.mutate({
    chatRoomName: 'worlds_best_team',
    password: 'fox',
    adminToken: crypto.randomBytes(48).toString('hex'),
  });
  console.log(res2); */

  /* const res2_5 = await cipherioClient.chat.sendMessage.mutate({
    inviteCode: '96fd1a761cf207342bbc3e205fa59cdf79c82dd24d9f0aa67e29d1a96f94cb0c5a10984994a11ab82e6ae2f054cc55b7',
    password: 'fox',
    messageBody: {
      content: 'Omg its working AAAAAAAA',
      sender_username: 'batman',
      sender_token_hash: crypto.randomBytes(48).toString('hex'),
    },
  });

  console.log(res2_5); */

  try {
    const res3 = await cipherioClient.chat.getMessages.query({
      inviteCode: '96fd1a761cf207342bbc3e205fa59cdf79c82dd24d9f0aa67e29d1a96f94cb0c5a10984994a11ab82e6ae2f054cc55b7',
      password: 'fox',
      frameIndex: 1,
    });
    console.log(res3.payload.messages);
  } catch (e) {
    console.error(e);
  }
}

export async function test_main() {
  console.log('--------------------------');
  await runTest();
  console.log('--------------------------');
}
