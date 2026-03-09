// Mock data for the MCQ Extraction Platform — strictly frontend only

export const mockUser = {
  id: "usr_01",
  name: "Dr. Sarah Chen",
  email: "sarah.chen@university.edu",
  avatar: "",
  role: "admin" as const,
  initials: "SC",
};

export const mockWorkspace = {
  id: "ws_01",
  name: "Medical Sciences",
  plan: "Enterprise" as const,
  membersCount: 12,
  documentsCount: 2847,
  logo: "",
};

export const mockStats = {
  documentsProcessed: 2847,
  mcqsExtracted: 48291,
  approvalRate: 94.7,
  activeJobs: 3,
  documentsProcessedTrend: 12.4,
  mcqsExtractedTrend: 8.7,
  approvalRateTrend: 2.1,
  activeJobsTrend: -1,
};

export const mockSparklineData = {
  documentsProcessed: [1820, 2010, 2180, 2350, 2480, 2640, 2847],
  mcqsExtracted: [31200, 34500, 37800, 40100, 43200, 45800, 48291],
  approvalRate: [91.2, 92.0, 92.8, 93.1, 93.9, 94.3, 94.7],
  activeJobs: [5, 4, 6, 3, 4, 2, 3],
};

export const mockProviderHealth = [
  { name: "GPT-4o", status: "healthy" as const, accuracy: 96.2, latency: "3.2s" },
  { name: "Claude 3.5", status: "healthy" as const, accuracy: 94.8, latency: "2.8s" },
  { name: "Gemini Pro", status: "degraded" as const, accuracy: 91.2, latency: "4.1s" },
  { name: "Llama 3.2", status: "offline" as const, accuracy: 88.5, latency: "5.5s" },
];

export const mockRecentActivity = [
  { id: "1", action: "Document uploaded", target: "Pharmacology_Ch12.pdf", user: "Dr. Chen", time: "2 min ago", type: "upload" as const },
  { id: "2", action: "MCQs approved", target: "Anatomy_Final_2025.pdf", user: "Prof. Malik", time: "15 min ago", type: "approve" as const },
  { id: "3", action: "Extraction completed", target: "Biochemistry_Module3.pdf", user: "System", time: "32 min ago", type: "extract" as const },
  { id: "4", action: "Review flagged", target: "Pathology_Q42", user: "Dr. Kim", time: "1 hr ago", type: "flag" as const },
  { id: "5", action: "Export generated", target: "QTI_Export_Batch_47", user: "Dr. Chen", time: "2 hrs ago", type: "export" as const },
  { id: "6", action: "Provider switched", target: "GPT-4o → Claude 3.5", user: "Admin", time: "3 hrs ago", type: "settings" as const },
];

export const mockActiveJobs = [
  { id: "job_001", document: "Pharmacology_Ch12.pdf", status: "processing" as const, progress: 67, provider: "GPT-4o", stage: "Extracting MCQs", startedAt: "2 min ago" },
  { id: "job_002", document: "Neuroscience_Unit5.pdf", status: "processing" as const, progress: 34, provider: "Claude 3.5", stage: "OCR Processing", startedAt: "8 min ago" },
  { id: "job_003", document: "Microbiology_Lab.pdf", status: "queued" as const, progress: 0, provider: "GPT-4o", stage: "Queued", startedAt: "12 min ago" },
];

export const mockProjects = [
  { id: "prj_01", name: "Medical Board Prep 2025", description: "Comprehensive MCQ bank for medical board examinations", documentsCount: 342, mcqCount: 8420, status: "active" as const, progress: 78, lastActivity: "2 hrs ago", members: 5 },
  { id: "prj_02", name: "Nursing NCLEX Review", description: "NCLEX preparation question extraction", documentsCount: 156, mcqCount: 3200, status: "active" as const, progress: 92, lastActivity: "30 min ago", members: 3 },
  { id: "prj_03", name: "Pharmacy Licensure", description: "NAPLEX exam preparation materials", documentsCount: 89, mcqCount: 1840, status: "active" as const, progress: 45, lastActivity: "1 day ago", members: 4 },
  { id: "prj_04", name: "Dental Board Exam", description: "NBDE Part I & II question bank", documentsCount: 67, mcqCount: 980, status: "paused" as const, progress: 30, lastActivity: "5 days ago", members: 2 },
];

