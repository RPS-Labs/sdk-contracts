// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IRPSRaffleStandard {
    struct Prize {
        uint128 amount;
        uint128 deadline;
    }

    struct InitializeParams {
        uint256 potLimit;
        uint256 raffleTicketCostUSD;
        uint32 rafflePeriod;
        uint128 claimWindow;
        address sponsoredToken;
        address router;
        address owner;
        address operator;
    }

    struct RaffleStatus {
        bool closed;
        bool drawn;
        bool winnerAssigned;
    }

	event GenerateRaffleTickets(
		address indexed user,
		uint32 ticketIdStart,
		uint32 ticketIdEnd,
		uint256 pendingAmount
	);
    event WinnerAssigned(address indexed winner, uint16 potId);
    event RandomWordRequested(uint16 potId);
    event RandomnessFulfilled(
        uint16 indexed potId, 
        uint32 winningTicketId
    );
    event Claim(address indexed user, uint256 amount);
    event RaffleTicketCostUpdated(uint256 newTicketCost);
    event PotLimitUpdated(uint256 newPotLimit);
    event RaffleStarted(uint32 deadline);
    event RafflePeriodUpdated(uint32 newPeriod);
    event AddedIncentivizedToken(address token);
    event RemovedIncentivizedToken(address token);

    function executeTrade(
        uint256 inputAmount, 
        address _user,
        address token
    ) external;

    function executeRaffle(address winner) external;

    function claim() external;
}