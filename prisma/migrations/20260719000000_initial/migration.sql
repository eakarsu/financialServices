-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARTNER', 'MANAGER', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('SOLE_PROPRIETOR', 'PARTNERSHIP', 'LLC', 'S_CORP', 'C_CORP', 'NON_PROFIT', 'TRUST', 'ESTATE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TAX_RETURN', 'FINANCIAL_STATEMENT', 'BANK_STATEMENT', 'RECEIPT', 'INVOICE', 'CONTRACT', 'ENGAGEMENT_LETTER', 'W2', 'W9', 'FORM_1099', 'K1', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SIGNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RetentionDisposition" AS ENUM ('ACTIVE', 'ELIGIBLE', 'BLOCKED_BY_HOLD', 'DISPOSED');

-- CreateEnum
CREATE TYPE "DocumentAccessLevel" AS ENUM ('VIEW', 'EDIT', 'MANAGE');

-- CreateEnum
CREATE TYPE "RedactionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('PENDING', 'VIEWED', 'SIGNED', 'DECLINED', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('TAX_PREPARATION', 'BOOKKEEPING', 'PAYROLL', 'AUDIT', 'CONSULTING', 'FINANCIAL_PLANNING', 'OTHER');

-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'LOAN', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CATEGORIZED', 'REVIEWED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "TaxReturnType" AS ENUM ('INDIVIDUAL_1040', 'BUSINESS_1120', 'BUSINESS_1120S', 'BUSINESS_1065', 'NON_PROFIT_990', 'TRUST_1041', 'ESTATE_706', 'PAYROLL_941', 'PAYROLL_940');

