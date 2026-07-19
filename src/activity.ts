import { Chain } from "./themes";

/**
 * Public JSON-RPC endpoints, no API key required, tried in order.
 *
 * Solana's own api.mainnet-beta.solana.com 429s hard — it only sustained ~10 of
 * 25 requests at a 400ms cadence — so it sits last as a fallback. publicnode
 * held 30/30 at 50ms on both chains.
 */
const RPC: Record<Chain, string[]> = {
    ethereum: ["https://ethereum-rpc.publicnode.com"],
    solana: ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"],
};

type RpcCall = { method: string; params: any[] };

export class RpcError extends Error {
    rateLimited: boolean;

    constructor(message: string, rateLimited: boolean) {
        super(message);
        this.rateLimited = rateLimited;
    }
}

async function callEndpoint(url: string, calls: RpcCall[]): Promise<any[]> {
    let body = calls.map((call, i) => ({ jsonrpc: "2.0", id: i, ...call }));

    let res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });

    if (res.status === 429) throw new RpcError("rate limited", true);
    if (!res.ok) throw new RpcError(`rpc returned ${res.status}`, false);

    let json = await res.json();
    if (!Array.isArray(json)) throw new RpcError("malformed batch response", false);

    // the spec lets a server reorder a batch, so match responses back by id
    return calls.map((_, i) => {
        let entry = json.find((r: any) => r.id === i);

        if (!entry) throw new RpcError(`missing response ${i}`, false);
        if (entry.error) throw new RpcError(`rpc error: ${entry.error.message}`, false);

        return entry.result;
    });
}

async function rpcBatch(chain: Chain, calls: RpcCall[]): Promise<any[]> {
    let last: RpcError = new RpcError(`no endpoint configured for ${chain}`, false);

    for (let url of RPC[chain]) {
        try {
            return await callEndpoint(url, calls);
        } catch (err: any) {
            // a struggling endpoint shouldn't end the scan while others remain
            last = err instanceof RpcError ? err : new RpcError(err?.message ?? "network error", false);
        }
    }

    throw last;
}

/**
 * Has this address ever been touched on chain?
 *
 * Note this only sees native-currency activity: an Ethereum address that has
 * only ever held ERC-20s / NFTs reads as untouched here.
 */
export async function hasActivity(chain: Chain, address: string): Promise<boolean> {
    if (chain === "solana") {
        let [balance, signatures] = await rpcBatch("solana", [
            { method: "getBalance", params: [address] },
            { method: "getSignaturesForAddress", params: [address, { limit: 1 }] },
        ]);

        return balance?.value > 0 || signatures.length > 0;
    }

    let [nonce, balance] = await rpcBatch("ethereum", [
        { method: "eth_getTransactionCount", params: [address, "latest"] },
        { method: "eth_getBalance", params: [address, "latest"] },
    ]);

    // a nonce covers anything sent, a balance covers anything received
    return isNonZeroHex(nonce) || isNonZeroHex(balance);
}

// these quantities overflow a JS number, so read the hex digits directly
function isNonZeroHex(quantity: string): boolean {
    return /[1-9a-f]/i.test(quantity.replace(/^0x/, ""));
}
