# Ask the Vet - AI Chatbot Setup Guide

## Overview

The "Ask the Vet" feature is an AI-powered veterinary assistant that helps pet owners understand their pets' health, behavior, and care needs. It uses OpenAI's GPT models to provide personalized guidance based on your pet's profile information.

## Features

- **Personalized Advice**: Uses your pet's species, breed, age, weight, and medical history to provide tailored guidance
- **Health Concerns**: Identifies potential health issues and suggests when veterinary attention is needed
- **Safety-First**: Always prioritizes pet safety with clear red flags for emergency situations
- **Conversational Memory**: Maintains conversation context for natural, flowing interactions
- **Evidence-Based**: Provides guidance based on veterinary best practices and research

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
nano .env  # or use your preferred editor
```

Add your OpenAI API key:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fastapi_db

# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here

# AI Model (recommended: gpt-4o-mini for cost-effective responses)
AI_MODEL=gpt-4o-mini
```

### 3. Choose Your AI Model

**Cost-Effective Option (Recommended):**
- `gpt-4o-mini` - Fast, affordable, great for most conversations (~$0.15 per 1M input tokens)

**Premium Options:**
- `gpt-4o` - Most capable, best quality (~$2.50 per 1M input tokens)
- `gpt-4-turbo` - Balanced performance and cost
- `gpt-3.5-turbo` - Fastest, cheapest, but less capable

### 4. Restart the Application

After configuring the API key, restart your FastAPI server:

```bash
# If running locally
python main.py

# If using Docker, rebuild and restart
docker-compose down
docker-compose up --build
```

## How It Works

### User Experience

1. **Access the Chatbot**: Click the large medical icon button in the bottom-right corner of any main page
2. **Ask Questions**: Type questions about your pet's health, behavior, symptoms, or general care
3. **Get Personalized Responses**: The AI uses your pet's information (breed, age, weight, medical notes) to provide tailored advice
4. **Conversation Context**: The chatbot remembers your conversation for natural follow-up questions

### What the AI Can Help With

✅ **General Health Questions**
- Symptoms interpretation (e.g., "My dog is vomiting yellow foam")
- Behavior concerns (e.g., "Why is my cat hiding more than usual?")
- Nutrition advice (e.g., "How much should I feed my 50lb dog?")
- Exercise recommendations
- Grooming and hygiene tips

✅ **Preventive Care**
- Vaccination schedules
- Parasite prevention
- Dental care guidance
- Weight management

✅ **Emergency Recognition**
- Identifying red flags that require immediate vet care
- Understanding when to wait vs. when to rush to the vet
- First aid guidance for minor issues

### What the AI CANNOT Do

❌ **Does NOT Replace a Veterinarian**
- Cannot diagnose diseases
- Cannot prescribe medications or dosages
- Cannot perform physical examinations
- Cannot provide emergency medical treatment

❌ **Limitations**
- No access to medical records beyond what you've entered
- Cannot see photos or videos of your pet
- Cannot perform lab tests or diagnostics
- Cannot provide legal or insurance advice

## Safety Features

### Automatic Red Flag Detection

The AI is trained to recognize emergency situations and will strongly recommend immediate veterinary care for:

🚨 **Life-Threatening Symptoms:**
- Difficulty breathing or choking
- Severe bleeding or major injury
- Seizures or sudden collapse
- Suspected poisoning or toxic ingestion
- Severe vomiting or diarrhea (especially with blood)
- Inability to urinate or defecate
- Extreme lethargy or unresponsiveness
- Severe pain or continuous distress
- Bloated, hard abdomen (GDV risk in dogs)

### Always Includes Disclaimers

Every response includes a reminder that the AI provides general guidance only, not professional diagnosis or treatment.

## Technical Details

### Backend Implementation

**Endpoint**: `POST /chat/vet`

**Request Body**:
```json
{
  "message": "User's question",
  "conversation_history": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous response"}
  ],
  "pets": [
    {
      "name": "Buddy",
      "species": "dog",
      "breed": "Golden Retriever",
      "age": 3,
      "weight": 65.5,
      "medical_notes": "Allergic to chicken"
    }
  ]
}
```

