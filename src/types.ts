export interface UserOperationEvent {
    userOpHash: string;
    sender: string;
    paymaster: string;
    nonce: bigint;
    success: boolean;
    actualGasCost: bigint;
    actualGasUsed: bigint;
    blockNumber: number;
    transactionHash: string;
  }

  export interface UserOperationFilter {
    userOpHash?: string;
    sender?: string;
    paymaster?: string;
    fromBlock?: number;
    toBlock?: number;
    success?: boolean;
  }