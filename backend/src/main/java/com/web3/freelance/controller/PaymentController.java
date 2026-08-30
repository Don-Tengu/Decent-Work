package com.web3.freelance.controller;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Payment;
import com.web3.freelance.model.User;
import com.web3.freelance.service.PaymentService;
import com.web3.freelance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public Payment paymentForJob(@Argument Long jobId, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return paymentService.getPaymentForJob(jobId, currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Payment confirmEscrowFunding(
            @Argument Long paymentId,
            @Argument String transactionHash,
            Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return paymentService.confirmEscrowFunding(paymentId, transactionHash, currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Payment confirmPaymentRelease(
            @Argument Long paymentId,
            @Argument String transactionHash,
            Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return paymentService.confirmPaymentRelease(paymentId, transactionHash, currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Payment releasePayment(
            @Argument Long paymentId,
            @Argument String transactionHash,
            Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return paymentService.releasePayment(paymentId, transactionHash, currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Payment submitWork(
            @Argument Long jobId,
            @Argument String message,
            Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return paymentService.submitWork(jobId, message, currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Payment requestChanges(
            @Argument Long jobId,
            @Argument String message,
            Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return paymentService.requestChanges(jobId, message, currentUser.getId());
    }

    @SchemaMapping(typeName = "Bid")
    public Payment payment(Bid bid) {
        if (bid.getStatus() != Bid.BidStatus.ACCEPTED || bid.getJob() == null || bid.getJob().getId() == null) {
            return null;
        }
        return paymentService.findByJobId(bid.getJob().getId());
    }
}
