//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "./interfaces/IProjectFundRaising.sol";
import "./ERC20Token.sol";

import "hardhat/console.sol";

//TODO: ADD ROLES: owner of project and admin(can finish project)
contract ProjectFundRaising is IProjectFundRaising, Ownable {
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    EnumerableMap.AddressToUintMap internal backers;

    ERC20Token internal erc20token;

    mapping(address => uint256) internal backersMap;

    uint256 internal id;
    bytes internal title;
    address internal projectOwner;
    uint256 internal expires;
    uint256 internal backAmount;
    uint256 internal collectedAmount;
    bool internal finished;
    bool public withdrawedByOwner;

    //Propably Useless
    modifier isProjectOwner(address sender) {
        _isProjectOwner(sender);
        _;
    }

    function _isProjectOwner(address sender) internal view {
        require(
            sender == projectOwner,
            "ProjectFundRaising: Caller is not the owner"
        );
    }

    modifier projectNotFinished() {
        _projectNotFinished();
        _;
    }

    function _projectNotFinished() internal view {
        require(!finished, "ProjectFundRaising: Project is already finished");
        require(
            expires >= block.timestamp,
            "ProjectFundRaising: Project already expired"
        );
    }

    modifier fundsRaised() {
        _fundsRaised();
        _;
    }

    function _fundsRaised() internal view {
        require(
            collectedAmount >= backAmount,
            "ProjectFundRaising: Funds not raised"
        );
        require(
            finished,
            "ProjectFundRaising: Project is not already finished"
        );
    }

    modifier fundsNotRaised() {
        _fundsNotRaised();
        _;
    }

    function _fundsNotRaised() internal view {
        require(
            backAmount >= collectedAmount,
            "ProjectFundRaising: Funds raised"
        );
    }

    modifier projectExpired() {
        _projectExpired();
        _;
    }

    function _projectExpired() internal view {
        require(
            block.timestamp > expires,
            "ProjectFundRaising: Project not expired yet"
        );
    }

    modifier userBackedProject(address caller) {
        _userBackedProject(caller);
        _;
    }

    function _userBackedProject(address caller) internal view {
        require(
            backers.contains(caller),
            "ProjectFundRaising: User did not back project"
        );
    }

    modifier notWithdrawed() {
        _notWithdrawed();
        _;
    }

    function _notWithdrawed() internal view {
        require(
            !withdrawedByOwner,
            "ProjectFundRaising: Funds already withdrawed"
        );
    }

    constructor(
        uint256 _id,
        string memory _title,
        uint256 _backAmount,
        uint256 _expires,
        string memory tokenName,
        string memory tokenSymbol
    ) {
        bytes memory hashedTitle = abi.encode(_title);
        projectOwner = msg.sender;
        id = _id;
        title = hashedTitle;
        expires = _expires;
        backAmount = _backAmount;
        finished = false;
        withdrawedByOwner = false;

        //ERC20 Deploy
        erc20token = new ERC20Token(tokenName, tokenSymbol);

        //OLD ERC20 DEPLOY
        //     erc20token = new ERC20Token(
        //     tokenName,
        //     tokenSymbol,
        //     _backAmount,
        //     address(this)
        // );

        emit ProjectCreated(id, _title, backAmount, expires);
    }

    function backProject() external payable projectNotFinished {
        collectedAmount += msg.value;
        uint256 backValue = 0;

        (bool alreadyBacked, uint256 backedAmountBySender) = backers.tryGet(
            msg.sender
        );

        if (alreadyBacked) {
            backValue = backedAmountBySender + msg.value;
        } else {
            backValue = msg.value;
        }

        backersMap[msg.sender] = backValue;
        backers.set(msg.sender, backValue);

        if (collectedAmount >= backAmount) {
            finished = true;
        }

        //Transfer tokens to backer
        erc20token.mint(msg.sender, msg.value);

        emit ProjectBacked(msg.sender, msg.value);
    }

    //isProjectOwner(msg.sender)
    function ownerWithdrawFunds()
        external
        payable
        override
        fundsRaised
        onlyOwner
        notWithdrawed
    {
        finished = true;
        withdrawedByOwner = true;
        //TODO: CALCULATE FEE WHILE WITHDRAW - IDEA
        payable(projectOwner).transfer(collectedAmount);

        emit fundsWithdrawedByOwner(projectOwner, collectedAmount);
    }

    function backerWithdrawFunds()
        external
        payable
        override
        userBackedProject(msg.sender)
        projectExpired
        fundsNotRaised
    {
        address backer = msg.sender;
        uint256 withdrawFund = backersMap[backer];

        collectedAmount -= withdrawFund;
        backersMap[backer] = 0;
        backers.set(backer, 0);

        //Burn tokens from backers
        erc20token.burnFrom(backer, withdrawFund);
        payable(backer).transfer(withdrawFund);

        emit fundsWithdrawedByBacker(backer, withdrawFund);
    }

    function getTitle() external view returns (string memory) {
        return abi.decode(title, (string));
    }

    function getExpiration() external view returns (uint256) {
        return expires;
    }

    function getOwnerOfProject() external view returns (address) {
        return projectOwner;
    }

    function getCollectedAmount() external view returns (uint256) {
        return collectedAmount;
    }

    function getAmountToColect() external view returns (uint256) {
        return backAmount;
    }

    function isFinished() external view returns (bool) {
        return finished;
    }

    function getERC20Address() external view returns (address) {
        return address(erc20token);
    }
}
