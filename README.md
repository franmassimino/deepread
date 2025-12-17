# DeepRead

A modern PDF book reader and management application built with Next.js, featuring an intuitive reading interface with resizable panels and a beautiful upload experience.

## Features

- **PDF Upload**: Drag-and-drop PDF upload with animated progress feedback
- **Reading Interface**: Split-panel view with resizable book and toolbar sections
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Optimized for desktop and tablet reading experiences
- **Book Management**: Organize and access your PDF library

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (React 19)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Resizable Panels**: [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- **TypeScript**: Full type safety

## Getting Started

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

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
deepread/
├── app/              # Next.js app directory
│   ├── book/         # Book reading page
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   └── upload-pdf-dialog.tsx
├── hooks/            # Custom React hooks
└── lib/              # Utility functions
```

## Features in Detail

### PDF Upload Dialog

The upload dialog provides a smooth user experience with:
- Drag-and-drop file upload
- File type validation (PDF only)
- Multi-step progress animation
- Visual feedback for each processing stage

### Reading Interface

The reading page includes:
- Resizable split panels for content and toolbar
- Collapsible toolbar for focused reading
- Book information sidebar
- Responsive layout

## Development

### Code Style

This project uses ESLint for code quality:

```bash
npm run lint
```

### Adding New Components

We use shadcn/ui for components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
