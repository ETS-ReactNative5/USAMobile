const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fixture } = deployments;

// Customized helpers

let tokensShouldExistNowGlobalV;
let mintPriceTotalInUSDCShouldBeNowGlobalV; 
let mintFeeInUSDCShouldBeNowGlobalV; 
let mintAllowanceInUSDCCentsShouldBeNowGlobalV;
let burnReturnWOfeeInUSDCShouldBeNowGlobalV;
let burnFeeInUSDCShouldBeNowGlobalV;
let transferFeeShouldBeNowInUSDCcentsGlobalV;

let tokensExistQueriedGlobalV;
let mintPriceTotalInUSDCWasPaidNowGlobalV;
let mintFeeInUSDCWasPaidNowGlobalV;
let mintAllowanceInUSDCCentsWasNowGlobalV;
let burnReturnWOfeeInUSDCWasPaidNowGlobalV;
let burnFeeInUSDCWasPaidNowGlobalV;
let transferFeeWasPaidNowInUSDCcentsGlobalV;

let protocolUSDCbalWithoutInterestInCentsGlobalV = 0;

let testUserAddressesArray = [];
let totalUSDCcentsEntriesArr = [];
let liquidCentsArray = [];

const scale6dec = 1000000;

const baseFeeTimes10k = 10000;
const levelDiscountsArray = [0, 10, 25,  50];
const holdingTimesInDays =  [0, 30, 90, 300];
let blocksPerDay;

let benjaminsContract;

let polygonUSDC;
const polygonUSDCaddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let polygonAmUSDC;
const polygonAmUSDCAddress = '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F';

let polygonWMATIC;
const polygonWMATICaddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

let polygonQuickswapRouter;
const polygonQuickswapRouterAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

let polygonLendingPool;
const polygonLendingPoolAddress = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';

let testUser_1_Signer;

let user1LevelDataArray = [];
let user1DiscountDataArray = [];
let user2LevelDataArray = [];
let user2DiscountDataArray = [];

// querrying and saving account level and account discount info for userToCheck, and saving them to an array for later confirmation
async function addUserAccDataPoints(userToCheck){
 
  const userLevelNow = await getDiscountLevel(userToCheck);
  
  const userDiscountNow = await getDiscountPercentage(userToCheck);
    
  if (userToCheck == testUser_1){
    user1LevelDataArray.push(userLevelNow);
    user1DiscountDataArray.push(userDiscountNow);
  } else if (userToCheck == testUser_2) {
    user2LevelDataArray.push(userLevelNow);
    user2DiscountDataArray.push(userDiscountNow);
  } 
}

// confirms account level and account discount as recorded via add addUserAccDataPoints function
function confirmUserDataPoints(userToCheck, expectedUserLevelsArray, expectedUserDiscountArray) {
  if  (userToCheck == testUser_1){
    for (let index = 0; index < user1LevelDataArray.length; index++) {
     
      expect(user1LevelDataArray[index]).to.equal(expectedUserLevelsArray[index]); 
      expect(user1DiscountDataArray[index]).to.equal(expectedUserDiscountArray[index]);
    }
  } else if (userToCheck == testUser_2) {

    for (let index = 0; index < user2LevelDataArray.length; index++) {
      expect(user2LevelDataArray[index]).to.equal(expectedUserLevelsArray[index]); 
      expect(user2DiscountDataArray[index]).to.equal(expectedUserDiscountArray[index]);
    }
  }
  // resetting for next test
  user1LevelDataArray = [];
  user1DiscountDataArray = [];
  user2LevelDataArray = [];
  user2DiscountDataArray = [];
  }

// simulate the passing of blocks
async function mintBlocks (amountOfBlocksToMint) {
  for (let i = 0; i < amountOfBlocksToMint; i++) {
    await ethers.provider.send("evm_mine");
  }
}

async function balUSDCinCents(userToQuery) {
  return dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(userToQuery)));
}

async function balUSDC(userToQuery) {
  return (await balUSDCinCents(userToQuery)/100);
}

async function balUSDCin6decBN(userToQuery) {
  return await polygonUSDC.balanceOf(userToQuery);
}

async function balBNJI(userToQuery) {
  return bigNumberToNumber (await benjaminsContract.balanceOf(userToQuery));
}

async function getMATICbalance(adress) {    
  const balanceInWEI = await ethers.provider.getBalance(adress); 
  const balanceInMATIC = Number(balanceInWEI / (10**18) );        
  return balanceInMATIC;
}

// converting BN big numbers to normal numbers
function bigNumberToNumber(bignumber) {
  let convertedNumber = Number ((ethers.utils.formatUnits(bignumber, 0)).toString());  
  return Number (convertedNumber);
}

// converting from 6dec to USDC cents
function dividefrom6decToUSDCcents (largeNumber) {
  const numberInUSDC = Number( largeNumber / (10**4) );      
  return numberInUSDC;    
}

// converting from USDC to 6dec
function multiplyFromUSDCto6dec (smallNumber) {
  const numberInUSDC = Number( smallNumber * (10**6) );      
  return numberInUSDC;    
}

// converting from USDC cents to 6dec 
function multiplyFromUSDCcentsTo6dec (smallNumber) {
  const numberInUSDC = Number( smallNumber * (10**4) );      
  return numberInUSDC;    
}

// converting cents to USDC
function fromCentsToUSDC (numberInCents) {
  const numberInUSDC = numberInCents /100;      
  return numberInUSDC;    
}

function getRoundedFee(principalInUSDCcents){    
  const feeModifier = baseFeeTimes10k;
  const feeStarterInCents = ((principalInUSDCcents * feeModifier ) / 1000000);   
  const feeInCentsRoundedDown = feeStarterInCents - (feeStarterInCents % 1);
  return feeInCentsRoundedDown  
}

async function depositAdditionalUSDC(amountUSDCin6dec) {
  await polygonUSDC.connect(deployerSigner).approve(polygonLendingPoolAddress, amountUSDCin6dec);  
  await polygonLendingPool.connect(deployerSigner).deposit(polygonUSDCaddress, amountUSDCin6dec, benjaminsContract.address, 0);       
}

// checking balances and adding them up
async function checkTestAddresses(amountUSDC, amountMatic, amountBNJI, expectBool){
  let totalUSDCcentsInTestAccs = 0;

  for (let index = 0; index < testUserAddressesArray.length; index++) {
    const testUserAddress = testUserAddressesArray[index];  
    const testAccUSDCcentsbal = await balUSDCinCents(testUserAddress);
    const testAccMATICbal = await getMATICbalance(testUserAddress);
    const testAccBNJIbal = await balBNJI(testUserAddress);

    // if arg 'expectBool' was sent in as true, verify preparation did work as expected
    if (expectBool == true){       
      expect(testAccUSDCcentsbal).to.equal(amountUSDC*100);
      expect(testAccMATICbal).to.equal(amountMatic);
      expect(testAccBNJIbal).to.equal(amountBNJI);
    }  
    // add each account's amount of USDCcents onto the counter
    totalUSDCcentsInTestAccs += testAccUSDCcentsbal;    
  }
  let nowUSDCcentsInAllTestAccs = totalUSDCcentsInTestAccs;
  // keep log of all USDCcents found in testaccounts, save each reound of queries to totalUSDCcentsEntriesArr
  totalUSDCcentsEntriesArr.push(totalUSDCcentsInTestAccs);   
 
  return nowUSDCcentsInAllTestAccs;
}


