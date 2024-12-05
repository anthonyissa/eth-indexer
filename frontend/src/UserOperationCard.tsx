import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { UserOperation } from './types';

interface Props {
  operation: UserOperation;
}

export const UserOperationCard: React.FC<Props> = ({ operation }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Hash: {operation.userOpHash.slice(0, 10)}...
        </Typography>
        <Typography color="textSecondary">
          Sender: {operation.sender}
        </Typography>
        <Typography color="textSecondary">
          Paymaster: {operation.paymaster}
        </Typography>
        <Typography>
          Block: {operation.blockNumber}
        </Typography>
        <Typography>
          Gas Cost: {operation.actualGasCost} wei
        </Typography>
        <Chip 
          label={operation.success ? "Success" : "Failed"}
          color={operation.success ? "success" : "error"}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );
};