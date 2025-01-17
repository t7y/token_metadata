import { Connection, Keypair, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import {createInitializeInstruction, createUpdateFieldInstruction, pack, TokenMetadata} from "@solana/spl-token-metadata";
import { createInitializeMetadataPointerInstruction, createInitializeMintInstruction, ExtensionType, getMintLen, getTokenMetadata, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"));

const payer = await getKeypairFromFile("~/.config/solana/id.json");
console.log("payer", payer.publicKey.toBase58());

const mint = Keypair.generate();

console.log("mint", mint.publicKey.toBase58());

// const metadata: TokenMetadata = {
//     mint: mint.publicKey,
//     name: "USDA",
//     symbol: "USDA",
//     uri: "https://raw.githubusercontent.com/t7y/solana_mint_setup/refs/heads/main/metadata.json",
//     additionalMetadata: [
//         ["key", "value"],
//     ],
// };

const metadata: TokenMetadata = {
    mint: mint.publicKey,
    name: "only possible on solana",
    symbol: "OPOS",
    uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json",
    additionalMetadata: [
        ["key", "value"],
    ],
};

const mintSpace = getMintLen([ExtensionType.MetadataPointer]);

const metadtaSpace = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace + metadtaSpace);

const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    lamports,
    space: mintSpace,
    programId: TOKEN_2022_PROGRAM_ID,
});

const initializeMetadataPointerIx = createInitializeMetadataPointerInstruction(
    mint.publicKey,
    payer.publicKey,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID,
);

const initializeMintIx = createInitializeMintInstruction(
    mint.publicKey,
    2,
    payer.publicKey,
    null,
    TOKEN_2022_PROGRAM_ID,
);

const initializeMetadataIx = createInitializeInstruction({
    mint: mint.publicKey,
    metadata: mint.publicKey,
    mintAuthority: payer.publicKey,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    programId: TOKEN_2022_PROGRAM_ID,   
    updateAuthority: payer.publicKey,
});

const updateMetadataField = createUpdateFieldInstruction({
    metadata: mint.publicKey,
    programId: TOKEN_2022_PROGRAM_ID,
    updateAuthority: payer.publicKey,
    field: metadata.additionalMetadata[0][0],
    value: metadata.additionalMetadata[0][1],
});

// the order matters!
const transaction = new Transaction().add(
    createAccountIx,
    initializeMetadataPointerIx,
    initializeMintIx,
    initializeMetadataIx,
    updateMetadataField,
);

const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mint],
);
console.log("signature", signature);

const chainMetadata = await getTokenMetadata(connection, mint.publicKey);
console.log(chainMetadata);

