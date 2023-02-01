# Benture



> Dividends distributing contract





## Methods

### checkStartedByAdmin

```solidity
function checkStartedByAdmin(uint256 id, address admin) external view returns (bool)
```

Checks if the distribution with the given ID was started by the given admin



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution to check |
| admin | address | The address of the admin to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if admin has started the distribution with the given ID. Otherwise - false. |

### claimDividends

```solidity
function claimDividends(uint256 id) external nonpayable
```

Allows a user to claim dividends from a single distribution



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution to claim |

### claimMultipleDividends

```solidity
function claimMultipleDividends(uint256[] ids) external nonpayable
```

Allows user to claim dividends from multiple distributions         WARNING: Potentially can exceed block gas limit!



#### Parameters

| Name | Type | Description |
|---|---|---|
| ids | uint256[] | The array of IDs of distributions to claim |

### claimMultipleDividendsAndUnlock

```solidity
function claimMultipleDividendsAndUnlock(uint256[] ids, address tokenToWithdraw) external nonpayable
```

Allows user to claim dividends from multiple distributions         and unlock his tokens after that         WARNING: Potentially can exceed block gas limit!



#### Parameters

| Name | Type | Description |
|---|---|---|
| ids | uint256[] | The array of IDs of distributions to claim |
| tokenToWithdraw | address | Token to unlock |

### createPool

```solidity
function createPool(address token) external nonpayable
```

Creates a new pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | The token that will be locked in the pool |

### distributeDividends

```solidity
function distributeDividends(address origToken, address distToken, uint256 amount, bool isEqual) external payable
```

Allows admin to distribute dividends among lockers



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | The tokens to the holders of which the dividends will be paid |
| distToken | address | The token that will be paid        Use zero address for native tokens |
| amount | uint256 | The amount of ERC20 tokens that will be paid |
| isEqual | bool | Indicates whether distribution will be equal |

### factory

```solidity
function factory() external view returns (address)
```

Address of the factory used for projects creation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### getCurrentLock

```solidity
function getCurrentLock(address token, address user) external view returns (uint256)
```

Returns the current lock amount of the user



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | The address of the token of the pool |
| user | address | The address of the user to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The current lock amount |

### getDistribution

```solidity
function getDistribution(uint256 id) external view returns (uint256, address, address, uint256, bool)
```

Returns the distribution with the given ID



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution to search for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | All information about the distribution |
| _1 | address | undefined |
| _2 | address | undefined |
| _3 | uint256 | undefined |
| _4 | bool | undefined |

### getDistributions

```solidity
function getDistributions(address admin) external view returns (uint256[])
```

Returns the list of IDs of all distributions the admin has ever started



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin | address | The address of the admin |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | The list of IDs of all distributions the admin has ever started |

### getLockers

```solidity
function getLockers(address token) external view returns (address[])
```

Returns the array of lockers of the pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | The address of the token of the pool |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | The array of lockers of the pool |

### getPool

```solidity
function getPool(address token) external view returns (address, uint256, uint256)
```

Returns info about the pool of a given token



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | The address of the token of the pool |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | The address of the tokens in the pool. |
| _1 | uint256 | The number of users who locked their tokens in the pool |
| _2 | uint256 | The amount of locked tokens |

### hasClaimed

```solidity
function hasClaimed(uint256 id, address user) external view returns (bool)
```

Checks if user has claimed dividends of the provided distribution



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution to check |
| user | address | The address of the user to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if user has claimed dividends. Otherwise - false |

### isLocker

```solidity
function isLocker(address token, address user) external view returns (bool)
```

Checks if user is a locker of the provided token pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | The address of the token of the pool |
| user | address | The address of the user to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if user is a locker in the pool. Otherwise - false. |

### lockAllTokens

```solidity
function lockAllTokens(address origToken) external nonpayable
```

Locks all user&#39;s tokens in the pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | The address of the token to lock |

### lockTokens

```solidity
function lockTokens(address origToken, uint256 amount) external nonpayable
```

Locks the provided amount of user&#39;s tokens in the pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | The address of the token to lock |
| amount | uint256 | The amount of tokens to lock |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### unlockAllTokens

