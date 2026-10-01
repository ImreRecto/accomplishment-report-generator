import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

/**
 * Generates a clean standard filename for the accomplishment report.
 * Example: Accomplishment_Report_IMRE_C_RECTO_APRIL_01-15_2026.docx
 */
export function getReportFileName(data) {
  const namePart = (data.employeeName || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  const datePart = (data.periodLabel || 'Period').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  return `Accomplishment_Report_${namePart}_${datePart}.docx`;
}

/**
 * Builds a docx Document buffer calibrated 1:1 against the official NAPWC template.
 * 
 * @param {Object} data
 * @param {string} data.employeeName
 * @param {string} data.periodLabel
 * @param {Array<{ subDateLabel: string, bullets: Array<{ text: string, subBullets?: string[] }> }>} data.entries
 * @param {Object} data.notedBy
 * @param {string} data.notedBy.approverName
 * @param {string} data.notedBy.approverTitle
 * @param {string} data.notedBy.approverOffice
 * @returns {Promise<Buffer>}
 */
export async function buildAccomplishmentReportBuffer(data) {
  const employeeName = (data.employeeName || '').trim().toUpperCase();
  const periodLabel = (data.periodLabel || '').trim().toUpperCase();
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const approverName = (data.notedBy?.approverName || '').trim().toUpperCase();
  const approverTitle = (data.notedBy?.approverTitle || '').trim();
  const approverOffice = (data.notedBy?.approverOffice || '').trim();

  // Load high-resolution assets extracted directly from the template
  const headerLogosPath = path.join(ASSETS_DIR, 'header_logos.png');
  const napwcBannerPath = path.join(ASSETS_DIR, 'napwc_banner.jpg');

  const headerLogosBuffer = fs.existsSync(headerLogosPath) ? fs.readFileSync(headerLogosPath) : null;
  const napwcBannerBuffer = fs.existsSync(napwcBannerPath) ? fs.readFileSync(napwcBannerPath) : null;

  // Header paragraph with exact dimensions matching template's header1.xml
  const headerRuns = [];
  if (headerLogosBuffer) {
    headerRuns.push(
      new ImageRun({
        data: headerLogosBuffer,
        type: 'png',
        transformation: { width: 73.3, height: 36.0 } // 931351 x 457200 EMU
      })
    );
    headerRuns.push(new TextRun({ text: '   ' }));
  }
  if (napwcBannerBuffer) {
    headerRuns.push(
      new ImageRun({
        data: napwcBannerBuffer,
        type: 'jpg',
        transformation: { width: 85.3, height: 32.4 } // 1082842 x 411480 EMU
      })
    );
  }

  const headerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: headerRuns.length > 0 ? headerRuns : [new TextRun({ text: 'NAPWC / DENR / BMB', bold: true, font: 'Arial' })]
  });

  // Title: ACCOMPLISHMENT REPORT FORM (exact sz=32 -> 16pt Arial Bold)
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 180 },
    children: [
      new TextRun({
        text: 'ACCOMPLISHMENT REPORT FORM',
        bold: true,
        font: 'Arial',
        size: 32 // 16pt
      })
    ]
  });

  // Table borders (0.5 pt solid black, matching template TableGrid)
  const gridBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: '000000'
  };

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'auto'
  };

  const tableRows = [];

  // Row 1: NAME (Arial, 12pt, bold label)
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          margins: { top: 70, bottom: 70, left: 120, right: 120 },
          borders: {
            top: gridBorder,
            bottom: gridBorder,
            left: gridBorder,
            right: gridBorder
          },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: 'NAME: ',
                  bold: true,
                  font: 'Arial',
                  size: 24 // 12pt
                })
              ]
            }),
            new Paragraph({
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: employeeName,
                  font: 'Arial',
                  size: 24, // 12pt
                  bold: true
                })
              ]
            })
          ]
        })
      ]
    })
  );

  // Row 2: DATE (Arial, 12pt)
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          margins: { top: 70, bottom: 70, left: 120, right: 120 },
          borders: {
            top: gridBorder,
            bottom: gridBorder,
            left: gridBorder,
            right: gridBorder
          },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: 'DATE: ',
                  bold: true,
                  font: 'Arial',
                  size: 24 // 12pt
                })
              ]
            }),
            new Paragraph({
              spacing: { before: 0, after: 20 },
              children: [
                new TextRun({
                  text: periodLabel,
                  font: 'Arial',
                  size: 24 // 12pt
                })
              ]
            })
          ]
        })
      ]
    })
  );

  // Row 3: ACCOMPLISHMENTS (exact template shading: A8D08D, sz=28 for title, sz=20 for subtitle)
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: 'A8D08D' }, // Exact hex from template XML
          margins: { top: 70, bottom: 70, left: 120, right: 120 },
          borders: {
            top: gridBorder,
            bottom: gridBorder,
            left: gridBorder,
            right: gridBorder
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 10 },
              children: [
                new TextRun({
                  text: 'ACCOMPLISHMENTS',
                  bold: true,
                  font: 'Arial',
                  size: 28 // 14pt
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: 'Task/s Performed',
                  font: 'Arial',
                  size: 20, // 10pt
                  bold: true
                })
              ]
            })
          ]
        })
      ]
    })
  );

  // Date Block Rows
  for (const entry of entries) {
    const blockParagraphs = [];

    // Date header (e.g. APRIL 01 or APRIL 06-10) - sz=24 (12pt) bold
    blockParagraphs.push(
      new Paragraph({
        spacing: { before: 80, after: 50 },
        children: [
          new TextRun({
            text: (entry.subDateLabel || '').toUpperCase(),
            bold: true,
            font: 'Arial',
            size: 24 // 12pt
          })
        ]
      })
    );

    // Bullets
    if (Array.isArray(entry.bullets)) {
      for (const bullet of entry.bullets) {
        if (!bullet || !bullet.text) continue;

        // Primary bullet (sz=24 / 12pt Arial)
        blockParagraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 30, after: 30 },
            children: [
              new TextRun({
                text: bullet.text,
                font: 'Arial',
                size: 24 // 12pt
              })
            ]
          })
        );

        // Sub-bullets (nested dash items)
        if (Array.isArray(bullet.subBullets)) {
          for (const sub of bullet.subBullets) {
            if (!sub || typeof sub !== 'string' || !sub.trim()) continue;
            blockParagraphs.push(
              new Paragraph({
                indent: { left: 720, hanging: 240 },
                spacing: { before: 15, after: 15 },
                children: [
                  new TextRun({
                    text: `-    ${sub.trim()}`,
                    font: 'Arial',
                    size: 24 // 12pt
                  })
                ]
              })
            );
          }
        }
      }
    }

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 80, bottom: 90, left: 140, right: 140 },
            borders: {
              top: gridBorder,
              bottom: gridBorder,
              left: gridBorder,
              right: gridBorder
            },
            children: blockParagraphs
          })
        ]
      })
    );
  }

  // Main table with exact template width 9990 dxa
  const mainTable = new Table({
    width: { size: 9990, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    rows: tableRows
  });

  // Table 2: Sign-Off Table (exact template structure: width 10065 dxa, borderless, 2 columns: 5075 & 4990)
  const signOffTable = new Table({
    width: { size: 10065, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder
    },
    rows: [
      // Row 1: "Noted By:" on the right column
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5075, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: []
              })
            ]
          }),
          new TableCell({
            width: { size: 4990, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 100, after: 20 },
                children: [
                  new TextRun({
                    text: 'Noted By:',
                    bold: true,
                    font: 'Arial',
                    size: 24 // 12pt
                  })
                ]
              })
            ]
          })
        ]
      }),

      // Row 2: Spacing for signatures
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5075, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 240, after: 0 },
                children: []
              })
            ]
          }),
          new TableCell({
            width: { size: 4990, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 240, after: 0 },
                children: []
              })
            ]
          })
        ]
      }),

      // Row 3: Signee names
      new TableRow({
        children: [
          // Left: Employee
          new TableCell({
            width: { size: 5075, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 20 },
                children: [
                  new TextRun({
                    text: employeeName,
                    bold: true,
                    font: 'Arial',
                    size: 24 // 12pt
                  })
                ]
              })
            ]
          }),
          // Right: Approver Head
          new TableCell({
            width: { size: 4990, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 20 },
                children: [
                  new TextRun({
                    text: approverName,
                    bold: true,
                    font: 'Arial',
                    size: 24 // 12pt
                  })
                ]
              })
            ]
          })
        ]
      }),

      // Row 4: Approver Title & Office
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5075, type: WidthType.DXA },
            children: [
              new Paragraph({ children: [] })
            ]
          }),
          new TableCell({
            width: { size: 4990, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 10 },
                children: [
                  new TextRun({
                    text: approverTitle,
                    font: 'Arial',
                    size: 24 // 12pt
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: approverOffice,
                    font: 'Arial',
                    size: 24 // 12pt
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,  // A4 width (exact template: w:w="11906")
              height: 16838  // A4 height (exact template: w:h="16838")
            },
            margin: {
              top: 1440,     // 1.0 inch (exact template: w:top="1440")
              bottom: 1418,  // ~0.98 inch (exact template: w:bottom="1418")
              left: 1440,    // 1.0 inch (exact template: w:left="1440")
              right: 1440,   // 1.0 inch (exact template: w:right="1440")
              header: 720,
              footer: 720
            }
          }
        },
        children: [
          headerParagraph,
          titleParagraph,
          mainTable,
          new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),
          signOffTable
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
