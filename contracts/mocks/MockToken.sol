pragma solidity ^0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "../misc/ERC20Mintable.sol";

/// @title MockToken
/// @author Aave
contract MockToken is ERC20Burnable, ERC20Mintable, ERC20Detailed {

    /// @notice Constructor
    /// @param name Asset name
    /// @param symbol Asset symbol
    /// @param decimals Asset decimals
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    )
    public ERC20Detailed(name, symbol, decimals) {}

    receive() external payable {}
}