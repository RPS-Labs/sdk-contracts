import { ethers, network } from 'hardhat';
import { LINK } from '../../Addresses';
import { Contract } from 'ethers';

export async function deployVRFContracts(): Promise<{
  V3Aggregator: Contract,
  VRFCoordinator: Contract,
  VRFV2Wrapper: Contract
}> {
  const chainId = network.config.chainId!;
  /* 
    MockV3Aggregator
   */
  const decimals = 18;
  const initial_answer = 3000000000000000n;
  const V3Aggregator = await ethers.deployContract(
    "MockV3Aggregator",
    [decimals, initial_answer]
  );
  await V3Aggregator.waitForDeployment();

  /* 
    VRFCoordinatorV2
   */
  const base_fee = 100000000000000000n;
  const gas_price_LINK = 1000000000n;
  const VRFCoordinator = await ethers.deployContract(
    "VRFCoordinatorV2Mock",
    [base_fee, gas_price_LINK]
  );
  await VRFCoordinator.waitForDeployment();

  /*
    VRFV2Wrapper deployment
  */
  const VRFV2Wrapper = await ethers.deployContract(
    "VRFV2Wrapper",
    [LINK[chainId], V3Aggregator.target.toString(), VRFCoordinator.target.toString()]
  );
  await VRFV2Wrapper.waitForDeployment();

  return { V3Aggregator, VRFCoordinator, VRFV2Wrapper }
}
