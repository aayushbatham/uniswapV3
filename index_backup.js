const ethers = require('ethers');
require('dotenv').config();
const express = require('express');
const ABI = require('./abi.json');

const PRIVATE_KEY = "8bf4b1cae3f437b75f6649c1dc702f4015d6d63852db4d7eedc747bf4d4597ed";

const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/alcht_ECRFwRe1pH5sKP1FSBGo3SpLFVTXNS');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const routerAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

const routerABI = ABI;

const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);

async function swapTokens(inputToken, outputToken, amountIn, slippage, recipient) {
    const amountInWei = ethers.parseUnits(amountIn, 6); // assuming USDC has 6 decimals
    const slippageTolerance = ethers.parseUnits(slippage, 2);

    const swapParams = {
        tokenIn: inputToken,
        tokenOut: outputToken,
        fee: 3000, 
        recipient: recipient,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
        amountIn: amountInWei,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
    };

    const tx = await routerContract.exactInputSingle(swapParams);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log('Swap complete');
}

async function checkBalance(address,) {
  try {
      // Get the wallet's public address
      const address = wallet.address;

      // Get the balance of the wallet in wei (smallest denomination)
      const balanceWei = await provider.getBalance(address);

      // Convert the balance to Ether (Base chain uses ETH-like denominations)
      const balanceEth = ethers.utils.formatEther(balanceWei);

      console.log(`Balance of ${address}: ${balanceEth} ETH`);
  } catch (error) {
      console.error('Error checking balance:', error);
  }
}

const app = express();
app.use(express.json());

app.post('/swap', async (req, res) => {
    const { inputToken, outputToken, amountIn, slippage, recipient } = req.body;
    try {
        await swapTokens(inputToken, outputToken, amountIn, slippage, recipient);
        res.status(200).send('Swap successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Swap failed');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

