# ISalary

<<<<<<< HEAD
<<<<<<< HEAD
> An interface of a Salary contract.

=======
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod


> An interface of a Salary contract.





<<<<<<< HEAD
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
=======
> An interface of a Salary contract.

>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
## Methods

### addEmployee

```solidity
function addEmployee(address employeeAddress) external nonpayable
```

Adds new employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| employeeAddress | address | Address of employee. |

### addSalaryToEmployee

```solidity
<<<<<<< HEAD
<<<<<<< HEAD
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256 tokensAmountPerPeriod) external nonpayable
=======
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256[] tokensAmountPerPeriod) external nonpayable
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256[] tokensAmountPerPeriod) external nonpayable
=======
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256 tokensAmountPerPeriod) external nonpayable
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
```

Adds salary to employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| periodDuration | uint256 | undefined |
| amountOfPeriods | uint256 | undefined |
| tokenAddress | address | undefined |
| totalTokenAmount | uint256 | undefined |
| tokensAmountPerPeriod | uint256[] | undefined |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
_Only admin can call this method._

#### Parameters

| Name                  | Type    | Description          |
| --------------------- | ------- | -------------------- |
| employeeAddress       | address | Address of employee. |
| periodDuration        | uint256 | undefined            |
| amountOfPeriods       | uint256 | undefined            |
| tokenAddress          | address | undefined            |
| totalTokenAmount      | uint256 | undefined            |
| tokensAmountPerPeriod | uint256 | undefined            |
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| periodDuration | uint256 | undefined |
| amountOfPeriods | uint256 | undefined |
| tokenAddress | address | undefined |
| totalTokenAmount | uint256 | undefined |
| tokensAmountPerPeriod | uint256[] | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### checkIfUserIsAdminOfEmployee

```solidity
function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external view returns (bool isAdmin)
```

Returns true if user is admin for employee and False if not.

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | Address of admin. |

#### Returns

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| employeeAddress | address | Address of employee. |
| adminAddress    | address | Address of admin.    |

#### Returns

| Name    | Type | Description                                       |
| ------- | ---- | ------------------------------------------------- |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | Address of admin. |

#### Returns

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| isAdmin | bool | True if user is admin for employee. False if not. |

### checkIfUserIsEmployeeOfAdmin

```solidity
function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external view returns (bool isEmployee)
```

Returns true if user if employee for admin and False if not.

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | Address of admin. |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| adminAddress    | address | Address of admin.    |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | Address of admin. |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
<<<<<<< HEAD
| Name       | Type | Description                                       |
| ---------- | ---- | ------------------------------------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
| Name | Type | Description |
|---|---|---|
=======
| Name       | Type | Description                                       |
| ---------- | ---- | ------------------------------------------------- |
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| isEmployee | bool | True if user if employee for admin. False if not. |

### getAdminsByEmployee

```solidity
function getAdminsByEmployee(address employeeAddress) external view returns (address[] admins)
```

Returns the array of admins of employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
<<<<<<< HEAD
| Name   | Type      | Description                      |
| ------ | --------- | -------------------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
| Name | Type | Description |
|---|---|---|
=======
| Name   | Type      | Description                      |
| ------ | --------- | -------------------------------- |
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| admins | address[] | The array of admins of employee. |

### getEmployeesByAdmin

```solidity
function getEmployeesByAdmin(address adminAddress) external view returns (address[] employees)
```

Returns the array of employees of admin.

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name         | Type    | Description       |
| ------------ | ------- | ----------------- |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| adminAddress | address | Address of admin. |

#### Returns

<<<<<<< HEAD
<<<<<<< HEAD
| Name      | Type      | Description                      |
| --------- | --------- | -------------------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
| Name | Type | Description |
|---|---|---|
=======
| Name      | Type      | Description                      |
| --------- | --------- | -------------------------------- |
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| employees | address[] | The array of employees of admin. |

### getNameOfEmployee

```solidity
function getNameOfEmployee(address employeeAddress) external view returns (string name)
```

Returns the name of employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
<<<<<<< HEAD
| Name | Type   | Description           |
| ---- | ------ | --------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
| Name | Type | Description |
|---|---|---|
=======
| Name | Type   | Description           |
| ---- | ------ | --------------------- |
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| name | string | The name of employee. |

### getSalariesIdByEmployeeAndAdmin

