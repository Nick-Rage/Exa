import type { ContractorProfile } from "./types";

export const FEDERAL_IDENTITY_PROFILE: ContractorProfile = {
  id: "meridian-federal-identity",
  name: "Meridian Federal",
  description:
    "Federal identity, credential, and access management integrator delivering cloud IAM, phishing-resistant MFA, PAM, identity governance, and Zero Trust modernization.",
  capabilities: [
    "Identity, Credential, and Access Management (ICAM)",
    "Phishing-resistant MFA and FIDO2",
    "Identity governance and lifecycle automation",
    "Privileged access management",
    "Zero Trust architecture and implementation",
    "FedRAMP-authorized cloud integration",
    "NIST 800-53 and FICAM alignment",
  ],
  targetAgencies: [
    "Civilian federal agencies",
    "Department of Defense components",
    "Federal health agencies",
  ],
  contractVehicles: ["GSA MAS", "8(a) STARS III teaming", "CIO-SP4 teaming"],
  certifications: [
    "CMMC Level 2 ready",
    "ISO 27001",
    "SOC 2 Type II",
    "Secret facility clearance",
  ],
  socioeconomicStatus: "Unrestricted small-business teaming partner",
  hardDisqualifiers: [
    "Hardware-only physical access or badge-reader procurement",
    "Vehicle or set-aside the team cannot access",
    "Mandatory clearance above current facility clearance",
    "Identity is incidental to a substantially unrelated prime scope",
    "Response deadline has passed",
  ],
};

export const CAPTURE_GATES = [
  {
    id: "scope",
    label: "Identity is core scope",
    hardGate: true,
    description:
      "ICAM, IAM, MFA, PAM, identity governance, credentials, or Zero Trust identity work is a primary deliverable.",
  },
  {
    id: "access",
    label: "Contract access",
    hardGate: true,
    description:
      "The contractor can access the stated vehicle, set-aside, and competition type directly or through a named teaming path.",
  },
  {
    id: "compliance",
    label: "Compliance attainable",
    hardGate: true,
    description:
      "Required clearances, FedRAMP impact level, CMMC level, and certifications are held or realistically attainable.",
  },
  {
    id: "window",
    label: "Opportunity actionable",
    hardGate: true,
    description:
      "The notice is active and leaves enough time for the capture team to make a deliberate decision.",
  },
  {
    id: "strategic",
    label: "Strategic alignment",
    hardGate: false,
    description:
      "The work aligns with target agencies, reusable capabilities, and a credible federal growth path.",
  },
] as const;

export const AUTHORITATIVE_DOMAINS = [
  "sam.gov",
  "usaspending.gov",
  "fpds.gov",
  "gsa.gov",
  "cisa.gov",
  "nist.gov",
  "omb.gov",
  "govinfo.gov",
  "congress.gov",
] as const;
