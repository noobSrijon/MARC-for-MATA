# Design System Specification: The Memphis Kinetic Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Soulful Navigator"**

Public transit is often viewed through a lens of sterile utility. This design system rejects that. It treats the city of Memphis not as a map to be solved, but as a rhythm to be felt. By combining **High-End Editorial Typography** with **Organic Layering**, we create an experience that feels as much like a premium lifestyle magazine as it does a utility app.

To move beyond the "template" look, we utilize **Intentional Asymmetry**. Instead of perfectly centered grids, we lean into heavy left-aligned typography and overlapping surface elements that mimic the syncopated rhythm of jazz. This system isn't just about getting from point A to B; it's about the energy of the journey.

---

## 2. Colors & Tonal Depth
Our palette bridges the gap between the deep blues of the Mississippi and the neon glow of Beale Street.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited.** To define sections, use background shifts. For example, a `surface-container-low` section should sit directly against a `surface` background. If you feel the need for a line, you haven't used your surface tokens effectively.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following hierarchy to create depth without clutter:
*   **Base Layer:** `surface` (#f6f6f9)
*   **Secondary Content Areas:** `surface-container-low` (#f0f0f3)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) for maximum "lift."
*   **Persistent Navigation:** `surface-container-highest` (#dbdde0) to ground the experience.

### The Glass & Gradient Rule
*   **Signature Textures:** For main CTAs and Hero sections, use a linear gradient: `primary` (#0959b6) to `primary_container` (#6aa0ff) at a 135° angle. This adds "soul" and depth.
*   **Glassmorphism:** Floating action buttons (FABs) or top navigation bars should use `surface` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography
We utilize a pairing of **Plus Jakarta Sans** for expressive display and **Inter** for high-utility data.

*   **Display (Plus Jakarta Sans):** Bold and rhythmic. Use `display-lg` (3.5rem) for arrival times and `headline-md` (1.75rem) for destination names. The tight letter-spacing gives it a "poster" feel.
*   **Body (Inter):** The workhorse. Use `body-lg` (1rem) for all general information. It provides a sturdy, legible contrast to the energetic display faces.
*   **Labels (Inter):** Small but mighty. Use `label-md` (0.75rem) in All Caps for transit mode metadata (e.g., "BUS • ROUTE 42").

---

## 4. Elevation & Depth
In this system, elevation is a feeling, not a drop shadow.

*   **The Layering Principle:** Rather than shadows, stack `surface-container-lowest` on top of `surface-container-low`. The 1.5% shift in hex value provides a sophisticated, "quiet" elevation.
*   **Ambient Shadows:** Where floating elements (like Map Markers) are required, use a shadow color of `on_surface` (#2d2f31) at **6% opacity**, with a Blur of `24px` and a Y-offset of `8px`. No hard edges.
*   **The Ghost Border Fallback:** If a container sits on a background of the same color, use `outline_variant` (#acadaf) at **15% opacity**. This creates a "whisper" of a boundary.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `primary_container`), `xl` (1.5rem) rounded corners. Text is `on_primary`. 
*   **Secondary:** `secondary_container` (#ffc965) background with `on_secondary_container` (#5f4200) text. This is your "Soul" button—use it for high-energy actions like "Refill Balance."
*   **Tertiary:** Ghost style. No background, `primary` text, bold weight.

### Transit Cards & Lists
*   **The Divider Ban:** Never use a horizontal line to separate bus arrivals. Use **Vertical White Space**. Use `spacing.6` (1.5rem) between list items.
*   **Status Indicators:** Use `tertiary` (#ab2d00) for delays. It’s a sophisticated "vibrant orange" that alerts without panicking the user.

### Map Chips
*   **Active State:** `primary` background with `on_primary` text. `full` (9999px) roundedness.
*   **Inactive State:** `surface_container_high` (#e1e2e6) background with `on_surface_variant` (#5a5c5e).

### Live Trackers (Specialty Component)
Use a "Pulse" container. A `surface_container_lowest` card with a `secondary` (#785500) accent bar on the left edge (4px width). This creates a clear visual anchor for real-time data.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. Try a 24px left margin and a 16px right margin for headline groups to create a "pushed" editorial look.
*   **Do** use the `secondary` (Yellow/Gold) and `tertiary` (Orange) tokens as "flavor" highlights—icons, active states, or notification pips.
*   **Do** maximize the `xl` (1.5rem) corner radius for large containers to maintain a "friendly" Memphis vibe.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#2d2f31) to keep the contrast high but the feel "premium."
*   **Don't** use standard Material Design elevation levels (1dp, 2dp). Stick to the Tonal Layering defined in Section 4.
*   **Don't** center-align large blocks of text. The "Soulful Navigator" is always left-aligned, leaning into the forward motion of the journey.