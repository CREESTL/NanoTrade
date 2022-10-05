# Benture Smart-Contracts
The Benture is an investing marketplace, connecting entrepreneurs with investors. The Benture combines the token creation and management, launchpad and DEX features, providing entrepreneurs a single solution that makes it simple, quick and cost effective to find and interact with investors and shareholders.


#### Table on contents
[Build & Deploy](#build_and_deploy)  
[Wallets](#wallets)  
[Smart-Contract Logic](#logic)  

<a name="build_and_deploy"/>

### Build & Deploy  
The following information will guide you through the process of building and deploying the contracts yourself.

<a name="prerequisites"/>

### Prerequisites
- Install [Node.js](https://nodejs.org/en/download/)
- Clone this repository with `git clone https://git.sfxdx.ru/nano-trade/nano-trade-sc.git`
- Navigate to the directory with the cloned code
- Install [Hardhat](https://hardhat.org/) with `npm install --save-dev hardhat`
- Install all required dependencies with `npm install`
- Create a file called `.env` in the root of the project with the same contents as `.env.example`
- Create an account on [Etherscan](https://etherscan.io/). Go to `Account -> API Keys`. Create a new API key. Copy it to `.env` file
    ```
    ETHERSCAN_API_KEY=***your etherscan API key***
    ```
- Copy your wallet's private key (see [Wallets](#wallets)) to `.env` file
    ```
    ACC_PRIVATE_KEY=***your private key***
    ```
- Create an account on [Etherscan](https://etherscan.io/). Go to `Account -> API Keys`. Create a new API key. Copy it to `.env` file
    ```
    ETHERSCAN_API_KEY=***your etherscan API key***
    ```
- Create an account on [Infura](https://infura.io/). Go to `Dashboard -> Create new key -> Manage key`. Copy API key to `.env` file
    ```
    INFURA_API_KEY=***your infura API key***
    ```
:warning:__DO NOT SHARE YOUR .env FILE IN ANY WAY OR YOU RISK TO LOSE ALL YOUR FUNDS__:warning:

### 1. Build

```
npx hardhat compile
```

### 2. Deploy
Start  deployment _only_ if build was successful!

#### Testnets
а) __Goerli__ test network  
Make sure you have _enough GoerliETH_ tokens for testnet. You can get it for free from [faucet](https://goerlifaucet.com/). 
```
npx hardhat run scripts/deploy.js --network goerli
```  

#### Mainnets
a) __Ethereum__ main network  
Make sure you have _enough real ether_ in your wallet. Deployment to the mainnet costs money!
```
npx hardhat run scripts/deploy.js --network ethereum
```

Deployment script takes more than 4 minutes to complete. Please, be patient!.   

After the contracts get deployed you can find their _addresses_ and code verification _URLs_ in the `deployOutput.json` file.
You have to provide these wallets with real/test tokens in order to _call contracts' methods_ from them. 

Please note that all deployed contracts __are verified__ on [Etherscan](https://etherscan.io/) (testnet [Ethersan](https://rinkeby.etherscan.io/)), 

<a name="wallets"/>

### Wallets
For deployment you will need to use either _your existing wallet_ or _a generated one_. 

#### Using existing wallet
If you choose to use your existing wallet, then you will need to be able to export (copy/paste) its private key. For example, you can export private key from your MetaMask wallet.  
Wallet's address and private key should be pasted into the `.env` file (see [Prerequisites](#prerequisites)).  

#### Creating a new wallet
If you choose to create a fresh wallet for this project, you should use `createWallet` script from `scripts/` directory.
```
npx hardhat run scripts/createWallet.js
```
This will generate a single new wallet and show its address and private key. __Save__ them somewhere else!  
A new wallet _does not_ hold any tokens. You have to provide it with tokens of your choice.  
Wallet's address and private key should be pasted into the `.env` file (see [Prerequisites](#prerequisites)).
 
<a name="logic"/>

### Smart-Contract Logic
__Roles__:
- entrepreneur: creates and controls ERC20 tokens, pays dividends
- user (investor): buys ERC20 tokens, receives dividends

<a name="erc20"/>

#### NanoProducedToken.sol
This is an [ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20) token that is created by the entrepreneur. 
It can be:
- minted (if mintability is activated)
- transfered between addresses
- burnt by the owner of tokens  

The contract of the token saves addresses of each holder of the token to use in the future.  

#### NanoFactory.sol
This is a factory contract that is used by the entrepreneur to create new [NanoProducedTokens](#erc20).
The entrepreneur can call a `createERC20Token` function of the factory providing all necessary parameters and the factory will deploy a new contract of NanoProducedToken token with these parameters. This token is meant to be sold on the marketplace and bought by investors. Each investor buying a token becomes a token holder.
Moreover, with each new created NanoProducedToken contract the factory mints an admin ([NanoAdmin](#admin)) token to the entrepreneur who created the token. 

<a name="admin"/>

#### NanoAdmin.sol
This is an [ERC721](https://docs.openzeppelin.com/contracts/4.x/erc721) token that is minted to the creator of each new [NanoProducedToken](#erc20). This token proves the ownership of created NanoProducedToken and gives admin rights i.e. allows the NanoAdmin holder to mint new NanoProducedTokens.
It can be:
- minted
- transfered between addresses
- burnt by the owner 

It is important to mention that NanoAdmin token proves the ownership of NanoProducedToken _contract in general, and not of every minted token_. So if Bob owns 1000 NanoProducedTokens, an entrepreneur owning the NanoAdmin token of that NanoProducedToken will not be able to transfer or burn Bob's tokens. The _only thing_ he can do is _mint_ more NanoProducedTokens (that will not be owned by anyone at first).  

Let's assume that Alice created a new "ABC" token using NanoFactory contract. She now owns the ABC token contract which is confirmed with her also holding a NanoAdmin token connected to the ABC token. 
- If Alice transfers her NanoAdmin token to Bob, then Bob becomes the owner of ABC token and gets admin rights as well
- If Alice burns her NanoAdmin token, then ABC token is left without an owner forever. That means that all holders of ABC tokens will still be able to transfer, burn, sell their tokens, but no new tokens will ever be minted
- If all holders of ABC tokens burn their tokens, Alice still remains the owner. She still can mint new ABC tokens

#### Nano.sol
This is a dividend-distributing contract. Dividends are distributed among [NanoProducedTokens](#erc20) holders.
Let's assume that Alice is the entrepreneur and she wishes to pay dividends to all 100 users who bought the ABC tokens she created. First, Alice has to choose the address of the token to holders of which she would like to pay the dividends. She chooses the address of ABC token. Second, Alice has to provide Nano contract with enough tokens that will be distributed as dividends and choose the address of that token. Alice wants to pay dividends in another ERC20 token - GDG (suppose she has purchased it somewhere). She sends 700 GDGs to the Nano contract and chooses GDG's address. Now all she has to do is call a dividend-distributing function of the Nano contract and all ABC holders will receive their dividends.

Two important things to notice:
1. Dividends can be payed in one of two ways:
    1.1 _Equal_. Each of ABC holders receives an equal amount of dividends. `distributeDividendsEqual` function provides this functionality
    1.2 _Weighted_. Each ABC holder receives an amount of dividends proportional to the amount of ABC tokens he holds. `distributeDividendsWeighted` provides this functionality
2. Dividends can be payed in one of two kinds of tokens:
    2.1 _ERC20 tokens_. In order to pay dividends in ERC20 tokens Alice has to call `distributeDividendsEqual` or `distributeDividendsWeighted` function providing ERC20's address as the second parameter
    2.2 _Ether_. In order to pay dividends in ether Alice has to call `distributeDividendsEqual` or `distributeDividendsWeighted` function providing [zero address](https://ethereum.org/en/glossary/#zero-address) as the second parameter

Also it is worth mentioning that Nano contract is not necessarily a "dividend-distributing" contract but rather a "token-distributing" contract. It is public and can be used not only by NanoAdmin holders. For example, if Sam wishes to pay all 10 holders of some ZZZ token (not owned or created by him) equal amount of YYY tokens what he can do is:
- Send some YYY tokens to the Nano contract. 100 in this case
- Call `distributeDividendsEqual` function with ZZZ address as the first parameter and YYY address as the second parameter.

Each of 10 ZZZ holders will receive 10 YYY tokens.