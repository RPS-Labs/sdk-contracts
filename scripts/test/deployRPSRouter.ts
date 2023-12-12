import { Contract } from 'ethers';
import { ethers, network } from 'hardhat';
import { isCustomVrfNetwork } from '../../utils/utils';

export async function deployRPSRouter(
  protocol: string,
  owner?: string
): Promise<Contract> {
  if (!owner) {
    const [s1] = await ethers.getSigners();
    owner = await s1.getAddress();
  }
  let contract_name;

  if (isCustomVrfNetwork(network.config.chainId!)) {
    contract_name = "RPSRouterCustomVrf"
  }
  else {
    contract_name = "RPSRouter";
  }

  const rps_router = await ethers.deployContract(contract_name, [
    owner,
    protocol
  ]);

  await rps_router.waitForDeployment();
  return rps_router;
}