import React, { useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { BrowserRouter, Link, Switch, Route, Redirect } from 'react-router-dom';

import { Button, Stack, CircularProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LoopIcon from '@mui/icons-material/Loop';
import LinkIcon from '@mui/icons-material/Link';
import MailIcon from '@mui/icons-material/Mail';

import MetaMaskOnboarding from '@metamask/onboarding';

import { TopNavBar } from './Screens/TopNavBar';
import { ExpertStage } from './Screens/ExpertStage';
import { PortfolioPrices } from './Screens/PortfolioPrices';
import { SwapTrade } from './Screens/SwapTrade';
import { BuySell } from './Screens/BuySell';
import { SendReceive } from './Screens/SendReceive';
import { BottomFooter } from './Screens/BottomFooter';
import { usePositions } from '../contexts/portfolioContext';

import { useNetwork } from '../contexts/networkContext';
import { useExperts } from '../contexts/expertsContext';

import { usePolygonNetwork } from '../hooks/usePolygonNetwork';

import './App.scss';

const CryptoRoute = ({ component: Component, emptyPositions, ...rest }) => {
  return (
    <Route
      {...rest}
      render={() =>
        emptyPositions ? <Redirect to="/BuySell" /> : <Component />
      }
    />
  );
};

function App() {
  const { isAuthenticated, Moralis, enableWeb3, isWeb3Enabled } = useMoralis();
  const { user, isUserUpdating } = useMoralis();
  const { positions, isLoading } = usePositions();
  const { setAccounts, setNetworkId, isPolygon } = useNetwork();
  const { setDialog } = useExperts();
  const address = user?.attributes?.ethAddress;
  const hasMetamask = window.ethereum?.isMetaMask;

  const { getSelectedNetwork, switchNetworkToPolygon } = usePolygonNetwork();

  useEffect(() => {
    if (isAuthenticated) {
      // We are calling this on each render
      // to update context from metamask.
      // It will also update checkes, We are using Polygon or not.
      if (isWeb3Enabled) {
        getSelectedNetwork();
      }
    } else {
      setDialog('Welcome to USA Wallet.  Simple, Safe, Secure.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  useEffect(() => {
    if (isAuthenticated && !isPolygon && hasMetamask) {
      switchNetworkToPolygon();
    }
  }, [hasMetamask, isAuthenticated, isPolygon, switchNetworkToPolygon]);

  useEffect(() => {
    const initMoralisEvents = () => {
      Moralis.onAccountsChanged((accounts) => {
        console.log('Account Changed Called.', accounts);
        Moralis.link(accounts[0]);
        setAccounts(accounts);
        if (user && !isUserUpdating) {
          // setUserData(
          //   {
          //     accounts: accounts,
          //     ethAddress: accounts?.length > 0 ? accounts[0] : null,
          //   },
          //   {
          //     onError: (error) => {
          //       console.log('UpdateUserError:', error);
          //     },
          //   }
          // );
        }
      });
      Moralis.onChainChanged((chainId) => {
        console.log('ChainId:', chainId);
        setNetworkId(parseInt(chainId));
      });
    };

    if (isAuthenticated) {
      initMoralisEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Moralis, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!isWeb3Enabled) {
        enableWeb3();
      }
      if (isWeb3Enabled) {
        if (MetaMaskOnboarding.isMetaMaskInstalled()) {
          if (window?.ethereum?.selectedAddress) {
            setAccounts([window.ethereum?.selectedAddress]);
            if (user && !isUserUpdating) {
              // setUserData(
              //   {
              //     accounts: [window.ethereum?.selectedAddress],
              //     ethAddress: window.ethereum?.selectedAddress,
              //   },
              //   {
              //     onError: (error) => {
              //       console.log('UpdateUserError:', error);
              //     },
              //   }
              // );
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled, enableWeb3]);

  const emptyPositions = !address || positions.length === 0;
  const isOnlyMatic = positions.length === 1 && positions[0].symbol === 'MATIC';

  if (isLoading) {
    return (
      <CircularProgress
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  }

  return (
    <Stack alignItems="center" spacing={2.5} p={3}>
      <TopNavBar />
      <ExpertStage />
      {isAuthenticated && isPolygon ? (
        <BrowserRouter>
          <Stack
            direction="row"
            sx={{ alignSelf: 'center', justifyContent: 'center', mb: 2 }}
            spacing={1}
          >
            <Link
              to="/PortfolioPrices"
              className={`NavBar${emptyPositions ? ' disabled' : ''}`}
            >
              <Button
                variant="uw"
                sx={{
                  boxShadow: 'var(--boxShadow)',
                }}
                startIcon={<VisibilityIcon />}
              >
                Portfolio
              </Button>
            </Link>
            <Link
              to="/SwapTrade"
              className={`NavBar${emptyPositions ? ' disabled' : ''}`}
            >
              <Button
                variant="uw"
                sx={{
                  boxShadow: 'var(--boxShadow)',
                }}
                startIcon={<LoopIcon />}
              >
                Trade
              </Button>
            </Link>
            <Link to="/BuySell" className="NavBar">
              <Button
                variant="uw"
                sx={{
                  boxShadow: 'var(--boxShadow)',
                }}
                startIcon={<LinkIcon />}
              >
                Buy Crypto
              </Button>
            </Link>

            <Link
              to="/SendRecieve"
              className={`NavBar${emptyPositions ? ' disabled' : ''}`}
            >
              <Button
                variant="uw"
                sx={{
                  boxShadow: 'var(--boxShadow)',
                }}
                startIcon={<MailIcon />}
              >
                {isOnlyMatic ? 'Recieve' : 'Send/Recieve'}
              </Button>
            </Link>
          </Stack>
          <Switch>
            <CryptoRoute
              exact
              path="/PortfolioPrices"
              component={PortfolioPrices}
              emptyPositions={emptyPositions}
            />
            <CryptoRoute
              exact
              path="/SwapTrade"
              component={SwapTrade}
              emptyPositions={emptyPositions}
            />
            <Route exact path="/BuySell">
              <BuySell />
            </Route>
            <CryptoRoute
              exact
              path="/SendRecieve"
              component={SendReceive}
              emptyPositions={emptyPositions}
            />
            <Redirect to={isOnlyMatic ? '/SwapTrade' : '/PortfolioPrices'} />
          </Switch>
        </BrowserRouter>
      ) : (
        <BottomFooter />
      )}
    </Stack>
  );
}

export default App;
