import { BigNumberish } from 'ethers';
import { ethers } from 'hardhat';

export function encodeStakingCall(
  user: string,
  amount: BigNumberish
): string {
  const ABI = [
    "function stakeFor(address user, uint256 amount)"
  ];
  const iface = new ethers.Interface(ABI);
  return iface.encodeFunctionData("stakeFor", [ user, amount ]);
}