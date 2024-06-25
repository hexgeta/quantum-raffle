import { FallbackProvider, JsonRpcProvider } from "ethers";
import {
  useAccount,
  useChainId,
  useDeployContract,
  useDisconnect,
  useEnsName,
} from "wagmi";
import { Button } from "./ui/button";
import { switchChain } from "wagmi/actions";
import { config } from "@/wagmiProvider/config";
import { incoNetwork } from "@/wagmiProvider/chainConfig";
import { useEffect, useState } from "react";
import { getInstance, provider, getTokenSignature } from "@/utils/fhevm";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import eventABI from "@/abi/eventABI.json";
import { byteCode } from "@/utils/byteCode";
import AlertDialouge from "@/components/alert-dialouge";
import Link from "next/link";

let instance;
export function Account() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const chainId = useChainId();
  const { deployContract } = useDeployContract();
  const [formValues, setFormValues] = useState({
    formAddress: address,
    uri: "https://blocklive.io/metadata/collection",
    name: "ATX DAO Native 8/8/22",
    tokenPrice: "400000000",
    tokenName: "usdc",
    tokenAddress: "0x71ecd860e7e6E816427D5936d95d3456F3860d91",
    evtDescription:
      "All you can crytpo, free drinks with this NFT. Hang out with the ATX DAO",
    evtLocation: "Native Bar",
    evtStartTime: "1721774965",
    evtEndTime: "1721775965",
    evtTokenSupply: "200",
  });
  const [responseAddress, setResponseAddress] = useState("");
  const [alertDialouge, setAlertDialouge] = useState(false);
  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  const formFields = [
    { id: "formAddress", label: "Address" },
    { id: "uri", label: "URI" },
    { id: "name", label: "Name" },
    { id: "tokenPrice", label: "Token Price" },
    { id: "tokenName", label: "Token Name" },
    { id: "tokenAddress", label: "Token Address" },
    { id: "evtDescription", label: "Event Description" },
    { id: "evtLocation", label: "Event Location" },
    { id: "evtStartTime", label: "Event Start Time" },
    { id: "evtEndTime", label: "Event End Time" },
    { id: "evtTokenSupply", label: "Event Token Supply" },
  ];

  const handleFormSubmit = async () => {
    const data = [
      formValues.formAddress,
      formValues.uri,
      formValues.name,
      {
        price: formValues.tokenPrice,
        currency: formValues.tokenPrice,
        currencyAddress: formValues.tokenAddress,
      },
      formValues.evtDescription,
      formValues.evtLocation,
      formValues.evtStartTime,
      formValues.evtEndTime,
      formValues.evtTokenSupply,
    ];
    deployContract(
      {
        abi: eventABI,
        args: data,
        bytecode: byteCode,
      },
      {
        onSuccess(data, variables, context) {
          console.log(data);
          setResponseAddress(data);
          setAlertDialouge(true);
        },
        onError(error, variables, context) {
          console.log(error);
        },
      }
    );
  };

  useEffect(() => {
    async function fetchInstance() {
      instance = await getInstance();
    }
    fetchInstance();
  }, []);

  function truncateAddress(address: string) {
    return address.slice(0, 5) + "....." + address.slice(-4);
  }
  const switchChainToInco = async () => {
    try {
      await switchChain(config, {
        addEthereumChainParameter: {
          iconUrls: [
            "https://img.cryptorank.io/coins/150x150.inco_network1708524859049.png",
          ],
        },
        chainId: incoNetwork.id,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="mt-20 grid gap-6 pb-16">
      {responseAddress !== "" && (
        <AlertDialouge
          isOpen={alertDialouge}
          address={responseAddress}
          setIsOpen={setAlertDialouge}
        />
      )}
      <div className="mt-10 flex justify-between scroll-m-20 border-b pb-6 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        <div>
          Wallet Address:{" "}
          {address && (
            <>
              <div className="text-xl text-black/70 hidden md:flex">
                {ensName ? `${ensName} (${address})` : address}
              </div>
              <div className="text-xl text-black/70 md:hidden flex">
                {ensName ? `${ensName} (${address})` : truncateAddress(address)}
              </div>
            </>
          )}
        </div>
        {chainId === 9090 ? (
          <div className="flex gap-4 items-center">
            <Link href={"/buy-token"}>
              <Button variant={"neutral"}>Buy Token</Button>
            </Link>

            <Button onClick={() => disconnect()}>Disconnect</Button>
          </div>
        ) : (
          <div>
            <Button onClick={switchChainToInco}>Switch Chain</Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 mt-10 gap-8">
        {formFields.map(({ id, label }) => (
          <div key={id} className="grid gap-2 md:grid-cols-2 items-center">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              onChange={handleChange}
              value={formValues[id]}
              placeholder={label}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end">
        <Button onClick={handleFormSubmit}>Submit</Button>
      </div>
    </div>
  );
}
