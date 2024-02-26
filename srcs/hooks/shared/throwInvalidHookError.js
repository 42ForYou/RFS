const throwInvalidHookError = () => {
    throw new Error("Invalid hook Call. Hooks can only be called inside of the body of a function component.");
};

export default throwInvalidHookError;
