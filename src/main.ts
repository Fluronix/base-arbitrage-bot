import { ethers } from "ethers";
import path from "path"
import {Settings} from "./utils/types"
import {Module} from "./utils/module"
import {isAlphabetic} from "./utils/helperfunc"
import dotenv  from 'dotenv';

dotenv.config();

const RPC_WS =  process.env.RPC_WS??""
const PRIVATE_KEY = process.env.PRIVATE_KEY_OR_SEEDPHRASE??""



let wallet:ethers.Wallet
const provider = new ethers.WebSocketProvider(RPC_WS);

if(isAlphabetic(PRIVATE_KEY)){
    wallet = new ethers.Wallet(ethers.Wallet.fromPhrase(PRIVATE_KEY).privateKey, provider)
}else{
    wallet = new ethers.Wallet(PRIVATE_KEY, provider)
}


const settings: Settings = {
    minPriceDiffPerc : Number(process.env.MIN_PRICE_DIF_PERC??"0.9"),
    // gasTips: Number(process.env.GAS_TIPS),
    wsRPC : RPC_WS,
    wallet: wallet, 
    provider:provider
}


//instance pf bot class
const bot = new Module(settings)

async function run() {
    //initialize bot
    await bot.initialize()

    //listen to new block event
    provider.on('block', async (blockNumber) => {
        const block = await provider.getBlock(blockNumber)
        block?.transactions.forEach((txhash)=>{
            provider.getTransactionReceipt(txhash).then(receipt =>{
                bot.processTxReciept(receipt)
            }).
            catch(err =>console.log(err))
        })
    })


}
run()