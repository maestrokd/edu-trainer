import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { bidsApi } from "../api/bidsApi";
import { BidDetailsSection, type BidDetailsField } from "../components/BidDetailsSection";
import { BidManagerShell } from "../components/BidManagerShell";
import { BID_MANAGER_ROUTES } from "../constants/routes";
import type { BidDto } from "../types/contracts";
import { extractApiErrorMessage } from "../utils/errors";
import {
  DASH_PLACEHOLDER,
  toAddressValue,
  toBooleanValue,
  toConfidenceValue,
  toDateTimeValue,
  toDateValue,
  toDisplayValue,
  toListValue,
  toNumberValue,
} from "../utils/presentation";

function toLinkValue(url: string | null | undefined): ReactNode {
  const displayValue = toDisplayValue(url);
  if (displayValue === DASH_PLACEHOLDER) {
    return DASH_PLACEHOLDER;
  }

  return (
    <a href={displayValue} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
      {displayValue}
    </a>
  );
}

function toContactsValue(bid: BidDto): string {
  if (bid.parsed.contacts.length === 0) {
    return DASH_PLACEHOLDER;
  }

  const items = bid.parsed.contacts
    .map((contact) => {
      const role = toDisplayValue(contact.role);
      const name = toDisplayValue(contact.name);
      const email = toDisplayValue(contact.email);
      const phone = toDisplayValue(contact.phone);
      return `Role: ${role}; Name: ${name}; Email: ${email}; Phone: ${phone}`;
    })
    .filter(Boolean);

  return items.length > 0 ? items.join(" | ") : DASH_PLACEHOLDER;
}

