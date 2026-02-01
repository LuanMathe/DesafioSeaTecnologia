package com.desafio.seatecnologia.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.AuthenticationEntryPoint;

import javax.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
            .withUser("padrao").password("{noop}123qwe123").roles("PADRAO")
            .and()
            .withUser("admin").password("{noop}123qwe!@#").roles("ADMIN");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable();

        // EntryPoint sem WWW-Authenticate (não abre popup)
        AuthenticationEntryPoint noPopupEntryPoint = (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            // IMPORTANTE: não mandar WWW-Authenticate
            response.setHeader("WWW-Authenticate", "");
            response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"Login inválido.\"}");
        };

        http
          .authorizeRequests()
            .antMatchers(
                "/",
                "/index.html",
                "/dashboard.html",
                "/style.css",
                "/app.js",
                "/clientes.js",
                "/**/*.css",
                "/**/*.js",
                "/**/*.html",
                "/favicon.ico"
            ).permitAll()
            .antMatchers("/h2-console/**").permitAll()

            .antMatchers(HttpMethod.GET, "/clientes/**").hasAnyRole("PADRAO", "ADMIN")
            .antMatchers(HttpMethod.POST, "/clientes/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.PUT, "/clientes/**").hasRole("ADMIN")
            .antMatchers(HttpMethod.DELETE, "/clientes/**").hasRole("ADMIN")
            .anyRequest().authenticated()
          .and()
            // mantém o Basic Auth (senão não loga)
            .httpBasic()
              .authenticationEntryPoint(noPopupEntryPoint);

        // necessário pro H2-console abrir no browser
        http.headers().frameOptions().disable();
    }
}

