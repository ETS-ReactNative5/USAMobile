import { useEffect, useMemo } from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';

import { useActions } from '../../contexts/actionsContext';
import { useExperts } from '../../contexts/expertsContext';
import { useQuote } from '../../contexts/quoteContext';
import { useNetwork } from '../../contexts/networkContext';
import tokenList from '../../data/TokenList.json';

export const ToSelect = () => {
  const { fromTokenSymbol, setToToken } = useActions();
  const { setDialog } = useExperts();
  const { setQuote } = useQuote();
  const { network } = useNetwork();
  const tokens = useMemo(
    () =>
      tokenList.filter(
        (item) =>
          // eslint-disable-next-line eqeqeq
          item.networkId == network.id &&
          item.symbol.toLowerCase() !== fromTokenSymbol.toLowerCase()
      ),
    [network, fromTokenSymbol]
  );

  useEffect(() => {
    return () => {
      setToToken();
    };
  }, [setToToken]);

  const handleChange = async (e, value) => {
    if (value) {
      setToToken(value);
      setDialog(
        "Press the 'Get Swap Quote' " +
          'to get a quote to swap ' +
          fromTokenSymbol +
          ' to ' +
          value.symbol +
          '.'
      );
    } else {
      setToToken();
      setDialog('Select a token to receive from the pull-down menu.');
    }
    setQuote();
  };

  const filterOptions = (options, { inputValue }) => {
    const str = inputValue.toLowerCase();
    return options.filter(
      (o) =>
        o.symbol.toLowerCase().includes(str) ||
        o.name.toLowerCase().includes(str)
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        options={tokens}
        getOptionLabel={(option) =>
          `${option.symbol.toUpperCase()} (${option.name})`
        }
        filterOptions={filterOptions}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <img
              width="30"
              src={option.image}
              alt=""
              style={{ borderRadius: '50%' }}
            />
            <span style={{ flex: 1, margin: '0 8px' }}>
              {option.symbol.toUpperCase()}
            </span>
            <span style={{ opacity: 0.5 }}>{option.name}</span>
          </Box>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Select a token to receive." />
        )}
        onChange={handleChange}
      />
    </Box>
  );
};