export const mockDocuments = [
  { id: "doc_01", filename: "Pharmacology_Ch12.pdf", status: "processing" as const, pages: 48, uploadDate: "2025-03-08", mcqCount: 0, confidence: 0, size: "4.2 MB", project: "Medical Board Prep 2025" },
  { id: "doc_02", filename: "Anatomy_Final_2025.pdf", status: "completed" as const, pages: 120, uploadDate: "2025-03-07", mcqCount: 245, confidence: 96.2, size: "12.8 MB", project: "Medical Board Prep 2025" },
  { id: "doc_03", filename: "Biochemistry_Module3.pdf", status: "completed" as const, pages: 65, uploadDate: "2025-03-07", mcqCount: 132, confidence: 89.5, size: "6.1 MB", project: "Nursing NCLEX Review" },
  { id: "doc_04", filename: "Pathology_Cases.pdf", status: "review" as const, pages: 200, uploadDate: "2025-03-06", mcqCount: 410, confidence: 72.3, size: "18.4 MB", project: "Medical Board Prep 2025" },
  { id: "doc_05", filename: "Neuroscience_Unit5.pdf", status: "processing" as const, pages: 35, uploadDate: "2025-03-08", mcqCount: 0, confidence: 0, size: "3.7 MB", project: "Nursing NCLEX Review" },
  { id: "doc_06", filename: "Microbiology_Lab.pdf", status: "queued" as const, pages: 28, uploadDate: "2025-03-08", mcqCount: 0, confidence: 0, size: "2.9 MB", project: "Pharmacy Licensure" },
];

export const mockJobs = [
  { id: "job_101", documentName: "Pharmacology_Ch12.pdf", status: "processing" as const, provider: "GPT-4o", duration: "2m 15s", progress: 67, startedAt: "2025-03-08 14:32", stages: ["Upload", "Parse", "OCR", "Extract", "Validate"] as const, currentStage: 3 },
  { id: "job_102", documentName: "Anatomy_Final_2025.pdf", status: "completed" as const, provider: "Claude 3.5", duration: "8m 42s", progress: 100, startedAt: "2025-03-07 09:15", stages: ["Upload", "Parse", "OCR", "Extract", "Validate"] as const, currentStage: 5 },
  { id: "job_103", documentName: "Neuroscience_Unit5.pdf", status: "processing" as const, provider: "Claude 3.5", duration: "1m 05s", progress: 34, startedAt: "2025-03-08 14:25", stages: ["Upload", "Parse", "OCR", "Extract", "Validate"] as const, currentStage: 2 },
  { id: "job_104", documentName: "Pathology_Cases.pdf", status: "failed" as const, provider: "GPT-4o", duration: "12m 30s", progress: 80, startedAt: "2025-03-06 16:00", stages: ["Upload", "Parse", "OCR", "Extract", "Validate"] as const, currentStage: 4 },
  { id: "job_105", documentName: "Microbiology_Lab.pdf", status: "queued" as const, provider: "GPT-4o", duration: "—", progress: 0, startedAt: "2025-03-08 14:38", stages: ["Upload", "Parse", "OCR", "Extract", "Validate"] as const, currentStage: 0 },
];

export const mockProviders = [
  { id: "prov_01", name: "GPT-4o", provider: "OpenAI", status: "healthy" as const, model: "gpt-4o-2025-02", accuracy: 96.2, avgLatency: "3.2s", costPerRecord: 0.042, totalCost: 1247.80, errorRate: 0.3 },
  { id: "prov_02", name: "Claude 3.5 Sonnet", provider: "Anthropic", status: "healthy" as const, model: "claude-3.5-sonnet", accuracy: 94.8, avgLatency: "2.8s", costPerRecord: 0.038, totalCost: 987.50, errorRate: 0.5 },
  { id: "prov_03", name: "Gemini Pro", provider: "Google", status: "degraded" as const, model: "gemini-1.5-pro", accuracy: 91.2, avgLatency: "4.1s", costPerRecord: 0.035, totalCost: 456.20, errorRate: 1.2 },
  { id: "prov_04", name: "Llama 3.2", provider: "Meta (Self-hosted)", status: "offline" as const, model: "llama-3.2-70b", accuracy: 88.5, avgLatency: "5.5s", costPerRecord: 0.012, totalCost: 124.30, errorRate: 2.8 },
];

