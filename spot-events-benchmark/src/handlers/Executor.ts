import { Executor } from "generated";

Executor.Settled.handler(async ({ event, context }) => {
  const id = `${event.chainId}_${event.transaction.hash}_${event.logIndex}`;

  context.Settled.set({
    id,
    orderHash: event.params.orderHash,
    swapper: event.params.swapper,
    exchange: event.params.exchange,
    inToken: event.params.inToken,
    outToken: event.params.outToken,
    inAmount: event.params.inAmount,
    outAmount: event.params.outAmount,
    minOut: event.params.minOut,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    logIndex: event.logIndex,
  });
});
