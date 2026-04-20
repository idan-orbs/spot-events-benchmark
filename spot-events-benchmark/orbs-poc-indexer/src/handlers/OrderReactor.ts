import { OrderReactor } from "generated";

OrderReactor.Fill.handler(async ({ event, context }) => {
  const id = `${event.chainId}_${event.transaction.hash}_${event.logIndex}`;

  context.Fill.set({
    id,
    hash: event.params.hash,
    executor: event.params.executor,
    swapper: event.params.swapper,
    epoch: event.params.epoch,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    logIndex: event.logIndex,
  });
});