```solidity
function getSalariesIdByEmployeeAndAdmin(address employeeAddress, address adminAddress) external view returns (uint256[] salaries)
```

Returns array of salaries of employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| employeeAddress | address | Address of employee. |
| adminAddress    | address | undefined            |

#### Returns

| Name     | Type      | Description                    |
| -------- | --------- | ------------------------------ |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| salaries | uint256[] | Array of salaries of employee. |

### getSalaryById

```solidity
function getSalaryById(uint256 salaryId) external view returns (struct ISalary.SalaryInfo salary)
```

Returns salary by ID.

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name     | Type    | Description       |
| -------- | ------- | ----------------- |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| salaryId | uint256 | Id of SalaryInfo. |

#### Returns

<<<<<<< HEAD
<<<<<<< HEAD
| Name   | Type               | Description       |
| ------ | ------------------ | ----------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
| Name | Type | Description |
|---|---|---|
=======
| Name   | Type               | Description       |
| ------ | ------------------ | ----------------- |
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| salary | ISalary.SalaryInfo | SalaryInfo by ID. |

### removeEmployee

```solidity
function removeEmployee(address employeeAddress) external nonpayable
```

Removes employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| employeeAddress | address | Address of employee. |

### removeNameFromEmployee

```solidity
function removeNameFromEmployee(address employeeAddress) external nonpayable
```

Removes name from employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| employeeAddress | address | Address of employee. |

### removeSalaryFromEmployee

```solidity
function removeSalaryFromEmployee(uint256 salaryId) external nonpayable
```

Removes salary from employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
_Only admin can call this method._

#### Parameters

| Name     | Type    | Description            |
| -------- | ------- | ---------------------- |
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
| salaryId | uint256 | ID of employee salary. |

### setNameToEmployee

```solidity
function setNameToEmployee(address employeeAddress, string name) external nonpayable
```

Sets new or changes current name of the employee.

<<<<<<< HEAD
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| name | string | New name of employee. |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description           |
| --------------- | ------- | --------------------- |
| employeeAddress | address | Address of employee.  |
| name            | string  | New name of employee. |
<<<<<<< HEAD
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| name | string | New name of employee. |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### withdrawSalary

```solidity
function withdrawSalary(uint256 salaryId) external nonpayable
```

Withdraws employee&#39;s salary.

<<<<<<< HEAD
<<<<<<< HEAD
=======
*Anyone can call this method. No restrictions.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | IDs of employee salaries. |



=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
_Anyone can call this method. No restrictions._

#### Parameters

| Name     | Type    | Description               |
| -------- | ------- | ------------------------- |
| salaryId | uint256 | IDs of employee salaries. |

<<<<<<< HEAD
=======
*Anyone can call this method. No restrictions.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | IDs of employee salaries. |



>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
## Events

### EmployeeAdded

```solidity
event EmployeeAdded(address indexed employeeAddress, address indexed adminAddress)
```

Emits when user was added to Employees of Admin

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| adminAddress `indexed`    | address | undefined   |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### EmployeeNameChanged

```solidity
event EmployeeNameChanged(address indexed employeeAddress, string indexed name)
```

Emits when Employee&#39;s name was added or changed

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| name `indexed` | string | undefined |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| name `indexed`            | string  | undefined   |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| name `indexed` | string | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### EmployeeNameRemoved

```solidity
event EmployeeNameRemoved(address indexed employeeAddress)
```

Emits when name was removed from Employee

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### EmployeeRemoved

```solidity
event EmployeeRemoved(address indexed employeeAddress, address indexed adminAddress)
```

Emits when user was removed from Employees of Admin

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| adminAddress `indexed`    | address | undefined   |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### EmployeeSalaryAdded

```solidity
event EmployeeSalaryAdded(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when salary was added to Employee

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### EmployeeSalaryClaimed

```solidity
event EmployeeSalaryClaimed(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when Employee withdraws salary

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod

### EmployeeSalaryRemoved

```solidity
event EmployeeSalaryRemoved(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when salary was removed from Employee

<<<<<<< HEAD
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |



=======
>>>>>>> feature/12149-variousTokensAmountPerPeriod
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
<<<<<<< HEAD
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |



>>>>>>> c1f5079 (various salary amount of token per period added)
=======
>>>>>>> dev
>>>>>>> feature/12149-variousTokensAmountPerPeriod
