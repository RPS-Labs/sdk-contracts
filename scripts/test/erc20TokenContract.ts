import { ethers } from 'hardhat';

export async function erc20TokenContract(address: string) {
  return await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20", 
    address
  );
}