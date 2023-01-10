# IBenture







*An interface for dividends distributing contract*

## Methods

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

Returns the list of IDs of all active distributions the admin has announced



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin | address | The address of the admin |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | The list of IDs of all active distributions the admin has announced |

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

### DividendsFulfilled

```solidity
event DividendsFulfilled(uint256 indexed id)
```



*Indicates that dividends distribution was fulfilled*

#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | The ID of the fulfilled distribution |



