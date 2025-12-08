// ...existing code...

export class DevException extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'DevException';
        // Set the prototype explicitly for transpiled ES5 compatibility
        Object.setPrototypeOf(this, DevException.prototype);
    }
}

export class AssertUtils {
    // Throws DevException if condition is false
    public static isTrue(condition: boolean, message: string, ...args: any[]): void {
        if (!condition) {
            AssertUtils.fail(message, ...args);
        }
    }

    // Throws DevException if condition is true
    public static IsFalse(condition: boolean, message: string, ...args: any[]): void {
        if (condition) {
            AssertUtils.fail(message, ...args);
        }
    }

    // single generic Fail method: if called without a generic, T defaults to never (method returns never)
    public static fail<T = never>(message: string, ...args: any[]): T {
        const formatted = AssertUtils.format(message, ...args);
        throw new DevException(formatted);
    }

    public static isNotNull(obj: any, message: string, ...args: any[]): void {
        AssertUtils.isTrue(obj != null, message, ...args);
    }

    public static isNotNullOrWhiteSpace(obj: string | null | undefined, message: string, ...args: any[]): void {
        AssertUtils.isTrue(obj != null && obj.toString().trim().length > 0, message, ...args);
    }

    public static incorrectEnumValue(typeName: string, value: any): void {
        AssertUtils.fail(`Incorrect enum ${typeName} value ${value}`);
    }

    public static isNull(obj: any, message: string, ...args: any[]): void {
        AssertUtils.isTrue(obj == null, message, ...args);
    }

    private static format(message: string, ...args: any[]): string {
        if (!message) return '';
        if (!args || args.length === 0) return message;
        return message.replace(/{(\d+)}/g, (match, index) => {
            const i = parseInt(index, 10);
            return typeof args[i] !== 'undefined' ? String(args[i]) : match;
        });
    }
}

// ...existing code...
