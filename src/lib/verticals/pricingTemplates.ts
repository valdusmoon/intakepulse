import type { PricingType } from "@/lib/db/schema/pricingRules";

/**
 * Starter pricing rules auto-populated for a business when it's created, keyed
 * by vertical and matching that vertical's first intake question options
 * (see scripts/seed-verticals.ts). Figures are generalized 2025/2026 U.S.
 * national averages (Angi/HomeAdvisor/Forbes Home/Fixr/Bob Vila) — a starting
 * point the business is expected to review and adjust, not a verified quote.
 * All amounts in cents.
 */
export interface PricingTemplateRule {
  serviceCategory: string;
  pricingType: PricingType;
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  fixedAmount?: number | null;
  startingAmount?: number | null;
  approvedCustomerMessage: string;
}

export const PRICING_TEMPLATES: Record<string, PricingTemplateRule[]> = {
  restoration: [
    {
      serviceCategory: "water",
      pricingType: "preliminary_range",
      minimumAmount: 140000,
      maximumAmount: 640000,
      approvedCustomerMessage:
        "Water damage restoration typically runs $1,400 to $6,400 depending on the extent of the damage — our team will confirm the exact scope after inspecting.",
    },
    {
      serviceCategory: "fire",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "Fire and smoke damage varies too much to estimate over the phone — our team will assess the damage in person and provide a detailed quote.",
    },
    {
      serviceCategory: "mold",
      pricingType: "preliminary_range",
      minimumAmount: 112500,
      maximumAmount: 375000,
      approvedCustomerMessage:
        "Mold remediation typically runs $1,125 to $3,750 depending on the affected area — our team will confirm the exact scope after inspecting.",
    },
  ],

  hvac: [
    {
      serviceCategory: "ac_repair",
      pricingType: "preliminary_range",
      minimumAmount: 15000,
      maximumAmount: 150000,
      approvedCustomerMessage:
        "AC repairs typically run $150 to $1,500 depending on the issue, after a diagnostic visit — our technician will confirm the exact cost once they've taken a look.",
    },
    {
      serviceCategory: "heating_repair",
      pricingType: "preliminary_range",
      minimumAmount: 15000,
      maximumAmount: 60000,
      approvedCustomerMessage:
        "Heating repairs typically run $150 to $600 depending on the issue, after a diagnostic visit — our technician will confirm the exact cost once they've taken a look.",
    },
    {
      serviceCategory: "ac_replacement",
      pricingType: "starting",
      startingAmount: 500000,
      approvedCustomerMessage:
        "A new AC system typically starts around $5,000 depending on the size and efficiency you choose — our team will provide an exact quote after assessing your home.",
    },
    {
      serviceCategory: "furnace_replacement",
      pricingType: "starting",
      startingAmount: 280000,
      approvedCustomerMessage:
        "A new furnace typically starts around $2,800 depending on the size and efficiency you choose — our team will provide an exact quote after assessing your home.",
    },
    {
      serviceCategory: "ductwork",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "Ductwork costs vary too much to estimate over the phone — our technician will need to take a look and provide a detailed quote.",
    },
    {
      serviceCategory: "thermostat",
      pricingType: "preliminary_range",
      minimumAmount: 11400,
      maximumAmount: 50000,
      approvedCustomerMessage:
        "Thermostat installation typically runs $114 to $500 depending on the model — our technician will confirm the exact cost.",
    },
  ],

  plumbing: [
    {
      serviceCategory: "drain_clog",
      pricingType: "fixed",
      fixedAmount: 25000,
      approvedCustomerMessage:
        "Drain clearing is typically a flat $250 — our technician will let you know if anything unusual comes up once they're on site.",
    },
    {
      serviceCategory: "leak_repair",
      pricingType: "preliminary_range",
      minimumAmount: 15000,
      maximumAmount: 70000,
      approvedCustomerMessage:
        "Leak repairs typically run $150 to $700 depending on the location and severity — our technician will confirm the exact cost after inspecting.",
    },
    {
      serviceCategory: "water_heater",
      pricingType: "starting",
      startingAmount: 90000,
      approvedCustomerMessage:
        "A new water heater typically starts around $900 depending on the type and size — our team will provide an exact quote after assessing your setup.",
    },
    {
      serviceCategory: "fixture_repair",
      pricingType: "preliminary_range",
      minimumAmount: 10000,
      maximumAmount: 60000,
      approvedCustomerMessage:
        "Toilet and fixture repairs typically run $100 to $600 depending on the work needed — our technician will confirm the exact cost.",
    },
    {
      serviceCategory: "burst_pipe",
      pricingType: "preliminary_range",
      minimumAmount: 40000,
      maximumAmount: 200000,
      approvedCustomerMessage:
        "Burst pipe repairs typically run $400 to $2,000 depending on location and damage — our technician will confirm the exact cost once they arrive.",
    },
    {
      serviceCategory: "sewer_line",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "Sewer line issues vary too much to estimate over the phone — our technician will need to inspect the line and provide a detailed quote.",
    },
  ],

  electrical: [
    {
      serviceCategory: "diagnostic",
      pricingType: "fixed",
      fixedAmount: 17500,
      approvedCustomerMessage: "A diagnostic visit is typically a flat $175, which goes toward the repair if you move forward.",
    },
    {
      serviceCategory: "outlet_switch",
      pricingType: "fixed",
      fixedAmount: 20000,
      approvedCustomerMessage:
        "Outlet and switch work typically runs about $200 per device — our electrician will confirm the exact cost on site.",
    },
    {
      serviceCategory: "panel_upgrade",
      pricingType: "starting",
      startingAmount: 150000,
      approvedCustomerMessage:
        "A panel upgrade typically starts around $1,500 depending on the amperage and scope — our team will provide an exact quote after assessing your panel.",
    },
    {
      serviceCategory: "ev_charger",
      pricingType: "preliminary_range",
      minimumAmount: 120000,
      maximumAmount: 300000,
      approvedCustomerMessage:
        "EV charger installation typically runs $1,200 to $3,000 depending on your panel and the distance to your charging spot — our electrician will confirm the exact cost.",
    },
    {
      serviceCategory: "rewiring",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "Rewiring costs vary too much to estimate over the phone — our electrician will need to assess the home and provide a detailed quote.",
    },
    {
      serviceCategory: "emergency",
      pricingType: "preliminary_range",
      minimumAmount: 25000,
      maximumAmount: 70000,
      approvedCustomerMessage:
        "Emergency electrical calls typically run $250 to $700 plus an after-hours fee — our electrician will confirm the exact cost once they arrive.",
    },
  ],

  general_contracting: [
    {
      serviceCategory: "minor_repair",
      pricingType: "starting",
      startingAmount: 15000,
      approvedCustomerMessage:
        "Small repair jobs typically start around $150 depending on the work involved — our team will confirm the exact cost after taking a look.",
    },
    {
      serviceCategory: "remodel",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "Renovation and remodel costs vary too much to estimate over the phone — our team will schedule a walkthrough and provide a detailed quote.",
    },
    {
      serviceCategory: "addition",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "Additions and structural work vary too much to estimate over the phone — our team will schedule a walkthrough and provide a detailed quote.",
    },
    {
      serviceCategory: "general",
      pricingType: "inspection_required",
      approvedCustomerMessage:
        "This kind of project varies too much to estimate over the phone — our team will follow up to discuss the details and provide a quote.",
    },
  ],

  other: [
    {
      serviceCategory: "general",
      pricingType: "inspection_required",
      approvedCustomerMessage: "Our team will review the details and follow up with an estimate.",
    },
  ],
};
