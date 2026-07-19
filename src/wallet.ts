import { ethers } from "ethers";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { words } from "./wordList";
import { Chain } from "./themes";

// standard Solana BIP44 account path (what Phantom/Solflare use)
const SOLANA_PATH = "m/44'/501'/0'/0'";

export type Wallet = {
    phrase: string;
    address: string;
};

function genSeedPhrase() {
    let seedPhrase = [];
    for (let i = 0; i < 12; i++) {
        let number = Math.floor(Math.random() * 2048);
        seedPhrase.push(words[number]);
    }

    return seedPhrase.join(" ");
}

// keep drawing until the checksum word lands in the right place
function getValidPhrase(): string {
    let phrase = genSeedPhrase();
    if (ethers.utils.isValidMnemonic(phrase) === false) return getValidPhrase();

    return phrase;
}

function toEthereum(phrase: string): Wallet {
    return {
        phrase: phrase,
        address: ethers.Wallet.fromMnemonic(phrase).address,
    };
}

function toSolana(phrase: string): Wallet {
    let seed = mnemonicToSeedSync(phrase);
    let derived = derivePath(SOLANA_PATH, seed.toString("hex")).key;
    let keypair = nacl.sign.keyPair.fromSeed(derived);

    return {
        phrase: phrase,
        address: bs58.encode(keypair.publicKey),
    };
}

export function genWallet(chain: Chain): Wallet {
    let phrase = getValidPhrase();

    return chain === "solana" ? toSolana(phrase) : toEthereum(phrase);
}

export function parseChain(value: unknown): Chain {
    return value === "solana" ? "solana" : "ethereum";
}
