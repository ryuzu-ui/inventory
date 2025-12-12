import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } from "docx";
import { saveAs } from "file-saver";

export function generateBorrowDoc(studentInfo, selectedItems, products) {
    const now = new Date();
    const controlNo = "CTL-" + now.getTime();

    const tableRows = selectedItems.map((item, idx) => {
        const product = products.find((p) => p.id === item.id);
        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph((idx + 1).toString())] }),
                new TableCell({ children: [new Paragraph(product.name)] }),
                new TableCell({ children: [new Paragraph(item.qty.toString())] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
            ],
        });
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({ children: [new TextRun("Borrow Form\n\n")] }),
                    new Paragraph({ children: [new TextRun(`Student Name: ${studentInfo.name}`)] }),
                    new Paragraph({ children: [new TextRun(`Laboratory No: ${studentInfo.labNo}`)] }),
                    new Paragraph({ children: [new TextRun(`Date & Time: ${now.toLocaleString()}`)] }),
                    new Paragraph({ children: [new TextRun(`Control No: ${controlNo}\n\n`)] }),
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("No.")] }),
                                    new TableCell({ children: [new Paragraph("Description (Item)")] }),
                                    new TableCell({ children: [new Paragraph("Released")] }),
                                    new TableCell({ children: [new Paragraph("Returned")] }),
                                    new TableCell({ children: [new Paragraph("Unreturned")] }),
                                    new TableCell({ children: [new Paragraph("Remarks")] }),
                                ],
                            }),
                            ...tableRows,
                        ],
                    }),
                ],
            },
        ],
    });

    Packer.toBlob(doc).then((blob) => {
        saveAs(blob, `BorrowForm_${studentInfo.name.replace(" ", "_")}.docx`);
    });
}
