import hre from 'hardhat';
import { routerParams } from '../../deployment-params';
import '@nomiclabs/hardhat-ethers';


const main = async () => {
  const params = routerParams;

  if (!params.owner) {
    throw new Error("Router owner is not set up");
  }
  if (!params.protocol) {
    throw new Error("Target protocol contract address is not set up");
  }

  const [deployer] = await hre.ethers.getSigners();

  // @ts-ignore
  const rps_router = await hre.ethers.deployContract("RPSRouter", [params.owner, params.protocol], deployer);

  await rps_router.waitForDeployment();

  const deployer_addr = await deployer.getAddress();
  console.log(`RPS Router deployed at ${rps_router.target} by deployer ${deployer_addr}`)

  // Verification
  console.log("Verifying RPS Router...");
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await hre.run("verify:verify", {
    address: rps_router.target,
    constructorArguments: [
      params.owner,
      params.protocol
    ],
  });
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});