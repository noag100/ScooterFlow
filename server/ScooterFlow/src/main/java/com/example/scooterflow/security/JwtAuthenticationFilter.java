package com.example.scooterflow.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority; // ודאי שייבאת את זה!
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
//פילטר שרץ על כל בקשה שנכנסת לשרת
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println("DEBUG FILTER: Processing request: " + request.getMethod() + " " + request.getRequestURI());
        System.out.println("DEBUG FILTER: Auth Header: " + request.getHeader("Authorization"));
        // 1. חילוץ הטוקן מה-Header של הבקשה
        String headerAuth = request.getHeader("Authorization");

        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);

            // 2. בדיקה אם הטוקן תקין באמצעות ה-Utils
            if (jwtUtils.validateToken(token)) {
                String username = jwtUtils.getUsernameFromToken(token);

                // שליפת התפקיד מהטוקן
                String role = jwtUtils.getRoleFromToken(token);

// מוודאים שזה באותיות גדולות ומתחיל ב-ROLE_
                String finalRole = role.toUpperCase();
                if (!finalRole.startsWith("ROLE_")) {
                    finalRole = "ROLE_" + finalRole;
                }

// יצירת ההרשאה עם הקידומת המלאה
                List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(finalRole));                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(username, null, authorities);
                // חיבור פרטי הבקשה (כמו IP ו-Session) לאובייקט האימות
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // עדכון ה-SecurityContext שהמשתמש מזוהה ומורשה
                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("DEBUG: Authorities list: " + authentication.getAuthorities());
                System.out.println("DEBUG: SecurityContext successfully set with authorities: " + authentication.getAuthorities());
                System.out.println("Token is valid for user: " + username + " with role: " + role);
            }
        }

        filterChain.doFilter(request, response);
    }
}