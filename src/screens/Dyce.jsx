import {
    Box,
    Card,
    Text,
    Title,
    Group,
    LoadingOverlay, SegmentedControl,
    Button, Center,
    Badge,
    NumberInput,
    Grid,
} from "@mantine/core"; import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { TOKEN, WETH9 } from "../appconfig";
import { useWeb3Context } from "../hooks";
import ERC20 from "../types/ERC20";
import { useNotifications } from "@mantine/notifications";
import { BigNumber } from 'bignumber.js'
import { CircleNumber0, CircleNumber1, InfoCircle } from 'tabler-icons-react';
import { useDispatch } from "react-redux";
 import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'tabler-icons-react';
import dyce from "../abi/PDyce.json";
import './styles.css'

import DiceLoading from "../components/CustomerLoading/DiceLoading"

export default function Dyce(props) {

    const { address } = useWeb3Context();
    const amount = new BigNumber("1000000000000000000");
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner();
    const notifications = useNotifications();
    const [usersrcBalance, setUsersrcBalance] = useState(0);
    const [allowanceIn, setAllowanceIn] = useState(false);
    const SRCCONTRACT = new ERC20(WETH9.address, signer, WETH9.name, WETH9.decimals);
    const [payValue, setPayValue] = useState(0)
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const [depositvalue, setDepositvalue] = useState("0");
    const [diceNum, setDiceNum] = useState(0);
    const [rollEnabled, setRollEnabled] = useState(false);
    const [adminButton, setAdminButton] = useState(false);


    const [dicecontract, setDiceContract] = useState();
    const [winNumber, setWinNumber] = useState();
    const [winStatus, setWinStatus] = useState("");

    const isSRCApproved = async () => {
        const allowance = await SRCCONTRACT.allowance(address, TOKEN.address);
        if (allowance.lte(5)) {
            return false;
        }
        return true;
    }

    const ApproveSrc = async () => {
        try {
            setLoading(true);
            (await (await SRCCONTRACT.approve(TOKEN.address, '250000000000000000000')).wait());

        } catch (err) {
            console.log(err.message)
            notifications.showNotification({
                color: 'red',
                title: 'Error.',
                message: err.message,
            })
            setLoading(false);
            return;
        }
        setLoading(false);
        setAllowanceIn(true);

    }

    const onDeposit = async (token, amount, pool) => {


        if (Number(amount) < 5 || Number(amount)>10) {
            notifications.showNotification({
                color: 'red',
                title: 'Error.',
                message: 'Deposit Value cannot be less than 5 USDT or more than 10 USDT',
            })

            return;
        }

        if (dicecontract) {
            try {
                setLoading(true);
                (await (
                    await dicecontract.deposit(amount.toString())).wait());
                    setLoading(false);
            } catch (error) {
                if((new String(error)).includes('transfer amount exceeds balance'))
                notifications.showNotification({
                    color: 'red',
                    title: 'Error.',
                    message: 'transfer amount exceeds balance',
                })
                if((new String(error)).includes('transfer amount exceeds allowance'))
                {notifications.showNotification({
                    color: 'red',
                    title: 'Error.',
                    message: 'transfer amount exceeds allowance',
                })
                setAllowanceIn(false);

            }
                setLoading(false);
                return;
            }
            setRollEnabled(true);
           
        }
    };

    const withdrawWinnings = async () => {
        try {
            setLoading(true);
  
                const tnx =  await dicecontract.withdrawWinnings();

                await tnx.wait();

                setLoading(false); 
        } catch (error) {
            notifications.showNotification({
                color: 'red',
                title: 'Error.',
                message: error.data.message,
            })
            setLoading(false);
            return;
        }
       

    };


    const withdrawEarnings = async () => {
       
        try {
            setLoading(true);
 
              const tnx =  await dicecontract.consolidate(address);

                await tnx.wait();
                stats();
                setLoading(false);

        } catch (error) {
            notifications.showNotification({
                color: 'red',
                title: 'Error.',
                message: error.data.message,
            })
            setLoading(false);
            return;
        }
      

    };


    const dropDice = async () => {

        const diceVal = diceNum;
        if (diceVal > 0 && diceVal < 7) {
            try {
                setLoading(true);
                const requestId = await dicecontract.currentRequest(address);
                if (requestId) {

                    const tnx= await dicecontract.rollDyce(diceVal, requestId.toString());

                    await tnx.wait();

                    const status = await dicecontract.gamestatus(requestId.toString());

                    setWinNumber(status.toNumber());

                    if(status.toNumber()==diceVal){
                        setWinStatus("You Won 2X of your Deposit")
                    } else {
                        setWinStatus("Better luck next time")
                    }

                    setLoading(false);

                }


            } catch (error) {
                notifications.showNotification({
                    color: 'red',
                    title: 'Error.',
                    message: error.data.message,
                })
                setLoading(false);
                return;
            }
            setRollEnabled(false);

        }


    }

    const stats = async () => {


        if (address) {
            setLoading(true);

            const poolContract = new ethers.Contract(
                TOKEN.address,
                dyce.abi,
                signer
            );

            setDiceContract(poolContract);

            const owner = await poolContract.owner();

            if(owner == address){
                setAdminButton(true);

            }
            const usersrcBalance = await SRCCONTRACT.balanceOf(address);
            setUsersrcBalance(Number(ethers.utils.formatEther(usersrcBalance)).toFixed(4));
            const inAllowance = await isSRCApproved();
            setAllowanceIn(inAllowance);
            setLoading(false);
        }

    }

    useEffect(() => {
        if (address) {

            stats();
        }

    }, [address]);

    return (
        <Box>
            <Card
                shadow="lg"
                radius="md"
                className="card"
            >

                <LoadingOverlay visible={loading} style={{ zIndex: +10 }} loader={DiceLoading} />
                <Group position="apart" style={{ marginBottom: 5 }}>
                    <Title order={4} align={"center"} style={{ color: '#d8daeb' }}>
                        Purchase roll
                    </Title>
                    <Group position="apart" style={{ marginBottom: 15 }}>
                            <Text style={{ color: '#969bd5', fontSize: "10" }}>
                                Your balance</Text>

                            <Text style={{ color: '#969bd5', fontSize: "10" }}>
                                {usersrcBalance && usersrcBalance} USDT</Text>

                        </Group>
                </Group>
                <Grid columns={16} style={{ marginTop: 25 }}>
                    <Grid.Col span={16}> 
                        <NumberInput
                            placeholder="0.0"
                            variant="filled"
                            size="sm"
                            styles={{ input: { width: "100%", boxSizing: "border-box" } }}
                            style={{ marginBottom: 15 }}
                            value={depositvalue}
                            onChange={(value) =>
                                setDepositvalue(value)
                            }
                            hideControls
                        />
                    </Grid.Col>

                </Grid>
                <Group position="apart">
                <Group position="left">
                    <InfoCircle
                        size={22}
                        strokeWidth={2}
                        color={'#d8daeb'}
                    />   <Title order={6} align={"center"} style={{ color: '#969bd5' }}>
                        Bet range :
                    </Title>
                    <Title order={6} align={"center"} style={{ color: '#d8daeb' }}>
                        5 USDT to 10 USDT
                    </Title>
                </Group>
                <Group position="right">
                    <InfoCircle
                        size={22}
                        strokeWidth={2}
                        color={'#d8daeb'}
                    />   <Title order={6} align={"center"} style={{ color: '#969bd5' }}>
                        Win amount :
                    </Title>
                    <Title order={6} align={"center"} style={{ color: '#d8daeb' }}>
                        2X
                    </Title>
                </Group>
                </Group>
               
                {allowanceIn ? <Button variant="gradient" fullWidth
                    gradient={{ from: "indigo", to: "violet" }}
                    style={{ marginTop: 20, }}
                    radius="lg"
                    size="sm"
                    onClick={() => {
                        onDeposit(
                            WETH9.address,
                            depositvalue,
                            TOKEN.address
                        );
                    }}
                > PURCHASE ROLL</Button> :
                    <Button variant="gradient" fullWidth
                        gradient={{ from: "tomato", to: "red" }}
                        style={{ marginTop: 20, }}
                        radius="lg"
                        size="sm"
                        onClick={() => {
                            ApproveSrc();
                        }}
                    > Approve</Button>
                }
                {usersrcBalance && usersrcBalance <= 0 && <Group position="center" style={{ marginTop: 20 }}>
                    <Badge size="lg" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>Insufficient {WETH9.name} Balance</Badge>
                </Group>}
            </Card>

            <Card
                shadow="lg"
                radius="md"
                className="card"
            >
              
                <Group position="left" style={{ marginBottom: 5 }}>
                    <CircleNumber1
                        size={32}
                        strokeWidth={2}
                        color={'#d8daeb'}
                    />   <Title order={4} align={"center"} style={{ color: '#d8daeb' }}>
                        Drop dice
                    </Title>
                </Group>
                  
                <Grid columns={16} style={{ marginTop: 10 }}>
                    <Grid.Col span={16}>
                    <Group position="apart" style={{ marginBottom: 5 }}>
                    <Group position="left" style={{ marginBottom: 15 }}>
                            <InfoCircle
                                size={22}
                                strokeWidth={2}
                                color={'#d8daeb'}
                            />   <Title order={6} align={"center"} style={{ color: '#969bd5' }}>
                                Chose a Dice and hit the Drop button
                            </Title>

                        </Group>
                        
                <Group position="right">
                    <SegmentedControl fullWidth color="orange"
                        style={{ margin: 0, backgroundColor: "#303250" }}
                        onChange={(val) => setDiceNum(val)}
                        styles={{
                            label: { padding: 0, color: 'red' },
                            labelActive: { padding: 0, color: 'red' },
                        }}
                        data={[
                            {
                                value: '1',
                                label: (
                                    <Dice1 size={50}
                                        strokeWidth={1}
                                        color={'#ffffff'} />
                                ),
                            },
                            {
                                value: '2',
                                label: (
                                    <Dice2 size={50}
                                        strokeWidth={1}
                                        color={'#ffffff'} />
                                ),
                            },
                            {
                                value: '3',
                                label: (
                                    <Dice3 size={50}
                                        strokeWidth={1}
                                        color={'#ffffff'} />
                                ),
                            },
                            {
                                value: '4',
                                label: (
                                    <Dice4 size={50}
                                        strokeWidth={1}
                                        color={'#ffffff'} />
                                ),
                            },
                            {
                                value: '5',
                                label: (
                                    <Dice5 size={50}
                                        strokeWidth={1}
                                        color={'#ffffff'} />
                                ),
                            },
                            {
                                value: '6',
                                label: (
                                    <Dice6 size={50}
                                        strokeWidth={1}
                                        color={'#ffffff'} />
                                ),
                            },
                        ]}
                    />
                </Group>

</Group>
                        

                    </Grid.Col>

                </Grid>
                <Group position="center" style={{ marginTop: 15 }}>
                {winStatus && <Badge size="sm" variant="gradient" gradient={{ from: 'orange', to: 'red'  }}>{winStatus}</Badge>}
                </Group>
                {rollEnabled ? <Button variant="gradient" fullWidth
                    gradient={{ from: "orange", to: "violet" }}
                    style={{ marginTop: 20, }}
                    radius="lg"
                    size="sm"
                    onClick={() => {
                        dropDice();
                    }}
                > DROP</Button> :
                    <Button variant="gradient" fullWidth
                        gradient={{ from: "orange", to: "violet" }}
                        style={{ marginTop: 20, }}
                        radius="lg"
                        size="sm"
                        disabled
                    > DROP</Button>}
            </Card>

            {adminButton ? <Button variant="gradient" fullWidth
                    gradient={{ from: "indigo", to: "orange" }}
                    style={{ marginTop: 20, }}
                    radius="lg"
                    size="sm"
                    onClick={() => {
                        withdrawEarnings();
                    }}
                > Admin Withdraw</Button> :
                    <Button variant="gradient" fullWidth
                        gradient={{ from: "indigo", to: "orange" }}
                        style={{ marginTop: 20, }}  
                        radius="lg"
                        size="sm"
                        onClick={() => {
                            withdrawWinnings();
                        }}
                    > Withdraw</Button>}

        </Box>
    );

}