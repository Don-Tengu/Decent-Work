package com.web3.freelance.repository;

import com.web3.freelance.model.BidAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BidAttachmentRepository extends JpaRepository<BidAttachment, Long> {

    Optional<BidAttachment> findByIdAndBidId(Long id, Long bidId);
}
