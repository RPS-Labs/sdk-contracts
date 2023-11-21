// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRPSRaffle} from "./interface/IRPSRaffle.sol";
import {IRPSRouter} from "./interface/IRPSRouter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RPSRouter is IRPSRouter, Ownable {

    IRPSRaffle public raffle;
    address public protocol;
    bool private raffleSet;
    uint256 private constant HUNDRED_PERCENT = 10000;

    constructor(address _owner, address _protocol) Ownable(_owner) {
        protocol = _protocol;
    }

    function execute(
        bytes calldata data, 
        uint256 tradeAmount
    ) external payable {
        // Validate value
        uint16 raffleTradeFee = raffle.tradeFeeInBps();
        uint256 raffleDelta = tradeAmount * raffleTradeFee / HUNDRED_PERCENT;
        require(msg.value >= tradeAmount, "Insufficient funds");

        // Generating tickets
        raffle.executeTrade{ value: raffleDelta }(tradeAmount, msg.sender);

        // Integration call
        (bool success,) = protocol.call{ value: msg.value - raffleDelta }(data);
        require(success, "Call unsuccessful");
    }

    function setRaffleAddress(address _raffle) external onlyOwner {
        require(_raffle != address(0));
        require(raffleSet == false, "RPS Raffle address can only be set once");
        raffle = IRPSRaffle(_raffle);
        raffleSet = true;
    }

    function migrateProtocol(address _newProtocolAddress) external onlyOwner {
        protocol = _newProtocolAddress;
        emit ProtocolMigrated(_newProtocolAddress);
    }
}