import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { RPSRaffle_Sponsored_CustomVrf_InitParams } from '../../utils/types';

export async function deployRPSRaffleStandard(
  params: RPSRaffle_Sponsored_CustomVrf_InitParams
): Promise<Contract> {
  const rps_raffle = await ethers.deployContract("RPSRaffleStandard", [params]);

  await rps_raffle.waitForDeployment();
  return rps_raffle;
}