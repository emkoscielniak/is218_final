# PetWell - Comprehensive Pet Health Management Platform

**🌐 Live Demo:** [petwell.emkoscielniak.com](https://petwell.emkoscielniak.com)

A comprehensive FastAPI application for managing pet health, tracking medications, scheduling activities, and setting reminders. Features JWT-based user authentication, email verification, AI-powered veterinary Q&A chatbot, and an intuitive web interface. Built with SQLAlchemy ORM, Pydantic validation, OpenAI integration, and deployed via Docker Hub with complete CI/CD pipeline.

## 🎯 Features

- **JWT Authentication**: Secure user registration and login with JWT tokens
- **Email Verification**: SMTP-based email verification for new user accounts
- **Pet Management**: Add, edit, and manage multiple pets with detailed profiles (breed, age, weight, health score)
- **Medication Tracking**: Create and manage medication schedules for your pets
- **Activity Tracking**: Log and monitor pet activities (walks, playtime, vet visits)
- **Reminder System**: Set up reminders for medications, vet appointments, and activities
- **AI Vet Chatbot**: Ask veterinary questions powered by OpenAI GPT-4o-mini
- **Interactive Dashboard**: Real-time health score visualization and pet overview
- **User-Specific Data**: All pets, medications, and activities are private to the authenticated user
- **Password Security**: Bcrypt hashing with complex password requirements
- **Database Integration**: SQLAlchemy ORM with PostgreSQL support
- **CI/CD Pipeline**: Automated testing, security scanning, and Docker Hub deployment
- **OpenAPI Documentation**: Interactive API documentation with Swagger UI

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Pull and run the latest image from Docker Hub
docker run -p 8000:8000 emkoscielniak/pet_well:latest
```

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd is218_final

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials, OpenAI API key, and SMTP settings

# Run the application
python main.py
```

The application will be available at `http://localhost:8000`

## 🌐 Frontend Pages

### Landing Page (`/`)
- **URL**: `http://localhost:8000/`
- **Features**:
  - Introduction to PetWell platform
  - Overview of pet health management features
  - Call-to-action for registration/login

### Registration Page (`/register`)
- **URL**: `http://localhost:8000/register`
- **Features**:
  - Fields: First Name, Last Name, Email, Password, Confirm Password
  - Email verification required
  - Password requirements: minimum 6 characters with uppercase, lowercase, and digit
  - Real-time validation feedback

### Email Verification (`/verify-email`)
- **URL**: `http://localhost:8000/verify-email?token=<token>`
- **Features**:
  - Automatic verification via email link
  - Success/error feedback
  - Redirect to login after verification

### Login Page (`/login`)
- **URL**: `http://localhost:8000/login`
- **Features**:
  - Fields: Email, Password
  - JWT token storage on successful login
  - Automatic redirect to dashboard

### Dashboard (`/dashboard`)
- **URL**: `http://localhost:8000/dashboard`
- **Features**:
  - Overview of all pets with health scores
  - Quick access to medications, activities, and reminders
  - Pet statistics and health trends
  - AI Vet Chatbot for instant veterinary advice

### Pet Management (`/pets`)
- **URL**: `http://localhost:8000/pets`
- **Features**:
  - Add new pets with breed, age, weight, and health information
  - Edit existing pet profiles
  - Delete pets with confirmation
  - View detailed pet health cards with breed mix display

### Profile Settings (`/profile`)
- **URL**: `http://localhost:8000/profile`
- **Features**:
  - Update personal information (first name, last name, email)
  - Change password
  - View account details

## 📋 API Endpoints

### Authentication Endpoints
- `POST /users/register` - Register a new user with email verification
- `POST /users/login` - Login with email/password, returns JWT token
- `GET /users/me` - Get current authenticated user information
- `GET /users/verify-email` - Verify email address with token

### Pet Management Endpoints (🔐 Authentication Required)
- `GET /pets` - Get all user's pets
- `POST /pets` - Add a new pet
- `GET /pets/{id}` - Get specific pet by ID
- `PUT /pets/{id}` - Update pet information
- `DELETE /pets/{id}` - Delete a pet

### Medication Endpoints (🔐 Authentication Required)
- `GET /medications` - Get all medications for user's pets
- `POST /medications` - Add a new medication
- `GET /medications/{id}` - Get specific medication by ID
- `PUT /medications/{id}` - Update medication information
- `DELETE /medications/{id}` - Delete a medication

### Activity Endpoints (🔐 Authentication Required)
- `GET /activities` - Get all activities for user's pets
- `POST /activities` - Log a new activity
- `GET /activities/{id}` - Get specific activity by ID
- `PUT /activities/{id}` - Update activity information
- `DELETE /activities/{id}` - Delete an activity

### Reminder Endpoints (🔐 Authentication Required)
- `GET /reminders` - Get all reminders for user
- `POST /reminders` - Create a new reminder
- `GET /reminders/{id}` - Get specific reminder by ID
- `PUT /reminders/{id}` - Update reminder information
- `DELETE /reminders/{id}` - Delete a reminder

### AI Chatbot Endpoint (🔐 Authentication Required)
- `POST /chat` - Ask veterinary questions to AI chatbot

**Note**: All endpoints require JWT authentication via `Authorization: Bearer <token>` header. Users can only access their own data.

## 🧪 Running Tests

### Prerequisites
- Python 3.10+
- PostgreSQL database
- OpenAI API key (for chatbot tests)

### Setup Test Environment

```bash
# Install dependencies
pip install -r requirements.txt

# Set up test database
export DATABASE_URL="postgresql://user:password@localhost:5432/petwell_test"
export OPENAI_API_KEY="your-openai-key"
```

### Running Tests

```bash
# Run all tests with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test modules
pytest tests/unit/ -v
pytest tests/integration/ -v
pytest tests/e2e/ -v
```

### Test Coverage

The test suite covers:
- User authentication and email verification
- Pet CRUD operations
- Medication tracking
- Activity logging
- Reminder management
- AI chatbot functionality
- Database integrity
- Input validation and error handling

## 🚀 Docker Hub Repository

**Repository**: [emkoscielniak/pet_well](https://hub.docker.com/r/emkoscielniak/pet_well)

### Available Tags:
- `latest` - Latest stable version
- `<commit-sha>` - Specific commit versions

### Pulling the Image:

```bash
# Pull latest version
docker pull emkoscielniak/pet_well:latest

# Pull specific version
docker pull emkoscielniak/pet_well:<commit-sha>
```

### Running with Docker Compose:

```yaml
services:
  web:
    image: emkoscielniak/pet_well:latest
    restart: unless-stopped
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/petwell
      - SECRET_KEY=your-secret-key
      - OPENAI_API_KEY=your-openai-key
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=your-email@gmail.com
      - SMTP_PASSWORD=your-app-password
      - SMTP_FROM_EMAIL=your-email@gmail.com
    depends_on:
      - db
  
  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=petwell
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline automatically:

1. **Testing Phase**:
   - Runs unit tests with coverage reporting
   - Runs integration tests against PostgreSQL
   - Validates API endpoints and authentication

2. **Security Phase**:
   - Builds Docker image
   - Runs Trivy vulnerability scanner
   - Fails on CRITICAL/HIGH vulnerabilities

3. **Deployment Phase** (on main branch):
   - Builds multi-platform Docker image (linux/amd64, linux/arm64)
   - Pushes to Docker Hub with `latest` and `<commit-sha>` tags
   - Uses Docker layer caching for optimization
   - Watchtower automatically pulls and deploys latest image

### Workflow Triggers:
- Push to `main` branch
- Pull requests to `main` branch

## 🔍 Manual Testing via OpenAPI

Access the interactive API documentation at:
- **Swagger UI**: http://localhost:8000/docs  
- **ReDoc**: http://localhost:8000/redoc

### Testing Workflow
1. **Register a User**: Use `/users/register` endpoint
2. **Verify Email**: Check email and click verification link
3. **Login**: Use `/users/login` to get an authentication token  
4. **Authorize**: Click "Authorize" button in Swagger UI and paste your token
5. **Test Endpoints**: Try creating pets, medications, activities, and reminders
6. **Test AI Chat**: Use `/chat` endpoint to ask veterinary questions

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt for secure password storage
- **JWT Tokens**: Secure authentication with configurable expiration
- **Email Verification**: SMTP-based email verification for new accounts
- **Input Validation**: Pydantic schemas prevent injection attacks
- **Security Scanning**: Trivy vulnerability scanning in CI/CD
- **Database**: PostgreSQL with proper ORM usage preventing SQL injection
- **API Key Security**: Environment-based OpenAI API key management

## 🏗️ Architecture

- **Framework**: FastAPI with async support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with OAuth2 password bearer
- **Email Service**: SMTP with Gmail integration
- **AI Integration**: OpenAI GPT-4o-mini for veterinary Q&A
- **Validation**: Pydantic v2 with custom validators
- **Testing**: pytest with fixtures and dependency injection
- **Deployment**: Docker with multi-stage builds and Watchtower auto-updates

## 🌟 Key Technologies

- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Database**: PostgreSQL
- **AI**: OpenAI API (GPT-4o-mini)
- **Email**: SMTP (Gmail)
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Docker, Docker Compose, Caddy (reverse proxy)
- **CI/CD**: GitHub Actions, Trivy, Watchtower

## 📦 Project Setup

### 🧩 1. Install Homebrew (Mac Only)

> Skip this step if you're on Windows.

Homebrew is a package manager for macOS.  
You’ll use it to easily install Git, Python, Docker, etc.

**Install Homebrew:**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Verify Homebrew:**

```bash
brew --version
```

If you see a version number, you're good to go.

---

# 🧩 2. Install and Configure Git

## Install Git

- **MacOS (using Homebrew)**

```bash
brew install git
```

- **Windows**

Download and install [Git for Windows](https://git-scm.com/download/win).  
Accept the default options during installation.

**Verify Git:**

```bash
git --version
```

---

## Configure Git Globals

Set your name and email so Git tracks your commits properly:

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

Confirm the settings:

```bash
git config --list
```

---

## Generate SSH Keys and Connect to GitHub

> Only do this once per machine.

1. Generate a new SSH key:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

(Press Enter at all prompts.)

2. Start the SSH agent:

```bash
eval "$(ssh-agent -s)"
```

3. Add the SSH private key to the agent:

```bash
ssh-add ~/.ssh/id_ed25519
```

4. Copy your SSH public key:

- **Mac/Linux:**

```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

- **Windows (Git Bash):**

```bash
cat ~/.ssh/id_ed25519.pub | clip
```

5. Add the key to your GitHub account:
   - Go to [GitHub SSH Settings](https://github.com/settings/keys)
   - Click **New SSH Key**, paste the key, save.

6. Test the connection:

```bash
ssh -T git@github.com
```

You should see a success message.

---

# 🧩 3. Clone the Repository

Now you can safely clone the course project:

```bash
git clone <repository-url>
cd <repository-directory>
```

---

# 🛠️ 4. Install Python 3.10+

## Install Python

- **MacOS (Homebrew)**

```bash
brew install python
```

- **Windows**

Download and install [Python for Windows](https://www.python.org/downloads/).  
✅ Make sure you **check the box** `Add Python to PATH` during setup.

**Verify Python:**

```bash
python3 --version
```
or
```bash
python --version
```

---

## Create and Activate a Virtual Environment

(Optional but recommended)

```bash
python3 -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate.bat  # Windows
```

### Install Required Packages

```bash
pip install -r requirements.txt
```

---

# 🐳 5. (Optional) Docker Setup

> Skip if Docker isn't used in this module.

## Install Docker

- [Install Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- [Install Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

## Build Docker Image

```bash
docker build -t <image-name> .
```

## Run Docker Container

```bash
docker run -it --rm <image-name>
```

---

# 🚀 6. Running the Project

- **Without Docker**:

```bash
python main.py
```

(or update this if the main script is different.)

- **With Docker**:

```bash
docker run -it --rm <image-name>
```

---

# 📝 7. Submission Instructions

After finishing your work:

```bash
git add .
git commit -m "Complete Module X"
git push origin main
```

Then submit the GitHub repository link as instructed.

---

# 🔥 Useful Commands Cheat Sheet

| Action                         | Command                                          |
| ------------------------------- | ------------------------------------------------ |
| Install Homebrew (Mac)          | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| Install Git                     | `brew install git` or Git for Windows installer |
| Configure Git Global Username  | `git config --global user.name "Your Name"`      |
| Configure Git Global Email     | `git config --global user.email "you@example.com"` |
| Clone Repository                | `git clone <repo-url>`                          |
| Create Virtual Environment     | `python3 -m venv venv`                           |
| Activate Virtual Environment   | `source venv/bin/activate` / `venv\Scripts\activate.bat` |
| Install Python Packages        | `pip install -r requirements.txt`               |
| Build Docker Image              | `docker build -t <image-name> .`                |
| Run Docker Container            | `docker run -it --rm <image-name>`               |
| Push Code to GitHub             | `git add . && git commit -m "message" && git push` |

---

# 📋 Notes

- Install **Homebrew** first on Mac.
- Install and configure **Git** and **SSH** before cloning.
- Use **Python 3.10+** and **virtual environments** for Python projects.
- **Docker** is optional depending on the project.

---

# 📎 Quick Links

- [Homebrew](https://brew.sh/)
- [Git Downloads](https://git-scm.com/downloads)
- [Python Downloads](https://www.python.org/downloads/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [GitHub SSH Setup Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
