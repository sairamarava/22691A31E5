import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box
} from '@mui/material';
import logger from '../utils/logger';

const StatisticsTable = ({ statistics }) => {
  logger.info('Rendering StatisticsTable component');

  if (!statistics || statistics.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          No statistics available
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table aria-label="URL statistics table">
        <TableHead>
          <TableRow>
            <TableCell>Short URL</TableCell>
            <TableCell>Original URL</TableCell>
            <TableCell align="right">Total Clicks</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell>Expires At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {statistics.map((row) => (
            <TableRow key={row.shortCode}>
              <TableCell>
                <a
                  href={`http://localhost:8080/${row.shortCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.shortCode}
                </a>
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.originalUrl}
                </Typography>
              </TableCell>
              <TableCell align="right">{row.clicks}</TableCell>
              <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
              <TableCell>{new Date(row.expiresAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StatisticsTable;
