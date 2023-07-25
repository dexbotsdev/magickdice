import { minutesAgo } from "./index";
import { EnvHelper } from "./Environment";
import { ethers } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { constants } from "buffer";
import { NETWORKS } from "../appconfig";

interface ICurrentStats {
  failedConnectionCount: number;
  lastFailedConnectionAt: number;
}

/**
 * Reactor used to parse which nodes are valid / invalid, working / not working
 * Reactor.currentRemovedNodes is Object representing invalidNodes
 * Reactor.logBadConnectionWithTimer logs connection stats for Nodes
 * Reactor.getNodesUris returns an array of valid node uris
 */
export class Reactor {
  static getSupportedNetwork(): { supportedId: number; supportednetworkName: string; } {
    
    const supportedId :number= EnvHelper.getRunChainId();
    const supportednetworkName = NETWORKS[supportedId].chainName;

    return {supportedId,supportednetworkName};
    
  }
  static _invalidNodesKey = "invalidNodes";
  static _maxFailedConnections = 1;
  /**
   * failedConnectionsMinuteLimit is the number of minutes that _maxFailedConnections must occur within
   * for the node to be blocked.
   */
  static _failedConnectionsMinutesLimit = 15;

  // use sessionStorage so that we don't have to worry about resetting the invalidNodes list
  static _storage = window.sessionStorage;

  static currentRemovedNodes = JSON.parse(Reactor._storage.getItem(Reactor._invalidNodesKey) || "{}");
  static currentRemovedNodesURIs = Object.keys(Reactor.currentRemovedNodes);

  /**
   * remove the invalidNodes list entirely
   * should be used as a failsafe IF we have invalidated ALL nodes AND we have no fallbacks
   */
  static _emptyInvalidNodesList(networkId: number) {
    // if all nodes are removed && there are no fallbacks, then empty the list
    if (
      EnvHelper.getFallbackURIs(networkId).length === 0 &&
      Object.keys(Reactor.currentRemovedNodes).length === EnvHelper.getAPIUris(networkId).length
    ) {
      Reactor._storage.removeItem(Reactor._invalidNodesKey);
    }
  }

  static _updateConnectionStatsForProvider(currentStats: ICurrentStats) {
    const failedAt = new Date().getTime();
    const failedConnectionCount = currentStats.failedConnectionCount || 0;
    if (
      failedConnectionCount > 0 &&
      currentStats.lastFailedConnectionAt > minutesAgo(Reactor._failedConnectionsMinutesLimit)
    ) {
      // more than 0 failed connections in the last (15) minutes
      currentStats = {
        lastFailedConnectionAt: failedAt,
        failedConnectionCount: failedConnectionCount + 1,
      };
    } else {
      currentStats = {
        lastFailedConnectionAt: failedAt,
        failedConnectionCount: 1,
      };
    }
    return currentStats;
  }

  static _removeNodeFromProviders(providerKey: string, providerUrl: string, networkId: number) {
    // get Object of current removed Nodes
    // key = providerUrl, value = removedAt Timestamp
    let currentRemovedNodesObj = Reactor.currentRemovedNodes;
    if (Object.keys(currentRemovedNodesObj).includes(providerUrl)) {
      // already on the removed nodes list
    } else {
      // add to list
      currentRemovedNodesObj[providerUrl] = new Date().getTime();
      Reactor._storage.setItem(Reactor._invalidNodesKey, JSON.stringify(currentRemovedNodesObj));
      // remove connection stats for this Node
      Reactor._storage.removeItem(providerKey);
    }
    // if all nodes are removed, then empty the list
    if (Object.keys(currentRemovedNodesObj).length === EnvHelper.getAPIUris(networkId).length) {
      Reactor._emptyInvalidNodesList(networkId);
    }
  }

  /**
   * adds a bad connection stat to Reactor._storage for a given node
   * if greater than `_maxFailedConnections` previous failures in last `_failedConnectionsMinuteLimit` minutes will remove node from list
   * @param provider an Ethers provider
   */
  static logBadConnectionWithTimer(providerUrl: string, networkId: number) {
    const providerKey: string = "-Reactor:" + providerUrl;

    let currentConnectionStats = JSON.parse(Reactor._storage.getItem(providerKey) || "{}");
    currentConnectionStats = Reactor._updateConnectionStatsForProvider(currentConnectionStats);

    if (networkId && currentConnectionStats.failedConnectionCount >= Reactor._maxFailedConnections) {
      // then remove this node from our provider list for 24 hours
      Reactor._removeNodeFromProviders(providerKey, providerUrl, networkId);
    } else {
      Reactor._storage.setItem(providerKey, JSON.stringify(currentConnectionStats));
    }
  }

  /**
   * **no longer just MAINNET** =>
   * "intelligently" loadbalances production API Keys
   * @returns string
   */
   static getMainnetURI(): string { 
    return "https://bsc-dataseed.binance.org/";
  }

