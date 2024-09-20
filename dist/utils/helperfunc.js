"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.color = exports.logger = exports.fromwei = exports.towei = exports.percent_of_x_in_y = exports.x_percent_of_y = exports.uniV2Poolcontract = exports.ERC20contract = exports.erc20ABI = exports.isWethPair = void 0;
exports.isAlphabetic = isAlphabetic;
exports.loadYaml = loadYaml;
exports.findHighestAndLowest = findHighestAndLowest;
const ethers_1 = require("ethers");
const fs = __importStar(require("fs"));
const winston_1 = __importDefault(require("winston"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function isAlphabetic(value) {
    // Check if the value is a string and matches the alphabetic pattern
    return typeof value === 'string' && /^[A-Za-z ]+$/.test(value);
}
//Check if WETH is included in pair
const isWethPair = (WETH, token01) => {
    //**If WETH addr is in token0 return token1 verse versa  else return none*/
    if (token01[0].toLocaleLowerCase() === WETH.toLocaleLowerCase()) {
        return [token01[1], token01[0]];
    }
    else if (token01[1].toLocaleLowerCase() === WETH.toLocaleLowerCase()) {
        return [token01[0], token01[1]];
    }
    return "none";
};
exports.isWethPair = isWethPair;
exports.erc20ABI = [
    "function decimals() external view returns (uint8)",
    "function approve(address spender, uint256 value) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function withdraw(uint wad) public",
    "function deposit() public payable"
];
const ERC20contract = (addr, provider) => new ethers_1.ethers.Contract(addr, exports.erc20ABI, provider);
exports.ERC20contract = ERC20contract;
const uniV2Poolcontract = (addr, abi, provider) => new ethers_1.ethers.Contract(addr, abi, provider);
exports.uniV2Poolcontract = uniV2Poolcontract;
const x_percent_of_y = (x, y) => (x / 100) * y;
exports.x_percent_of_y = x_percent_of_y;
const percent_of_x_in_y = (x, y) => (x / y) * 100;
exports.percent_of_x_in_y = percent_of_x_in_y;
//convert human to wei
const towei = (amount, decimals) => ethers_1.ethers.parseUnits(amount, decimals).toString();
exports.towei = towei;
//convert from wei to human
const fromwei = (amount, decimals) => ethers_1.ethers.formatUnits(amount, decimals).toString();
exports.fromwei = fromwei;
// Function to load YAML file
function loadYaml(fpath) {
    const fileContents = fs.readFileSync(fpath, "utf8");
    const config = js_yaml_1.default.load(fileContents);
    return config;
}
// Create a Winston logger
const logger = (logtopath = undefined) => winston_1.default.createLogger({
    level: 'info', // Set the logging level
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), // Add a timestamp to the log
    winston_1.default.format.combine() // Format logs as JSON
    // winston.format.prettyPrint() // Format logs as JSON
    ),
    transports: logtopath ? [new winston_1.default.transports.File({ filename: logtopath })] : [new winston_1.default.transports.Console()] // Log to the console
});
exports.logger = logger;
function findHighestAndLowest(arr) {
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
exports.color = {
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
