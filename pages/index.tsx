import type { NextPage } from "next";
import Head from "next/head";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useState } from "react";

const Home: NextPage = () => {
    const copyAddress = () => {
        navigator.clipboard.writeText(`0x118fE30C4957d918C015C5D3B85734af7579Ae35`);
        setTextState("Copied.");

        setTimeout(() => setTextState("118fE30C4957d918C015C5D3B85734af7579Ae35"), 1000);
    };

    const [textState, setTextState] = useState("118fE30C4957d918C015C5D3B85734af7579Ae35");

    return (
        <>
            <Head>
                <title>zroi</title>
            </Head>
            <Main>
                <Address
                    style={{ filter: "drop-shadow(0 0 0px #fff)" }}
                    whileHover={{ cursor: "pointer", filter: "drop-shadow(0 0 3px #fff)" }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    onClick={copyAddress}
                >
                    <motion.span style={{ color: "#808091" }}>{textState == "Copied." ? "" : "0x"}</motion.span>
                    {textState}
                </Address>
            </Main>
        </>
    );
};

const Main = styled(motion.div)`
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Address = styled(motion.p)`
    color: #f5f5f7;
    font-size: 1.35rem;
    font-weight: semibold;
    font-family: IBM Plex Mono;
    user-select: none;
`;

export default Home;
