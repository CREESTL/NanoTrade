// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/// @title An interface of a Salary contract.
interface ISalary {
    struct SalaryInfo {
        uint256 id;
        uint256 periodDuration;
        uint256 amountOfPeriods;
        uint256 amountOfWithdrawals;
        address tokenAddress;
        uint256 totalTokenAmount;
        uint256 tokensAmountPerPeriod;
        uint256 lastWithdrawalTime;
    }

    /// @dev Indicates that a new employee was added.
    event EmployeeAdded(uint256 indexed employeeAddress, uint256 indexed adminAddress);

    /// @dev Indicates that an employee was removed.
    event EmployeeRemoved(uint256 indexed employeeAddress, uint256 indexed adminAddress);

    /// @dev Indicates that an employee's name was changed.
    event EmployeeNameChanged(uint256 indexed employeeAddress, string indexed name);

    /// @dev Indicates that an employee's name was removed.
    event EmployeeNameRemoved(uint256 indexed employeeAddress, string indexed name);

    /// @dev Indicates that an employee's salary was added.
    event EmployeeSalaryAdded(uint256 indexed employeeAddress, SalaryInfo indexed salary);

    /// @dev Indicates that an employee's salary was removed.
    event EmployeeSalaryRemoved(uint256 indexed employeeAddress, SalaryInfo indexed salary);

    /// @notice Returns the name of employee.
    /// @param employeeAddress Address of employee.
    /// @return name The name of employee.
    function getNameOfEmployee(address employeeAddress) external returns(string memory name);

    /// @notice Returns the array of employees of admin.
    /// @param adminAddress Address of admin.
    /// @return employees The array of employees of admin.
    function getEmployeesByAdmin(address adminAddress) external returns(address[] memory employees);

    /// @notice Returns true if user if employee for admin and False if not.
    /// @param adminAddress Address of admin.
    /// @param employeeAddress Address of employee.
    /// @return isEmployee True if user if employee for admin. False if not.
    function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external returns(bool isEmployee);

    /// @notice Returns the array of admins of employee.
    /// @param employeeAddress Address of employee.
    /// @return admins The array of admins of employee.
    function getAdminsByEmployee(address employeeAddress) external returns(address[] memory admins);

    /// @notice Returns true if user if admin for employee and False if not.
    /// @param employeeAddress Address of employee.
    /// @param adminAddress Address of admin.
    /// @return isAdmin True if user if admin for employee. False if not.
    function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external returns(bool isAdmin);

    /// @notice Returns array of salaries of employee.
    /// @param employeeAddress Address of employee.
    /// @return salaries Array of salaries of employee.
    function getSalariesByEmployee(address employeeAddress) external returns(SalaryInfo[] memory salaries);

    /// @notice Returns employee by salary ID.
    /// @param salaryId Id of SalaryInfo.
    /// @return employee Employee address.
    function getEmployeeBySalary(address salaryId) external returns(address employee);

    /// @notice Returns salary by ID.
    /// @param salaryId Id of SalaryInfo.
    /// @return salary SalaryInfo by ID.
    function getSalaryById(address salaryId) external returns(SalaryInfo memory salary);

    /// @notice Adds new employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function addEmployee(address employeeAddress) external;

    /// @notice Removes employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function removeEmployee(address employeeAddress) external;

    /// @notice Adds new name to employee.
    /// @param employeeAddress Address of employee.
    /// @param name New name of employee.
    /// @dev Only admin can call this method.
    function addNameToEmployee(address employeeAddress, string memory name) external;

    /// @notice Removes name from employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function removeNameFromEmployee(address employeeAddress) external;

    /// @notice Adds salary to employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function addSalaryToEmployee(address employeeAddress, SalaryInfo memory salary) external;

    /// @notice Removes salary from employee.
    /// @param employeeAddress Address of employee.
    /// @param salaryId ID of employee salary.
    /// @dev Only admin can call this method.
    function removeSalaryFromEmployee(address employeeAddress, uint256 salaryId) external;

    /// @notice Withdraws employee's salary.
    /// @param salaryId IDs of employee salaries.
    /// @dev Anyone can call this method. No restrictions.
    function withdrawSalary(uint256[]  memory salaryId) external;
}