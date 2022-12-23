# ISalary

<<<<<<< HEAD


> An interface of a Salary contract.





=======
> An interface of a Salary contract.

>>>>>>> dev
## Methods

### addEmployee

```solidity
function addEmployee(address employeeAddress) external nonpayable
```

Adds new employee.

<<<<<<< HEAD
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
>>>>>>> dev
| employeeAddress | address | Address of employee. |

### addSalaryToEmployee

```solidity
<<<<<<< HEAD
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256[] tokensAmountPerPeriod) external nonpayable
=======
function addSalaryToEmployee(address employeeAddress, uint256 periodDuration, uint256 amountOfPeriods, address tokenAddress, uint256 totalTokenAmount, uint256 tokensAmountPerPeriod) external nonpayable
>>>>>>> dev
```

Adds salary to employee.

<<<<<<< HEAD
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
>>>>>>> dev

### checkIfUserIsAdminOfEmployee

```solidity
function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external view returns (bool isAdmin)
```

Returns true if user is admin for employee and False if not.

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | Address of admin. |

#### Returns

| Name | Type | Description |
|---|---|---|
=======
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| employeeAddress | address | Address of employee. |
| adminAddress    | address | Address of admin.    |

#### Returns

| Name    | Type | Description                                       |
| ------- | ---- | ------------------------------------------------- |
>>>>>>> dev
| isAdmin | bool | True if user is admin for employee. False if not. |

### checkIfUserIsEmployeeOfAdmin

```solidity
function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external view returns (bool isEmployee)
```

Returns true if user if employee for admin and False if not.

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| adminAddress | address | Address of admin. |
=======
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| adminAddress    | address | Address of admin.    |
>>>>>>> dev
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
| Name | Type | Description |
|---|---|---|
=======
| Name       | Type | Description                                       |
| ---------- | ---- | ------------------------------------------------- |
>>>>>>> dev
| isEmployee | bool | True if user if employee for admin. False if not. |

### getAdminsByEmployee

```solidity
function getAdminsByEmployee(address employeeAddress) external view returns (address[] admins)
```

Returns the array of admins of employee.

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
>>>>>>> dev
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
| Name | Type | Description |
|---|---|---|
=======
| Name   | Type      | Description                      |
| ------ | --------- | -------------------------------- |
>>>>>>> dev
| admins | address[] | The array of admins of employee. |

### getEmployeesByAdmin

```solidity
function getEmployeesByAdmin(address adminAddress) external view returns (address[] employees)
```

Returns the array of employees of admin.

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
#### Parameters

| Name         | Type    | Description       |
| ------------ | ------- | ----------------- |
>>>>>>> dev
| adminAddress | address | Address of admin. |

#### Returns

<<<<<<< HEAD
| Name | Type | Description |
|---|---|---|
=======
| Name      | Type      | Description                      |
| --------- | --------- | -------------------------------- |
>>>>>>> dev
| employees | address[] | The array of employees of admin. |

### getNameOfEmployee

```solidity
function getNameOfEmployee(address employeeAddress) external view returns (string name)
```

Returns the name of employee.

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
>>>>>>> dev
| employeeAddress | address | Address of employee. |

#### Returns

<<<<<<< HEAD
| Name | Type | Description |
|---|---|---|
=======
| Name | Type   | Description           |
| ---- | ------ | --------------------- |
>>>>>>> dev
| name | string | The name of employee. |

### getSalariesIdByEmployeeAndAdmin

```solidity
function getSalariesIdByEmployeeAndAdmin(address employeeAddress, address adminAddress) external view returns (uint256[] salaries)
```

Returns array of salaries of employee.

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| adminAddress | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
=======
#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
| employeeAddress | address | Address of employee. |
| adminAddress    | address | undefined            |

#### Returns

| Name     | Type      | Description                    |
| -------- | --------- | ------------------------------ |
>>>>>>> dev
| salaries | uint256[] | Array of salaries of employee. |

### getSalaryById

```solidity
function getSalaryById(uint256 salaryId) external view returns (struct ISalary.SalaryInfo salary)
```

Returns salary by ID.

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
=======
#### Parameters

| Name     | Type    | Description       |
| -------- | ------- | ----------------- |
>>>>>>> dev
| salaryId | uint256 | Id of SalaryInfo. |

#### Returns

