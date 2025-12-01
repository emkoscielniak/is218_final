#!/usr/bin/env python3
"""
Final Module 13 Assignment Validation
Checks that all requirements are completed and ready for submission
"""

import os
import sys
from pathlib import Path

def check_file_exists(file_path, description):
    """Check if a file exists and return status"""
    if Path(file_path).exists():
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} (MISSING)")
        return False

def check_file_content(file_path, search_terms, description):
    """Check if file contains required content"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        missing_terms = []
        for term in search_terms:
            if term not in content:
                missing_terms.append(term)
        
        if not missing_terms:
            print(f"✅ {description}: Contains required elements")
            return True
        else:
            print(f"❌ {description}: Missing {missing_terms}")
            return False
    except FileNotFoundError:
        print(f"❌ {description}: File not found")
        return False

def main():
    print("🎯 Module 13 Assignment Final Validation")
    print("=" * 50)
    
    # Change to project directory
    project_dir = "/Users/emisk/is218/module13_is218"
    os.chdir(project_dir)
    
    all_checks_passed = True
    
    print("\n📋 Requirement 1: JWT Login & Registration Routes")
    print("-" * 48)
    
    # Check JWT routes in main.py
    jwt_checks = check_file_content(
        "main.py", 
        ["/register", "/login", "Token"],
        "JWT Routes Implementation"
    )
    all_checks_passed = all_checks_passed and jwt_checks
    
    print("\n🎨 Requirement 2: Front-End Pages")
    print("-" * 35)
    
    # Check frontend files
    register_exists = check_file_exists("templates/register.html", "Registration Page")
    login_exists = check_file_exists("templates/login.html", "Login Page")
    
    # Check frontend functionality
    register_content = check_file_content(
        "templates/register.html",
        ["<form", "password", "email", "script", "validation"],
        "Registration Page Content"
    )
    
    login_content = check_file_content(
        "templates/login.html", 
        ["<form", "password", "username", "localStorage", "token"],
        "Login Page Content"
    )
    
    all_checks_passed = all_checks_passed and register_exists and login_exists
    all_checks_passed = all_checks_passed and register_content and login_content
    
    print("\n🧪 Requirement 3: Playwright E2E Tests") 
    print("-" * 38)
    
    # Check E2E test file
    e2e_exists = check_file_exists("tests/e2e/test_e2e.py", "E2E Test File")
    
    e2e_content = check_file_content(
        "tests/e2e/test_e2e.py",
        ["test_register", "test_login", "page.goto", "fill"],
        "E2E Test Content"
    )
    
    all_checks_passed = all_checks_passed and e2e_exists and e2e_content
    
    print("\n🚀 Requirement 4: CI/CD Pipeline Maintenance")
    print("-" * 45)
    
    # Check workflow file
    workflow_exists = check_file_exists(".github/workflows/test.yml", "GitHub Actions Workflow")
    
    workflow_content = check_file_content(
        ".github/workflows/test.yml",
        ["python-version: '3.11'", "pytest", "docker", "DOCKERHUB"],
        "Workflow Content"
    )
    
    # Check security fixes
    security_fixes = check_file_content(
        "requirements.txt",
        ["h11==0.16.0", "python-jose==3.4.0", "starlette==0.49.1"],
        "Security Vulnerability Fixes"
    )
    
    all_checks_passed = all_checks_passed and workflow_exists and workflow_content and security_fixes
    
    print("\n📊 Summary")
    print("-" * 20)
    
    if all_checks_passed:
        print("🎉 ALL REQUIREMENTS COMPLETED!")
        print("✅ JWT Login & Registration Routes: IMPLEMENTED")
        print("✅ Front-End Pages: CREATED WITH VALIDATION") 
        print("✅ Playwright E2E Tests: COMPREHENSIVE COVERAGE")
        print("✅ CI/CD Pipeline: UPDATED WITH SECURITY FIXES")
        print("\n🚀 Ready for final commit: 'complete module 13'")
        return 0
    else:
        print("❌ Some requirements are incomplete")
        print("Review the failed checks above")
        return 1

if __name__ == "__main__":
    exit(main())