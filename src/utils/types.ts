import { ethers } from "ethers";

export interface Settings {
    minPriceDiffPerc: number,
    wsRPC : string,
    wallet: ethers.Wallet,
    provider: ethers.Provider
} 

export interface DexFactory{
    factory:string,version:number
}
export type DexFactoryReturn  = {
     pool: string,  //0
     wethLiq: number, //1
     tokenLiq: number, //2
     version: number, //3
     poolFee: number, //4
     sqrtPriceX96: number, //5
     tk0IsWeth: boolean  //6   
}

export interface Pool {
    weth: bigint;
    token: bigint;
}