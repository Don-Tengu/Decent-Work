package com.web3.freelance.controller;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Payment;
import com.web3.freelance.model.User;
import com.web3.freelance.service.BidService;
import com.web3.freelance.service.PaymentService;
import com.web3.freelance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;
    private final PaymentService paymentService;
    private final UserService userService;

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Bid> myBids(Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return bidService.getMyBids(currentUser.getId());
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Bid> jobBids(@Argument Long jobId, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return bidService.getJobBids(jobId, currentUser.getId());
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public Bid myBidForJob(@Argument Long jobId, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return bidService.getMyBidForJob(jobId, currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Bid placeBid(@Argument Map<String, Object> input, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());

        BidService.PlaceBidRequest request = new BidService.PlaceBidRequest(
                Long.valueOf(input.get("jobId").toString()),
                new BigDecimal(input.get("amount").toString()),
                (String) input.get("proposal"),
                ((Number) input.get("deliveryTime")).intValue(),
                (String) input.get("relevantExperience")
        );

        return bidService.placeBid(currentUser.getId(), request);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Payment acceptBid(@Argument Long bidId, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return paymentService.acceptBid(bidId, currentUser.getId());
    }
}
