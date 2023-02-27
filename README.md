# Benture Smart-Contracts

The Benture is an investing marketplace, connecting entrepreneurs with investors. The Benture combines the token creation and management, launchpad and DEX features, providing entrepreneurs a single solution that makes it simple, quick and cost effective to find and interact with investors and shareholders.

#### Table on contents

[Prereqiusites](#preqs)  
[Build](#build)  
[Test](#test)  
[Run scripts](#run)  
[Deploy](#deploy)  
[Networks](#networks)  
[Wallets](#wallets)  
[Smart Contract Logic](#logic)  
[-- BentureProducedToken](#token)  
[-- BentureFactory](#factory)  
[-- BentureAdmin](#admin)  
[-- Benture](#benture)  
[-- BentureSalary](#salary)  
[Smart Contracts Upgradeability](#proxy)  
[Structure of Deploy Output File](#output)  
[[Known Issues]](#issues)  

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
  POLYGONSCAN_API_KEY=<your polygonscan API key>
  ```
- Copy your wallet's private key (see [Wallets](#wallets)) to `.env` file

  ```
  ACC_PRIVATE_KEY=<your private key>
  ```

  :warning:**DO NOT SHARE YOUR .env FILE IN ANY WAY OR YOU RISK TO LOSE ALL YOUR FUNDS**:warning:


<a name="build"/>

### Build

```
npx hardhat compile
```

<a name="test"/>

### Test

```
npx hardhat test
```

<a name="run"/>

### Run Scripts

```
npx hardhat run <script file name here> --network <network name here>
```

<a name="deploy"/>

### Deploy

```
npx hardhat run scripts/deploy.js --network <network name here>
```

Deployment script takes about 5 minutes to complete. Please, be patient!
After the contracts get deployed you can find their _addresses_ and code verification _URLs_ in the `scripts/deployOutput.json` file (see [Structure of Deploy Output File](#output)).  
Note that this file only refreshes the addresses of contracts that have been successfully deployed (or redeployed). If you deploy only a single contract then its address would get updated and all other addresses would remain untouched and would link to _old_ contracts.  
Please, **do not** write anything to `deployOutput.json` file yourself! It is a read-only file.  
All deployed contracts *are verified* on [Polygonscan](https://mumbai.polygonscan.com/).

<a name="networks"/>

### Networks

а) **Polygon test** network
Make sure you have _enough test MATIC tokens_ for testnet.

```
<hardhat command here> --network polygon_testnet
```

b) **Polygon main** network
Make sure you have _enough real MATIC tokens_ in your wallet. Deployment to the mainnet costs money!

```
<hardhat command here> --network polygon_mainnet
```

c) **Hardhat** network

- Run Hardhat node locally. All _deploy scripts_ will be executed as well:

```
npx hardhat node
```

- Run sripts on the node

```
npx hardhat run <script name here> --network localhost
```

<a name="wallets"/>

### Wallets

For deployment of contracts and interactions with contracts you will need to use either _your existing wallet_ or _a generated one_.

#### Using an existing wallet

If you choose to use your existing wallet, then you would need to be able to export (copy/paste) its private key. For example, you can export private key from your MetaMask wallet.  
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

### Smart Contract Logic

---

**For more details see `docs/` directory**

---

**Roles**:

- entrepreneur (admin): creates and controls ERC20 tokens, pays dividends
- investor (user): buys ERC20 tokens, receives dividends

<a name="token"/>

#### BentureProducedToken.sol

This is an [ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20) token that is created by the entrepreneur.
It can be:

- minted (if mintability is activated)
- transferred between addresses
- burnt by the owner of tokens

<a name="factory"/>

#### BentureFactory.sol

This is a factory contract that is used by the entrepreneur to create new [BentureProducedTokens](#token).
The entrepreneur can provide all necessary token parameters to the factory and it will deploy a new contract of [BentureProducedToken](#token) token with these parameters. This token is meant to be sold on the marketplace and bought by investors.  
Moreover, with each new created [BentureProducedToken](#token) contract the factory mints an admin [BentureAdmin](#admin) token to the entrepreneur who created the token **and** creates a [pool](#pool) of these tokens.  

<a name="admin"/>

#### BentureAdmin.sol

This is an [ERC721](https://docs.openzeppelin.com/contracts/4.x/erc721) token that is minted to the creator of each new [BentureProducedToken](#token). This token proves the ownership of created [BentureProducedToken](#token) and gives admin rights i.e. allows the BentureAdmin holder to mint new [BentureProducedTokens](#token).
It can be:

- minted
- transferred between addresses
- burnt by the owner

It is important to mention that BentureAdmin token proves the ownership of [BentureProducedToken](#token) _contract in general, and not of every minted token_. So if Bob owns 1000 [BentureProducedTokens](#token), an entrepreneur owning the BentureAdmin token of that [BentureProducedToken](#token) will not be able to transfer or burn Bob's tokens. The _only thing_ he can do is _mint_ more [BentureProducedTokens](#token) (that will not be owned by anyone at first).  

Let's assume that Alice created a new ABC token using [BentureFactory](#factory) contract. She now owns the ABC token contract which is confirmed with her also holding a BentureAdmin token connected to the ABC token.  

- If Alice transfers her BentureAdmin token to Bob, then Bob becomes the owner of ABC token and gets owner rights and Alice looses her owner rights
- If Alice burns her BentureAdmin token, then ABC token is left without an owner forever. That means that all holders of ABC tokens will still be able to transfer, burn, sell their tokens, but no new tokens will ever be minted
- If all holders of ABC tokens burn their tokens, Alice still remains the owner. She still can mint new ABC tokens

<a name="benture"/>

#### Benture.sol

This is a dividend-distributing contract. Dividends are distributed among [BentureProducedTokens](#token) [lockers](#locker) (or among any users in case of [custom](#custom) distribution) .

_Entities_
<a name="member"/>
- _Member_. A member of a project. A user who has bought any number of project tokens.  
  <a name="pool"/>
- _Pool_. A storage where members can lock their tokens.
  <a name="distribution"/>
- _Distribution_. A single distribution of dividend tokens initialized by the entrepreneur and targeting some number of users.
  <a name="locker"/>
- _Locker_. A member who has locked any number of his tokens inside the pool.

_Types of dividends_:

1. Dividends can be payed in one of **3** ways:  
   1.1 _Equal_. Each locker receives an equal amount of dividends.  
   1.2 _Weighted_. Each locker receives an amount of dividends proportional to the amount of tokens he has locked. <a name="custom"/>  
   1.3 _Custom_. The entrepreneur provides list of users and amounts of tokens they are supposed to receive. Each user from the list then receives an amount of dividend tokens intended for him. It is _not_ necessary that users should be lockers in this case.  

   _NOTE_:  
  - Equal and Weighted distributions have unique numbers (IDs) whereas custom distributions do not.  


2. Dividends can be payed in one of two kinds of tokens:  
   2.1 _ERC20 tokens_  
   2.2 _Native tokens_  

**Entrepreneur side**

The main role of the entrepreneur in this contract is to initialize distributions.

_**Normal dividends**_ (Equal & Weighted)

Imagine that Alice is an admin of some project. She knows that many other users have bought and locked tokens of the project. She decides to reward them with some amount of tokens. Alice initializes _equal_ or _weighted_ distribution. She provides:

- The address of token to which lockers she would like to transfer dividends
- The address of the token in which the dividends should be paid ([zero address](https://etherscan.io/address/0x0000000000000000000000000000000000000000) for native tokens)
- The amount of tokens to transfer
- The type of distribution

After that, the provided amount of tokens is transferred from Alice's balance to the contract's balance and **is stored there** until lockers [claim](#claim) their dividends.

_NOTE_:  
- Before starting the distribution with an _N_ amount of ERC20 tokens, Alice must approve a transfer of at least _N_ tokens to the `Benture` contract.  

_**Custom dividends**_

This type of dividends is a bulk tokens distribution. It has no connection with projects and pools. Designed to transfer tokens to a list of receivers. Can be initialized by _any user_.

A user should provide:

- The address of the token in which the dividends should be paid ([zero address](https://etherscan.io/address/0x0000000000000000000000000000000000000000) for native tokens)
- The list of addresses of users (receivers)
- The list of amounts of tokens (one per receiver, may be _different_ for different receivers)

After that, the provided amount of tokens is distributed (**actually transferred**) among users. Each one receives the corresponding amount from the amounts list.

_NOTE_:    
- Before starting the distribution with an _N_ amount of ERC20 tokens, Alice must approve a transfer of at least _N_ tokens to the `Benture` contract   
- The users and amounts lists may be of arbitrary length. The bigger they are, the higher the chance of custom dividends transaction failing because of `out of gas` EVM error. That is why a special gas check was added into the contract. **If more than 2/3 of block gas limit was spent, the distribution stops**. That means _some part_ of users will receive their shares, whereas others will not. The transaction _does not revert_!    
- **Admin pays for gas**    

**Employee side**

Employees (members) can _lock_ tokens and _claim dividends_.

_**Normal distributions**_ (Equal & Weighted)

In order to be able to receive dividends, a member should become a _locker_. To become one, a member needs to lock project tokens inside the pool of the project. After a distribution was initialized, a locker can claim his dividends shares.  

_Locking tokens_

- _Locking portion of tokens_. A user can lock an arbitrary amount of tokens. The amount must be greater than 1 and less than or equal to user's balance.  
- _Locking all tokens_. A user can lock his total balance of tokens.  

_Unlocking tokens_

- _Unlocking portion of tokens_. A user can unlock an arbitrary amount of tokens. The amount must be greater than 1 and less or equal to the amount of tokens he has locked  
- _Unlocking all tokens_. A user can unlock all tokens he has previously locked  

_NOTE_:  
- **Unlock of any amount of tokens triggers claim of all distributions a user has participated in**  

<a name="claim"/>

*Claiming normal dividends*
- *Claiming a single dividend*. As it was stated above, all normal distributions have a unique ID. A locker can claim dividend of a distribution with a specific ID. For that he needs to know the ID.
- *Claiming multiple dividends*. A locker can claim dividends of multiple distributions. For that he needs to know IDs of all these distributions. IDs can be provided in any order.

_NOTE_:  
- Locker's share is calculated _when he claims it_.  
- In case of claiming multiple dividends, the list of IDs may be of arbitrary length. The bigger it is, the higher the chance of claim transaction failing because of `out of gas` EVM error. That is why a special gas check was addes into the contract. **If more than 2/3 of block gas limit was spent, the claim stops**. That means, _some part_ of dividends from the list will be claimed, whereas others will not. The transaction _does not revert_!    
- **Locker pays for gas**    

_**Custom distributions**_

To take part in custom dividends distribution the user does not need to do anything. It's up to admin to include or not include user into the receivers list. If he gets included in the list, he then receives his share immediately. No claim process required.  

<a name="salary"/>

#### BentureSalary.sol

After creating a project (i.e. [BentureProducedToken](#token)) an entrepreneur can hire employees to work on the project. This contract allows an entrepreneur to pay salaries to the employees for their services.  

**Entrepreneur side**  

An entrepreneur (admin of the project) can **add** a new employee to the list of all employees. He can use only the address of the employee or give him a nickname. After that, an admin can set an **individual schedule** of salary payments for the employee. Configurable parameters of the schedule are:

- Period duration. The number of days that an employee should work to receive his salary (e.g. a week)
- Number of periods. The number of periods an employee is supposed to work for (e.g. 12 weeks)
- Salary token address. The token used to pay salaries
  - Can only be an address of any ERC20 token. **Native tokens are not supported**!
- Salary amount for each period. The number of values here should be the same as the number of periods. If an entrepreneur wishes to give an equal salary each period then he should explicitly provide the same amount for every period. If he wishes to pay different (increasing, decreasing, custom) amount each period, then he should explicitly provide a desired amount for each period.  
  - Calculation of amount for each period may be made off-chain.  

It's important to notice, that the entrepreneur _does not transfer_ tokens right after adding a new salary schedule for the employee. He _allows_ the `BentureSalary` contract to transfer his tokens to the employees when they ask for it.  
As well as adding a new salary schedule, an entrepreneur can **remove a schedule**. If he decides to do that when the employee has not claimed his salary, then the employee _automatically receives_ the pending amount of salary tokens for the number of days he has been working for (even if it happens in the middle of the salary period).  
Each employee can have _multiple salary schedules with different parameters_ simultaneously.  
There can be an employee with no schedules at all. He will not be able to claim any salaries.    
An entrepreneur is also able to **remove an employee** (fire him). If he decides to do that when the employee has not claimed his salary, then the employee _automatically receives_ the pending amount of salary tokens for the number of days he was working (even if it happens in the middle of the salary period). That is, an entrepreneur can not fire an employee at the very end of the period and leave him with no salary paid at all.
_An entrepreneur can remove (fire) an employee only if the employee has received (manually or automatically) all salaries appointed to him in the current project by all salary schedules for all days of work_.    
An entrepreneur can **add** or **remove** periods from an employee's schedule. Periods are added or removed from the end of the schedule.  

**Employee side**  

Employee should **claim** salaries himself. He can do that whenever he wants (assuming that he has pending salaries). Notice, that he claims _all pending salaries_. So if he did not claim the salary for 3 months and does that on the 4th month then he would receive the total sum of tokens for all 4 months at once. He _can not_ claim salary in parts. An employee is free to _never_ claim his salaries at all as well. Only 3 cases may lead to an employee receiving salary during N-th period:  

- Entrepreneur fires him
- Entrepreneur removes his salary
- Employee has not claimed his salary for previous period(-s) and claims it during the current one

As it was stated above, an entrepreneur allows the `Salary` contract to transfer tokens to employees when necessary. But if he allows to transfer S tokens from his balance to pay a salary and _then decreases_ the allowance to E (E < S) - an employee _will not be able_ to claim the salary he was expecting to receive (S). He will also fail to claim his salary if an entrepreneur _does not have enough tokens_ (i.e. less then the total amount of tokens in salary schedule). So it is up to an entrepreneur to make sure that he owns enough tokens to pay his employees accoding to schedules.  

<a name="proxy"/>

#### Smart Contracts Upgradeability

The source code of upgradeable contracts can be updated *without* the need to redeploy the contracts afterwards. The state of contracts (values in storage) remains the same. This allows to add new features to the contracts and fix existing bugs/vulnerabilities.

It's *highly recommended* to study the following materials for detailed explanation of contracts upgradeability:
1. [What is Proxy](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies)
2. [Difference Between Transparent and UUPS Proxy](https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent-vs-uups)
3. [How to Write Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)
4. [How to Deploy and Upgrade Contracts Using Hardhat](https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades)
5. [Constuctor Allowing to Create Upgradeable Contracts](https://wizard.openzeppelin.com/#custom)

#### Using Scripts with Upgradeable Contracts
**Deploy**  
In order to deploy contracts follow instructions in [Deploy](#deploy) section. The `scripts/deploy.js` script supports upgradeable contracts.

**Upgrade**  
In order to upgrade contracts follow the steps:
1. Create new versions of your contracts. Add `V2`, `V3`, etc. to the end of each new version of each contract. You might have several versions of the same contract in one directory at the same time or you can store them in separate directories
2. Open `scripts/upgrade.js` file
3. Change the `oldContractNames` list if you need. This list represents contracts that you *wish to upgrade*
    Example:
```
let oldContractNames = [
  "Benture",
  "BentureAdmin",
  "BentureFactory",
  "BentureSalary",
];
```

4. Change the `newContractNames` list if you need. This list represents new implementations of upgraded contracts. "New implementation" is any contract that *is upgrade-compatible* with the previous implementation and *has a different bytecode*.
    Example:
```
let newContractNames = [
  "BentureV2",
  "BentureAdminV2",
  "BentureFactoryV2",
  "BentureSalaryV2",
];
```

  _NOTE_:  
  - Each of the contracts from the both lists must be present in the project directory  
  - Length of both lists must be the same  
  - Each contract from `oldContractNames` must have already been deployed in mainnet/testnet  
  - Order of contracts in the lists must be the same  

5. Run the upgrade script  
```
npx hardhat run scripts/upgrade.js --network <network name here>
```
When running, this script will output logs into the console. If you see any error messages in the logs with the script *still running* - ignore them. They might later be used for debug purposes.    
If Hardhat Upgrades plugin finds your contracts *upgrade-incompatible* it will generate an error that will stop script execution. Is this case you have to follow the [How to Write Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable) guide.    
After this script completes, the `implementationAddress` and `implementationVerification` fields of contracts from the `oldContractNames` will be changed inside the `scripts/deployOutput.json` file. This will indicate that contracts upgrade was finished successfully.    
Even after the upgrade, you should *use only `proxyAddress` or `proxyVerification` fields of the deploy output file to interact with contracts*.    

Following contracts are upgradeable:  
[- BentureFactory](#factory)    
[- BentureAdmin](#admin)    
[- Benture](#benture)    
[- BentureSalary](#salary)    

Following contracts are *not* upgradeable:  
[- BentureProducedToken](#token)    

<a name="output"/>

### Structure of Deploy Output File

This file contains the result of contracts deployment.

It is separated in 2 parts. Each of them represents deployment to testnet or mainnet.  
Each part contains information about all deployed contracts:  
- The address of the proxy contract (`proxyAddress`) (see [Smart Contracts Upgradeability](#proxy))    
- The address of the implementation contract that is under control of the proxy contract (`implementationAddress`)    
- The URL for Polygonscan page with verified code of the proxy contract (`proxyVerification`)    
- The URL for Polygonscan page with verified code of the implementation contract (`implementationVerification`)    

**Use only `proxyAddress` or `proxyVerification` fields to interact with contracts**.  

---

<a name="issues"/>

**[Known Issues]**

_Tests Coverage_

`distributeDividendsCustom` and `claimMultipleDividends` functions of `Benture` contract contain checks for amount of gas spent. Tests for these functions pass successfully using `npx hardhat test`, **but they fail** using `npx hardhat coverage`. The reason is that while checking for coverage percentage, contracts are deployed and executed on a special `coverage` network (_not hardhat node_) where gas costs are much higher than in hardhat network. For example, if `claimMultipleDividends([1, 2, 3, 4 ... 50])` costs 200k gas on hardhat network and block gas limit is 500k, it executes as expected (all dividends are claimed) and `expect` statement (which expects all the dividens to be claimed) in the tests also passes successfully. But the same function may cost 700k gas on `coverage` network with the same block gas limit. Therefor, _only some part_ of dividends will be claimed and `expect` statement (which expects all the dividens to be claimed) _fails_. And so does the whole test-case.  
For this reason, coverage report displays **incorrect** results. It may display that `claimMultipleDividends` function was not covered with tests (because _they failed_), whereas in fact it was covered with tests.
To sum up: coverage percentage of `Benture` contract is incorrect and can not be corrected.  
