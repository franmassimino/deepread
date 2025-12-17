# 📘 Deepread

Deepread is a personal project focused on reading and studying complex books with the help of AI.

The goal is simple: **make digital reading more active, intentional, and useful for understanding** — not just for finishing pages.

<img width="1916" height="938" alt="image" src="https://github.com/user-attachments/assets/cb1ff5a8-9472-4db1-9dd4-6a2586951204" />

---

## ✨ What Deepread does

- Upload and read PDF books
- Automatically detect chapters
- Navigate books by chapter (page ranges)
- Ask questions about the book using AI
- Highlight text and add notes while reading
- Generate explanations or summaries on demand

**The AI always works on the book's content, not generic knowledge.**

---

## 🧠 Core idea

**Reading ≠ understanding.**

Deepread treats reading as a thinking process, where:

- you ask questions
- clarify doubts
- write notes
- check your understanding

**AI is used as an assistant, not as a replacement for thinking.**

---

## 🧱 Technical approach (high level)

- Books are uploaded as PDFs
- Text is extracted and parsed for AI usage
- Chapters are detected as page ranges
- The PDF is shown as-is in a viewer
- AI features use the parsed text + chapter context

This keeps the reading experience familiar while enabling contextual AI.

---

## 🚧 Project status

This is an early MVP / experimental project:

- single-user
- desktop-focused
- not optimized for scale
- features are intentionally limited

---

## 📌 Why this project

Deepread is a learning and exploration project to practice:

- product thinking
- UX decisions
- AI workflows
- trade-offs between simplicity and power

---

## 🔮 Possible next steps

- Improve chapter detection
- Add review / study modes
- Better highlight and note organization
- Optional HTML-based study view

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (React 19)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **TypeScript**: Full type safety

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/franmassimino/deepread.git
cd deepread
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

---

## 📝 License

This project is open source and available under the MIT License.
