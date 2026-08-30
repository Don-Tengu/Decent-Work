package com.web3.freelance.service;

import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.exception.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Numeric;

import java.io.IOException;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Verifies FreelanceEscrow fund/release transactions against the configured chain.
 */
@Service
@Slf4j
public class EscrowVerificationService {

    // EscrowCreated(uint256 indexed escrowId, uint256 indexed jobId, address client, address freelancer, address token, uint256 amount)
    private static final Event ESCROW_CREATED = new Event(
            "EscrowCreated",
            Arrays.asList(
                    new TypeReference<Uint256>(true) {},
                    new TypeReference<Uint256>(true) {},
                    new TypeReference<Address>(false) {},
                    new TypeReference<Address>(false) {},
                    new TypeReference<Address>(false) {},
                    new TypeReference<Uint256>(false) {}
            )
    );

    // EscrowCompleted(uint256 indexed escrowId, uint256 amount, uint256 fee)
    private static final Event ESCROW_COMPLETED = new Event(
            "EscrowCompleted",
            Arrays.asList(
                    new TypeReference<Uint256>(true) {},
                    new TypeReference<Uint256>(false) {},
                    new TypeReference<Uint256>(false) {}
            )
    );

    private static final String ESCROW_CREATED_TOPIC = EventEncoder.encode(ESCROW_CREATED);
    private static final String ESCROW_COMPLETED_TOPIC = EventEncoder.encode(ESCROW_COMPLETED);

    @Value("${web3.provider-url}")
    private String providerUrl;

    @Value("${web3.escrow-contract-address}")
    private String escrowContractAddress;

    @Value("${web3.chain-id:31337}")
    private long configuredChainId;

    @Value("${web3.token-address:}")
    private String paymentTokenAddress;

    public record FundVerification(
            String escrowId,
            long jobId,
            String clientWallet,
            String freelancerWallet,
            String amountWei,
            long chainId,
            String contractAddress
    ) {}

    public record ReleaseVerification(
            String escrowId,
            String amountToFreelancerWei,
            String feeWei,
            long chainId,
            String contractAddress
    ) {}

    public FundVerification verifyFunding(String transactionHash, long expectedJobId,
                                          String expectedClientWallet, String expectedFreelancerWallet,
                                          String expectedAmountWei) {
        TransactionReceipt receipt = requireSuccessfulReceipt(transactionHash);
        requireContractAddress(receipt);

        for (Log logEntry : receipt.getLogs()) {
            if (!addressesEqual(logEntry.getAddress(), escrowContractAddress)) {
                continue;
            }
            List<String> topics = logEntry.getTopics();
            if (topics == null || topics.isEmpty() || !topics.get(0).equalsIgnoreCase(ESCROW_CREATED_TOPIC)) {
                continue;
            }
            if (topics.size() < 3) {
                continue;
            }

            BigInteger escrowId = Numeric.toBigInt(topics.get(1));
            BigInteger jobId = Numeric.toBigInt(topics.get(2));

            @SuppressWarnings("rawtypes")
            List<Type> nonIndexed = FunctionReturnDecoder.decode(
                    logEntry.getData(),
                    ESCROW_CREATED.getNonIndexedParameters()
            );
            if (nonIndexed.size() < 4) {
                continue;
            }

            String client = ((Address) nonIndexed.get(0)).getValue();
            String freelancer = ((Address) nonIndexed.get(1)).getValue();
            String token = ((Address) nonIndexed.get(2)).getValue();
            BigInteger amount = (BigInteger) nonIndexed.get(3).getValue();

            if (paymentTokenAddress != null && !paymentTokenAddress.isBlank()
                    && !addressesEqual(token, paymentTokenAddress)) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "Funded token does not match the configured payment token");
            }

