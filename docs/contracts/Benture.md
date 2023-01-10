# Benture



> Dividends distributing contract





## Methods

### announceDividends

```solidity
function announceDividends(address origToken, address distToken, uint256 amount, uint256 dueDate, bool isEqual) external payable
```

Allows admin to annouce the next distribution of dividends

*Announcement does not guarantee that dividends will be distributed. It just shows      that the admin is willing to do that*

#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | The tokens to the holders of which the dividends will be paid |
| distToken | address | The token that will be paid        Use zero address for native tokens |
| amount | uint256 | The amount of ERC20 tokens that will be paid |
| dueDate | uint256 | The number of seconds in which the dividends will be paid        *after the announcement*         Use `0` to announce an immediate distribution |
| isEqual | bool | Indicates whether distribution will be equal |

### checkAnnounced

```solidity
function checkAnnounced(uint256 id, address admin) external view returns (bool)
```

Checks if the distribution with the given ID was announced by the given admin



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution to check |
| admin | address | The address of the admin to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if admin has announced the distribution with the given ID. Otherwise - false. |

### getDistribution

```solidity
function getDistribution(uint256 id) external view returns (uint256, address, address, uint256, uint256, bool, enum IBenture.DistStatus)
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
| _4 | uint256 | undefined |
| _5 | bool | undefined |
| _6 | enum IBenture.DistStatus | undefined |

### getDistributions

```solidity
function getDistributions(address admin) external view returns (uint256[])
```

Returns the list of IDs of all distributions the admin has ever announced



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin | address | The address of the admin |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | The list of IDs of all distributions the admin has ever announced |

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

### getPools

```solidity
function getPools() external view returns (address[])
```

Returns the list of existing pools of tokens.         WARNING: might exceed block gas limit




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | The list of addresses of pool tokens |

### lockTokens

```solidity
function lockTokens(uint256 id, uint256 amount) external payable
```

Locks user&#39;s tokens in order for him to receive dividends later



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution to lock tokens for |
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



## Events

### DividendsAnnounced

```solidity
event DividendsAnnounced(address indexed origToken, address indexed distToken, uint256 indexed amount, uint256 dueDate, bool isEqual)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken `indexed` | address | undefined |
| distToken `indexed` | address | undefined |
| amount `indexed` | uint256 | undefined |
| dueDate  | uint256 | undefined |
| isEqual  | bool | undefined |

### DividendsFulfilled

```solidity
event DividendsFulfilled(uint256 indexed id)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



