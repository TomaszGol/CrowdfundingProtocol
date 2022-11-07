//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./interfaces/IFundRaisingFactory.sol";
import "./ProjectFundRaising.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract FundRaisingFactory is IFundRaisingFactory, Ownable {
    using Counters for Counters.Counter;

    uint256 internal feeSetting;
    address internal defaultOwner;

    mapping(uint256 => ProjectFundRaising) public projectsCreated;
    Counters.Counter private _tokenIdTracker;

    constructor(uint256 _fee) {
        feeSetting = _fee;
        defaultOwner = msg.sender;

        _tokenIdTracker.increment();
    }

    function changeFee(uint256 newFee) external onlyOwner {
        uint256 currentFee = feeSetting;
        feeSetting = newFee;

        emit FeeChanged(currentFee, feeSetting);
    }

    function changeOwner(address newOwner) external onlyOwner {
        address currentOwner = defaultOwner;
        defaultOwner = newOwner;

        transferOwnership(newOwner);

        emit OwnerChanged(currentOwner, defaultOwner);
    }

    function createProject(
        string memory _title,
        uint256 _backAmount,
        uint256 _expires,
        string memory tokenName,
        string memory tokenSymbol
    ) external payable override {
        uint256 projectId = _tokenIdTracker.current();
        ProjectFundRaising newProject = new ProjectFundRaising(
            projectId,
            _title,
            _backAmount,
            _expires,
            tokenName,
            tokenSymbol
        );
        //Take fee
        uint256 fee = (_backAmount * feeSetting) / 100;
        require(
            msg.value >= fee,
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

    function isProjectExists(uint256 projectId)
        external
        view
        override
        returns (bool)
    {
        if (address(projectsCreated[projectId]) != address(0)) {
            return true;
        } else {
            return false;
        }
    }

    function getCurrentFee() external view returns (uint256) {
        return feeSetting;
    }

    function getCurrentOwner() external view returns (address) {
        return defaultOwner;
    }

    function getProjectWithId(uint256 projectId)
        external
        view
        returns (ProjectFundRaising)
    {
        return projectsCreated[projectId];
    }
}
