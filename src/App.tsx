import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button, Center, Container, Title } from '@mantine/core';
import { SegmentedControl } from '@mantine/core';
import Header from './components/Header/Header';
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAddress, useWeb3Context } from "./hooks/web3Context";
import { initializeNetwork, switchNetwork } from "./reducers/NetworkSlice";
import { useAppSelector } from "./hooks";
import { EnvHelper } from "./reactors/Environment";
import LoadingSplash from "./components/Loading/LoadingSplash";
import Ryde from "./screens/Ryde";
import Dyce from "./screens/Dyce";

function App() {

  const [action, setAction] = useState("swap");
  const location = useLocation();
  const dispatch = useDispatch();

  const currentPath = location.pathname + location.search + location.hash;
  const { connect, hasCachedProvider, provider, connected, chainChanged } = useWeb3Context();
  const address = useAddress();

  const [walletChecked, setWalletChecked] = useState(false);
  const networkId = useAppSelector(state => state.network.networkId);



  async function loadDetails(whichDetails: string) {

    // Unhandled Rejection (Error): call revert exception (method="balanceOf(address)", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.4.0)
    // it's because the initial provider loaded always starts with networkID=1. This causes
    // address lookup on the wrong chain which then throws the error. To properly resolve this,
    // we shouldn't be initializing to networkID=1 in web3Context without first listening for the
    // network. To actually test rinkeby, change setnetworkID equal to 4 before testing.
    let loadProvider = provider;

    if (connected) {

      if (whichDetails === "network") {
        initNetwork(loadProvider);
      }
    }
  }

  const initNetwork = useCallback(
    (loadProvider: any) => {
      dispatch(initializeNetwork({ provider: loadProvider }));
    },
    [networkId],
  );


  // The next 3 useEffects handle initializing API Loads AFTER wallet is checked
  //
  // this useEffect checks Wallet Connection & then sets State for reload...
  // ... we don't try to fire Api Calls on initial load because web3Context is not set yet
  // ... if we don't wait we'll ALWAYS fire API calls via JsonRpc because provider has not
  // ... been reloaded within App.
  useEffect(() => {
    // then user DOES have a wallet
    connect().then(() => {
      setWalletChecked(true);
    });
  }, []);

  // this useEffect fires on state change from above. It will ALWAYS fire AFTER
  useEffect(() => {
    // don't load ANY details until wallet is Checked
    if (walletChecked) {
      loadDetails("network").then(() => {
        if (networkId !== -1) {
          loadDetails("app");
        }
      });
    }
  }, [walletChecked, chainChanged, networkId]);

  // this useEffect picks up any time a user Connects via the button
  useEffect(() => {
    // don't load ANY details until wallet is Connected
    if (connected) {
      if (networkId != EnvHelper.getRunChainId()) {
        dispatch(switchNetwork({ provider: provider, networkId: EnvHelper.getRunChainId() }));
      } else {
        loadDetails("account");
      }
    }
  }, [connected]);



  return (
    <Container>

      <>
        <Header />

        <Container style={{ marginTop: "15px" }}>
          <Dyce />
        </Container>
      </>
    </Container>
  );
}

export default App;

