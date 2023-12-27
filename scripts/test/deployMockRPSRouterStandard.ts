import { Contract } from 'ethers';
import { ethers } from 'hardhat';

export async function deployMockRPSRouterStandard(
  matching_engine: string,
  owner?: string
): Promise<Contract> {
  if (!owner) {
    const [s1] = await ethers.getSigners();
    owner = await s1.getAddress();
  }
  
  const rps_router = await ethers.deployContract("MockRPSRouterStandard", [
    owner,
    matching_engine
  ]);

  await rps_router.waitForDeployment();
  return rps_router;
}