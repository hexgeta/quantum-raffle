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

let instance;
export function Account() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const chainId = useChainId();
  const { deployContract } = useDeployContract();
  const [formValues, setFormValues] = useState({
    formAddress: "",
    uri: "",
    name: "",
    tokenPrice: "",
    tokenName: "",
    tokenAddress: "",
    evtDescription: "",
    evtLocation: "",
    evtStartTime: "",
    evtEndTime: "",
    evtTokenSupply: "",
  });

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
    const contract = await deployContract({
      abi: eventABI,
      args: data,
      bytecode: byteCode,
    });
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
    <div className="mt-20 grid gap-6">
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
          <div>
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
            <Input id={id} onChange={handleChange} value={formValues[id]} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end">
        <Button onClick={handleFormSubmit}>Submit</Button>
      </div>
    </div>
  );
}
