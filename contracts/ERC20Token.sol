//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20Burnable, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) {}

    function mint(address backer, uint256 supply) external onlyOwner {
        _mint(backer, supply);
    }
}
