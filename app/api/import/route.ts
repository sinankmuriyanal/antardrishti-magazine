import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";

const execFileAsync = promisify(execFile);

const SECTION_OFFSETS: Record<number, number> = { 1: 1, 2: 3, 3: 4, 4: 3, 5: 3, 6: 4 };

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Save uploaded docx
    const bytes = await file.arrayBuffer();
    const uploadDir = join(process.cwd(), "..", "tmp-import");
    await mkdir(uploadDir, { recursive: true });
    const docxPath = join(uploadDir, "upload.docx");
    await writeFile(docxPath, Buffer.from(bytes));

    // Run Python extraction
    const scriptPath = join(process.cwd(), "scripts", "extract_docx.py");
    const extractedDir = join(process.cwd(), "extracted");
    await mkdir(extractedDir, { recursive: true });

    try {
      await execFileAsync("python", [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env, DOCX_PATH: docxPath },
        timeout: 120_000,
      });
    } catch {
      // Python might not be available — return friendly error
      return NextResponse.json({ error: "Python not available on server. Run scripts manually instead." }, { status: 422 });
    }

    const jsonPath = join(extractedDir, "articles.json");
    const raw = await readFile(jsonPath, "utf8");
    const articles = JSON.parse(raw);

    return NextResponse.json({ articles: articles.map((a: Record<string, unknown>) => ({
      displayId: a.displayId,
      title: a.title,
      sectionNumber: a.sectionNumber,
      authorName: a.authorName,
      excerpt: a.excerpt,
    })) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