**Response**:
```json
{
  "response": "AI-generated response with advice and guidance"
}
```

### Context Building

The system automatically includes:
1. **System Prompt**: Role definition, guidelines, and safety protocols
2. **Pet Context**: All user's pets with their details
3. **Conversation History**: Last 3 exchanges (6 messages) for context
4. **Current Question**: User's latest message

### Privacy & Security

- All conversations are authenticated (requires login)
- Pet data is only shared with OpenAI for the specific conversation
- No conversation history is stored in the database (privacy-first approach)
- OpenAI's data retention policies apply (check their terms)

## Cost Management

### Typical Usage Costs (gpt-4o-mini)

- **Per conversation**: ~$0.001 - $0.005 (less than a penny)
- **100 conversations**: ~$0.10 - $0.50
- **1000 conversations**: ~$1.00 - $5.00

### Tips to Minimize Costs

1. Use `gpt-4o-mini` instead of premium models
2. Set usage limits in your OpenAI account dashboard
3. Monitor usage via OpenAI's usage dashboard
4. Consider rate limiting in production (not implemented yet)

## Troubleshooting

### "AI service is currently unavailable"

**Cause**: OpenAI API key not configured or invalid

**Solution**:
1. Check that `.env` file exists and contains `OPENAI_API_KEY`
2. Verify the API key is correct (starts with `sk-`)
3. Check OpenAI account has available credits
4. Restart the FastAPI server after changing `.env`

### Slow Responses

**Cause**: Model processing time or network latency

**Solutions**:
- Use `gpt-4o-mini` for faster responses
- Check internet connection
- Verify OpenAI service status: https://status.openai.com/

### Poor Quality Responses

**Cause**: Using less capable model or unclear questions

**Solutions**:
- Upgrade to `gpt-4o` or `gpt-4-turbo`
- Provide more specific questions with context
- Include relevant pet details in your question

### Rate Limit Errors

**Cause**: Exceeding OpenAI's rate limits

**Solutions**:
- Upgrade your OpenAI account tier
- Wait a moment before retrying
- Implement rate limiting in the application (contact developer)

## Development Notes

### File Structure

```
/static/js/vet-chat.js          # Frontend chatbot logic
/static/styles/dashboard.css     # Chatbot styling
/html/*                          # Chat modal HTML (in each page)
/main.py                         # Backend endpoint (/chat/vet)
/app/config.py                   # Environment configuration
```

### Extending the Feature

**Add Conversation History Storage**:
- Create a `conversations` database table
- Store messages for review and continuity
- Implement conversation resume functionality

**Add More Context**:
- Include recent activities (walks, meals, medications)
- Add recent reminders and appointments
- Include activity trends and health metrics

**Implement Rate Limiting**:
- Add per-user rate limits (e.g., 50 messages/day)
- Add cooldown between messages (e.g., 2 seconds)
- Track usage in database for analytics

**Add Image Support**:
- Use GPT-4 Vision for analyzing pet photos
- Help identify skin conditions, injuries, etc.
- Requires significant changes to frontend and backend

## Support

For issues or questions:
1. Check OpenAI status: https://status.openai.com/
2. Review server logs for error messages
3. Verify `.env` configuration
4. Ensure PostgreSQL database is running
5. Check that you have OpenAI API credits

## Disclaimer

⚠️ **Important Medical Disclaimer**

The "Ask the Vet" AI chatbot is designed to provide general educational information about pet health and care. It is NOT a substitute for professional veterinary advice, diagnosis, or treatment.

**Always consult with a licensed veterinarian for:**
- Accurate diagnosis of health conditions
- Prescription medications and dosages
- Medical procedures or treatments
- Emergency situations
- Any serious or concerning symptoms

**In case of emergency:**
- Contact your veterinarian immediately
- Call the ASPCA Animal Poison Control Center: (888) 426-4435
- Visit your nearest emergency veterinary clinic

This AI tool should be used as a supplementary resource only. Pet owners are responsible for making informed decisions about their pets' health care in consultation with qualified veterinary professionals.
