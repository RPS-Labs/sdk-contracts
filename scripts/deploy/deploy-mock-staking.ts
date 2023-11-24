import hre from 'hardhat';
import '@nomiclabs/hardhat-ethers';

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  // @ts-ignore
  const staking = await hre.ethers.deployContract("StakingMock", deployer);
  await staking.waitForDeployment();

  const deployer_addr = await deployer.getAddress();
  console.log(`Staking protocol deployed at ${staking.target} by deployer ${deployer_addr}`);

  // Verification
  console.log("Verifying the contract...");
  await hre.run("verify:verify", {
    address: staking.target,
    constructorArguments: [],
  });
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});