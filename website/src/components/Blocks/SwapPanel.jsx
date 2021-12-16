import { useEffect } from 'react';
import { Box } from '@mui/material';

import { useActions } from '../../contexts/actionsContext';
import { useQuote } from '../../contexts/quoteContext';

import { FromSelect } from '../Bits/FromSelect';
import { AmountSelect } from '../Bits/AmountSelect';

// Swap mode.
import { ToSelect } from '../Bits/ToSelect';
import { RequestQuote } from '../Bits/RequestQuote';
import { QuotePanel } from '../Scrapbox/QuotePanel';

export const SwapPanel = () => {
  const { fromToken, txAmount } = useActions();
  const { quoteValid, setQuote } = useQuote();
  useEffect(() => {
    setQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, txAmount]);
  return (
    <Box>
      {/* <Stack
        sx={{ alignItems: 'center', justifyContent: 'center', px: 5, py: 2.5 }}
        spacing={3}
      > */}
      <FromSelect />
      {/* {!!fromToken && (
        <> */}
      <Box className="select-amount">
        <AmountSelect />
        <ToSelect />
      </Box>
      <RequestQuote />
      {/* </>
      )} */}
      {quoteValid && <QuotePanel />}
      {/* </Stack> */}
    </Box>
  );
};
