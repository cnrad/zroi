import type { NextPage } from "next";
import Head from "next/head";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useState } from "react";

type PhraseRes = {
    phrase: string;
    address: string;
};

const Home: NextPage = () => {
    const copyAddress = () => {
        navigator.clipboard.writeText(`0x118fE30C4957d918C015C5D3B85734af7579Ae35`);
        setTextState("Copied.");

        setTimeout(() => setTextState("118fE30C4957d918C015C5D3B85734af7579Ae35"), 1000);
    };

    const fetchPhrase = () => {
        setSeedPhrase("loading...");
        setAddress("loading...");

        fetch("/api/genPhrase").then(async (res: Response) => {
            let info: PhraseRes = await res.json();
            setSeedPhrase(info.phrase);
            setAddress(info.address);
        });
    };

    const [textState, setTextState] = useState("118fE30C4957d918C015C5D3B85734af7579Ae35");
    const [seedPhrase, setSeedPhrase] = useState("...");
    const [address, setAddress] = useState("...");

    return (
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
                    <Description>disposable ethereum wallets.</Description>
                </Header>
                <InfoWrapper>
                    <InfoText>
                        <span style={{ userSelect: "none", color: "#c9d1ff" }}>Phrase: </span>
                        {seedPhrase}
                    </InfoText>
                    <InfoText>
                        <span style={{ userSelect: "none", color: "#c9d1ff" }}>Address: </span>
                        {address}
                    </InfoText>

                    <GenButton
                        initial={{ background: "rgba(0, 0, 0, 0)" }}
                        whileHover={{ background: "rgba(39, 38, 66, 1)", cursor: "pointer" }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ duration: 0.1, ease: "easeInOut" }}
                        onClick={fetchPhrase}
                    >
                        <Reload color="#fff">Generate Seed Phrase</Reload>
                    </GenButton>
                </InfoWrapper>
                <Donate>
                    <span style={{ color: "#616192" }}>Donate</span>
                    <Address
                        style={{ filter: "drop-shadow(0 0 0px #4225e6)" }}
                        whileHover={{ cursor: "pointer", filter: "drop-shadow(0 0 4px #4225e6)" }}
                        transition={{ duration: 0.15, ease: "easeInOut" }}
                        onClick={copyAddress}
                    >
                        <motion.span style={{ color: "#808091" }}>{textState == "Copied." ? "" : "0x"}</motion.span>
                        {textState}
                    </Address>
                </Donate>
            </Main>
        </>
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
    color: #828cbf;
    font-weight: 400;
    text-align: center;
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
    color: #97a1f0;
    font-size: 1.35rem;
    font-weight: semibold;
    font-family: Roboto Mono;
    margin-bottom: 1rem;
    text-align: center;
`;

const Donate = styled(motion.div)`
    position: absolute;
    bottom: 2rem;
    width: 100%;
    color: #363c59;
    font-size: 1.15rem;
    font-weight: semibold;
    font-family: Roboto Mono;
    user-select: none;
    text-align: center;
`;

const Address = styled(motion.p)`
    color: #e5e5e7;
    font-size: 0.95rem;
    font-weight: semibold;
    font-family: Roboto Mono;
    user-select: none;
    margin: 0.5rem;
`;

export default Home;

const Reload = (props: any) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={props.color}>
            <path d="M20.944 12.979c-.489 4.509-4.306 8.021-8.944 8.021-2.698 0-5.112-1.194-6.763-3.075l1.245-1.633c1.283 1.645 3.276 2.708 5.518 2.708 3.526 0 6.444-2.624 6.923-6.021h-2.923l4-5.25 4 5.25h-3.056zm-15.864-1.979c.487-3.387 3.4-6 6.92-6 2.237 0 4.228 1.059 5.51 2.698l1.244-1.632c-1.65-1.876-4.061-3.066-6.754-3.066-4.632 0-8.443 3.501-8.941 8h-3.059l4 5.25 4-5.25h-2.92z" />
        </svg>
    );
};
