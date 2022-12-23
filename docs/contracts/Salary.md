# Salary

<<<<<<< HEAD
> Salary contract. A contract to manage salaries
=======


> Salary contract. A contract to manage salaries 




>>>>>>> c1f5079 (various salary amount of token per period added)

## Methods

### addEmployee

```solidity
function addEmployee(address employeeAddress) external nonpayable
```

Adds new employee.

<<<<<<< HEAD
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| employeeAddress | address | Address of employee. |

### addSalaryToEmployee

```solidity
<<<<<<< HEAD
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256 tokensAmountPerPeriod) external nonpayable
=======
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256[] tokensAmountPerPeriod) external nonpayable
>>>>>>> c1f5079 (various salary amount of token per period added)
```

Adds salary to employee.

<<<<<<< HEAD
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

### checkIfUserIsAdminOfEmployee

```solidity
function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external view returns (bool isAdmin)
```

Returns true if user is admin for employee and False if not.

<<<<<<< HEAD
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| employeeAddress | address | Address of employee. |
| adminAddress    | address | Address of admin.    |

#### Returns

| Name    | Type | Description                                       |
| ------- | ---- | ------------------------------------------------- |
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
| isAdmin | bool | True if user is admin for employee. False if not. |

### checkIfUserIsEmployeeOfAdmin

```solidity
function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external view returns (bool isEmployee)
```

Returns true if user is employee for admin and False if not.

<<<<<<< HEAD
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| adminAddress    | address | Address of admin.    |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | Address of admin. |
>>>>>>> c1f5079 (various salary amount of token per period added)
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
| Name       | Type | Description                                       |
| ---------- | ---- | ------------------------------------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| isEmployee | bool | True if user is employee for admin. False if not. |

### getAdminsByEmployee

```solidity
function getAdminsByEmployee(address employeeAddress) external view returns (address[] admins)
```

Returns the array of admins of employee.

<<<<<<< HEAD
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
| Name   | Type      | Description                      |
| ------ | --------- | -------------------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| admins | address[] | The array of admins of employee. |

### getEmployeesByAdmin

```solidity
function getEmployeesByAdmin(address adminAddress) external view returns (address[] employees)
```

Returns the array of employees of admin.

<<<<<<< HEAD
#### Parameters

| Name         | Type    | Description       |
| ------------ | ------- | ----------------- |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| adminAddress | address | Address of admin. |

#### Returns

<<<<<<< HEAD
| Name      | Type      | Description                      |
| --------- | --------- | -------------------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| employees | address[] | The array of employees of admin. |

### getNameOfEmployee

```solidity
function getNameOfEmployee(address employeeAddress) external view returns (string name)
```

Returns the name of employee.

<<<<<<< HEAD
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
| Name | Type   | Description           |
| ---- | ------ | --------------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| name | string | The name of employee. |

### getSalariesIdByEmployeeAndAdmin

```solidity
function getSalariesIdByEmployeeAndAdmin(address employeeAddress, address adminAddress) external view returns (uint256[] ids)
```

Returns array of salaries of employee.

<<<<<<< HEAD
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| employeeAddress | address | Address of employee. |
| adminAddress    | address | undefined            |

#### Returns

| Name | Type      | Description                       |
| ---- | --------- | --------------------------------- |
| ids  | uint256[] | Array of salaries id of employee. |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| ids | uint256[] | Array of salaries id of employee. |
>>>>>>> c1f5079 (various salary amount of token per period added)

### getSalaryById

```solidity
function getSalaryById(uint256 salaryId) external view returns (struct ISalary.SalaryInfo salary)
```

Returns salary by ID.

<<<<<<< HEAD
#### Parameters

| Name     | Type    | Description       |
| -------- | ------- | ----------------- |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| salaryId | uint256 | Id of SalaryInfo. |

#### Returns

<<<<<<< HEAD
| Name   | Type               | Description       |
| ------ | ------------------ | ----------------- |
=======
| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| salary | ISalary.SalaryInfo | SalaryInfo by ID. |

### removeEmployee

```solidity
function removeEmployee(address employeeAddress) external nonpayable
```

Removes employee.

<<<<<<< HEAD
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| employeeAddress | address | Address of employee. |

### removeNameFromEmployee

```solidity
function removeNameFromEmployee(address employeeAddress) external nonpayable
```

Removes name from employee.

<<<<<<< HEAD
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| employeeAddress | address | Address of employee. |

### removeSalaryFromEmployee

```solidity
function removeSalaryFromEmployee(uint256 salaryId) external nonpayable
```

Removes salary from employee.

<<<<<<< HEAD
_Only admin can call this method._

#### Parameters

| Name     | Type    | Description            |
| -------- | ------- | ---------------------- |
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
>>>>>>> c1f5079 (various salary amount of token per period added)
| salaryId | uint256 | ID of employee salary. |

### setNameToEmployee

```solidity
function setNameToEmployee(address employeeAddress, string name) external nonpayable
```

Sets new or changes current name of the employee.

<<<<<<< HEAD
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description           |
| --------------- | ------- | --------------------- |
| employeeAddress | address | Address of employee.  |
| name            | string  | New name of employee. |
=======
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| name | string | New name of employee. |
>>>>>>> c1f5079 (various salary amount of token per period added)

### withdrawSalary

```solidity
function withdrawSalary(uint256 salaryId) external nonpayable
```

Withdraws employee&#39;s salary.

<<<<<<< HEAD
_Anyone can call this method. No restrictions._

#### Parameters

| Name     | Type    | Description               |
| -------- | ------- | ------------------------- |
| salaryId | uint256 | IDs of employee salaries. |

=======
*Anyone can call this method. No restrictions.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | IDs of employee salaries. |



>>>>>>> c1f5079 (various salary amount of token per period added)
## Events

### EmployeeAdded

```solidity
event EmployeeAdded(address indexed employeeAddress, address indexed adminAddress)
```

Emits when user was added to Employees of Admin

<<<<<<< HEAD
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| adminAddress `indexed`    | address | undefined   |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)

### EmployeeNameChanged

```solidity
event EmployeeNameChanged(address indexed employeeAddress, string indexed name)
```

Emits when Employee&#39;s name was added or changed

<<<<<<< HEAD
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| name `indexed`            | string  | undefined   |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| name `indexed` | string | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)

### EmployeeNameRemoved

```solidity
event EmployeeNameRemoved(address indexed employeeAddress)
```

Emits when name was removed from Employee

<<<<<<< HEAD
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)

### EmployeeRemoved

```solidity
event EmployeeRemoved(address indexed employeeAddress, address indexed adminAddress)
```

Emits when user was removed from Employees of Admin

<<<<<<< HEAD
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| adminAddress `indexed`    | address | undefined   |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)

### EmployeeSalaryAdded

```solidity
event EmployeeSalaryAdded(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when salary was added to Employee

<<<<<<< HEAD
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)

### EmployeeSalaryClaimed

```solidity
event EmployeeSalaryClaimed(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when Employee withdraws salary

<<<<<<< HEAD
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
>>>>>>> c1f5079 (various salary amount of token per period added)

### EmployeeSalaryRemoved

```solidity
event EmployeeSalaryRemoved(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when salary was removed from Employee

<<<<<<< HEAD
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
=======


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |



>>>>>>> c1f5079 (various salary amount of token per period added)
