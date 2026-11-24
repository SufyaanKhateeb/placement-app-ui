export function userSignInDestination(search: string) {
    const from = new URLSearchParams(search).get("from");
    if (from && /^\/(?:forms(?:\/\d+)?|protected)$/.test(from)) return from;
    return "/forms";
}
