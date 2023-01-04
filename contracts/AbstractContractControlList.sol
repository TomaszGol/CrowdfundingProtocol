//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/IAccessControl.sol";

abstract contract AbstractContractControlList is IAccessControl {
    bytes32 public constant FUND_RAISING_ADMIN =
        keccak256("FUND_RAISING_ADMIN");

    bytes32 public constant FUND_RAISING_MODERATOR =
        keccak256("FUND_RAISING_MODERATOR");

    function hasFundRaisingAdminRole(address addr)
        external
        view
        virtual
        returns (bool);

    function hasFundRaisingModeratorRole(address addr)
        external
        view
        virtual
        returns (bool);
}
