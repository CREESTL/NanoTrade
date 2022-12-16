// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./interfaces/IBentureAdmin.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title Salary contract. A contract to manage salaries 
contract Salary {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

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

    /// @dev Last added salary's ID
    uint256 private lastSalaryId;

    /// @dev Address of BentureAdmin Token
    address private bentureAdminToken;

    /// @dev Mapping from user address to his name
    mapping(address => string) private names;

    /// @dev Mapping from admins address to its array of employees
    mapping(address => EnumerableSet.AddressSet) private adminToEmployees;

    /// @dev Mapping from employee address to its array of admins
    mapping(address => EnumerableSet.AddressSet) private employeeToAdmins;

    /// @dev Mapping from salary ID to its info
    mapping(uint256 => SalaryInfo) private salaryById;

    /// @dev Mapping from Employee address to his Salaries
    mapping(address => EnumerableSet.UintSet) private employeeToSalaryId;


    /// @notice Emits when user was added to Employees of Admin
    event EmployeeAdded(
        address indexed employeeAddress,
        address indexed adminAddress
    );

    /// @notice Emits when user was removed from Employees of Admin
    event EmployeeRemoved(
        address indexed employeeAddress,
        address indexed adminAddress
    );

    /// @notice Emits when Employee's name was added or changed
    event EmployeeNameChanged(
        address indexed employeeAddress,
        string indexed name
    );

    /// @notice Emits when name was removed from Employee
    event EmployeeNameRemoved(address indexed employeeAddress);

    /// @notice Emits when salary was added to Employee
    event EmployeeSalaryAdded(
        address indexed employeeAddress,
        address indexed adminAddress,
        SalaryInfo indexed salary
    );

    /// @notice Emits when salary was removed from Employee
    event EmployeeSalaryRemoved(
        address indexed employeeAddress,
        address indexed adminAddress,
        SalaryInfo indexed salary
    );

    /// @notice Emits when Employee withdraws salary
    event EmployeeSalaryClaimed(
        address indexed employeeAddress,
        address indexed adminAddress,
        SalaryInfo indexed salary
    );

    /// @dev Uses to check if user is BentureAdmin tokens holder
    modifier onlyAdmin() {
        IBentureAdmin(bentureAdminToken).checkOwner(msg.sender);
        _;
    }

    /// @param adminTokenAddress The address of the BentureAdmin Token
    constructor(address adminTokenAddress) {
        require(adminTokenAddress != address(0), "Salary: Zero address!");
        bentureAdminToken = adminTokenAddress;
    }


    /// @notice Returns the name of employee.
    /// @param employeeAddress Address of employee.
    /// @return name The name of employee.
    function getNameOfEmployee(
        address employeeAddress
    ) external view returns (string memory name) {
        return names[employeeAddress];
    }

    /// @notice Returns the array of admins of employee.
    /// @param employeeAddress Address of employee.
    /// @return admins The array of admins of employee.
    function getAdminsByEmployee(
        address employeeAddress
    ) external view returns (address[] memory admins) {
        return employeeToAdmins[employeeAddress].values();
    }


    /// @notice Sets new or changes current name of the employee.
    /// @param employeeAddress Address of employee.
    /// @param name New name of employee.
    /// @dev Only admin can call this method.
    function setNameToEmployee(
        address employeeAddress,
        string memory name
    ) external onlyAdmin {
        require(
            checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender),
            "Salary: not allowed to set name!"
        );
        names[employeeAddress] = name;
        emit EmployeeNameChanged(employeeAddress, name);
    }

    /// @notice Removes name from employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function removeNameFromEmployee(
        address employeeAddress
    ) external onlyAdmin {
        require(
            checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender),
            "Salary: not allowed to remove name!"
        );
        delete names[employeeAddress];
        emit EmployeeNameRemoved(employeeAddress);
    }

    /// @notice Adds new employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function addEmployee(address employeeAddress) external onlyAdmin {
        require(
            !checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender),
            "Salary: user already is employee!"
        );
        adminToEmployees[msg.sender].add(employeeAddress);
        employeeToAdmins[employeeAddress].add(msg.sender);
        emit EmployeeAdded(employeeAddress, msg.sender);
    }

    /// @notice Removes employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function removeEmployee(address employeeAddress) external onlyAdmin {
        require(
            checkIfUserIsEmployeeOfAdmin(msg.sender, employeeAddress),
            "Salary: already not an employee!"
        );
        
        if (employeeToSalaryId[employeeAddress].length() > 0) {
        uint256[] memory id = employeeToSalaryId[employeeAddress].values();
            for (uint256 i = 0; i < employeeToSalaryId[employeeAddress].length(); i++) {
                if (salaryById[id[i]].employer == msg.sender) {
                    removeSalaryFromEmployee(id[i]);
                }
            }
        }

        adminToEmployees[msg.sender].remove(employeeAddress);
        employeeToAdmins[employeeAddress].remove(msg.sender);
    }

    /// @notice Withdraws employee's salary.
    /// @param salaryId IDs of employee salaries.
    /// @dev Anyone can call this method. No restrictions.
    function withdrawSalary(uint256 salaryId) external {
        SalaryInfo storage _salary = salaryById[salaryId];
        require(
            _salary.employee == msg.sender,
            "Salary: not employee for this salary!"
        );
        uint256 periodsToPay = (block.timestamp - _salary.lastWithdrawalTime) /
            _salary.periodDuration;
        if (
            periodsToPay + _salary.amountOfWithdrawals >=
            _salary.amountOfPeriods
        ) {
            periodsToPay =
                _salary.amountOfPeriods -
                _salary.amountOfWithdrawals;
        }

        if (periodsToPay != 0) {
            
            require(ERC20(_salary.tokenAddress).transferFrom(
                _salary.employer,
                _salary.employee,
                periodsToPay * _salary.tokensAmountPerPeriod
            ) == true, "Salary: Transfer failed");

            salaryById[salaryId].amountOfWithdrawals =
                _salary.amountOfWithdrawals +
                periodsToPay;
            salaryById[salaryId].lastWithdrawalTime = block.timestamp;

            emit EmployeeSalaryClaimed(
                _salary.employee,
                _salary.employer,
                salaryById[salaryId]
            );
        }
    }

    /// @notice Returns the array of employees of admin.
    /// @param adminAddress Address of admin.
    /// @return employees The array of employees of admin.
    function getEmployeesByAdmin(
        address adminAddress
    ) public view returns (address[] memory employees) {
        return adminToEmployees[adminAddress].values();
    }

    /// @notice Returns true if user is employee for admin and False if not.
    /// @param adminAddress Address of admin.
    /// @param employeeAddress Address of employee.
    /// @return isEmployee True if user is employee for admin. False if not.
    function checkIfUserIsEmployeeOfAdmin(
        address adminAddress,
        address employeeAddress
    ) public view returns (bool isEmployee) {
        return adminToEmployees[adminAddress].contains(employeeAddress);
    }

    /// @notice Returns true if user is admin for employee and False if not.
    /// @param employeeAddress Address of employee.
    /// @param adminAddress Address of admin.
    /// @return isAdmin True if user is admin for employee. False if not.
    function checkIfUserIsAdminOfEmployee(
        address employeeAddress,
        address adminAddress
    ) public view returns (bool isAdmin) {
        return employeeToAdmins[employeeAddress].contains(adminAddress);
    }

    /// @notice Returns array of salaries of employee.
    /// @param employeeAddress Address of employee.
    /// @return salaries Array of salaries of employee.
    function getSalariesIdByEmployee(
        address employeeAddress
    ) public view returns (uint256[] memory salaries) {
        return employeeToSalaryId[employeeAddress].values();
    }

    /// @notice Returns salary by ID.
    /// @param salaryId Id of SalaryInfo.
    /// @return salary SalaryInfo by ID.
    function getSalaryById(
        uint256 salaryId
    ) public view returns (SalaryInfo memory salary) {
        return salaryById[salaryId];
    }

    /// @notice Adds salary to employee.
    /// @param employeeAddress Address of employee.
    /// @dev Only admin can call this method.
    function addSalaryToEmployee(
        address employeeAddress,
        uint256 periodDuration,
        uint256 amountOfPeriods,
        address tokenAddress,
        uint256 totalTokenAmount,
        uint256 tokensAmountPerPeriod
    ) external onlyAdmin {
        require(
            checkIfUserIsAdminOfEmployee(employeeAddress, msg.sender),
            "Salary: not an admin for employee!"
        );
        require(
            ERC20(tokenAddress).allowance(msg.sender, address(this)) >=
                totalTokenAmount,
            "Salary: not enough tokens allowed!"
        );
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
        _salary.employee = employeeAddress;
        employeeToSalaryId[employeeAddress].add(_salary.id);
        salaryById[_salary.id] = _salary;
        emit EmployeeSalaryAdded(employeeAddress, msg.sender, _salary);
    }

    /// @notice Removes salary from employee.
    /// @param salaryId ID of employee salary.
    /// @dev Only admin can call this method.
    function removeSalaryFromEmployee(uint256 salaryId) public onlyAdmin {
        SalaryInfo memory _salary = salaryById[salaryId];
        require(
            checkIfUserIsAdminOfEmployee(_salary.employee, msg.sender),
            "Salary: not an admin for employee!"
        );
        require(
            _salary.employer == msg.sender,
            "Salary: not an admin of salary!"
        );

        if (_salary.amountOfWithdrawals != _salary.amountOfPeriods) {
            uint256 amountToPay;

            if (
                (block.timestamp - _salary.lastWithdrawalTime) /
                    _salary.periodDuration <
                _salary.amountOfPeriods - _salary.amountOfWithdrawals
            ) {
                amountToPay = ((_salary.tokensAmountPerPeriod *
                    (block.timestamp - _salary.lastWithdrawalTime)) /
                    _salary.periodDuration);
            } else {
                amountToPay =
                    _salary.tokensAmountPerPeriod *
                    (_salary.amountOfPeriods - _salary.amountOfWithdrawals);
            }

            require(ERC20(_salary.tokenAddress).transferFrom(
                msg.sender,
                _salary.employee,
                amountToPay
            ) == true, "Salary: Transfer failed");
        }

        employeeToSalaryId[_salary.employee].remove(salaryId);
        delete salaryById[_salary.id];
    }
}
