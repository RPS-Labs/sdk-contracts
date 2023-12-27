import { BigNumberish, Contract } from 'ethers';
import { Token } from '../../utils/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { dealTokensToAddress } from './dealTokensToAddress';
import { erc20TokenContract } from './erc20TokenContract';

export async function sponsorRaffle(
  RPSRaffle: Contract, 
  owner: SignerWithAddress,
  token: Token,
  amount: BigNumberish
) {
  const owner_account = await owner.getAddress();

  await dealTokensToAddress(token, owner_account, amount);

  /* 
    Approve and sponsor
   */
  const token_contract = await erc20TokenContract(token.address);
  await token_contract.approve(RPSRaffle.target, amount);
  // @ts-ignore
  await RPSRaffle.connect(owner).sponsorRaffle(amount);
}