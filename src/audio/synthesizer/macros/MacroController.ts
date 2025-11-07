/**
 * MacroController - Macro knob system
 * Provides 8-16 macro knobs that can control any parameter
 * @module audio/synthesizer/macros/MacroController
 */

/**
 * Macro assignment
 */
export interface MacroAssignment {
  parameterPath: string; // Path to parameter (e.g., "oscillators.0.gain")
  minValue: number; // Minimum value when macro is at 0
  maxValue: number; // Maximum value when macro is at 1
  curve: 'linear' | 'exponential' | 'logarithmic'; // Response curve
}

/**
 * Macro configuration
 */
export interface MacroConfig {
  value: number; // 0 to 1
  assignments: MacroAssignment[];
  name: string;
}

/**
 * Macro controller
 */
export class MacroController {
  private macros: MacroConfig[];
  private numMacros: number;

  /**
   * Create a new macro controller
   * @param numMacros - Number of macro knobs (8-16)
   */
  constructor(numMacros: number = 8) {
    this.numMacros = Math.max(8, Math.min(16, numMacros));
    this.macros = Array.from({ length: this.numMacros }, (_, i) => ({
      value: 0,
      assignments: [],
      name: `Macro ${i + 1}`,
    }));
  }

  /**
   * Set macro value
   */
  setMacroValue(index: number, value: number): void {
    if (index >= 0 && index < this.numMacros) {
      const macro = this.macros[index];
      if (macro) {
        macro.value = Math.max(0, Math.min(1, value));
      }
    }
  }

  /**
   * Get macro value
   */
  getMacroValue(index: number): number {
    if (index >= 0 && index < this.numMacros) {
      return this.macros[index]?.value ?? 0;
    }
    return 0;
  }

  /**
   * Add assignment to macro
   */
  addAssignment(index: number, assignment: MacroAssignment): void {
    if (index >= 0 && index < this.numMacros) {
      this.macros[index]?.assignments.push(assignment);
    }
  }

  /**
   * Remove assignment from macro
   */
  removeAssignment(macroIndex: number, assignmentIndex: number): void {
    if (macroIndex >= 0 && macroIndex < this.numMacros) {
      const macro = this.macros[macroIndex];
      if (macro && assignmentIndex >= 0 && assignmentIndex < macro.assignments.length) {
        macro.assignments.splice(assignmentIndex, 1);
      }
    }
  }

  /**
   * Get calculated parameter value
   */
  getParameterValue(parameterPath: string): number | null {
    // Find all assignments for this parameter
    let totalValue = 0;
    let hasAssignment = false;

    for (let i = 0; i < this.numMacros; i += 1) {
      const macro = this.macros[i];
      if (!macro) {
        continue;
      }

      const assignment = macro.assignments.find((a) => a.parameterPath === parameterPath);
      if (assignment) {
        hasAssignment = true;
        const macroValue = macro.value;
        let curvedValue: number;

        // Apply curve
        switch (assignment.curve) {
          case 'exponential':
            curvedValue = macroValue * macroValue;
            break;
          case 'logarithmic':
            curvedValue = Math.sqrt(macroValue);
            break;
          default:
            curvedValue = macroValue;
        }

        // Map to range
        const mappedValue =
          assignment.minValue + curvedValue * (assignment.maxValue - assignment.minValue);
        totalValue += mappedValue;
      }
    }

    return hasAssignment ? totalValue : null;
  }

  /**
   * Get macro configuration
   */
  getMacro(index: number): MacroConfig | undefined {
    if (index >= 0 && index < this.numMacros) {
      const macro = this.macros[index];
      if (!macro) {
        return undefined;
      }
      return { ...macro };
    }
    return undefined;
  }

  /**
   * Set macro name
   */
  setMacroName(index: number, name: string): void {
    if (index >= 0 && index < this.numMacros) {
      const macro = this.macros[index];
      if (macro) {
        macro.name = name;
      }
    }
  }

  /**
   * Get all macros
   */
  getAllMacros(): MacroConfig[] {
    return this.macros.map((m) => ({ ...m }));
  }

  /**
   * Reset all macros
   */
  reset(): void {
    this.macros.forEach((macro) => {
      macro.value = 0;
    });
  }
}

