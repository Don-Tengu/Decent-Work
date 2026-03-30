package com.web3.freelance.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Controller
public class GraphiQLController {

    @GetMapping(value = "/graphiql", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String graphiql() throws IOException {
        Resource resource = new ClassPathResource("graphiql/index.html");
        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }
}
