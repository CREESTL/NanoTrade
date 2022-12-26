# IBenture







*An interface for dividends distributing contract*

## Methods

### announceDividends

```solidity
function announceDividends(address origToken, address distToken, uint256 amount, uint256 dueDate, bool isEqual) external nonpayable
```

Allows admin to annouce the next distribution of dividends

*Announcement does not guarantee that dividends will be distributed. It just shows      that the admin is willing to do that*

#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken | address | The tokens to the holders of which the dividends will be paid |
| distToken | address | The token that will be paid |
| amount | uint256 | The amount of tokens that will be paid |
| dueDate | uint256 | The number of seconds in which the dividends will be paid        *after the announcement* |
| isEqual | bool | Indicates whether distribution will be equal |

### cancelDividends

```solidity
function cancelDividends(uint256 id) external nonpayable
```

Cancels previously announced distribution



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution to cancel |

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

### distributeDividendsEqual

```solidity
function distributeDividendsEqual(uint256 id, address origToken, address distToken, uint256 amount) external payable
```

Distributes one token as dividends for holders of another token _equally _



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution that is being fulfilled |
| origToken | address | The address of the token that is held by receivers        Can not be a zero address!        MUST be an address of a contract - not an address of EOA! |
| distToken | address | The address of the token that is to be distributed as dividends        Zero address for native token (ether, wei) |
| amount | uint256 | The amount of distTokens to be distributed in total        NOTE: If dividends are to payed in ether then `amount` is the amount of wei (NOT ether!) |

### distributeDividendsWeighted

```solidity
function distributeDividendsWeighted(uint256 id, address origToken, address distToken, uint256 weight) external payable
```

Distributes one token as dividends for holders of another token _according to each user&#39;s balance_



#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | The ID of the distribution that is being fulfilled |
| origToken | address | The address of the token that is held by receivers        Can not be a zero address! |
| distToken | address | The address of the token that is to be distributed as dividends        Zero address for native token (ether, wei) |
| weight | uint256 | The amount of origTokens required to get a single distToken        NOTE: If dividends are payed in ether then `weight` is the amount of origTokens required to get a single ether (NOT a single wei!) |

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

Returns the list of IDs of all active distributions the admin has announced



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin | address | The address of the admin |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | The list of IDs of all active distributions the admin has announced |



## Events

### DividendsAnnounced

```solidity
event DividendsAnnounced(address indexed origToken, address indexed distToken, uint256 indexed amount, uint256 dueDate, bool isEqual)
```



*Indicates that new dividends distribution was announced*

#### Parameters

| Name | Type | Description |
|---|---|---|
| origToken `indexed` | address | The tokens to the holders of which the dividends will be paid |
| distToken `indexed` | address | The token that will be paid |
| amount `indexed` | uint256 | The amount of tokens that will be paid |
| dueDate  | uint256 | The number of seconds in which the dividends will be paid        *after the announcement* |
| isEqual  | bool | Indicates whether distribution will be equal |

### DividendsCancelled

```solidity
event DividendsCancelled(uint256 indexed id)
```



*Indicates that dividends distribution was cancelled*

#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | The ID of the cancelled distribution |

### DividendsDistributed

```solidity
event DividendsDistributed(address indexed distToken, uint256 indexed amount)
```



*Indicates that dividends were distributed*

#### Parameters

| Name | Type | Description |
|---|---|---|
| distToken `indexed` | address | The address of dividend token that gets distributed |
| amount `indexed` | uint256 | The amount of distTokens to be distributed in total |

### DividendsFulfilled

```solidity
event DividendsFulfilled(uint256 indexed id)
```



*Indicates that dividends distribution was fulfilled*

#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | The ID of the fulfilled distribution |



