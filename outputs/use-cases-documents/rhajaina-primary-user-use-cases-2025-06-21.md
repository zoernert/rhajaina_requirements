<!-- filepath: outputs/use-cases-documents/rhajaina-primary-user-use-cases-2025-06-21.md -->
# Rhajaina Primary User Use Cases

**Document Type:** Use-cases  
**Generated:** 2025-06-21T19:50:40.901Z  
**Project:** Rhajaina AI Chat Application

---

# Rhajaina Primary User Use Cases

## 1. AUTHENTICATION & ONBOARDING

### UC-001: User Registration

*   **Title:** User Registration
*   **Primary Actor:** User
*   **Goal/Objective:** To create a new user account in the Rhajaina AI Chat Application.
*   **Preconditions:**
    *   The user has not yet registered an account.
    *   The user has access to a valid email address.
*   **Main Flow:**
    1.  User navigates to the registration page.
    2.  User enters required information (e.g., name, email, password).
    3.  User agrees to terms and conditions.
    4.  System validates the entered information.
    5.  System sends a verification email to the user.
    6.  User clicks the verification link in the email.
    7.  System verifies the user's email address.
    8.  User is redirected to the application and logged in.
*   **Alternative Flows:**
    *   **Email Already in Use:** The system displays an error message and prompts the user to log in or reset their password.
    *   **Invalid Email Format:** The system displays an error message and prompts the user to correct the email address.
    *   **Password Requirements Not Met:** The system displays an error message and prompts the user to create a stronger password.
    *   **Terms and Conditions Not Accepted:** The system prevents the user from proceeding until the terms are accepted.
    *   **Verification Email Not Received:** The user can request a new verification email.
    *   **Verification Link Expired:** The system displays an error message and prompts the user to request a new verification email.
    *   **System Error During Registration:** The system displays a generic error message, and the user is advised to try again later.
*   **Postconditions:**
    *   A new user account is created in the system.
    *   The user is logged in to the application.
*   **Business Rules:**
    *   Email addresses must be unique.
    *   Passwords must meet minimum complexity requirements.
    *   Users must agree to the terms and conditions to register.

### UC-002: User Login

*   **Title:** User Login
*   **Primary Actor:** User
*   **Goal/Objective:** To access the Rhajaina AI Chat Application with valid credentials.
*   **Preconditions:**
    *   The user has a registered account.
    *   The user knows their email address and password.
*   **Main Flow:**
    1.  User navigates to the login page.
    2.  User enters their email address and password.
    3.  User clicks the "Login" button.
    4.  System authenticates the user's credentials.
    5.  User is redirected to the main application interface.
*   **Alternative Flows:**
    *   **Invalid Credentials:** The system displays an error message and prompts the user to re-enter their credentials or reset their password.
    *   **Account Locked:** If the user enters incorrect credentials multiple times, the account may be locked. The user will need to follow the password reset process.
    *   **System Error During Login:** The system displays a generic error message, and the user is advised to try again later.
*   **Postconditions:**
    *   The user is logged in to the application.
    *   The user can access their conversations and settings.
*   **Business Rules:**
    *   The system must securely authenticate user credentials.
    *   The system should implement account lockout policies to prevent brute-force attacks.

### UC-003: User Logout
*   **Title:** User Logout
*   **Primary Actor:** User
*   **Goal/Objective:** To securely log out of the Rhajaina AI Chat Application.
*   **Preconditions:**
    *   The user is currently logged in to the application.
*   **Main Flow:**
    1.  User clicks the "Logout" button.
    2.  System terminates the user's session.
    3.  User is redirected to the login page.
*   **Postconditions:**
    *   The user is logged out of the application.
    *   The user's session is terminated.
*   **Business Rules:**
    *   The system must securely terminate the user's session.

### UC-004: Password Reset
*   **Title:** Password Reset
*   **Primary Actor:** User
*   **Goal/Objective:** To reset a forgotten password.
*   **Preconditions:**
    *   The user has a registered account.
    *   The user has forgotten their password.
