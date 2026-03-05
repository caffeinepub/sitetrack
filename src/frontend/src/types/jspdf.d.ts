declare module "jspdf" {
  interface jsPDFOptions {
    orientation?: "portrait" | "landscape" | "p" | "l";
    unit?: string;
    format?: string | number[];
  }

  interface jsPDF {
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: object,
    ): jsPDF;
    setFontSize(size: number): jsPDF;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    setDrawColor(r: number, g?: number, b?: number): jsPDF;
    setLineWidth(width: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    addPage(): jsPDF;
    save(filename: string): void;
    output(type: string): string;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
    roundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      ry: number,
      style?: string,
    ): jsPDF;
    setPage(pageNumber: number): jsPDF;
    getNumberOfPages(): number;
    lastAutoTable: {
      finalY: number;
    };
    previousAutoTable: {
      finalY: number;
    };
  }

  const jsPDF: {
    new (options?: jsPDFOptions): jsPDF;
  };

  export default jsPDF;
}

declare module "jspdf-autotable" {
  import type jsPDF from "jspdf";

  interface AutoTableOptions {
    head?: Array<Array<string | object>>;
    body?: Array<Array<string | number | object>>;
    startY?: number;
    theme?: string;
    styles?: object;
    headStyles?: object;
    bodyStyles?: object;
    alternateRowStyles?: object;
    columnStyles?: object;
    margin?: object;
    tableWidth?: string | number;
    showHead?: string;
    showFoot?: string;
    tableLineWidth?: number;
    tableLineColor?: number | number[];
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
