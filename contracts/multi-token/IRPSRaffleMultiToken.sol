// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRPSRaffleMultiToken {
    struct Prize {
        uint128 amount;
        uint128 deadline;
    }

    struct InitializeParams {
        uint256 potLimitUSD;
        uint256 raffleTicketCostUSD;
        uint128 claimWindow;
        uint16 protocolFeeInBps;
        uint16 tradeFeeInBps;
        address router;
        address owner;
        address operator;
    }

    struct RequestStatus {
        bool fullfilled;
        bool exists;
        uint256 randomWord;
    }

	event GenerateRaffleTickets(
		address indexed user,
		uint32 ticketIdStart,
		uint32 ticketIdEnd,
		uint256 pendingAmount
	);
    event WinnerAssigned(address winner);
    event Claim(address indexed user, address token, uint256 amount);
    event PotLimitUpdated(uint256 newPotLimit);
    event TradeFeeUpdated(uint16 newTradeFee);
    event ProtocolFeeUpdated(uint16 newFee);
    event RaffleTicketCostUpdated(uint256 newTicketCost);
    event RandomWordRequested(
        uint256 requestId, 
        uint32 fromTicketId, 
        uint32 toTicketId,
        uint16 potId
    );
    event RandomnessFulfilled(
        uint16 indexed potId, 
        uint256 randomWord
    );
    event TokenApproved(address token);
    event ApprovedTokenRemoved(address token);

    function executeTrade(
        uint256 inputAmount, 
        address _user,
        address token
    ) external payable;

    function executeRaffle(address winner) external;

    function claim() external;
    function setTradeFee(uint16 _newTradeFee) external;
    
    function tradeFeeInBps() external returns(uint16);
}