*   **Main Flow:**
    1.  User clicks the "Forgot Password" link on the login page.
    2.  User enters their email address.
    3.  System sends a password reset email to the user.
    4.  User clicks the password reset link in the email.
    5.  User is redirected to a password reset page.
    6.  User enters a new password and confirms it.
    7.  System validates the new password.
    8.  System updates the user's password.
    9.  User is redirected to the login page.
*   **Alternative Flows:**
    *   **Invalid Email Address:** The system displays an error message.
    *   **Password Reset Link Expired:** The system displays an error message, and the user is prompted to request a new password reset email.
    *   **Password Requirements Not Met:** The system displays an error message and prompts the user to create a stronger password.
*   **Postconditions:**
    *   The user's password is reset.
    *   The user can log in with their new password.
*   **Business Rules:**
    *   The system must securely handle password reset requests.
    *   Password reset links should expire after a certain period.

### UC-005: Profile Creation and Management
*   **Title:** Profile Creation and Management
*   **Primary Actor:** User
*   **Goal/Objective:** To create and manage user profile information.
*   **Preconditions:**
    *   The user has a registered account and is logged in.
*   **Main Flow:**
    1.  User navigates to the profile settings page.
    2.  User enters or updates their profile information (e.g., name, profile picture).
    3.  User saves the changes.
    4.  System validates the entered information.
    5.  System updates the user's profile.
*   **Alternative Flows:**
    *   **Invalid Data Format:** The system displays an error message if the user enters data in an invalid format.
    *   **System Error During Profile Update:** The system displays a generic error message, and the user is advised to try again later.
*   **Postconditions:**
    *   The user's profile information is updated.
*   **Business Rules:**
    *   The system must validate user input to ensure data integrity.

## 2. CORE CHAT FUNCTIONALITY

### UC-006: Start New Conversation
*   **Title:** Start New Conversation
*   **Primary Actor:** User
*   **Goal/Objective:** To initiate a new conversation with an AI model.
*   **Preconditions:**
    *   The user is logged in.
*   **Main Flow:**
    1.  User clicks the "New Conversation" button.
    2.  User selects an AI model to chat with.
    3.  A new chat session is created.
    4.  The user is presented with an empty chat window.
*   **Postconditions:**
    *   A new chat session is created and ready for messaging.

### UC-007: Send Message
*   **Title:** Send Message
*   **Primary Actor:** User
*   **Goal/Objective:** To send a message to the AI model in the current conversation.
*   **Preconditions:**
    *   The user is in an active chat session.
*   **Main Flow:**
    1.  User enters a message in the text input field.
    2.  User clicks the "Send" button.
    3.  The message is sent to the AI model.
*   **Postconditions:**
    *   The message is displayed in the chat window.

### UC-008: Receive Message
*   **Title:** Receive Message
*   **Primary Actor:** System (AI Model)
*   **Goal/Objective:** To receive and display a message from the AI model.
*   **Preconditions:**
    *   The user is in an active chat session.
    *   The AI model has generated a response.
*   **Main Flow:**
    1.  The AI model sends a response to the user.
    2.  The system receives the response.
    3.  The response is displayed in the chat window.
*   **Postconditions:**
    *   The AI model's response is displayed in the chat window.

## 3. AI MODEL INTERACTIONS

### UC-009: Model Selection
*   **Title:** Model Selection
*   **Primary Actor:** User
*   **Goal/Objective:** To select a specific AI model for a conversation.
*   **Preconditions:**
    *   The user is logged in.
*   **Main Flow:**
    1.  User navigates to the model selection screen.
    2.  User browses the available AI models.
    3.  User selects an AI model.
*   **Postconditions:**
    *   The selected AI model is associated with the new or current conversation.


---

*Generated by Rhajaina Requirements Management System*