  /**
   * this is a static mainnet only RPC Provider
   * should be used when querying AppSlice from other chains
   * because we don't need tvl, apy, marketcap, supply, treasuryMarketVal for anything but mainnet
   * @returns StaticJsonRpcProvider for querying
   */
  static getMainnetStaticProvider = () => {
    return new StaticJsonRpcProvider(Reactor.getMainnetURI());
  };

  /**
   * returns Array of APIURIs where NOT on invalidNodes list
   */
  static getNodesUris = (networkId: number) => {
    let allURIs = EnvHelper.getAPIUris(networkId);
    let invalidNodes = Reactor.currentRemovedNodesURIs;
    // filter invalidNodes out of allURIs
    // this allows duplicates in allURIs, removes both if invalid, & allows both if valid
    allURIs = allURIs.filter((item: string) => !invalidNodes.includes(item));

    // return the remaining elements
    if (allURIs.length === 0) {
      // Reactor._emptyInvalidNodesList(networkId);
      // allURIs = EnvHelper.getAPIUris(networkId);
      // In the meantime use the fallbacks
      allURIs = EnvHelper.getFallbackURIs(networkId);
    }
    return allURIs;
  };

  /**
   * stores a retry check to be used to prevent constant Node Health retries
   * returns true if we haven't previously retried, else false
   * @returns boolean
   */
  static retryOnInvalid = () => {
    const storageKey = "-Reactor:retry";
    if (!Reactor._storage.getItem(storageKey)) {
      Reactor._storage.setItem(storageKey, "true");
      // if we haven't previously retried then return true
      return true;
    }
    return false;
  };

  /**
   * iterate through all the nodes we have with a networkId check.
   * - log the failing nodes
   * - _maxFailedConnections fails in < _failedConnectionsMinutesLimit sends the node to the invalidNodes list
   * returns an Array of working mainnet nodes
   */
  static checkAllNodesStatus = async (networkId: number) => {
    return await Promise.all(
      Reactor.getNodesUris(networkId).map(async (URI: string) => {
        let workingUrl = await Reactor.checkNodeStatus(URI, networkId);
        return workingUrl;
      }),
    );
  };

  /**
   * 403 errors are not caught by fetch so we check response.status, too
   * this func returns a workingURL string or false;
   */
  static checkNodeStatus = async (url: string, networkId: number) => {
    // 1. confirm peerCount > 0 (as a HexValue)
    let liveURL;
    liveURL = await Reactor.queryNodeStatus({
      url: url,
      body: JSON.stringify({ method: "net_peerCount", params: [], id: 74, jsonrpc: "2.0" }),
      nodeMethod: "net_peerCount",
      networkId,
    });
    // 2. confirm eth_syncing === false
    if (liveURL) {
      liveURL = await Reactor.queryNodeStatus({
        url: url,
        body: JSON.stringify({ method: "eth_syncing", params: [], id: 67, jsonrpc: "2.0" }),
        nodeMethod: "eth_syncing",
        networkId,
      });
    }
    return liveURL;
  };

  static queryNodeStatus = async ({
    url,
    body,
    nodeMethod,
    networkId,
  }: {
    url: string;
    body: string;
    nodeMethod: string;
    networkId: number;
  }) => {
    let liveURL: boolean | string;
    try {
      let resp = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });
      if (!resp.ok) {
        throw Error("failed node connection");
      } else {
        // response came back but is it healthy?
        let jsonResponse = await resp.json();
        if (Reactor.validityCheck({ nodeMethod, resultVal: jsonResponse.result })) {
          liveURL = url;
        } else {
          throw Error("no suitable peers");
        }
      }
    } catch {
      // some other type of issue
      Reactor.logBadConnectionWithTimer(url, networkId);
      liveURL = false;
    }
    return liveURL;
  };

  /**
   * handles different validityCheck for different node health endpoints
   * * `net_peerCount` should be > 0 (0x0 as a Hex Value). If it is === 0 then queries will timeout within ethers.js
   * * `net_peerCount` === 0 whenever the node has recently restarted.
   * * `eth_syncing` should be false. If not false then queries will fail within ethers.js
   * * `eth_syncing` is not false whenever the node is connected to a peer that is still syncing.
   * @param nodeMethod "net_peerCount" || "eth_syncing"
   * @param resultVal the result object from the nodeMethod json query
   * @returns true if valid node, false if invalid
   */
  static validityCheck = ({ nodeMethod, resultVal }: { nodeMethod: string; resultVal: string | boolean }) => {
    switch (nodeMethod) {
      case "net_peerCount":
        if (resultVal === ethers.utils.hexValue(0)) {
          return false;
        } else {
          return true;
        }
        break;
      case "eth_syncing":
        return resultVal === false;
        break;
      default:
        return false;
    }
  };
}
