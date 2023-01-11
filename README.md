# Benture Smart-Contracts

The Benture is an investing marketplace, connecting entrepreneurs with investors. The Benture combines the token creation and management, launchpad and DEX features, providing entrepreneurs a single solution that makes it simple, quick and cost effective to find and interact with investors and shareholders.

#### Table on contents

[Prereqiusites](#preqs)
[Test](#test)
[Build](#build)
[Deploy](#deploy)
[Wallets](#wallets)
[Contracts Logic](#logic)
[-- BentureProducedToken](#token)
[-- BentureFactory](#factory)
[-- BentureAdmin](#admin)
[-- Salary](#salary)

<a name="preqs"/>

### Prerequisites

- Install [Git](https://git-scm.com/)
- Install [Node.js](https://nodejs.org/en/download/)
- Clone this repository with `git clone https://git.sfxdx.ru/nano-trade/nano-trade-sc.git`
- Navigate to the directory with the cloned code
- Install [Hardhat](https://hardhat.org/) with `npm install --save-dev hardhat`
- Install all required dependencies with `npm install`
- Create a file called `.env` in the root of the project with the same contents as `.env.example`
- Create an account on [Polygonscan](https://polygonscan.com/). Go to `Account -> API Keys`. Create a new API key. Copy it to `.env` file
  ```
  POLYGONSCAN_API_KEY=***your etherscan API key***
  ```
- Copy your wallet's private key (see [Wallets](#wallets)) to `.env` file
  ```
  ACC_PRIVATE_KEY=***your private key***
  ```
- Create an account on [Infura](https://infura.io/). Go to `Dashboard -> Create new key -> Manage key`. Copy API key to `.env` file
  `INFURA_API_KEY=***your infura API key***`

  :warning:**DO NOT SHARE YOUR .env FILE IN ANY WAY OR YOU RISK TO LOSE ALL YOUR FUNDS**:warning:

<a name="test"/>

### 1. Test

```
npx hardhat test
```

<a name="build"/>

<a name="run"/>
### 2. Build

```
npx hardhat compile
```

<a name="deploy"/>

### 3. Deploy

Start deployment _only_ if build and tests were successful!

#### Testnets

а) **Mumbai** test network
Make sure you have _enough MATIC tokens_ for testnet. You can get it for free from [faucet](https://faucet.polygon.technology/).

```
npx hardhat run scripts/deploy.js --network mumbai
```

#### Mainnets

a) **Polygon** main network
Make sure you have _enough real MATIC_ in your wallet. Deployment to the mainnet costs money!

```
npx hardhat run scripts/deploy.js --network polygon
```

Deployment script takes more than 4 minutes to complete. Please, be patient!.

After the contracts get deployed you can find their _addresses_ and code verification _URLs_ in the `deployOutput.json` file.
Note that this file only refreshes the addresses of contracts that have been successfully deployed (or _redeployed_). If you deploy only a single contract then its address would get updated and all other addresses would remain untouched and would link to "old" contracts.
You have to provide these wallets with real/test tokens in order to _call contracts' methods_ from them.
Please, **do not** write anything to `deployOutput.json` file yourself! It is a read-only file.
Note: all deployed contracts **are verified** on [Polygonscan](https://mumbai.polygonscan.com/)

<a name="wallets"/>

### Wallets

For deployment you will need to use either _your existing wallet_ or _a generated one_.

#### Using existing wallet

If you choose to use your existing wallet, then you will need to be able to export (copy/paste) its private key. For example, you can export private key from your MetaMask wallet.
Wallet's address and private key should be pasted into the `.env` file (see [Prerequisites](#preqs)).

#### Creating a new wallet

If you choose to create a fresh wallet for this project, you should use `createWallet` script from `scripts/` directory.

```
node scripts/createWallet.js
```

This will generate a single new wallet and show its address and private key. **Save** them somewhere else!
A new wallet _does not_ hold any tokens. You have to provide it with tokens of your choice.
Wallet's address and private key should be pasted into the `.env` file (see [Prerequisites](#preqs)).

<a name="logic"/>

### Smart-Contract Logic

---

**For more details see `docs/` directory**

---

**Roles**:

- entrepreneur: creates and controls ERC20 tokens, pays dividends
- user (investor): buys ERC20 tokens, receives dividends

<a name="token"/>

#### BentureProducedToken.sol

This is an [ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20) token that is created by the entrepreneur.
It can be:

- minted (if mintability is activated)
- transferred between addresses
- burnt by the owner of tokens

The contract stores the addresses of all holders.

<a name="factory"/>

#### BentureFactory.sol

This is a factory contract that is used by the entrepreneur to create new [BentureProducedTokens](#erc20).
The entrepreneur can call a `createERC20Token` function of the factory providing all necessary parameters and the factory will deploy a new contract of BentureProducedToken token with these parameters. This token is meant to be sold on the marketplace and bought by investors. Each investor buying a token becomes a token holder.
Moreover, with each new created BentureProducedToken contract the factory mints an admin ([BentureAdmin](#admin)) token to the entrepreneur who created the token.

<a name="admin"/>

#### BentureAdmin.sol

This is an [ERC721](https://docs.openzeppelin.com/contracts/4.x/erc721) token that is minted to the creator of each new [BentureProducedToken](#erc20). This token proves the ownership of created BentureProducedToken and gives admin rights i.e. allows the BentureAdmin holder to mint new BentureProducedTokens.
It can be:

- minted
- transferred between addresses
- burnt by the owner

It is important to mention that BentureAdmin token proves the ownership of BentureProducedToken _contract in general, and not of every minted token_. So if Bob owns 1000 BentureProducedTokens, an entrepreneur owning the BentureAdmin token of that BentureProducedToken will not be able to transfer or burn Bob's tokens. The _only thing_ he can do is _mint_ more BentureProducedTokens (that will not be owned by anyone at first).

Let's assume that Alice created a new "ABC" token using BentureFactory contract. She now owns the ABC token contract which is confirmed with her also holding a BentureAdmin token connected to the ABC token.

- If Alice transfers her BentureAdmin token to Bob, then Bob becomes the owner of ABC token and gets owner rights and Alice looses her owner rights
- If Alice burns her BentureAdmin token, then ABC token is left without an owner forever. That means that all holders of ABC tokens will still be able to transfer, burn, sell their tokens, but no new tokens will ever be minted
- If all holders of ABC tokens burn their tokens, Alice still remains the owner. She still can mint new ABC tokens

#### Benture.sol

### !OUTDATED!

This is a dividend-distributing contract. Dividends are distributed among [BentureProducedTokens](#erc20) holders.
Let's assume that Alice is the entrepreneur and she wishes to pay dividends to all 100 users who bought the ABC tokens she created. First, Alice has to choose the address of the token to holders of which she would like to pay the dividends. She chooses the address of ABC token. Second, Alice has to provide Benture contract with enough tokens that will be distributed as dividends and choose the address of that token. Alice wants to pay dividends in another ERC20 token - GDG (suppose she has purchased it somewhere). She sends 700 GDGs to the Benture contract and chooses GDG's address. Now all she has to do is call a dividend-distributing function of the Benture contract and all ABC holders will receive their dividends.

Two important things to notice:

1. Dividends can be payed in one of two ways:
   1.1 _Equal_. Each of ABC holders receives an equal amount of dividends. `distributeDividendsEqual` function provides this functionality
   1.2 _Weighted_. Each ABC holder receives an amount of dividends proportional to the amount of ABC tokens he holds. `distributeDividendsWeighted` provides this functionality
2. Dividends can be payed in one of two kinds of tokens:
   2.1 _ERC20 tokens_. In order to pay dividends in ERC20 tokens Alice has to call `distributeDividendsEqual` or `distributeDividendsWeighted` function providing ERC20's address as the second parameter
   2.2 _Ether_. In order to pay dividends in ether Alice has to call `distributeDividendsEqual` or `distributeDividendsWeighted` function providing [zero address](https://ethereum.org/en/glossary/#zero-address) as the second parameter

Also it is worth mentioning that Benture contract is not necessarily a "dividend-distributing" contract but rather a "token-distributing" contract. It is public and can be used not only by BentureAdmin holders. For example, if Sam wishes to pay all 10 holders of some ZZZ token (not owned or created by him) equal amount of YYY tokens what he can do is:

- Send some YYY tokens to the Benture contract. 100 in this case
- Call `distributeDividendsEqual` function with ZZZ address as the first parameter and YYY address as the second parameter.
- Each of 10 ZZZ holders will receive 10 YYY tokens.

<a name="salary"/>

#### Salary.sol

**Entrepreneur side**
After creating a project (i.e. [BentureProducedToken](#token)) an entrepreneur can hire employees to work on the project. This contract allows an entrepreneur to pay salaries to the employees for their services.
An entrepreneur (admin of the project) can **add** a new employee to the list of all employees. He can use only the address of the employee or give him a nickname. After that, an admin can set an **individual schedule** of salary payments for him. Configurable parameters of the schedule are:

- Period duration. The number of days that an employee should work to receive his salary (e.g. a week)
- Number of periods. The number of periods an employee is supposed to work for (e.g. 12 weeks)
- Salary token address. The token used to pay salaries
  - Can only be an address of any ERC20 token. No ether allowed!
- Salary amount for each period. The number of values here should be the same as the number of periods. If an entrepreneur wishes to give an equal salary each period then he should explicitly provide the same amount for every period. If he wishes to pay different (increasing, decreasing, custom) amount each period, then he should explicitly provide a desired amount for each period.
  - Calculation of amount for each period is supposed to be handled by the frontend for a better user experience.

It's important to notice, that the entrepreneur _does not transfer_ tokens right after adding a new salary schedule for the employee. He _allows_ the `Salary` contract to transfer his tokens to the employees when they ask for it.
As well as adding a new salary schedule, an entrepreneur can **remove a schedule**. If he decides to do that when the employee has not claimed his salary, then the employee _automatically receives_ the pending amount of salary tokens for the number of days he was working (even if it happens in the middle of the salary period).
Each employee can have _multiple salary schedules with different parameters_ simultaneously.
There can be an employee with no schedules at all. He will not be able to claim any salaries.
An entrepreneur is also able to **remove an employee** (fire him). If he decides to do that when the employee has not claimed his salary, then the employee _automatically receives_ the pending amount of salary tokens for the number of days he was working (even if it happens in the middle of the salary period). That is, an entrepreneur can not fire an employee at the very end of the period and leave him with no salary paid at all.
_An entrepreneur can remove (fire) an employee only if the employee has received (manually or automatically) all salaries appointed to him in the current project by all salary schedules for all days of work_

An entrepreneur can **add** or **remove** periods from an employee's schedule. The method for adding periods is passed the chart ID and the amount of salary for each period that we want to add. _Periods are added to the end of the selected chart._
Deletion of periods occurs in the same way from the end of the worker's schedule. As parameters, the ID and the number of periods that we want to delete are passed.

**Employee side**
Employee should **claim** salaries himself. He can do that whenever he wants (assuming that he has pending salaries). Notice, that he claims _all pending salaries_. So if he did not claim the salary for 3 months and does that on the 4-th month then he would receive the total sum of tokens for all 4 months at once. He _can not_ claim salary in parts. An employee is free to _never_ claim his salaries at all as well. If an employee regularly claims his salary (at the end of each period), then he is forbidden to claim the salary _during the period_. Only 3 cases may lead to an employee receiving salary during N-th period:

- Entrepreneur fires him
- Entrepreneur removes his salary
- Employee has not claimed his salary for previous period(-s) and claims it during the current one

As it was stated above, an entrepreneur allows the `Salary` contract to transfer tokens to employees when necessary. But if he allows to transfer E tokens from his balance to pay a salary and _then decreases_ the allowance to E (E < S) - an employee _will not be able_ to claim the salary he was expecting to receive. He will also fail to claim his salary if an entrepreneur _does not have enough tokens_ (i.e. less then the total amount of tokens in salary schedule). So it is up to an entrepreneur to make sure that he owns enough tokens to pay his employees accoding to schedules.
