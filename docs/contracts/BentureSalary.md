# BentureSalary



> Salary contract. A contract to manage salaries





## Methods

### _withdrawSalary

```solidity
function _withdrawSalary(uint256 salaryId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | undefined |

### addEmployeeToProject

```solidity
function addEmployeeToProject(address employeeAddress, address projectToken) external nonpayable
```

See {IBentureSalary-addEmployeeToProject}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| projectToken | address | undefined |

### addPeriodsToSalary

```solidity
function addPeriodsToSalary(uint256 salaryId, uint256[] tokensAmountPerPeriod) external nonpayable
```

See {IBentureSalary-addPeriodsToSalary}



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | undefined |
| tokensAmountPerPeriod | uint256[] | undefined |

### addSalaryToEmployee

```solidity
function addSalaryToEmployee(address employeeAddress, address projectTokenAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256[] tokensAmountPerPeriod) external nonpayable
```

See {IBentureSalary-addSalaryToEmployee}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| projectTokenAddress | address | undefined |
| periodDuration | uint256 | undefined |
| amountOfPeriods | uint256 | undefined |
| tokenAddress | address | undefined |
| tokensAmountPerPeriod | uint256[] | undefined |

### checkIfAdminOfProject

```solidity
function checkIfAdminOfProject(address adminAddress, address projectTokenAddress) external view returns (bool)
```

See {IBentureSalary-checkIfAdminOfProject}



#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | undefined |
| projectTokenAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### checkIfUserInProject

```solidity
function checkIfUserInProject(address employeeAddress, address projectTokenAddress) external view returns (bool)
```

See {IBentureSalary-checkIfUserInProject}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| projectTokenAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### checkIfUserIsAdminOfEmployee

```solidity
function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external view returns (bool isAdmin)
```

See {IBentureSalary-checkIfUserIsAdminOfEmployee}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| isAdmin | bool | undefined |

### checkIfUserIsEmployeeOfAdmin

```solidity
function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external view returns (bool isEmployee)
```

See {IBentureSalary-checkIfUserIsEmployeeOfAdmin}



#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | undefined |
| employeeAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| isEmployee | bool | undefined |

### getAdminsByEmployee

```solidity
function getAdminsByEmployee(address employeeAddress) external view returns (address[] admins)
```

See {IBentureSalary-getAdminsByEmployee}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| admins | address[] | undefined |

### getEmployeesByAdmin

```solidity
function getEmployeesByAdmin(address adminAddress) external view returns (address[] employees)
```

See {IBentureSalary-getEmployeesByAdmin}



#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| employees | address[] | undefined |

### getNameOfEmployee

```solidity
function getNameOfEmployee(address employeeAddress) external view returns (string name)
```

See {IBentureSalary-getNameOfEmployee}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| name | string | undefined |

### getSalariesIdByEmployeeAndAdmin

```solidity
function getSalariesIdByEmployeeAndAdmin(address employeeAddress, address adminAddress) external view returns (uint256[] ids)
```

See {IBentureSalary-getSalariesIdByEmployeeAndAdmin}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| ids | uint256[] | undefined |

### getSalariesIdByEmployeeAndProjectToken

```solidity
function getSalariesIdByEmployeeAndProjectToken(address employeeAddress, address projectTokenAddress) external view returns (uint256[] ids)
```

See {IBentureSalary-getSalariesIdByEmployeeAndProjectToken}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| projectTokenAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| ids | uint256[] | undefined |

### getSalaryAmount

```solidity
function getSalaryAmount(uint256 salaryId) external view returns (uint256 salaryAmount)
```

See {IBentureSalary-getSalaryAmount}



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| salaryAmount | uint256 | undefined |

### getSalaryById

```solidity
function getSalaryById(uint256 salaryId) external view returns (struct IBentureSalary.SalaryInfo salary)
```

See {IBentureSalary-getSalaryById}



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| salary | IBentureSalary.SalaryInfo | undefined |

### initialize

```solidity
function initialize(address adminTokenAddress) external nonpayable
```

Set the address of the admin token



#### Parameters

| Name | Type | Description |
|---|---|---|
| adminTokenAddress | address | The address of the BentureAdmin Token |

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

### removeEmployeeFromProject

```solidity
function removeEmployeeFromProject(address employeeAddress, address projectToken) external nonpayable
```

See {IBentureSalary-removeEmployeeFromProject}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| projectToken | address | undefined |

### removeNameFromEmployee

```solidity
function removeNameFromEmployee(address employeeAddress) external nonpayable
```

See {IBentureSalary-removeNameFromEmployee}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |

### removePeriodsFromSalary

```solidity
function removePeriodsFromSalary(uint256 salaryId, uint256 amountOfPeriodsToDelete) external nonpayable
```

See {IBentureSalary-removePeriodsFromSalary}



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | undefined |
| amountOfPeriodsToDelete | uint256 | undefined |

### removeSalaryFromEmployee

```solidity
function removeSalaryFromEmployee(uint256 salaryId) external nonpayable
```

See {IBentureSalary-removeSalaryFromEmployee}



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.*


### setNameToEmployee

```solidity
function setNameToEmployee(address employeeAddress, string name) external nonpayable
```

See {IBentureSalary-setNameToEmployee}



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | undefined |
| name | string | undefined |

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

### withdrawAllSalaries

```solidity
function withdrawAllSalaries() external nonpayable
```

See {IBentureSalary-withdrawAllSalaries}




### withdrawSalary

```solidity
function withdrawSalary(uint256 salaryId) external nonpayable
```

See {IBentureSalary-withdrawSalary}



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | undefined |



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

### EmployeeAdded

```solidity
event EmployeeAdded(address indexed employeeAddress, address indexed projectToken, address indexed adminAddress)
```

Emits when user was added to Employees of Admin&#39;s project



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| projectToken `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |

