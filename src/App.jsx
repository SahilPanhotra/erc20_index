import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Alchemy, Network, Utils } from "alchemy-sdk";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import erc20defaultImage from "./assets/erc20token.png";
import { ethers } from "ethers";

function App() {
  const [userAddress, setUserAddress] = useState("");
  const [connected, setIsConnected] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [loading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  async function getTokenBalance() {
    setHasQueried(false);
    validateAndSetError(userAddress);
    setIsLoading(true);
    const config = {
      apiKey: import.meta.env.VITE_SOME_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(resolvedAddress);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setIsLoading(false);
  }
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      const [account] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setUserAddress(account);
      setIsConnected(true);
    }
  };

  const resolveENS = async (ensName) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const resolved = await provider.resolveName(ensName);
      setResolvedAddress(resolved);
    } catch (err) {
      setResolvedAddress("");
      setIsLoading(false);
    }
    return resolvedAddress;
  };

  const validateAndSetError = async (addressOrENS) => {
    try {
      if (ethers.utils.isAddress(addressOrENS)) {
        ethers.utils.getAddress(addressOrENS); // Throws if invalid address
      } else {
        const resolved = await resolveENS(addressOrENS);
        ethers.utils.getAddress(resolved); // Throws if invalid ENS name
      }
    } catch (err) {
      toast.error(`Invalid Ethereum or Ens address`, {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
      setIsLoading(false);
    }
  };

  useEffect( () => {
    if (userAddress) {
       resolveENS(userAddress);
    }
  }, [userAddress]);

  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={"center"}
          justifyContent="center"
          flexDirection={"column"}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
          <Button onClick={connectWallet} variant="contained">
            {connected ? "Connected" : "Connect Wallet"}
          </Button>
          <Text>
            Connect Metamask wallet to automatically fill your wallet address
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address or ENS name:
        </Heading>
        <Input
          onChange={(e) => {
            setUserAddress(e.target.value);
            setResolvedAddress("");
          }}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          value={userAddress}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
          {loading ? "loading.." : "Check ERC-20 Token Balances"}
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <SimpleGrid w={"90vw"} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex
                  flexDir={"row"}
                  color="white"
                  bg="blue"
                  w={"20vw"}
                  key={e.id ? e.id : i}
                  borderRadius={"10px"}
                  padding={"8px"}
                >
                  <Image
                    borderRadius="full"
                    boxSize="50px"
                    src={
                      tokenDataObjects[i].logo
                        ? tokenDataObjects[i].logo
                        : erc20defaultImage
                    }
                    marginRight={"8px"}
                  />
                  <Flex
                    flexDir={"column"}
                    color="white"
                    bg="blue"
                    w={"20vw"}
                    key={e.id}
                    alignItems={"flex-start"}
                    borderRadius={"10px"}
                    gap={"4px"}
                  >
                    <Box>
                      <b>Symbol:</b> $
                      {tokenDataObjects[i]?.symbol?.length > 7
                        ? tokenDataObjects[i].symbol.slice(0, 7)
                        : tokenDataObjects[i].symbol}
                      &nbsp;
                    </Box>
                    <Box>
                      <b>Balance:</b>&nbsp;
                      {parseFloat(
                        Utils.formatUnits(
                          e.tokenBalance,
                          tokenDataObjects[i].decimals
                        )
                      ).toFixed(2)}
                    </Box>
                  </Flex>
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          "Please make a query! This may take a few seconds..."
        )}
      </Flex>
      <ToastContainer />
    </Box>
  );
}

export default App;
