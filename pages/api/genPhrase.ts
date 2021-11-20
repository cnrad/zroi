// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { words } from "../../src/wordList";

type Data = {
    phrase: string;
    address: string;
};

const provider: any = ethers.getDefaultProvider("homestead", {
    etherscan: process.env.API_KEY,
});

function genSeedPhrase() {
    let seedPhrase = [];
    for (let i = 0; i < 12; i++) {
        let number = Math.floor(Math.random() * 2048);
        seedPhrase.push(words[number]);
    }

    return seedPhrase.join(" ");
}

function getSeedPhrase(): any {
    let phrase = genSeedPhrase();
    let result = ethers.utils.isValidMnemonic(phrase);

    if (result === false) return getSeedPhrase();

    let walletMnemonic = ethers.Wallet.fromMnemonic(phrase);

    let wallet = walletMnemonic.connect(provider);

    return {
        phrase: phrase,
        address: wallet.address,
    };
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let spData = getSeedPhrase();

    res.status(200).json({ phrase: spData.phrase, address: spData.address });
}
