// Import the function to test
import fibonacci from "../srcs/fibonacci";

// Test cases
describe("Fibonacci", () => {
    it("should return 0 for input 0", () => {
        expect(fibonacci(0)).toBe(0);
    });

    it("should return 1 for input 1", () => {
        expect(fibonacci(1)).toBe(1);
    });

    it("should return the correct Fibonacci number for positive inputs", () => {
        expect(fibonacci(2)).toBe(1);
        expect(fibonacci(3)).toBe(2);
        expect(fibonacci(4)).toBe(3);
        expect(fibonacci(5)).toBe(5);
        expect(fibonacci(6)).toBe(8);
    });
});
