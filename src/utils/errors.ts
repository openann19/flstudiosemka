/**
 * Custom error classes for FL Studio Web DAW
 * Provides structured error handling with context and error codes
 */

/**
 * Base error class for all DAW errors
 */
export class DAWError extends Error {
  public readonly code: string;

  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Audio context related errors
 */
export class AudioContextError extends DAWError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUDIO_CONTEXT_ERROR', context);
  }
}

/**
 * Invalid parameter errors
 */
export class InvalidParameterError extends DAWError {
  constructor(
    parameterName: string,
    value: unknown,
    expected?: string,
    context?: Record<string, unknown>
  ) {
    const message = `Invalid parameter '${parameterName}': ${JSON.stringify(value)}${
      expected ? `. Expected: ${expected}` : ''
    }`;
    super(message, 'INVALID_PARAMETER', { parameterName, value, expected, ...context });
  }
}

/**
 * File loading errors
 */
export class FileLoadError extends DAWError {
  constructor(fileName: string, reason: string, context?: Record<string, unknown>) {
    super(`Failed to load file '${fileName}': ${reason}`, 'FILE_LOAD_ERROR', {
      fileName,
      reason,
      ...context,
    });
  }
}

/**
 * State errors (invalid state transitions, etc.)
 */
export class StateError extends DAWError {
  constructor(message: string, currentState?: string, expectedState?: string) {
    super(message, 'STATE_ERROR', { currentState, expectedState });
  }
}

/**
 * Audio processing errors
 */
export class AudioProcessingError extends DAWError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUDIO_PROCESSING_ERROR', context);
  }
}

/**
 * MIDI related errors
 */
export class MIDIError extends DAWError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'MIDI_ERROR', context);
  }
}

/**
 * Project export/import errors
 */
export class ProjectError extends DAWError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PROJECT_ERROR', context);
  }
}

/**
 * EQ-specific errors
 */
export class EQError extends DAWError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'EQ_ERROR', context);
  }
}

/**
 * Validation utility functions
 */
export class ValidationUtils {
  /**
   * Validates a frequency value (20Hz - 20kHz)
   * @param frequency - Frequency to validate
   * @param paramName - Parameter name for error message
   * @throws InvalidParameterError if frequency is out of range
   */
  static validateFrequency(frequency: number, paramName = 'frequency'): void {
    if (typeof frequency !== 'number' || Number.isNaN(frequency)) {
      throw new InvalidParameterError(paramName, frequency, 'number');
    }
    if (frequency < 20 || frequency > 20000) {
      throw new InvalidParameterError(
        paramName,
        frequency,
        'number between 20 and 20000',
        { min: 20, max: 20000 }
      );
    }
  }

  /**
   * Validates a gain value (0.0 - 1.0)
   * @param gain - Gain to validate
   * @param paramName - Parameter name for error message
   * @throws InvalidParameterError if gain is out of range
   */
  static validateGain(gain: number, paramName = 'gain'): void {
    if (typeof gain !== 'number' || Number.isNaN(gain)) {
      throw new InvalidParameterError(paramName, gain, 'number');
    }
    if (gain < 0 || gain > 1) {
      throw new InvalidParameterError(paramName, gain, 'number between 0 and 1', {
        min: 0,
        max: 1,
      });
    }
  }

  /**
   * Validates a time value (non-negative)
   * @param time - Time to validate
   * @param paramName - Parameter name for error message
   * @throws InvalidParameterError if time is invalid
   */
  static validateTime(time: number, paramName = 'time'): void {
    if (typeof time !== 'number' || Number.isNaN(time)) {
      throw new InvalidParameterError(paramName, time, 'number');
    }
    if (time < 0) {
      throw new InvalidParameterError(paramName, time, 'non-negative number');
    }
  }

  /**
   * Validates a BPM value (20 - 300)
   * @param bpm - BPM to validate
   * @param paramName - Parameter name for error message
   * @throws InvalidParameterError if BPM is out of range
   */
  static validateBPM(bpm: number, paramName = 'bpm'): void {
    if (typeof bpm !== 'number' || Number.isNaN(bpm)) {
      throw new InvalidParameterError(paramName, bpm, 'number');
    }
    if (bpm < 20 || bpm > 300) {
      throw new InvalidParameterError(paramName, bpm, 'number between 20 and 300', {
        min: 20,
        max: 300,
      });
    }
  }

  /**
   * Validates that a value is not null or undefined
   * @param value - Value to validate
   * @param paramName - Parameter name for error message
   * @throws InvalidParameterError if value is null or undefined
   */
  static validateNotNull<T>(value: T | null | undefined, paramName: string): asserts value is T {
    if (value === null || value === undefined) {
      throw new InvalidParameterError(paramName, value, 'non-null value');
    }
  }

  /**
   * Validates that a value is a string and not empty
   * @param value - Value to validate
   * @param paramName - Parameter name for error message
   * @throws InvalidParameterError if value is not a valid string
   */
  static validateString(value: unknown, paramName: string): asserts value is string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new InvalidParameterError(paramName, value, 'non-empty string');
    }
  }

  /**
   * Validates that a value is a number
   * @param value - Value to validate
   * @param paramName - Parameter name for error message
   * @throws InvalidParameterError if value is not a number
   */
  static validateNumber(value: unknown, paramName: string): asserts value is number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new InvalidParameterError(paramName, value, 'number');
    }
  }
}

