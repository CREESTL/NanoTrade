# Benture



> Dividends distributing contract





## Methods

### checkStartedByAdmin

```solidity
function checkStartedByAdmin(uint256 id, address admin) external view returns (bool)
```

See {IBenture-checkStartedByAdmin}



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |
| admin | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### claimDividends

```solidity
function claimDividends(uint256 id) external nonpayable
```

See {IBenture-claimDividends}



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |

### claimMultipleDividends

```solidity
function claimMultipleDividends(uint256[] ids) external nonpayable
```

See {IBenture-claimMultipleDividends}



#### Parameters

| Name | Type | Description |
|---|---|---|
| ids | uint256[] | undefined |

### createPool

```solidity
function createPool(address token) external nonpayable
```

See {IBenture-createPool}



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

### distributeDividends

```solidity
function distributeDividends(address origToken, address distToken, uint256 amount, bool isEqual) external payable
```

See {IBenture-distributeDividends}



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | undefined |
| distToken | address | undefined |
| amount | uint256 | undefined |
| isEqual | bool | undefined |

### distributeDividendsCustom

```solidity
function distributeDividendsCustom(address token, address[] users, uint256[] amounts) external payable
```

See {IBenture-distributeDividendsCustom}



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| users | address[] | undefined |
| amounts | uint256[] | undefined |

### factory

```solidity
function factory() external view returns (address)
```

Address of the factory used for projects creation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### getClaimedAmount

```solidity
function getClaimedAmount(uint256 id, address user) external view returns (uint256)
```

See {IBenture-getClaimedAmount}



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getCurrentLock

```solidity
function getCurrentLock(address token, address user) external view returns (uint256)
```

See {IBenture-getCurrentLock}



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getDistribution

```solidity
function getDistribution(uint256 id) external view returns (uint256, address, address, uint256, bool, uint256, uint256)
```

See {IBenture-getDistribution}



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | address | undefined |
| _2 | address | undefined |
| _3 | uint256 | undefined |
| _4 | bool | undefined |
| _5 | uint256 | undefined |
| _6 | uint256 | undefined |

### getDistributions

```solidity
function getDistributions(address admin) external view returns (uint256[])
```

See {IBenture-getDistributions}



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined |

### getLockChangesId

```solidity
function getLockChangesId(address token, address user) external view returns (uint256[])
```

See {IBenture-getLockChangesId}



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined |

### getLockers

```solidity
function getLockers(address token) external view returns (address[])
```

See {IBenture-getLockers}



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |

### getMyShare

```solidity
function getMyShare(uint256 id) external view returns (uint256)
```

See {IBenture-getMyShare}



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getPool

```solidity
function getPool(address token) external view returns (address, uint256, uint256)
```

See {IBenture-getPool}



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |
| _2 | uint256 | undefined |

### hasClaimed

```solidity
function hasClaimed(uint256 id, address user) external view returns (bool)
```

See {IBenture-hasClaimed}



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined |
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### initialize

```solidity
function initialize() external nonpayable
```

Initialize all parent contracts




### isLocker

```solidity
function isLocker(address token, address user) external view returns (bool)
```

See {IBenture-isLocker}



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### lockAllTokens

```solidity
function lockAllTokens(address origToken) external nonpayable
```

See {IBenture-lockAllTokens}



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | undefined |

### lockTokens

```solidity
function lockTokens(address origToken, uint256 amount) external nonpayable
```

See {IBenture-lockTokens}



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | undefined |
| amount | uint256 | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### proxiableUUID

```solidity
function proxiableUUID() external view returns (bytes32)
```



*Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate the implementation&#39;s compatibility when performing an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setFactoryAddress

```solidity
function setFactoryAddress(address factoryAddress) external nonpayable
```

See {IBenture-setFactoryAddress}



#### Parameters

| Name | Type | Description |
|---|---|---|
| factoryAddress | address | undefined |

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

See {IBenture-unlockAllTokens}



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | undefined |

### unlockTokens

```solidity
function unlockTokens(address origToken, uint256 amount) external nonpayable
```

See {IBenture-unlockTokens}



#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | undefined |
| amount | uint256 | undefined |

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external nonpayable
```



*Upgrade the implementation of the proxy to `newImplementation`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newImplementation | address | undefined |

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable
```



*Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call encoded in `data`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newImplementation | address | undefined |
| data | bytes | undefined |



## Events

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousAdmin  | address | undefined |
| newAdmin  | address | undefined |

### BeaconUpgraded

```solidity
event BeaconUpgraded(address indexed beacon)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beacon `indexed` | address | undefined |

### CustomDividendsDistributed

```solidity
event CustomDividendsDistributed(uint256 id, address token, uint256 count)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| token  | address | undefined |
| count  | uint256 | undefined |

### DividendsClaimed

```solidity
event DividendsClaimed(uint256 id, address user, uint256 share)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| user  | address | undefined |
| share  | uint256 | undefined |

### DividendsStarted

```solidity
event DividendsStarted(uint256 id, address origToken, address distToken, uint256 amount, bool isEqual)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| origToken  | address | undefined |
| distToken  | address | undefined |
| amount  | uint256 | undefined |
| isEqual  | bool | undefined |

### GasLimitReached

```solidity
event GasLimitReached(uint256 gasLeft, uint256 gasLimit)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| gasLeft  | uint256 | undefined |
| gasLimit  | uint256 | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### MultipleDividendsClaimed

```solidity
event MultipleDividendsClaimed(uint256[] ids, address user, uint256 count)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| ids  | uint256[] | undefined |
| user  | address | undefined |
| count  | uint256 | undefined |

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
event PoolCreated(address token)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token  | address | undefined |

### PoolDeleted

```solidity
event PoolDeleted(address token)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token  | address | undefined |

### TokensLocked

```solidity
event TokensLocked(uint256 id, address user, address token, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| user  | address | undefined |
| token  | address | undefined |
| amount  | uint256 | undefined |

### TokensUnlocked

```solidity
event TokensUnlocked(uint256 id, address user, address token, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| user  | address | undefined |
| token  | address | undefined |
| amount  | uint256 | undefined |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



## Errors

### AlreadyClaimed

```solidity
error AlreadyClaimed()
```






### CallerIsNotLocker

```solidity
error CallerIsNotLocker()
```






### CallerNotAdminOrFactory

```solidity
error CallerNotAdminOrFactory()
```






### DistributionHasNotStartedYet

```solidity
error DistributionHasNotStartedYet()
```






### DistributionNotStarted

```solidity
error DistributionNotStarted()
```






### EmptyList

```solidity
error EmptyList()
```






### FactoryAddressNotSet

```solidity
error FactoryAddressNotSet()
```






### InvalidAdminAddress

```solidity
error InvalidAdminAddress()
```






### InvalidDistribution

```solidity
error InvalidDistribution()
```






### InvalidDistributionId

```solidity
error InvalidDistributionId()
```






### InvalidDividendsAmount

```solidity
error InvalidDividendsAmount()
```






### InvalidFactoryAddress

```solidity
error InvalidFactoryAddress()
```






### InvalidLockAmount

```solidity
error InvalidLockAmount()
```






### InvalidTokenAddress

```solidity
error InvalidTokenAddress()
```






### InvalidUnlockAmount

```solidity
error InvalidUnlockAmount()
```






### InvalidUserAddress

```solidity
error InvalidUserAddress()
```






### ListsLengthDiffers

```solidity
error ListsLengthDiffers()
```






### NativeTokenTransferFailed

```solidity
error NativeTokenTransferFailed()
```






### NoLockedTokens

```solidity
error NoLockedTokens()
```






### NoLockersInThePool

```solidity
error NoLockersInThePool()
```






### NotEnoughNativeTokens

```solidity
error NotEnoughNativeTokens()
```






### PoolAlreadyExists

```solidity
error PoolAlreadyExists()
```






### PoolDoesNotExist

```solidity
error PoolDoesNotExist()
```






### UserDoesNotHaveAnAdminToken

```solidity
error UserDoesNotHaveAnAdminToken()
```






### UserDoesNotHaveLockedTokens

```solidity
error UserDoesNotHaveLockedTokens()
```






### UserDoesNotHaveProjectTokens

```solidity
error UserDoesNotHaveProjectTokens()
```






### WithdrawTooBig

```solidity
error WithdrawTooBig()
```






### WrongTokenInsideThePool

```solidity
error WrongTokenInsideThePool()
```







