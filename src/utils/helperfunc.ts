
import { ethers } from "ethers";
import * as fs from "fs"
import winston from 'winston';
import yaml from "js-yaml"



export function isAlphabetic(value: any): boolean {
  // Check if the value is a string and matches the alphabetic pattern
  return typeof value === 'string' && /^[A-Za-z ]+$/.test(value);
}
//Check if WETH is included in pair
export const isWethPair = (WETH:string, token01:string[]):  [string, string] | string =>{
    //**If WETH addr is in token0 return token1 verse versa  else return none*/
    if(token01[0].toLocaleLowerCase() === WETH.toLocaleLowerCase()){
        return [token01[1], token01[0]]
    }
    else if (token01[1].toLocaleLowerCase() === WETH.toLocaleLowerCase()){
        return [token01[0], token01[1]]
    }

    return "none"
}

export const erc20ABI:string[]  = [
    "function decimals() external view returns (uint8)",
    "function approve(address spender, uint256 value) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function withdraw(uint wad) public",
    "function deposit() public payable"
]
export const ERC20contract = (addr:string, provider:any) => new ethers.Contract(addr, erc20ABI, provider)
export const uniV2Poolcontract = (addr:string, abi:any, provider:any) => new ethers.Contract(addr, abi, provider)

export const x_percent_of_y = (x:number, y:number) => (x / 100) * y 
export const percent_of_x_in_y = (x:number, y:number) => (x / y) * 100 

//convert human to wei
export const towei = (amount:string, decimals:number) =>
  ethers.parseUnits(amount, decimals).toString();
//convert from wei to human
export const fromwei = (amount:string, decimals:number) =>
  ethers.formatUnits(amount, decimals).toString();
  

// Function to load YAML file
export function loadYaml(fpath: string): any {
      const fileContents = fs.readFileSync(fpath, "utf8")
      const config = yaml.load(fileContents);
      return config;

}

// Create a Winston logger
export const logger = (logtopath:string|undefined = undefined)=>winston.createLogger({
  level: 'info', // Set the logging level
  format: winston.format.combine(
    winston.format.timestamp(), // Add a timestamp to the log
    winston.format.combine()// Format logs as JSON
    // winston.format.prettyPrint() // Format logs as JSON
  ),
  transports: logtopath? [new winston.transports.File({ filename: logtopath })] : [ new winston.transports.Console()] // Log to the console
     
});

export function findHighestAndLowest(arr: number[]): { highest: { value: number, index: number }, lowest: { value: number, index: number } } | null {
  if (arr.length === 0) {
      return null; // handle empty array case
  }

  let highest = arr[0];
  let highestIndex = 0;
  let lowest = arr[0];
  let lowestIndex = 0;

  for (let index = 1; index < arr.length; index++) {
      const value = arr[index];
      if (value > highest) {
          highest = value;
          highestIndex = index;
      }
      if (value < lowest) {
          lowest = value;
          lowestIndex = index;
      }
  }

  return {
      highest: { value: highest, index: highestIndex },
      lowest: { value: lowest, index: lowestIndex }
  };
}

export const color = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};