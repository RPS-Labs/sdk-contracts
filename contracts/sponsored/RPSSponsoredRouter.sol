// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IRPSSponsoredRaffle} from "../interface/IRPSSponsoredRaffle.sol";
import {IRPSRouter} from "../interface/IRPSRouter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RPSRouter is IRPSRouter, Ownable {

    IRPSSponsoredRaffle public raffle;
    address public protocol;
    uint256 private constant HUNDRED_PERCENT = 10000;

    constructor(address _owner, address _protocol) Ownable(_owner) {
        protocol = _protocol;
    }

    function execute(
        bytes calldata data, 
        uint256 tradeAmount
    ) external {
        // Validate value
        uint16 raffleTradeFee = raffle.tradeFeeInBps();
        uint256 raffleDelta = tradeAmount * raffleTradeFee / HUNDRED_PERCENT;
 
        // Generating tickets
        raffle.executeTrade{ value: raffleDelta }(tradeAmount, msg.sender);

        // Integration call
        (bool success,) = protocol.call{ value: msg.value - raffleDelta }(data);
        require(success, "Call unsuccessful");
    }

    function executeBatch(
        bytes calldata data,
        IRPSSponsoredRaffle.BatchTradeParams[] calldata params
    ) external payable {
        // Validate value
        uint16 raffleTradeFee = raffle.tradeFeeInBps();
        uint256 tradeAmountTotal;
        uint256 trades_n = params.length;

        for (uint i = 0; i < trades_n; i++) {
            tradeAmountTotal += params[i].tradeAmount;
        }

        uint256 raffleDelta = tradeAmountTotal * raffleTradeFee / HUNDRED_PERCENT;
        require(msg.value >= tradeAmountTotal, "Insufficient funds");
 
        // Generating tickets
        raffle.batchExecuteTrade{ value: raffleDelta }(params);

        // Integration call
        (bool success,) = protocol.call{ value: msg.value - raffleDelta }(data);
        require(success, "Call unsuccessful");
    }

    function setRaffleAddress(address _raffle) external onlyOwner {
        require(_raffle != address(0), "Zero address");
        require(address(raffle) == address(0), "RPS Raffle address can only be set once");
        raffle = IRPSSponsoredRaffle(_raffle);
    }

    function migrateProtocol(address _newProtocolAddress) external onlyOwner {
        require(_newProtocolAddress != address(0));
        require(protocol != _newProtocolAddress, "Provide a new protocol address");
        protocol = _newProtocolAddress;
        emit ProtocolMigrated(_newProtocolAddress);
    }
}