export const mockReviewQueue = [
  { id: "rev_01", question: "Which enzyme catalyzes the rate-limiting step of glycolysis?", confidence: 97.2, status: "pending" as const, document: "Biochemistry_Module3.pdf", reviewer: null, flags: 0 },
  { id: "rev_02", question: "The sinoatrial node is located in which chamber of the heart?", confidence: 94.8, status: "pending" as const, document: "Anatomy_Final_2025.pdf", reviewer: null, flags: 0 },
  { id: "rev_03", question: "What is the mechanism of action of metformin?", confidence: 68.3, status: "flagged" as const, document: "Pharmacology_Ch12.pdf", reviewer: "Dr. Kim", flags: 2 },
  { id: "rev_04", question: "Which cranial nerve innervates the trapezius muscle?", confidence: 45.1, status: "flagged" as const, document: "Anatomy_Final_2025.pdf", reviewer: "Dr. Chen", flags: 1 },
  { id: "rev_05", question: "Identify the correct sequence of cell division stages", confidence: 91.0, status: "approved" as const, document: "Pathology_Cases.pdf", reviewer: "Prof. Malik", flags: 0 },
];

export const mockReviewDetails: Record<string, {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  confidence: number;
  confidenceBreakdown: number[];
  status: ReviewStatus;
  document: string;
  page: number;
  sourceExcerpt: string;
  pageContent: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  reviewer: string | null;
}> = {
  rev_01: {
    id: "rev_01",
    question: "Which enzyme catalyzes the rate-limiting step of glycolysis?",
    options: ["Hexokinase", "Phosphofructokinase-1", "Pyruvate kinase", "Aldolase"],
    correctIndex: 1,
    explanation: "Phosphofructokinase-1 (PFK-1) catalyzes the conversion of fructose-6-phosphate to fructose-1,6-bisphosphate. This is the committed and rate-limiting step of glycolysis because it is irreversible and highly regulated by allosteric effectors including ATP, citrate, and AMP.",
    confidence: 97.2,
    confidenceBreakdown: [0.12, 0.82, 0.04, 0.02],
    status: "pending",
    document: "Biochemistry_Module3.pdf",
    page: 24,
    sourceExcerpt: "The rate-limiting step of glycolysis is catalyzed by phosphofructokinase-1 (PFK-1), which converts fructose-6-phosphate to fructose-1,6-bisphosphate.",
    pageContent: "Chapter 12: Glycolysis and Gluconeogenesis\n\nGlycolysis is a central metabolic pathway that converts glucose into pyruvate, generating ATP and NADH in the process. The pathway consists of 10 enzymatic reactions that occur in the cytoplasm of cells.\n\nKey Regulatory Steps:\n\n1. Hexokinase (Step 1): Phosphorylates glucose to glucose-6-phosphate. Inhibited by its product G6P.\n\n2. Phosphofructokinase-1 (Step 3): The rate-limiting step of glycolysis is catalyzed by phosphofructokinase-1 (PFK-1), which converts fructose-6-phosphate to fructose-1,6-bisphosphate. PFK-1 is allosterically activated by AMP, ADP, and fructose-2,6-bisphosphate, and inhibited by ATP and citrate. This makes PFK-1 the most important regulatory enzyme in glycolysis.\n\n3. Pyruvate Kinase (Step 10): Converts phosphoenolpyruvate to pyruvate, generating ATP. Regulated by fructose-1,6-bisphosphate (feedforward activation) and ATP/alanine (inhibition).\n\nThe net energy yield of glycolysis is 2 ATP and 2 NADH per molecule of glucose. Under aerobic conditions, pyruvate enters the mitochondria for further oxidation via the TCA cycle.",
    difficulty: "medium",
    tags: ["biochemistry", "glycolysis", "enzymes", "metabolism"],
    reviewer: null,
  },
  rev_02: {
    id: "rev_02",
    question: "The sinoatrial node is located in which chamber of the heart?",
    options: ["Left atrium", "Right atrium", "Left ventricle", "Right ventricle"],
    correctIndex: 1,
    explanation: "The sinoatrial (SA) node is located in the posterior wall of the right atrium, near the opening of the superior vena cava. It serves as the natural pacemaker of the heart, initiating the electrical impulse that coordinates cardiac contraction.",
    confidence: 94.8,
    confidenceBreakdown: [0.03, 0.91, 0.04, 0.02],
    status: "pending",
    document: "Anatomy_Final_2025.pdf",
    page: 87,
    sourceExcerpt: "The SA node is situated in the right atrium, near the junction with the superior vena cava, and functions as the primary pacemaker of the heart.",
    pageContent: "Chapter 8: Cardiac Electrophysiology\n\nThe Conduction System of the Heart\n\nThe heart possesses an intrinsic conduction system that generates and distributes electrical impulses to coordinate cardiac contraction.\n\nSinoatrial (SA) Node:\nThe SA node is situated in the right atrium, near the junction with the superior vena cava, and functions as the primary pacemaker of the heart. It spontaneously generates action potentials at a rate of 60-100 beats per minute. The SA node contains specialized pacemaker cells that exhibit automaticity.\n\nAtrioventricular (AV) Node:\nLocated in the interatrial septum near the coronary sinus, the AV node receives impulses from the SA node and introduces a brief delay (0.1 seconds) before transmitting them to the ventricles via the Bundle of His.",
    difficulty: "easy",
    tags: ["anatomy", "cardiology", "conduction-system"],
    reviewer: null,
  },
  rev_03: {
    id: "rev_03",
    question: "What is the mechanism of action of metformin?",
    options: ["Increases insulin secretion from beta cells", "Activates AMP-activated protein kinase (AMPK)", "Inhibits DPP-4 enzyme", "Blocks alpha-glucosidase in the intestine"],
    correctIndex: 1,
    explanation: "Metformin primarily works by activating AMP-activated protein kinase (AMPK), which decreases hepatic glucose production, increases insulin sensitivity in peripheral tissues, and enhances glucose uptake in skeletal muscle.",
    confidence: 68.3,
    confidenceBreakdown: [0.22, 0.48, 0.18, 0.12],
    status: "flagged",
    document: "Pharmacology_Ch12.pdf",
    page: 156,
    sourceExcerpt: "Metformin activates AMPK, leading to reduced hepatic gluconeogenesis and improved peripheral insulin sensitivity.",
    pageContent: "Chapter 12: Antidiabetic Agents\n\nBiguanides — Metformin\n\nMetformin is the first-line pharmacotherapy for type 2 diabetes mellitus. Its primary mechanism involves activation of AMP-activated protein kinase (AMPK).\n\nMechanism of Action:\nMetformin activates AMPK, leading to reduced hepatic gluconeogenesis and improved peripheral insulin sensitivity. It also decreases intestinal absorption of glucose and increases glucose uptake in skeletal muscle.\n\nAdverse Effects:\n- Gastrointestinal disturbances (most common)\n- Lactic acidosis (rare but serious)\n- Vitamin B12 deficiency with long-term use\n\nContraindications:\n- Severe renal impairment (eGFR < 30 mL/min)\n- Conditions predisposing to lactic acidosis",
    difficulty: "hard",
    tags: ["pharmacology", "diabetes", "metformin"],
    reviewer: "Dr. Kim",
  },
  rev_04: {
    id: "rev_04",
    question: "Which cranial nerve innervates the trapezius muscle?",
    options: ["Vagus nerve (CN X)", "Accessory nerve (CN XI)", "Hypoglossal nerve (CN XII)", "Glossopharyngeal nerve (CN IX)"],
    correctIndex: 1,
    explanation: "The spinal accessory nerve (CN XI) provides motor innervation to the trapezius and sternocleidomastoid muscles. Damage to CN XI results in weakness of shoulder elevation and head turning.",
    confidence: 45.1,
    confidenceBreakdown: [0.28, 0.35, 0.22, 0.15],
    status: "flagged",
    document: "Anatomy_Final_2025.pdf",
    page: 42,
    sourceExcerpt: "The accessory nerve (CN XI) innervates the trapezius and sternocleidomastoid muscles.",
    pageContent: "Chapter 5: Cranial Nerves\n\nCranial Nerve XI — Spinal Accessory Nerve\n\nThe accessory nerve (CN XI) innervates the trapezius and sternocleidomastoid muscles. It has a unique course, originating from the spinal cord (C1-C5) rather than the brainstem.\n\nClinical Testing:\n- Trapezius: Ask the patient to shrug shoulders against resistance\n- SCM: Ask the patient to turn the head against resistance\n\nLesions of CN XI result in drooping of the shoulder, weakness of head turning, and winging of the scapula.",
    difficulty: "medium",
    tags: ["anatomy", "cranial-nerves", "neurology"],
    reviewer: "Dr. Chen",
  },
  rev_05: {
    id: "rev_05",
    question: "Identify the correct sequence of cell division stages",
    options: ["Prophase → Metaphase → Anaphase → Telophase", "Metaphase → Prophase → Telophase → Anaphase", "Anaphase → Prophase → Metaphase → Telophase", "Prophase → Anaphase → Metaphase → Telophase"],
    correctIndex: 0,
    explanation: "Mitosis proceeds through four sequential phases: Prophase (chromatin condenses), Metaphase (chromosomes align at the metaphase plate), Anaphase (sister chromatids separate), and Telophase (nuclear envelope reforms).",
    confidence: 91.0,
    confidenceBreakdown: [0.88, 0.05, 0.04, 0.03],
    status: "approved",
    document: "Pathology_Cases.pdf",
    page: 15,
    sourceExcerpt: "The stages of mitosis occur in a fixed sequence: prophase, metaphase, anaphase, and telophase (PMAT).",
    pageContent: "Chapter 2: Cell Biology and Division\n\nMitosis — Stages of Cell Division\n\nMitosis is the process by which a single cell divides to produce two genetically identical daughter cells. The stages of mitosis occur in a fixed sequence: prophase, metaphase, anaphase, and telophase (PMAT).\n\nProphase: Chromatin condenses into visible chromosomes. The mitotic spindle begins to form.\n\nMetaphase: Chromosomes align at the metaphase plate (cell equator). Spindle fibers attach to kinetochores.\n\nAnaphase: Sister chromatids are pulled apart toward opposite poles of the cell.\n\nTelophase: Nuclear envelopes reform around each set of chromosomes. Chromatin decondenses.\n\nCytokinesis follows telophase and completes cell division by splitting the cytoplasm.",
    difficulty: "easy",
    tags: ["cell-biology", "mitosis", "pathology"],
    reviewer: "Prof. Malik",
  },
};

