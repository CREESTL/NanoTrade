# BentureProducedToken

## Methods

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_See {IERC20-allowance}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| owner   | address | undefined   |
| spender | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool)
```

_See {IERC20-approve}. NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on `transferFrom`. This is semantically equivalent to an infinite approval. Requirements: - `spender` cannot be the zero address._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| spender | address | undefined   |
| amount  | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_See {IERC20-balanceOf}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| account | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### burn

```solidity
function burn(uint256 amount) external nonpayable
```

Burns user&#39;s tokens

#### Parameters

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| amount | uint256 | The amount of tokens to burn |

### checkAdmin

```solidity
function checkAdmin(address account) external view
```

Checks if user is an admin of this token

#### Parameters

| Name    | Type    | Description          |
| ------- | ------- | -------------------- |
| account | address | The address to check |

### decimals

```solidity
function decimals() external view returns (uint8)
```

Returns number of decimals of the token

#### Returns

| Name | Type  | Description                         |
| ---- | ----- | ----------------------------------- |
| \_0  | uint8 | The number of decimals of the token |

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) external nonpayable returns (bool)
```

_Atomically decreases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address. - `spender` must have allowance for the caller of at least `subtractedValue`._

#### Parameters

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| spender         | address | undefined   |
| subtractedValue | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### holders

```solidity
function holders() external view returns (address[])
```

Returns the array of addresses of all token holders

#### Returns

| Name | Type      | Description                                 |
| ---- | --------- | ------------------------------------------- |
| \_0  | address[] | The array of addresses of all token holders |

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) external nonpayable returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address._

#### Parameters

| Name       | Type    | Description |
| ---------- | ------- | ----------- |
| spender    | address | undefined   |
| addedValue | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### isHolder

```solidity
function isHolder(address account) external view returns (bool)
```

Checks if the address is a holder

#### Parameters

| Name    | Type    | Description          |
| ------- | ------- | -------------------- |
| account | address | The address to check |

#### Returns

| Name | Type | Description                                     |
| ---- | ---- | ----------------------------------------------- |
| \_0  | bool | True if address is a holder. False if it is not |

### maxTotalSupply

```solidity
function maxTotalSupply() external view returns (uint256)
```

Returns the max total supply of the token

#### Returns

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| \_0  | uint256 | The max total supply of the token |

### mint

```solidity
function mint(address to, uint256 amount) external nonpayable
```

Creates tokens and assigns them to account, increasing the total supply.

_Can only be called by the owner of the admin NFTCan only be called when token is mintable_

#### Parameters

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| to     | address | The receiver of tokens       |
| amount | uint256 | The amount of tokens to mint |

### mintable

```solidity
function mintable() external view returns (bool)
```

Indicates whether the token is mintable or not

#### Returns

| Name | Type | Description                                         |
| ---- | ---- | --------------------------------------------------- |
| \_0  | bool | True if the token is mintable. False - if it is not |

### name

```solidity
function name() external view returns (string)
```

Returns the name of the token

#### Returns

| Name | Type   | Description           |
| ---- | ------ | --------------------- |
| \_0  | string | The name of the token |

### symbol

```solidity
function symbol() external view returns (string)
```

Returns the symbol of the token

#### Returns

| Name | Type   | Description             |
| ---- | ------ | ----------------------- |
| \_0  | string | The symbol of the token |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_See {IERC20-totalSupply}._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### transfer

```solidity
function transfer(address to, uint256 amount) external nonpayable returns (bool)
```

_See {IERC20-transfer}. Requirements: - `to` cannot be the zero address. - the caller must have a balance of at least `amount`._

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| to     | address | undefined   |
| amount | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) external nonpayable returns (bool)
```

_See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated allowance. This is not required by the EIP. See the note at the beginning of {ERC20}. NOTE: Does not update the allowance if the current allowance is the maximum `uint256`. Requirements: - `from` and `to` cannot be the zero address. - `from` must have a balance of at least `amount`. - the caller must have allowance for `from`&#39;s tokens of at least `amount`._

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| from   | address | undefined   |
| to     | address | undefined   |
| amount | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

## Events

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| owner `indexed`   | address | undefined   |
| spender `indexed` | address | undefined   |
| value             | uint256 | undefined   |

### ControlledTokenBurnt

```solidity
event ControlledTokenBurnt(address indexed account, uint256 amount)
```

Indicates that a new ERC20 was burnt

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| account `indexed` | address | undefined   |
| amount            | uint256 | undefined   |

### ControlledTokenCreated

```solidity
event ControlledTokenCreated(address indexed account, uint256 amount)
```

Indicates that a new ERC20 was created

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| account `indexed` | address | undefined   |
| amount            | uint256 | undefined   |

### ControlledTokenTransferred

```solidity
event ControlledTokenTransferred(address indexed from, address indexed to, uint256 amount)
```

Indicates that a new ERC20 was transferred

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| from `indexed` | address | undefined   |
| to `indexed`   | address | undefined   |
| amount         | uint256 | undefined   |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| from `indexed` | address | undefined   |
| to `indexed`   | address | undefined   |
| value          | uint256 | undefined   |
