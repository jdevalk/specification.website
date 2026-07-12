---
title: "Captions and transcripts"
slug: captions-and-transcripts
category: accessibility
summary: "Video needs synchronised captions, audio-only content needs a transcript, and visuals that carry meaning need audio description. Auto-captions alone are not enough."
status: required
order: 135
appliesTo: [all]
relatedSlugs: [image-alt-text, semantic-html, reduced-motion]
updated: "2026-05-29T10:57:27.000Z"
sources:
  - title: "WCAG 1.2.2 — Captions (Prerecorded) Level A"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html"
    publisher: "W3C"
  - title: "WCAG 1.2.3 — Audio Description or Media Alternative (Prerecorded) Level A"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html"
    publisher: "W3C"
  - title: "WCAG 1.2.1 — Audio-only and Video-only (Prerecorded) Level A"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html"
    publisher: "W3C"
  - title: "MDN — <track>: The Embed Text Track element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track"
    publisher: "MDN"
  - title: "WP Accessibility — Accessible media"
    url: "https://wpaccessibility.org/"
    publisher: "WP Accessibility"
  - title: "Media Accessibility User Requirements"
    url: "https://www.w3.org/TR/media-accessibility-reqs/"
    publisher: "W3C"
---

## What it is

Any time-based media a page plays — a video, a podcast episode, a recorded talk — must come with a text alternative that conveys the same information. In practice this means three things:

- **Captions** for video with sound (WCAG 1.2.2, Level A).
- **A transcript** for audio-only content such as podcasts (WCAG 1.2.1, Level A).
- **Audio description** — or a full text alternative — when the visuals carry meaning the soundtrack does not (WCAG 1.2.3, Level A).

Captions are not the same as subtitles. Subtitles translate dialogue for hearing viewers. Captions are written for deaf and hard-of-hearing viewers and include speaker identification, laughter, music cues, and other non-speech sound.

## Why it matters

Without captions and transcripts, a video or podcast simply does not exist for a large part of the audience. Deaf and hard-of-hearing users need captions. Blind users need either a soundtrack that already describes the visuals, or a separate audio description track. People in noisy or quiet environments, second-language speakers, and search engines all benefit from the same text layer.

WCAG 1.2.1, 1.2.2, and 1.2.3 are all Level A — the minimum legal accessibility bar in most jurisdictions, including the European Accessibility Act and the US Section 508.

## How to implement

For self-hosted video, attach a WebVTT caption file using the HTML5 `<track>` element with `kind="captions"`:

```html
<video controls>
  <source src="/media/intro.mp4" type="video/mp4" />
  <track
    kind="captions"
    src="/media/intro.en.vtt"
    srclang="en"
    label="English"
    default
  />
  <track
    kind="descriptions"
    src="/media/intro.en.desc.vtt"
    srclang="en"
    label="English audio description"
  />
</video>
```

A WebVTT file is a plain `.vtt` text file starting with `WEBVTT`, followed by cue blocks:

```
WEBVTT

00:00:01.000 --> 00:00:04.500
[upbeat music]

00:00:04.600 --> 00:00:07.000
ANNA: Welcome to the show.
```

For audio-only content, publish a full transcript on the same page as the player — not behind a download link.

If visuals carry meaning the dialogue does not (an unspoken demo, a chart, an on-screen face), either record a version with descriptive narration baked in, add a `kind="descriptions"` track, or provide a media alternative in text.

For embedded video on YouTube or Vimeo, the responsibility still sits with you as the publisher: upload a corrected caption file, do not rely on auto-captions.

**Open captions** are burned into the video frame and always visible. **Closed captions** can be toggled. Closed is preferred — users can resize, restyle, and translate them.

## Common mistakes

- Shipping YouTube auto-captions unedited. They miss punctuation, mishear names, and are not WCAG-compliant.
- Treating subtitles as captions: dialogue only, no speaker labels, no sound effects.
- Putting the transcript on a separate page that is hard to find.
- Forgetting audio description on tutorial or demo videos where the screen carries the message.
- Setting `kind="subtitles"` when you mean `kind="captions"`.

## Verification

- Play the video with the sound off. Can you follow it from the captions alone?
- Play it with the screen off. Can you follow it from the soundtrack alone? If not, you need audio description.
- Validate the `.vtt` file at a WebVTT validator and confirm cues sync within 100 ms of speech.
- Run an automated accessibility scan (axe, Lighthouse) and confirm media elements have a `<track>` child.
- Test with a screen reader on the player page and confirm the transcript is reachable in the reading order.