async function countAllCents() {
  const centsInAllTestUsers = await checkTestAddresses();
  const feeReceiverCents = await balUSDCinCents(feeReceiver); 
  const deployerCents = await balUSDCinCents(deployer);
  const protocolCents = protocolUSDCbalWithoutInterestInCentsGlobalV;    

  const allLiquidCents = centsInAllTestUsers + feeReceiverCents + protocolCents + deployerCents;  

  liquidCentsArray.push(allLiquidCents);  

  //console.log(`These are the entries each time all liquid USDCcents were counted: `, liquidCentsArray); 

  // verifying that amount of counted cents is always the same
  // starts at second array entry and compares all entries to the one before
  for (let index = 1; index < liquidCentsArray.length; index++) {
    expect(liquidCentsArray[index]).to.equal(liquidCentsArray[index-1]);    
  };

}

async function testTransfer(amountBNJItoTransfer, callingAccAddress, receivingAddress, isTransferFrom, fromSenderAddress){
   
  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
     
  if (isTransferFrom == false) {   
    // calling transfer function on benjaminscontract     
    await benjaminsContract.connect(callingAccSigner).transfer(receivingAddress, amountBNJItoTransfer);
  } else {
    
    // BNJI owner gives necessary USDC approval for fee to benjaminsContract
    const fromSenderSigner = await ethers.provider.getSigner(fromSenderAddress);   
    
    // BNJI owner allows callingAccAddress to handle amountBNJItoTransfer BNJI 
    await benjaminsContract.connect(fromSenderSigner).approve(callingAccAddress, amountBNJItoTransfer);  
    
    // now transferFrom can be carried out by callingAccAddress on behalf of fromSenderAddress
    benjaminsContract.connect(callingAccSigner).transferFrom(fromSenderAddress, receivingAddress, amountBNJItoTransfer)
  }

}

// TODO: create revert situation without USDC approval
async function testMinting(amountToMint, callingAccAddress, receivingAddress) {

  const callingAccUSDCBalanceBeforeMintInCents = await balUSDCinCents(callingAccAddress);  
  const feeReceiverUSDCBalanceBeforeMintInCents = await balUSDCinCents(feeReceiver);  
  
  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  
  const restAllowanceToBNJIcontractIn6dec = await polygonUSDC.allowance(callingAccAddress, benjaminsContract.address);
  expect(await restAllowanceToBNJIcontractIn6dec).to.equal(0);
  
  const amountToApproveIn6dec = await calcMintApprovalAndPrep(amountToMint);  
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, amountToApproveIn6dec);
  
  const givenAllowanceToBNJIcontractIn6dec = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  
  expect(Number (amountToApproveIn6dec)).to.equal(Number (givenAllowanceToBNJIcontractIn6dec));
  
  // descr: function mintTo(uint256 _amount, address _toWhom) public whenAvailable {  
  await benjaminsContract.connect(callingAccSigner).mintTo(amountToMint, receivingAddress);  

  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
 

  const callingAccUSDCBalanceAfterMintInCents = await balUSDCinCents(callingAccAddress);   
  const feeReceiverUSDCBalanceAfterMintInCents = await balUSDCinCents(feeReceiver); 
 
  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
 
  const feeReceiverUSDCdiffMintInCents = feeReceiverUSDCBalanceAfterMintInCents - feeReceiverUSDCBalanceBeforeMintInCents;     
  
  // since amUSDC amounts change due to interest accrued, transfer amount WITHOUT fees are saved globally for comparison
  // here, transfer amount refers to USDC cents amounts of funds received by the protocol, from the user
  const againstInterestDistortionInCents = callingAccMintPricePaidInCents - feeReceiverUSDCdiffMintInCents;
  protocolUSDCbalWithoutInterestInCentsGlobalV += againstInterestDistortionInCents;  

  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  mintFeeInUSDCWasPaidNowGlobalV = feeReceiverUSDCdiffMintInCents/100;
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = dividefrom6decToUSDCcents(givenAllowanceToBNJIcontractIn6dec);

  confirmMint();
};

async function testBurning(amountToBurn, callingAccAddress, receivingAddress) { 

  const receivingAddressUSDCBalanceBeforeBurnInCents = await balUSDCinCents(receivingAddress); 
  const feeReceiverUSDCBalanceBeforeBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  await calcBurnVariables(amountToBurn);

  // descr: function burnTo(uint256 _amount, address _toWhom)
  await benjaminsContract.connect(callingAccSigner).burnTo(amountToBurn, receivingAddress);    

  const totalSupplyAfterBurn = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAccUSDCBalanceAfterBurnInCents = await balUSDCinCents(receivingAddress);    
  
  const feeReceiverUSDCBalanceAfterBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const receivingAccBurnReturnReceivedInCents = receivingAccUSDCBalanceAfterBurnInCents - receivingAddressUSDCBalanceBeforeBurnInCents;  
  const feeReceiverUSDCdiffBurnInCents = feeReceiverUSDCBalanceAfterBurnInCents - feeReceiverUSDCBalanceBeforeBurnInCents;       

  // since amUSDC amounts change due to interest accrued, transfer amount WITHOUT fees are saved globally for comparison
  // here, transfer amount refers to USDC cents amounts of funds paid out by the protocol, to the user, plus fees, paid by protocol to feeReceiver
  const againstInterestDistortionInCents = receivingAccBurnReturnReceivedInCents + feeReceiverUSDCdiffBurnInCents;
  protocolUSDCbalWithoutInterestInCentsGlobalV -= againstInterestDistortionInCents;

  burnReturnWOfeeInUSDCWasPaidNowGlobalV = fromCentsToUSDC(receivingAccBurnReturnReceivedInCents);
  burnFeeInUSDCWasPaidNowGlobalV = feeReceiverUSDCdiffBurnInCents/100;
  tokensExistQueriedGlobalV = totalSupplyAfterBurn;

  confirmBurn();
};

function resetTrackers(){
  tokensShouldExistNowGlobalV = 0;
  mintPriceTotalInUSDCShouldBeNowGlobalV = 0; 
  mintFeeInUSDCShouldBeNowGlobalV = 0; 
  mintAllowanceInUSDCCentsShouldBeNowGlobalV = 0;
  burnReturnWOfeeInUSDCShouldBeNowGlobalV = 0;
  burnFeeInUSDCShouldBeNowGlobalV = 0;
  transferFeeShouldBeNowInUSDCcentsGlobalV = 0;

  tokensExistQueriedGlobalV = 0;
  mintPriceTotalInUSDCWasPaidNowGlobalV = 0;
  mintFeeInUSDCWasPaidNowGlobalV = 0;
  mintAllowanceInUSDCCentsWasNowGlobalV = 0;
  burnReturnWOfeeInUSDCWasPaidNowGlobalV = 0;
  burnFeeInUSDCWasPaidNowGlobalV = 0;
  transferFeeWasPaidNowInUSDCcentsGlobalV = 0;

  user1LevelDataArray = [];
  user1DiscountDataArray = [];
  user2LevelDataArray = [];
  user2DiscountDataArray = [];

} 

