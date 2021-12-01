import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TradingViewWidget from 'react-tradingview-widget';

import useTokenInfo from '../../../actions/useTokenInfo';
import LoadIcon from '../../../media/load.gif';
import './styles.scss';

const TokenCard = ({ symbol, onClose }, ref) => {
  const { data, prices } = useTokenInfo(symbol);
  console.log('prices => ', prices);
  const handleClick = (link) => {
    window.open(link, '_blank');
  };

  const { market_data, links } = data || {};

  return (
    <Box ref={ref} className="token-card">
      {data ? (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mt: 3.75,
            }}
          >
            <Box sx={{ display: 'flex' }}>
              <Box
                component="img"
                sx={{ height: 70, width: 70 }}
                src={data.image.large}
              />
              <Box className="header-title">
                <Typography>{data.name}</Typography>
                <Typography>Currency</Typography>
              </Box>
            </Box>
            <Box>
              <IconButton onClick={onClose}>
                <CloseIcon color="primary" />
              </IconButton>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mt: 3.75,
            }}
          >
            <Box>
              <Typography className="title">Market Price</Typography>
              <Typography className="price">
                ${market_data.current_price.usd}
              </Typography>
              <Typography className="title">
                {market_data.current_price.btc} BTC
              </Typography>
            </Box>
            <Box>
              <Typography className="title">1H Change</Typography>
              <Typography
                className={
                  market_data.price_change_percentage_1h_in_currency.usd > 0
                    ? 'percent'
                    : 'percent negative'
                }
              >
                {market_data.price_change_percentage_1h_in_currency.usd}%
              </Typography>
            </Box>
            <Box>
              <Typography className="title">24H Change</Typography>
              <Typography
                className={
                  market_data.price_change_percentage_24h > 0
                    ? 'percent'
                    : 'percent negative'
                }
              >
                {market_data.price_change_percentage_24h}%
              </Typography>
              <Typography
                className={
                  market_data.price_change_24h > 0
                    ? 'i-price'
                    : 'i-price negative'
                }
              >
                ${market_data.price_change_24h}
              </Typography>
            </Box>
            <Box>
              <Typography className="title">7D Change</Typography>
              <Typography
                className={
                  market_data.price_change_percentage_7d > 0
                    ? 'percent'
                    : 'percent negative'
                }
              >
                {market_data.price_change_percentage_7d}%
              </Typography>
              <Typography
                className={
                  market_data.price_change_percentage_7d > 0
                    ? 'i-price'
                    : 'i-price negative'
                }
              >
                $
                {(market_data.current_price.usd *
                  market_data.price_change_percentage_7d) /
                  100}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mt: 3.75,
            }}
          >
            <Box>
              <Typography className="title">Market Cap</Typography>
              <Typography fontSize="14px" className="price">
                ${market_data.market_cap.usd}
              </Typography>
              <Typography className="title">
                {market_data.market_cap.btc} BTC
              </Typography>
            </Box>
            <Box>
              <Typography className="title">24H Volume</Typography>
              <Typography className="title" fontSize="14px" opacity={1}>
                ${market_data.market_cap_change_24h}
              </Typography>
              <Typography className="title">
                {market_data.market_cap_change_24h_in_currency.btc} BTC
              </Typography>
            </Box>
          </Box>
          <Box className="trading-view">
            <TradingViewWidget
              symbol={data.symbol}
              // theme={}
              autosize
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mt: 3.75,
            }}
            className="button-wrap"
          >
            {links.blockchain_site
              .filter((a, index) => a && a.indexOf('scan') > -1 && index < 5)
              .map((b, index) => (
                <Button
                  onClick={() => handleClick(b)}
                  key={index}
                  variant="contained"
                  size={links.blockchain_site.length > 5 ? 'small' : 'medium'}
                  className="link-button"
                >
                  {b.split('/')[2].split('.')[0]}
                </Button>
              ))}
          </Box>
        </>
      ) : (
        <img className="loading" src={LoadIcon} alt="" />
      )}
    </Box>
  );
};

export default React.forwardRef(TokenCard);
