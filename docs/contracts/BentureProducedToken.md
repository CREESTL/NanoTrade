# BentureProducedToken



> An ERC20 project token





## Methods

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```



*See {IERC20-allowance}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| spender | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-approve}. NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on `transferFrom`. This is semantically equivalent to an infinite approval. Requirements: - `spender` cannot be the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```



*See {IERC20-balanceOf}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### burn

```solidity
function burn(uint256 amount) external nonpayable
```

See {IBentureProducedToken-burn}



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### checkAdmin

```solidity
function checkAdmin(address account) external view returns (bool)
```

See {IBentureProducedToken-checkAdmin}



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### decimals

```solidity
function decimals() external view returns (uint8)
```

See {IBentureProducedToken-decimals}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) external nonpayable returns (bool)
```



*Atomically decreases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address. - `spender` must have allowance for the caller of at least `subtractedValue`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| subtractedValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### holders

```solidity
function holders() external view returns (address[])
```

See {IBentureProducedToken-holders}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) external nonpayable returns (bool)
```



*Atomically increases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| addedValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### ipfsUrl

```solidity
function ipfsUrl() external view returns (string)
```

See {IBentureProducedTokne-ipfsUrl}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### isHolder

```solidity
function isHolder(address account) external view returns (bool)
```

See {IBentureProducedToken-isHolder}



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### maxTotalSupply

```solidity
function maxTotalSupply() external view returns (uint256)
```

See {IBentureProducedToken-maxTotalSupply}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### mint

```solidity
function mint(address to, uint256 amount) external nonpayable
```

See {IBentureProducedToken-mint}



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |
| amount | uint256 | undefined |

### mintable

```solidity
function mintable() external view returns (bool)
```

See {IBentureProducedToken-mintable}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### name

```solidity
function name() external view returns (string)
```

See {IBentureProducedToken-name}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### symbol

```solidity
function symbol() external view returns (string)
```

See {IBentureProducedToken-symbol}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```



*See {IERC20-totalSupply}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### transfer

```solidity
function transfer(address to, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-transfer}. Requirements: - `to` cannot be the zero address. - the caller must have a balance of at least `amount`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated allowance. This is not required by the EIP. See the note at the beginning of {ERC20}. NOTE: Does not update the allowance if the current allowance is the maximum `uint256`. Requirements: - `from` and `to` cannot be the zero address. - `from` must have a balance of at least `amount`. - the caller must have allowance for ``from``&#39;s tokens of at least `amount`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



## Events

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| spender `indexed` | address | undefined |
| value  | uint256 | undefined |

### ProjectTokenBurnt

```solidity
event ProjectTokenBurnt(address account, uint256 amount)
```

Indicates that ERC20 of new project were burnt



#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |
| amount  | uint256 | undefined |

### ProjectTokenMinted

```solidity
event ProjectTokenMinted(address account, uint256 amount)
```

Indicates that ERC20 tokens of new prokect were minted



#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |
| amount  | uint256 | undefined |

### ProjectTokenTransferred

```solidity
event ProjectTokenTransferred(address from, address to, uint256 amount)
```

Indicates that a new ERC20 was transferred



#### Parameters

| Name | Type | Description |
|---|---|---|
| from  | address | undefined |
| to  | address | undefined |
| amount  | uint256 | undefined |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| value  | uint256 | undefined |



## Errors

### DeletingHolderFailed

```solidity
error DeletingHolderFailed()
```






### EmptyTokenDecimals

```solidity
error EmptyTokenDecimals()
```






### EmptyTokenName

```solidity
error EmptyTokenName()
```






### EmptyTokenSymbol

```solidity
error EmptyTokenSymbol()
```






### InvalidAdminTokenAddress

```solidity
error InvalidAdminTokenAddress()
```






### InvalidBurnAmount

```solidity
error InvalidBurnAmount()
```






### InvalidUserAddress

```solidity
error InvalidUserAddress()
```






### NoTokensToBurn

```solidity
error NoTokensToBurn()
```






### NoTokensToTransfer

```solidity
error NoTokensToTransfer()
```






### NotZeroMaxTotalSupply

```solidity
error NotZeroMaxTotalSupply()
```






### SenderCanNotBeAReceiver

```solidity
error SenderCanNotBeAReceiver()
```






### SupplyExceedsMaximumSupply

```solidity
error SupplyExceedsMaximumSupply()
```






### TheTokenIsNotMintable

```solidity
error TheTokenIsNotMintable()
```






### UserDoesNotHaveAnAdminToken

```solidity
error UserDoesNotHaveAnAdminToken()
```







