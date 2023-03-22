import { Lucid,  fromText,  fromHex, sha256, toHex, Data, PolicyId, SpendingValidator, toUnit, TxHash, Constr, } from 'lucid-cardano';
import { useCallback, useEffect, useState } from 'react';
import {aadaValidator, mintTransactionFromAsset, aadaValidatorDatum, getUtxoIdInValidatorAddress} from './use-aada';

const useTransactionSender = (lucid?: Lucid) => {
    const [successMessage, setSuccessMessage] = useState<string>()
    const [error, setError] = useState<Error | undefined>()
    const [tokenName, setTokenName] = useState("")
    const [loanTx, setLoanTx] = useState("")

  useEffect(() => {
    if (!successMessage) return

    const timeout = setTimeout(() => setSuccessMessage(undefined), 5000)

    return () => clearTimeout(timeout)
  }, [successMessage])

    const cancelLiquidityRequest = useCallback(async () => {
        if (!lucid || !tokenName ) return

        try {
            const mintingValidator = await aadaValidator("borrowerNFT");
            const borrowerPolicy: PolicyId = lucid.utils.mintingPolicyToId(
                mintingValidator
            );
            const token = toUnit(borrowerPolicy, tokenName);

            const mintTransaction = await mintTransactionFromAsset(token);
            const requestValidator = await aadaValidator("requestHs");
            const requestValidatorAddress = "asaddr1z8tjrqy2dj5uk6her4ksltyxy2flzykktxkahzlahm9nwctfjcnq9fczt4qkxgec2hz6x7f38vnj8xuxywk4x4qgzh9st86ewu";
            const validatorUtxoIndex = await getUtxoIdInValidatorAddress(mintTransaction, requestValidatorAddress);

            const mintRedeemer = Data.to(
                new Constr(0, [
                new Constr(0, ["ff"]),
                BigInt(0)
                ]),
            );
            const validatorRedeemer = Data.to(
                "ff"
            );

            const utxoToConsumeObject = { txHash: mintTransaction, outputIndex: validatorUtxoIndex };

            const [utxo] = await lucid.utxosByOutRef([utxoToConsumeObject]);

            const tx = await lucid
                .newTx()
                .collectFrom([utxo], validatorRedeemer)
                .attachSpendingValidator(requestValidator)
                .mintAssets({
                    [token]: -1n,
                }, mintRedeemer)
                .attachMintingPolicy(mintingValidator)
                .complete();
            console.log("Built tx");

            const signedTx = await tx.sign().complete()
            const txHash = await signedTx.submit()

            setSuccessMessage(`Transaction submitted with hash ${txHash}`)
        } catch (e) {
            if (e instanceof Error) setError(e)
            else console.error(e)
        }
    }, [lucid, tokenName])

const cancelLiquidityDeposit = useCallback(async () => {
    // console.log("Will cancel request", utxoToConsume);
    if (!lucid || !tokenName ) return

    try {
        const mintingValidator = await aadaValidator("lenderNFT");
        const lenderPolicy: PolicyId = lucid.utils.mintingPolicyToId(
            mintingValidator
        );
        const token = toUnit(lenderPolicy, tokenName);
        const mintTransaction = await mintTransactionFromAsset(token);

        const requestValidator = await aadaValidator("debtRequestHS");

        const debtRequestValidator = "addr1zy6v8c7xdhftln7zk5uvt9h6jaknaxlx6hz5nkw63mpgwamfjcnq9fczt4qkxgec2hz6x7f38vnj8xuxywk4x4qgzh9sw9snf6";
        const validatorUtxoIndex = await getUtxoIdInValidatorAddress(mintTransaction, debtRequestValidator);

        const mintRedeemer = Data.to(
            new Constr(0, [
                new Constr(0, ["ff"]),
                BigInt(0)
            ]),
        );
        const validatorRedeemer = Data.to(
            "ff"
        );

        const utxoToConsumeObject = { txHash: mintTransaction, outputIndex: validatorUtxoIndex };

        const [utxo] = await lucid.utxosByOutRef([utxoToConsumeObject]);

        const tx = await lucid
            .newTx()
            .collectFrom([utxo], validatorRedeemer)
            .attachSpendingValidator(requestValidator)
            .mintAssets({
                [token]: -1n,
            }, mintRedeemer)
            .attachMintingPolicy(mintingValidator)
            .complete();
        console.log("Built tx");

        const signedTx = await tx.sign().complete()
        const txHash = await signedTx.submit()

        setSuccessMessage(`Transaction submitted with hash ${txHash}`)
    } catch (e) {
        if (e instanceof Error) setError(e)
        else console.error(e)
    }
}, [lucid, tokenName])


    const paybackLoan = useCallback(async () => {
        console.log("Will Payback the loan", loanTx);
        console.log("token", tokenName);
        if (!lucid || !tokenName || !loanTx ) return
        try {
            console.log("let's proceed");
            console.log("Loan TX", loanTx);
            const collateralAddress = "addr1zyc7w5n699ews00yujnhw59g4nuzykuzgl5x6nzqp49zv5tfjcnq9fczt4qkxgec2hz6x7f38vnj8xuxywk4x4qgzh9sdyxnxc";
            const interestAddress = "addr1zxfgvtfgp9476dhmq8fkm3x8wg20v33s6c9unyxmnpm0y5rfjcnq9fczt4qkxgec2hz6x7f38vnj8xuxywk4x4qgzh9st8q78h";

            const mintingValidator = await aadaValidator("borrowerNFT");

            const borrowerPolicy: PolicyId = lucid.utils.mintingPolicyToId(
                mintingValidator
            );
            const token = toUnit(borrowerPolicy, tokenName);
            console.log("Borrower NFT", token);
            const collateralValidator = await aadaValidator("collateralHS");

            const validatorDatum = await aadaValidatorDatum(collateralAddress, loanTx);
            console.log("validator datum", validatorDatum);
            const lenderTokenName = validatorDatum.json_value.fields[13]['bytes'];
            const expectedLoanTime = validatorDatum.json_value.fields[8]['int'];
            let interestToken = validatorDatum.json_value.fields[4]['fields'][0]['bytes'] + validatorDatum.json_value.fields[4]['fields'][1]['bytes'];

            let interestPolicy = validatorDatum.json_value.fields[4]['fields'][0]['bytes'];
            let interestTn = validatorDatum.json_value.fields[4]['fields'][1]['bytes'];

            let loanToken = validatorDatum.json_value.fields[2]['fields'][0]['bytes']+validatorDatum.json_value.fields[2]['fields'][1]['bytes']
            let loanPolicy = validatorDatum.json_value.fields[2]['fields'][0]['bytes'];
            let loanTn = validatorDatum.json_value.fields[2]['fields'][1]['bytes']

            const loanAmount = validatorDatum.json_value.fields[3]['int']
            const interestMaxValue = validatorDatum.json_value.fields[5]['int']
            const loanStartPosix = Number(validatorDatum.json_value.fields[14]['int'])
            const currentTime = new Date().getTime()
            const loanEndTime = Number(currentTime)+1800000;

            const loanTime = loanEndTime-loanStartPosix

            let interestAmount;
            if (loanTime > expectedLoanTime){
                interestAmount = interestMaxValue;
            } else {
                if (loanTime< expectedLoanTime*0.2){
                    interestAmount = Math.round(interestMaxValue*0.2);
                }
                else{
                    interestAmount = Math.round(loanTime/expectedLoanTime*interestMaxValue);
                }
            }
            var loanTokenUnit = 'lovelace';
            var interestTokenUnit = 'lovelace';

            if (interestToken != ''){
                var interestTokenUnit = toUnit(interestPolicy, interestTn);
            }
            console.log("loan token", loanToken);
            if (loanToken != ''){
                console.log("Loan token is not loivelaces");
                var loanTokenUnit = toUnit(loanPolicy, loanTn);
            }

            const txOutDatum = Data.to(
                lenderTokenName
            );
            console.log(txOutDatum);

            const validatorUtxoIndex = await getUtxoIdInValidatorAddress(loanTx, collateralAddress);

            const mintRedeemer = Data.to(
                new Constr(0, [
                    new Constr(0, ["ff"]),
                    BigInt(0)
                ]),
            );
            const validatorRedeemer = Data.to(
                0n
            );

            const utxoToConsumeObject = { txHash: loanTx, outputIndex: validatorUtxoIndex };

            const [utxo] = await lucid.utxosByOutRef([utxoToConsumeObject]);

            let metadata = {
                msg: "Repaid this from my custom code. Who is a newbie?",
            }

            console.log(txOutDatum);
            console.log(validatorDatum);
            console.log(mintRedeemer);
            console.log(token);
            console.log(loanTokenUnit);
            console.log(interestTokenUnit);

            const tx = await lucid
                .newTx()
                .collectFrom([utxo], validatorRedeemer)
                .attachSpendingValidator(collateralValidator)
                .payToContract(interestAddress, txOutDatum, { [loanTokenUnit]: BigInt(loanAmount), [interestTokenUnit]: BigInt(interestAmount)})
                .mintAssets({
                    [token]: -1n,
                }, mintRedeemer)
                .attachMintingPolicy(mintingValidator)
                .attachMetadata(32, metadata)
                .validFrom(currentTime)
                .validTo(loanEndTime)
                .complete();

            const signedTx = await tx.sign().complete()
            const txHash = await signedTx.submit()

            setSuccessMessage(`Transaction submitted with hash ${txHash}`)
        } catch (e) {
            if (e instanceof Error) setError(e)
            else console.error(e)
        }
    }, [lucid, loanTx, tokenName])

    const liquidateExpired = useCallback(async () => {
        console.log("Will liquidate expired loan", loanTx);
        if (!lucid || !tokenName ) return
        try {
            console.log("let's proceed");

            const mintingValidator = await aadaValidator("lenderNFT");

            const lenderPolicy: PolicyId = lucid.utils.mintingPolicyToId(
                mintingValidator
            );
            const token = toUnit(lenderPolicy, tokenName);
            console.log("token", token);
            const mintTransaction = await mintTransactionFromAsset(token);

            const collateralValidator = await aadaValidator("collateralHSOld");

            const currentTime = new Date().getTime()
            const loanEndTime = Number(currentTime)+1800000;

            const collateralAddress = "addr1zyc7w5n699ews00yujnhw59g4nuzykuzgl5x6nzqp49zv5tfjcnq9fczt4qkxgec2hz6x7f38vnj8xuxywk4x4qgzh9sdyxnxc";
            const validatorUtxoIndex = await getUtxoIdInValidatorAddress(loanTx, collateralAddress);

            const mintRedeemer = Data.to(
                new Constr(0, [
                    new Constr(0, ["ff"]),
                    BigInt(0)
                ]),
            );
            const validatorRedeemer = Data.to(
                0n
            );
            console.log("loanTx", mintTransaction);
            const utxoToConsumeObject = { txHash: mintTransaction, outputIndex: validatorUtxoIndex };
            const [utxo] = await lucid.utxosByOutRef([utxoToConsumeObject]);

            const tx = await lucid
                .newTx()
                .collectFrom([utxo], validatorRedeemer)
                .attachSpendingValidator(collateralValidator)
                .mintAssets({
                    [token]: -1n,
                }, mintRedeemer)
                .attachMintingPolicy(mintingValidator)
                .validFrom(currentTime)
                .validTo(loanEndTime)
                .complete();

            const signedTx = await tx.sign().complete()
            const txHash = await signedTx.submit()

            setSuccessMessage(`Transaction submitted with hash ${txHash}`)
        } catch (e) {
            if (e instanceof Error) setError(e)
            else console.error(e)
        }
    }, [lucid, tokenName])

    const withdrawInterest = useCallback(async () => {
        console.log("Will withdraw repaid loan", loanTx);
        if (!lucid || !tokenName || !loanTx ) return
        try {
            console.log("let's proceed");

            const mintingValidator = await aadaValidator("lenderNFT");

            const lenderPolicy: PolicyId = lucid.utils.mintingPolicyToId(
                mintingValidator
            );

            const token = toUnit(lenderPolicy, tokenName);
            console.log("token", token);

            const collateralValidator = await aadaValidator("interestHS");

            const intesrestAddress = "addr1zxfgvtfgp9476dhmq8fkm3x8wg20v33s6c9unyxmnpm0y5rfjcnq9fczt4qkxgec2hz6x7f38vnj8xuxywk4x4qgzh9st8q78h";
            const validatorUtxoIndex = await getUtxoIdInValidatorAddress(loanTx, intesrestAddress);
            console.log("validatorUtxo", validatorUtxoIndex);

            const mintRedeemer = Data.to(
                new Constr(0, [
                    new Constr(0, ["ff"]),
                    BigInt(0)
                ]),
            );
            const validatorRedeemer = Data.to(
                0n
            );

            const utxoToConsumeObject = { txHash: loanTx, outputIndex: validatorUtxoIndex };
            const [utxo] = await lucid.utxosByOutRef([utxoToConsumeObject]);

            const tx = await lucid
                .newTx()
                .collectFrom([utxo], validatorRedeemer)
                .attachSpendingValidator(collateralValidator)
                .mintAssets({
                    [token]: -1n,
                }, mintRedeemer)
                .attachMintingPolicy(mintingValidator)
                .complete();

            const signedTx = await tx.sign().complete()
            const txHash = await signedTx.submit()

            setSuccessMessage(`Transaction submitted with hash ${txHash}`)
        } catch (e) {
            if (e instanceof Error) setError(e)
            else console.error(e)
        }
    }, [lucid, tokenName, loanTx])

    const withdrawCollateral = useCallback(async () => {
        console.log("Will withdraw liquidated collateral", loanTx);
        if (!lucid || !tokenName || !loanTx ) return
        try {
            console.log("let's proceed");

            const mintingValidator = await aadaValidator("borrowerNFT");

            const borrowerPolicy: PolicyId = lucid.utils.mintingPolicyToId(
                mintingValidator
            );
            const token = toUnit(borrowerPolicy, tokenName);
            console.log("token", token);

            const collateralValidator = await aadaValidator("liquidationHS");

            const liquidationAddress = "addr1zxcjtxuc7mj8w6v9l3dfxvm30kxf78nzw387mqjqvszxr4mfjcnq9fczt4qkxgec2hz6x7f38vnj8xuxywk4x4qgzh9sp92046";
            const validatorUtxoIndex = await getUtxoIdInValidatorAddress(loanTx, liquidationAddress);

            const mintRedeemer = Data.to(
                new Constr(0, [
                    new Constr(0, ["ff"]),
                    BigInt(0)
                ]),
            );
            const validatorRedeemer = Data.to(
                0n
            );

            const utxoToConsumeObject = { txHash: loanTx, outputIndex: validatorUtxoIndex };
            const [utxo] = await lucid.utxosByOutRef([utxoToConsumeObject]);

            const tx = await lucid
                .newTx()
                .collectFrom([utxo], validatorRedeemer)
                .attachSpendingValidator(collateralValidator)
                .mintAssets({
                    [token]: -1n,
                }, mintRedeemer)
                .attachMintingPolicy(mintingValidator)
                .complete();

            const signedTx = await tx.sign().complete()
            const txHash = await signedTx.submit()

            setSuccessMessage(`Transaction submitted with hash ${txHash}`)
        } catch (e) {
            if (e instanceof Error) setError(e)
            else console.error(e)
        }
    }, [lucid, tokenName, loanTx])

    const tokenNameSetter = useCallback((value: string) => {
        setError(undefined)
        setSuccessMessage(undefined)
        setTokenName(value)
    }, [])

    const loanTxSetter = useCallback((value: string) => {
        setError(undefined)
        setSuccessMessage(undefined)
        setLoanTx(value)
    }, [])


  return {
      error,
      successMessage,
      tokenName,
      setTokenName: tokenNameSetter,
      loanTx,
      setLoanTx: loanTxSetter,
      cancelLiquidityRequest,
      cancelLiquidityDeposit,
      paybackLoan,
      liquidateExpired,
      withdrawInterest,
      withdrawCollateral
  }
}

export { useTransactionSender }
