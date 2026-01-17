/**
 * Medication Interaction Checker
 * 
 * This module provides functionality to check for drug-drug interactions
 * based on a comprehensive database of known interactions.
 */

export enum InteractionSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CONTRAINDICATED = 'contraindicated'
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
  mechanism?: string;
}

export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: DrugInteraction[];
  summary: {
    contraindicated: number;
    major: number;
    moderate: number;
    minor: number;
  };
}

// Common drug interaction database
// In production, this would be fetched from a medical API service
const INTERACTION_DATABASE: DrugInteraction[] = [
  // Blood thinners interactions
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: InteractionSeverity.MAJOR,
    description: 'Increased risk of bleeding when warfarin is combined with aspirin.',
    recommendation: 'Monitor closely for signs of bleeding. Consider alternative pain relief.',
    mechanism: 'Both drugs affect blood clotting through different mechanisms.'
  },
  {
    drug1: 'warfarin',
    drug2: 'ibuprofen',
    severity: InteractionSeverity.MAJOR,
    description: 'NSAIDs like ibuprofen can increase the anticoagulant effect of warfarin.',
    recommendation: 'Avoid combination if possible. Use acetaminophen for pain relief instead.',
    mechanism: 'Ibuprofen displaces warfarin from protein binding sites.'
  },
  
  // Antidepressant interactions
  {
    drug1: 'sertraline',
    drug2: 'tramadol',
    severity: InteractionSeverity.MAJOR,
    description: 'Risk of serotonin syndrome when SSRIs are combined with tramadol.',
    recommendation: 'Use alternative pain medication. Monitor for confusion, agitation, fever.',
    mechanism: 'Both drugs increase serotonin levels.'
  },
  {
    drug1: 'fluoxetine',
    drug2: 'tramadol',
    severity: InteractionSeverity.MAJOR,
    description: 'Risk of serotonin syndrome and seizures.',
    recommendation: 'Avoid combination. Consider alternative pain management.',
    mechanism: 'Additive serotonergic effects.'
  },
  
  // Blood pressure medications
  {
    drug1: 'lisinopril',
    drug2: 'potassium',
    severity: InteractionSeverity.MODERATE,
    description: 'ACE inhibitors can increase potassium levels.',
    recommendation: 'Monitor potassium levels regularly. Avoid potassium supplements.',
    mechanism: 'Lisinopril reduces potassium excretion.'
  },
  {
    drug1: 'metoprolol',
    drug2: 'diltiazem',
    severity: InteractionSeverity.MODERATE,
    description: 'Combined use may cause excessive lowering of heart rate and blood pressure.',
    recommendation: 'Monitor heart rate and blood pressure closely.',
    mechanism: 'Additive cardiac effects.'
  },
  
  // Diabetes medications
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: InteractionSeverity.MAJOR,
    description: 'Increased risk of lactic acidosis when metformin is combined with alcohol.',
    recommendation: 'Avoid or limit alcohol consumption.',
    mechanism: 'Alcohol increases lactate production.'
  },
  {
    drug1: 'glipizide',
    drug2: 'alcohol',
    severity: InteractionSeverity.MODERATE,
    description: 'Alcohol can cause unpredictable blood sugar changes.',
    recommendation: 'Limit alcohol intake and monitor blood glucose closely.',
    mechanism: 'Alcohol affects glucose metabolism.'
  },
  
  // Antibiotic interactions
  {
    drug1: 'ciprofloxacin',
    drug2: 'calcium',
    severity: InteractionSeverity.MODERATE,
    description: 'Calcium can reduce the absorption of ciprofloxacin.',
    recommendation: 'Take ciprofloxacin 2 hours before or 6 hours after calcium supplements.',
    mechanism: 'Calcium forms chelation complexes with ciprofloxacin.'
  },
  {
    drug1: 'doxycycline',
    drug2: 'iron',
    severity: InteractionSeverity.MODERATE,
    description: 'Iron supplements can reduce doxycycline absorption.',
    recommendation: 'Separate doses by at least 2 hours.',
    mechanism: 'Iron forms chelation complexes with tetracyclines.'
  },
  
  // Statin interactions
  {
    drug1: 'simvastatin',
    drug2: 'grapefruit',
    severity: InteractionSeverity.MAJOR,
    description: 'Grapefruit juice can increase simvastatin levels, increasing risk of muscle damage.',
    recommendation: 'Avoid grapefruit and grapefruit juice.',
    mechanism: 'Grapefruit inhibits CYP3A4 enzyme that metabolizes simvastatin.'
  },
  {
    drug1: 'atorvastatin',
    drug2: 'clarithromycin',
    severity: InteractionSeverity.MAJOR,
    description: 'Increased risk of muscle toxicity (rhabdomyolysis).',
    recommendation: 'Consider alternative antibiotic or statin dose reduction.',
    mechanism: 'Clarithromycin inhibits statin metabolism.'
  },
  
  // Common OTC interactions
  {
    drug1: 'acetaminophen',
    drug2: 'alcohol',
    severity: InteractionSeverity.MAJOR,
    description: 'Increased risk of liver damage.',
    recommendation: 'Avoid alcohol while taking acetaminophen.',
    mechanism: 'Both are hepatotoxic.'
  },
  {
    drug1: 'diphenhydramine',
    drug2: 'lorazepam',
    severity: InteractionSeverity.MODERATE,
    description: 'Increased sedation and drowsiness.',
    recommendation: 'Avoid driving. Use lowest effective doses.',
    mechanism: 'Additive CNS depression.'
  },
  
  // Heart medications
  {
    drug1: 'digoxin',
    drug2: 'furosemide',
    severity: InteractionSeverity.MODERATE,
    description: 'Furosemide can cause low potassium, increasing digoxin toxicity risk.',
    recommendation: 'Monitor potassium levels and digoxin levels regularly.',
    mechanism: 'Hypokalemia increases digoxin binding to cardiac tissue.'
  },
  {
    drug1: 'amiodarone',
    drug2: 'warfarin',
    severity: InteractionSeverity.MAJOR,
    description: 'Amiodarone significantly increases warfarin effect.',
    recommendation: 'Reduce warfarin dose by 30-50%. Monitor INR closely.',
    mechanism: 'Amiodarone inhibits warfarin metabolism.'
  }
];

