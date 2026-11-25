export function userSignInDestination(search: string) {
    const from = new URLSearchParams(search).get("from");
    if (from && /^\/(?:forms(?:\/\d+)?|protected|admin\/invitation)$/.test(from)) return from;
    return "/forms";
}
