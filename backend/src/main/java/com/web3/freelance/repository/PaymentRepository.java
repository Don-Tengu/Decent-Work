package com.web3.freelance.repository;

import com.web3.freelance.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByJobId(Long jobId);

    Optional<Payment> findByTransactionHash(String transactionHash);
}
