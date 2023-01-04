//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AbstractContractControlList.sol";

contract ContractControlList is AccessControl, AbstractContractControlList {
    constructor(address admin) {
        _setupRole(FUND_RAISING_ADMIN, admin);
        _setupRole(FUND_RAISING_MODERATOR, admin);
    }

    function hasFundRaisingAdminRole(address addr)
        external
        view
        override
        returns (bool)
    {
        return hasRole(FUND_RAISING_ADMIN, addr);
    }

    function hasFundRaisingModeratorRole(address addr)
        external
        view
        override
        returns (bool)
    {
        return hasRole(FUND_RAISING_MODERATOR, addr);
    }

    modifier onlyAdminRole(address addr) {
        require(
            hasRole(FUND_RAISING_ADMIN, addr),
            "ContractControlList: Caller is not the admin"
        );
        _;
    }

    function giveModeratorRole(address to) external onlyAdminRole(msg.sender) {
        _setupRole(FUND_RAISING_MODERATOR, to);
    }

    function revokeModeratorRole(address to)
        external
        onlyAdminRole(msg.sender)
    {
        _revokeRole(FUND_RAISING_MODERATOR, to);
    }
}