            if (jobId.longValue() != expectedJobId) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "On-chain job id does not match this payment");
            }
            if (!addressesEqual(client, expectedClientWallet)) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "Funding client wallet does not match the hiring client");
            }
            if (!addressesEqual(freelancer, expectedFreelancerWallet)) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "Funding freelancer wallet does not match the hired freelancer");
            }
            if (!amount.toString().equals(expectedAmountWei)) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "Funded amount does not match the bid amount (expected "
                                + expectedAmountWei + " atomic units, got " + amount + ")");
            }

            return new FundVerification(
                    escrowId.toString(),
                    jobId.longValue(),
                    normalizeAddress(client),
                    normalizeAddress(freelancer),
                    amount.toString(),
                    configuredChainId,
                    normalizeAddress(escrowContractAddress)
            );
        }

        throw new ValidationException(
                ErrorCode.INVALID_TRANSACTION,
                "No EscrowCreated event found for this transaction on the escrow contract");
    }

    public ReleaseVerification verifyRelease(String transactionHash, String expectedEscrowId) {
        TransactionReceipt receipt = requireSuccessfulReceipt(transactionHash);
        requireContractAddress(receipt);

        for (Log logEntry : receipt.getLogs()) {
            if (!addressesEqual(logEntry.getAddress(), escrowContractAddress)) {
                continue;
            }
            List<String> topics = logEntry.getTopics();
            if (topics == null || topics.isEmpty() || !topics.get(0).equalsIgnoreCase(ESCROW_COMPLETED_TOPIC)) {
                continue;
            }
            if (topics.size() < 2) {
                continue;
            }

            BigInteger escrowId = Numeric.toBigInt(topics.get(1));
            if (!escrowId.toString().equals(expectedEscrowId)) {
                throw new ValidationException(
                        ErrorCode.INVALID_TRANSACTION,
                        "Release escrow id does not match this payment");
            }

            @SuppressWarnings("rawtypes")
            List<Type> nonIndexed = FunctionReturnDecoder.decode(
                    logEntry.getData(),
                    ESCROW_COMPLETED.getNonIndexedParameters()
            );
            if (nonIndexed.size() < 2) {
                continue;
            }

            BigInteger amount = (BigInteger) nonIndexed.get(0).getValue();
            BigInteger fee = (BigInteger) nonIndexed.get(1).getValue();

            return new ReleaseVerification(
                    escrowId.toString(),
                    amount.toString(),
                    fee.toString(),
                    configuredChainId,
                    normalizeAddress(escrowContractAddress)
            );
        }

        throw new ValidationException(
                ErrorCode.INVALID_TRANSACTION,
                "No EscrowCompleted event found for this transaction on the escrow contract");
    }

    public long getConfiguredChainId() {
        return configuredChainId;
    }

    public String getEscrowContractAddress() {
        return escrowContractAddress;
    }

    public void requireConfiguredContract() {
        if (escrowContractAddress == null
                || escrowContractAddress.isBlank()
                || escrowContractAddress.replace("0x", "").replace("0X", "")
                .chars().allMatch(c -> c == '0')) {
            throw new ValidationException(
                    ErrorCode.SMART_CONTRACT_ERROR,
                    "Escrow contract address is not configured");
        }
    }

    private TransactionReceipt requireSuccessfulReceipt(String transactionHash) {
        if (transactionHash == null || transactionHash.isBlank()) {
            throw new ValidationException(ErrorCode.INVALID_TRANSACTION, "Transaction hash is required");
        }
        String trimmed = transactionHash.trim();
        final String hash = (trimmed.startsWith("0x") || trimmed.startsWith("0X"))
                ? trimmed
                : "0x" + trimmed;

        try {
            Web3j web3j = Web3j.build(new HttpService(providerUrl));
            EthGetTransactionReceipt response = web3j.ethGetTransactionReceipt(hash).send();
            if (response.hasError()) {
                throw new ValidationException(
                        ErrorCode.WEB3_ERROR,
                        "RPC error fetching receipt: " + response.getError().getMessage());
            }
            TransactionReceipt receipt = response.getTransactionReceipt()
                    .orElseThrow(() -> new ValidationException(
                            ErrorCode.INVALID_TRANSACTION,
                            "Transaction not found or not yet mined: " + hash));

            if (!"0x1".equalsIgnoreCase(receipt.getStatus()) && !"1".equals(receipt.getStatus())) {
                // web3j may return "0x1" or numeric
                String status = receipt.getStatus();
                if (status != null && !Numeric.toBigInt(status).equals(BigInteger.ONE)) {
                    throw new ValidationException(
                            ErrorCode.TRANSACTION_FAILED,
                            "Transaction failed on-chain");
                }
            }
            return receipt;
        } catch (ValidationException e) {
            throw e;
        } catch (IOException e) {
            log.error("Web3 RPC failure", e);
            throw new ValidationException(
                    ErrorCode.WEB3_ERROR,
                    "Failed to contact blockchain RPC: " + e.getMessage());
        }
    }

    private void requireContractAddress(TransactionReceipt receipt) {
        requireConfiguredContract();
        if (receipt.getTo() != null && !addressesEqual(receipt.getTo(), escrowContractAddress)) {
            // create/release both go to the escrow contract
            throw new ValidationException(
                    ErrorCode.INVALID_TRANSACTION,
                    "Transaction was not sent to the configured escrow contract");
        }
    }

    static boolean addressesEqual(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return normalizeAddress(a).equals(normalizeAddress(b));
    }

    static String normalizeAddress(String address) {
        if (address == null) {
            return null;
        }
        String a = address.trim();
        if (!a.startsWith("0x") && !a.startsWith("0X")) {
            a = "0x" + a;
        }
        return a.toLowerCase(Locale.ROOT);
    }
}
