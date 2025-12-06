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
    public static IsTrue(condition: boolean, message: string, ...args: any[]): void {
        if (!condition) {
            AssertUtils.Fail(message, ...args);
        }
    }

    // Throws DevException if condition is true
    public static IsFalse(condition: boolean, message: string, ...args: any[]): void {
        if (condition) {
            AssertUtils.Fail(message, ...args);
        }
    }

    // single generic Fail method: if called without a generic, T defaults to never (method returns never)
    public static Fail<T = never>(message: string, ...args: any[]): T {
        const formatted = AssertUtils.format(message, ...args);
        throw new DevException(formatted);
    }

    public static IsNotNull(obj: any, message: string, ...args: any[]): void {
        AssertUtils.IsTrue(obj != null, message, ...args);
    }

    public static IsNotNullOrWhiteSpace(obj: string | null | undefined, message: string, ...args: any[]): void {
        AssertUtils.IsTrue(obj != null && obj.toString().trim().length > 0, message, ...args);
    }

    public static IncorrectEnumValue(typeName: string, value: any): void {
        AssertUtils.Fail(`Incorrect enum ${typeName} value ${value}`);
    }

    public static IsNull(obj: any, message: string, ...args: any[]): void {
        AssertUtils.IsTrue(obj == null, message, ...args);
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