export const mockReviewIds = ["rev_01", "rev_02", "rev_03", "rev_04", "rev_05"];

export type ActivityType = "upload" | "approve" | "extract" | "flag" | "export" | "settings";
export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type DocumentStatus = "queued" | "processing" | "completed" | "review" | "failed";
export type ProviderStatus = "healthy" | "degraded" | "offline";
export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";
export type ProjectStatus = "active" | "paused" | "archived";

// Analytics mock data
export const mockAnalyticsTimeSeries = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 2, 8);
  date.setDate(date.getDate() - (29 - i));
  const base = 1200 + i * 40;
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    mcqCount: base + Math.floor(Math.random() * 300 - 100),
    cost: +(60 + i * 2.5 + Math.random() * 20).toFixed(2),
    confidence: +(88 + Math.random() * 8).toFixed(1),
  };
});

export const mockConfidenceDistribution = [
  { range: "0–50%", count: 42, fill: "hsl(var(--destructive))" },
  { range: "50–75%", count: 186, fill: "hsl(var(--warning))" },
  { range: "75–90%", count: 1240, fill: "hsl(var(--info))" },
  { range: "90–100%", count: 3820, fill: "hsl(var(--success))" },
];

export const mockProviderComparison = [
  { provider: "GPT-4o", accuracy: 96.2, speed: 82, costEfficiency: 68 },
  { provider: "Claude 3.5", accuracy: 94.8, speed: 88, costEfficiency: 74 },
  { provider: "Gemini Pro", accuracy: 91.2, speed: 71, costEfficiency: 82 },
  { provider: "Llama 3.2", accuracy: 88.5, speed: 62, costEfficiency: 95 },
];

