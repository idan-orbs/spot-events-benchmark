import { RePermit } from "generated";

RePermit.Spend.handler(async ({ event, context }) => {
  const id = `${event.chainId}_${event.transaction.hash}_${event.logIndex}`;

  context.Spend.set({
    id,
    signer: event.params.signer,
    permitHash: event.params.permitHash,
    token: event.params.token,
    to: event.params.to,
    amount: event.params.amount,
    totalSpent: event.params.totalSpent,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    logIndex: event.logIndex,
  });
});

RePermit.Cancel.handler(async ({ event, context }) => {
  const id = `${event.chainId}_${event.transaction.hash}_${event.logIndex}`;

  context.Cancel.set({
    id,
    signer: event.params.signer,
    digest: event.params.digest,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    logIndex: event.logIndex,
  });
});
