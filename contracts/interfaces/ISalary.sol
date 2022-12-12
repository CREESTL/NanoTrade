// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/// @title An interface of a Salary contract.
interface ISalary {
    /// @dev Indicates that a new employee was added.
    event EmployeeAdded(uint256 indexed employeeAddress, uint256 indexed adminAddress);

    /// @dev Indicates that an employee was removed.
    event EmployeeRemoved(uint256 indexed employeeAddress, uint256 indexed adminAddress);

    /// @dev Indicates that an employee's name was changed.
    event EmployeeNameChanged(uint256 indexed employeeAddress, string indexed name);

    /// @dev Indicates that an employee's name was removed.
    event EmployeeNameRemoved(uint256 indexed employeeAddress, string indexed name);

    /// @dev Indicates that an employee's salary was added.
    event EmployeeSalaryAdded(uint256 indexed employeeAddress, Salary indexed salary);

    /// @dev Indicates that an employee's salary was removed.
    event EmployeeSalaryRemoved(uint256 indexed employeeAddress, Salary indexed salary);

    /// @notice Returns the name of employee.
    /// @param employeeAddress Address of employee.
    /// @return name The name of employee.
    function getNameOfEmployee(address employeeAddress) external returns(string name);

    /// @notice Returns the array of employees of admin.
    /// @param adminAddress Address of admin.
    /// @return employees The array of employees of admin.
    function getEmployeesByAdmin(address adminAddress) external returns(address[] employees);

    /// @notice Returns true if user if employee for admin and False if not.
    /// @param adminAddress Address of admin.
    /// @param employeeAddress Address of employee.
    /// @return isEmployee True if user if employee for admin. False if not.
    function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external returns(bool isEmployee);

    /// @notice Returns the array of admins of employee.
    /// @param employeeAddress Address of employee.
    /// @return admins The array of admins of employee.
    function getAdminsByEmployee(address employeeAddress) external returns(address[] admins);

    /// @notice Returns true if user if admin for employee and False if not.
    /// @param employeeAddress Address of employee.
    /// @param adminAddress Address of admin.
    /// @return isEmployee True if user if admin for employee. False if not.
    function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external returns(bool isAdmin);

    /// @notice Returns array of salaries of employee.
    /// @param employeeAddress Address of employee.
    /// @return salaries Array of salaries of employee.
    function getSalariesByEmployee(address employeeAddress) external returns(Salary[] salaries);

    /// @notice Returns employee by salary ID.
    /// @param salatyId Id of Salary.
    /// @return employee Employee address.
    function getEmployeeBySalary(address salaryId) external returns(address employee);

    /// @notice Returns salary by ID.
    /// @param salatyId Id of Salary.
    /// @return salary Salary by ID.
    function getSalaryById(address salaryId) external returns(Salary salary);

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
    function addNameToEmployee(address employeeAddress, string name) external;

    /// @notice Removes name from employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function removeNameFromEmployee(address employeeAddress) external;

    /// @notice Adds salary to employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function addSalaryToEmployee(address employeeAddress, Salary salary) external;

    /// @notice Removes salary from employee.
    /// @param employeeAddress Address of employee.
    /// @param salaryId ID of employee salary.
    /// @dev Only admin can call this method.
    function removeSalaryFromEmployee(address employeeAddress, uint256 salaryId) external;

    /// @notice Withdraws employee's salary.
    /// @param salaryId IDs of employee salaries.
    /// @dev Anyone can call this method. No restrictions.
    function withdrawSalary(uint256 [] salaryId) external;
}