-- CreateEnum
CREATE TYPE "TaxReturnStatus" AS ENUM ('NOT_STARTED', 'GATHERING_INFO', 'IN_PROGRESS', 'REVIEW', 'PENDING_CLIENT', 'READY_TO_FILE', 'FILED', 'ACCEPTED', 'REJECTED', 'AMENDED');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('SINGLE', 'MARRIED_FILING_JOINTLY', 'MARRIED_FILING_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'QUALIFYING_WIDOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('HOURLY', 'SALARY');

-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'SEMI_MONTHLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'COMPLETED', 'VOID');

-- CreateEnum
CREATE TYPE "TaxFormType" AS ENUM ('W2', 'W4', 'I9', 'FORM_1099_NEC', 'FORM_1099_MISC');

-- CreateEnum
CREATE TYPE "TaxFormStatus" AS ENUM ('DRAFT', 'GENERATED', 'FILED', 'CORRECTED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PROFIT_LOSS', 'BALANCE_SHEET', 'CASH_FLOW', 'TRIAL_BALANCE', 'GENERAL_LEDGER', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'BUDGET_VS_ACTUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'BILLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CHECK', 'ACH', 'CREDIT_CARD', 'CASH', 'WIRE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIAnalysisType" AS ENUM ('TRANSACTION_CATEGORIZATION', 'RECEIPT_PROCESSING', 'BANK_RECONCILIATION', 'TAX_DEDUCTION_FINDER', 'ANOMALY_DETECTION', 'FINANCIAL_INSIGHTS', 'DOCUMENT_EXTRACTION', 'AUDIT_PREPARATION', 'TAX_RESEARCH', 'REPORT_GENERATION', 'CLIENT_COMMUNICATION');

-- CreateEnum
CREATE TYPE "AIAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('PLAID', 'QUICKBOOKS', 'XERO', 'DOCUSIGN', 'STRIPE', 'GUSTO', 'ADP');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('PAYROLL', 'TAX', 'FINANCIAL', 'CLIENT', 'PRACTICE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmSettings" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "defaultHourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 150.00,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceNextNumber" INTEGER NOT NULL DEFAULT 1001,
    "taxIdType" TEXT,
    "taxId" TEXT,
    "defaultPaymentTerms" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "clientNumber" TEXT NOT NULL,
    "type" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "ssn" TEXT,
    "businessName" TEXT,
    "ein" TEXT,
    "entityType" "EntityType",
    "stateOfIncorporation" TEXT,
    "dateOfIncorporation" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "address" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingZipCode" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "portalEmail" TEXT,
    "portalPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAssignment" (
    "id" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DocumentType" NOT NULL,
    "category" TEXT,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "jurisdiction" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "taxYear" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "retainUntil" TIMESTAMP(3),
    "retentionDisposition" "RetentionDisposition" NOT NULL DEFAULT 'ACTIVE',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isPrivileged" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,
    "clientId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "folderId" TEXT,
    "engagementId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "changeNote" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'UPLOAD',
    "sourceProvider" TEXT,
    "sourceEventId" TEXT,
    "sourceTimestamp" TIMESTAMP(3),
    "jurisdiction" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "ocrStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    "ocrText" TEXT,
    "ocrEvidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "status" "SignatureStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "signatureData" TEXT,
    "provider" TEXT NOT NULL,
    "providerEnvelopeId" TEXT NOT NULL,
    "providerEventId" TEXT,
    "providerPayloadDigest" TEXT,
    "signingTokenHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureReason" TEXT,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT,

    CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authorityName" TEXT NOT NULL,
    "authorityUrl" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "sourceTimestamp" TIMESTAMP(3) NOT NULL,
    "payloadDigest" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "contentSha256" TEXT NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessGrant" (
    "id" TEXT NOT NULL,
    "accessLevel" "DocumentAccessLevel" NOT NULL DEFAULT 'VIEW',
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firmId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,

    CONSTRAINT "DocumentAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalHold" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "matterRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "releaseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firmId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdById" TEXT NOT NULL,
    "releasedById" TEXT,

    CONSTRAINT "LegalHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalHoldDocument" (
    "legalHoldId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalHoldDocument_pkey" PRIMARY KEY ("legalHoldId","documentId")
);

-- CreateTable
CREATE TABLE "DocumentRedaction" (
    "id" TEXT NOT NULL,
    "ranges" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RedactionStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "documentId" TEXT NOT NULL,
    "sourceVersionId" TEXT NOT NULL,
    "targetVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "DocumentRedaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentProcessingEvent" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "sourceTimestamp" TIMESTAMP(3) NOT NULL,
    "sourceSha256" TEXT NOT NULL,
    "payloadDigest" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentVersionId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,

    CONSTRAINT "DocumentProcessingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EngagementType" NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budgetHours" DECIMAL(65,30),
    "budgetAmount" DECIMAL(65,30),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "routingNumber" TEXT,
    "accountType" "BankAccountType" NOT NULL,
    "institution" TEXT,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "plaidAccessToken" TEXT,
    "plaidItemId" TEXT,
    "plaidAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "memo" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "aiCategorized" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DECIMAL(65,30),
    "originalDescription" TEXT,
    "vendor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "categoryId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "vendor" TEXT,
    "amount" DECIMAL(65,30),
    "date" TIMESTAMP(3),
    "taxAmount" DECIMAL(65,30),
    "category" TEXT,
    "extractedData" JSONB,
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccount" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "subType" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBankAccount" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,

    CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "isAdjusting" BOOLEAN NOT NULL DEFAULT false,
    "isClosing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "statementBalance" DECIMAL(65,30) NOT NULL,
    "clearedBalance" DECIMAL(65,30),
    "difference" DECIMAL(65,30),
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bankAccountId" TEXT NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxReturn" (
    "id" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "type" "TaxReturnType" NOT NULL,
    "status" "TaxReturnStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "filingStatus" "FilingStatus",
    "dueDate" TIMESTAMP(3),
    "extendedDueDate" TIMESTAMP(3),
    "filedDate" TIMESTAMP(3),
    "acceptedDate" TIMESTAMP(3),
    "estimatedRefund" DECIMAL(65,30),
    "estimatedOwed" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "TaxReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxOrganizer" (
    "id" TEXT NOT NULL,
    "personalInfo" JSONB,
    "incomeInfo" JSONB,
    "deductionInfo" JSONB,
    "creditInfo" JSONB,
    "otherInfo" JSONB,
    "completedSections" TEXT[],
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taxReturnId" TEXT NOT NULL,

    CONSTRAINT "TaxOrganizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxChecklistItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "receivedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taxReturnId" TEXT NOT NULL,

    CONSTRAINT "TaxChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimatedPayment" (
    "id" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taxReturnId" TEXT NOT NULL,

    CONSTRAINT "EstimatedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeadline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "baseDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "extendedDate" TIMESTAMP(3),
    "reminderDays" INTEGER[],
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "ssn" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "payType" "PayType" NOT NULL,
    "payRate" DECIMAL(65,30) NOT NULL,
    "payFrequency" "PayFrequency" NOT NULL,
    "federalFilingStatus" TEXT,
    "federalAllowances" INTEGER NOT NULL DEFAULT 0,
    "stateFilingStatus" TEXT,
    "stateAllowances" INTEGER NOT NULL DEFAULT 0,
    "additionalWithholding" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "directDepositEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bankName" TEXT,
    "bankRoutingNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "payPeriodStart" TIMESTAMP(3) NOT NULL,
    "payPeriodEnd" TIMESTAMP(3) NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "totalGross" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTaxes" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollItem" (
    "id" TEXT NOT NULL,
    "regularHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "regularPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimePay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grossPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "federalTax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stateTax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "socialSecurity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "medicare" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTaxForm" (
    "id" TEXT NOT NULL,
    "type" "TaxFormType" NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "status" "TaxFormStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB,
    "generatedAt" TIMESTAMP(3),
    "filedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "EmployeeTaxForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "budgetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "rate" DECIMAL(65,30),
    "amount" DECIMAL(65,30),
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "engagementId" TEXT,
    "invoiceId" TEXT,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "engagementId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultRate" DECIMAL(65,30) NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "assignedToId" TEXT,
    "engagementId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "type" "AIAnalysisType" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidence" DECIMAL(65,30),
    "status" "AIAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "InsightSeverity" NOT NULL DEFAULT 'INFO',
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "name" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "credentials" JSONB,
    "settings" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT NOT NULL,
    "sequence" BIGINT NOT NULL,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firmId" TEXT NOT NULL,
    "actorId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ReportCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequestTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT,

    CONSTRAINT "DocumentRequestTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxChecklistTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "returnType" "TaxReturnType",
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmId" TEXT,

    CONSTRAINT "TaxChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialHealthScore" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "incomeExpenseRatio" DECIMAL(65,30) NOT NULL,
    "savingsRate" DECIMAL(65,30) NOT NULL,
    "debtToIncome" DECIMAL(65,30) NOT NULL,
    "emergencyFundMonths" DECIMAL(65,30) NOT NULL,
    "narrative" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "FinancialHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "User_firmId_idx" ON "User"("firmId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FirmSettings_firmId_key" ON "FirmSettings"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientNumber_key" ON "Client"("clientNumber");

-- CreateIndex
CREATE INDEX "Client_firmId_idx" ON "Client"("firmId");

-- CreateIndex
CREATE INDEX "Client_clientNumber_idx" ON "Client"("clientNumber");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");

-- CreateIndex
CREATE INDEX "ClientAssignment_clientId_idx" ON "ClientAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientAssignment_userId_idx" ON "ClientAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAssignment_clientId_userId_key" ON "ClientAssignment"("clientId", "userId");

-- CreateIndex
CREATE INDEX "Document_firmId_clientId_idx" ON "Document"("firmId", "clientId");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_reviewStatus_idx" ON "Document"("reviewStatus");

-- CreateIndex
CREATE INDEX "Document_retainUntil_retentionDisposition_idx" ON "Document"("retainUntil", "retentionDisposition");

-- CreateIndex
CREATE INDEX "DocumentFolder_firmId_parentId_idx" ON "DocumentFolder"("firmId", "parentId");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_createdAt_idx" ON "DocumentVersion"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_sourceProvider_sourceEventId_key" ON "DocumentVersion"("sourceProvider", "sourceEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_signingTokenHash_key" ON "DocumentSignature"("signingTokenHash");

-- CreateIndex
CREATE INDEX "DocumentSignature_documentId_status_idx" ON "DocumentSignature"("documentId", "status");

-- CreateIndex
CREATE INDEX "DocumentSignature_documentVersionId_status_idx" ON "DocumentSignature"("documentVersionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_provider_providerEnvelopeId_signerEmail_key" ON "DocumentSignature"("provider", "providerEnvelopeId", "signerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_provider_providerEventId_key" ON "DocumentSignature"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "DocumentRequest_status_idx" ON "DocumentRequest"("status");

-- CreateIndex
CREATE INDEX "DocumentTemplate_firmId_idx" ON "DocumentTemplate"("firmId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");

-- CreateIndex
CREATE INDEX "DocumentTemplate_jurisdiction_effectiveDate_idx" ON "DocumentTemplate"("jurisdiction", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_firmId_authorityUrl_sourceEventId_key" ON "DocumentTemplate"("firmId", "authorityUrl", "sourceEventId");

-- CreateIndex
CREATE INDEX "DocumentAccessGrant_firmId_userId_revokedAt_idx" ON "DocumentAccessGrant"("firmId", "userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentAccessGrant_documentId_userId_key" ON "DocumentAccessGrant"("documentId", "userId");

-- CreateIndex
CREATE INDEX "LegalHold_firmId_status_idx" ON "LegalHold"("firmId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalHold_firmId_matterRef_key" ON "LegalHold"("firmId", "matterRef");

-- CreateIndex
CREATE INDEX "LegalHoldDocument_documentId_idx" ON "LegalHoldDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRedaction_targetVersionId_key" ON "DocumentRedaction"("targetVersionId");

-- CreateIndex
CREATE INDEX "DocumentRedaction_documentId_status_idx" ON "DocumentRedaction"("documentId", "status");

-- CreateIndex
CREATE INDEX "DocumentProcessingEvent_documentVersionId_operation_created_idx" ON "DocumentProcessingEvent"("documentVersionId", "operation", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentProcessingEvent_provider_providerEventId_key" ON "DocumentProcessingEvent"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "Engagement_clientId_idx" ON "Engagement"("clientId");

-- CreateIndex
CREATE INDEX "Engagement_type_idx" ON "Engagement"("type");

-- CreateIndex
CREATE INDEX "Engagement_status_idx" ON "Engagement"("status");

-- CreateIndex
CREATE INDEX "BankAccount_clientId_idx" ON "BankAccount"("clientId");

-- CreateIndex
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");

-- CreateIndex
CREATE INDEX "Transaction_bankAccountId_idx" ON "Transaction"("bankAccountId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_transactionId_key" ON "Receipt"("transactionId");

-- CreateIndex
CREATE INDEX "ChartOfAccount_firmId_idx" ON "ChartOfAccount"("firmId");

-- CreateIndex
CREATE INDEX "ChartOfAccount_type_idx" ON "ChartOfAccount"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_firmId_accountNumber_key" ON "ChartOfAccount"("firmId", "accountNumber");

-- CreateIndex
CREATE INDEX "JournalEntry_clientId_idx" ON "JournalEntry"("clientId");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "Reconciliation_bankAccountId_idx" ON "Reconciliation"("bankAccountId");

-- CreateIndex
CREATE INDEX "TaxReturn_clientId_idx" ON "TaxReturn"("clientId");

-- CreateIndex
CREATE INDEX "TaxReturn_taxYear_idx" ON "TaxReturn"("taxYear");

-- CreateIndex
CREATE INDEX "TaxReturn_status_idx" ON "TaxReturn"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxReturn_clientId_taxYear_type_key" ON "TaxReturn"("clientId", "taxYear", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TaxOrganizer_taxReturnId_key" ON "TaxOrganizer"("taxReturnId");

-- CreateIndex
CREATE INDEX "TaxChecklistItem_taxReturnId_idx" ON "TaxChecklistItem"("taxReturnId");

-- CreateIndex
CREATE INDEX "EstimatedPayment_taxReturnId_idx" ON "EstimatedPayment"("taxReturnId");

-- CreateIndex
CREATE INDEX "TaxDeadline_dueDate_idx" ON "TaxDeadline"("dueDate");

-- CreateIndex
CREATE INDEX "TaxDeadline_type_idx" ON "TaxDeadline"("type");

-- CreateIndex
CREATE INDEX "Employee_clientId_idx" ON "Employee"("clientId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_clientId_employeeNumber_key" ON "Employee"("clientId", "employeeNumber");

-- CreateIndex
CREATE INDEX "PayrollRun_clientId_idx" ON "PayrollRun"("clientId");

-- CreateIndex
CREATE INDEX "PayrollRun_payDate_idx" ON "PayrollRun"("payDate");

-- CreateIndex
CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun"("status");

-- CreateIndex
CREATE INDEX "PayrollItem_payrollRunId_idx" ON "PayrollItem"("payrollRunId");

-- CreateIndex
CREATE INDEX "PayrollItem_employeeId_idx" ON "PayrollItem"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeTaxForm_employeeId_idx" ON "EmployeeTaxForm"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeTaxForm_taxYear_idx" ON "EmployeeTaxForm"("taxYear");

-- CreateIndex
CREATE INDEX "FinancialReport_type_idx" ON "FinancialReport"("type");

-- CreateIndex
CREATE INDEX "FinancialReport_periodStart_idx" ON "FinancialReport"("periodStart");

-- CreateIndex
CREATE INDEX "Budget_clientId_idx" ON "Budget"("clientId");

-- CreateIndex
CREATE INDEX "Budget_fiscalYear_idx" ON "Budget"("fiscalYear");

-- CreateIndex
CREATE INDEX "BudgetLine_budgetId_idx" ON "BudgetLine"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetLine_accountId_idx" ON "BudgetLine"("accountId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_date_idx" ON "TimeEntry"("date");

-- CreateIndex
CREATE INDEX "TimeEntry_status_idx" ON "TimeEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_firmId_idx" ON "Invoice"("firmId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "ServiceItem_firmId_idx" ON "ServiceItem"("firmId");

-- CreateIndex
CREATE INDEX "ServiceItem_category_idx" ON "ServiceItem"("category");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Note_clientId_idx" ON "Note"("clientId");

-- CreateIndex
CREATE INDEX "AIAnalysis_type_idx" ON "AIAnalysis"("type");

-- CreateIndex
CREATE INDEX "AIAnalysis_status_idx" ON "AIAnalysis"("status");

-- CreateIndex
CREATE INDEX "AIInsight_category_idx" ON "AIInsight"("category");

-- CreateIndex
CREATE INDEX "AIInsight_severity_idx" ON "AIInsight"("severity");

-- CreateIndex
CREATE INDEX "Integration_type_idx" ON "Integration"("type");

-- CreateIndex
CREATE INDEX "Integration_status_idx" ON "Integration"("status");

-- CreateIndex
CREATE INDEX "Integration_firmId_idx" ON "Integration"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_eventHash_key" ON "AuditLog"("eventHash");

-- CreateIndex
CREATE INDEX "AuditLog_firmId_createdAt_idx" ON "AuditLog"("firmId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_firmId_sequence_key" ON "AuditLog"("firmId", "sequence");

-- CreateIndex
CREATE INDEX "ReportTemplate_category_idx" ON "ReportTemplate"("category");

-- CreateIndex
CREATE INDEX "ReportTemplate_firmId_idx" ON "ReportTemplate"("firmId");

-- CreateIndex
CREATE INDEX "DocumentRequestTemplate_category_idx" ON "DocumentRequestTemplate"("category");

-- CreateIndex
CREATE INDEX "DocumentRequestTemplate_firmId_idx" ON "DocumentRequestTemplate"("firmId");

-- CreateIndex
CREATE INDEX "TaxChecklistTemplate_category_idx" ON "TaxChecklistTemplate"("category");

-- CreateIndex
CREATE INDEX "TaxChecklistTemplate_returnType_idx" ON "TaxChecklistTemplate"("returnType");

-- CreateIndex
CREATE INDEX "TaxChecklistTemplate_firmId_idx" ON "TaxChecklistTemplate"("firmId");

-- CreateIndex
CREATE INDEX "FinancialHealthScore_clientId_idx" ON "FinancialHealthScore"("clientId");

-- CreateIndex
CREATE INDEX "FinancialHealthScore_computedAt_idx" ON "FinancialHealthScore"("computedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmSettings" ADD CONSTRAINT "FirmSettings_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessGrant" ADD CONSTRAINT "DocumentAccessGrant_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessGrant" ADD CONSTRAINT "DocumentAccessGrant_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessGrant" ADD CONSTRAINT "DocumentAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessGrant" ADD CONSTRAINT "DocumentAccessGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHoldDocument" ADD CONSTRAINT "LegalHoldDocument_legalHoldId_fkey" FOREIGN KEY ("legalHoldId") REFERENCES "LegalHold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHoldDocument" ADD CONSTRAINT "LegalHoldDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRedaction" ADD CONSTRAINT "DocumentRedaction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRedaction" ADD CONSTRAINT "DocumentRedaction_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRedaction" ADD CONSTRAINT "DocumentRedaction_targetVersionId_fkey" FOREIGN KEY ("targetVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRedaction" ADD CONSTRAINT "DocumentRedaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRedaction" ADD CONSTRAINT "DocumentRedaction_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentProcessingEvent" ADD CONSTRAINT "DocumentProcessingEvent_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentProcessingEvent" ADD CONSTRAINT "DocumentProcessingEvent_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxReturn" ADD CONSTRAINT "TaxReturn_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxOrganizer" ADD CONSTRAINT "TaxOrganizer_taxReturnId_fkey" FOREIGN KEY ("taxReturnId") REFERENCES "TaxReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxChecklistItem" ADD CONSTRAINT "TaxChecklistItem_taxReturnId_fkey" FOREIGN KEY ("taxReturnId") REFERENCES "TaxReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimatedPayment" ADD CONSTRAINT "EstimatedPayment_taxReturnId_fkey" FOREIGN KEY ("taxReturnId") REFERENCES "TaxReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTaxForm" ADD CONSTRAINT "EmployeeTaxForm_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequestTemplate" ADD CONSTRAINT "DocumentRequestTemplate_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxChecklistTemplate" ADD CONSTRAINT "TaxChecklistTemplate_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialHealthScore" ADD CONSTRAINT "FinancialHealthScore_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Append-only evidence must remain immutable even if application code is
-- bypassed. Corrections are represented by later audit/provider events.
CREATE FUNCTION reject_immutable_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% rows are immutable', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION reject_immutable_mutation();

CREATE TRIGGER document_processing_event_immutable
BEFORE UPDATE OR DELETE ON "DocumentProcessingEvent"
FOR EACH ROW EXECUTE FUNCTION reject_immutable_mutation();

CREATE TRIGGER legal_hold_document_immutable
BEFORE UPDATE OR DELETE ON "LegalHoldDocument"
FOR EACH ROW EXECUTE FUNCTION reject_immutable_mutation();

-- A version's bytes and provenance are immutable. A pending version may be
-- reviewed exactly once; only the explicit review fields may change.
CREATE FUNCTION protect_document_version() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'DocumentVersion rows are immutable';
  END IF;

  IF OLD."reviewStatus" <> 'PENDING'
     OR NEW."reviewStatus" = 'PENDING'
     OR NEW."reviewedAt" IS NULL
     OR NEW."reviewedById" IS NULL
     OR (to_jsonb(NEW) - ARRAY['reviewStatus', 'reviewedAt', 'reviewedById', 'jurisdiction', 'effectiveDate'])
        IS DISTINCT FROM
        (to_jsonb(OLD) - ARRAY['reviewStatus', 'reviewedAt', 'reviewedById', 'jurisdiction', 'effectiveDate']) THEN
    RAISE EXCEPTION 'DocumentVersion evidence and completed reviews are immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_version_immutable
BEFORE UPDATE OR DELETE ON "DocumentVersion"
FOR EACH ROW EXECUTE FUNCTION protect_document_version();

-- Imported authority content is immutable. An independent reviewer may make
-- the one pending-to-terminal transition and activate approved material.
CREATE FUNCTION protect_document_template() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'DocumentTemplate rows are immutable';
  END IF;

  IF OLD."reviewStatus" <> 'PENDING'
     OR NEW."reviewStatus" = 'PENDING'
     OR NEW."reviewedAt" IS NULL
     OR NEW."reviewedById" IS NULL
     OR (to_jsonb(NEW) - ARRAY['reviewStatus', 'reviewedAt', 'reviewedById', 'isActive'])
        IS DISTINCT FROM
        (to_jsonb(OLD) - ARRAY['reviewStatus', 'reviewedAt', 'reviewedById', 'isActive']) THEN
    RAISE EXCEPTION 'DocumentTemplate authority evidence and completed reviews are immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_template_immutable
BEFORE UPDATE OR DELETE ON "DocumentTemplate"
FOR EACH ROW EXECUTE FUNCTION protect_document_template();
