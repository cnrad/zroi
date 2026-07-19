import type { NextPage } from "next";
import Head from "next/head";
import styled, { ThemeProvider } from "styled-components";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Chain, themes } from "../src/themes";

type PhraseRes = {
    phrase: string;
    address: string;
};

// publicnode sustained 30/30 at 50ms, so 150ms leaves plenty of headroom
const SCAN_INTERVAL = 150;
// on a rate limit, back off from here and double up to the ceiling
const BACKOFF_MIN = 1000;
const BACKOFF_MAX = 15000;

// theme swap eases slowly; hover affordances snap
const THEME = "400ms ease-out";
const HOVER = "120ms ease-out";

const Home: NextPage = () => {
    const [chain, setChain] = useState<Chain>("ethereum");
    const [seedPhrase, setSeedPhrase] = useState("...");
    const [address, setAddress] = useState("...");
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(0);
    const [status, setStatus] = useState("");

    // the scan loop reads this to notice a stop request mid-flight
    const scanningRef = useRef(false);
    const theme = themes[chain];

    useEffect(() => {
        // don't leave a loop running against an unmounted page
        return () => {
            scanningRef.current = false;
        };
    }, []);

    const stopScan = () => {
        scanningRef.current = false;
        setScanning(false);
    };

    const toggleChain = () => {
        stopScan();
        setChain(chain === "ethereum" ? "solana" : "ethereum");

        // the old address belongs to the old chain, so clear it out
        setSeedPhrase("...");
        setAddress("...");
        setScanned(0);
        setStatus("");
    };

    const fetchPhrase = () => {
        stopScan();
        setScanned(0);
        setStatus("");
        setSeedPhrase("loading...");
        setAddress("loading...");

        fetch(`/api/genPhrase?chain=${chain}`).then(async (res: Response) => {
            let info: PhraseRes = await res.json();
            setSeedPhrase(info.phrase);
            setAddress(info.address);
        });
    };

    const scan = async () => {
        if (scanningRef.current) return stopScan();

        scanningRef.current = true;
        setScanning(true);
        setScanned(0);

        let count = 0;
        let backoff = BACKOFF_MIN;

        while (scanningRef.current) {
            setStatus("checking...");

            try {
                let res = await fetch(`/api/scan?chain=${chain}`);
                let info = await res.json();

                // a stop landing mid-request shouldn't repaint the UI
                if (!scanningRef.current) return;

                if (!res.ok) {
                    let wait = Math.round(backoff / 1000);

                    setStatus(
                        info?.rateLimited
                            ? `rate limited, retrying in ${wait}s...`
                            : `explorer unreachable, retrying in ${wait}s...`
                    );

                    await sleep(backoff);
                    backoff = Math.min(backoff * 2, BACKOFF_MAX);
                    continue;
                }

                // a clean response means the pressure is off
                backoff = BACKOFF_MIN;
                count++;
                setScanned(count);
                setSeedPhrase(info.phrase);
                setAddress(info.address);

                if (info.active) {
                    // leave the hit on screen rather than scanning past it
                    setStatus("activity found — stopped.");
                    return stopScan();
                }

                setStatus("no activity, continuing...");
            } catch {
                if (!scanningRef.current) return;

                setStatus(`network error, retrying in ${Math.round(backoff / 1000)}s...`);
                await sleep(backoff);
                backoff = Math.min(backoff * 2, BACKOFF_MAX);
                continue;
            }

            await sleep(SCAN_INTERVAL);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <>
                <Head>
                    <title>zroi</title>
                </Head>
                <Main
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.75, ease: [0, 0.75, 0.5, 1] }}
                >
                    <Header>
                        <Title>zroi.</Title>
                        <Description>
                            disposable{" "}
                            <ChainToggle onClick={toggleChain} title="switch chain">
                                {chain}
                                <ToggleIcon>
                                    <Reload color="currentColor" />
                                </ToggleIcon>
                            </ChainToggle>{" "}
                            wallets.
                        </Description>
                    </Header>
                    <InfoWrapper>
                        <InfoText>
                            <Label>Phrase: </Label>
                            {seedPhrase}
                        </InfoText>
                        <InfoText>
                            <Label>Address: </Label>
                            {address}
                        </InfoText>

                        <GenButton
                            initial={{ background: "rgba(0, 0, 0, 0)" }}
                            whileHover={{ background: theme.hover, cursor: "pointer" }}
                            whileTap={{ scale: 0.92 }}
                            transition={{ duration: 0.1, ease: "easeInOut" }}
                            onClick={fetchPhrase}
                        >
                            <Reload color="#fff" />
                        </GenButton>
                    </InfoWrapper>
                    <ScanArea>
                        <ScanStatus>
                            {scanned > 0 && `${scanned.toLocaleString()} checked`}
                            {scanned > 0 && status && " — "}
                            {status}
                        </ScanStatus>
                        <ScanButton
                            initial={{ background: "rgba(0, 0, 0, 0)" }}
                            whileHover={{ background: theme.hover, cursor: "pointer" }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ duration: 0.1, ease: "easeInOut" }}
                            onClick={scan}
                        >
                            {scanning ? "Stop" : "Scan"}
                        </ScanButton>
                    </ScanArea>
                </Main>
            </>
        </ThemeProvider>
    );
};