function confirmMint(){  
  
  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCWasPaidNowGlobalV));
  expect(mintFeeInUSDCShouldBeNowGlobalV).to.equal(Number (mintFeeInUSDCWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
};

function confirmBurn(){  
  
  expect(tokensShouldExistNowGlobalV).to.equal(Number(tokensExistQueriedGlobalV));
  expect(burnReturnWOfeeInUSDCShouldBeNowGlobalV).to.equal(Number(burnReturnWOfeeInUSDCWasPaidNowGlobalV));
  expect(burnFeeInUSDCShouldBeNowGlobalV).to.equal(Number(burnFeeInUSDCWasPaidNowGlobalV));
};

async function calcMintApprovalAndPrep(amountToMint) {  
  
  const amountOfTokensBeforeMint = bigNumberToNumber(await benjaminsContract.totalSupply());
  const amountOfTokensAfterMint = Number (amountOfTokensBeforeMint) + Number (amountToMint);
 
  // starting with minting costs, then rounding down to cents
  const mintingCostinUSDC = ((amountOfTokensAfterMint * amountOfTokensAfterMint) - (amountOfTokensBeforeMint * amountOfTokensBeforeMint)) / 8000000;
  const mintingCostInCents = mintingCostinUSDC * 100;
  const mintingCostRoundedDownInCents = mintingCostInCents - (mintingCostInCents % 1);

  const mintFeeInCentsRoundedDown = getRoundedFee(mintingCostRoundedDownInCents);   

  // results, toPayTotalInUSDC can be displayed to user
  const toPayTotalInCents = mintingCostRoundedDownInCents + mintFeeInCentsRoundedDown;
  const toPayTotalInUSDC = toPayTotalInCents / 100;
  const toPayTotalIn6dec = toPayTotalInCents * 10000;    

  tokensShouldExistNowGlobalV = amountOfTokensAfterMint;
  mintPriceTotalInUSDCShouldBeNowGlobalV = toPayTotalInUSDC;
  mintFeeInUSDCShouldBeNowGlobalV = mintFeeInCentsRoundedDown/100;
  mintAllowanceInUSDCCentsShouldBeNowGlobalV = toPayTotalInCents;   

  return toPayTotalIn6dec;
}

async function calcBurnVariables(amountToBurn, isTransfer=false) {

  const amountOfTokensBeforeBurn = bigNumberToNumber(await benjaminsContract.totalSupply());  
  const amountOfTokensAfterBurn = amountOfTokensBeforeBurn - amountToBurn;

  const burnReturnInUSDC = ( (amountOfTokensBeforeBurn * amountOfTokensBeforeBurn) - (amountOfTokensAfterBurn * amountOfTokensAfterBurn) ) / 8000000;
  const burnReturnInCents = burnReturnInUSDC * 100;
  const burnReturnRoundedDownInCents = burnReturnInCents - (burnReturnInCents % 1);  
  
  const burnFeeInCentsRoundedDown = getRoundedFee(burnReturnRoundedDownInCents); 

  const toReceiveTotalInCents = burnReturnRoundedDownInCents - burnFeeInCentsRoundedDown;
  const toReceiveTotalInUSDC = toReceiveTotalInCents / 100;
   
  if (isTransfer==false){
    tokensShouldExistNowGlobalV = amountOfTokensAfterBurn;
    burnReturnWOfeeInUSDCShouldBeNowGlobalV = toReceiveTotalInUSDC;
    burnFeeInUSDCShouldBeNowGlobalV = burnFeeInCentsRoundedDown/100;
  } else {
    transferFeeShouldBeNowInUSDCcentsGlobalV = burnFeeInCentsRoundedDown;
    return burnFeeInCentsRoundedDown;
  }  
}











async function testIncreaseLevel(callingAccAddress, amountOfLevelsToGet) {

  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  const beforeLevelIncrease_BNJIbal_User = await balBNJI(callingAccAddress);
  const beforeLevelIncrease_BNJIbal_Contract = await balBNJI(benjaminsContract.address);  

  const beforeLevelIncrease_AmountOfBlocksToWait = await howLongUntilUnlock(callingAccAddress);
  const beforeLevelIncrease_UsersUnlockTimestamp = await getUnlockTimestamp(callingAccAddress);  

  const beforeLevelIncrease_UsersLockedBNJI = await getLockedBalanceOf(callingAccAddress);
  const beforeLevelIncrease_UsersDiscountLevel = await getDiscountLevel(callingAccAddress); 
  const beforeLevelIncrease_UsersDiscountPercentage = await getDiscountPercentage(callingAccAddress);  

  const beforeLevelIncrease_DiscountPercentageExpected = levelDiscountsArray[beforeLevelIncrease_UsersDiscountPercentage];

  await benjaminsContract.connect(callingAccSigner).increaseDiscountLevels(amountOfLevelsToGet);
  
  const blockheightNow = await ethers.provider.getBlockNumber();
  
  const afterLevelIncrease_BNJIbal_User = await balBNJI(callingAccAddress);
  const afterLevelIncrease_BNJIbal_Contract = await balBNJI(benjaminsContract.address); 

  const afterLevelIncrease_AmountOfBlocksToWait = await howLongUntilUnlock(callingAccAddress);
  const afterLevelIncrease_UsersUnlockTimestamp = await getUnlockTimestamp(callingAccAddress); 

  const afterLevelIncrease_UsersLockedBNJI = await getLockedBalanceOf(callingAccAddress);
  const afterLevelIncrease_UsersDiscountLevel = await getDiscountLevel(callingAccAddress);  
  const afterLevelIncrease_UsersDiscountPercentage = await getDiscountPercentage(callingAccAddress);

  const afterLevelIncrease_DiscountPercentageExpected = levelDiscountsArray[afterLevelIncrease_UsersDiscountLevel];

  const afterLevelIncrease_discountLevelExpected = beforeLevelIncrease_UsersDiscountLevel + amountOfLevelsToGet;
  const afterLevelIncrease_amountOfBlocksToWaitExpected = holdingTimesInDays[afterLevelIncrease_UsersDiscountLevel] * blocksPerDay;
  const afterLevelIncrease_unlockTimestampExpected = blockheightNow + (holdingTimesInDays[afterLevelIncrease_UsersDiscountLevel] *blocksperDays);

  
  // TODO: comment all expects
  expect(afterLevelIncrease_BNJIbal_User).to.equal(beforeLevelIncrease_BNJIbal_User - amountToLockUp);   
  expect(afterLevelIncrease_BNJIbal_Contract).to.equal(beforeLevelIncrease_BNJIbal_Contract + amountToLockUp);  
  
  expect(afterLevelIncrease_UsersUnlockTimestamp).to.be.greaterThan(beforeLevelIncrease_UsersUnlockTimestamp);
  expect(afterLevelIncrease_AmountOfBlocksToWait).to.be.greaterThan(beforeLevelIncrease_AmountOfBlocksToWait);

  expect(afterLevelIncrease_AmountOfBlocksToWait).to.equal(afterLevelIncrease_amountOfBlocksToWaitExpected); 
  expect(afterLevelIncrease_UsersUnlockTimestamp).to.equal(afterLevelIncrease_unlockTimestampExpected);  
  
  expect(afterLevelIncrease_UsersLockedBNJI).to.equal(beforeLevelIncrease_UsersLockedBNJI + (amountOfLevelsToGet*1000)); 
  expect(afterLevelIncrease_UsersDiscountLevel).to.equal(afterLevelIncrease_discountLevelExpected);  

  expect(afterLevelIncrease_UsersDiscountPercentage).to.equal(afterLevelIncrease_DiscountPercentageExpected);
  expect(beforeLevelIncrease_UsersDiscountPercentage).to.equal(beforeLevelIncrease_DiscountPercentageExpected);  

}  

async function howLongUntilUnlock(userToCheck) {
  return (bigNumberToNumber (await benjaminsContract.howManyBlocksUntilUnlock(userToCheck)));
}


async function getUnlockTimestamp(userToCheck) {
  return (bigNumberToNumber (await benjaminsContract.getUsersUnlockTimestamp(userToCheck)));
}

async function getLockedBalanceOf(userToCheck) {
  return (bigNumberToNumber (await benjaminsContract.lockedBalanceOf(userToCheck)));
}


async function getDiscountLevel(userToCheck){
  const usersDiscountLevel = bigNumberToNumber (await benjaminsContract.getUsersDiscountLevel(userToCheck));
  return usersDiscountLevel;
}


async function getDiscountPercentage(userToCheck){
  const usersDiscountPercentage = (bigNumberToNumber(await benjaminsContract.getDiscountPercentageTimes10k(userToCheck)))/baseFeeTimes10k;
  return usersDiscountPercentage;
}




async function testDecreaseLevel(callingAccAddress, lockboxIDtoUnlockAndDestroy, expectedAmount) {

  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  const beforeBoxDestruction_BNJIbal_User = await balBNJI(callingAccAddress);
  const beforeBoxDestruction_BNJIbal_Contract = await balBNJI(benjaminsContract.address);
  const beforeBoxDestruction_BoxAmount = await amountOfUsersLockboxes(callingAccAddress); 
  const beforeBoxDestruction_UsersDiscountScore = await findUsersDiscountScore(callingAccAddress);
  const beforeBoxDestruction_UsersLockedBNJI = await getLockedBalanceOf(callingAccAddress);

  // querying the box's discountScore before opening and destroying it
  const discountScoreGeneratedByBox = await getDiscountScoreForBox(lockboxIDtoUnlockAndDestroy, callingAccAddress);

  // user unlocks and destroys the lockbox
  await benjaminsContract.connect(callingAccSigner).openAndDestroyLockbox(lockboxIDtoUnlockAndDestroy); 
  
  const afterBoxDestruction_BNJIbal_User = await balBNJI(callingAccAddress);
  const afterBoxDestruction_BNJIbal_Contract = await balBNJI(benjaminsContract.address);
  const afterBoxDestruction_BoxAmount = await amountOfUsersLockboxes(callingAccAddress);
  const afterBoxBoxDestruction_UsersDiscountScore = await findUsersDiscountScore(callingAccAddress); 
  const afterBoxDestruction_UsersLockedBNJI = await getLockedBalanceOf(callingAccAddress);

  expect(afterBoxDestruction_BNJIbal_User).to.equal(beforeBoxDestruction_BNJIbal_User + expectedAmount);   
  expect(afterBoxDestruction_BNJIbal_Contract).to.equal(beforeBoxDestruction_BNJIbal_Contract - expectedAmount);
  expect(afterBoxDestruction_BoxAmount).to.equal(beforeBoxDestruction_BoxAmount - 1);  
  expect(afterBoxBoxDestruction_UsersDiscountScore).to.equal(beforeBoxDestruction_UsersDiscountScore - discountScoreGeneratedByBox);
  expect(afterBoxDestruction_UsersLockedBNJI).to.equal(beforeBoxDestruction_UsersLockedBNJI - expectedAmount);

}












describe("Testing Levels version of Benjamins", function () {

  // setting instances of contracts
  beforeEach(async function() {   

    ({ deployer, feeReceiver, accumulatedReceiver, testUser_1, testUser_2, testUser_3, testUser_4, testUser_5 } = await getNamedAccounts());
    
    testUserAddressesArray = [];
    totalUSDCcentsEntriesArr = [];
    liquidCentsArray = [];
    protocolUSDCbalWithoutInterestInCentsGlobalV = 0;

    deployerSigner = await ethers.provider.getSigner(deployer);   
    testUser_1_Signer = await ethers.provider.getSigner(testUser_1);     

    testUserAddressesArray.push(testUser_1);
    testUserAddressesArray.push(testUser_2);
    testUserAddressesArray.push(testUser_3);
    testUserAddressesArray.push(testUser_4);
    testUserAddressesArray.push(testUser_5);    
    
    // Deploy contract
    await fixture(["LevelBenjamins"]);
    benjaminsContract = await ethers.getContract("LevelBenjamins");      

    // Get amount of blocksPerDay into this testing suite
    blocksPerDay = bigNumberToNumber(await benjaminsContract.getBlocksPerDay());

    polygonUSDC = new ethers.Contract(
      polygonUSDCaddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function transfer(address recipient, uint256 amount) external returns (bool)',
      ], 
      deployerSigner
    );

    polygonAmUSDC = new ethers.Contract(
      polygonAmUSDCAddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function transfer(address recipient, uint256 amount) external returns (bool)',
      ], 
      deployerSigner
    );   
   
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd"],
    });

    const whaleSigner = await ethers.getSigner("0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd");

    polygonUSDCWhaleSignedIn = new ethers.Contract(
      polygonUSDCaddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function transfer(address recipient, uint256 amount) external returns (bool)',
      ], 
      whaleSigner
    );    

    whaleSignerAddress = whaleSigner.address;   
      
    await whaleSigner.sendTransaction({
      to: deployer,
      value: ethers.utils.parseEther("5000000") // 5,000,000 MATIC
    })

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: ["0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd"],
    });    
 
    polygonWMATIC = new ethers.Contract(
      polygonWMATICaddress,
      [
        'function approve(address guy, uint wad) public returns (bool)',
        'function transfer(address dst, uint wad) public returns (bool)',
        'function balanceOf(address account) external view returns (uint256)',
        'function deposit() public payable',            
      ], 
      deployerSigner
    );
    
    await polygonWMATIC.connect(deployerSigner).deposit( {value: ethers.utils.parseEther("4000000")} );
  
    polygonQuickswapRouter = new ethers.Contract(
      polygonQuickswapRouterAddress,
      [
       'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',      
       'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', 
       'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
       'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)',
       'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',       
      ], 
      deployerSigner
    );     

    await polygonWMATIC.connect(deployerSigner).approve( polygonQuickswapRouterAddress, ethers.utils.parseEther("15000000") );

    const amountToReceiveUSDCIn6dec = 1000000 * (10**6)
    const amountInMaxInWEI = ethers.utils.parseEther("3999950");   
    await polygonQuickswapRouter.connect(deployerSigner).swapTokensForExactTokens( amountToReceiveUSDCIn6dec, amountInMaxInWEI , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);  
                 
    await benjaminsContract.connect(deployerSigner).unpause(); 

    resetTrackers();
    
    // First setup mint for 100k USDC
    await testMinting(889000, deployer, deployer);    
        
    for (let index = 0; index < testUserAddressesArray.length; index++) {
      const testingUser = testUserAddressesArray[index];      

      await deployerSigner.sendTransaction({
        to: testingUser,
        value: ethers.utils.parseEther("10") // 10 MATIC
      })
      
      await polygonUSDC.connect(deployerSigner).transfer(testingUser, (3000*scale6dec) );
             
    } 

    polygonLendingPool = new ethers.Contract(
      polygonLendingPoolAddress,
      [
        'function getUserAccountData(address user) external view returns ( uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
        'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode ) external'
      ], 
      deployerSigner
    );  

    await countAllCents();    
    await checkTestAddresses(3000,10,0, true);
  })     
  
  
  // Put in tests for levels 
  
  it("Test 1. testUser_1 should mint 10 BNJI for themself", async function () {  
    await countAllCents();         
    await testMinting(40, testUser_1, testUser_1);      
    expect(await balBNJI(testUser_1)).to.equal(40);    
    await countAllCents();    
  });
  
  it("Test 2. testUser_1 should mint 10 BNJI for themself, then do the same again in the next block", async function () { 
    
    await countAllCents(); 
    await addUserAccDataPoints(testUser_1);

    // minting 40 BNJI to caller
    await testMinting(40, testUser_1, testUser_1);
    await addUserAccDataPoints(testUser_1);

    // minting 40 BNJI to caller
    await testMinting( 40, testUser_1, testUser_1);     
    await addUserAccDataPoints(testUser_1);    
    expect(await balBNJI(testUser_1)).to.equal(80);
    
    const expectedUser1Levels = [0,0,0];
    const expectedUser1Discounts = [0,0,0];    
      
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);

    await countAllCents(); 
  });
      
  it("Test 3. Owner can pause and unpause contract", async function () {

   // BenjaminsContract is unpaused in the beginning
   expect(await benjaminsContract.paused()).to.equal(false);

   // Owner can pause contract
   await benjaminsContract.connect(deployerSigner).pause();

   // BenjaminsContract is now paused
   expect(await benjaminsContract.paused()).to.equal(true);
   
   // Owner can unpause contract
   await benjaminsContract.connect(deployerSigner).unpause();

   // BenjaminsContract is now unpaused again
   expect(await benjaminsContract.paused()).to.equal(false);
  });
  
  it("Test 4. User can call mint and burn functions directly ", async function () {

    await countAllCents(); 

    expect(await balBNJI(testUser_1)).to.equal(0); 

    const amountToApproveIn6dec = await calcMintApprovalAndPrep(4000); 
    await polygonUSDC.connect(testUser_1_Signer).approve(benjaminsContract.address, amountToApproveIn6dec);    
    await benjaminsContract.connect(testUser_1_Signer).mint(4000);  

    expect(await balBNJI(testUser_1)).to.equal(4000); 

    await benjaminsContract.connect(testUser_1_Signer).burn(4000);  
    
    expect(await balBNJI(testUser_1)).to.equal(0); 

  });

  // TODO: update 
  it("Test 5. testUser_1 mints 1100 tokens, no need for waiting time", async function () {   
    
    await countAllCents(); 

    expect(await balBNJI(testUser_1)).to.equal(0); 
    expect(await balUSDC(testUser_1)).to.equal(3000); 

    //minting 1100 BNJI to caller
    await testMinting(1100, testUser_1, testUser_1);        

    const costInUSDC1 = mintAllowanceInUSDCCentsShouldBeNowGlobalV/100;
    expect(await balBNJI(testUser_1)).to.equal(59); 
    expect(await balUSDC(testUser_1)).to.equal(3000-costInUSDC1);   
              
    // burning 1100 BNJI to caller after 11 blocks 
    await testBurning(1100, testUser_1, testUser_1);

    const returnInUSDC1 = burnReturnWOfeeInUSDCShouldBeNowGlobalV;
    expect(await balBNJI(testUser_1)).to.equal(0);
    expect(await balUSDC(testUser_1)).to.equal(2999.74); 

    await countAllCents();     
  });    
  
  it("Test 6. Should REVERT: testUser_1 tries to burn more tokens than they have", async function () {   
    
    await countAllCents(); 

    // minting 40 BNJI to caller
    await testMinting(40, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(40);    

    // should REVERT, burning more BNJI than user has
    await expect(testBurning(43, testUser_1, testUser_1)).to.be.revertedWith(
      "Insufficient Benjamins."
    );

    expect(await balBNJI(testUser_1)).to.equal(40);

    await countAllCents(); 
  }); 

  it("Test 7. Token price should go up, following the bonding curve", async function () {  

    await countAllCents(); 

    // minting 2000 BNJI to caller
    await testMinting(2000, testUser_1, testUser_1);
   
    expect(await balBNJI(testUser_1)).to.equal(2000);        
    const balanceUSDCbefore1stBN = await balUSDCin6decBN(testUser_1); 

    // minting 40 BNJI to caller
    await testMinting(40, testUser_1, testUser_1);    
    
    const costInCents1 = mintAllowanceInUSDCCentsShouldBeNowGlobalV;   
    expect(await balBNJI(testUser_1)).to.equal(2040); 

    const balanceUSDCafter1stBN = await balUSDCin6decBN(testUser_1);
    const firstPriceFor40InCents = dividefrom6decToUSDCcents(balanceUSDCbefore1stBN-balanceUSDCafter1stBN);  
    
    // minting 1000 BNJI to caller
    await testMinting(1000, testUser_1, testUser_1);   
    
    expect(await balBNJI(testUser_1)).to.equal(3040);
   
    const balanceUSDCbefore2ndBN = await balUSDCin6decBN(testUser_1);

    // minting 40 BNJI to caller
    await testMinting(40, testUser_1, testUser_1);    
    const costInCents2 = mintAllowanceInUSDCCentsShouldBeNowGlobalV;

    expect(await balBNJI(testUser_1)).to.equal(3080);
    const balanceUSDCafter2ndBN = await balUSDCin6decBN(testUser_1);
    const secondPriceFor40InCents = dividefrom6decToUSDCcents(balanceUSDCbefore2ndBN-balanceUSDCafter2ndBN);

    expect(firstPriceFor40InCents).to.equal(costInCents1);
    expect(secondPriceFor40InCents).to.equal(costInCents2); 

    await countAllCents(); 
  });  
  

  // TODO: update
  it("Test 8. Account levels and discounts are not triggered by minting", async function () {   

    // Preparation mint
    await testMinting(200000, deployer, deployer);   

    await countAllCents(); 
    await addUserAccDataPoints(testUser_1);  

    // minting 20 BNJI to caller"
    await testMinting(20, testUser_1, testUser_1);  
    expect(await balBNJI(testUser_1)).to.equal(20); 
    await addUserAccDataPoints(testUser_1);

    // minting 1040 BNJI to caller
    await testMinting(1040, testUser_1, testUser_1); 
    expect(await balBNJI(testUser_1)).to.equal(1060); 
    await addUserAccDataPoints(testUser_1);
    
    // minting 1500 BNJI to caller
    await testMinting(1500, testUser_1, testUser_1);    
    expect(await balBNJI(testUser_1)).to.equal(2560);
    await addUserAccDataPoints(testUser_1); 

    const expectedUser1Levels = [0,0,0,0,0,0];
    const expectedUser1Discounts = [0,0,0,0,0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);    
    
    await countAllCents(); 
  });  

  // TODO: update
  it("Test 9. Account Level 1 can be purchased for 1000 BNJI", async function () {   

    await countAllCents();
    await addUserAccDataPoints(testUser_1);

    // minting 1600 BNJI to caller
    await testMinting(1600, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(1600);   
    await addUserAccDataPoints(testUser_1);   

    const expectedUser1Levels = [0,0];
    const expectedUser1Discounts = [0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts); 
    
    await countAllCents();
  });  
  
  // TODO: update
  it("Test 10. Account Level 2 can be purchased in one step", async function () {   

    await countAllCents();

    await addUserAccDataPoints(testUser_1);
    
    
    // minting 2600 BNJI to caller
    await testMinting(2600, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(60);   
    await addUserAccDataPoints(testUser_1);   

    const expectedUser1Levels = [0,0];
    const expectedUser1Discounts = [0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts); 
    
    await countAllCents();
  });  

  // TODO: update
  it("Test 11. Account Level 3 can be purchased in one step", async function () {  
    
    await countAllCents();

    await addUserAccDataPoints(testUser_1); 

    // minting 2600 BNJI to caller
    await testMinting(3600, testUser_1, testUser_1);    
    
    
    expect(await balBNJI(testUser_1)).to.equal(100); 
    await addUserAccDataPoints(testUser_1);   

    const expectedUser1Levels = [0,0];
    const expectedUser1Discounts = [0,0];    
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);

    await countAllCents();
  });   
  
  // TODO: update
  it("Test 16. There is no time-lock for buying and discounts are effective immediately upon getting the discountLevel", async function () {   

    await countAllCents();
    
    await addUserAccDataPoints(testUser_1); 
   
    // minting 2600 BNJI to caller
    await testMinting(3600, testUser_1, testUser_1);    

    expect(await balBNJI(testUser_1)).to.equal(3600);   
    await addUserAccDataPoints(testUser_1);  

    // upgrading to account level 1
    await testIncreaseLevel(testUser_1, 1);  
    
    expect(await balBNJI(testUser_1)).to.equal(60);   
    await addUserAccDataPoints(testUser_1);

    // upgrading to account level 2
    await testIncreaseLevel(testUser_1, 1);  
    
    expect(await balBNJI(testUser_1)).to.equal(99); 
    await addUserAccDataPoints(testUser_1); 

    // upgrading to account level 3
    await testIncreaseLevel(testUser_1, 1);  

    expect(await balBNJI(testUser_1)).to.equal(99); 
    await addUserAccDataPoints(testUser_1); 

    const expectedUser1Levels =     [0,0, 1, 2, 3];
    const expectedUser1Discounts =  [0,0,10,25,50];    
      
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);       

    await countAllCents();
  });  
  
  // TODO put in another test here as test 18
  
  it("Test 19. It is possible to mint tokens to another account", async function () {   

    await countAllCents();

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);    

    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 

    // minting 120 BNJI from user 1 to user 2
    await testMinting(120, testUser_1, testUser_2);    
    
    expect(await balBNJI(testUser_1)).to.equal(0); 
    expect(await balBNJI(testUser_2)).to.equal(120);       
    
    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 

    const expectedUser1Levels = [0,0];
    const expectedUser1Discounts = [0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   

    const expectedUser2Levels = [0,0];
    const expectedUser2Discounts = [0,0];          
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts);

    await countAllCents();
  });  
  
  it("Test 20. It is possible to burn tokens and reward the USDC to another account", async function () {   

    await countAllCents();

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);         

    // minting 120 BNJI by testUser_1 for testUser_1
    await testMinting(120, testUser_1, testUser_1);    
    
    const costInUSDC1 = mintAllowanceInUSDCCentsShouldBeNowGlobalV/100; 
    expect(await balBNJI(testUser_1)).to.equal(120); 
    expect(await balBNJI(testUser_2)).to.equal(0);
    
    const user_1_USDCbalBefore = await balUSDC(testUser_1);
    const user_2_USDCbalBefore = await balUSDC(testUser_2);

    // burning 50 BNJI by testUser_1 return goes to testUser_2
    await testBurning(50, testUser_1, testUser_2);    
    
    const returnInUSDC1 = burnReturnWOfeeInUSDCShouldBeNowGlobalV;
    expect(await balBNJI(testUser_1)).to.equal(70); 
    expect(await balBNJI(testUser_2)).to.equal(0);  

    const user_1_USDCbalAfter = await balUSDC(testUser_1);
    const user_2_USDCbalAfter = await balUSDC(testUser_2);      
        
    expect(user_1_USDCbalBefore).to.equal(3000-costInUSDC1);    
    expect(user_2_USDCbalBefore).to.equal(3000);

    expect(user_1_USDCbalAfter).to.equal(user_1_USDCbalBefore);   
    expect(user_2_USDCbalAfter).to.equal(user_2_USDCbalBefore + returnInUSDC1);    

    await countAllCents();
      
  }); 
  
  // TODO: update
  it("Test 21. Without lock, there is no holding period", async function () {   

    await countAllCents();

    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 

    // minting 60 BNJI to caller
    await testMinting(60, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(60);
    expect(await balBNJI(testUser_2)).to.equal(0);
    
    await addUserAccDataPoints(testUser_1);    

    await testTransfer(30, testUser_1, testUser_2, false, 0); 

    expect(await balBNJI(testUser_1)).to.equal(30);
    expect(await balBNJI(testUser_2)).to.equal(30);

    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2);
    
    const expectedUser1Levels = [0,0,0];
    const expectedUser1Discounts = [0,0,0];    
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts); 

    const expectedUser2Levels = [0];
    const expectedUser2Discounts = [0];    
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts); 

    await countAllCents();
  });  
  
  // TODO: update
  it("Test 23. Downgrading accounts is not triggrered by burning and BNJI that are not locked can be burnt immediately", async function () { 

    await testMinting("Preparation mint", 200000, deployer, deployer); 

    await countAllCents();

    expect(await balBNJI(testUser_1)).to.equal(0); 
    await addUserAccDataPoints(testUser_1);        

    // minting 2000 BNJI to caller
    await testMinting(2000, testUser_1, testUser_1);  

    expect(await balBNJI(testUser_1)).to.equal(2000); 
    await addUserAccDataPoints(testUser_1);   
    
    // burning 2000 tokens, returns go to caller, no needed holding times
    await testBurning(2000, testUser_1, testUser_1);
    
    await addUserAccDataPoints(testUser_1);  
    expect(await balBNJI(testUser_1)).to.equal(0);         

    const expectedUser1Levels = [0,0];
    const expectedUser1Discounts = [0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   

    await countAllCents();
    
  });
  
  // TODO: re organize / number the tests

  it("Test 25. It is possible to transfer tokens", async function () {   

    await countAllCents();  

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);    

    await addUserAccDataPoints(testUser_1);
    await addUserAccDataPoints(testUser_2);     

    // minting 120 BNJI to caller
    await testMinting(120, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(120); 
    await addUserAccDataPoints(testUser_1);     

    // testUser_1 calls transfer to send 40 BNJI from themselves to testUser_2
    await testTransfer(40, testUser_1, testUser_2, false, 0);
    
    expect(await balBNJI(testUser_1)).to.equal(80);    
    expect(await balBNJI(testUser_2)).to.equal(40);     
        
    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 
    
    const expectedUser1Levels = [0,0,0];
    const expectedUser1Discounts = [0,0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   

    const expectedUser2Levels = [0,0];
    const expectedUser2Discounts = [0,0];    
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts);

    await countAllCents();
  });  

  it("Test 26. It is possible to use transferFrom on tokens", async function () {
 
    await countAllCents();

    // Preparation mint
    await testMinting(200000, deployer, deployer); 

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);    

    await addUserAccDataPoints(testUser_1);
    await addUserAccDataPoints(testUser_2);     

    // minting 120 BNJI to caller
    await testMinting(120, testUser_1, testUser_1); 
    
    expect(await balBNJI(testUser_1)).to.equal(120); 
    await addUserAccDataPoints(testUser_1); 

    // testUser_3 calls transferFrom to send 30 BNJI from testUser_1 to testUser_2
    await testTransfer(30, testUser_3, testUser_2, true, testUser_1);
    
    expect(await balBNJI(testUser_1)).to.equal(90);    
    expect(await balBNJI(testUser_2)).to.equal(30);     
        
    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 
    
    const expectedUser1Levels = [0,0,0];
    const expectedUser1Discounts = [0,0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   

    const expectedUser2Levels = [0,0];
    const expectedUser2Discounts = [0,0];    
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts);

    await countAllCents();
  });  

  it("Test 27. Owner can withdraw MATIC tokens that were sent to the contract directly, by mistake", async function () { 

    await countAllCents(); 

    const contractMATICstart = await getMATICbalance(benjaminsContract.address);  
    const deployerMATICstart = await getMATICbalance(deployer);
    const deployerMATICstartRounded = deployerMATICstart - (deployerMATICstart%1); 
    
    expect(contractMATICstart).to.equal(0); 
    
    await deployerSigner.sendTransaction({
      to: benjaminsContract.address,
      value: ethers.utils.parseEther("20") // 20 Matic
    })

    const contractMATICafterSend = await getMATICbalance(benjaminsContract.address); 
    expect(contractMATICafterSend).to.equal(contractMATICstart+20); 

    const deployerMATICafterSend = await getMATICbalance(deployer);
    const deployerMATICafterSendRounded = deployerMATICafterSend - (deployerMATICafterSend%1);
    expect(deployerMATICafterSendRounded).to.equal(deployerMATICstartRounded-20);   
    
    await benjaminsContract.connect(deployerSigner).cleanMATICtips();
  
    const contractMATICafterCleanedTips = await getMATICbalance(benjaminsContract.address); 
    expect(contractMATICafterCleanedTips).to.equal(0); 

    const deployerMATICafterCleanedTips = await getMATICbalance(deployer);
    const deployerMATICafterCleanedTipsRounded = deployerMATICafterCleanedTips - (deployerMATICafterCleanedTips%1);
    expect(deployerMATICafterCleanedTipsRounded).to.equal(deployerMATICafterSendRounded+20);
       
    await countAllCents(); 
  });    

  it("Test 28. Owner can use cleanERC20Tips to withdraw ERC20 tokens that were sent to contract by mistake - but not USDC, amUSDC or BNJI", async function () { 
  
    await countAllCents(); 

    // Creating instance of Chainlink
    const polygonLINKaddress = '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39';

    polygonChainlink = new ethers.Contract(
      polygonLINKaddress,
      [
        'function approve(address guy, uint wad) public returns (bool)',
        'function transfer(address dst, uint wad) public returns (bool)',
        'function balanceOf(address account) external view returns (uint256)',        
      ], 
      deployerSigner
    );

    // getting 10 LINK on quickswap
    const chainlinkToGetIn18dec = ethers.utils.parseEther("10");
    const wmaticToPayWithMaxIn18dec = ethers.utils.parseEther("1000");
    await polygonQuickswapRouter.connect(deployerSigner).swapTokensForExactTokens( chainlinkToGetIn18dec, wmaticToPayWithMaxIn18dec , [polygonWMATICaddress, polygonLINKaddress], deployer, 1665102928); 
    
    // preparation confirmation
    const chainlinkBalStart_deployer      = Number(ethers.utils.formatEther(await polygonChainlink.balanceOf(deployer)));    
    const chainlinkBalStart_BNJIcontract  = Number(ethers.utils.formatEther(await polygonChainlink.balanceOf(benjaminsContract.address)));
    expect(chainlinkBalStart_deployer).to.equal(10);
    expect(chainlinkBalStart_BNJIcontract).to.equal(0);  

    // sending over 10 LINK to contract
    await polygonChainlink.connect(deployerSigner).transfer(benjaminsContract.address, chainlinkToGetIn18dec);

    // transfer confirmation
    const chainlinkBalAfterSend_deployer      = Number(ethers.utils.formatEther(await polygonChainlink.balanceOf(deployer)));    
    const chainlinkBalAfterSend_BNJIcontract  = Number(ethers.utils.formatEther(await polygonChainlink.balanceOf(benjaminsContract.address)));
    expect(chainlinkBalAfterSend_deployer).to.equal(0);
    expect(chainlinkBalAfterSend_BNJIcontract).to.equal(10);  

    // reverts as expected: cleanERC20Tips does not accept USDC address as argument
    await expect( benjaminsContract.connect(deployerSigner).cleanERC20Tips(polygonUSDCaddress) ).to.be.revertedWith(
      "ERC20 cannot be USDC."
    );  

    // reverts as expected: cleanERC20Tips does not accept amUSDC address as argument
    await expect( benjaminsContract.connect(deployerSigner).cleanERC20Tips(polygonAmUSDCAddress) ).to.be.revertedWith(
      "ERC20 cannot be amUSDC."
    ); 

    // reverts as expected: cleanERC20Tips does not accept benjaminsContract address as argument
    await expect( benjaminsContract.connect(deployerSigner).cleanERC20Tips(benjaminsContract.address) ).to.be.revertedWith(
      "ERC20 cannot be BNJI."
    ); 
    
    // calling cleanERC20Tips with Chainlink address as argument, LINK is getting sent to calling owner
    await benjaminsContract.connect(deployerSigner).cleanERC20Tips(polygonLINKaddress);

    // cleanERC20Tips confirmation
    const chainlinkBalAfterClean_deployer      = Number(ethers.utils.formatEther(await polygonChainlink.balanceOf(deployer)));    
    const chainlinkBalAfterClean_BNJIcontract  = Number(ethers.utils.formatEther(await polygonChainlink.balanceOf(benjaminsContract.address)));
    expect(chainlinkBalAfterClean_deployer).to.equal(10);
    expect(chainlinkBalAfterClean_BNJIcontract).to.equal(0);  
    
    await countAllCents(); 

  });  

  
  it("Test 1. testUser_1 should mint 10 BNJI for themself", async function () {  
    await countAllCents();         
    await testMinting("Test 1, minting 40 BNJI to caller", 40, testUser_1, testUser_1);      
    expect(await balBNJI(testUser_1)).to.equal(40);    
    await countAllCents();    
  });










  // todo: create "real world usage simulation"

  // todo: rename the following tests, should be the last ones

  it("Test 24. Activating pause() should lock public access to state changing functions, but allow owner", async function () { 
    
    await countAllCents();

    // Preparation mint
    await testMinting(200000, deployer, deployer); 

    // setup for test, testUser_1 mints 510 BNJI and waits 180 blocks,
    // after that, user would normally be able to transfer, burn etc
    await addUserAccDataPoints(testUser_1);        
    await testMinting(510, testUser_1, testUser_1);  
    expect(await balBNJI(testUser_1)).to.equal(510);    

    // anybody who is not the owner cannot activate pause()
    await expect( benjaminsContract.connect(testUser_1_Signer).pause() ).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );   

    // owner activates pause()
    await benjaminsContract.connect(deployerSigner).pause(); 
    
    // when pause has been activated, normal users cannot use transfer
    await expect( benjaminsContract.connect(testUser_1_Signer).transfer(testUser_2, 10)).to.be.revertedWith(
      "Benjamins is paused."
    );
    
    // when pause has been activated, normal users cannot use transferFrom
    await expect( benjaminsContract.connect(testUser_1_Signer).transferFrom(testUser_2, testUser_3, 10)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use mint
    await expect( benjaminsContract.connect(testUser_1_Signer).mint(12)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use mintTo
    await expect( benjaminsContract.connect(testUser_1_Signer).mintTo(14, testUser_2)).to.be.revertedWith(
      "Benjamins is paused."
    );
    
    // when pause has been activated, normal users cannot use burn
    await expect( benjaminsContract.connect(testUser_1_Signer).burn(11)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use burnTo
    await expect( benjaminsContract.connect(testUser_1_Signer).burnTo(16, testUser_2)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use quoteUSDC
    await expect( benjaminsContract.connect(testUser_1_Signer).quoteUSDC(100, true)).to.be.revertedWith(
      "Benjamins is paused."
    );
        
    // test preparation verification, contract owner should have 889000 tokens from "First Setup mint for 100k USDC"
    expect(await balBNJI(deployer)).to.equal(1089000);
       
    // when paused is active, contract owner can use transfer 40 BNJI from themself to testUser_2
    expect(await balBNJI(testUser_2)).to.equal(0);        
    await testTransfer(40, deployer, testUser_2, false,0 );
    expect(await balBNJI(testUser_2)).to.equal(40);  
    expect(await balBNJI(deployer)).to.equal(1088960); 
        
    // when paused is active, contract owner can use transferFrom to move 40 BNJI from testUser_1 to testUser_3
    expect(await balBNJI(deployer)).to.equal(1088960); 
    expect(await balBNJI(testUser_1)).to.equal(510); 
    expect(await balBNJI(testUser_3)).to.equal(0); 
    await testTransfer(40, deployer, testUser_3, true, testUser_1 );
    expect(await balBNJI(deployer)).to.equal(1088960); 
    expect(await balBNJI(testUser_1)).to.equal(470); 
    expect(await balBNJI(testUser_3)).to.equal(40);    
    
    // when paused is active, contract owner can use mint
    expect(await balBNJI(deployer)).to.equal(1088960); 
    // minting 120 BNJI to caller (owner)
    await testMinting(120, deployer, deployer);  
    expect(await balBNJI(deployer)).to.equal(1089080); 

    // when paused is active, contract owner can use mintTo to mint 140 BNJI to testUser_2
    expect(await balBNJI(deployer)).to.equal(1089080); 
    expect(await balBNJI(testUser_2)).to.equal(40);
    // minting 140 BNJI by caller (owner) to testUser_2
    await testMinting(140, deployer, testUser_2); 
    expect(await balBNJI(deployer)).to.equal(1089080);
    expect(await balBNJI(testUser_2)).to.equal(180);    
    
    // when paused is active, contract owner can use burn to burn 80 token for themself
    expect(await balBNJI(deployer)).to.equal(1089080);
    // burning 80 BNJI by caller (owner) to themself
    await testBurning(80, deployer, deployer);
    expect(await balBNJI(deployer)).to.equal(1089000);

    // when paused is active, contract owner can use burnTo to burn 160 token for testUser_2
    expect(await balBNJI(deployer)).to.equal(1089000);
    expect(await balUSDCinCents(testUser_2)).to.equal(300000);  
    // burning 160 BNJI by caller (owner) to themself
    await testBurning(160, deployer, testUser_2);  
    expect(await balBNJI(deployer)).to.equal(1088840); 
    expect(await balUSDCinCents(testUser_2)).to.equal(300000+4315);

    // when paused is active, contract owner can use quoteUSDC
    const tokenValueIn6dec = bigNumberToNumber(await benjaminsContract.connect(deployerSigner).quoteUSDC(100, true));
    expect(tokenValueIn6dec).to.equal(27230000);

    // verifying once more that benjaminsContract is still paused
    expect(await benjaminsContract.paused()).to.equal(true);

    // anybody who is not the owner cannot deactivate pause()
    await expect( benjaminsContract.connect(testUser_1_Signer).unpause() ).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );   
    
    // owner deactivates pause()
    await benjaminsContract.connect(deployerSigner).unpause();
    expect(await benjaminsContract.paused()).to.equal(false);
      
    await countAllCents();//
    
  });





  
  it("Test 29. Owner can add additional funds to contract's amUSDC balance", async function () { 
    
    // Note: Not using countAllCents here, as $10 of USDC will be converted into amUSDC, which are not tracked the same way.

    // getting contracts amUSDC balance
    const contractAMUSDCbalBeforeInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
    // since it constantly changes in tiny amounts, due to accruing interest, rounding it down to whole cents
    const beforeRoundedToCents = contractAMUSDCbalBeforeInCents - (contractAMUSDCbalBeforeInCents%1); 
    expect(beforeRoundedToCents).to.equal(9879012);
    // owner deposits an extra $100 USDC into the lending pool on contracts behalf
    await depositAdditionalUSDC(100*scale6dec);
    // rounding down new amUSDC balance, same reasoning and comparing
    const contractAMUSDCbalAfterInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
    const afterRoundedToCents = contractAMUSDCbalAfterInCents - (contractAMUSDCbalAfterInCents%1); 
    // expecting that the new balance is $100 bigger than the old one
    expect(afterRoundedToCents).to.equal(beforeRoundedToCents+10000);  

  });

  it("Test 30. All tokens that exist can be burned, and the connected USDC paid out by the protocol", async function () { 

    await countAllCents();

    for (let index = 0; index < testUserAddressesArray.length; index++) {
      const callingAcc = testUserAddressesArray[index];

      const balanceBNJI = await balBNJI(callingAcc);

      if (balanceBNJI>0){
        await testBurning(`Endburn from testUser_${index}`, balanceBNJI, callingAcc, callingAcc);
        expect(await balBNJI(callingAcc)).to.equal(0);
      }    
    }

    const balBNJIdeployer = await balBNJI(deployer);
    await testBurning(`Endburn from deployer`, balBNJIdeployer, deployer, deployer);

    expect(await balBNJI(deployer)).to.equal(0);

    const totalSupplyExisting = bigNumberToNumber(await benjaminsContract.totalSupply()); 
    expect(totalSupplyExisting).to.equal(0);

    await countAllCents();
  });

  // TODO test checkGains and withdrawGains

  // TODO put in reentrancy guard test? */
}); 