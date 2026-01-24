# Mockomi - Comprehensive Test Cases

**Document Version:** 1.0  
**Total Test Cases:** 50+  
**Coverage:** All user roles and critical business flows

---

## Test Case Format

Each test case follows this structure:
- **Test Case ID:** Unique identifier
- **Title:** Descriptive test name
- **Actor:** User role executing the test
- **Preconditions:** Required system state
- **Steps:** Detailed step-by-step instructions
- **Expected Result:** What should happen
- **Business Rule Validated:** Which business rule is being tested
- **Priority:** P0 (Critical), P1 (High), P2 (Medium)

---

## 1. Authentication & Authorization Test Cases

### TC-AUTH-001: Successful User Registration
- **Test Case ID:** TC-AUTH-001
- **Title:** User Successfully Registers New Account
- **Actor:** New User (Any Role)
- **Preconditions:** 
  - Registration page accessible
  - Email service configured
- **Steps:**
  1. Navigate to `/register`
  2. Select role (job_seeker/employer/interviewer)
  3. Enter valid email (e.g., `test@example.com`)
  4. Enter password meeting requirements (min 8 chars, uppercase, lowercase, number, special char)
  5. Enter first name and last name
  6. Click "Register"
  7. Verify email sent notification
  8. Check email inbox
  9. Click verification link
  10. Verify account activated
  11. Login with credentials
- **Expected Result:**
  - User account created
  - Email verification sent
  - Account activated after email verification
  - User can login successfully
  - JWT tokens issued
- **Business Rule Validated:** Email must be unique, password strength enforced, email verification required
- **Priority:** P0

### TC-AUTH-002: Duplicate Email Registration Prevention
- **Test Case ID:** TC-AUTH-002
- **Title:** Prevent Registration with Existing Email
- **Actor:** New User
- **Preconditions:** User with email `existing@example.com` already exists
- **Steps:**
  1. Navigate to `/register`
  2. Enter email: `existing@example.com`
  3. Fill other required fields
  4. Submit registration
- **Expected Result:**
  - Error message: "Email already registered"
  - Registration fails
  - No duplicate user created
- **Business Rule Validated:** Email uniqueness constraint
- **Priority:** P0

