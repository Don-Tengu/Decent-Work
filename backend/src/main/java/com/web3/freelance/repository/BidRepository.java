package com.web3.freelance.repository;

import com.web3.freelance.model.Bid;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    List<Bid> findByFreelancer(User freelancer);

    List<Bid> findByJob(Job job);

    List<Bid> findByJobAndStatus(Job job, Bid.BidStatus status);
}