const Main = styled(motion.div)`
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Header = styled.div`
    position: absolute;
    top: 7rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    @media (max-height: 700px) {
        top: 4rem;
    }

    @media (max-height: 500px) {
        display: none;
    }
`;
const Title = styled.div`
    font-size: 3rem;
    color: #fff;
    font-weight: 600;
    margin-bottom: 0.75rem;
`;

const Description = styled.div`
    font-size: 1.5rem;
    color: ${props => props.theme.subtle};
    font-weight: 400;
    text-align: center;
    transition: color ${THEME};
`;

const ToggleIcon = styled.span`
    display: inline-flex;
    align-items: center;
    width: 0;
    opacity: 0;
    overflow: hidden;
    vertical-align: -0.15em;
    transition: width ${HOVER}, opacity ${HOVER}, margin-left ${HOVER};

    svg {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
    }
`;

const ChainToggle = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 0.1em 0.22em;
    margin: 0 -0.15em;
    border-radius: 0.25rem;
    color: ${props => props.theme.label};
    background: rgba(255, 255, 255, 0);
    user-select: none;
    transition: color ${THEME}, background ${HOVER}, padding ${HOVER}, margin ${HOVER};

    &:hover {
        cursor: pointer;
        padding: 0.1em 0.36em;
        margin: 0 -0.15em;
        background: ${props => props.theme.hover};
    }

    /* the only child span is the reload icon */
    &:hover > span {
        width: 1em;
        opacity: 1;
        margin-left: 0.35em;
    }
`;

const InfoWrapper = styled.div`
    width: 100vw;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const GenButton = styled(motion.button)`
    margin-top: 1rem;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    border: none;
`;

const InfoText = styled(motion.div)`
    color: ${props => props.theme.info};
    font-size: 1.35rem;
    font-weight: semibold;
    font-family: Roboto Mono;
    margin-bottom: 1rem;
    text-align: center;
    transition: color ${THEME};
`;

const Label = styled.span`
    user-select: none;
    color: ${props => props.theme.label};
    transition: color ${THEME};
`;

const ScanArea = styled.div`
    position: absolute;
    bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
`;

const ScanStatus = styled.div`
    height: 1.2em;
    color: ${props => props.theme.subtle};
    font-size: 0.9rem;
    font-family: Roboto Mono;
    user-select: none;
    transition: color ${THEME};
`;

const ScanButton = styled(motion.button)`
    padding: 0.3rem 1rem;
    border-radius: 0.2rem;
    border: none;
    color: ${props => props.theme.info};
    background: none;
    font-family: Roboto Mono;
    font-size: 0.85rem;
    transition: color ${THEME}, border-color ${THEME};
`;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default Home;

const Reload = (props: any) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={props.color}>
            <path d="M20.944 12.979c-.489 4.509-4.306 8.021-8.944 8.021-2.698 0-5.112-1.194-6.763-3.075l1.245-1.633c1.283 1.645 3.276 2.708 5.518 2.708 3.526 0 6.444-2.624 6.923-6.021h-2.923l4-5.25 4 5.25h-3.056zm-15.864-1.979c.487-3.387 3.4-6 6.92-6 2.237 0 4.228 1.059 5.51 2.698l1.244-1.632c-1.65-1.876-4.061-3.066-6.754-3.066-4.632 0-8.443 3.501-8.941 8h-3.059l4 5.25 4-5.25h-2.92z" />
        </svg>
    );
};
