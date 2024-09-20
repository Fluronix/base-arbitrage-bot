"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const module_1 = require("./utils/module");
const helperfunc_1 = require("./utils/helperfunc");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const RPC_WS = process.env.RPC_WS ?? "";
const PRIVATE_KEY = process.env.PRIVATE_KEY_OR_SEEDPHRASE ?? "";
let wallet;
const provider = new ethers_1.ethers.WebSocketProvider(RPC_WS);
if ((0, helperfunc_1.isAlphabetic)(PRIVATE_KEY)) {
    wallet = new ethers_1.ethers.Wallet(ethers_1.ethers.Wallet.fromPhrase(PRIVATE_KEY).privateKey, provider);
}
else {
    wallet = new ethers_1.ethers.Wallet(PRIVATE_KEY, provider);
}
const settings = {
    minPriceDiffPerc: Number(process.env.MIN_PRICE_DIF_PERC ?? "0.9"),
    // gasTips: Number(process.env.GAS_TIPS),
    wsRPC: RPC_WS,
    wallet: wallet,
    provider: provider
};
//instance pf bot class
const bot = new module_1.Module(settings);
async function run() {
    //initialize bot
    await bot.initialize();
    //listen to new block event
    provider.on('block', async (blockNumber) => {
        const block = await provider.getBlock(blockNumber);
        block?.transactions.forEach((txhash) => {
            provider.getTransactionReceipt(txhash).then(receipt => {
                bot.processTxReciept(receipt);
            }).
                catch(err => console.log(err));
        });
    });
}
run();
