import { Contract } from 'ethers';

export async function fundSubscription(VRFCoordinator: Contract) {
  const id = 1;
  const amount = 500n * BigInt(1e18);
  await VRFCoordinator.fundSubscription(id, amount);
  return VRFCoordinator;
}