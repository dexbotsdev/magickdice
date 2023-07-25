import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { BigNumber, BigNumberish } from "ethers";
import { NetworkId } from "../appconfig"; 

export interface IJsonRPCError {
  readonly message: string;
  readonly code: number;
}

export interface IBaseAsyncThunk {
  readonly networkID: NetworkId;
  readonly provider: StaticJsonRpcProvider | JsonRpcProvider;
}

export interface IValueOnlyAsyncThunk extends IBaseAsyncThunk {
  readonly value: BigNumber;
}

export interface IChangeApprovalAsyncThunk extends IBaseAsyncThunk {
  readonly token: string;
  readonly address: string;
}

export interface IChangeApprovalWithVersionAsyncThunk extends IChangeApprovalAsyncThunk {
  readonly version2: boolean;
}

export interface IChangeApprovalWithDisplayNameAsyncThunk extends IChangeApprovalAsyncThunk {
  readonly displayName: string;
  readonly insertName: boolean;
}

export interface IActionAsyncThunk extends IBaseAsyncThunk {
  readonly action: string;
  readonly address: string;
}

export interface IValueAsyncThunk extends IBaseAsyncThunk {
  readonly value: string;
  readonly address: string;
}

export interface IActionValueAsyncThunk extends IValueAsyncThunk {
  readonly action: string;
}

export interface IStakeAsyncThunk extends IActionValueAsyncThunk {
  readonly version2: boolean;
  readonly rebase: boolean;
}

export interface IActionValueGasAsyncThunk extends IActionValueAsyncThunk {
  readonly gas: number;
  readonly version2: boolean;
  readonly rebase: boolean;
}

export interface IBaseAddressAsyncThunk extends IBaseAsyncThunk {
  readonly address: string;
}

export interface IBaseAddressRecipientAsyncThunk extends IBaseAddressAsyncThunk {
  readonly recipient: string;
}

export interface IMigrateAsyncThunk extends IBaseAddressAsyncThunk {
  readonly gOHM: boolean;
}

export interface IMigrateSingleAsyncThunk extends IMigrateAsyncThunk {
  readonly type: number;
  readonly amount: string;
}

export interface IBaseBondV2ClaimAsyncThunk extends IBaseAddressAsyncThunk {
  readonly gOHM: boolean;
}

export interface IBaseBondV2SingleClaimAsyncThunk extends IBaseBondV2ClaimAsyncThunk {
  readonly indexes: [number];
}

export interface IBaseBondV2ClaimSinglesyncThunk extends IBaseBondV2ClaimAsyncThunk {
  readonly gOHM: boolean;
  readonly bondIndex: number;
}

export interface IActionValueRecipientAsyncThunk extends IActionValueAsyncThunk {
  readonly recipient: string;
  readonly version2: boolean;
  readonly rebase: boolean;
  readonly eventSource: string;
}

export interface IRedeemAsyncThunk extends IBaseAddressAsyncThunk {
  readonly eventSource: string;
}

export interface IZapAsyncThunk extends IBaseAddressAsyncThunk {
  readonly tokenAddress: string;
  readonly sellAmount: BigNumber;
  readonly slippage: string;
  readonly minimumAmount: string;
  readonly gOHM: boolean;
}

// Account Slice




export interface IStakingInfo {
  readonly appId: number;
  readonly poolId: number;
  readonly stakingAPY?: number;
  readonly stakingTvl?: number;
  readonly stakingTokenName?: string;
  readonly stakingTokenAddress?: string;
  readonly stakingTokenLogo?: string;
  readonly poolContractName?: string;
  readonly poolContractAddress?: string;
  readonly poolContractLogo?: string;
  readonly tokenBuyurl?: string;
  readonly poolName?: string;
}




export interface IAppData {
  readonly stakingInfo?: Array<IStakingInfo>;
  readonly loading: boolean;
  readonly loadingMarketPrice: boolean;
  readonly chainid?: number;
  readonly chainScanUrl?: string;
  readonly networkName?: string;
  readonly baseCurrency?: string;
  readonly appId?: number;
  readonly appName?: string;
  readonly banner?: string;
}

 
