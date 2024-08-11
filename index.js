const ethers = require('ethers');
require('dotenv').config();
const express = require('express');
const ABI = require('./abi.json');
const ERC20 = require('./ERC20abi.json')

const PRIVATE_KEY = "8bf4b1cae3f437b75f6649c1dc702f4015d6d63852db4d7eedc747bf4d4597ed";

const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/alcht_ECRFwRe1pH5sKP1FSBGo3SpLFVTXNS');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const routerAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
// const routerAddress = "0x55296f69f40ea6d20e478533c15a6b08b654e758";
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
    const tx1 = await tokenContract.approve(spenderAddress, amountInWei);
    await tx1.wait();
    console.log(`Approval complete: ${tx1.hash}`);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log('Swap complete');
}

async function checkBalance(address) {
    try {
        // Get the balance of the given address in wei
        const balanceWei = await provider.getBalance(address);

        // Convert the balance to Ether (Base chain uses ETH-like denominations)
        const balanceEth = ethers.formatEther(balanceWei);

        console.log(`Balance of ${address}: ${balanceEth} ETH`);
        return balanceEth;
    } catch (error) {
        console.error('Error checking balance:', error);
        throw error;
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

app.get('/balance', async (req, res) => {
    const { address } = req.query;
    try {
        const balance = await checkBalance(address);
        res.status(200).json({ balance });
    } catch (error) {
        res.status(500).send('Failed to get balance');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
