# Base-arbitrage-bot

The Base Arbitrage Bot is an automated trading bot designed to execute arbitrage strategies on decentralized exchanges (DEXs). It leverages blockchain technology to detect price discrepancies between different tokens in different DEXs, allowing users to profit by buying low on one exchange and selling high on another.

# Features
•	Automated Arbitrage Execution: The bot identifies arbitrage opportunities between different pairs of tokens across DEXs automatically.

•	Blockchain Integration: Built on top of blockchain smart contracts, ensuring transparency and security.

•	Fast Execution: Optimized for speed to minimize missed opportunities.

•	Configurable Settings: User-configurable parameters such as minimum price discrepency tolerance.


# Prerequisites

To run the Base Arbitrage Bot, ensure you have the following installed:

1.	Node.js (v14 or later)
2.	NPM (Node Package Manager)
3.	A Web3 wallet (e.g., MetaMask) or access to a Web3 wallet.
4.	Sufficient cryptocurrency balance ETH to cover gas fees and WETH to perform transactions.

# Installation

Follow the steps below to clone and install the bot on your local machine:

1. Clone the repository:
   
        git clone https://github.com/Fluronix/base-arbitrage-bot.git
        cd base-arbitrage-bot

# Runing using docker

# Runing using node.js

1. Install dependencies:

         npm install
         npm install typescript -g

2. Change the "outDir": "./src"  from "src" to "dist" in the tsconfig.json file
3. compile code

           tsc
4. Navigate to ./dist directory and edit the .env file with your preference and wallet private key or seedphrase. Note the websocket rpc url "ws://base.node.fluronix.app:8546/"  might not be active in the future.
5. On the root directory of the /dist directory project

         node main.js


Enjoy!
