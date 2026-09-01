# Gemini Reflection Journal — User-Authenticated AI Journaling & Insights

A full-stack, user-authenticated reflection journal and conversational brainstorming partner built on Google Cloud Platform using **Gemini 3.6 Flash**, **Cloud Firestore**, and **Firebase Authentication**.

---

## 🌟 Architecture & Features

- **Federated Authentication**: Outsources credentials via Firebase Google Sign-In, eliminating storage of plain-text passwords.
- **Strict User-Isolated Storage**: Every journal entry and message is stored under `/users/{userId}/reflections/{reflectionId}` protected by owner-bound Firestore security rules.
- **Multi-Turn AI Reflections**: Multi-turn dialogue with Gemini 3.6 Flash with contextual memory, summaries, key takeaways, and brainstormed expansion ideas.
- **Resilient Fallback Protocol**: Server-side helper with automated fallback across `gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash` with JSON schema output.
- **Defensive API Standards**: Express middleware with payload sanitization, zero undefined properties before database ingestion, and graceful error escalation.

---

## 🔒 1. Firestore Security Rules

Deploy the following security rules in `firestore.rules` or via the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Multi-turn reflections/journal entries subcollection
      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Multi-turn chat / message exchange subcollection
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      // Legacy and direct interaction documents
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔑 2. Google Cloud Secret Manager & IAM Bindings

To securely supply your `GEMINI_API_KEY` without hardcoding:

```bash
# 1. Create and populate the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the Cloud Run runtime service account permission to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 3. Cloud Run Deployment Flow

```bash
# 1. Build and deploy service to Cloud Run
gcloud run deploy gemini-reflection-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"

# 2. Apply mandatory campaign verification labeling
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 4. Step-by-Step Functional Walkthrough & Test Guide

1. **Test Case 1: Landing Page & Sign In**
   - Visit the home URL. Verify the landing page loads with the Google Sign-In button and security architecture badge.
   - Click "Sign In with Google". Complete the popup authentication flow. Verify you are immediately redirected to the private dashboard.

2. **Test Case 2: Multi-Turn Journal Reflection**
   - In the composer, enter a title (e.g. *"Q3 Project Roadmap"*), select category *"Work & Focus"*, and type an initial journal entry.
   - Click **Generate Reflection**.
   - Confirm Gemini returns an executive summary, key insights, brainstorm ideas, and a conversational reflection.
   - Verify the entry appears immediately in the left history sidebar.

3. **Test Case 3: Conversational Multi-Turn Exploration**
   - Type a follow-up response in the same thread or click on one of the brainstorm suggestions.
   - Verify the conversation history stream renders both user and model turns chronologically.

4. **Test Case 4: Cloud Firestore User Isolation**
   - Check Firestore console. Verify documents are written strictly under `/users/<YOUR_UID>/reflections/<ID>`.
   - Sign in with a second Google account in an incognito window. Verify the second user has an empty history sidebar and cannot read or query the first user's reflections.

5. **Test Case 5: Entry Deletion & State Cleanup**
   - In the history sidebar, hover over an entry and click the Trash icon.
   - Confirm the entry and its sub-messages are removed and the UI resets smoothly.