export function BidDetailsPage() {
  const { mailboxId, bidId } = useParams<{ mailboxId: string; bidId: string }>();
  const parsedBidId = Number(bidId);
  const isBidIdValid = Number.isInteger(parsedBidId) && parsedBidId > 0;

  const {
    data: bid,
    isLoading,
    error,
  } = useQuery<BidDto>({
    queryKey: ["bidManager", "bidDetails", mailboxId, parsedBidId],
    queryFn: () => bidsApi.getParsedBidDetails(mailboxId!, parsedBidId, false),
    enabled: Boolean(mailboxId) && isBidIdValid,
  });

  const backRoute = mailboxId ? BID_MANAGER_ROUTES.byMailbox(mailboxId) : BID_MANAGER_ROUTES.root;

  if (!mailboxId || !isBidIdValid) {
    return (
      <BidManagerShell
        title="Bid Details"
        actions={
          <Button variant="outline" asChild>
            <Link to={BID_MANAGER_ROUTES.root}>
              <ArrowLeft />
              Back to list
            </Link>
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>Invalid bid details route. Please choose a bid from the dashboard.</AlertDescription>
        </Alert>
      </BidManagerShell>
    );
  }

  if (isLoading) {
    return (
      <BidManagerShell
        title={`Bid #${bidId}`}
        actions={
          <Button variant="outline" asChild>
            <Link to={backRoute}>
              <ArrowLeft />
              Back to list
            </Link>
          </Button>
        }
      >
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading bid details...
          </CardContent>
        </Card>
      </BidManagerShell>
    );
  }

  if (error || !bid) {
    return (
      <BidManagerShell
        title={`Bid #${bidId}`}
        actions={
          <Button variant="outline" asChild>
            <Link to={backRoute}>
              <ArrowLeft />
              Back to list
            </Link>
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{extractApiErrorMessage(error, "Failed to load parsed bid details.")}</AlertDescription>
        </Alert>
      </BidManagerShell>
    );
  }

  const emailFields: BidDetailsField[] = [
    { label: "Subject", value: toDisplayValue(bid.email.subject) },
    { label: "From Name", value: toDisplayValue(bid.email.from.name) },
    { label: "From Email", value: toDisplayValue(bid.email.from.email) },
    { label: "To", value: toListValue(bid.email.to) },
    { label: "CC", value: toListValue(bid.email.cc) },
    { label: "Received At", value: toDateTimeValue(bid.email.received_at) },
    { label: "Message ID", value: toDisplayValue(bid.email.message_id) },
  ];

  const classificationFields: BidDetailsField[] = [
    { label: "Construction Bid Related", value: toBooleanValue(bid.classification.is_construction_bid_related) },
    { label: "Category", value: toDisplayValue(bid.classification.category) },
    { label: "Solicitation Type", value: toDisplayValue(bid.classification.solicitation_type) },
    { label: "Confidence", value: toConfidenceValue(bid.classification.confidence) },
    { label: "Reasons", value: toListValue(bid.classification.reasons) },
    { label: "Matched Signals", value: toListValue(bid.classification.matched_signals) },
    { label: "False Positive Flags", value: toListValue(bid.classification.false_positive_flags) },
  ];

  const projectFields: BidDetailsField[] = [
    { label: "Issuer Organization", value: toDisplayValue(bid.parsed.issuer.organization_name) },
    { label: "Issuer Role", value: toDisplayValue(bid.parsed.issuer.issuer_role) },
    { label: "Issuer Department", value: toDisplayValue(bid.parsed.issuer.department) },
    { label: "Issuer Address", value: toAddressValue(bid.parsed.issuer.address) },
    { label: "Project Name", value: toDisplayValue(bid.parsed.project.project_name) },
    { label: "Project Number", value: toDisplayValue(bid.parsed.project.project_number) },
    { label: "Solicitation Number", value: toDisplayValue(bid.parsed.project.solicitation_number) },
    { label: "Contract Number", value: toDisplayValue(bid.parsed.project.contract_number) },
    { label: "Owner Name", value: toDisplayValue(bid.parsed.project.owner_name) },
    { label: "Funding Source", value: toDisplayValue(bid.parsed.project.funding_source) },
    { label: "Description", value: toDisplayValue(bid.parsed.project.description) },
    { label: "Scope Summary", value: toDisplayValue(bid.parsed.project.scope_summary) },
    { label: "Trade Scope", value: toListValue(bid.parsed.project.trade_scope) },
    { label: "Site Name", value: toDisplayValue(bid.parsed.project.location.site_name) },
    { label: "Project Location", value: toAddressValue(bid.parsed.project.location) },
    { label: "Place of Performance", value: toDisplayValue(bid.parsed.project.place_of_performance) },
    { label: "Estimated Value", value: toDisplayValue(bid.parsed.project.estimated_value) },
    { label: "Magnitude", value: toDisplayValue(bid.parsed.project.magnitude) },
    { label: "Duration Days", value: toNumberValue(bid.parsed.project.duration_days) },
    { label: "Phase", value: toDisplayValue(bid.parsed.project.phase) },
  ];

  const datesFields: BidDetailsField[] = [
    { label: "Issue Date", value: toDateValue(bid.parsed.dates.issue_date) },
    { label: "Questions Deadline", value: toDateTimeValue(bid.parsed.dates.questions_deadline) },
    { label: "Prebid Registration Deadline", value: toDateTimeValue(bid.parsed.dates.prebid_registration_deadline) },
    { label: "Prebid DateTime", value: toDateTimeValue(bid.parsed.dates.prebid_datetime) },
    { label: "Site Visit DateTime", value: toDateTimeValue(bid.parsed.dates.site_visit_datetime) },
    { label: "Bid Due DateTime", value: toDateTimeValue(bid.parsed.dates.bid_due_datetime) },
    { label: "Bid Opening DateTime", value: toDateTimeValue(bid.parsed.dates.bid_opening_datetime) },
    { label: "Performance Start Date", value: toDateTimeValue(bid.parsed.dates.performance_start_date) },
    { label: "Substantial Completion Date", value: toDateTimeValue(bid.parsed.dates.substantial_completion_date) },
    { label: "Final Completion Date", value: toDateTimeValue(bid.parsed.dates.final_completion_date) },
    { label: "Bid Valid Until", value: toDateTimeValue(bid.parsed.dates.bid_valid_until) },
  ];

  const submissionFields: BidDetailsField[] = [
    { label: "Method", value: toDisplayValue(bid.parsed.submission.submission_method) },
    { label: "Submission Email", value: toDisplayValue(bid.parsed.submission.submission_email) },
    { label: "Portal Name", value: toDisplayValue(bid.parsed.submission.submission_portal_name) },
    { label: "Portal URL", value: toLinkValue(bid.parsed.submission.submission_portal_url) },
    { label: "Delivery Address", value: toDisplayValue(bid.parsed.submission.delivery_address) },
    { label: "Subject Line Required", value: toBooleanValue(bid.parsed.submission.subject_line_required) },
    { label: "Required Subject Line", value: toDisplayValue(bid.parsed.submission.required_subject_line_text) },
    { label: "Sealed Bid Required", value: toBooleanValue(bid.parsed.submission.sealed_bid_required) },
    { label: "Direct Attachment Required", value: toBooleanValue(bid.parsed.submission.direct_attachment_required) },
    { label: "Cloud Links Allowed", value: toBooleanValue(bid.parsed.submission.cloud_links_allowed) },
    { label: "Originals Required", value: toBooleanValue(bid.parsed.submission.originals_required) },
    { label: "Copies Required", value: toNumberValue(bid.parsed.submission.copies_required) },
    { label: "Late Bids Rejected", value: toBooleanValue(bid.parsed.submission.late_bids_rejected) },
    {
      label: "Special Submission Instructions",
      value: toListValue(bid.parsed.submission.special_submission_instructions),
    },
    { label: "Contacts", value: toContactsValue(bid) },
  ];

  const requirementsFields: BidDetailsField[] = [
    {
      label: "Contractor License Required",
      value: toBooleanValue(bid.parsed.requirements.contractor_license_required),
    },
    { label: "Required License Classes", value: toListValue(bid.parsed.requirements.required_license_classes) },
    { label: "DIR Registration Required", value: toBooleanValue(bid.parsed.requirements.dir_registration_required) },
    { label: "Prevailing Wage Required", value: toBooleanValue(bid.parsed.requirements.prevailing_wage_required) },
    { label: "Bid Bond Required", value: toBooleanValue(bid.parsed.requirements.bid_bond_required) },
    { label: "Bid Bond Percent", value: toNumberValue(bid.parsed.requirements.bid_bond_percent) },
    { label: "Bid Security Required", value: toBooleanValue(bid.parsed.requirements.bid_security_required) },
    { label: "Performance Bond Required", value: toBooleanValue(bid.parsed.requirements.performance_bond_required) },
    { label: "Payment Bond Required", value: toBooleanValue(bid.parsed.requirements.payment_bond_required) },
    { label: "Insurance Required", value: toBooleanValue(bid.parsed.requirements.insurance_required) },
    {
      label: "Subcontractor List Required",
      value: toBooleanValue(bid.parsed.requirements.subcontractor_list_required),
    },
    {
      label: "Non-Collusion Declaration Required",
      value: toBooleanValue(bid.parsed.requirements.non_collusion_declaration_required),
    },
    {
      label: "Debarment Certification Required",
      value: toBooleanValue(bid.parsed.requirements.debarment_certification_required),
    },
    { label: "Prequalification Required", value: toBooleanValue(bid.parsed.requirements.prequalification_required) },
    { label: "Mandatory Prebid", value: toBooleanValue(bid.parsed.requirements.mandatory_prebid) },
    { label: "Mandatory Site Visit", value: toBooleanValue(bid.parsed.requirements.mandatory_site_visit) },
    { label: "Special Qualifications", value: toListValue(bid.parsed.requirements.special_qualifications) },
  ];

  const actionabilityFields: BidDetailsField[] = [
    { label: "Recipient Action Required", value: toBooleanValue(bid.parsed.actionability.recipient_action_required) },
    { label: "Action Summary", value: toDisplayValue(bid.parsed.actionability.action_summary) },
    { label: "Recommended Next Step", value: toDisplayValue(bid.parsed.actionability.recommended_next_step) },
    { label: "Urgency", value: toDisplayValue(bid.parsed.actionability.urgency) },
  ];

  const warningsFields: BidDetailsField[] = [
    {
      label: "Warnings",
      value: toListValue(bid.warnings),
    },
  ];

  return (
    <BidManagerShell
      title={`Bid #${bid.id}`}
      subtitle={`Mailbox: ${mailboxId}`}
      actions={
        <Button variant="outline" asChild>
          <Link to={backRoute}>
            <ArrowLeft />
            Back to list
          </Link>
        </Button>
      }
      className="pb-6"
    >
      <BidDetailsSection title="Email" fields={emailFields} />
      <BidDetailsSection title="Classification" fields={classificationFields} />
      <BidDetailsSection title="Project" fields={projectFields} />
      <BidDetailsSection title="Dates" fields={datesFields} />
      <BidDetailsSection title="Submission" fields={submissionFields} />
      <BidDetailsSection title="Requirements" fields={requirementsFields} />
      <BidDetailsSection title="Actionability" fields={actionabilityFields} />
      <BidDetailsSection title="Warnings" fields={warningsFields} />
    </BidManagerShell>
  );
}