// Processing time trend (30 days)
export const mockProcessingTimeTrend = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 2, 8);
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    avgDuration: +(4.5 - i * 0.05 + Math.random() * 1.5).toFixed(1),
    p95Duration: +(8.2 - i * 0.04 + Math.random() * 2).toFixed(1),
  };
});

// Cost breakdown by provider per week
export const mockCostBreakdown = Array.from({ length: 8 }, (_, i) => {
  const date = new Date(2025, 1, 15);
  date.setDate(date.getDate() + i * 7);
  return {
    week: `W${i + 1}`,
    "GPT-4o": +(120 + Math.random() * 60).toFixed(0),
    "Claude 3.5": +(90 + Math.random() * 40).toFixed(0),
    "Gemini Pro": +(40 + Math.random() * 25).toFixed(0),
    "Llama 3.2": +(10 + Math.random() * 15).toFixed(0),
  };
});

// Users mock data (extracted from UsersPage for global search)
export const mockUsers = [
  { id: "u1", name: "Dr. Sarah Chen", email: "sarah.chen@university.edu", role: "Admin", status: "Active", lastActive: "2 min ago" },
  { id: "u2", name: "Prof. Amir Malik", email: "a.malik@university.edu", role: "Reviewer", status: "Active", lastActive: "15 min ago" },
  { id: "u3", name: "Dr. James Kim", email: "j.kim@university.edu", role: "Reviewer", status: "Active", lastActive: "1 hr ago" },
  { id: "u4", name: "Lisa Thompson", email: "l.thompson@university.edu", role: "Viewer", status: "Invited", lastActive: "—" },
  { id: "u5", name: "Dr. Maria Garcia", email: "m.garcia@university.edu", role: "Editor", status: "Active", lastActive: "3 hrs ago" },
];
