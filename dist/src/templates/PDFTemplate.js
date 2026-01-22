"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFTemplate = void 0;
class PDFTemplate {
    constructor(doc) {
        this.currentPage = 1;
        this.pageHeight = 750; // Usable page height
        this.pageWidth = 550; // Usable page width
        this.marginTop = 50;
        this.marginBottom = 50;
        this.marginLeft = 50;
        this.marginRight = 50;
        this.doc = doc;
    }
    /**
     * Add header to document
     */
    addHeader(title, subtitle) {
        // Company/Application Name
        this.doc
            .fontSize(10)
            .fillColor("#666666")
            .text("HRMS - Staff Management System", this.marginLeft, this.marginTop, {
            align: "left",
        });
        // Report Title
        this.doc
            .fontSize(20)
            .fillColor("#000000")
            .text(title, this.marginLeft, this.marginTop + 20, {
            align: "center",
        });
        // Subtitle (date range, etc.)
        if (subtitle) {
            this.doc
                .fontSize(12)
                .fillColor("#666666")
                .text(subtitle, this.marginLeft, this.marginTop + 45, {
                align: "center",
            });
        }
        // Horizontal line
        this.doc
            .strokeColor("#cccccc")
            .lineWidth(1)
            .moveTo(this.marginLeft, this.marginTop + 70)
            .lineTo(this.pageWidth + this.marginLeft, this.marginTop + 70)
            .stroke();
        // Move cursor down
        this.doc.y = this.marginTop + 80;
        return this;
    }
    /**
     * Add footer with page number and generation timestamp
     */
    addFooter() {
        const bottomY = this.doc.page.height - this.marginBottom;
        // Horizontal line
        this.doc
            .strokeColor("#cccccc")
            .lineWidth(1)
            .moveTo(this.marginLeft, bottomY - 20)
            .lineTo(this.pageWidth + this.marginLeft, bottomY - 20)
            .stroke();
        // Generation timestamp
        this.doc
            .fontSize(8)
            .fillColor("#666666")
            .text(`Generated on ${new Date().toLocaleString()}`, this.marginLeft, bottomY - 10, { align: "left" });
        // Page number
        this.doc
            .fontSize(8)
            .fillColor("#666666")
            .text(`Page ${this.currentPage}`, this.marginLeft, bottomY - 10, { align: "right" });
        return this;
    }
    /**
     * Add summary box with key metrics
     */
    addSummaryBox(summaryData) {
        const boxY = this.doc.y;
        const boxHeight = 80;
        const itemWidth = this.pageWidth / summaryData.length;
        // Draw background box
        this.doc
            .rect(this.marginLeft, boxY, this.pageWidth, boxHeight)
            .fillAndStroke("#f5f5f5", "#cccccc");
        // Add summary items
        summaryData.forEach((item, index) => {
            const x = this.marginLeft + index * itemWidth;
            // Label
            this.doc
                .fontSize(10)
                .fillColor("#666666")
                .text(item.label, x + 10, boxY + 20, {
                width: itemWidth - 20,
                align: "center",
            });
            // Value
            this.doc
                .fontSize(18)
                .fillColor("#000000")
                .text(String(item.value), x + 10, boxY + 40, {
                width: itemWidth - 20,
                align: "center",
            });
        });
        this.doc.y = boxY + boxHeight + 20;
        return this;
    }
    /**
     * Add section heading
     */
    addSectionHeading(heading) {
        this.doc
            .fontSize(14)
            .fillColor("#000000")
            .text(heading, this.marginLeft, this.doc.y + 10);
        this.doc.y += 25;
        return this;
    }
    /**
     * Add table with headers and rows
     */
    addTable(columns, rows, options = {}) {
        const { x = this.marginLeft, fontSize = 9, headerColor = "#4a5568", rowHeight = 25, } = options;
        let y = this.doc.y;
        // Calculate total width and column widths
        const totalWidth = this.pageWidth;
        const columnWidths = columns.map((col) => col.width ? (col.width * totalWidth) / 100 : totalWidth / columns.length);
        // Draw table header
        this.doc
            .rect(x, y, totalWidth, rowHeight)
            .fillAndStroke(headerColor, "#000000");
        // Header text
        let currentX = x;
        columns.forEach((col, i) => {
            this.doc
                .fontSize(fontSize)
                .fillColor("#ffffff")
                .text(col.header, currentX + 5, y + rowHeight / 2 - fontSize / 2, {
                width: columnWidths[i] - 10,
                align: col.align || "left",
            });
            currentX += columnWidths[i];
        });
        y += rowHeight;
        // Draw rows
        rows.forEach((row, rowIndex) => {
            // Check if we need a new page
            if (y + rowHeight > this.pageHeight + this.marginTop) {
                this.addPageBreak();
                y = this.doc.y;
                // Redraw header on new page
                this.doc
                    .rect(x, y, totalWidth, rowHeight)
                    .fillAndStroke(headerColor, "#000000");
                currentX = x;
                columns.forEach((col, i) => {
                    this.doc
                        .fontSize(fontSize)
                        .fillColor("#ffffff")
                        .text(col.header, currentX + 5, y + rowHeight / 2 - fontSize / 2, {
                        width: columnWidths[i] - 10,
                        align: col.align || "left",
                    });
                    currentX += columnWidths[i];
                });
                y += rowHeight;
            }
            // Alternate row colors
            const rowColor = rowIndex % 2 === 0 ? "#ffffff" : "#f7fafc";
            this.doc.rect(x, y, totalWidth, rowHeight).fill(rowColor);
            // Row border
            this.doc
                .strokeColor("#e2e8f0")
                .lineWidth(0.5)
                .moveTo(x, y)
                .lineTo(x + totalWidth, y)
                .stroke();
            // Row data
            currentX = x;
            row.forEach((cell, i) => {
                this.doc
                    .fontSize(fontSize)
                    .fillColor("#000000")
                    .text(String(cell || ""), currentX + 5, y + rowHeight / 2 - fontSize / 2, {
                    width: columnWidths[i] - 10,
                    align: columns[i].align || "left",
                    ellipsis: true,
                });
                currentX += columnWidths[i];
            });
            y += rowHeight;
        });
        // Final border
        this.doc
            .strokeColor("#e2e8f0")
            .lineWidth(0.5)
            .moveTo(x, y)
            .lineTo(x + totalWidth, y)
            .stroke();
        this.doc.y = y + 10;
        return this;
    }
    /**
     * Add key-value list
     */
    addKeyValueList(items) {
        items.forEach((item) => {
            this.doc
                .fontSize(10)
                .fillColor("#666666")
                .text(`${item.key}: `, this.marginLeft, this.doc.y, {
                continued: true,
            })
                .fillColor("#000000")
                .text(item.value);
            this.doc.y += 5;
        });
        this.doc.y += 10;
        return this;
    }
    /**
     * Add text paragraph
     */
    addParagraph(text, options = {}) {
        const { fontSize = 10, color = "#000000" } = options;
        this.doc
            .fontSize(fontSize)
            .fillColor(color)
            .text(text, this.marginLeft, this.doc.y, {
            width: this.pageWidth,
            align: "left",
        });
        this.doc.y += 15;
        return this;
    }
    /**
     * Add page break and footer/header
     */
    addPageBreak() {
        this.addFooter();
        this.doc.addPage();
        this.currentPage++;
        this.doc.y = this.marginTop + 20;
        return this;
    }
    /**
     * Finalize document
     */
    finalize() {
        this.addFooter();
        this.doc.end();
    }
    /**
     * Get current Y position
     */
    getY() {
        return this.doc.y;
    }
    /**
     * Set Y position
     */
    setY(y) {
        this.doc.y = y;
        return this;
    }
    /**
     * Check if we need a page break
     */
    needsPageBreak(requiredSpace) {
        return this.doc.y + requiredSpace > this.pageHeight + this.marginTop;
    }
}
exports.PDFTemplate = PDFTemplate;
