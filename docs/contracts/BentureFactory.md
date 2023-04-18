# BentureFactory



> A factory of custom ERC20 tokens





## Methods

### createERC20Token

```solidity
function createERC20Token(string name, string symbol, uint8 decimals, bool mintable, uint256 maxTotalSupply, address adminToken_) external nonpayable
```

Creates a new ERC20 token and mints an admin token proving ownership

*Anyone can call this method. No restrictions.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| name | string | The name of the token |
| symbol | string | The symbol of the token |
| decimals | uint8 | Number of decimals of the token |
| mintable | bool | Token may be either mintable or not. Can be changed later. |
| maxTotalSupply | uint256 | Maximum amount of tokens to be minted |
| adminToken_ | address | Address of the admin token for controlled token |

### initialize

```solidity
function initialize(address bentureAddress_) external nonpayable
```

Set a `Benture` contract address



#### Parameters

| Name | Type | Description |
|---|---|---|
| bentureAddress_ | address | The address of `Benture` contract |

### lastProducedToken

```solidity
function lastProducedToken() external view returns (address)
```

Returns the address of the produced ERC20 token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | The address of the produced ERC20 token |

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


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

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

### CreateERC20Token

```solidity
event CreateERC20Token(string name, string symbol, address tokenAddress, uint8 decimals, bool mintable)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| name  | string | undefined |
| symbol  | string | undefined |
| tokenAddress  | address | undefined |
| decimals  | uint8 | undefined |
| mintable  | bool | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



## Errors

### BentureAddressIsZero

```solidity
error BentureAddressIsZero()
```







