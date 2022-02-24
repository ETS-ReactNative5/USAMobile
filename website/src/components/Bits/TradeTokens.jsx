import { useEffect, useState } from 'react';
import { Box, FormControl, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useMoralis } from 'react-moralis';

import { useActions } from '../../contexts/actionsContext';
import { useExperts } from '../../contexts/expertsContext';
import { useColorMode } from '../../contexts/colorModeContext';
import { useNetwork } from '../../contexts/networkContext';

const NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const ONEINCH_API = 'https://api.1inch.io/v4.0/';
const CHECK_ALLOWANCE_ENDPOINT = '/approve/allowance';
const SET_ALLOWANCE_ENDPOINT = '/approve/transaction';
const GENERATE_SWAP_ENDPOINT = '/swap';
const REFERRER_ADDRESS = process.env.REACT_APP_ONEINCH_REFERRER_ADDRESS;
const REFERRER_FEE = process.env.REACT_APP_ONEINCH_REFERRER_FEE;

export const TradeTokens = () => {
  const { fromToken, toToken, txAmount } = useActions();
  const { setDialog } = useExperts();
  const { colorMode } = useColorMode();

  const { isAuthenticated, Moralis, user } = useMoralis();
  const { network } = useNetwork();
  const [provider, setProvider] = useState({});

  const [buttonText, setButtonText] = useState('Trade Tokens.');
  const [trading, setTrading] = useState(false);
  const [allowance, setAllowance] = useState('0');
  const [userAddress, setUserAddress] = useState('');

  const checkAllowanceAPI =
    ONEINCH_API + network.id.toString() + CHECK_ALLOWANCE_ENDPOINT;
  const setAllowanceAPI =
    ONEINCH_API + network.id.toString() + SET_ALLOWANCE_ENDPOINT;
  const generateSwapAPI =
    ONEINCH_API + network.id.toString() + GENERATE_SWAP_ENDPOINT;

  useEffect(() => {
    if (isAuthenticated) {
      try {
        setUserAddress(user?.attributes['ethAddress']);
      } catch (error) {
        setDialog('Authentication error: ', error.message);
        console.log('TradeTokens authentication error:', error);
      }
    }
  }, [isAuthenticated, setDialog, user?.attributes]);

  async function setupProvider() {
    try {
      const p = await Moralis.enableWeb3();
      setProvider(p);
      console.log('provider:', p);
      // From now on, this should always be true:
      // provider === window.ethereum
    } catch {
      // TODO: divert to onboarding.
      console.log('MetaMask not detected! ');
    }
  }

  function checkNetworkId() {
    provider?.eth.getChainId().then((iD) => {
      console.log('networkId:', iD);
      if (iD !== 137) {
        // TODO: redirect to switch network
        console.log('networkId error: not on Polygon!');
      }
      return iD;
    });
  }

  function retrieveAllowance(token) {
    if ((token?.address !== undefined) & (token?.address !== NATIVE_ADDRESS)) {
      setDialog('Checking your token trading allowance...');
      const url =
        checkAllowanceAPI +
        '?tokenAddress=' +
        token.address +
        '&walletAddress=' +
        userAddress;
      console.log('Checking with: ', url);
      const onChainAllowance = fetch(url, {
        method: 'GET',
      })
        .then((res) => res.json())
        .then((res) => {
          const outputString =
            token.symbol.toUpperCase() +
            ' allowance is ' +
            res.allowance / 10 ** token.decimals +
            '.';
          setDialog(outputString);
          console.log('allowance check:', outputString);
          setButtonText('Allowance found!');
          return res.allowance;
        })
        .catch((error) => {
          setDialog('Allowance check error: ' + error.message);
          setButtonText('Retry');
          console.log('Allowance check error:', error);
        });
      setAllowance(onChainAllowance);
    } else {
      setDialog(`No allowance to check on ${token?.symbol}.`);
      setButtonText('Skip Allowance Check...');
      console.log('Skipping allowance check for token: ', token);
      setAllowance(Infinity);
    }
  }

  function compareAllowance() {
    if (fromToken.address) {
      const offset = 10 ** fromToken.decimals;
      const allowanceTokens = allowance / offset;
      const txAmountTokens = txAmount / offset;
      const comparison = allowanceTokens < txAmountTokens;
      console.log(
        'allowance: ' +
          allowanceTokens +
          ' ?>= txAmount: ' +
          txAmountTokens +
          ' = ' +
          comparison
      );
      if (comparison)
        throw new Error({
          name: 'InsufficientAllowance',
          message:
            'On-chain allowance of ' +
            allowanceTokens +
            ' is not enough to trade ' +
            txAmountTokens +
            ' ' +
            fromToken.symbol.toUpperCase() +
            ' with.',
        });
    } else {
      console.log('Native token granted infinite allowance.');
    }
  }

  const prepAllowanceTx = (token, txAmount) => {
    if (token.address & (token.address !== NATIVE_ADDRESS)) {
      const outputText =
        'Preparing to unlock' +
        txAmount / 10 ** token.decimals +
        ' ' +
        token.symbol.toUpperCase() +
        ' for trade.';
      setDialog(outputText);
      setButtonText('Prepping Unlock...');
      const url =
        setAllowanceAPI +
        '?tokenAddress=' +
        fromToken.token_address +
        '&amount=' +
        txAmount.toString();
      console.log('url 4 unlock:', url);
      return fetch(url, {
        method: 'GET',
      })
        .then((res) => res.json())
        .then((res) => {
          setDialog('Allowance unlock Tx prepped!');
          setButtonText('Prepped Allowance Tx!');
          console.log('Allowance Unlock Tx: ', res);
          return res;
        })
        .catch((error) => {
          setDialog('Allowance prep error: ', error.message);
          setButtonText('Retry');
          console.log('Allowance prep error:', error);
        });
    } else {
      setDialog('Native token does not need an allowance unlock.');
      setButtonText('Native...');
      console.log('Native token does not need a trading allowance.');
      return undefined;
    }
  };

  const prepSwapTx = (fromToken, toToken, txAmount) => {
    const outputText =
      'Preparing transaction to swap ' +
      txAmount / 10 ** fromToken.decimals +
      ' ' +
      fromToken.symbol.toUppperCase() +
      ' for ' +
      toToken.symbol.toUpperCase() +
      '.';
    setDialog(outputText);
    setButtonText('Prepping Swap...');
    console.log(outputText);
    const url =
      generateSwapAPI + '?fromTokenAddress=' + fromToken?.token_address ||
      NATIVE_ADDRESS + '&toTokenAddress=' + toToken?.address ||
      NATIVE_ADDRESS +
        '&amount=' +
        txAmount +
        '&fromAddress=' +
        userAddress +
        '&slippage=' +
        '1' +
        '&referrerAddress=' +
        REFERRER_ADDRESS +
        '&fee=' +
        REFERRER_FEE +
        '&disableEstimate=' +
        'false' +
        '&allowPartialFill=' +
        'false';
    console.log('Swap Tx prep url:', url);
    return fetch(url, {
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
      });
  };

  const signTransaction = (unsignedTx, title) => {
    if (unsignedTx) {
      setDialog(
        'Please use MetaMask to approve this ' + title + ' transaction.'
      );
      console.log('Tx to sign:', unsignedTx);
      return provider.eth.signTransaction(unsignedTx).catch((error) => {
        setDialog('Tx signature error: ', error.message);
        setButtonText('Retry');
        console.log('Tx signature error:', error);
      });
    } else {
      setDialog('Skipping signature for blank ' + title + ' transaction.');
      setButtonText('Skipping Tx sign...');
      console.log('Skipping Tx signature for ' + title);
    }
  };

  const broadcastTx = (signedTx, title) => {
    setDialog('Sending ' + title + ' to the blockchain...');
    setButtonText('Sending...');
    console.log('Signed Tx for broadcast:', signedTx);
    return provider.eth
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
    setupProvider()
      .then(() => checkNetworkId())
      .then(() => prepAllowanceTx(fromToken, txAmount))
      .then((allowanceTx) =>
        signTransaction(allowanceTx, 'unlock trading allowance')
      )
      .then((signedAllowanceTx) =>
        broadcastTx(signedAllowanceTx, 'signed trading allowance transaction')
      )
      .then(() => retrieveAllowance())
      .then(() => compareAllowance())
      .then(() => prepSwapTx(fromToken, toToken, txAmount))
      .then((swapTx) => signTransaction(swapTx, 'swap'))
      .then((signedSwapTx) =>
        broadcastTx(signedSwapTx, 'signed swap transaction')
      )
      .then((swapReceipt) => displaySwapReceipt(swapReceipt))
      .catch((error) => {
        setDialog('A swap process error occured: ', error);
        setButtonText('Retry');
        console.log('swap process error:', error);
        setTrading(false);
      });
  };

  return (
    <Box style={{ marginTop: 20 }}>
      <FormControl id="allowance" fullWidth>
        <Tooltip title="Manage token trading allowance.">
          <span>
            <LoadingButton
              disabled={txAmount <= 0}
              variant={colorMode === 'light' ? 'outlined' : 'contained'}
              sx={{ boxShadow: 'var(--box-shadow)' }}
              loading={trading}
              onClick={handleClick}
              className={allowance < txAmount ? 'quote-button' : 'quote-button'}
            >
              {buttonText}
            </LoadingButton>
          </span>
        </Tooltip>
      </FormControl>
    </Box>
  );
};