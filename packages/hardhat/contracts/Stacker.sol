pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Stacker is Ownable {

  event TopupReceived(uint256 amount);

  constructor() {
  }

  function topup() public payable {
      emit TopupReceived(msg.value);
  }

  function ethBalance() public view returns (uint256) {
      return payable(address(this)).balance;
  }
}
