import { useEffect, useState, useRef } from 'react';
import { Box, FormControl, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useMoralis } from 'react-moralis';

import { useActions } from '../../../contexts/actionsContext';
import { useExperts } from '../../../contexts/expertsContext';
import { useColorMode } from '../../../contexts/colorModeContext';
import { useNetwork } from '../../../contexts/networkContext';

import { usePolygonNetwork } from '../../../hooks/usePolygonNetwork';
import MetaMaskOnboarding from '@metamask/onboarding';
import detectEthereumProvider from '@metamask/detect-provider';

const NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const ONEINCH_API = 'https://api.1inch.io/v4.0/';
const GENERATE_SWAP_ENDPOINT = '/swap';
const REFERRER_ADDRESS = process.env.REACT_APP_ONEINCH_REFERRER_ADDRESS;
const REFERRER_FEE = process.env.REACT_APP_ONEINCH_REFERRER_FEE;

export const TradeTokens = () => {
  const { fromToken, toToken, txAmount } = useActions();
  const { setDialog } = useExperts();
  const { colorMode } = useColorMode();

  const { Moralis } = useMoralis();
  const { network } = useNetwork();
  const { switchNetworkToPolygon } = usePolygonNetwork();
  const [provider, setProvider] = useState({});
  const [user, setUser] = useState({});
  const onboarding = useRef();

  const [buttonText, setButtonText] = useState('Trade Tokens');
  const [trading, setTrading] = useState(false);
  const [mode, setMode] = useState('allowance');

  const generateSwapAPI =
    ONEINCH_API + network.id.toString() + GENERATE_SWAP_ENDPOINT;

  useEffect(() => {
    if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding();
    }
  }, []);

  useEffect(() => {
    Moralis.User.currentAsync().then(function (u) {
      console.log('user:', u);
      setUser(u);
    });
  }, [Moralis.User]);

  useEffect(() => {
    setButtonText(mode === 'allowance' ? 'Check Allowance' : 'Trade');
  }, [mode]);

  const setupProvider = async () => {
    const p = await detectEthereumProvider();
    if (p) {
      setProvider(p);
      console.log('provider:', p);
      return p;
    } else {
      console.log('MetaMask not detected! Onboarding MetaMask...');
      onboarding.current.startOnboarding();
    }
  };

  const assurePolygon = (provider) => {
    window.ethereum
      .request({ method: 'net_version' })
      .then((networkId) => {
        if (networkId === 137) {
          console.log('Network is Polygon.');
          return networkId;
        } else {
          console.log('Not Polygon.  Attempting to switch...');
          return switchNetworkToPolygon();
        }
      })
      .catch((error) => {
        console.log('networkId error:', error);
        return undefined;
      });
  };

  const getAllowance = async () => {
    if (fromToken?.token_address === undefined) {
      console.log('Attempted to get allowance without a token address.');
      console.log('fromToken:', fromToken);
      setMode('trade');
      return undefined;
    }
    if (fromToken?.token_address === NATIVE_ADDRESS) {
      console.log('Attempted to get allowance on a native token.');
      setMode('trade');
      return undefined;
    }
    setDialog('Checking your token trading allowance...');
    setButtonText('Checking Allowance');
    const params = {
      chain: network.name, // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: fromToken.token_address, // The token you want to swap
      fromAddress: user?.attributes['ethAddress'], // Your wallet address
      amount: txAmount, // No decimals
    };
    console.log('params: ', params);
    return Moralis.Plugins.oneInch
      .hasAllowance(params)
      .then((allowanceReturn) => {
        const outputString =
          'Your ' +
          fromToken.symbol.toUpperCase() +
          ' allowance is ' +
          allowanceReturn;
        setDialog(outputString);
        setButtonText('Allowance found');
        console.log('allowance check:', outputString);
        setMode(allowanceReturn ? 'trade' : 'allowance');
        return allowanceReturn;
      })
      .catch((error) => {
        setDialog('Allowance check error: ', error);
        setButtonText('Retry');
        console.log('getAllowance error: ', error);
        return undefined;
      });
  };

  async function approveInfinity() {
    const outputText =
      'Unlocking ' +
      fromToken.symbol +
      ' on ' +
      network.name +
      ' to trade. Please sign in MetaMask.';
    setDialog(outputText);
    console.log(outputText);
    setButtonText('Unlocking ' + fromToken.symbol);
    const props = {
      chain: network.name, // The blockchain you want to use (eth/bsc/polygon)
      tokenAddress: fromToken.token_address, // The token you want to swap
      fromAddress: user?.attributes['ethAddress'], // Your wallet address
    };
    console.log('props:', props);
    try {
      await Moralis.Plugins.oneInch.approve(props);
      const replyText = fromToken.symbol + ' on ' + network.name + ' unlocked!';
      setDialog(replyText);
      console.log(replyText);
      setButtonText(fromToken.symbol + ' unlocked!');
      setMode('trade');
    } catch (error) {
      switch (error.code) {
        case 4001:
          setDialog(
            fromToken.symbol +
              ' trading unlock canceled.  ' +
              'Choose another token to trade or hit Redo Allowance to continue.'
          );
          break;
        default:
          setDialog(
            'A ' +
              error.code +
              ' error occured while unlocking ' +
              fromToken.symbol +
              '.  Hit Redo Allowance to try again.'
          );
      }
      setButtonText('Redo Allowance');
      setTrading(false);
      console.log('Approveal failed. ', error);
    }
  }

  const prepSwapTx = async () => {
    const outputText =
      'Preparing transaction to swap ' +
      txAmount / 10 ** fromToken.decimals +
      ' ' +
      fromToken?.symbol +
      ' for ' +
      toToken?.symbol +
      '.';
    setDialog(outputText);
    setButtonText('Prepping Swap');
    console.log(outputText);
    console.log('fromToken:', fromToken);
    console.log('user:', user);
    const url =
      generateSwapAPI +
      '?fromTokenAddress=' +
      (fromToken?.token_address || NATIVE_ADDRESS) +
      '&toTokenAddress=' +
      (toToken?.address || NATIVE_ADDRESS) +
      '&amount=' +
      txAmount +
      '&fromAddress=' +
      user?.attributes['ethAddress'] +
      '&slippage=1&referrerAddress=' +
      REFERRER_ADDRESS +
      '&fee=' +
      REFERRER_FEE +
      '&disableEstimate=false&allowPartialFill=false';
    console.log('Swap Tx prep url:', url);
    return await fetch(url, {
      method: 'GET',
    })
      .then((res) => res.json())
      .then((res) => {
        setDialog('Swap Tx prepped!');
        setButtonText('Prepped Swap Tx!');
        console.log('Unsigned Swap Tx:', res);
        return res;
      })
      .catch((error) => {
        setDialog('Swap prep error: ', error.message);
        setButtonText('Retry');
        console.log('Swap prep error:', error);
        return undefined;
      });
  };

  const signTransaction = async (unsignedTx, title) => {
    if (!window.ethereum.isConnected()) {
      setDialog('RPC Provider is not connected.');
      console.log('PRC Provider is not connected.');
      setButtonText('Reconnect');
      return undefined;
    }
    if (unsignedTx.tx) {
      setDialog(
        'Please use MetaMask to approve this ' + title + ' transaction.'
      );
      setButtonText('Tx to sign');
      unsignedTx.tx.gas = unsignedTx.tx.gas.toString();
      console.log('Tx to sign:', unsignedTx.tx);
      return await window.ethereum
        .request({
          method: 'eth_sendTransaction',
          params: [unsignedTx.tx],
        })
        .then((result) => {
          setDialog('Tx receipt hash:', result);
          setButtonText('Success!  Repeat?');
          console.log('Tx result:', result);
          return result;
        })
        .catch((error) => {
          setDialog('Tx signature error: ', error.message);
          setButtonText('Retry');
          console.log('Tx signature error:', error);
        });
    } else {
      setDialog('Skipping signature for blank ' + title + ' transaction.');
      setButtonText('Skipping Tx sign');
      console.log('Skipping Tx signature for ' + title);
    }
  };

  const broadcastTx = async (signedTx, title) => {
    setDialog('Sending ' + title + ' to the blockchain...');
    setButtonText('Sending...');
    console.log('Signed Tx for broadcast:', signedTx);
    return await provider.eth
      .sendSignedTransaction(signedTx)
      .then((raw) => {
        setDialog('Waiting for ' + title + ' to be mined...');
        setButtonText('Mining...');
        console.log('Waiting for Tx receipt...');
        return provider.waitForTransaction(raw.hash);
      })
      .then((mined) => {
        setDialog('Retrieving Tx receipt...');
        setButtonText('Receipt...');
        console.log('Received receipt:', mined);
        return provider.getTransactionReceipt(mined.hash);
      })
      .catch((error) => {
        setDialog('Tx send error: ', error.message);
        setButtonText('Retry');
        console.log('Tx send error:', error);
      });
  };

  function displaySwapReceipt(receipt) {
    console.log('Swap Transfer 1Inch receipt:', receipt);
  }

  const handleClick = () => {
    setTrading(true);
    switch (mode) {
      case 'allowance':
        getAllowance()
          .then((allowance) => {
            allowance ? console.log('Moving on...') : approveInfinity();
          })
          .then(() => setupProvider())
          .then((p) => assurePolygon(p))
          .catch((error) => {
            setDialog('An allowance error occured: ', error);
            setButtonText('Retry');
            console.log('swap process error:', error);
          });
        break;
      case 'trade':
        prepSwapTx()
          .then((swapTx) => signTransaction(swapTx, 'swap'))
          .then((signedSwapTx) =>
            broadcastTx(signedSwapTx, 'signed swap transaction')
          )
          .then((swapReceipt) => displaySwapReceipt(swapReceipt))
          .catch((error) => {
            setDialog('A swap process error occured: ', error);
            setButtonText('Retry');
            console.log('swap process error:', error);
          });
        break;
      default:
        setDialog('Unknown mode: ' + mode);
        setButtonText('Retry');
        console.log('Unknown mode: ', mode);
    }
    setTrading(false);
  };

  return (
    <Box style={{ marginTop: 20 }}>
      <FormControl id="allowance" fullWidth>
        <Tooltip title="Execute trade transactions.">
          <span>
            <LoadingButton
              disabled={false}
              variant={colorMode === 'light' ? 'outlined' : 'contained'}
              sx={{ boxShadow: 'var(--box-shadow)' }}
              loading={trading}
              onClick={handleClick}
              className={'quote-button'}
            >
              {buttonText}
            </LoadingButton>
          </span>
        </Tooltip>
      </FormControl>
    </Box>
  );
};
