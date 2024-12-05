import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { UserOperationCard } from './UserOperationCard';
import { UserOperation } from './types';

export const UserOperationList: React.FC = () => {
  const [operations, setOperations] = useState<UserOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/operations');
      setOperations(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch operations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    const interval = setInterval(fetchOperations, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" mt={4}>
        {error}
      </Typography>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Operations
      </Typography>
      {operations.map((operation) => (
        <UserOperationCard 
          key={operation.userOpHash} 
          operation={operation} 
        />
      ))}
    </Container>
  );
};