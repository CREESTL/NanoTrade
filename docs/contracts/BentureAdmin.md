# BentureAdmin

> A custom ERC721 contract that allows to mint controlled ERC20 tokens

## Methods

### approve

```solidity
function approve(address to, uint256 tokenId) external nonpayable
```

_See {IERC721-approve}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

_See {IERC721-balanceOf}._

#### Parameters

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| owner | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### burn

```solidity
function burn(uint256 tokenId) external nonpayable
```

Burns the token with the provided ID

#### Parameters

| Name    | Type    | Description                 |
| ------- | ------- | --------------------------- |
| tokenId | uint256 | The ID of the token to burn |

### checkOwner

```solidity
function checkOwner(address user) external view
```

Checks it the provided address owns any admin token

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| user | address | undefined   |

### getAdminTokenIds

```solidity
function getAdminTokenIds(address admin) external view returns (uint256[])
```

Returns the list of all admin tokens of the user

#### Parameters

| Name  | Type    | Description              |
| ----- | ------- | ------------------------ |
| admin | address | The address of the admin |

#### Returns

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | uint256[] | undefined   |

### getApproved

```solidity
function getApproved(uint256 tokenId) external view returns (address)
```

_See {IERC721-getApproved}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### getControlledAddressById

```solidity
function getControlledAddressById(uint256 tokenId) external view returns (address)
```

Returns the address of the controlled ERC20 token

#### Parameters

| Name    | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| tokenId | uint256 | The ID of ERC721 token to check |

#### Returns

| Name | Type    | Description                               |
| ---- | ------- | ----------------------------------------- |
| \_0  | address | The address of the controlled ERC20 token |

### getFactory

```solidity
function getFactory() external view returns (address)
```

Returns the address of the factory that mints admin tokens

#### Returns

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| \_0  | address | The address of the factory |

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) external view returns (bool)
```

_See {IERC721-isApprovedForAll}._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| owner    | address | undefined   |
| operator | address | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### mintWithERC20Address

```solidity
function mintWithERC20Address(address to, address ERC20Address) external nonpayable
```

Mints a new ERC721 token with the address of the controlled ERC20 token

#### Parameters

| Name         | Type    | Description                               |
| ------------ | ------- | ----------------------------------------- |
| to           | address | The address of the receiver of the token  |
| ERC20Address | address | The address of the controlled ERC20 token |

### name

```solidity
function name() external view returns (string)
```

_See {IERC721Metadata-name}._

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | string | undefined   |

### owner

```solidity
function owner() external view returns (address)
```

_Returns the address of the current owner._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### ownerOf

```solidity
function ownerOf(uint256 tokenId) external view returns (address)
```

_See {IERC721-ownerOf}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```

_Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) external nonpayable
```

_See {IERC721-safeTransferFrom}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| from    | address | undefined   |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external nonpayable
```

_See {IERC721-safeTransferFrom}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| from    | address | undefined   |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |
| data    | bytes   | undefined   |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external nonpayable
```

_See {IERC721-setApprovalForAll}._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| operator | address | undefined   |
| approved | bool    | undefined   |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

_See {IERC165-supportsInterface}._

#### Parameters

| Name        | Type   | Description |
| ----------- | ------ | ----------- |
| interfaceId | bytes4 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### symbol

```solidity
function symbol() external view returns (string)
```

_See {IERC721Metadata-symbol}._

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | string | undefined   |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) external view returns (string)
```

_See {IERC721Metadata-tokenURI}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | undefined   |

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | string | undefined   |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) external nonpayable
```

_See {IERC721-transferFrom}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| from    | address | undefined   |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

### verifyAdminToken

```solidity
function verifyAdminToken(address user, address ERC20Address) external view
```

Checks if the provided user owns an admin token controlling the provided ERC20 token

#### Parameters

| Name         | Type    | Description                                                   |
| ------------ | ------- | ------------------------------------------------------------- |
| user         | address | The address of the user that potentially controls ERC20 token |
| ERC20Address | address | The address of the potentially controlled ERC20 token         |

## Events

### AdminTokenBurnt

```solidity
event AdminTokenBurnt(uint256 indexed tokenId)
```

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| tokenId `indexed` | uint256 | undefined   |

### AdminTokenCreated

```solidity
event AdminTokenCreated(uint256 indexed tokenId, address indexed ERC20Address)
```

#### Parameters

| Name                   | Type    | Description |
| ---------------------- | ------- | ----------- |
| tokenId `indexed`      | uint256 | undefined   |
| ERC20Address `indexed` | address | undefined   |

### AdminTokenTransferred

```solidity
event AdminTokenTransferred(address indexed from, address indexed to, uint256 tokenId)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| from `indexed` | address | undefined   |
| to `indexed`   | address | undefined   |
| tokenId        | uint256 | undefined   |

### Approval

```solidity
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| owner `indexed`    | address | undefined   |
| approved `indexed` | address | undefined   |
| tokenId `indexed`  | uint256 | undefined   |

### ApprovalForAll

```solidity
event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| owner `indexed`    | address | undefined   |
| operator `indexed` | address | undefined   |
| approved           | bool    | undefined   |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
```

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| from `indexed`    | address | undefined   |
| to `indexed`      | address | undefined   |
| tokenId `indexed` | uint256 | undefined   |
