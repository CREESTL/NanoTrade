// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;


import "./interfaces/IBentureAdmin.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//include IERC20
contract Salary {
    struct SalaryInfo {
        uint256 id;
        uint256 periodDuration;
        uint256 amountOfPeriods;
        uint256 amountOfWithdrawals;
        address tokenAddress;
        uint256 totalTokenAmount;
        uint256 tokensAmountPerPeriod;
        uint256 lastWithdrawalTime;
        address employer;
        address employee;
    }

    uint256 private lastSalaryId;
    address private bentureAdminToken;

    mapping(address => string) private names;
    mapping(address => address[]) private adminToEmployees;
    mapping(address => address[]) private employeeToAdmins;
    mapping(uint256 => SalaryInfo) private salaryById;
    mapping(address => SalaryInfo[]) private employeeToSalaries;
    //mapping(uint256 => address) private salaryIdToEmployee;
    //mapping(uint256 => address) private salaryIdToEmployer;

    event EmployeeAdded(address indexed employeeAddress, address indexed adminAddress);
    event EmployeeRemoved(address indexed employeeAddress, address indexed adminAddress);
    event EmployeeNameChanged(address indexed employeeAddress, string indexed name);
    event EmployeeNameRemoved(address indexed employeeAddress);
    event EmployeeSalaryAdded(address indexed employeeAddress, address indexed adminAddress, SalaryInfo indexed salary);
    event EmployeeSalaryRemoved(address indexed employeeAddress, address indexed adminAddress, SalaryInfo indexed salary);

    modifier onlyAdmin() {
        IBentureAdmin(bentureAdminToken).checkOwner(msg.sender);
        _;
    }

    constructor(address tokenAddress) {
       bentureAdminToken = tokenAddress;
    }

    function getNameOfEmployee(address employeeAddress) external returns(string memory name) {
        return names[employeeAddress];
    }

    function getEmployeesByAdmin(address adminAddress) public view returns(address[] memory employees) {
        return adminToEmployees[adminAddress];
    }

    function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) public view returns(bool isEmployee) {
        bool isEmployee = false;
        for (uint256 i = 0; i <= adminToEmployees[adminAddress].length - 1; i++) {
            if (adminToEmployees[adminAddress][i] == employeeAddress) {
                isEmployee = true;
                break;
            }
        }
        return isEmployee;
    }

    function getAdminsByEmployee(address employeeAddress) external view returns(address[] memory admins) {
        return employeeToAdmins[employeeAddress];
    }

    function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) public view returns(bool isAdmin) {
        bool isAdmin = false;
        for (uint256 i = 0; i <= employeeToAdmins[employeeAddress].length - 1; i++) {
            if (employeeToAdmins[employeeAddress][i] == adminAddress) {
                isAdmin = true;
                break;
            }
        }
        return isAdmin;
    }

    function getSalariesByEmployee(address employeeAddress) public view returns(SalaryInfo[] memory salaries) {
        return employeeToSalaries[employeeAddress];
    }

    /* function getEmployeeBySalaryId(uint256 salaryId) public view returns(address employee) {
        return salaryIdToEmployee[salaryId];
    } */

    function getSalaryById(uint256 salaryId) public view returns(SalaryInfo memory salary) {
        return salaryById[salaryId];
    }

    function addEmployee(address employeeAddress) external onlyAdmin {
        require(!checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender), "User already is employee");
        adminToEmployees[msg.sender].push(employeeAddress);
        employeeToAdmins[employeeAddress].push(msg.sender);
        emit EmployeeAdded(employeeAddress, msg.sender);
    }

    function removeEmployee(address employeeAddress) external onlyAdmin {
        for (uint256 i = 0; employeeToSalaries[employeeAddress].length - 1; i++) {
            if(employeeToSalaries[employeeAddress][i].employer == msg.sender) {
                removeSalaryFromEmployee(employeeAddress, employeeToSalaries[employeeAddress][i].salaryId); 
            }
        }

        uint256 lastIndex = adminToEmployees[msg.sender].length - 1;
        for (uint256 i = 0; i <= lastIndex; i++) {
            if (adminToEmployees[msg.sender][i] == employeeAddress) {
                adminToEmployees[msg.sender][i] = adminToEmployees[msg.sender][lastIndex];
                adminToEmployees[msg.sender].pop();
                break;
            }
        }

        lastIndex = employeeToAdmins[employeeAddress].length - 1;
        for (uint256 i = 0; i <= lastIndex; i++) {
            if (employeeToAdmins[employeeAddress][i] == msg.sender) {
                employeeToAdmins[employeeAddress][i] = employeeToAdmins[employeeAddress][lastIndex];
                employeeToAdmins[employeeAddress].pop();
                emit EmployeeRemoved(employeeAddress, msg.sender);
                break;
            }
        }
    }

    function setNameToEmployee(address employeeAddress, string memory name) external onlyAdmin {
        require(checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender), "Not allowed to set name");
        names[employeeAddress] = name;
        emit EmployeeNameChanged(employeeAddress, name);
    }

    function removeNameFromEmployee(address employeeAddress) external onlyAdmin {
        require(checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender), "Not allowed to remove name");
        delete names[employeeAddress];
        emit EmployeeNameRemoved(employeeAddress);
    }

    function addSalaryToEmployee(
        address employeeAddress, 
        uint256 periodDuration,
        uint256 amountOfPeriods,
        address tokenAddress,
        uint256 totalTokenAmount,
        uint256 tokensAmountPerPeriod
    ) external onlyAdmin {
        require(IERC20(tokenAddress).allowance(msg.sender, employeeAddress) >= totalTokenAmount, "Not enough tokens allowed");
        SalaryInfo memory _salary;
        lastSalaryId++;
        _salary.id = lastSalaryId;
        _salary.periodDuration = periodDuration;
        _salary.amountOfPeriods = amountOfPeriods;
        _salary.amountOfWithdrawals = 0;
        _salary.tokenAddress = tokenAddress;
        _salary.totalTokenAmount = totalTokenAmount;
        _salary.tokensAmountPerPeriod = tokensAmountPerPeriod;
        _salary.lastWithdrawalTime = block.timestamp;
        _salary.employer = msg.sender;
        _salary.employee= employeeAddress;
        employeeToSalaries[employeeAddress].push(_salary);
        salaryById[_salary.id] = _salary;
        //salaryIdToEmployee[employeeAddress] = _salary.id;
        //salaryIdToEmployer[msg.sender] = _salary.id;
        emit EmployeeSalaryAdded(employeeAddress, msg.sender, _salary);
    }

