//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./interfaces/IFundRaisingFactory.sol";
import "./ProjectFundRaising.sol";
import "./ContractControlList.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FundRaisingFactory is IFundRaisingFactory {
    using Counters for Counters.Counter;

    ContractControlList internal ccl;

    uint256 public feeSetting;
    address public defaultOwner;

    mapping(uint256 => ProjectFundRaising) public projectsCreated;

    Counters.Counter private _tokenIdTracker;

    constructor(ContractControlList _ccl, uint256 _fee) {
        ccl = _ccl;
        feeSetting = _fee;
        defaultOwner = msg.sender;

        _tokenIdTracker.increment();
    }

    modifier onlyAdminRole(address addr) {
        require(
            ccl.hasFundRaisingAdminRole(addr),
            "FundRaisingFactory: Caller is not the owner"
        );
        _;
    }

    modifier onlyAdminOrModeratorRole(address addr) {
        require(
            ccl.hasFundRaisingAdminRole(addr) ||
                ccl.hasFundRaisingModeratorRole(addr),
            "FundRaisingFactory: Caller is not the owner nor moderator"
        );
        _;
    }

    function changeFee(uint256 newFee) external onlyAdminRole(msg.sender) {
        uint256 currentFee = feeSetting;
        feeSetting = newFee;

        emit FeeChanged(currentFee, feeSetting);
    }

    // function changeOwner(address newOwner) external onlyAdminRole(msg.sender) {
    //     require(
    //         newOwner != address(0),
    //         "FundRaisingFactory: Cannot transfer ownership to addres 0"
    //     );
    //     address currentOwner = defaultOwner;
    //     defaultOwner = newOwner;

    //     ccl.grantRole(ccl.FUND_RAISING_ADMIN(), newOwner);
    //     ccl.revokeRole(ccl.FUND_RAISING_ADMIN(), currentOwner);

    //     emit OwnerChanged(currentOwner, defaultOwner);
    // }

    function createProject(
        string calldata _title,
        uint256 _backAmount,
        uint256 _expires,
        string calldata _tokenName,
        string calldata _tokenSymbol
    ) external payable override {
        require(
            _expires <= block.timestamp + 2629743,
            "FundRaisingFactory: Expiration date cannot be longer than a one month"
        );
        uint256 projectId = _tokenIdTracker.current();

        ProjectFundRaising newProject = new ProjectFundRaising(
            msg.sender,
            projectId,
            _title,
            _backAmount,
            _expires,
            _tokenName,
            _tokenSymbol
        );
        //Take fee
        uint256 feeValue;
        unchecked {
            feeValue = (_backAmount * feeSetting) / 100;
        }
        require(
            msg.value >= feeValue,
            "FundRaisingFactory: Message value is lower than fee"
        );
        payable(defaultOwner).transfer(msg.value);

        projectsCreated[projectId] = newProject;
        _tokenIdTracker.increment();

        emit ProjectCreated(
            projectId,
            address(newProject),
            _title,
            _expires,
            _backAmount
        );
    }

    function isProjectExists(uint256 projectId) external view returns (bool) {
        if (address(projectsCreated[projectId]) != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    function cancelProject(uint256 projectId)
        external
        override
        onlyAdminOrModeratorRole(msg.sender)
    {
        ProjectFundRaising project = projectsCreated[projectId];
        project.cancelProject();
    }

    function verifyProject(uint256 projectId)
        external
        override
        onlyAdminOrModeratorRole(msg.sender)
    {
        ProjectFundRaising project = projectsCreated[projectId];
        project.verifyProject();
    }
}
