// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { genWallet, parseChain, Wallet } from "../../src/wallet";

export default function handler(req: NextApiRequest, res: NextApiResponse<Wallet>) {
    res.status(200).json(genWallet(parseChain(req.query.chain)));
}