### EmployeeNameChanged

```solidity
event EmployeeNameChanged(address employeeAddress, string name)
```

Emits when Employee&#39;s name was added or changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress  | address | undefined |
| name  | string | undefined |

### EmployeeNameRemoved

```solidity
event EmployeeNameRemoved(address employeeAddress)
```

Emits when name was removed from Employee



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress  | address | undefined |

### EmployeeRemoved

```solidity
event EmployeeRemoved(address indexed employeeAddress, address indexed projectToken, address indexed adminAddress)
```

Emits when user was removed from Employees of Admin



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| projectToken `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |

### EmployeeSalaryAdded

```solidity
event EmployeeSalaryAdded(uint256 id, address employeeAddress, address adminAddress)
```

Emits when salary was added to Employee



#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| employeeAddress  | address | undefined |
| adminAddress  | address | undefined |

### EmployeeSalaryClaimed

```solidity
event EmployeeSalaryClaimed(uint256 id, address employeeAddress, address adminAddress, uint256 amount)
```

Emits when Employee withdraws salary



#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| employeeAddress  | address | undefined |
| adminAddress  | address | undefined |
| amount  | uint256 | undefined |

### EmployeeSalaryRemoved

```solidity
event EmployeeSalaryRemoved(uint256 id, address employeeAddress, address adminAddress, uint256 amount)
```

Emits when salary was removed from Employee



#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| employeeAddress  | address | undefined |
| adminAddress  | address | undefined |
| amount  | uint256 | undefined |

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

### SalaryPeriodsAdded

```solidity
event SalaryPeriodsAdded(uint256 id, address employeeAddress, address adminAddress)
```

Emits when Admin adds periods to salary



#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| employeeAddress  | address | undefined |
| adminAddress  | address | undefined |

### SalaryPeriodsRemoved

```solidity
event SalaryPeriodsRemoved(uint256 id, address employeeAddress, address adminAddress)
```

Emits when Admin removes periods from salary



#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| employeeAddress  | address | undefined |
| adminAddress  | address | undefined |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



## Errors

### AllreadyEmployee

```solidity
error AllreadyEmployee()
```






### AlreadyInProject

```solidity
error AlreadyInProject()
```






### EmployeeNotInProject

```solidity
error EmployeeNotInProject()
```






### EmptyName

```solidity
error EmptyName()
```






### InvalidAmountOfPeriods

```solidity
error InvalidAmountOfPeriods()
```






### NotAdminForEmployee

```solidity
error NotAdminForEmployee()
```






### NotAdminForThisSalary

```solidity
error NotAdminForThisSalary()
```






### NotAdminOfProject

```solidity
error NotAdminOfProject()
```






### NotAllowedToRemoveName

```solidity
error NotAllowedToRemoveName()
```






### NotAllowedToSetName

```solidity
error NotAllowedToSetName()
```






### NotEmployeeForThisSalary

```solidity
error NotEmployeeForThisSalary()
```






### NotEmployeeOfAdmin

```solidity
error NotEmployeeOfAdmin()
```






### NotEnoughTokensAllowed

```solidity
error NotEnoughTokensAllowed()
```






### SalaryEnded

```solidity
error SalaryEnded()
```






### ZeroAddress

```solidity
error ZeroAddress()
```







