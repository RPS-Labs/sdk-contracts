import { Contract } from 'ethers';
import { ethers, network } from 'hardhat';
import { LINK } from '../../Addresses';
import { RPSRaffleInitializeParams } from '../../utils/types';

export async function deployRPSRaffle(
  params: RPSRaffleInitializeParams,
  VRFV2Wrapper?: Contract
): Promise<Contract> {
  const chainId = network.config.chainId!;
  let rps_raffle: Contract;

  if (VRFV2Wrapper) {
    const vrf_v2_wrapper_address = VRFV2Wrapper.target;
    console.log("Deploying with LINK: ", LINK[chainId]);
    rps_raffle = await ethers.deployContract("RPSRaffle", [
      params,
      LINK[chainId],
      vrf_v2_wrapper_address
    ]);
  }
  else {
    rps_raffle = await ethers.deployContract("RPSRaffle", [params]);
  }

  await rps_raffle.waitForDeployment();
  return rps_raffle;
}