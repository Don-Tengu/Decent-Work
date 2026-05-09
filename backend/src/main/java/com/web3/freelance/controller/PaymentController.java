package com.web3.freelance.controller;

import com.web3.freelance.model.Payment;
import com.web3.freelance.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Payment releasePayment(@Argument Long paymentId, @Argument String transactionHash) {
        return paymentService.releasePayment(paymentId, transactionHash);
    }
}
