import type { NextApiRequest, NextApiResponse } from "next";
import { genWallet, parseChain } from "../../src/wallet";
import { hasActivity, RpcError } from "../../src/activity";

type ScanRes = { phrase: string; address: string; active: boolean };
type ErrorRes = { error: string; rateLimited: boolean };

/**
 * Generate one wallet and report whether the chain has ever seen it. The client
 * drives the loop so it can paint each candidate as it goes and stop on a hit.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ScanRes | ErrorRes>) {
    let chain = parseChain(req.query.chain);
    let wallet = genWallet(chain);

    try {
        let active = await hasActivity(chain, wallet.address);

        res.status(200).json({ ...wallet, active: active });
    } catch (err: any) {
        // never report an unreachable explorer as "no activity" — that would
        // silently skip candidates we never actually checked
        let rateLimited = err instanceof RpcError && err.rateLimited;

        res.status(rateLimited ? 429 : 502).json({
            error: err?.message ?? "explorer lookup failed",
            rateLimited: rateLimited,
        });
    }
}
