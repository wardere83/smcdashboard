Local copies of the charting and PDF libraries used by this dashboard.

index.html loads each library from its usual source first and falls back to
these copies only if that source cannot be reached, so charts and "Save PDF"
keep working on networks that block outside script hosts.

- chart.umd.js            Chart.js 4.4.0 (MIT, see LICENSE-chartjs.md)
- html2pdf.bundle.min.js  html2pdf.js 0.10.1 (MIT, see LICENSE-html2pdf)
