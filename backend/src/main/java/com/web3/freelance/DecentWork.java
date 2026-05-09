package com.web3.freelance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DecentWork {

    public static void main(String[] args) {
        SpringApplication.run(DecentWork.class, args);
    }

}
