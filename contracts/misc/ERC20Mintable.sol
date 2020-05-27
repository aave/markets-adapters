pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ERC20Mintable is ERC20 {
    function mint(uint256 value) public returns (bool) {
        _mint(msg.sender, value);
        return true;
    }
}