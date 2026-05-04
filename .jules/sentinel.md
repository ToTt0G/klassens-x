## 2024-05-04 - Denial of Service via unbounded inputs in Levenshtein Distance
**Vulnerability:** The application was vulnerable to DoS attacks because string inputs were unbounded, particularly in `convex/nicknames.ts` where `getOrCreate` performs an O(M * N) `levenshteinDistance` calculation on user-provided strings.
**Learning:** Even though Convex validates the *type* of input (e.g. `v.string()`), it doesn't limit the *length* by default. If string processing operations (like fuzzy matching) are performed on unbounded strings, it can easily exhaust server memory or CPU.
**Prevention:** Always add manual `.length` validation in Convex mutation handlers when accepting unbounded inputs, especially before passing them into computationally expensive algorithms or storing them.