/// Проверить что зарплата принадлежит этому пользователю
    function removeSalaryFromEmployee(address employeeAddress, uint256 salaryId) external onlyAdmin {
        require(!checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender), "Not an admin for employee");
        require(salaryById[salaryId].employer == msg.sender, "Not an admin of salary")
        require(salaryById[salaryId].employee == employeeAddress, "Not an employee of salary")
        //require(salaryIdToEmployer[salaryId] == msg.sender, "Not an admin of salary");

        SalaryInfo _salary = salaryById[salaryId];
        //(tokensAmountPerPeriod / periodDuration) * (block.timestamp - _salary.lastWithdrawalTime)
        if block.timestamp >= 
        uint256 amountToPay = (tokensAmountPerPeriod / periodDuration) * (block.timestamp - _salary.lastWithdrawalTime)
        amountOfWithdrawals < amountOfPeriods;
        //выплатить остаток зп


        uint256 lastIndex = employeeToSalaries[employeeAddress].length - 1;
        for (uint256 i = 0; i <= lastIndex; i++) {
            if (employeeToSalaries[employeeAddress][i].id == salaryId) {
                employeeToSalaries[employeeAddress][i] = employeeToSalaries[employeeAddress][lastIndex];
                employeeToSalaries[employeeAddress].pop();
                break;
            }
        }
    }

//array?
    function withdrawSalary(uint256 salaryId) external {
        //require(salaryIdToEmployee[salaryId] == msg.sender, "Not employee for this salary");
        require(salaryIdToEmployee[salaryId] == msg.sender, "Not employee for this salary");
        SalaryInfo _salary = salaryById[salaryId];
        if (_salary.lastWithdrawalTime >=)
    }
}