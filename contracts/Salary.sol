// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract Salary {

    struct Salary {
        uint256 id;
        uint256 periodDuration;
        uint256 amountOfPeriods;
        uint256 amountOfWithdrawals;
        address tokenAddress;
        uint256 totalTokenAmount;
        uint256 tokensAmountPerPeriod;
        uint256 lastWithdrawalTime;
    }

    mapping(address => string) private names;
    mapping(address => address[]) private adminToEmployees;
    mapping(address => address[]) private employeeToAdmins;
    mapping(uint256 => Salary) private salaryById;
    mapping(address => Salary) private employeeToSalary;
    mapping(Salary.id => address) private salaryIdToEmployee;

    event EmployeeAdded(uint256 indexed employeeAddress, uint256 indexed adminAddress);
    event EmployeeRemoved(uint256 indexed employeeAddress, uint256 indexed adminAddress);
    event EmployeeNameChanged(uint256 indexed employeeAddress, string indexed name);
    event EmployeeNameRemoved(uint256 indexed employeeAddress, string indexed name);
    event EmployeeSalaryAdded(uint256 indexed employeeAddress, Salary indexed salary);
    event EmployeeSalaryRemoved(uint256 indexed employeeAddress, Salary indexed salary);

    function getNameOfEmployee(address employeeAddress) external returns(string name);
    function getEmployeesByAdmin(address adminAddress) external returns(address[] employees);
    function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) external returns(bool isEmployee);
    function getAdminsByEmployee(address employeeAddress) external returns(address[] admins);
    function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) external returns(bool isAdmin);
    function getSalariesByEmployee(address employeeAddress) external returns(Salary[] salaries);
    function getEmployeeBySalary(address salaryId) external returns(address employee);
    function getSalaryById(address salaryId) external returns(Salary salary);

    function addEmployee(address _employeeAddress) external onlyAdmin;
    function removeEmployee(address _employeeAddress) external onlyAdmin;
    function addNameToEmployee(address _employeeAddress, string _name) external onlyAdmin;
    function removeNameFromEmployee(address _employeeAddress) external onlyAdmin;
    function addSalaryToEmployee(address _employeeAddress, Salary _salary) external onlyAdmin;
    function removeSalaryFromEmployee(address _employeeAddress, uint256 _salaryId) external onlyAdmin;
    function withdrawSalary(uint256 [] _salaryId) external;
}