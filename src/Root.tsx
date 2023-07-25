/* eslint-disable global-require */
import { FC, StrictMode } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Web3ContextProvider } from "./hooks/web3Context";
import { MantineThemeOverride, MantineProvider } from '@mantine/core';

import App from "./App";
import store from "./store";
import { NotificationsProvider } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';



const myTheme: MantineThemeOverride = {
  colorScheme: 'dark',
  primaryColor: 'brand',
  defaultRadius: 10,
  fontFamily: 'Varela Round, sans-serif',
  fontFamilyMonospace: 'Varela Round, Courier, monospace',
  headings: { fontFamily: 'Varela Round, sans-serif' },
  colors: {
    brand: ['#969bd5', '#969bd5', '#d0bfff', '#b197fc', '#9775fa', '#845ef7', '#7950f2', '#7048e8', '#6741d9', '#5f3dc4'],
  },
  shadows: {
    md: '1px 1px 3px rgba(0,0,0,.25)',
    xl: '5px 5px 3px rgba(0,0,0,.25)',
  },
};



const Root: FC = () => {
  return (
    <MantineProvider theme={myTheme} withNormalizeCSS withGlobalStyles>
      <ModalsProvider>
        <NotificationsProvider> 
          <Web3ContextProvider>
            <Provider store={store}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </Provider>
          </Web3ContextProvider>
        </NotificationsProvider>
      </ModalsProvider>
    </MantineProvider>
  );
};

export default Root;
