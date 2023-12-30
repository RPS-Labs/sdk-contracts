import { Contract } from 'ethers';
import { Token, getRandomFloat } from '../../../utils/utils';
import { dealTokensToAddress } from '../dealTokensToAddress';
import { erc20TokenContract } from '../erc20TokenContract';
import { ethers, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Native } from '../../../Addresses';

export async function simpleTokenRouterTrade(
  RPSRouter: Contract,
  input_token: Token,
  signer: SignerWithAddress
): Promise<bigint> {
    const user_addr = await signer.getAddress();
    const chain_id = network.config.chainId!;
    const is_native = input_token.address == Native[chain_id].address;

    const swap_amount_raw = is_native ? 
      getRandomFloat(100, 1000).toFixed(5) :
      getRandomFloat(0.5, 2).toFixed(5);
    const swap_amount = ethers.parseUnits(
      swap_amount_raw,
      input_token.decimals
    );

    if (!is_native) {
      const InputToken = await erc20TokenContract(input_token.address);
      await dealTokensToAddress(input_token, user_addr, swap_amount);
      // @ts-ignore
      await InputToken.connect(signer).approve(RPSRouter.target, swap_amount);
    }

    let params;
    if (is_native) {
      params = [
        input_token.address, 
        swap_amount, 
        user_addr,
        { value: swap_amount }
      ];
    }
    else {
      params = [
        input_token.address, 
        swap_amount, 
        user_addr
      ];
    }
    
    // @ts-ignore
    await RPSRouter.connect(signer).execute(...params);
    return swap_amount;
}