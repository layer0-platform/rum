/**
 * Initializes an instance of the given type on first access.
 */
export class Lazy<T> {
    private instance: T | undefined = undefined;

    constructor(private initializer: () => T) {
        this.initializer = initializer;
    }

    public get value(): T {
        if (this.instance === undefined) {
            this.instance = this.initializer();
        }

        return this.instance;
    }
}