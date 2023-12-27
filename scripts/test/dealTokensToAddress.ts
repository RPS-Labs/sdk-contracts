import { ethers, network } from 'hardhat';
import { TokenWhale } from '../../Addresses';
import { Token } from '../../utils/utils';
import { BigNumberish } from 'ethers';

export async function dealTokensToAddress(
  token: Token,
  recepient: string,
  amount: BigNumberish
) {
  const whale = TokenWhale.get(token);

  if (!whale) {
    throw new Error("Configure token whale address");
  }

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whale],
  });
  const whale_signer = await ethers.getSigner(whale);
  const token_contract = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20", 
    token.address
  );

  // @ts-ignore
  await token_contract.connect(whale_signer).transfer(recepient, amount);

}