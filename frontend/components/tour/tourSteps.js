/**
 * Tour step definitions.
 *
 * Each step:
 *   route    — navigate here if not already on it
 *   target   — CSS selector for the element to spotlight (null = centre-screen card)
 *   title    — tooltip heading
 *   body     — tooltip explanation
 *   placement — 'bottom' | 'top' | 'left' | 'right' | 'center'
 */

export const CLIENT_STEPS = [
  {
    id: "welcome",
    route: "/dashboard",
    target: "[data-tour='account-position']",
    title: "Your account position",
    body: "This strip shows your committed escrow, active projects, incoming proposals, and hired contracts — all in one glance.",
    placement: "bottom",
  },
  {
    id: "post-project",
    route: "/dashboard",
    target: "[data-tour='post-project-cta']",
    title: "Post a project brief",
    body: "Click here to write a project brief — describe the work, set a budget, add milestones, and attach spec documents. Verified freelancers will start sending proposals.",
    placement: "bottom",
  },
  {
    id: "hiring-funnel",
    route: "/dashboard",
    target: "[data-tour='hiring-funnel']",
    title: "Your hiring funnel",
    body: "This tracks every stage of hiring — from posting a brief, to receiving proposals, to signing a contract. The active stage highlights in red.",
    placement: "top",
  },
  {
    id: "find-talent",
    route: "/client/talent",
    target: "[data-tour='talent-grid']",
    title: "Find talent proactively",
    body: "Don't wait for proposals — search and browse verified freelancers directly. Filter by discipline, then invite someone to your project with one click.",
    placement: "bottom",
  },
  {
    id: "contracts",
    route: "/contracts",
    target: "[data-tour='contracts-list']",
    title: "Your contracts register",
    body: "Every signed engagement lives here. Filter by status — active, pending signature, or completed. Click any contract to open its full workspace.",
    placement: "bottom",
  },
  {
    id: "contract-workspace",
    route: "/contracts",
    target: "[data-tour='contracts-list']",
    title: "Inside the contract workspace",
    body: "Each contract has a workspace where you sign digitally, deposit escrow funds (via eSewa or Stripe), approve milestones, and release payment when work is delivered.",
    placement: "bottom",
  },
  {
    id: "chat",
    route: "/chat",
    target: "[data-tour='chat-panel']",
    title: "Real-time messaging",
    body: "Message your hired freelancers directly here. Attach files, share documents, and keep all project communication in one auditable thread.",
    placement: "right",
  },
  {
    id: "time-tracking",
    route: "/time-tracking",
    target: "[data-tour='time-tracking-panel']",
    title: "Approve time entries",
    body: "For hourly contracts, freelancers log their hours here. You review and approve each entry before payment is calculated — full transparency.",
    placement: "bottom",
  },
  {
    id: "disputes",
    route: "/disputes",
    target: "[data-tour='disputes-panel']",
    title: "Dispute resolution",
    body: "If something goes wrong, file a dispute here. Our team reviews the contract timeline, chat logs, and submitted work to make a binding ruling.",
    placement: "bottom",
  },
  {
    id: "payment-summary",
    route: "/payment-summary",
    target: "[data-tour='payment-summary-panel']",
    title: "Payment statement",
    body: "Every transaction — escrow deposits, milestone releases, refunds — is recorded here. Export a full PDF statement at any time.",
    placement: "bottom",
  },
  {
    id: "done",
    route: "/profile",
    target: "[data-tour='walkthrough-trigger']",
    title: "You're all set.",
    body: "That covers everything. Whenever you want a reminder, click 'Take the walkthrough' here on your profile page to run through it again.",
    placement: "bottom",
  },
];

export const FREELANCER_STEPS = [
  {
    id: "welcome",
    route: "/freelancer",
    target: "[data-tour='account-position']",
    title: "Your account position",
    body: "Your earnings, active contracts, proposals under review, and reputation score — all at a glance. This updates live as work progresses.",
    placement: "bottom",
  },
  {
    id: "complete-profile",
    route: "/profile",
    target: "[data-tour='freelancer-discipline']",
    title: "Complete your profile first",
    body: "Add a professional title, bio, skills list, and hourly rate. Clients browse profiles before inviting freelancers — a complete profile gets far more invites.",
    placement: "bottom",
  },
  {
    id: "find-work",
    route: "/freelancer/jobs",
    target: "[data-tour='jobs-list']",
    title: "Browse open projects",
    body: "Filter by budget range and category to find the right fit. Each brief shows the full scope, deadline, and budget — read carefully before applying.",
    placement: "bottom",
  },
  {
    id: "submit-proposal",
    route: "/freelancer/jobs",
    target: "[data-tour='jobs-list']",
    title: "Submit a proposal",
    body: "Click any project to open its full brief. Write a cover letter, set your bid amount, and give a realistic timeline. Strong proposals address the client's specific brief.",
    placement: "bottom",
  },
  {
    id: "proposals",
    route: "/freelancer/proposals",
    target: "[data-tour='proposals-list']",
    title: "Track your proposals",
    body: "Every proposal you've submitted lives here with its current status — pending, reviewed, shortlisted, or accepted. Check back regularly.",
    placement: "bottom",
  },
  {
    id: "contracts",
    route: "/contracts",
    target: "[data-tour='contracts-list']",
    title: "Your contracts register",
    body: "Once a client accepts your proposal, a contract is created here. Sign it digitally to activate the workspace and begin the engagement.",
    placement: "bottom",
  },
  {
    id: "time-tracking",
    route: "/time-tracking",
    target: "[data-tour='time-tracking-panel']",
    title: "Log your time",
    body: "Use the live stopwatch or add a manual entry. Submit your logged hours to the client for approval — approved hours form the basis of your invoice.",
    placement: "bottom",
  },
  {
    id: "chat",
    route: "/chat",
    target: "[data-tour='chat-panel']",
    title: "Communicate with clients",
    body: "Keep all project communication inside FreelanceHub. Share files, clarify scope, and maintain a written record — this thread is also reviewed in any dispute.",
    placement: "right",
  },
  {
    id: "disputes",
    route: "/disputes",
    target: "[data-tour='disputes-panel']",
    title: "File a dispute if needed",
    body: "If a client doesn't release payment after delivery, file a dispute here. Attach your work evidence and our team will review the case.",
    placement: "bottom",
  },
  {
    id: "payment-summary",
    route: "/payment-summary",
    target: "[data-tour='payment-summary-panel']",
    title: "Your earnings statement",
    body: "Every released payment appears here. Export a PDF statement for your records or tax filing.",
    placement: "bottom",
  },
  {
    id: "done",
    route: "/profile",
    target: "[data-tour='walkthrough-trigger']",
    title: "You're ready.",
    body: "That's the full platform. Click 'Take the walkthrough' here any time you want to revisit any of this.",
    placement: "bottom",
  },
];
