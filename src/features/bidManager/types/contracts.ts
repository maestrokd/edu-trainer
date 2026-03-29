export interface MailboxDto {
  id: string;
  provider: string;
  email: string;
}

export interface GoogleMailboxConnectResponseDto {
  authorizationUrl: string;
}

export interface BidAddressDto {
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  full_address: string | null;
}

export interface BidContactDto {
  role: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface BidAttachmentDto {
  file_name: string | null;
  document_type: string | null;
  is_required: boolean | null;
}

export interface BidLinkDto {
  url: string | null;
  label: string | null;
  link_type: string | null;
}

export interface BidAddendumDto {
  addendum_number: string | null;
  addendum_date: string | null;
  acknowledgement_required: boolean | null;
}

export interface BidSourceEvidenceDto {
  field: string | null;
  snippet: string | null;
}

export interface BidDto {
  id: number;
  schema_version: string;
  email: {
    subject: string | null;
    from: {
      name: string | null;
      email: string | null;
    };
    to: string[];
    cc: string[];
    received_at: string | null;
    message_id: string | null;
  };
  classification: {
    is_construction_bid_related: boolean | null;
    category: string | null;
    solicitation_type: string | null;
    confidence: number | null;
    reasons: string[];
    matched_signals: string[];
    false_positive_flags: string[];
  };
  parsed: {
    issuer: {
      organization_name: string | null;
      issuer_role: string | null;
      department: string | null;
      address: BidAddressDto;
    };
    project: {
      project_name: string | null;
      project_number: string | null;
      solicitation_number: string | null;
      contract_number: string | null;
      owner_name: string | null;
      funding_source: string | null;
      description: string | null;
      scope_summary: string | null;
      trade_scope: string[];
      location: BidAddressDto & {
        site_name: string | null;
      };
      place_of_performance: string | null;
      estimated_value: string | null;
      magnitude: string | null;
      duration_days: number | null;
      phase: string | null;
    };
    dates: {
      issue_date: string | null;
      questions_deadline: string | null;
      prebid_registration_deadline: string | null;
      prebid_datetime: string | null;
      site_visit_datetime: string | null;
      bid_due_datetime: string | null;
      bid_opening_datetime: string | null;
      performance_start_date: string | null;
      substantial_completion_date: string | null;
      final_completion_date: string | null;
      bid_valid_until: string | null;
    };
    contacts: BidContactDto[];
    submission: {
      submission_method: string | null;
      submission_email: string | null;
      submission_portal_name: string | null;
      submission_portal_url: string | null;
      delivery_address: string | null;
      subject_line_required: boolean | null;
      required_subject_line_text: string | null;
      sealed_bid_required: boolean | null;
      direct_attachment_required: boolean | null;
      cloud_links_allowed: boolean | null;
      originals_required: boolean | null;
      copies_required: number | null;
      late_bids_rejected: boolean | null;
      special_submission_instructions: string[];
    };
    requirements: {
      contractor_license_required: boolean | null;
      required_license_classes: string[];
      dir_registration_required: boolean | null;
      prevailing_wage_required: boolean | null;
      bid_bond_required: boolean | null;
      bid_bond_percent: number | null;
      bid_security_required: boolean | null;
      performance_bond_required: boolean | null;
      payment_bond_required: boolean | null;
      insurance_required: boolean | null;
      subcontractor_list_required: boolean | null;
      non_collusion_declaration_required: boolean | null;
      debarment_certification_required: boolean | null;
      prequalification_required: boolean | null;
      mandatory_prebid: boolean | null;
      mandatory_site_visit: boolean | null;
      special_qualifications: string[];
    };
    commercial_terms: {
      award_basis: string | null;
      pricing_format: string | null;
      retainage_terms: string | null;
      liquidated_damages: string | null;
    };
    procurement_metadata: {
      naics_codes: string[];
      set_aside_type: string | null;
      public_or_private: string | null;
      plan_room_name: string | null;
      plan_room_url: string | null;
    };
    attachments: BidAttachmentDto[];
    links: BidLinkDto[];
    addenda: BidAddendumDto[];
    actionability: {
      recipient_action_required: boolean | null;
      action_summary: string | null;
      recommended_next_step: string | null;
      urgency: string | null;
    };
    source_evidence: BidSourceEvidenceDto[];
  };
  warnings: string[];
}
