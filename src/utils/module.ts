
import { ethers } from "ethers";
import * as func from "./helperfunc"
import path from "path"
import getterAbi from "./abi/Getter.json"
import executeSwapAbi from "./abi/Executeswap.json"
import uniswapV2poolAbi from "./abi/UniV2pool.json"
import {
    Settings,
    DexFactory,
    DexFactoryReturn,
    Pool
} from "./types"



const ADDRESS = func.loadYaml(path.join(__dirname, "./address.yaml"))

const v2PoolSwapSig = "Swap(address,uint256,uint256,uint256,uint256,address)"
const v2PoolSwapSigBytes = ethers.keccak256(ethers.toUtf8Bytes(v2PoolSwapSig))

const v3PoolSwapSig = "Swap(address,address,int256,int256,uint160,uint128,int24)"
const v3PoolSwapSigBytes = ethers.keccak256(ethers.toUtf8Bytes(v3PoolSwapSig))


export class  Module {
    settings: Settings

    constructor(settings:Settings){
        this.settings = settings
    }

    async initialize(){
        console.log(func.color.FgCyan+"Initializing...")
        //some check on user wallet and approval
        const [allowance, balance] = await Promise.all([
            await func.ERC20contract((ADDRESS.WETH), this.settings.provider).allowance(this.settings.wallet.address, this.executeSwap().target),
            await func.ERC20contract((ADDRESS.WETH), this.settings.provider).balanceOf(this.settings.wallet.address)
        ])

        if(balance < BigInt(func.towei("0.0008", 18))){
            console.log(`${func.color.FgRed}Low balance!\nWallet Balance: ${func.fromwei(balance.toString(), 18)} WETH`)
            process.exit()
        }
        if(allowance === BigInt(0)){
            await func.ERC20contract((ADDRESS.WETH), this.settings.wallet).approve(this.executeSwap().target,
            "57896044618658097711785492504343953926634992332820282019728792003956564819967")
        }
        console.log(func.color.FgGreen+"Initialization completed"+func.color.Reset)
    }
    private getterContract = ()=>
        new ethers.Contract(
        "0x9FC8dA750c5D1e831a4AED1a8E54EfEB82A9adAc", 
        getterAbi,
        this.settings.provider
    )
    public executeSwap = (provider:ethers.Provider|ethers.Wallet = this.settings.wallet)=>
        new ethers.Contract(
        "0x0058977AE90652128779ad480473977cA7B74e8E", //updated
        executeSwapAbi,
        provider
    )
    private calcPriceV2(poolLiqWethTk: Pool, decimal:number): number {
        // Calculate prices
            const price = parseFloat(func.fromwei(poolLiqWethTk.weth.toString(), 18)) /  parseFloat(func.fromwei(poolLiqWethTk.token.toString(), decimal))
            return price 
    }
    private calcPriceV3(sqrtPriceX96: number, decimal:number, tk0IsWeth:boolean): number {
        // const ratio =  poolLiqWethTk.weth / poolLiqWethTk.token
        // const sqrtPriceX96 = Math.sqrt(ratio) * Math.pow(2, 96)
       /**
        * @doc https://blog.uniswap.org/uniswap-v3-math-primer
        * @dev adj: one token1 == x token0 :. (1 / (sqrtPriceX96 / 2**96) **2)
        */
        const price = 1 / (sqrtPriceX96 / 2**96) **2
        const formatedPrice10 = price / (10**18 / 10**decimal) //one token1 == x token0
        const formatedPrice01 = (10**decimal / 10**18 ) / price //one token0 == x token1
        return tk0IsWeth ? formatedPrice10: formatedPrice01
    
    }
    private calc_trade_volume (poolAliq :bigint, poolBliq: bigint, price_impact:number, poolFeeA:number = 3000, poolFeeB:number = 3000){
        // const fee = 0.25  //0.25%
        // const fee_converted = fee / 100  //ouput 0.0025
      
        const pool_a_liq =  parseFloat(func.fromwei(poolAliq.toString(), 18))
        const pool_b_liq = parseFloat(func.fromwei(poolBliq.toString(), 18))
        const max_price_impact_converted = price_impact / 100  //ouput percentFraction
        const fee_converted_a = poolFeeA / 10**6 // ouput 0.003 - 0.3 percent
        const fee_converted_b = poolFeeB / 10**6 // ouput 0.003 - 0.3 percent
      
        const trade_volume_a = (pool_a_liq * max_price_impact_converted) / ((1 - max_price_impact_converted) * (1 - fee_converted_a))
        const trade_volume_b = (pool_b_liq * max_price_impact_converted) / ((1 - max_price_impact_converted) * (1 - fee_converted_b))
        
        const trade_volume = Math.min(trade_volume_a, trade_volume_b)
        return trade_volume
      } 
    async processTxReciept(txReciept:ethers.TransactionReceipt | null ){
        if(txReciept === null)return
        const to = txReciept.to
        const txLogs = txReciept.logs
        
        //search for swap tx
        txLogs.forEach(async Log => {
            for(let topic of  Log.topics){
                
                 //if transaction is a uniV2poolswap tx
                if(topic.toLowerCase() === v2PoolSwapSigBytes.toLowerCase()){
                    try{
                        const poolAddr =  Log.address //the pool the swap is occuring
                        //get the token0 & token1 of the pool
                        const poolContract =  func.uniV2Poolcontract(poolAddr,uniswapV2poolAbi,this.settings.provider)
                        const token01 = await Promise.all([await poolContract.token0(),await poolContract.token1()])
                        const baseTokenWeth = func.isWethPair(ADDRESS.WETH, token01)// baseTokenWeth = [tokenAddr , wethAddr] 
                        if(baseTokenWeth === "none") return //accept only WETH pair
                        this.findPoolInDex(baseTokenWeth, poolAddr, txReciept)
                        //console.log(poolAddr, baseToken, txReciept.hash)
                        
                    }catch(error){
                        null
                    }
                    break
                }
                 //if transaction is a uniV3poolswap tx
                if(topic.toLowerCase() === v3PoolSwapSigBytes.toLowerCase()){
                    try{
                        const poolAddr =  Log.address //the pool the swap is occuring
                        //get the token0 & token1 of the pool
                        const poolContract =  func.uniV2Poolcontract(poolAddr,uniswapV2poolAbi,this.settings.provider)
                        const token01 = await Promise.all([await poolContract.token0(),await poolContract.token1()])
                        const baseTokenWeth = func.isWethPair(ADDRESS.WETH, token01) // baseTokenWeth = [tokenAddr , wethAddr] 
                        if(baseTokenWeth === "none") return //accept only WETH pair
                        this.findPoolInDex(baseTokenWeth, poolAddr, txReciept)
                    }catch(error){
                        null
                    }
                    break
                }
           }   
        })
    
    }
    private async findPoolInDex(tokenFind: any, motherPoolAddr:string, signalTx:ethers.TransactionReceipt){
        /**
         * @dev tokenFind is format sensitive [token, weth]] 
         */
        const dexFactory: DexFactory[] =[
            {factory:ADDRESS.PancakeV2Factory, version: 2},
            {factory: ADDRESS.PancakeV3Factory, version: 3},

            {factory: ADDRESS.sushiSwapV2Factory, version: 2},
            {factory: ADDRESS.sushiSwapV3Factory, version: 3},

            {factory: ADDRESS.uniswapv2Factory, version: 2},
            {factory: ADDRESS.uniswapv3Factory, version: 3},

            {factory: ADDRESS.baseSwapV2Factory, version: 2},
            {factory: ADDRESS.baseSwapV3Factory, version: 3},
            
            {factory: ADDRESS.swapBaseV2factory, version: 2},
            {factory: ADDRESS.swapBaseV3Factory, version: 3},

            {factory: ADDRESS.dackieV2Factory, version: 2},
            {factory: ADDRESS.dackieV3Factory, version: 3},

            {factory: ADDRESS.AlienbaseV2Factory, version: 2},
        ]

        //call the getter contract to find the target token swaped in other dexes
        let [poolData, basetokenDecimal] = await this.getterContract().getPool(dexFactory, tokenFind, func.towei("1",18))//[ [[],[],...], decimal ]
        const poolArray = poolData.filter((data:any) => data[0]  != "0x0000000000000000000000000000000000000000");
        basetokenDecimal = Number(basetokenDecimal)

        if(poolArray.length < 2) return //if only one pool were found 

        //get the mother pool from the returned poolArray (the pool captured from swap Logs )
        let motherPoolArr: any[] = []  //[pool, wethLiq, tokenLiq, version, poolFee, sqrtPriceX96, tk0IsWeth]
        let ArbitragePoolArr: any[] = [] //others pools [ typeOf(motherPoolArr) typeOf(motherPoolArr) ...]

        for (let i = 0; i < poolArray.length; i++) {
            if (poolArray[i].pool.toLowerCase() === motherPoolAddr.toLowerCase()) {
                motherPoolArr = poolArray[i]//mother pool
            }else{
                ArbitragePoolArr.push(poolArray[i]) // other pools to arbitrage
            }
        }

        // make sure the mother pool is found in the list pools of DEXes
        if(motherPoolArr.length === 0) return

        //calculate the prices of the motherpool 
        const motherPoolPrice = Number(motherPoolArr[3]) === 2 ? //version
            this.calcPriceV2({weth: motherPoolArr[1], token : motherPoolArr[2]}, basetokenDecimal) :
            this.calcPriceV3(Number(motherPoolArr[5]), basetokenDecimal, motherPoolArr[6])

        //calculate the price of the other pools to arbitrage
        let ArbitragePoolPrices: number[] = []
        for (let i=0; i<ArbitragePoolArr.length; i++){
            //const pool = ArbitragePoolArr[i][0]
            const wethLiq = ArbitragePoolArr[i][1]
            const tokenLiq = ArbitragePoolArr[i][2]
            const version = ArbitragePoolArr[i][3]
            //const poolFee = ArbitragePoolArr[i][4]
            const sqrtPriceX96 = ArbitragePoolArr[i][5]
            const tk0IsWeth = ArbitragePoolArr[i][6] 

            const priceOfPool = Number(version) === 2 ? //version
                this.calcPriceV2({weth: wethLiq, token : tokenLiq}, basetokenDecimal) :
                this.calcPriceV3(Number(sqrtPriceX96), basetokenDecimal, tk0IsWeth)

            ArbitragePoolPrices[i] = priceOfPool
        }

        //find the highest and lowest price in ArbitragePoolPrices
        const HLprice =  func.findHighestAndLowest(ArbitragePoolPrices)
        if(HLprice === null) return

        const higherPrice = HLprice.highest.value
        const higherPriceIndex = HLprice.highest.index
        const lowerPrice = HLprice.lowest.value
        const lowerPriceIndex = HLprice.lowest.index

        //find the lowest and highest of motherPoolPrice and the HLprice of the ArbitragePoolPrices
        const router =  func.findHighestAndLowest([motherPoolPrice, higherPrice, lowerPrice])
        const Lindex = router?.lowest.index
        const Hindex = router?.highest.index

        let buyLow: any[] = [] //DexFactoryReturn property
        let buyPrice = 0 //low
        let sellHigh: any[] = []//DexFactoryReturn property
        let sellPrice = 0 //high

        if(Lindex === 0){//motherPoolPrice
            buyLow = motherPoolArr
            buyPrice = motherPoolPrice
        }else if(Lindex === 1){//higherPrice
            buyLow = ArbitragePoolArr[higherPriceIndex]
            buyPrice = higherPrice
        }else if(Lindex === 2){//lowerPrice
            buyLow = ArbitragePoolArr[lowerPriceIndex]
            buyPrice = lowerPrice
        }//------------------------------
        if(Hindex === 0){// motherPoolPrice
            sellHigh = motherPoolArr
            sellPrice = motherPoolPrice
        }else if(Hindex === 1){//higherPrice
            sellHigh = ArbitragePoolArr[higherPriceIndex]
            sellPrice = higherPrice
        }else if(Hindex === 2){//lowerPrice
            sellHigh = ArbitragePoolArr[lowerPriceIndex]
            sellPrice = lowerPrice
        }

        //calculate the percentage of the price discrepencies
        const priceDiff =  sellPrice - buyPrice // high - low
        const priceDiffperc = Number(func.percent_of_x_in_y(priceDiff, sellPrice).toFixed(2))
        if (priceDiffperc < this.settings.minPriceDiffPerc) return

        //calculate optimal trade volume in WETH
        const buyLowFee = Number(buyLow[3]) === 3 ? Number(buyLow[4]) : 3000
        const sellHighFee = Number(sellHigh[3]) === 3 ? Number(sellHigh[4]) : 3000
        const amountInWETH = this.calc_trade_volume(buyLow[1], sellHigh[1], priceDiffperc, buyLowFee, sellHighFee)


        //TRADING LOGICS---------------------------------------------------------------------------------------------------
        const ExtractIn = [
            {pool: buyLow[0], version: Number(buyLow[3])}, 
             {pool: sellHigh[0], version: Number(sellHigh[3])}
        ]
        const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(['tuple(address pool, uint version)[]', 'address', 'uint'],[
                ExtractIn,  //trade path
                tokenFind[0], //target token, 
                func.towei(amountInWETH.toFixed(7), 18), //AmountIn
            ]
        )
        try{
            const txhash = await this.executeSwap().extract(encodedData,
                {
                    // gasPrice:  gasprice,
                    value: 1
                }
            ) 
            const tx = await txhash.wait()
            console.log(func.color.FgCyan+"Tx executed. Txhash:",tx.hash+ func.color.Reset )
        }catch(error:any){
            // console.log(error)
            console.log(func.color.FgRed+error.shortMessage+func.color.Reset)
        }
    }


}
