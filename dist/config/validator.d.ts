import { ChangedAreasConfig, ValidationResult } from '../types';
export declare class ConfigValidator {
    private config;
    private errors;
    private warnings;
    constructor(config: ChangedAreasConfig);
    validate(): ValidationResult;
    private validateSchema;
    private validateArea;
    private validateLogic;
    private validatePatterns;
    private validatePattern;
    private addError;
    private addWarning;
}
//# sourceMappingURL=validator.d.ts.map