### TC-AUTH-003: Weak Password Rejection
- **Test Case ID:** TC-AUTH-003
- **Title:** Reject Weak Passwords
- **Actor:** New User
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/register`
  2. Enter email
  3. Enter weak password: `password` (no uppercase, number, special char)
  4. Submit form
- **Expected Result:**
  - Validation error shown
  - Password requirements displayed
  - Registration blocked
- **Business Rule Validated:** Password strength policy
- **Priority:** P1

### TC-AUTH-004: Role-Based Access Control - Job Seeker
- **Test Case ID:** TC-AUTH-004
- **Title:** Job Seeker Cannot Access Admin Endpoints
- **Actor:** Job Seeker
- **Preconditions:** 
  - User logged in as job_seeker
  - Valid JWT token
- **Steps:**
  1. Attempt GET `/api/v1/admin/dashboard`
  2. Verify response
- **Expected Result:**
  - HTTP 403 Forbidden
  - Error message: "You do not have permission to perform this action"
- **Business Rule Validated:** RBAC enforced at API level
- **Priority:** P0

### TC-AUTH-005: Token Expiration Handling
- **Test Case ID:** TC-AUTH-005
- **Title:** Handle Expired Access Token
- **Actor:** Authenticated User
- **Preconditions:** 
  - User logged in
  - Access token expired (15 min)
- **Steps:**
  1. Make API request with expired token
  2. Verify response
  3. Use refresh token to get new access token
  4. Retry original request
- **Expected Result:**
  - First request: 401 Unauthorized
  - Refresh token works
  - New access token issued
  - Retry succeeds
- **Business Rule Validated:** Token expiration and refresh flow
- **Priority:** P0

### TC-AUTH-006: Account Lockout After Failed Attempts
- **Test Case ID:** TC-AUTH-006
- **Title:** Lock Account After 5 Failed Login Attempts
- **Actor:** Attacker/User
- **Preconditions:** Valid user account exists
- **Steps:**
  1. Attempt login with wrong password (5 times)
  2. Verify account locked
  3. Attempt login with correct password
  4. Wait 30 minutes
  5. Attempt login with correct password
- **Expected Result:**
  - After 5 failures: Account locked message
  - Login blocked even with correct password
  - After 30 min: Account unlocked, login succeeds
- **Business Rule Validated:** Brute force protection
- **Priority:** P1

---

## 2. Job Seeker Flow Test Cases

### TC-JS-001: Complete Profile Creation
- **Test Case ID:** TC-JS-001
- **Title:** Job Seeker Creates Complete Profile
- **Actor:** Job Seeker
- **Preconditions:** 
  - User registered as job_seeker
  - Logged in
- **Steps:**
  1. Navigate to profile page
  2. Fill personal information (headline, summary)
  3. Add skills (minimum 3)
  4. Add work experience (at least 1)
  5. Add education (at least 1)
  6. Upload resume (PDF, max 5MB)
  7. Set job preferences
  8. Save profile
- **Expected Result:**
  - Profile saved successfully
  - Resume uploaded to S3
  - Profile completion: 100%
  - Profile visible in job applications
- **Business Rule Validated:** Profile completion required for job applications
- **Priority:** P0

### TC-JS-002: Resume Upload Success
- **Test Case ID:** TC-JS-002
- **Title:** Upload Resume Successfully
- **Actor:** Job Seeker
- **Preconditions:** 
  - User logged in
  - Valid PDF resume file (< 5MB)
- **Steps:**
  1. Navigate to profile
  2. Click "Upload Resume"
  3. Select PDF file
  4. Upload file
  5. Verify upload progress
  6. Verify success message
- **Expected Result:**
  - File uploaded to S3
  - Resume URL stored in profile
  - Resume visible in profile
  - Resume available for job applications
- **Business Rule Validated:** Resume required for job applications
- **Priority:** P0

### TC-JS-003: Resume Upload Failure Handling
- **Test Case ID:** TC-JS-003
- **Title:** Handle Resume Upload Failure
- **Actor:** Job Seeker
- **Preconditions:** 
  - User logged in
  - S3 service unavailable (simulated)
- **Steps:**
  1. Attempt to upload resume
  2. Verify error handling
  3. Verify retry option
- **Expected Result:**
  - Clear error message
  - Upload can be retried
  - No partial data saved
- **Business Rule Validated:** Graceful error handling
- **Priority:** P1

### TC-JS-004: Job Search with Filters
- **Test Case ID:** TC-JS-004
- **Title:** Search Jobs with Multiple Filters
- **Actor:** Job Seeker
- **Preconditions:** 
  - Multiple jobs exist in database
  - User logged in
- **Steps:**
  1. Navigate to job search
  2. Enter search term: "Software Engineer"
  3. Select location: "Bangalore"
  4. Select experience level: "Mid"
  5. Set salary range: ₹5L - ₹10L
  6. Apply filters
  7. Verify results
- **Expected Result:**
  - Jobs matching all filters displayed
  - Results paginated (10 per page)
  - Total count shown
  - Filters persist in URL
- **Business Rule Validated:** Job search functionality
- **Priority:** P0

### TC-JS-005: Apply to Job Successfully
- **Test Case ID:** TC-JS-005
- **Title:** Job Seeker Applies to Job
- **Actor:** Job Seeker
- **Preconditions:**
  - Profile complete (100%)
  - Resume uploaded
  - Active job exists
  - User not already applied
- **Steps:**
  1. View job details
  2. Click "Apply Now"
  3. Select resume from dropdown
  4. Add cover letter (optional)
  5. Submit application
  6. Verify confirmation
- **Expected Result:**
  - Application created with status "applied"
  - Application visible in "My Applications"
  - Employer receives notification
  - Application count on job incremented
- **Business Rule Validated:** One application per job per user
- **Priority:** P0

### TC-JS-006: Prevent Duplicate Application
- **Test Case ID:** TC-JS-006
- **Title:** Cannot Apply to Same Job Twice
- **Actor:** Job Seeker
- **Preconditions:** 
  - User already applied to Job-123
- **Steps:**
  1. Navigate to Job-123 details
  2. Attempt to apply again
  3. Verify behavior
- **Expected Result:**
  - "Apply" button disabled or shows "Already Applied"
  - API returns error if attempted: "You have already applied to this job"
  - No duplicate application created
- **Business Rule Validated:** Unique application constraint
- **Priority:** P0

### TC-JS-007: Application Status Tracking
- **Test Case ID:** TC-JS-007
- **Title:** Track Application Status Changes
- **Actor:** Job Seeker
- **Preconditions:** 
  - User has submitted application
- **Steps:**
  1. View "My Applications"
  2. Verify initial status: "applied"
  3. Wait for employer to review (simulate)
  4. Verify status update: "shortlisted" or "rejected"
  5. Verify notification received
- **Expected Result:**
  - Status updates in real-time
  - Notification sent on status change
  - Status history visible
- **Business Rule Validated:** Application status workflow
- **Priority:** P1

---

## 3. Mock Interview Flow Test Cases

### TC-INT-001: Schedule Interview with Payment
- **Test Case ID:** TC-INT-001
- **Title:** Complete Interview Scheduling with Payment
- **Actor:** Job Seeker
- **Preconditions:**
  - User logged in
  - Payment method available
  - No coupon applied
- **Steps:**
  1. Navigate to "Schedule Interview"
  2. Select skills (minimum 1): ["JavaScript", "React"]
  3. Add notes (optional)
  4. Click "Submit Interview Request"
  5. Verify payment required message
  6. Click "Proceed to Payment"
  7. Razorpay modal opens
  8. Enter test payment details
  9. Complete payment
  10. Verify payment success
  11. Verify interview request created
- **Expected Result:**
  - Payment amount: ₹100 (base price)
  - Payment status: completed
  - Interview request status: "requested"
  - Notification sent to user
  - Interview visible in "My Interviews"
- **Business Rule Validated:** Payment required before interview scheduling
- **Priority:** P0

### TC-INT-002: Schedule Interview with 95% Discount Coupon
- **Test Case ID:** TC-INT-002
- **Title:** Schedule Interview with Percentage Discount Coupon
- **Actor:** Job Seeker
- **Preconditions:**
  - Valid 95% discount coupon exists
  - User logged in
- **Steps:**
  1. Navigate to "Schedule Interview"
  2. Enter coupon code
  3. Verify coupon validated
  4. Verify discount shown: ₹5 (95% off ₹100)
  5. Select skills
  6. Proceed to payment
  7. Verify Razorpay shows ₹5
  8. Complete payment
  9. Verify interview created
- **Expected Result:**
  - Coupon validated successfully
  - Discount calculated: ₹95 off
  - Payment amount: ₹5 (not ₹100)
  - Razorpay order created with ₹5
  - Interview request created
  - Coupon usage incremented
- **Business Rule Validated:** Percentage discount calculation
- **Priority:** P0

### TC-INT-003: Schedule Interview with Flat Discount Coupon
- **Test Case ID:** TC-INT-003
- **Title:** Schedule Interview with Flat ₹50 Discount
- **Actor:** Job Seeker
- **Preconditions:**
  - Valid flat ₹50 discount coupon exists
- **Steps:**
  1. Apply flat discount coupon
  2. Verify discount: ₹50 off
  3. Verify final amount: ₹50
  4. Complete payment
- **Expected Result:**
  - Discount: ₹50
  - Final payment: ₹50
  - Interview created
- **Business Rule Validated:** Flat discount calculation
- **Priority:** P0

### TC-INT-004: Schedule Interview with 100% Discount (Free)
- **Test Case ID:** TC-INT-004
- **Title:** Free Interview with 100% Discount Coupon
- **Actor:** Job Seeker
- **Preconditions:**
  - Valid 100% discount coupon exists
- **Steps:**
  1. Apply 100% discount coupon
  2. Verify amount: ₹0 (Free)
  3. Submit interview request
  4. Verify no payment required
- **Expected Result:**
  - Payment skipped
  - Interview request created directly
  - Coupon applied
  - No payment record created
- **Business Rule Validated:** 100% discount = free interview
- **Priority:** P0

### TC-INT-005: Interviewer Claims Request
- **Test Case ID:** TC-INT-005
- **Title:** Interviewer Claims Available Interview Request
- **Actor:** Interviewer
- **Preconditions:**
  - Interviewer approved by admin
  - Pending interview request exists
  - Request skills match interviewer expertise
- **Steps:**
  1. Login as interviewer
  2. Navigate to "Available Requests"
  3. View matching interview request
  4. Click "Claim Interview"
  5. Set scheduled date/time (future date)
  6. Set duration (30/45/60 minutes)
  7. Confirm claim
- **Expected Result:**
  - Interview status: "scheduled"
  - Interviewer assigned
  - Scheduled date/time set
  - Job seeker notified
  - Interview removed from available requests
- **Business Rule Validated:** Only one interviewer can claim a request
- **Priority:** P0

### TC-INT-006: Prevent Multiple Interviewers Claiming Same Request
- **Test Case ID:** TC-INT-006
- **Title:** Race Condition - Multiple Interviewers Claim Same Request
- **Actor:** Multiple Interviewers
- **Preconditions:**
  - 2+ interviewers viewing same request
  - Request status: "requested"
- **Steps:**
  1. Interviewer A clicks "Claim" at time T
  2. Interviewer B clicks "Claim" at time T+100ms
  3. Verify only one succeeds
- **Expected Result:**
  - First claim succeeds
  - Second claim fails with "Already claimed" error
  - Interview status: "scheduled"
  - Only one interviewer assigned
- **Business Rule Validated:** Atomic claim operation
- **Priority:** P0

### TC-INT-007: Interview Start Flow
- **Test Case ID:** TC-INT-007
- **Title:** Interviewer Starts Scheduled Interview
- **Actor:** Interviewer
- **Preconditions:**
  - Interview scheduled
  - Current time = scheduled time
- **Steps:**
  1. Navigate to "My Interviews"
  2. View scheduled interview
  3. Click "Start Interview"
  4. Verify interview status updated
  5. Verify meeting URL generated (if applicable)
- **Expected Result:**
  - Interview status: "in_progress"
  - Started at timestamp recorded
  - Job seeker notified
  - Interview cannot be cancelled now
- **Business Rule Validated:** Interview can only start at scheduled time
- **Priority:** P0

### TC-INT-008: Interview Completion with Feedback
- **Test Case ID:** TC-INT-008
- **Title:** Complete Interview with Recording and Feedback
- **Actor:** Interviewer
- **Preconditions:**
  - Interview in "in_progress" status
  - Interview conducted
- **Steps:**
  1. Navigate to interview details
  2. Upload video recording (if available)
  3. Fill feedback form:
     - Overall rating (1-5 stars)
     - Technical skills rating
     - Communication skills rating
     - Strengths (text)
     - Areas for improvement (text)
     - Recommendation (text)
  4. Submit feedback
  5. Mark interview as complete
- **Expected Result:**
  - Interview status: "completed"
  - Recording URL stored
  - Feedback saved
  - Job seeker notified
  - Payment released to interviewer
  - Interviewer earnings updated
- **Business Rule Validated:** Feedback mandatory before completion
- **Priority:** P0

### TC-INT-009: Interview Cancellation by Job Seeker
- **Test Case ID:** TC-INT-009
- **Title:** Job Seeker Cancels Scheduled Interview
- **Actor:** Job Seeker
- **Preconditions:**
  - Interview scheduled (not started)
  - Cancellation allowed (24+ hours before)
- **Steps:**
  1. View scheduled interview
  2. Click "Cancel Interview"
  3. Provide cancellation reason
  4. Confirm cancellation
- **Expected Result:**
  - Interview status: "cancelled"
  - Interviewer notified
  - Refund processed (if applicable)
  - Cancellation reason recorded
- **Business Rule Validated:** Cancellation policy (24h notice for refund)
- **Priority:** P1

### TC-INT-010: Interview Expiry (No Claim)
- **Test Case ID:** TC-INT-010
- **Title:** Interview Request Expires Without Claim
- **Actor:** System
- **Preconditions:**
  - Interview request created
  - 7 days passed
  - No interviewer claimed
- **Steps:**
  1. System cron job runs
  2. Check for expired requests
  3. Update expired requests
- **Expected Result:**
  - Interview status: "expired"
  - Job seeker notified
  - Refund processed (if paid)
  - Request removed from available pool
- **Business Rule Validated:** Request expiry after 7 days
- **Priority:** P1

---

## 4. Payment Flow Test Cases

### TC-PAY-001: Successful Payment Processing
- **Test Case ID:** TC-PAY-001
- **Title:** Complete Payment Successfully
- **Actor:** Job Seeker
- **Preconditions:**
  - User logged in
  - Interview request pending payment
- **Steps:**
  1. Initiate payment flow
  2. Razorpay modal opens
  3. Enter test card: 4111 1111 1111 1111
  4. Enter CVV: 123
  5. Enter expiry: 12/25
  6. Complete payment
  7. Verify webhook received
  8. Verify payment status updated
- **Expected Result:**
  - Payment status: "completed"
  - Razorpay payment ID stored
  - Interview request created/updated
  - Receipt generated
  - User notified
- **Business Rule Validated:** Payment verification before interview creation
- **Priority:** P0

### TC-PAY-002: Payment Failure - Insufficient Funds
- **Test Case ID:** TC-PAY-002
- **Title:** Handle Payment Failure Gracefully
- **Actor:** Job Seeker
- **Preconditions:**
  - User attempting payment
  - Test card with insufficient funds
- **Steps:**
  1. Initiate payment
  2. Enter payment details
  3. Payment fails (insufficient funds)
  4. Verify error handling
- **Expected Result:**
  - Clear error message displayed
  - Payment status: "failed"
  - Payment record created
  - User can retry payment
  - Interview not created
- **Business Rule Validated:** Failed payments don't create interviews
- **Priority:** P0

### TC-PAY-003: Payment Cancellation
- **Test Case ID:** TC-PAY-003
- **Title:** User Cancels Payment
- **Actor:** Job Seeker
- **Preconditions:** User in payment flow
- **Steps:**
  1. Open Razorpay modal
  2. Click "Cancel" or close modal
  3. Verify behavior
- **Expected Result:**
  - Payment cancelled
  - No payment record created
  - User returned to previous page
  - Interview request not created
- **Business Rule Validated:** Cancellation doesn't create payment records
- **Priority:** P1

### TC-PAY-004: Payment Webhook Retry
- **Test Case ID:** TC-PAY-004
- **Title:** Handle Webhook Delivery Retry
- **Actor:** System (Razorpay)
- **Preconditions:**
  - Payment completed in Razorpay
  - Initial webhook delivery failed
- **Steps:**
  1. Payment completed
  2. Webhook delivery fails (network issue)
  3. Razorpay retries webhook (after delay)
  4. System receives webhook
  5. Verify processing
- **Expected Result:**
  - Webhook processed successfully
  - Payment status updated
  - Interview created
  - No duplicate processing
- **Business Rule Validated:** Webhook idempotency
- **Priority:** P0

### TC-PAY-005: Duplicate Payment Prevention
- **Test Case ID:** TC-PAY-005
- **Title:** Prevent Duplicate Payment Processing
- **Actor:** System
- **Preconditions:**
  - Payment webhook received
  - Same webhook received again (retry)
- **Steps:**
  1. Process first webhook
  2. Receive duplicate webhook (same payment ID)
  3. Verify processing
- **Expected Result:**
  - First webhook processed
  - Duplicate webhook ignored (idempotent)
  - No duplicate payment records
  - No duplicate interviews created
- **Business Rule Validated:** Payment idempotency
- **Priority:** P0

### TC-PAY-006: Refund Processing
- **Test Case ID:** TC-PAY-006
- **Title:** Admin Processes Refund
- **Actor:** Admin
- **Preconditions:**
  - Payment exists with status "completed"
  - Refund requested (interview cancelled, etc.)
- **Steps:**
  1. Admin views payment details
  2. Click "Process Refund"
  3. Confirm refund
  4. Verify Razorpay refund API called
  5. Verify payment status updated
- **Expected Result:**
  - Refund processed via Razorpay
  - Payment status: "refunded"
  - Refund amount recorded
  - User notified
  - Interview status updated (if applicable)
- **Business Rule Validated:** Only completed payments can be refunded
- **Priority:** P1

### TC-PAY-007: Payment Amount Validation
- **Test Case ID:** TC-PAY-007
- **Title:** Verify Payment Amount Matches Order
- **Actor:** System
- **Preconditions:**
  - Payment order created with amount ₹50 (discounted)
  - User attempts to pay different amount
- **Steps:**
  1. Create order with ₹50
  2. Attempt to modify amount in frontend
  3. Verify backend validation
- **Expected Result:**
  - Backend validates amount matches order
  - Payment fails if amount mismatch
  - Security: Frontend amount cannot be trusted
- **Business Rule Validated:** Server-side amount validation
- **Priority:** P0

---

## 5. Coupon System Test Cases

### TC-COUPON-001: Apply Valid Percentage Coupon
- **Test Case ID:** TC-COUPON-001
- **Title:** Apply 50% Discount Coupon Successfully
- **Actor:** Job Seeker
- **Preconditions:**
  - Valid active coupon: "SAVE50" (50% discount)
  - User hasn't exceeded usage limit
- **Steps:**
  1. Navigate to schedule interview
  2. Enter coupon code: "SAVE50"
  3. Click "Apply"
  4. Verify coupon validated
  5. Verify discount shown: ₹50 off
  6. Verify final amount: ₹50
- **Expected Result:**
  - Coupon validated successfully
  - Discount calculated: 50% of ₹100 = ₹50
  - Final amount: ₹50
  - Coupon code displayed
- **Business Rule Validated:** Percentage discount calculation
- **Priority:** P0

### TC-COUPON-002: Apply Valid Flat Discount Coupon
- **Test Case ID:** TC-COUPON-002
- **Title:** Apply ₹75 Flat Discount Coupon
- **Actor:** Job Seeker
- **Preconditions:**
  - Valid flat discount coupon: "FLAT75" (₹75 off)
- **Steps:**
  1. Apply coupon "FLAT75"
  2. Verify discount: ₹75
  3. Verify final amount: ₹25
- **Expected Result:**
  - Discount: ₹75
  - Final amount: ₹25 (₹100 - ₹75)
- **Business Rule Validated:** Flat discount calculation
- **Priority:** P0

### TC-COUPON-003: Invalid Coupon Code
- **Test Case ID:** TC-COUPON-003
- **Title:** Reject Invalid Coupon Code
- **Actor:** Job Seeker
- **Preconditions:** Invalid coupon code
- **Steps:**
  1. Enter invalid coupon: "INVALID123"
  2. Click "Apply"
  3. Verify error
- **Expected Result:**
  - Error: "Invalid or inactive coupon code"
  - No discount applied
  - Full amount shown
- **Business Rule Validated:** Coupon validation
- **Priority:** P0

### TC-COUPON-004: Expired Coupon
- **Test Case ID:** TC-COUPON-004
- **Title:** Reject Expired Coupon
- **Actor:** Job Seeker
- **Preconditions:** Coupon exists but expired
- **Steps:**
  1. Apply expired coupon
  2. Verify error
- **Expected Result:**
  - Error: "This coupon has expired"
  - No discount applied
- **Business Rule Validated:** Coupon expiry check
- **Priority:** P1

### TC-COUPON-005: Per-User Limit Reached
- **Test Case ID:** TC-COUPON-005
- **Title:** Prevent Usage Beyond Per-User Limit
- **Actor:** Job Seeker
- **Preconditions:**
  - Coupon with perUserLimit: 2
  - User already used coupon 2 times
- **Steps:**
  1. Attempt to apply coupon again
  2. Verify error
- **Expected Result:**
  - Error: "You have reached the usage limit for this coupon (2 uses)"
  - No discount applied
- **Business Rule Validated:** Per-user usage limit
- **Priority:** P1

### TC-COUPON-006: Global Limit Reached
- **Test Case ID:** TC-COUPON-006
- **Title:** Prevent Usage When Global Limit Reached
- **Actor:** Job Seeker
- **Preconditions:**
  - Coupon with globalLimit: 100
  - Coupon already used 100 times (totalUsed = 100)
- **Steps:**
  1. Attempt to apply coupon
  2. Verify error
- **Expected Result:**
  - Error: "This coupon has reached its global usage limit"
  - No discount applied
- **Business Rule Validated:** Global usage limit
- **Priority:** P1

### TC-COUPON-007: Coupon Expiry During Payment
- **Test Case ID:** TC-COUPON-007
- **Title:** Coupon Expires Between Validation and Payment
- **Actor:** Job Seeker
- **Preconditions:**
  - Coupon expires at 12:00 PM
  - User validates coupon at 11:59 AM
  - User attempts payment at 12:01 PM
- **Steps:**
  1. Apply coupon (valid)
  2. Wait for coupon to expire
  3. Attempt payment
  4. Verify validation
- **Expected Result:**
  - Payment fails with "Coupon expired" error
  - User must apply new coupon or pay full amount
  - Coupon re-validated at payment time
- **Business Rule Validated:** Coupon validated at payment time
- **Priority:** P1

### TC-COUPON-008: Race Condition - Multiple Users Apply Same Coupon
- **Test Case ID:** TC-COUPON-008
- **Title:** Concurrent Coupon Application
- **Actor:** Multiple Job Seekers
- **Preconditions:**
  - Coupon with globalLimit: 10
  - Current usage: 9
  - 2 users attempt to apply simultaneously
- **Steps:**
  1. User A applies coupon (at time T)
  2. User B applies coupon (at time T+50ms)
  3. Verify only one succeeds
- **Expected Result:**
  - One user succeeds (reaches limit 10)
  - Other user fails: "Global limit reached"
  - No overselling
- **Business Rule Validated:** Atomic coupon usage increment
- **Priority:** P0

---

## 6. Admin Operations Test Cases

### TC-ADMIN-001: Interviewer Approval
- **Test Case ID:** TC-ADMIN-001
- **Title:** Admin Approves Interviewer Application
- **Actor:** Admin
- **Preconditions:**
  - Pending interviewer application exists
  - Admin logged in
- **Steps:**
  1. Navigate to "Interviewer Management"
  2. View pending interviewers
  3. Review profile, skills, experience, certifications
  4. Click "Approve"
  5. Verify status update
- **Expected Result:**
  - Interviewer status: "approved"
  - User status: "active"
  - Interviewer can now claim interviews
  - Notification sent to interviewer
- **Business Rule Validated:** Admin approval required
- **Priority:** P0

### TC-ADMIN-002: Interviewer Rejection
- **Test Case ID:** TC-ADMIN-002
- **Title:** Admin Rejects Interviewer with Reason
- **Actor:** Admin
- **Preconditions:**
  - Pending interviewer application
- **Steps:**
  1. View interviewer application
  2. Click "Reject"
  3. Enter rejection reason (mandatory)
  4. Confirm rejection
- **Expected Result:**
  - Interviewer status: "rejected"
  - Rejection reason recorded
  - User status: "inactive"
  - Notification sent with reason
- **Business Rule Validated:** Rejection requires reason
- **Priority:** P0

### TC-ADMIN-003: User Suspension
- **Test Case ID:** TC-ADMIN-003
- **Title:** Admin Suspends User Account
- **Actor:** Admin
- **Preconditions:**
  - Active user account exists
- **Steps:**
  1. View user details
  2. Click "Suspend Account"
  3. Provide reason
  4. Confirm suspension
  5. Verify user cannot login
- **Expected Result:**
  - User status: "suspended"
  - Login attempts fail
  - Existing sessions invalidated
  - User notified
- **Business Rule Validated:** Suspended users cannot access platform
- **Priority:** P1

### TC-ADMIN-004: Create Coupon
- **Test Case ID:** TC-ADMIN-004
- **Title:** Admin Creates New Coupon
- **Actor:** Admin
- **Preconditions:** Admin logged in
- **Steps:**
  1. Navigate to "Coupon Management"
  2. Click "Create Coupon"
  3. Enter coupon code: "NEW50"
  4. Enter description
  5. Select discount type: "percentage"
  6. Enter discount value: 50
  7. Set per-user limit: 5
  8. Set global limit: 1000 (optional)
  9. Set expiry date (optional)
  10. Save coupon
- **Expected Result:**
  - Coupon created successfully
  - Coupon active by default
  - Coupon visible in list
  - Coupon can be used by users
- **Business Rule Validated:** Coupon creation with validation
- **Priority:** P0

### TC-ADMIN-005: Update Coupon
- **Test Case ID:** TC-ADMIN-005
- **Title:** Admin Updates Existing Coupon
- **Actor:** Admin
- **Preconditions:**
  - Active coupon exists
- **Steps:**
  1. View coupon details
  2. Click "Edit"
  3. Update discount value
  4. Update expiry date
  5. Save changes
- **Expected Result:**
  - Coupon updated successfully
  - Changes reflected immediately
  - Existing validations apply
- **Business Rule Validated:** Coupon update with validation
- **Priority:** P1

### TC-ADMIN-006: Deactivate Coupon
- **Test Case ID:** TC-ADMIN-006
- **Title:** Admin Deactivates Coupon
- **Actor:** Admin
- **Preconditions:**
  - Active coupon exists
  - Some users may have applied it
- **Steps:**
  1. View coupon
  2. Toggle "Active" to off
  3. Verify deactivation
- **Expected Result:**
  - Coupon status: "inactive"
  - New users cannot apply
  - Existing validations still work
- **Business Rule Validated:** Coupon activation control
- **Priority:** P1

### TC-ADMIN-007: Process Refund
- **Test Case ID:** TC-ADMIN-007
- **Title:** Admin Processes Payment Refund
- **Actor:** Admin
- **Preconditions:**
  - Payment with status "completed"
  - Refund requested (interview cancelled, etc.)
- **Steps:**
  1. Navigate to "Payments"
  2. View payment details
  3. Click "Process Refund"
  4. Confirm refund
  5. Verify Razorpay refund
- **Expected Result:**
  - Refund processed via Razorpay
  - Payment status: "refunded"
  - Refund amount recorded
  - User notified
- **Business Rule Validated:** Refund processing
- **Priority:** P1

### TC-ADMIN-008: View System Health
- **Test Case ID:** TC-ADMIN-008
- **Title:** Admin Views System Health Metrics
- **Actor:** Admin
- **Preconditions:** Admin logged in
- **Steps:**
  1. Navigate to "System Settings"
  2. View "System Health"
  3. Verify metrics displayed
- **Expected Result:**
  - Database status: healthy/unhealthy
  - Cache (Redis) status: healthy/unhealthy
  - Response times shown
  - Uptime displayed
  - Memory usage shown
- **Business Rule Validated:** System monitoring
- **Priority:** P1

---

## 7. Notification System Test Cases

### TC-NOTIF-001: Email Notification Delivery
- **Test Case ID:** TC-NOTIF-001
- **Title:** Send Email Notification Successfully
- **Actor:** System
- **Preconditions:**
  - Email service configured
  - Notification event triggered (e.g., interview scheduled)
- **Steps:**
  1. Interview scheduled event occurs
  2. System creates notification record
  3. Email service sends email
  4. Verify email delivery
- **Expected Result:**
  - Notification record created in database
  - Email sent successfully
  - Delivery status logged
  - User receives email
- **Business Rule Validated:** Critical notifications must be delivered
- **Priority:** P1

### TC-NOTIF-002: In-App Notification
- **Test Case ID:** TC-NOTIF-002
- **Title:** User Receives In-App Notification
- **Actor:** User (Any Role)
- **Preconditions:**
  - User logged in
  - Notification event triggered
- **Steps:**
  1. Notification created for user
  2. User refreshes page or navigates
  3. Verify notification badge
  4. Click notification
  5. Verify notification marked as read
- **Expected Result:**
  - Notification badge shows unread count
  - Notification visible in list
  - Clicking marks as read
  - Unread count decreases
- **Business Rule Validated:** Notification delivery and read tracking
- **Priority:** P1

### TC-NOTIF-003: Notification Failure Handling
- **Test Case ID:** TC-NOTIF-003
- **Title:** Handle Email Service Failure
- **Actor:** System
- **Preconditions:**
  - Email service unavailable
  - Notification event triggered
- **Steps:**
  1. Notification event occurs
  2. Email service fails
  3. Verify error handling
  4. Verify retry mechanism
- **Expected Result:**
  - Notification record created
  - Email queued for retry
  - Retry after delay (exponential backoff)
  - Eventually delivered or marked as failed
- **Business Rule Validated:** Notifications should not be lost
- **Priority:** P1

### TC-NOTIF-004: Bulk Notifications
- **Test Case ID:** TC-NOTIF-004
- **Title:** Send Bulk Notifications
- **Actor:** System/Admin
- **Preconditions:**
  - Multiple users to notify
  - System announcement needed
- **Steps:**
  1. Admin creates system announcement
  2. Select target users (all or filtered)
  3. Send notification
  4. Verify delivery
- **Expected Result:**
  - Notifications created for all target users
  - Notifications sent efficiently
  - Delivery tracked
- **Business Rule Validated:** Bulk notification capability
- **Priority:** P2

---

## 8. System Failure & Recovery Test Cases

### TC-RECOV-001: Database Connection Loss
- **Test Case ID:** TC-RECOV-001
- **Title:** Handle Database Reconnection
- **Actor:** System
- **Preconditions:**
  - System running normally
  - Database connection active
- **Steps:**
  1. Simulate database connection loss
  2. Make API request
  3. Verify error response
  4. Restore database connection
  5. Verify automatic reconnection
  6. Retry API request
- **Expected Result:**
  - During downtime: 503 Service Unavailable
  - Error logged
  - Automatic reconnection when available
  - System resumes normal operation
  - No data loss
- **Business Rule Validated:** System must recover automatically
- **Priority:** P0

### TC-RECOV-002: Redis Cache Failure
- **Test Case ID:** TC-RECOV-002
- **Title:** System Operates Without Redis
- **Actor:** System
- **Preconditions:**
  - Redis connection active
  - System using cache
- **Steps:**
  1. Simulate Redis connection failure
  2. Make API requests
  3. Verify system continues operation
  4. Verify fallback to database
- **Expected Result:**
  - System continues functioning
  - No cache, but no errors
  - Performance degraded but functional
  - Automatic reconnection when available
- **Business Rule Validated:** Cache is optional, not critical
- **Priority:** P1

### TC-RECOV-003: Razorpay Service Failure
- **Test Case ID:** TC-RECOV-003
- **Title:** Handle Payment Gateway Failure
- **Actor:** System
- **Preconditions:**
  - User attempting payment
  - Razorpay service unavailable
- **Steps:**
  1. User initiates payment
  2. Razorpay API fails
  3. Verify error handling
  4. Verify circuit breaker (if implemented)
- **Expected Result:**
  - Clear error message to user
  - Payment not created
  - User can retry later
  - System logs error
- **Business Rule Validated:** Graceful degradation
- **Priority:** P1

### TC-RECOV-004: AWS S3 Service Failure
- **Test Case ID:** TC-RECOV-004
- **Title:** Handle File Upload Failure
- **Actor:** System
- **Preconditions:**
  - User attempting resume upload
  - S3 service unavailable
- **Steps:**
  1. User uploads resume
  2. S3 upload fails
  3. Verify error handling
  4. Verify retry option
- **Expected Result:**
  - Error message displayed
  - Upload can be retried
  - No partial data saved
  - User notified
- **Business Rule Validated:** File upload resilience
- **Priority:** P1

### TC-RECOV-005: Application Restart
- **Test Case ID:** TC-RECOV-005
- **Title:** Graceful Application Shutdown and Restart
- **Actor:** System
- **Preconditions:**
  - Application running
  - Active connections
- **Steps:**
  1. Send SIGTERM signal
  2. Verify graceful shutdown
  3. Verify connections closed
  4. Restart application
  5. Verify normal operation
- **Expected Result:**
  - Graceful shutdown (no forced kill)
  - Active requests completed or timeout
  - Database connections closed
  - Redis connections closed
  - Clean restart
- **Business Rule Validated:** Zero-downtime deployment capability
- **Priority:** P1

---

## 9. Data Integrity Test Cases

### TC-DATA-001: Referential Integrity
- **Test Case ID:** TC-DATA-001
- **Title:** Prevent Orphaned Records
- **Actor:** System
- **Preconditions:**
  - User has applications
  - User has interviews
- **Steps:**
  1. Attempt to delete user
  2. Verify behavior
- **Expected Result:**
  - Delete blocked if user has related records
  - OR cascade delete (based on policy)
  - No orphaned records
- **Business Rule Validated:** Data integrity constraints
- **Priority:** P1

### TC-DATA-002: Payment Amount Consistency
- **Test Case ID:** TC-DATA-002
- **Title:** Verify Payment Amount Matches Order
- **Actor:** System
- **Preconditions:**
  - Payment order created
  - Payment completed
- **Steps:**
  1. Verify payment record amount
  2. Verify order amount
  3. Verify they match
- **Expected Result:**
  - Payment amount = Order amount
  - No discrepancies
  - Audit trail available
- **Business Rule Validated:** Financial data consistency
- **Priority:** P0

### TC-DATA-003: Coupon Usage Tracking
- **Test Case ID:** TC-DATA-003
- **Title:** Verify Coupon Usage Accurately Tracked
- **Actor:** System
- **Preconditions:**
  - Coupon applied multiple times
- **Steps:**
  1. Apply coupon (user A)
  2. Apply coupon (user B)
  3. Verify totalUsed incremented
  4. Verify per-user usage tracked
- **Expected Result:**
  - totalUsed = 2
  - User A usage = 1
  - User B usage = 1
  - No discrepancies
- **Business Rule Validated:** Coupon usage accuracy
- **Priority:** P0

---

## 10. Performance Test Cases

### TC-PERF-001: Job Search Performance
- **Test Case ID:** TC-PERF-001
- **Title:** Job Search Response Time Under Load
- **Actor:** System
- **Preconditions:**
  - 10,000 jobs in database
  - Cache enabled
- **Steps:**
  1. Execute job search query
  2. Measure response time
  3. Verify cache hit
  4. Repeat without cache
- **Expected Result:**
  - With cache: < 100ms
  - Without cache: < 500ms
  - Results paginated
  - No timeout errors
- **Business Rule Validated:** Search performance requirements
- **Priority:** P1

### TC-PERF-002: Concurrent User Registration
- **Test Case ID:** TC-PERF-002
- **Title:** Handle 100 Concurrent Registrations
- **Actor:** System
- **Preconditions:** None
- **Steps:**
  1. Simulate 100 concurrent registration requests
  2. Monitor response times
  3. Verify all succeed
  4. Check for duplicates
- **Expected Result:**
  - All registrations succeed
  - Response time < 2s (p95)
  - No duplicate emails
  - Database connection pool not exhausted
- **Business Rule Validated:** System scalability
- **Priority:** P1

### TC-PERF-003: Payment Processing Under Load
- **Test Case ID:** TC-PERF-003
- **Title:** Process 50 Concurrent Payments
- **Actor:** System
- **Preconditions:**
  - 50 users attempting payment simultaneously
- **Steps:**
  1. Simulate 50 concurrent payment requests
  2. Monitor processing
  3. Verify all processed
  4. Check for duplicates
- **Expected Result:**
  - All payments processed
  - No duplicate orders
  - Webhook processing < 5s
  - No race conditions
- **Business Rule Validated:** Payment system reliability
- **Priority:** P0

---

## Test Execution Summary

### Test Coverage by Priority

| Priority | Count | Status |
|----------|-------|--------|
| P0 (Critical) | 25 | Must Pass |
| P1 (High) | 20 | Should Pass |
| P2 (Medium) | 5 | Nice to Have |
| **Total** | **50** | |

### Test Execution Plan

**Phase 1: Critical Path (P0) - Week 1**
- Authentication & Authorization
- Payment Flow
- Interview Scheduling
- Coupon System (critical paths)

**Phase 2: High Priority (P1) - Week 2**
- Admin Operations
- Notification System
- Recovery Scenarios
- Performance Testing

**Phase 3: Medium Priority (P2) - Week 3**
- Edge Cases
- Bulk Operations
- Advanced Features

### Test Environment Requirements

- **Test Database:** Separate from production
- **Test Payment Gateway:** Razorpay test mode
- **Test Email Service:** Mailtrap or similar
- **Load Testing Tools:** k6, JMeter, or Artillery
- **Monitoring:** Test environment monitoring enabled

---

**Document Status:** Ready for Execution  
**Last Updated:** [Current Date]  
**Next Review:** After test execution
