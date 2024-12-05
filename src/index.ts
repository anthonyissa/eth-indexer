import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { DatabaseService } from './database';
import { UserOperationEvent } from './types';
import { setupAPI } from './api';
import { MetricsService } from './metrics';
dotenv.config();

const ENTRY_POINT_ADDRESS = '0x0000000071727de22e5e9d8baf0edac6f37da032';
const USER_OPERATION_EVENT_TOPIC = '0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f';

export const db = new DatabaseService();
export const metricsService = new MetricsService(db); 

async function getHistoricalEvents(
    provider: ethers.Provider,
    startBlock: number,
    endBlock: number
  ) {
    console.log(`Fetching historical events from block ${startBlock} to ${endBlock}`);
    
    const filter = {
      address: ENTRY_POINT_ADDRESS,
      topics: [USER_OPERATION_EVENT_TOPIC],
      fromBlock: startBlock,
      toBlock: endBlock
    };
  
    try {
      const logs = await provider.getLogs(filter);
      console.log(`Found ${logs.length} historical events`);
      
      for (const log of logs) {
        try {
          console.log(`Processing historical UserOperation event: ${log.transactionHash}`);
          const event = decodeUserOperationEvent(log);
          await db.saveUserOperation(event);
        } catch (error) {
          console.error('Error processing historical event:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching historical events:', error);
      throw error;
    }
  }

function decodeUserOperationEvent(log: ethers.Log): UserOperationEvent {
  const iface = new ethers.Interface([
    "event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)"
  ]);
  
  const event = iface.parseLog(log);
  if (!event) throw new Error('Failed to parse log');

  return {
    userOpHash: event.args[0],
    sender: event.args[1],
    paymaster: event.args[2],
    nonce: event.args[3],
    success: event.args[4],
    actualGasCost: event.args[5],
    actualGasUsed: event.args[6],
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash
  };
}

async function setupProvider(retryCount = 0, maxRetries = 5): Promise<ethers.Provider> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    await provider.getNetwork();
    return provider;
  } catch (error) {
    if (retryCount >= maxRetries) {
      console.error('Max retry attempts reached. Unable to connect to provider.');
      throw error;
    }
    
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); 
    console.warn(`Failed to connect to provider. Retrying in ${delay/1000} seconds...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return setupProvider(retryCount + 1, maxRetries);
  }
}

const main = async () => {
  console.log('ETH Indexer Starting...');
  
  let provider: ethers.Provider | null = null;
  console.log(await db.getAllUserOperations());

  const setupAndListen = async () => {
    try {
      setupAPI(db, process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000);
      provider = await setupProvider();
      const network = await provider.getNetwork();
      console.log(`Connected to network: ${network.name}`);

      const startBlock = process.env.START_BLOCK ? 
        parseInt(process.env.START_BLOCK) : 
        await provider.getBlockNumber();
        
      console.log(`Starting from block: ${startBlock}`);
          
      const currentBlock = await provider.getBlockNumber();
      if (startBlock < currentBlock) {
        await getHistoricalEvents(provider, startBlock, currentBlock);
      }

      const filter = {
        address: ENTRY_POINT_ADDRESS,
        topics: [USER_OPERATION_EVENT_TOPIC]
      };

      provider.on(filter, async (log) => {
        try {
          console.log(`New UserOperation event detected: ${log.transactionHash}`);
        } catch (error) {
          console.error('Error processing event:', error);
        }
      });

      provider.on('error', (error) => {
        console.error('Provider error:', error);
        reconnect();
      });

      console.log('Listening for UserOperation events...');
    } catch (error) {
      console.error('Error in setup:', error);
      reconnect();
    }
  };

  const reconnect = async () => {
    if (provider) {
      provider.removeAllListeners();
    }
    console.log('Attempting to reconnect...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await setupAndListen();
  };

  await setupAndListen();
};

main().catch((error) => {
  console.error('Error in main:', error);
  process.exit(1);
}); 