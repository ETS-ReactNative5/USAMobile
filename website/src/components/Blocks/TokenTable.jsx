import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Collapse,
  IconButton,
  Typography,
  Modal,
  Paper,
} from '@mui/material';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { usePositions } from '../../contexts/portfolioContext';
import { useNetwork } from '../../contexts/networkContext';
import { TransactionList } from './TransactionList';

import { getDataByCoinID } from '../../hooks/action';
import Card from '../Research/card';
import Loader from '../Research/load';

export const TokenTable = () => {
  const { isLoading, totalValue, positions } = usePositions();
  const { networkName } = useNetwork();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const getDataApi = getDataByCoinID();
  const handleClickRow = async (p) => {
    if (!p.id) return;
    setModalOpen(true);
    const data = await getDataApi(p.id);
    if (data.id) {
      setSelectedCoin(data);
    } else {
      onModalClose();
    }
  };

  const onModalClose = () => {
    setModalOpen(false);
    setSelectedCoin(null);
  };
  function Position(props) {
    const { position } = props;
    const [open, setOpen] = React.useState(false);
    return (
      <React.Fragment>
        <TableRow
          sx={{ '& > *': { borderBottom: 'unset' } }}
          style={{ cursor: 'pointer' }}
          onClick={() => handleClickRow(position)}
        >
          <TableCell component="th" scope="row">
            <Avatar
              sx={{ background: '#790d01' }}
              name={position.symbol}
              src={position.image}
              size="sm"
            />
          </TableCell>
          <TableCell align="left" sx={{ border: 0 }}>
            <Typography ml={2}>{position.name}</Typography>
          </TableCell>
          <TableCell align="left" sx={{ border: 0 }}>
            <Typography ml={2}>{position.tokens.toPrecision(3)}</Typography>
          </TableCell>
          <TableCell align="left" sx={{ border: 0 }}>
            <Typography ml={2}>
              @ ${position.price && position.price.toFixed(2)}/
              {position.symbol && position.symbol.toUpperCase()}
            </Typography>
          </TableCell>
          <TableCell align="left" sx={{ border: 0 }}>
            <Typography ml={2}> = ${position.value.toFixed(2)}</Typography>
          </TableCell>
          <TableCell sx={{ border: 0 }}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={6} style={{ paddingBottom: 0, paddingTop: 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ m: 1 }}>
                <TransactionList
                  tokenAddress={position.token_address}
                  tokenSymbol={position.symbol.toLowerCase()}
                  chain={networkName}
                  decimals={position.decimals}
                />
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  }

  return (
    <Box sx={{ display: 'inline-flex', minWidth: 320, m: 'auto' }}>
      <TableContainer
        component={Paper}
        sx={{
          p: 2.5,
          borderRadius: '1.5rem',
          backgroundImage: 'var(--bg)',
          border: 4,
          borderColor: 'var(--borderColor)',
        }}
      >
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell align="center" colSpan={6} sx={{ p: 0, pb: 1 }}>
                {!isLoading && (
                  <Typography>
                    Total Value: ${parseFloat(totalValue).toFixed(2)}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              positions.map((position) => (
                <Position key={position.name} position={position} />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Modal
        open={modalOpen}
        aria-labelledby="Transaction Details Modal"
        aria-describedby="We will display Row Details here."
        sx={{ maxWidth: '56rem', mx: 'auto', my: '3.56rem', px: 3, py: 1 }}
        onBackdropClick={onModalClose}
      >
        <Box sx={{ background: 'white' }}>
          {selectedCoin ? (
            <Card data={selectedCoin} onClose={onModalClose} />
          ) : (
            <Loader />
          )}
        </Box>
      </Modal>
    </Box>
  );
};
