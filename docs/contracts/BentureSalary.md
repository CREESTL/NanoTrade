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

Adds new employee to admin&#39;s project

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee |
| projectToken | address | The address of the project token |

### addPeriodsToSalary

```solidity
function addPeriodsToSalary(uint256 salaryId, uint256[] tokensAmountPerPeriod) external nonpayable
```

Adds periods to salary

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | ID of target salary |
| tokensAmountPerPeriod | uint256[] | Array of periods to add to salary |

### addSalaryToEmployee

```solidity
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256[] tokensAmountPerPeriod) external nonpayable
```

Adds salary to employee.

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| periodDuration | uint256 | Duration of one period. |
| amountOfPeriods | uint256 | Amount of periods. |
| tokenAddress | address | undefined |
| tokensAmountPerPeriod | uint256[] | Amount of tokens per period. |

### checkIfAdminOfProject

```solidity
function checkIfAdminOfProject(address adminAddress, address projectTokenAddress) external view returns (bool)
```

Returns true if user is an admin of the given project token



#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | The address of the user to check |
| projectTokenAddress | address | The address of the project token to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if user is an admin of the given project token |

### checkIfUserInProject

```solidity
function checkIfUserInProject(address employeeAddress, address projectTokenAddress) external view returns (bool)
```

Returns true if user is already working on the project



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | The address of the user to check |
| projectTokenAddress | address | The address of the project token to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if user is already working on the project |

### checkIfUserIsAdminOfEmployee

```solidity
function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external view returns (bool isAdmin)
```

Returns true if user is admin for employee and False if not.



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | Address of admin. |

#### Returns

| Name | Type | Description |
|---|---|---|
| isAdmin | bool | True if user is admin for employee. False if not. |

### checkIfUserIsEmployeeOfAdmin

```solidity
function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external view returns (bool isEmployee)
```

Returns true if user is employee for admin and False if not.



#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | Address of admin. |
| employeeAddress | address | Address of employee. |

#### Returns

| Name | Type | Description |
|---|---|---|
| isEmployee | bool | True if user is employee for admin. False if not. |

### getAdminsByEmployee

```solidity
function getAdminsByEmployee(address employeeAddress) external view returns (address[] admins)
```

Returns the array of admins of employee.



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |

#### Returns

| Name | Type | Description |
|---|---|---|
| admins | address[] | The array of admins of employee. |

### getEmployeesByAdmin

```solidity
function getEmployeesByAdmin(address adminAddress) external view returns (address[] employees)
```

Returns the array of employees of admin.



#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | Address of admin. |

#### Returns

| Name | Type | Description |
|---|---|---|
| employees | address[] | The array of employees of admin. |

### getNameOfEmployee

```solidity
function getNameOfEmployee(address employeeAddress) external view returns (string name)
```

Returns the name of employee.



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |

#### Returns

| Name | Type | Description |
|---|---|---|
| name | string | The name of employee. |

### getSalariesIdByEmployeeAndAdmin

```solidity
function getSalariesIdByEmployeeAndAdmin(address employeeAddress, address adminAddress) external view returns (uint256[] ids)
```

Returns array of salaries of employee.



#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| ids | uint256[] | Array of salaries id of employee. |

### getSalaryAmount

```solidity
function getSalaryAmount(uint256 salaryId) external view returns (uint256 salaryAmount)
```

Returns amount of pending salary.



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | Salary ID. |

#### Returns

| Name | Type | Description |
|---|---|---|
| salaryAmount | uint256 | Amount of pending salary. |

### getSalaryById

```solidity
function getSalaryById(uint256 salaryId) external view returns (struct IBentureSalary.SalaryInfo salary)
```

Returns salary by ID.



#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | Id of SalaryInfo. |

#### Returns

| Name | Type | Description |
|---|---|---|
| salary | IBentureSalary.SalaryInfo | SalaryInfo by ID. |

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

Removes employee from admin&#39;s project

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| projectToken | address | The address of the project token |

### removeNameFromEmployee

```solidity
function removeNameFromEmployee(address employeeAddress) external nonpayable
```

Removes name from employee.

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |

### removePeriodsFromSalary

```solidity
function removePeriodsFromSalary(uint256 salaryId, uint256 amountOfPeriodsToDelete) external nonpayable
```

Removes periods from salary

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | ID of target salary |
| amountOfPeriodsToDelete | uint256 | Amount of periods to delete from salary |

### removeSalaryFromEmployee

```solidity
function removeSalaryFromEmployee(uint256 salaryId) external nonpayable
```

Removes salary from employee.

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | ID of employee salary. |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setNameToEmployee

```solidity
function setNameToEmployee(address employeeAddress, string name) external nonpayable
```

Sets new or changes current name of the employee.

*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| name | string | New name of employee. |

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

Withdraws all of employee&#39;s salary.

*Anyone can call this method. No restrictions.*


### withdrawSalary

```solidity
function withdrawSalary(uint256 salaryId) external nonpayable
```

Withdraws employee&#39;s salary.

*Anyone can call this method. No restrictions.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | IDs of employee salaries. |



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
event EmployeeSalaryClaimed(uint256 id, address employeeAddress, address adminAddress)
```

Emits when Employee withdraws salary



#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| employeeAddress  | address | undefined |
| adminAddress  | address | undefined |

### EmployeeSalaryRemoved

```solidity
event EmployeeSalaryRemoved(uint256 id, address employeeAddress, address adminAddress)
```

Emits when salary was removed from Employee



#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |
| employeeAddress  | address | undefined |
| adminAddress  | address | undefined |

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







