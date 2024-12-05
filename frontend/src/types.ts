export interface UserOperation {
    userOpHash: string;
    sender: string;
    paymaster: string;
    nonce: string;
    success: boolean;
    actualGasCost: string;
    actualGasUsed: string;
    blockNumber: number;
    transactionHash: string;
  }