# Santa Monica College EEO IBP Dashboard

Interactive project management dashboard for Santa Monica College's Equal Employment Opportunity Innovative Best Practices (IBP) grant (2026–2028). Static single-page site — no build step.

## Overview

- **Grant Details**: $150,000 award over 30 months (January 2026 – June 2028)
- **Four Core Activities**: Professional Development Interdepartmental Workshops/Trainings, Conference Participation, Mentorship Programs (10 mentor-mentee pairs), and five Employee Resource Groups (ERGs)
- **Budget**: FY 2026-27 ($74,925) and FY 2027-28 ($75,075) across object codes 1000/2000/3000/5000/7000, including the $7,143 administrative indirect allowance
- **SMC Branding**: Official Santa Monica College colors (SMC Blue #004C98, Light Blue #00A7E1, Yellow #F7CF3D, Cool Grey #646469), Poppins headlines + Arial body per the SMC web brand guide, and the official black &amp; white SMC wordmark

## Sections

- **Overview** — KPIs, fund-allocation and focus-area charts, project summary
- **Project Profile** — grant hero card, four core activities, workplan activities, institutional resources, program model
- **Goals & Objectives** — the four core activities with activities, measurable outcomes, and assessment plans (workplan Sections 2.1–2.3)
- **Program Outcomes** — measurable deliverables per activity
- **Budget Breakdown** — live Year 1 / Year 2 object-code cards + interactive Budget Modification Request form with video guide
- **Timeline** — 30-month implementation schedule with responsible persons (Section 2.4)
- **Contacts** — grant monitor and full SMC project team
- **Spend-Down Monitor** — year-by-year allocation vs. spend with underspend risk alerts
- **Forms** — Grant Modification Request, Budget Modification Request, and EEO IBP Grant Report (with video guide)

## Features

- Dark/light mode, six-language translation (EN/ES/VI/HY/KO/ZH), accessibility panel (font size, contrast, dyslexia font, reading guide)
- Chart.js visualizations, PDF export, autosaved forms (localStorage), live activity halo on form inputs
- Responsive layout — desktop, tablet, and mobile

## Development

```bash
npm install
npm test        # live-halo interaction primitive test suite
```

Serve locally with any static server, e.g. `python3 -m http.server`.

## Live Site

View the dashboard at: **https://wardere83.github.io/smcdashboard/**

## Data Source

All grant information sourced directly from the Santa Monica College EEO Innovative Best Practices application submitted July 31, 2025 for the 2026–2028 funding cycle.

## License

© 2026 Santa Monica College. All rights reserved.
