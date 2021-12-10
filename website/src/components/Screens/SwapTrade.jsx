import { useEffect } from 'react';
import { useMoralis } from 'react-moralis';

import { Box } from '@mui/material';

import { SwapPanel } from '../Blocks/SwapPanel';
import { Heading } from '../UW/Heading';

import { useExperts } from '../../contexts/expertsContext';
import { useNetwork } from '../../contexts/networkContext';
import { usePolygonNetwork } from '../../hooks/usePolygonNetwork';

const SwapTrade = () => {
  const { setCharacter, setDialog } = useExperts();
  const { isAuthenticated } = useMoralis();
  const { switchNetworkToPolygon } = usePolygonNetwork();
  const { isPolygon } = useNetwork();

  useEffect(() => {
    if (isAuthenticated) {
      if (!isPolygon) {
        setDialog('Check your Metamast and Accept Polygon Switch.');
        switchNetworkToPolygon();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isPolygon]);

  useEffect(() => {
    setCharacter('mlking');
    setDialog('Select a token to convert.');
  }, [setCharacter, setDialog]);

  return (
    <Box sx={{ textAlign: 'center', mt: 1 }}>
      <Heading variant="h4">Swap/Trade</Heading>
      <br />
      <SwapPanel />
    </Box>
  );
};

export default SwapTrade;
