# Placement App design

## Live reference

Inspected the signed-in [Linear Documents workspace](https://linear.app/placement-app/documents/activity) on November 24, 2026. Switched between Recent and My documents, then opened [Projects](https://linear.app/placement-app/projects/all) and returned to Documents.

- The navigation and workspace identity stayed in place. The content pane held its own title and actions, followed immediately by view controls.
- The Projects rows ran across the pane with short headers and aligned metadata. The list used the main surface directly.
- Documents used a centered empty state with one clear action. The empty state, title, and controls had different visual weight.
- Dark surfaces were close in tone. Muted text lowered the emphasis on metadata, and the active destination used a shallow fill. Accent color appeared sparingly.

The browser inspection established which regions persisted across desktop views. Animation curves and timings were unmeasured.

## Placement App visual system

Use a compact 192px navigation rail on authenticated desktop views, with the workspace brand at the top and account and theme controls at the bottom. The content pane sits next to it with an 8px inset on the outer edges. The public layout and mobile workspace use a top bar. The mobile navigation opens in a shadcn Sheet.

Placement App uses warm graphite, amber, and off-white. The values below are app design choices. The HSL custom properties live in `src/index.css`.

| Role | Light | Dark |
| --- | --- | --- |
| Workspace canvas | `38 23% 93%` | `33 10% 8%` |
| Main surface | `40 33% 98%` | `34 8% 12%` |
| Raised surface | `0 0% 100%` | `34 8% 15%` |
| Primary action | `32 86% 32%` | `37 85% 65%` |
| Selected background | `36 32% 89%` | `35 13% 20%` |
| Divider | `34 17% 86%` | `34 9% 21%` |

Use the system font stack and a 4px spacing base. Workspace headings are 18px, row text is 14px, and metadata is 12px. A list has a 56px title and action bar, a 40px scope and count strip, and rows at least 44px tall. Align metadata to a shared column grid. Keep the form title first. The mobile admin list prioritizes title and status.

Use shadcn Button, Badge, Empty, Alert, and Sheet where appropriate. Keep the primary action in the view it changes. Use semantic colors, visible focus indicators, and explicit text for draft and publication states. Keep form label and error text associated with its input.

## Motion

Use a 120ms ease-out opacity change from 85% to full opacity for route content and the editor/preview switch. The duration and curve are Placement App choices. The rail and app chrome stay still. Cancel an interrupted route transition and skip the entrance when reduced motion is requested.
