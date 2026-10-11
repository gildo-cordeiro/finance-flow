package com.financeflow.shared;

import static org.assertj.core.api.Assertions.assertThat;

import com.financeflow.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class DevDataSeederProfileTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired(required = false)
    private DevDataSeeder devDataSeeder;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldNotInstantiateSeederOrSeedDataWhenDevProfileIsNotActive() {
        // Sem o profile dev ativo, o bean não deve existir no contexto
        assertThat(devDataSeeder).isNull();

        // O usuário de desenvolvimento não deve existir
        assertThat(userRepository.findByEmail(DevDataSeeder.DEV_USER_EMAIL)).isEmpty();
    }
}
