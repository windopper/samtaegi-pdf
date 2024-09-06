import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export class PDFReader {
    constructor() {
        this.data = [];
        this.genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        this.model = this.genai.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
        this.fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY)
    }

    async uploadFile(filePath, fileName) {
        const result = await this.fileManager.uploadFile(filePath, {
            mimeType: "application/pdf",
            displayName: fileName
        })
        this.fileUri = result.file.uri;
        this.fileMimeType = result.file.mimeType;
    }

    async* generateSummaryStream() {
        const result = await this.model.generateContentStream([{
            "fileData": {
                fileUri: this.fileUri,
                mimeType: this.fileMimeType
            }
        }, {
            "text": "\ 먼저 논문의 초록을 작성하시오. 작성 시에 해당 내용의 제목 없이 초록 내용만 작성하시오. 5줄 이내로 작성하시오. \
            논문을 순서대로 보면서 소제목 및 내용을 정리하시오. 소제목은 온전히 작성하되 h2으로 작성하시오. 세부 제목은 h3로 작성하시오. \
            내용은 가독성있게 정리하여 순서없는 목록으로 작성하시오. \
            Do not consider references, footnotes, and acknowledgments. \
            Response as markdown format and Korean language."
        }])

        for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            process.stdout.write(chunkText)
            yield chunkText
        }
    }
}