/**
 * Normalize drug name for comparison
 */
function normalizeDrugName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Check if two drugs match (handles brand names and variations)
 */
function drugsMatch(drug1: string, drug2: string): boolean {
  const normalized1 = normalizeDrugName(drug1);
  const normalized2 = normalizeDrugName(drug2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other (for brand names)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  // Check common brand name mappings
  const brandMappings: Record<string, string[]> = {
    'acetaminophen': ['tylenol', 'paracetamol'],
    'ibuprofen': ['advil', 'motrin'],
    'sertraline': ['zoloft'],
    'fluoxetine': ['prozac'],
    'warfarin': ['coumadin'],
    'metformin': ['glucophage'],
    'lisinopril': ['prinivil', 'zestril'],
    'metoprolol': ['lopressor', 'toprolxl'],
    'simvastatin': ['zocor'],
    'atorvastatin': ['lipitor'],
    'ciprofloxacin': ['cipro'],
    'doxycycline': ['vibramycin'],
    'furosemide': ['lasix'],
    'lorazepam': ['ativan'],
    'diphenhydramine': ['benadryl']
  };
  
  for (const [generic, brands] of Object.entries(brandMappings)) {
    const allNames = [generic, ...brands].map(normalizeDrugName);
    if (allNames.includes(normalized1) && allNames.includes(normalized2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check for interactions between two specific drugs
 */
export function checkDrugPair(drug1: string, drug2: string): DrugInteraction | null {
  for (const interaction of INTERACTION_DATABASE) {
    if (
      (drugsMatch(drug1, interaction.drug1) && drugsMatch(drug2, interaction.drug2)) ||
      (drugsMatch(drug1, interaction.drug2) && drugsMatch(drug2, interaction.drug1))
    ) {
      return interaction;
    }
  }
  return null;
}

/**
 * Check for all interactions in a list of medications
 */
export function checkMedicationInteractions(medications: string[]): InteractionCheckResult {
  const interactions: DrugInteraction[] = [];
  const checked = new Set<string>();
  
  // Check all pairs of medications
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const pairKey = [medications[i], medications[j]].sort().join('|');
      
      if (!checked.has(pairKey)) {
        checked.add(pairKey);
        const interaction = checkDrugPair(medications[i], medications[j]);
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }
  }
  
  // Calculate summary
  const summary = {
    contraindicated: interactions.filter(i => i.severity === InteractionSeverity.CONTRAINDICATED).length,
    major: interactions.filter(i => i.severity === InteractionSeverity.MAJOR).length,
    moderate: interactions.filter(i => i.severity === InteractionSeverity.MODERATE).length,
    minor: interactions.filter(i => i.severity === InteractionSeverity.MINOR).length
  };
  
  // Sort interactions by severity
  interactions.sort((a, b) => {
    const severityOrder = {
      [InteractionSeverity.CONTRAINDICATED]: 0,
      [InteractionSeverity.MAJOR]: 1,
      [InteractionSeverity.MODERATE]: 2,
      [InteractionSeverity.MINOR]: 3
    };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return {
    hasInteractions: interactions.length > 0,
    interactions,
    summary
  };
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: InteractionSeverity): string {
  switch (severity) {
    case InteractionSeverity.CONTRAINDICATED:
      return 'red';
    case InteractionSeverity.MAJOR:
      return 'orange';
    case InteractionSeverity.MODERATE:
      return 'yellow';
    case InteractionSeverity.MINOR:
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Get severity display text
 */
export function getSeverityText(severity: InteractionSeverity): string {
  switch (severity) {
    case InteractionSeverity.CONTRAINDICATED:
      return 'Contraindicated - Do Not Use Together';
    case InteractionSeverity.MAJOR:
      return 'Major Interaction';
    case InteractionSeverity.MODERATE:
      return 'Moderate Interaction';
    case InteractionSeverity.MINOR:
      return 'Minor Interaction';
    default:
      return 'Unknown';
  }
}

/**
 * Format interaction summary for display
 */
export function formatInteractionSummary(summary: InteractionCheckResult['summary']): string {
  const parts: string[] = [];
  
  if (summary.contraindicated > 0) {
    parts.push(`${summary.contraindicated} contraindicated`);
  }
  if (summary.major > 0) {
    parts.push(`${summary.major} major`);
  }
  if (summary.moderate > 0) {
    parts.push(`${summary.moderate} moderate`);
  }
  if (summary.minor > 0) {
    parts.push(`${summary.minor} minor`);
  }
  
  if (parts.length === 0) {
    return 'No interactions found';
  }
  
  return `Found ${parts.join(', ')} interaction${parts.length > 1 || summary.contraindicated + summary.major + summary.moderate + summary.minor > 1 ? 's' : ''}`;
}