<<<<<<< HEAD
| Name | Type | Description |
|---|---|---|
=======
| Name   | Type               | Description       |
| ------ | ------------------ | ----------------- |
>>>>>>> dev
| salary | ISalary.SalaryInfo | SalaryInfo by ID. |

### removeEmployee

```solidity
function removeEmployee(address employeeAddress) external nonpayable
```

Removes employee.

<<<<<<< HEAD
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
>>>>>>> dev
| employeeAddress | address | Address of employee. |

### removeNameFromEmployee

```solidity
function removeNameFromEmployee(address employeeAddress) external nonpayable
```

Removes name from employee.

<<<<<<< HEAD
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description          |
| --------------- | ------- | -------------------- |
>>>>>>> dev
| employeeAddress | address | Address of employee. |

### removeSalaryFromEmployee

```solidity
function removeSalaryFromEmployee(uint256 salaryId) external nonpayable
```

Removes salary from employee.

<<<<<<< HEAD
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
=======
_Only admin can call this method._

#### Parameters

| Name     | Type    | Description            |
| -------- | ------- | ---------------------- |
>>>>>>> dev
| salaryId | uint256 | ID of employee salary. |

### setNameToEmployee

```solidity
function setNameToEmployee(address employeeAddress, string name) external nonpayable
```

Sets new or changes current name of the employee.

<<<<<<< HEAD
*Only admin can call this method.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress | address | Address of employee. |
| name | string | New name of employee. |
=======
_Only admin can call this method._

#### Parameters

| Name            | Type    | Description           |
| --------------- | ------- | --------------------- |
| employeeAddress | address | Address of employee.  |
| name            | string  | New name of employee. |
>>>>>>> dev

### withdrawSalary

```solidity
function withdrawSalary(uint256 salaryId) external nonpayable
```

Withdraws employee&#39;s salary.

<<<<<<< HEAD
*Anyone can call this method. No restrictions.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| salaryId | uint256 | IDs of employee salaries. |



=======
_Anyone can call this method. No restrictions._

#### Parameters

| Name     | Type    | Description               |
| -------- | ------- | ------------------------- |
| salaryId | uint256 | IDs of employee salaries. |

>>>>>>> dev
## Events

### EmployeeAdded

```solidity
event EmployeeAdded(address indexed employeeAddress, address indexed adminAddress)
```

Emits when user was added to Employees of Admin

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
=======
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| adminAddress `indexed`    | address | undefined   |
>>>>>>> dev

### EmployeeNameChanged

```solidity
event EmployeeNameChanged(address indexed employeeAddress, string indexed name)
```

Emits when Employee&#39;s name was added or changed

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| name `indexed` | string | undefined |
=======
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| name `indexed`            | string  | undefined   |
>>>>>>> dev

### EmployeeNameRemoved

```solidity
event EmployeeNameRemoved(address indexed employeeAddress)
```

Emits when name was removed from Employee

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
=======
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
>>>>>>> dev

### EmployeeRemoved

```solidity
event EmployeeRemoved(address indexed employeeAddress, address indexed adminAddress)
```

Emits when user was removed from Employees of Admin

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
=======
#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| employeeAddress `indexed` | address | undefined   |
| adminAddress `indexed`    | address | undefined   |
>>>>>>> dev

### EmployeeSalaryAdded

```solidity
event EmployeeSalaryAdded(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when salary was added to Employee

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
=======
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
>>>>>>> dev

### EmployeeSalaryClaimed

```solidity
event EmployeeSalaryClaimed(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when Employee withdraws salary

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |
=======
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
>>>>>>> dev

### EmployeeSalaryRemoved

```solidity
event EmployeeSalaryRemoved(address indexed employeeAddress, address indexed adminAddress, ISalary.SalaryInfo indexed salary)
```

Emits when salary was removed from Employee

<<<<<<< HEAD


#### Parameters

| Name | Type | Description |
|---|---|---|
| employeeAddress `indexed` | address | undefined |
| adminAddress `indexed` | address | undefined |
| salary `indexed` | ISalary.SalaryInfo | undefined |



=======
#### Parameters

| Name                      | Type               | Description |
| ------------------------- | ------------------ | ----------- |
| employeeAddress `indexed` | address            | undefined   |
| adminAddress `indexed`    | address            | undefined   |
| salary `indexed`          | ISalary.SalaryInfo | undefined   |
>>>>>>> dev
