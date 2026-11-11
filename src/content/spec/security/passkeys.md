---
title: "Passkeys (WebAuthn)"
slug: passkeys
category: security
summary: "Offer passkeys as the primary sign-in: discoverable WebAuthn credentials that are phishing-resistant by construction, with Conditional UI autofill and server-side verification via a vetted FIDO2 library."
status: recommended
order: 98
appliesTo: [all]
relatedSlugs: [accessible-authentication, webauthn, cookie-attributes]
updated: "2026-11-11T00:00:00.000Z"
sources:
  - title: "Web Authentication: An API for accessing Public Key Credentials — Level 3"
    url: "https://www.w3.org/TR/webauthn-3/"
    publisher: "W3C"
  - title: "Passkeys — FIDO Alliance"
    url: "https://fidoalliance.org/passkeys/"
    publisher: "FIDO Alliance"
  - title: "MDN — Web Authentication API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API"
    publisher: "MDN"
---

## What it is

A passkey is a discoverable credential from the Web Authentication API (WebAuthn), the W3C standard developed with the FIDO Alliance. The authenticator — a phone, a platform keystore such as iCloud Keychain or Windows Hello, or a hardware key — holds a private key per site. Signing in is a challenge–response: the server sends a random challenge, the authenticator signs it after a local user check (biometric or PIN), and the server verifies the signature against the stored public key. No shared secret ever leaves the device, and the credential is bound to the site's Relying Party ID, so a lookalike domain cannot replay it. That binding is what makes passkeys phishing-resistant by construction rather than by user vigilance.

Two misconceptions to clear first. Passkeys are not a Google or Apple feature: they are an open standard, and the credential providers include every major platform and password manager. And the AAGUID an authenticator presents identifies the authenticator *model* — it is a hint for naming an entry in the user's credential list, never a security input to trust or reject.

## Why it matters

Passwords fail in bulk: they are phished, credential-stuffed, and reused. One-time codes raise the bar but remain phishable in real time and are the [accessible authentication](/spec/accessibility/accessible-authentication/) burden WCAG warns about — a code is something you must transcribe under time pressure. A passkey removes the shared secret entirely, signs in with the unlock gesture the user already performs on their device, and syncs through their credential provider so it survives a lost phone. For the site, the win is as much operational as cryptographic: no password database to breach, no reset flow to abuse.

## How to implement

- **Verify on the server, with a library.** Generate the challenge server-side and keep it in the session. Verify attestation and assertion responses with a vetted FIDO2 library (SimpleWebAuthn, py_webauthn, Yubico's, go-webauthn); call the native `navigator.credentials` APIs directly in the browser, but never hand-roll the cryptography or trust a verification result computed client-side.
- **Store the credential record.** Credential ID and public key (Base64URL), transports, device type, backup state, AAGUID (for display naming), and the signature counter.
- **Register discoverable credentials.** `residentKey: "required"` so the credential can be found without the user typing a username first. Pass `excludeCredentials` with the user's existing credential IDs so the same authenticator is not registered twice.
- **Set the RP ID explicitly, and as narrowly as the deployment allows.** The RP ID must be the host itself (for example `login.example.com`) or a registrable suffix of it (`example.com`); both are valid. The exact host scopes the credential to that host; the registrable domain shares it across subdomains, so choose the latter only when subdomains genuinely share sign-in. Configure it server-side; never derive it from `window.location.hostname` at runtime, which hands each subdomain a different RP ID and breaks the moment related origins enter the picture. Sites that span related origins authorise them through [/.well-known/webauthn](/spec/well-known/webauthn/).
- **Offer Conditional UI sign-in.** Annotate the username field `autocomplete="username webauthn"` and start a `mediation: "conditional"` request, so the browser offers the passkey in the autofill UI. Keep a sign-in button that starts a discoverable request with an empty `allowCredentials` list as the explicit path.
- **Create passkeys at the moment of success.** Right after a fully successful password sign-in — all factors, not after a magic link or federation alone — silently offer creation via conditional create, and detect support with `getClientCapabilities()` rather than user-agent checks.
- **Step up with a populated list.** Re-authentication before a sensitive action must pass `allowCredentials` containing only the signed-in user's credential IDs.
- **Keep credential managers in sync.** Use the WebAuthn Signal API — `signalAllAcceptedCredentials`, `signalCurrentUserDetails`, `signalUnknownCredential` — when credentials are deleted, renamed, or rejected server-side, and answer an unknown credential ID at sign-in with a 404 so the provider can signal it away.
- **Keep the fallback honest.** Passwords (and recovery) remain necessary while users transition; a passkey rollout that strands users without their enrolled device is a lockout machine.

## Common mistakes

- Getting the RP ID wrong in either direction: widening it to the registrable domain when sign-in lives on a single host, which puts every subdomain inside the credential's scope for no benefit; or deriving it per-host at runtime, so sibling subdomains end up with inconsistent RP IDs and credentials that appear and disappear by hostname.
- Treating the AAGUID as proof of a trustworthy authenticator and allowing or denying sign-in based on it.
- An empty `allowCredentials` on a step-up check: that turns re-authentication into a discoverable sign-in that any passkey on the device can satisfy.
- Trusting the `userVerification` level echoed back by the client instead of comparing against the level the server requested and stored in the session.
- Asking for a passkey before the password sign-in has fully succeeded — conditional create after a partial or federated-only login enrols whoever completed that weaker flow.

## Verification

- Register and sign in on two different platforms (for example a platform authenticator and a synced password manager), including the cross-device QR flow.
- Sign in through the autofill UI alone (Conditional UI), without pressing a dedicated passkey button.
- Delete the credential on the server and confirm the entry disappears or is flagged in the user's credential manager after the signal.
- Repeat sign-in on a subdomain that shares the RP ID, and confirm a credential created for the RP ID is not offered on an unrelated origin.
