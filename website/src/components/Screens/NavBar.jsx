import React from 'react';
import { Link } from 'react-router-dom';
import { useMoralis } from 'react-moralis';
import { Button, Stack } from '@mui/material';

import { usePositions } from '../../contexts/portfolioContext';

export const NavBar = () => {
  const { user } = useMoralis();
  const { positions } = usePositions();
  const address = user?.attributes?.ethAddress;
  const emptyPositions = !address || positions.length === 0;
  const isOnlyMatic = positions.length === 1 && positions[0].symbol === 'MATIC';

  return (
    <Stack direction="row" spacing={1} className="NavBar">
      <Link to="/">
        <Button
          variant="uw"
          startIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 58 58"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M36.25 14.5C36.25 14.5 36.25 7.25002 29 7.25002C21.75 7.25002 21.75 14.5 21.75 14.5M52.5625 30.8125V50.75H5.4375V30.8125H52.5625ZM3.625 14.5H54.375V29C54.375 29 43.5 36.25 29 36.25C14.5 36.25 3.625 29 3.625 29V14.5ZM29 39.875V32.625V39.875Z"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        >
          Home
        </Button>
      </Link>
      <Link to="/Portfolio" className={`${emptyPositions ? 'disabled' : ''}`}>
        <Button
          variant="uw"
          startIcon={
            <svg
              width="20"
              height="16"
              viewBox="0 0 54 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M53.5634 16.7064C47.9049 6.29833 37.9813 0 27 0C16.0187 0 6.07836 6.29833 0.470149 16.7064L0 17.4916L0.436567 18.2936C6.09515 28.7017 16.0187 35 27 35C37.9813 35 47.9216 28.7852 53.5634 18.2936L54 17.4916L53.5634 16.7064ZM27 31.5752C17.5466 31.5752 8.86567 26.3294 3.82836 17.4916C8.86567 8.65394 17.5466 3.40811 27 3.40811C36.4534 3.40811 45.0336 8.67064 50.1549 17.4916C45.0336 26.3294 36.4366 31.5752 27 31.5752Z"
                fill="currentColor"
              />
              <path
                d="M27.4866 6.08115C25.2099 6.09768 22.9892 6.78512 21.105 8.05665C19.2208 9.32818 17.7576 11.1268 16.9001 13.2252C16.0427 15.3237 15.8295 17.6279 16.2875 19.8469C16.7454 22.0658 17.8541 24.1 19.4733 25.6924C21.0925 27.2848 23.1498 28.3641 25.3851 28.7939C27.6205 29.2237 29.9337 28.9848 32.0327 28.1073C34.1317 27.2298 35.9222 25.753 37.1781 23.8636C38.4341 21.9742 39.0991 19.7569 39.0892 17.4916C39.0826 15.9838 38.777 14.492 38.19 13.1019C37.6029 11.7117 36.7459 10.4505 35.668 9.39053C34.5902 8.33053 33.3127 7.49257 31.9088 6.92468C30.5048 6.3568 29.0021 6.07014 27.4866 6.08115ZM27.4866 25.6611C25.8784 25.6446 24.311 25.1557 22.9812 24.2558C21.6515 23.3559 20.6186 22.085 20.0123 20.603C19.406 19.1209 19.2534 17.4936 19.5737 15.9255C19.8939 14.3574 20.6727 12.9184 21.8122 11.7893C22.9517 10.6601 24.4012 9.89113 25.9785 9.57892C27.5558 9.26671 29.1907 9.42518 30.6778 10.0344C32.1649 10.6437 33.4379 11.6765 34.337 13.0033C35.236 14.3301 35.721 15.8915 35.731 17.4916C35.7355 18.5685 35.525 19.6356 35.1119 20.631C34.6987 21.6263 34.0911 22.5302 33.3242 23.2901C32.5573 24.05 31.6464 24.6509 30.6443 25.0579C29.6422 25.4649 28.5689 25.67 27.4866 25.6611Z"
                fill="currentColor"
              />
            </svg>
          }
        >
          Portfolio
        </Button>
      </Link>
      <Link to="/SwapTrade" className={`${emptyPositions ? 'disabled' : ''}`}>
        <Button
          variant="uw"
          startIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 49 49"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M26.4823 22.4955C22.5177 21.1814 20.6023 20.3573 20.6023 18.2636C20.6023 15.9918 23.0745 15.1677 24.6336 15.1677C27.5514 15.1677 28.6205 17.3727 28.8655 18.1523L32.3845 16.66C32.0505 15.6577 30.5582 12.3836 26.7273 11.6709V8.90909H22.2727V11.7155C16.7491 12.9627 16.7268 18.0855 16.7268 18.3082C16.7268 23.3641 21.7382 24.7895 24.1882 25.6805C27.7073 26.9277 29.2664 28.0636 29.2664 30.2018C29.2664 32.7186 26.9277 33.7877 24.8564 33.7877C20.8027 33.7877 19.6445 29.6227 19.5109 29.1327L15.8136 30.625C17.2168 35.5027 20.8918 36.8168 22.2727 37.2177V40.0909H26.7273V37.3291C27.6182 37.1286 33.1864 36.015 33.1864 30.1573C33.1864 27.0614 31.8277 24.3441 26.4823 22.4955ZM4.45455 44.5455H0V31.1818H13.3636V35.6364H7.84C11.4259 41.0041 17.5509 44.5455 24.5 44.5455C29.8164 44.5455 34.915 42.4335 38.6743 38.6743C42.4335 34.915 44.5455 29.8164 44.5455 24.5H49C49 38.0418 38.0418 49 24.5 49C16.2145 49 8.88682 44.8795 4.45455 38.5986V44.5455ZM0 24.5C0 10.9582 10.9582 0 24.5 0C32.7855 0 40.1132 4.12045 44.5455 10.4014V4.45455H49V17.8182H35.6364V13.3636H41.16C37.5741 7.99591 31.4491 4.45455 24.5 4.45455C19.1836 4.45455 14.085 6.56647 10.3257 10.3257C6.56647 14.085 4.45455 19.1836 4.45455 24.5H0Z"
                fill="currentColor"
              />
            </svg>
          }
        >
          Trade
        </Button>
      </Link>
      <Link to="/BuySell">
        <Button
          variant="uw"
          startIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 55 55"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M48.1669 33.3797C50.1321 30.2979 51.173 26.7176 51.1667 23.0625C51.1667 12.4421 42.5579 3.83336 31.9375 3.83336C28.1405 3.83336 24.6008 4.93386 21.6203 6.83163C19.6367 6.94289 17.6734 7.28948 15.7717 7.86409C17.2172 6.32732 18.8737 5.00357 20.6914 3.93247C24.0771 1.93746 27.9338 0.882004 31.8635 0.875031H31.9375C44.1909 0.875031 54.125 10.8091 54.125 23.0625C54.125 23.2622 54.122 23.4604 54.1176 23.6586L54.1146 23.7296C54.0089 27.4567 52.9605 31.0963 51.0676 34.3086C49.9965 36.1264 48.6728 37.7828 47.1359 39.2283C47.6995 37.3602 48.053 35.4017 48.1669 33.3797Z"
                fill="currentColor"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M30.1211 25.5283C29.7131 24.3746 28.9574 23.3757 27.9582 22.6693C26.959 21.9628 25.7654 21.5834 24.5417 21.5834V20.1042H21.5833V21.5834C20.0141 21.5834 18.5092 22.2067 17.3996 23.3163C16.29 24.4259 15.6667 25.9309 15.6667 27.5001C15.6667 29.0693 16.29 30.5742 17.3996 31.6838C18.5092 32.7934 20.0141 33.4167 21.5833 33.4167V39.3334C20.2964 39.3334 19.2004 38.5124 18.7921 37.3617C18.7316 37.1734 18.6339 36.9992 18.5048 36.8493C18.3757 36.6995 18.2179 36.577 18.0407 36.4892C17.8634 36.4014 17.6704 36.3501 17.473 36.3382C17.2756 36.3263 17.0778 36.3541 16.8913 36.42C16.7048 36.4859 16.5334 36.5885 16.3873 36.7218C16.2412 36.855 16.1232 37.0163 16.0405 37.1959C15.9578 37.3755 15.9119 37.57 15.9056 37.7676C15.8993 37.9653 15.9328 38.1622 16.0039 38.3468C16.4119 39.5005 17.1675 40.4994 18.1667 41.2058C19.1659 41.9123 20.3596 42.2917 21.5833 42.2917V43.7709H24.5417V42.2917C26.1109 42.2917 27.6158 41.6684 28.7254 40.5588C29.835 39.4492 30.4583 37.9443 30.4583 36.3751C30.4583 34.8059 29.835 33.3009 28.7254 32.1913C27.6158 31.0817 26.1109 30.4584 24.5417 30.4584V24.5417C25.8285 24.5417 26.9246 25.3627 27.3328 26.5134C27.3934 26.7017 27.4911 26.8759 27.6202 27.0258C27.7493 27.1756 27.9071 27.2981 28.0843 27.3859C28.2615 27.4737 28.4546 27.525 28.652 27.5369C28.8494 27.5488 29.0472 27.521 29.2337 27.4551C29.4202 27.3892 29.5916 27.2866 29.7377 27.1533C29.8838 27.0201 30.0017 26.8588 30.0845 26.6792C30.1672 26.4996 30.2131 26.3051 30.2194 26.1075C30.2256 25.9098 30.1922 25.7129 30.1211 25.5283ZM21.5833 24.5417C20.7987 24.5417 20.0463 24.8534 19.4915 25.4082C18.9367 25.963 18.625 26.7155 18.625 27.5001C18.625 28.2847 18.9367 29.0371 19.4915 29.5919C20.0463 30.1467 20.7987 30.4584 21.5833 30.4584V24.5417ZM24.5417 39.3334C25.3263 39.3334 26.0787 39.0217 26.6335 38.4669C27.1883 37.9121 27.5 37.1597 27.5 36.3751C27.5 35.5905 27.1883 34.838 26.6335 34.2832C26.0787 33.7284 25.3263 33.4167 24.5417 33.4167V39.3334Z"
                fill="currentColor"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M45.25 31.9376C45.25 44.191 35.3159 54.1251 23.0625 54.1251C10.8091 54.1251 0.875 44.191 0.875 31.9376C0.875 19.6841 10.8091 9.75006 23.0625 9.75006C35.3159 9.75006 45.25 19.6841 45.25 31.9376ZM42.2917 31.9376C42.2917 42.558 33.6829 51.1667 23.0625 51.1667C12.4421 51.1667 3.83333 42.558 3.83333 31.9376C3.83333 21.3171 12.4421 12.7084 23.0625 12.7084C33.6829 12.7084 42.2917 21.3171 42.2917 31.9376Z"
                fill="currentColor"
              />
            </svg>
          }
        >
          Buy Crypto
        </Button>
      </Link>

      <Link to="/SendRecieve" className={`${emptyPositions ? 'disabled' : ''}`}>
        <Button
          variant="uw"
          startIcon={
            <svg
              width="20"
              height="17"
              viewBox="0 0 55 39"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M54.5311 10.9596C55.0611 10.4296 55.0611 9.57035 54.5311 9.04036L45.8943 0.403551C45.3643 -0.126446 44.505 -0.126446 43.975 0.403551C43.445 0.933548 43.445 1.79284 43.975 2.32284L51.6521 10L43.975 17.6772C43.445 18.2072 43.445 19.0665 43.975 19.5964C44.505 20.1264 45.3643 20.1264 45.8943 19.5964L54.5311 10.9596ZM2 11.3571H53.5714V8.64286H2V11.3571Z"
                fill="currentColor"
              />
              <path
                d="M1.04034 29.9596C0.510338 29.4296 0.510338 28.5704 1.04034 28.0404L9.67714 19.4036C10.2071 18.8736 11.0664 18.8736 11.5964 19.4036C12.1264 19.9335 12.1264 20.7928 11.5964 21.3228L3.91927 29L11.5964 36.6772C12.1264 37.2072 12.1264 38.0665 11.5964 38.5964C11.0664 39.1264 10.2071 39.1264 9.67714 38.5964L1.04034 29.9596ZM53.5714 30.3571H1.99998V27.6429H53.5714V30.3571Z"
                fill="currentColor"
              />
            </svg>
          }
        >
          {isOnlyMatic ? 'Recieve' : 'Send/Recieve'}
        </Button>
      </Link>
    </Stack>
  );
};
