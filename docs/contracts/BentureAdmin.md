# BentureAdmin



> A custom ERC721 contract that allows to mint controlled ERC20 tokens





## Methods

### approve

```solidity
function approve(address to, uint256 tokenId) external nonpayable
```



*See {IERC721-approve}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |
| tokenId | uint256 | undefined |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```



*See {IERC721-balanceOf}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### burn

```solidity
function burn(uint256 tokenId) external nonpayable
```

See {IBentureAdmin-burn}



#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

### checkAdminOfAny

```solidity
function checkAdminOfAny(address user) external view returns (bool)
```

See {IBentureAdmin-checkAdminOfAny}



#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### checkAdminOfProject

```solidity
function checkAdminOfProject(address user, address ERC20Address) external view returns (bool)
```

See {IBentureAdmin-checkAdminOfProject}



#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | undefined |
| ERC20Address | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### checkIsControlled

```solidity
function checkIsControlled(address ERC20Address) external view returns (bool)
```

See {IBentureAdmin-checkIsControlled}



#### Parameters

| Name | Type | Description |
|---|---|---|
| ERC20Address | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### checkOwner

```solidity
function checkOwner(address user) external view
```

See {IBentureAdmin-checkOwner}



#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | undefined |

### getAdminTokenIds

```solidity
function getAdminTokenIds(address admin) external view returns (uint256[])
```

See {IBentureAdmin-getAdminTokenIds}



#### Parameters

| Name | Type | Description |
|---|---|---|
| admin | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined |

### getApproved

```solidity
function getApproved(uint256 tokenId) external view returns (address)
```



*See {IERC721-getApproved}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### getControlledAddressById

```solidity
function getControlledAddressById(uint256 tokenId) external view returns (address)
```

See {IBentureAdmin-getControlledAddressById}



#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### getFactory

```solidity
function getFactory() external view returns (address)
```

See {IBentureAdmin-getFactory}




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### initialize

```solidity
function initialize(address factoryAddress_) external nonpayable
```



*Creates an &quot;empty&quot; NFT*

#### Parameters

| Name | Type | Description |
|---|---|---|
| factoryAddress_ | address | The address of the factory minting admin tokens |

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) external view returns (bool)
```



*See {IERC721-isApprovedForAll}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| operator | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### mintWithERC20Address

```solidity
function mintWithERC20Address(address to, address ERC20Address) external nonpayable
```

See {IBentureAdmin-mintWithERC20Address}



#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |
| ERC20Address | address | undefined |

### name

```solidity
function name() external view returns (string)
```



*See {IERC721Metadata-name}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### ownerOf

```solidity
function ownerOf(uint256 tokenId) external view returns (address)
```



*See {IERC721-ownerOf}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

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



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) external nonpayable
```



*See {IERC721-safeTransferFrom}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| tokenId | uint256 | undefined |

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external nonpayable
```



*See {IERC721-safeTransferFrom}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| tokenId | uint256 | undefined |
| data | bytes | undefined |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external nonpayable
```



*See {IERC721-setApprovalForAll}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| operator | address | undefined |
| approved | bool | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### symbol

```solidity
function symbol() external view returns (string)
```



*See {IERC721Metadata-symbol}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) external view returns (string)
```



*See {IERC721Metadata-tokenURI}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) external nonpayable
```



*See {IERC721-transferFrom}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| tokenId | uint256 | undefined |

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

### AdminTokenBurnt

```solidity
event AdminTokenBurnt(uint256 tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId  | uint256 | undefined |

### AdminTokenCreated

```solidity
event AdminTokenCreated(uint256 tokenId, address ERC20Address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenId  | uint256 | undefined |
| ERC20Address  | address | undefined |

### AdminTokenTransferred

```solidity
event AdminTokenTransferred(address from, address to, uint256 tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from  | address | undefined |
| to  | address | undefined |
| tokenId  | uint256 | undefined |

### Approval

```solidity
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| approved `indexed` | address | undefined |
| tokenId `indexed` | uint256 | undefined |

### ApprovalForAll

```solidity
event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| operator `indexed` | address | undefined |
| approved  | bool | undefined |

### BeaconUpgraded

```solidity
event BeaconUpgraded(address indexed beacon)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beacon `indexed` | address | undefined |

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

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| tokenId `indexed` | uint256 | undefined |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



## Errors

### CallerIsNotAFactory

```solidity
error CallerIsNotAFactory()
```






### FailedToDeleteTokenID

```solidity
error FailedToDeleteTokenID()
```






### InvalidAdminAddress

```solidity
error InvalidAdminAddress()
```






### InvalidFactoryAddress

```solidity
error InvalidFactoryAddress()
```






### InvalidTokenAddress

```solidity
error InvalidTokenAddress()
```






### InvalidUserAddress

```solidity
error InvalidUserAddress()
```






### MintToZeroAddressNotAllowed

```solidity
error MintToZeroAddressNotAllowed()
```






### NoControlledToken

```solidity
error NoControlledToken()
```






### NotAnOwner

```solidity
error NotAnOwner()
```






### OnlyOneAdminTokenForProjectToken

```solidity
error OnlyOneAdminTokenForProjectToken()
```






### UserDoesNotHaveAnAdminToken

```solidity
error UserDoesNotHaveAnAdminToken()
```







