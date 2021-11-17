// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FakeANT is ERC20 {
    constructor() ERC20("FakeANT", "FANT") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
