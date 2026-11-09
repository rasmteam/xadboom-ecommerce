import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseDimensions } from "./assets.module";

function sheet(rows: unknown[][]) {
  const ws = new ExcelJS.Workbook().addWorksheet("t");
  rows.forEach((r) => ws.addRow(r));
  return ws;
}

describe("parseDimensions", () => {
  it("reads a header row with values underneath", () => {
    const { dims } = parseDimensions(sheet([["Length / Depth (mm)", "Width (mm)", "Height (mm)", "Net weight (kg)"], [600, 500, 830, 18.4]]));
    expect(dims).toEqual({ lengthMm: 600, widthMm: 500, heightMm: 830, weightKg: 18.4 });
  });

  it("reads label / value rows and units written as text", () => {
    const { dims } = parseDimensions(sheet([["Spec"], ["Height / Seat Rake", "830 mm"], ["Width", "500"], ["Depth", "1,200"], ["Gross weight", "40.5 kg"]]));
    expect(dims).toEqual({ heightMm: 830, widthMm: 500, lengthMm: 1200, weightKg: 40.5 });
  });

  it("returns nothing for an unrelated sheet", () => {
    expect(parseDimensions(sheet([["Name", "Colour"], ["Chair", "Green"]])).dims).toEqual({});
  });

  it("flags values that look like metres or centimetres (too small for millimetres)", () => {
    const { notes } = parseDimensions(sheet([["Length", "Width", "Height"], [6, 5, 8.3]]));
    expect(notes.length).toBe(3);
  });
});