```solidity
function unlockAllTokens(address origToken) external nonpayable
```

Unlocks all locked tokens of the user in the pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | The address of the token to unlock |

### unlockTokens

```solidity
function unlockTokens(address origToken, uint256 amount) external nonpayable
```

Unlocks the provided amount of user&#39;s tokens from the pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | The address of the token to unlock |
| amount | uint256 | The amount of tokens to unlock |



## Events

### DividendsClaimed

```solidity
event DividendsClaimed(uint256 indexed id, address user)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| user  | address | undefined |

### DividendsStarted

```solidity
event DividendsStarted(address indexed origToken, address indexed distToken, uint256 indexed amount, bool isEqual)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken `indexed` | address | undefined |
| distToken `indexed` | address | undefined |
| amount `indexed` | uint256 | undefined |
| isEqual  | bool | undefined |

### MultipleDividendsClaimed

```solidity
event MultipleDividendsClaimed(uint256[] ids, address user)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| ids  | uint256[] | undefined |
| user  | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### PoolCreated

```solidity
event PoolCreated(address indexed token)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |

### PoolDeleted

```solidity
event PoolDeleted(address indexed token)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |

### TokensLocked

```solidity
event TokensLocked(address indexed user, address indexed token, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### TokensUnlocked

```solidity
event TokensUnlocked(address indexed user, address indexed token, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |



## Errors

### AdminCanNotHaveAZeroAddress

```solidity
error AdminCanNotHaveAZeroAddress()
```






### AlreadyClaimed

```solidity
error AlreadyClaimed()
```






### CallerNotAdminOrFactory

```solidity
error CallerNotAdminOrFactory()
```






### CanNotLockZeroAddressTokens

```solidity
error CanNotLockZeroAddressTokens()
```






### CanNotUnlockZeroAddressTokens

```solidity
error CanNotUnlockZeroAddressTokens()
```






### CanNotWorkWithZeroAddressTokens

```solidity
error CanNotWorkWithZeroAddressTokens()
```






### DistriburionNotContainTokenToWithdraw

```solidity
error DistriburionNotContainTokenToWithdraw()
```






### DistributionHasNotStartedYet

```solidity
error DistributionHasNotStartedYet()
```






### DistributionWithTheGivenIDHasNotBeenAnnoucedYet

```solidity
error DistributionWithTheGivenIDHasNotBeenAnnoucedYet()
```






### DividendsAmountCanNotBeZero

```solidity
error DividendsAmountCanNotBeZero()
```






### IDOfDistributionMustBeGreaterThanOne

```solidity
error IDOfDistributionMustBeGreaterThanOne()
```






### InvalidLockAmount

```solidity
error InvalidLockAmount()
```






### InvalidUnlockAmount

```solidity
error InvalidUnlockAmount()
```






### NativeTokenDividendsTransferFailed

```solidity
error NativeTokenDividendsTransferFailed()
```






### NotEnoughNativeTokensWereProvided

```solidity
error NotEnoughNativeTokensWereProvided()
```






### OriginalTokenCanNotHaveAZeroAddress

```solidity
error OriginalTokenCanNotHaveAZeroAddress()
```






### PoolAlreadyExists

```solidity
error PoolAlreadyExists()
```






### PoolDoesNotExist

```solidity
error PoolDoesNotExist()
```






### PoolsCanNotHoldZeroAddressTokens

```solidity
error PoolsCanNotHoldZeroAddressTokens()
```






### UserCanNotHaveZeroAddress

```solidity
error UserCanNotHaveZeroAddress()
```






### UserDoesNotHaveAnAdminToken

```solidity
error UserDoesNotHaveAnAdminToken()
```






### UserDoesNotHaveAnyLockedTokens

```solidity
error UserDoesNotHaveAnyLockedTokens()
```






### UserDoesNotHaveProjectTokens

```solidity
error UserDoesNotHaveProjectTokens()
```






### UserHasNoLockedTokens

```solidity
error UserHasNoLockedTokens()
```






### WithdrawAmountIsTooBig

```solidity
error WithdrawAmountIsTooBig()
```






### WrongTokenInsideThePool

```solidity
error WrongTokenInsideThePool()
```







