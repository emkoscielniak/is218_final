# Security Documentation

## Overview
This document outlines the security measures implemented in the PetWell application and best practices for secure deployment.

## Data Security

### 1. User Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Password Hashing**: bcrypt hashing with salts (never store plain-text passwords)
- **User Ownership**: All data (pets, activities, medications, reminders) is scoped to the logged-in user
- **Authorization Checks**: Every endpoint verifies user ownership before allowing access/modification

### 2. Database Security
- **PostgreSQL**: Production-grade database with proper user authentication
- **Connection Security**: Database credentials stored in environment variables (never in code)
- **Docker Isolation**: Database runs in isolated Docker container with controlled access
- **User Data Isolation**: Each user can only access their own data via database queries with user_id filters

### 3. API Security
- **CORS Configuration**: Restricts which domains can access the API
- **Input Validation**: Pydantic schemas validate all input data
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection attacks
- **Error Handling**: Sensitive error details hidden from API responses

## Configuration Security

### Environment Variables (.env)
**NEVER commit .env files to Git!** They contain sensitive credentials:

```bash
# Example .env file (NOT IN GIT)
DATABASE_URL=postgresql://postgres:your_password@localhost/fastapi_db
SECRET_KEY=your-secret-key-here
```

### .gitignore Protection
The `.gitignore` file prevents sensitive files from being committed:
- ✅ `.env` files (credentials)
- ✅ `*.db` files (local databases)
- ✅ `__pycache__/` (Python cache)
- ✅ `*.log` files (may contain sensitive data)

## Security Best Practices

### For Development:
1. **Use unique passwords** for database and admin accounts
2. **Rotate SECRET_KEY** regularly
3. **Keep dependencies updated** (`pip list --outdated`)
4. **Run security audits**: `pip install safety && safety check`
5. **Never expose database ports** publicly (use Docker network isolation)

### For Production Deployment:
1. **HTTPS Only**: Use SSL/TLS certificates (Let's Encrypt)
2. **Environment Variables**: Use platform-specific secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Database Backups**: Automated encrypted backups
4. **Rate Limiting**: Implement API rate limiting to prevent abuse
5. **Monitoring**: Log and monitor for suspicious activity
6. **Regular Updates**: Keep all dependencies and Docker images up to date

## User Data Per Profile

### How Data Isolation Works:
Each piece of data in the database has a `user_id` field that links it to the user who created it:

```python
# Example: User can only see their own pets
pets = db.query(Pet).filter(Pet.user_id == current_user.id).all()
```

### What's Protected:
- ✅ **Pets**: Each pet belongs to one user
- ✅ **Activities**: Verified through pet ownership
- ✅ **Medications**: Verified through pet ownership
- ✅ **Reminders**: Linked directly to user (and optionally to pet)
- ✅ **User Profile**: Each user can only access/edit their own profile

### Database Relationships:
```
User (id)
  ├─> Pets (user_id)
  │    ├─> Activities (pet_id)
  │    ├─> Medications (pet_id)
  │    └─> Reminders (pet_id, user_id)
  └─> Reminders (user_id)
```

## Logging System

### Current Implementation:
- **Application Logs**: Python `logging` module with INFO level
- **Database Queries**: SQLAlchemy logs all queries (dev only)
- **Error Tracking**: Exceptions logged with full stack traces

### Log Security:
- ❌ **Never log passwords** or tokens
- ❌ **Never log full JWT tokens**
- ✅ **Log user actions** (create, update, delete)
- ✅ **Log authentication attempts**
- ✅ **Log errors** for debugging

### Example Log Entry:
```
2025-12-11 19:34:46,992 INFO Activity created: 123 for pet Fluffy
2025-12-11 19:34:15,639 INFO User logged in: testuser
```

## Common Questions

### Q: Does .gitignore make my database secure?
**A:** No. `.gitignore` prevents accidentally committing sensitive files to Git, but:
- Database security requires proper authentication and user permissions
- Production databases need firewalls and network security
- Backups must be encrypted
- `.gitignore` is just one layer of defense

### Q: Is my data safe if someone gets my code?
**A:** If your code is compromised but NOT your `.env` file:
- ✅ They can't access your database (no credentials)
- ✅ They can't generate valid JWT tokens (no SECRET_KEY)
- ❌ They can see your application logic

### Q: How do I reset if credentials are compromised?
1. **Immediately** change DATABASE_URL password
2. **Rotate** SECRET_KEY (invalidates all existing tokens)
3. **Force** all users to log in again
4. **Review** logs for suspicious activity
5. **Update** all deployment configurations

## Security Checklist

Before deploying to production:
- [ ] All sensitive data in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] Database credentials are strong and unique
- [ ] SECRET_KEY is random and complex (64+ characters)
- [ ] HTTPS/SSL configured
- [ ] CORS properly configured for your domain
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Dependencies are up to date
- [ ] Security audit completed

## Contact
For security concerns or to report vulnerabilities, please contact the development team immediately.

**Last Updated**: December 11, 2025
