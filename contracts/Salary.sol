// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;


import "./interfaces/IBentureAdmin.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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

    event EmployeeAdded(address indexed employeeAddress, address indexed adminAddress);
    event EmployeeRemoved(address indexed employeeAddress, address indexed adminAddress);
    event EmployeeNameChanged(address indexed employeeAddress, string indexed name);
    event EmployeeNameRemoved(address indexed employeeAddress);
    event EmployeeSalaryAdded(address indexed employeeAddress, address indexed adminAddress, SalaryInfo indexed salary);
    event EmployeeSalaryRemoved(address indexed employeeAddress, address indexed adminAddress, SalaryInfo indexed salary);
    event EmployeeSalaryClaimed(address indexed employeeAddress, address indexed adminAddress, SalaryInfo indexed salary);

    modifier onlyAdmin() {
        IBentureAdmin(bentureAdminToken).checkOwner(msg.sender);
        _;
    }

    constructor(address adminTokenAddress) {
       bentureAdminToken = adminTokenAddress;
    }

    function getNameOfEmployee(address employeeAddress) external view returns(string memory name) {
        return names[employeeAddress];
    }

    function getEmployeesByAdmin(address adminAddress) public view returns(address[] memory employees) {
        return adminToEmployees[adminAddress];
    }

    function checkIfUserIsEmployeeOfAdmin(address adminAddress, address employeeAddress) public view returns(bool isEmployee) {
        bool isEmployee = false;
        if (adminToEmployees[adminAddress].length > 0) {
            for (uint256 i = 0; i <= adminToEmployees[adminAddress].length - 1; i++) {
                if (adminToEmployees[adminAddress][i] == employeeAddress) {
                    isEmployee = true;
                    break;
                }
            }
        }
        return isEmployee;
    }

    function getAdminsByEmployee(address employeeAddress) external view returns(address[] memory admins) {
        return employeeToAdmins[employeeAddress];
    }

    function checkIfUserIsAdminOfEmployee(address employeeAddress, address adminAddress) public view returns(bool isAdmin) {
        bool isAdmin = false;
        if (employeeToAdmins[employeeAddress].length > 0) {
            for (uint256 i = 0; i <= employeeToAdmins[employeeAddress].length - 1; i++) {
                if (employeeToAdmins[employeeAddress][i] == adminAddress) {
                    isAdmin = true;
                    break;
                }
            }
        }
        return isAdmin;
    }

    function getSalariesByEmployee(address employeeAddress) public view returns(SalaryInfo[] memory salaries) {
        return employeeToSalaries[employeeAddress];
    }

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
        require(checkIfUserIsEmployeeOfAdmin(msg.sender, employeeAddress), "Already not an employee");
        if(employeeToSalaries[employeeAddress].length > 0) {
            for (uint256 i = 0; i <= employeeToSalaries[employeeAddress].length - 1; i++) {
                if(employeeToSalaries[employeeAddress][i].employer == msg.sender) {
                    removeSalaryFromEmployee(employeeToSalaries[employeeAddress][i].id); 
                }
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
        require(ERC20(tokenAddress).allowance(msg.sender, address(this)) >= totalTokenAmount, "Not enough tokens allowed");
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
        emit EmployeeSalaryAdded(employeeAddress, msg.sender, _salary);
    }

    /// @dev Fix removal method
    function removeSalaryFromEmployee(uint256 salaryId) public onlyAdmin {
        SalaryInfo memory _salary = salaryById[salaryId];
        require(!checkIfUserIsAdminOfEmployee(_salary.employee, msg.sender), "Not an admin for employee");
        require(_salary.employer == msg.sender, "Not an admin of salary");

        if (_salary.amountOfWithdrawals != _salary.amountOfPeriods) {
            uint256 amountToPay;
            
            if ((block.timestamp - _salary.lastWithdrawalTime) / _salary.periodDuration < _salary.amountOfPeriods - _salary.amountOfWithdrawals) {
                amountToPay = (_salary.tokensAmountPerPeriod * (block.timestamp - _salary.lastWithdrawalTime) / _salary.periodDuration); 
            } else {
                amountToPay = _salary.tokensAmountPerPeriod * (_salary.amountOfPeriods - _salary.amountOfWithdrawals);
            }

            uint256 excedeedAllowance = _salary.totalTokenAmount - (amountToPay + (_salary.amountOfWithdrawals * _salary.tokensAmountPerPeriod));

            ERC20(_salary.tokenAddress).decreaseAllowance(_salary.employee, excedeedAllowance);
            ERC20(_salary.tokenAddress).transferFrom(msg.sender, _salary.employee, amountToPay);
        }
        
        uint256 lastIndex = employeeToSalaries[_salary.employee].length - 1;
        for (uint256 i = 0; i <= lastIndex; i++) {
            if (employeeToSalaries[_salary.employee][i].id == salaryId) {
                employeeToSalaries[_salary.employee][i] = employeeToSalaries[_salary.employee][lastIndex];
                employeeToSalaries[_salary.employee].pop();
                break;
            }
        }
    }

    function withdrawSalary(uint256 salaryId) external {
        SalaryInfo memory _salary = salaryById[salaryId];
        require(_salary.employee == msg.sender, "Not employee for this salary");
        uint256 periodsToPay = (block.timestamp - _salary.lastWithdrawalTime) / _salary.periodDuration;
        if (periodsToPay + _salary.amountOfWithdrawals >= _salary.amountOfPeriods) {
            periodsToPay = _salary.amountOfPeriods - _salary.amountOfWithdrawals;
        }

        if (periodsToPay != 0) {
            ERC20(_salary.tokenAddress).transferFrom(_salary.employer, _salary.employee, periodsToPay * _salary.tokensAmountPerPeriod);

            uint256 lastIndex = employeeToSalaries[msg.sender].length - 1;
            uint256 salaryIndex = 0;
            for (uint256 i = 0; i <= lastIndex; i++) {
                if (employeeToSalaries[msg.sender][i].id == salaryId) {
                    salaryIndex = i;
                    break;
                }
            }   
            employeeToSalaries[msg.sender][salaryIndex].amountOfWithdrawals = _salary.amountOfWithdrawals + periodsToPay;
            employeeToSalaries[msg.sender][salaryIndex].lastWithdrawalTime = block.timestamp;
            emit EmployeeSalaryClaimed(_salary.employee, _salary.employer, employeeToSalaries[msg.sender][salaryIndex]);
        }
    }
}