export type Chain = "ethereum" | "solana";

export type Theme = {
    label: string;
    subtle: string;
    info: string;
    hover: string;
};

export const themes: Record<Chain, Theme> = {
    ethereum: {
        label: "#c9d1ff",
        subtle: "#828cbf",
        info: "#97a1f0",
        hover: "rgba(39, 38, 66, 1)",
    },
    solana: {
        label: "#caffd9",
        subtle: "#7fbf90",
        info: "#8bf0a4",
        hover: "rgba(28, 60, 38, 1)",
    },
};
